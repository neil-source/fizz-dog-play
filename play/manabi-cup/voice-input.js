(() => {
  "use strict";

  const captures = new WeakMap();
  const CONTROLLER = /dualsense|wireless controller|ps5|controller/i;

  function stopStream(stream) {
    stream?.getTracks?.().forEach(track => track.stop());
  }

  async function devices() {
    try { return await navigator.mediaDevices.enumerateDevices?.() || []; }
    catch { return []; }
  }

  function constraints(deviceId) {
    return {
      audio: {
        ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
        channelCount: 1
      },
      video: false
    };
  }

  async function open({ gain = 2.5 } = {}) {
    let found = await devices();
    let controller = found.find(device => device.kind === "audioinput" && CONTROLLER.test(device.label));
    let stream = null;
    if (controller?.deviceId) {
      try { stream = await navigator.mediaDevices.getUserMedia(constraints(controller.deviceId)); }
      catch { /* The controller may have been disconnected; try the default mic. */ }
    }
    if (!stream) stream = await navigator.mediaDevices.getUserMedia(constraints());
    found = await devices();
    controller = found.find(device => device.kind === "audioinput" && CONTROLLER.test(device.label));
    const rawTrack = stream.getAudioTracks()[0];
    if (!rawTrack) { stopStream(stream); throw new Error("No audio input track"); }
    const selectedId = rawTrack.getSettings?.().deviceId;
    if (controller?.deviceId && selectedId !== controller.deviceId && !CONTROLLER.test(rawTrack.label)) {
      try {
        const controllerStream = await navigator.mediaDevices.getUserMedia(constraints(controller.deviceId));
        stopStream(stream);
        stream = controllerStream;
      } catch { /* Keep the working default microphone. */ }
    }

    const selectedTrack = stream.getAudioTracks()[0];
    const controllerMic = controller && (
      selectedTrack.getSettings?.().deviceId === controller.deviceId || CONTROLLER.test(selectedTrack.label)
    ) ? controller : null;
    const capture = { stream, track: selectedTrack, controllerMic, devices: found, context: null, processed: null, analyser: null, timer: null };

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      let context = null;
      try {
        context = new AudioContextClass();
        const source = context.createMediaStreamSource(stream);
        const amplifier = context.createGain();
        const compressor = context.createDynamicsCompressor();
        const destination = context.createMediaStreamDestination();
        const analyser = context.createAnalyser();
        amplifier.gain.value = Math.max(1, Math.min(4, Number(gain) || 2.5));
        compressor.threshold.value = -18;
        compressor.knee.value = 12;
        compressor.ratio.value = 4;
        compressor.attack.value = .003;
        compressor.release.value = .18;
        analyser.fftSize = 1024;
        source.connect(amplifier);
        source.connect(analyser);
        amplifier.connect(compressor);
        compressor.connect(destination);
        await context.resume();
        capture.context = context;
        capture.processed = destination.stream;
        capture.analyser = analyser;
        capture.track = destination.stream.getAudioTracks()[0] || selectedTrack;
      } catch {
        context?.close?.().catch?.(() => {});
      }
    }
    captures.set(stream, capture);
    return capture;
  }

  function watchLevel(stream, callback) {
    const capture = captures.get(stream);
    if (!capture?.analyser || typeof callback !== "function") return false;
    const samples = new Float32Array(capture.analyser.fftSize);
    clearInterval(capture.timer);
    capture.timer = setInterval(() => {
      if (capture.stream.getAudioTracks()[0]?.muted) { callback(0, true); return; }
      capture.analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      for (const sample of samples) sum += sample * sample;
      callback(Math.min(1, Math.sqrt(sum / samples.length) * 12), false);
    }, 120);
    return true;
  }

  function close(stream) {
    const capture = captures.get(stream);
    if (capture) {
      clearInterval(capture.timer);
      stopStream(capture.processed);
      capture.context?.close?.().catch?.(() => {});
      captures.delete(stream);
    }
    stopStream(stream);
  }

  window.ManabiMicrophone = { open, watchLevel, close };
})();
