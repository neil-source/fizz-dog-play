(() => {
  "use strict";

  const KANJI = window.KANJI_DATA?.grades;
  const ENGLISH = window.KANJI_DATA?.english;
  const COMMON = window.KANJI_DATA?.common;
  const STROKE_COUNTS = window.KANJI_DATA?.strokeCounts;
  if (!KANJI || !ENGLISH || !COMMON || !STROKE_COUNTS) throw new Error("Kanji data failed to load");

  const LESSON_TOTAL = 10;
  const LEGACY_TESTS_KEY = "kanjiQuizTestsV2";
  const MASTERY_KEY = "kanjiQuizMeaningMasteryV3";
  const GOLD_KEY = "kanjiQuizGoldGroupsV2";
  const GROUP_REVIEW_KEY = "kanjiQuizGroupReviewV1";
  const SETTINGS_KEY = "kanjiQuizSettingsV1";
  const REVIEW_INTERVALS = [4, 8, 23, 47, 24 * 7, 24 * 14, 24 * 30].map(hours => hours * 60 * 60 * 1000);
  const gradeColors = { 1: "#ffd866", 2: "#ff9d78", 3: "#71d7ae", 4: "#75c7ec", 5: "#a9a1f5", 6: "#f198c8" };
  const $ = selector => document.querySelector(selector);
  const ui = {
    start: $("#startScreen"), quiz: $("#quizScreen"), result: $("#resultScreen"),
    sideGrades: $("#sideGrades"), gradeLabel: $("#gradeLabel"), levelLabel: $("#levelLabel"), count: $("#questionCount"),
    score: $("#scoreValue"), progress: $("#progressBar"), word: $("#word"), answers: $("#answers"), keyHint: $("#keyHint"),
    mascot: $("#kanjiMascot"), mascotSpeech: $("#mascotSpeech"),
    mascotTalk: $("#mascotTalkButton"), mascotMicStatus: $("#mascotMicStatus"),
    questionKicker: $("#questionKicker"), writeForm: $("#writeAnswerForm"), writeLabel: $("#writeAnswerLabel"),
    writeAnswer: $("#writeAnswer"), checkAnswer: $("#checkAnswerButton"),
    controllerKeyboard: $("#controllerKeyboard"),
    drawingAnswer: $("#drawingAnswer"), drawingCanvas: $("#drawingCanvas"), drawingLabel: $("#drawingLabel"), drawingGuide: $("#drawingGuide"),
    drawingRecognizer: $("#drawingRecognizerCanvas"),
    drawingControllerHint: $("#drawingControllerHint"), drawingControllerCopy: $("#drawingControllerCopy"),
    drawingControllerEnglish: $("#drawingControllerEnglish"), gamepadDrawingCursor: $("#gamepadDrawingCursor"),
    drawingL2Hint: $("#drawingL2Hint"), drawingR2Hint: $("#drawingR2Hint"), drawingCheckHint: $("#drawingCheckHint"),
    connectTouchpad: $("#connectTouchpadButton"), touchpadStatus: $("#touchpadStatus"),
    undoDrawing: $("#undoDrawingButton"), clearDrawing: $("#clearDrawingButton"), checkDrawing: $("#checkDrawingButton"),
    feedback: $("#feedback"), feedbackIcon: $("#feedbackIcon"), feedbackTitle: $("#feedbackTitle"),
    feedbackCopy: $("#feedbackCopy"), next: $("#nextButton"), back: $("#backButton"),
    finalScore: $("#finalScore"), resultTitle: $("#resultTitle"), resultGrade: $("#resultGrade"),
    resultMessage: $("#resultMessage"), resultBadge: $("#resultBadge"), resultTotal: $("#resultTotal"),
    best: $("#bestScore"), retry: $("#retryButton"), changeGrade: $("#changeGradeButton"), groupList: $("#groupList"),
    controllerNotice: $("#controllerNotice"), controllerNoticeTitle: $("#controllerNotice b"), controllerNoticeText: $("#controllerNoticeText"),
    help: $("#helpButton"), settings: $("#settingsButton"), fullscreen: $("#fullscreenButton"), privacy: $("#privacyButton"),
    helpDialog: $("#helpDialog"), settingsDialog: $("#settingsDialog"), announcer: $("#announcer"),
    largeText: $("#largeTextSetting"), contrast: $("#contrastSetting"), motion: $("#motionSetting"),
    answerLanguage: $("#answerLanguageSetting"), motionSensitivity: $("#motionSensitivitySetting"),
    motionSensitivityValue: $("#motionSensitivityValue"), touchpadSensitivity: $("#touchpadSensitivitySetting"),
    touchpadSensitivityValue: $("#touchpadSensitivityValue"), catVoice: $("#catVoiceSetting"),
    catVoiceVolume: $("#catVoiceVolumeSetting"), catVoiceVolumeValue: $("#catVoiceVolumeValue"),
    catVoiceStyle: $("#catVoiceStyleSetting"), previewCatVoice: $("#previewCatVoiceButton"),
    resetProgress: $("#resetProgressButton"), resetStatus: $("#resetStatus")
  };

  let selectedGrade = "1";
  let questions = [];
  let current = 0;
  let score = 0;
  let answered = false;
  let activeGroup = null;
  let activeGroupWasDue = false;
  let questionLevel = 1;
  let drawingStrokes = [];
  let activeStroke = null;
  let drawingLocked = false;
  let controllerConnected = false;
  let keyboardControllerMode = false;
  let controllerName = "PS5 コントローラー";
  let gamepadPenDown = false;
  let gamepadCursor = { x: 320, y: 320 };
  let touchpadStroke = null;
  let touchpadTouchId = null;
  let hidTouch = null;
  let hidL2Pressed = false;
  let hidR2Pressed = false;
  let gamepadR2Pressed = false;
  let hidTouchSeen = false;
  let hidMotionSeen = false;
  let hidMotion = { x: 0, y: 0, z: 0, lastAt: 0 };
  let hidSpeakerConfigured = false;
  let hidTouchpad = null;
  let hidInputListener = null;
  let lastDialogTrigger = null;
  let resetProgressArmed = false;
  let resetProgressTimer = 0;
  let groupRefreshTimer = 0;
  let mascotTimer = 0;
  let mascotPoseIndex = 0;
  let activeRecognition = null;
  let activeMicStream = null;
  let activeMascotAudio = null;
  let mascotVoiceGeneration = 0;
  let mascotVoiceMutedForDictation = false;
  let controllerSpeakerId = "";
  let controllerSpeakerLabel = "";
  let controllerSpeakerReady = false;
  let dictationAttempt = 0;
  let successReactionIndex = 0;
  let mistakeReactionIndex = 0;
  const gamepadButtonState = new Map();
  const drawingContext = ui.drawingCanvas.getContext("2d");
  const drawingGuideContext = ui.drawingGuide.getContext("2d");
  const MASCOT_POSES = [
    ["idle", "かんじカップねこが まばたきしている"],
    ["wave", "かんじカップねこが てを ふっている"],
    ["think", "かんじカップねこが かんがえている"],
    ["write", "かんじカップねこが ふでで かいている"],
    ["cheer", "かんじカップねこが おうえんしている"],
    ["clap", "かんじカップねこが はくしゅしている"],
    ["bounce", "かんじカップねこが とびはねている"],
    ["surprise", "かんじカップねこが びっくりしている"],
    ["sleepy", "かんじカップねこが あくびしている"],
    ["perfect", "かんじカップねこが ほしで おいわいしている"],
    ["nod", "かんじカップねこが うなずいている"],
    ["shake", "かんじカップねこが くびを よこに ふっている"],
    ["point", "かんじカップねこが みぎを さしている"],
    ["read", "かんじカップねこが ほんを よんでいる"],
    ["idea", "かんじカップねこが ひらめいている"],
    ["puzzled", "かんじカップねこが くびを かしげている"],
    ["laugh", "かんじカップねこが わらっている"],
    ["proud", "かんじカップねこが じしんを もっている"],
    ["encourage", "かんじカップねこが はげましている"],
    ["highfive", "かんじカップねこが ハイタッチしている"],
    ["stretch", "かんじカップねこが のびを している"],
    ["sip", "かんじカップねこが おちゃを のんでいる"],
    ["peek", "かんじカップねこが カップから のぞいている"],
    ["hide", "かんじカップねこが カップに かくれている"],
    ["dance", "かんじカップねこが おどっている"],
    ["spin", "かんじカップねこが ふでを まわしている"],
    ["march", "かんじカップねこが こうしんしている"],
    ["balance", "かんじカップねこが ふでを のせている"],
    ["paint", "かんじカップねこが そらに かいている"],
    ["erase", "かんじカップねこが けしている"],
    ["listen", "かんじカップねこが みみを すましている"],
    ["talk", "かんじカップねこが はなしている"],
    ["microphone", "かんじカップねこが マイクで はなしている"],
    ["heart", "かんじカップねこが ハートを つくっている"],
    ["worried", "かんじカップねこが しんぱいしている"],
    ["relieved", "かんじカップねこが ほっとしている"],
    ["determined", "かんじカップねこが やるきに なっている"],
    ["sleepybob", "かんじカップねこが うとうとしている"],
    ["confetti", "かんじカップねこが かみふぶきで おいわいしている"],
    ["rainbow", "かんじカップねこが にじで おいわいしている"]
  ];
  const MASCOT_QUESTION_SPEECH = [
    "Nice! You've got this!",
    "You're doing great!",
    "Keep going!",
    "You're good at this!",
    "Take your time!",
    "You can do it!",
    "Great focus!",
    "Keep it up!",
    "Believe in yourself!",
    "Let's do this!"
  ];
  const MASCOT_SUCCESS_RESPONSES = [
    "Nice!", "Great job!", "You're doing great!", "Keep it up!", "Awesome!",
    "Well done!", "Super!", "You got it!", "Brilliant!", "Fantastic!",
    "Excellent!", "Good thinking!", "Way to go!", "Keep going!", "Wonderful!",
    "Strong work!", "That's right!", "You're learning fast!", "High five!", "Purr-fect!"
  ];
  const MASCOT_MISTAKE_RESPONSES = [
    "One more time! You can do it!",
    "One more time! Keep trying!",
    "One more time! Almost!",
    "One more time! Take it slowly!",
    "One more time! Look carefully!",
    "One more time! Stay with it!",
    "One more time! Good try!",
    "One more time! Try the next one!",
    "One more time! You're getting closer!",
    "One more time! I believe in you!"
  ];
  const MASCOT_RESPONSE_COUNT = MASCOT_SUCCESS_RESPONSES.length + MASCOT_MISTAKE_RESPONSES.length;
  const SPOKEN_NUMBER_WORDS = Object.freeze({
    "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five",
    "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten",
    "100": "hundred", "1000": "thousand", "10000": "ten thousand", "100000000": "hundred million"
  });
  const CAT_VOICE_VERSION = "20261003-release26";
  const MASCOT_AUDIO_BY_LINE = new Map([
    ...MASCOT_QUESTION_SPEECH.map((line, index) => [line, `./assets/cat-voice/question-${String(index + 1).padStart(2, "0")}.wav?v=${CAT_VOICE_VERSION}`]),
    ...MASCOT_SUCCESS_RESPONSES.map((line, index) => [line, `./assets/cat-voice/success-${String(index + 1).padStart(2, "0")}.wav?v=${CAT_VOICE_VERSION}`]),
    ...MASCOT_MISTAKE_RESPONSES.map((line, index) => [line, `./assets/cat-voice/mistake-${String(index + 1).padStart(2, "0")}.wav?v=${CAT_VOICE_VERSION}`])
  ]);

  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
  }

  function announce(message) {
    ui.announcer.textContent = "";
    requestAnimationFrame(() => { ui.announcer.textContent = message; });
  }

  function stopMascotCycle() {
    clearTimeout(mascotTimer);
    mascotTimer = 0;
  }

  function setMascotPose(pose) {
    if (!ui.mascot) return;
    const index = Math.max(0, MASCOT_POSES.findIndex(([name]) => name === pose));
    const [name, label] = MASCOT_POSES[index];
    mascotPoseIndex = index;
    ui.mascot.className = "mascot-sprite";
    ui.mascot.dataset.pose = name;
    ui.mascot.setAttribute("aria-label", label);
    void ui.mascot.offsetWidth;
    ui.mascot.classList.add(`mascot-${name}`);
  }

  function setMascotSpeech(message, tone = "") {
    if (!ui.mascotSpeech) return;
    ui.mascotSpeech.textContent = message;
    ui.mascotSpeech.className = `mascot-speech${tone ? ` ${tone}` : ""}`;
    if (!mascotVoiceMutedForDictation && MASCOT_AUDIO_BY_LINE.has(message)) void speakMascot(message);
  }

  function stopMascotVoice() {
    mascotVoiceGeneration += 1;
    if (activeMascotAudio) {
      try {
        activeMascotAudio.pause();
        activeMascotAudio.currentTime = 0;
      } catch { /* Audio playback is optional. */ }
      activeMascotAudio = null;
    }
    try { window.speechSynthesis?.cancel?.(); } catch { /* Speech is optional. */ }
  }

  function speakMascotWithSystemVoice(message) {
    if (mascotVoiceMutedForDictation) return false;
    const settings = readSettings();
    if (!settings.catVoiceEnabled || settings.catVoiceVolume <= 0) return false;
    const Utterance = window.SpeechSynthesisUtterance;
    if (!Utterance || !window.speechSynthesis?.speak) return false;
    const utterance = new Utterance(String(message || ""));
    utterance.lang = "en-US";
    utterance.pitch = settings.catVoiceStyle === "kitten" ? 1.9 : settings.catVoiceStyle === "calm" ? 1.35 : 1.7;
    utterance.rate = settings.catVoiceStyle === "kitten" ? 1.12 : settings.catVoiceStyle === "calm" ? .9 : 1.02;
    utterance.volume = settings.catVoiceVolume;
    const voices = window.speechSynthesis.getVoices?.() || [];
    utterance.voice = voices.find(voice => /^en/i.test(voice.lang) && /samantha|victoria|zira|female|google us english/i.test(voice.name))
      || voices.find(voice => /^en/i.test(voice.lang))
      || null;
    window.speechSynthesis.speak(utterance);
    return true;
  }

  async function speakMascot(message) {
    if (mascotVoiceMutedForDictation) return false;
    const settings = readSettings();
    if (!settings.catVoiceEnabled || settings.catVoiceVolume <= 0) {
      stopMascotVoice();
      return false;
    }
    stopMascotVoice();
    const voiceGeneration = mascotVoiceGeneration;
    const audioPath = MASCOT_AUDIO_BY_LINE.get(message);
    if (!audioPath || !window.Audio) return speakMascotWithSystemVoice(message);

    const audio = new window.Audio(audioPath);
    activeMascotAudio = audio;
    audio.preload = "auto";
    audio.volume = settings.catVoiceVolume;
    audio.playbackRate = settings.catVoiceStyle === "kitten" ? 1.12 : settings.catVoiceStyle === "calm" ? .9 : 1;
    if ("preservesPitch" in audio) audio.preservesPitch = false;
    if ("webkitPreservesPitch" in audio) audio.webkitPreservesPitch = false;
    audio.addEventListener?.("ended", () => {
      if (activeMascotAudio === audio) activeMascotAudio = null;
    }, { once: true });

    if (controllerSpeakerId && typeof audio.setSinkId === "function") {
      try {
        await audio.setSinkId(controllerSpeakerId);
        controllerSpeakerReady = audio.sinkId === controllerSpeakerId;
      } catch {
        controllerSpeakerReady = false;
      }
    }
    if (voiceGeneration !== mascotVoiceGeneration || mascotVoiceMutedForDictation) return false;
    try {
      await audio.play();
      return true;
    } catch {
      if (activeMascotAudio === audio) activeMascotAudio = null;
      if (voiceGeneration !== mascotVoiceGeneration || mascotVoiceMutedForDictation) return false;
      return speakMascotWithSystemVoice(message);
    }
  }

  function rememberControllerSpeaker(devices = [], controllerMic = null) {
    const audioOutputs = devices.filter(device => device.kind === "audiooutput");
    const speaker = audioOutputs.find(device => controllerMic?.groupId && device.groupId === controllerMic.groupId)
      || audioOutputs.find(device => /dualsense|wireless controller|ps5|controller/i.test(device.label));
    if (speaker?.deviceId) {
      if (controllerSpeakerId !== speaker.deviceId) controllerSpeakerReady = false;
      controllerSpeakerId = speaker.deviceId;
      controllerSpeakerLabel = speaker.label || "Wireless Controller";
    }
    return speaker || null;
  }

  async function refreshControllerSpeaker() {
    try {
      const devices = await navigator.mediaDevices?.enumerateDevices?.() || [];
      return rememberControllerSpeaker(devices);
    } catch {
      return null;
    }
  }

  async function verifyControllerSpeakerRoute() {
    if (!controllerSpeakerId || !window.Audio) return false;
    const probe = new window.Audio();
    if (typeof probe.setSinkId !== "function") return false;
    try {
      await probe.setSinkId(controllerSpeakerId);
      controllerSpeakerReady = probe.sinkId === controllerSpeakerId;
    } catch {
      controllerSpeakerReady = false;
    }
    return controllerSpeakerReady;
  }

  function useDictatedAnswer(value) {
    const answerLanguage = readSettings().answerLanguage;
    const alternatives = (typeof value === "string"
      ? [value]
      : Array.from(value || []).map(candidate => candidate?.transcript || ""))
      .map(candidate => answerLanguage === "english" ? spokenNumberAnswer(candidate) : String(candidate || "").trim());
    const question = questions[current];
    const answer = (alternatives.find(candidate => writtenAnswer(candidate, question).correct) || alternatives[0] || "")
      .trim()
      .slice(0, 120);
    if (!answer || answered || questionLevel !== 2) return;
    stopBrowserRecognition();
    setTalkButton(false);
    mascotVoiceMutedForDictation = false;
    ui.writeAnswer.value = answer.replace(/[.!?,]+$/g, "");
    ui.writeAnswer.classList.remove("needs-answer");
    ui.writeAnswer.dispatchEvent(new Event("input", { bubbles: true }));
    ui.mascotMicStatus.textContent = controllerSpeakerReady
      ? "こたえを きいたよ！ · ねこの声: PS5スピーカー"
      : "こたえを きいたよ！";
    chooseWrittenAnswer();
  }

  function setTalkButton(active, connecting = false) {
    if (!ui.mascotTalk) return;
    ui.mascotTalk.disabled = false;
    ui.mascotTalk.classList.toggle("active", active);
    ui.mascotTalk.textContent = active
      ? (connecting ? "✕ マイクを とめる" : "■ マイクを とめる")
      : "🎙 はなす";
  }

  function stopTracks(stream = activeMicStream) {
    stream?.getTracks?.().forEach(track => track.stop());
    if (stream === activeMicStream) activeMicStream = null;
  }

  function stopBrowserRecognition() {
    const recognition = activeRecognition;
    activeRecognition = null;
    try { recognition?.abort?.(); } catch { /* The recognition already ended. */ }
    stopTracks();
  }

  function stopAllVoice(graceful = true, tellPlayer = false) {
    dictationAttempt += 1;
    stopBrowserRecognition();
    setTalkButton(false);
    mascotVoiceMutedForDictation = false;
    stopMascotVoice();
    if (tellPlayer) {
      ui.mascotMicStatus.textContent = "マイクを とめました";
      setMascotSpeech(MASCOT_QUESTION_SPEECH[(current + 1) % MASCOT_QUESTION_SPEECH.length]);
      reactMascot("wave");
      resumeMascotCycle(2600);
    }
  }

  async function preferredMicrophone() {
    let stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: false
    });
    const devices = await navigator.mediaDevices.enumerateDevices?.() || [];
    const controllerMic = devices.find(device => device.kind === "audioinput" && /dualsense|wireless controller|ps5|controller/i.test(device.label));
    const controllerSpeaker = rememberControllerSpeaker(devices, controllerMic);
    await verifyControllerSpeakerRoute();
    const firstTrack = stream.getAudioTracks()[0];
    if (controllerMic && firstTrack?.getSettings?.().deviceId !== controllerMic.deviceId) {
      stopTracks(stream);
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: controllerMic.deviceId }, echoCancellation: true, noiseSuppression: true },
        video: false
      });
    }
    return { stream, controllerMic, controllerSpeaker, track: stream.getAudioTracks()[0] };
  }

  function startBrowserSpeechRecognition(stream, microphoneLabel) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) throw new Error("Speech recognition is unavailable");
    const recognition = new Recognition();
    activeRecognition = recognition;
    recognition.lang = readSettings().answerLanguage === "japanese" ? "ja-JP" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    setTalkButton(true);
    ui.mascotMicStatus.textContent = `こたえを きいているよ · ${microphoneLabel}`;
    setMascotSpeech(MASCOT_QUESTION_SPEECH[(current + 2) % MASCOT_QUESTION_SPEECH.length], "listening");
    recognition.onresult = event => {
      if (event.results?.[0]?.length) useDictatedAnswer(event.results[0]);
    };
    recognition.onerror = event => {
      if (activeRecognition !== recognition) return;
      stopBrowserRecognition();
      setTalkButton(false);
      mascotVoiceMutedForDictation = false;
      const denied = event.error === "not-allowed" || event.error === "service-not-allowed";
      setMascotSpeech(denied ? "マイクを きょかしてね。" : "よく きこえなかったよ。もういちど！", "error");
      ui.mascotMicStatus.textContent = denied ? "Chromeのマイク許可を確認してね" : "L3か 🎙 で もういちど";
      reactMascot(denied ? "worried" : "puzzled");
    };
    recognition.onend = () => {
      if (activeRecognition !== recognition) return;
      activeRecognition = null;
      stopTracks();
      setTalkButton(false);
      mascotVoiceMutedForDictation = false;
      if (!answered && questionLevel === 2 && !ui.writeAnswer.value.trim()) {
        ui.mascotMicStatus.textContent = "L3か 🎙 をおして、英語の こたえを はなしてね";
      }
    };
    try { recognition.start(stream.getAudioTracks()[0]); }
    catch { recognition.start(); }
    reactMascot("microphone");
  }

  async function startAnswerDictation() {
    if (activeRecognition || mascotVoiceMutedForDictation) {
      dictationAttempt += 1;
      stopBrowserRecognition();
      setTalkButton(false);
      mascotVoiceMutedForDictation = false;
      ui.mascotMicStatus.textContent = "マイクを とめました";
      return;
    }
    if (answered || questionLevel !== 2 || ui.quiz.hidden) {
      ui.mascotMicStatus.textContent = "マイクは Lv.2 の 英語こたえで つかえるよ";
      setMascotSpeech(MASCOT_QUESTION_SPEECH[(current + 1) % MASCOT_QUESTION_SPEECH.length], "reply");
      reactMascot("point");
      resumeMascotCycle(2200);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMascotSpeech("このChromeでは おんせい入力が つかえないよ。マイクの せっていを みてね。", "error");
      ui.mascotMicStatus.textContent = "このブラウザーでは音声入力が使えません";
      reactMascot("worried");
      return;
    }
    const attempt = ++dictationAttempt;
    mascotVoiceMutedForDictation = true;
    stopMascotVoice();
    setTalkButton(true, true);
    ui.mascotMicStatus.textContent = "マイクを じゅんびしているよ…";
    setMascotSpeech(MASCOT_QUESTION_SPEECH[(current + 3) % MASCOT_QUESTION_SPEECH.length], "listening");
    reactMascot("listen");
    try {
      const { stream, controllerMic, controllerSpeaker, track } = await preferredMicrophone();
      if (attempt !== dictationAttempt) {
        stopTracks(stream);
        return;
      }
      activeMicStream = stream;
      const microphoneLabel = controllerMic
        ? `PS5マイク: ${controllerMic.label || "Wireless Controller"}`
        : `マイク: ${track?.label || "いつものマイク"}`;
      const speakerLabel = controllerSpeakerReady && controllerSpeaker ? ` · PS5スピーカー: ${controllerSpeakerLabel}` : "";
      startBrowserSpeechRecognition(stream, `${microphoneLabel}${speakerLabel}`);
    } catch (error) {
      if (attempt !== dictationAttempt) return;
      stopBrowserRecognition();
      setTalkButton(false);
      mascotVoiceMutedForDictation = false;
      const missing = error?.name === "NotFoundError" || error?.name === "OverconstrainedError";
      const unavailable = /recognition/i.test(String(error?.message || ""));
      setMascotSpeech(missing ? "つかえるマイクが みつからなかったよ。" : unavailable ? "Chromeの おんせい入力が つかえないよ。" : "マイクを きょかしてね。", "error");
      ui.mascotMicStatus.textContent = missing ? "マイクが見つかりません" : "Chromeのマイク許可を確認してね";
      reactMascot("worried");
    }
  }

  function startMascotCycle(startIndex = 0) {
    stopMascotCycle();
    mascotPoseIndex = (startIndex + MASCOT_POSES.length) % MASCOT_POSES.length;
    setMascotPose(MASCOT_POSES[mascotPoseIndex][0]);
    if (readSettings().reduceMotion) return;
    const advance = () => {
      if (ui.quiz.hidden || answered) return;
      mascotPoseIndex = (mascotPoseIndex + 1) % MASCOT_POSES.length;
      setMascotPose(MASCOT_POSES[mascotPoseIndex][0]);
      mascotTimer = window.setTimeout(advance, 2600);
    };
    mascotTimer = window.setTimeout(advance, 2600);
  }

  function reactMascot(pose) {
    stopMascotCycle();
    setMascotPose(pose);
  }

  function resumeMascotCycle(delay = 1800) {
    stopMascotCycle();
    if (answered || ui.quiz.hidden || readSettings().reduceMotion) return;
    mascotTimer = window.setTimeout(() => startMascotCycle(mascotPoseIndex + 1), delay);
  }

  function answerMascot(correct) {
    stopBrowserRecognition();
    setTalkButton(false);
    ui.mascotTalk.disabled = true;
    if (!correct) {
      const message = MASCOT_MISTAKE_RESPONSES[mistakeReactionIndex % MASCOT_MISTAKE_RESPONSES.length];
      mistakeReactionIndex += 1;
      reactMascot(["surprise", "encourage", "determined", "highfive"][mistakeReactionIndex % 4]);
      setMascotSpeech(message, "error");
      return;
    }
    if (current === questions.length - 1 && score === questions.length) {
      reactMascot("perfect");
      const message = MASCOT_SUCCESS_RESPONSES.at(-1);
      setMascotSpeech(message, "success");
      return;
    }
    const message = MASCOT_SUCCESS_RESPONSES[successReactionIndex % MASCOT_SUCCESS_RESPONSES.length];
    successReactionIndex += 1;
    reactMascot(["cheer", "clap", "bounce", "proud", "highfive", "confetti"][successReactionIndex % 6]);
    setMascotSpeech(message, "success");
  }

  function readSettings() {
    const defaults = {
      largeText: false,
      highContrast: false,
      reduceMotion: false,
      answerLanguage: "english",
      motionSensitivity: 1,
      touchpadSensitivity: 1,
      catVoiceEnabled: true,
      catVoiceVolume: 1,
      catVoiceStyle: "gentle"
    };
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      const savedCatVolume = Number(saved.catVoiceVolume);
      return {
        largeText: Boolean(saved.largeText),
        highContrast: Boolean(saved.highContrast),
        reduceMotion: saved.reduceMotion === undefined
          ? matchMedia("(prefers-reduced-motion: reduce)").matches
          : Boolean(saved.reduceMotion),
        answerLanguage: saved.answerLanguage === "japanese" ? "japanese" : "english",
        motionSensitivity: Math.max(.5, Math.min(2, Number(saved.motionSensitivity) || 1)),
        touchpadSensitivity: Math.max(.5, Math.min(2, Number(saved.touchpadSensitivity) || 1)),
        catVoiceEnabled: saved.catVoiceEnabled === undefined ? true : Boolean(saved.catVoiceEnabled),
        catVoiceVolume: saved.catVoiceVolume === undefined || !Number.isFinite(savedCatVolume)
          ? 1
          : Math.max(0, Math.min(1, savedCatVolume)),
        catVoiceStyle: ["gentle", "kitten", "calm"].includes(saved.catVoiceStyle) ? saved.catVoiceStyle : "gentle"
      };
    } catch {
      return defaults;
    }
  }

  function applySettings(settings = readSettings()) {
    document.body.classList.toggle("large-text", settings.largeText);
    document.body.classList.toggle("high-contrast", settings.highContrast);
    document.body.classList.toggle("reduce-motion", settings.reduceMotion);
    ui.largeText.checked = settings.largeText;
    ui.contrast.checked = settings.highContrast;
    ui.motion.checked = settings.reduceMotion;
    ui.answerLanguage.value = settings.answerLanguage;
    ui.motionSensitivity.value = String(settings.motionSensitivity);
    ui.motionSensitivityValue.textContent = `${Math.round(settings.motionSensitivity * 100)}%`;
    ui.touchpadSensitivity.value = String(settings.touchpadSensitivity);
    ui.touchpadSensitivityValue.textContent = `${Math.round(settings.touchpadSensitivity * 100)}%`;
    ui.catVoice.checked = settings.catVoiceEnabled;
    ui.catVoiceVolume.value = String(Math.round(settings.catVoiceVolume * 100));
    ui.catVoiceVolumeValue.textContent = `${Math.round(settings.catVoiceVolume * 100)}%`;
    ui.catVoiceStyle.value = settings.catVoiceStyle;
    document.documentElement.dataset.answerLanguage = settings.answerLanguage;
    if (!settings.catVoiceEnabled || settings.catVoiceVolume <= 0) stopMascotVoice();
    else if (activeMascotAudio) {
      activeMascotAudio.volume = settings.catVoiceVolume;
      activeMascotAudio.playbackRate = settings.catVoiceStyle === "kitten" ? 1.12 : settings.catVoiceStyle === "calm" ? .9 : 1;
    }
    updateControllerUi();
  }

  function saveSettings() {
    const previous = readSettings();
    const settings = {
      largeText: ui.largeText.checked,
      highContrast: ui.contrast.checked,
      reduceMotion: ui.motion.checked,
      answerLanguage: ui.answerLanguage.value,
      motionSensitivity: Number(ui.motionSensitivity.value),
      touchpadSensitivity: Number(ui.touchpadSensitivity.value),
      catVoiceEnabled: ui.catVoice.checked,
      catVoiceVolume: Number(ui.catVoiceVolume.value) / 100,
      catVoiceStyle: ui.catVoiceStyle.value
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    applySettings(settings);
    if (previous.answerLanguage !== settings.answerLanguage && !ui.quiz.hidden && questionLevel === 2 && !answered) renderQuestion();
    announce("せっていを ほぞんしました");
  }

  function activeDialog() {
    return document.querySelector("dialog[open]");
  }

  function openGameDialog(dialog, trigger) {
    if (!dialog || dialog.open) return;
    lastDialogTrigger = trigger || document.activeElement;
    dialog.showModal();
    requestAnimationFrame(() => focusControllerTarget(dialog.querySelector("button, input")));
    updateControllerUi();
  }

  function closeGameDialog(dialog = activeDialog()) {
    if (!dialog?.open) return;
    dialog.close();
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      announce("このブラウザーでは ぜんがめんに できませんでした");
    }
  }

  function updateFullscreenButton() {
    const fullscreen = Boolean(document.fullscreenElement);
    ui.fullscreen.innerHTML = fullscreen ? "⛶ <span>もどす</span>" : "⛶ <span>ぜんがめん</span>";
    ui.fullscreen.setAttribute("aria-label", fullscreen ? "全画面表示をやめる" : "全画面表示にする");
  }

  function resetSavedProgress() {
    if (!resetProgressArmed) {
      resetProgressArmed = true;
      ui.resetProgress.textContent = "もういちど おして けす";
      ui.resetStatus.textContent = "4びょう以内に もういちど おすと、きろくが きえます。";
      clearTimeout(resetProgressTimer);
      resetProgressTimer = window.setTimeout(() => {
        resetProgressArmed = false;
        ui.resetProgress.textContent = "きろくを けす";
        ui.resetStatus.textContent = "";
      }, 4000);
      return;
    }

    clearTimeout(resetProgressTimer);
    Object.keys(localStorage)
      .filter(key => key.startsWith("kanjiQuiz") && key !== SETTINGS_KEY)
      .forEach(key => localStorage.removeItem(key));
    resetProgressArmed = false;
    ui.resetProgress.textContent = "きろくを けす";
    ui.resetStatus.textContent = "学習記録を けしました。";
    renderGroups();
    setActiveGrade();
    show("start");
    announce("学習記録を けしました");
  }

  function meaningFor(word) {
    return COMMON[word] || ENGLISH[word]?.[0] || "";
  }

  function drawingPoint(event) {
    const bounds = ui.drawingCanvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * (ui.drawingCanvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (ui.drawingCanvas.height / bounds.height)
    };
  }

  function drawLine(from, to) {
    drawingContext.lineWidth = 24;
    drawingContext.lineCap = "round";
    drawingContext.lineJoin = "round";
    drawingContext.strokeStyle = "#243044";
    drawingContext.beginPath();
    drawingContext.moveTo(from.x, from.y);
    drawingContext.lineTo(to.x, to.y);
    drawingContext.stroke();
  }

  function drawDot(point) {
    drawingContext.fillStyle = "#243044";
    drawingContext.beginPath();
    drawingContext.arc(point.x, point.y, 12, 0, Math.PI * 2);
    drawingContext.fill();
  }

  function redrawDrawing() {
    drawingContext.clearRect(0, 0, ui.drawingCanvas.width, ui.drawingCanvas.height);
    drawingStrokes.forEach(stroke => {
      if (stroke.length === 1) drawDot(stroke[0]);
      for (let index = 1; index < stroke.length; index += 1) drawLine(stroke[index - 1], stroke[index]);
    });
  }

  function renderDrawingGuide(word) {
    drawingGuideContext.clearRect(0, 0, ui.drawingGuide.width, ui.drawingGuide.height);
    if (!word) return;
    drawingGuideContext.fillStyle = "#c6ccd5";
    drawingGuideContext.strokeStyle = "#c6ccd5";
    drawingGuideContext.lineWidth = 10;
    drawingGuideContext.lineJoin = "round";
    drawingGuideContext.font = '520px "Yu Mincho", "Hiragino Mincho ProN", serif';
    drawingGuideContext.textAlign = "center";
    drawingGuideContext.textBaseline = "middle";
    drawingGuideContext.strokeText(word, ui.drawingGuide.width / 2, ui.drawingGuide.height / 2 + 18);
    drawingGuideContext.fillText(word, ui.drawingGuide.width / 2, ui.drawingGuide.height / 2 + 18);
  }

  function updateDrawingControls() {
    const hasDrawing = drawingStrokes.length > 0;
    ui.undoDrawing.disabled = drawingLocked || !hasDrawing;
    ui.clearDrawing.disabled = drawingLocked || !hasDrawing;
    ui.checkDrawing.disabled = drawingLocked || !hasDrawing;
  }

  function resetDrawing() {
    drawingStrokes = [];
    activeStroke = null;
    touchpadStroke = null;
    touchpadTouchId = null;
    drawingLocked = false;
    gamepadPenDown = false;
    hidL2Pressed = false;
    hidR2Pressed = false;
    gamepadR2Pressed = false;
    hidMotion = { x: 0, y: 0, z: 0, lastAt: 0 };
    gamepadCursor = { x: ui.drawingCanvas.width / 2, y: ui.drawingCanvas.height / 2 };
    ui.drawingCanvas.classList.remove("locked", "needs-answer");
    ui.gamepadDrawingCursor.classList.remove("pen-down");
    positionGamepadCursor();
    redrawDrawing();
    updateDrawingControls();
  }

  function startDrawing(event) {
    if (drawingLocked || questionLevel < 3 || answered) return;
    event.preventDefault();
    touchpadStroke = null;
    touchpadTouchId = null;
    gamepadPenDown = false;
    ui.gamepadDrawingCursor.classList.remove("pen-down");
    ui.drawingCanvas.classList.remove("needs-answer");
    ui.drawingCanvas.setPointerCapture(event.pointerId);
    activeStroke = [drawingPoint(event)];
    drawingStrokes.push(activeStroke);
    drawDot(activeStroke[0]);
    reactMascot("write");
    if (drawingStrokes.length === 1) setMascotSpeech("いいね！ せんを よく見て かこう。", "reply");
    updateDrawingControls();
  }

  function continueDrawing(event) {
    if (!activeStroke || drawingLocked) return;
    event.preventDefault();
    const point = drawingPoint(event);
    drawLine(activeStroke[activeStroke.length - 1], point);
    activeStroke.push(point);
  }

  function stopDrawing(event) {
    if (!activeStroke) return;
    event.preventDefault();
    activeStroke = null;
    if (ui.drawingCanvas.hasPointerCapture(event.pointerId)) ui.drawingCanvas.releasePointerCapture(event.pointerId);
    resumeMascotCycle();
    updateDrawingControls();
  }

  function positionGamepadCursor() {
    ui.gamepadDrawingCursor.style.left = `${gamepadCursor.x / ui.drawingCanvas.width * 100}%`;
    ui.gamepadDrawingCursor.style.top = `${gamepadCursor.y / ui.drawingCanvas.height * 100}%`;
  }

  function setGamepadPen(down) {
    if (drawingLocked || answered || questionLevel < 3) down = false;
    if (down === gamepadPenDown) return;
    gamepadPenDown = down;
    ui.gamepadDrawingCursor.classList.toggle("pen-down", down);
    if (down) {
      ui.drawingCanvas.classList.remove("needs-answer");
      activeStroke = null;
      reactMascot("write");
      if (!drawingStrokes.length) {
        setMascotSpeech(questionLevel === 4
          ? "R2を おしながら コントローラーを うごかしてね。"
          : "L2を おしながら ゆっくり かいてね。", "reply");
      }
    } else {
      activeStroke = null;
      resumeMascotCycle();
    }
    updateDrawingControls();
  }

  function moveGamepadCursorBy(deltaX, deltaY) {
    const margin = 13;
    const next = {
      x: Math.max(margin, Math.min(ui.drawingCanvas.width - margin, gamepadCursor.x + Math.max(-48, Math.min(48, deltaX)))),
      y: Math.max(margin, Math.min(ui.drawingCanvas.height - margin, gamepadCursor.y + Math.max(-48, Math.min(48, deltaY))))
    };
    if (gamepadPenDown && (next.x !== gamepadCursor.x || next.y !== gamepadCursor.y)) {
      if (!activeStroke) {
        activeStroke = [{ ...gamepadCursor }];
        drawingStrokes.push(activeStroke);
      }
      drawLine(gamepadCursor, next);
      activeStroke.push(next);
      updateDrawingControls();
    }
    gamepadCursor = next;
    positionGamepadCursor();
  }

  function moveGamepadCursor(directionX, directionY) {
    moveGamepadCursorBy(directionX * 20, directionY * 20);
  }

  function motionDrawingActive() {
    return questionLevel === 4 && controllerDrawingActive() && Boolean(hidTouchpad?.opened);
  }

  function syncMotionPen() {
    if (questionLevel !== 4) return;
    setGamepadPen(hidR2Pressed || gamepadR2Pressed);
  }

  function gyroWithoutDrift(value, deadzone = 75) {
    if (Math.abs(value) <= deadzone) return 0;
    return value - Math.sign(value) * deadzone;
  }

  function updateMotionDrawing(gyroX, gyroY, gyroZ) {
    const now = performance.now();
    const previousAt = hidMotion.lastAt;
    hidMotion.x = hidMotion.x * .58 + gyroX * .42;
    hidMotion.y = hidMotion.y * .58 + gyroY * .42;
    hidMotion.z = hidMotion.z * .58 + gyroZ * .42;
    hidMotion.lastAt = now;
    if (!motionDrawingActive()) return;
    if (!hidMotionSeen) {
      hidMotionSeen = true;
      setTouchpadStatus("✓ モーションセンサー OK！ R2で モーション・L2で タッチパッド", "connected");
    }
    syncMotionPen();
    if (!previousAt) return;
    const seconds = Math.max(.002, Math.min(.03, (now - previousAt) / 1000));
    const sensitivity = readSettings().motionSensitivity;
    const deltaX = -gyroWithoutDrift(hidMotion.y) * seconds * .27 * sensitivity;
    const deltaY = -gyroWithoutDrift(hidMotion.x) * seconds * .27 * sensitivity;
    if (Math.abs(deltaX) >= .15 || Math.abs(deltaY) >= .15) moveGamepadCursorBy(deltaX, deltaY);
  }

  function gamepadTouches(pad) {
    try {
      return [...(pad?.touches || pad?.touchEvents || [])];
    } catch {
      return [];
    }
  }

  function setTouchpadStatus(message, state = "") {
    ui.touchpadStatus.textContent = message;
    ui.touchpadStatus.classList.toggle("connected", state === "connected");
    ui.touchpadStatus.classList.toggle("error", state === "error");
  }

  async function configureUsbDualSenseSpeaker() {
    if (hidSpeakerConfigured || !hidTouchpad?.opened || typeof hidTouchpad.sendReport !== "function") return;
    hidSpeakerConfigured = true;
    const report = new Uint8Array(47);
    report[0] = 0xa0; // Enable speaker volume and audio routing controls.
    report[1] = 0x80; // Enable speaker pre-gain control.
    report[5] = 0x64; // DualSense internal-speaker hardware volume.
    report[7] = 0x30; // Mute the headset path and route the right channel internally.
    report[37] = 0x03; // Clear, audible internal-speaker pre-gain.
    try {
      await hidTouchpad.sendReport(0x02, report);
      await refreshControllerSpeaker();
      await verifyControllerSpeakerRoute();
      const currentLine = ui.mascotSpeech.textContent;
      if (controllerSpeakerReady && MASCOT_AUDIO_BY_LINE.has(currentLine)) void speakMascot(currentLine);
    } catch {
      hidSpeakerConfigured = false;
    }
  }

  function readDualSenseTouch(reportId, reportData) {
    const data = reportData instanceof DataView
      ? reportData
      : new DataView(reportData.buffer, reportData.byteOffset, reportData.byteLength);
    const pointOffset = reportId === 0x31 && data.byteLength >= 41
      ? 33
      : reportId === 0x01 && data.byteLength >= 40
        ? 32
        : -1;
    if (pointOffset < 0) return;

    const stateOffset = reportId === 0x31 ? 1 : 0;
    hidL2Pressed = data.getUint8(stateOffset + 4) > 64 || Boolean(data.getUint8(stateOffset + 8) & 0x04);
    hidR2Pressed = data.getUint8(stateOffset + 5) > 64 || Boolean(data.getUint8(stateOffset + 8) & 0x08);
    if (data.byteLength >= stateOffset + 21) {
      const gyroX = data.getInt16(stateOffset + 15, true);
      const gyroY = data.getInt16(stateOffset + 17, true);
      const gyroZ = data.getInt16(stateOffset + 19, true);
      updateMotionDrawing(gyroX, gyroY, gyroZ);
    }
    if (reportId === 0x01 && data.byteLength >= 63) void configureUsbDualSenseSpeaker();

    let touch = null;
    for (let pointIndex = 0; pointIndex < 2; pointIndex += 1) {
      const offset = pointOffset + pointIndex * 4;
      const contact = data.getUint8(offset);
      if (contact & 0x80) continue;
      const x = data.getUint8(offset + 1) | ((data.getUint8(offset + 2) & 0x0f) << 8);
      const y = (data.getUint8(offset + 2) >> 4) | (data.getUint8(offset + 3) << 4);
      touch = {
        touchId: contact & 0x7f,
        position: [Math.max(-1, Math.min(1, x / 1919 * 2 - 1)), Math.max(-1, Math.min(1, y / 1079 * 2 - 1))]
      };
      break;
    }
    hidTouch = touch;
    if (touch && !hidTouchSeen) {
      hidTouchSeen = true;
      setTouchpadStatus(questionLevel === 4
        ? "✓ タッチパッド OK！ L2で タッチパッド・R2で モーション"
        : "✓ タッチパッド OK！ L2を おしながら なぞってね", "connected");
    }
  }

  function handleHidInput(event) {
    readDualSenseTouch(event.reportId, event.data);
  }

  async function useHidTouchpad(device) {
    if (!device) return false;
    if (!device.opened) await device.open();
    if (hidTouchpad && hidInputListener) hidTouchpad.removeEventListener("inputreport", hidInputListener);
    hidTouchpad = device;
    hidInputListener = handleHidInput;
    hidTouchpad.addEventListener("inputreport", hidInputListener);
    // A Bluetooth DualSense starts with a short 0x01 report that has no
    // touch positions. Reading feature report 0x05 switches it to the full
    // 0x31 report. The Gamepad API sometimes does this, but not on every Mac.
    try {
      await hidTouchpad.receiveFeatureReport(0x05);
    } catch {
      // USB and some browser versions already stream the full report.
    }
    hidTouchSeen = false;
    hidMotionSeen = false;
    hidL2Pressed = false;
    hidR2Pressed = false;
    gamepadR2Pressed = false;
    hidMotion = { x: 0, y: 0, z: 0, lastAt: 0 };
    hidSpeakerConfigured = false;
    ui.connectTouchpad.disabled = true;
    ui.connectTouchpad.textContent = questionLevel === 4 ? "✓ MOTION + TOUCHPAD CONNECTED" : "✓ TOUCHPAD CONNECTED";
    setTouchpadStatus(questionLevel === 4
      ? "つながったよ！ R2で モーション・L2で タッチパッド"
      : "つながったよ！ タッチパッドに ゆびを のせて ためしてね", "connected");
    updateControllerUi();
    return true;
  }

  async function requestHidTouchpad() {
    if (!navigator.hid) {
      setTouchpadStatus("Google Chromeで ゲームを ひらいてね", "error");
      return;
    }
    ui.connectTouchpad.disabled = true;
    setTouchpadStatus("DualSense Wireless Controllerを えらんでね");
    try {
      const devices = await navigator.hid.requestDevice({ filters: [{ vendorId: 0x054c }] });
      const device = devices.find(candidate => /dualsense|wireless controller/i.test(candidate.productName || "")) || devices[0];
      if (!device) throw new Error("No controller selected");
      await useHidTouchpad(device);
    } catch (error) {
      ui.connectTouchpad.disabled = false;
      if (error?.name === "NotFoundError" || /No controller selected/.test(error?.message || "")) {
        setTouchpadStatus("もういちど ボタンを おして、コントローラーを えらんでね", "error");
      } else {
        setTouchpadStatus("つながらなかったよ。Bluetoothを たしかめて もういちど おしてね", "error");
      }
    }
  }

  async function restoreHidTouchpad() {
    if (!navigator.hid) {
      setTouchpadStatus("Google Chromeで ゲームを ひらいてね", "error");
      return;
    }
    try {
      const devices = await navigator.hid.getDevices();
      const device = devices.find(candidate => candidate.vendorId === 0x054c && /dualsense|wireless controller/i.test(candidate.productName || ""));
      if (device) await useHidTouchpad(device);
    } catch {
      setTouchpadStatus("CONNECT TOUCHPADを おしてね");
    }
  }

  function gamepadTouchPoint(touch) {
    const position = touch?.position;
    const normalizedX = Number(position?.[0] ?? position?.x);
    const normalizedY = Number(position?.[1] ?? position?.y);
    if (!Number.isFinite(normalizedX) || !Number.isFinite(normalizedY)) return null;
    const margin = 13;
    const sensitivity = readSettings().touchpadSensitivity;
    return {
      x: Math.max(margin, Math.min(ui.drawingCanvas.width - margin, (normalizedX * sensitivity + 1) * ui.drawingCanvas.width / 2)),
      y: Math.max(margin, Math.min(ui.drawingCanvas.height - margin, (normalizedY * sensitivity + 1) * ui.drawingCanvas.height / 2))
    };
  }

  function stopTouchpadDrawing() {
    const wasDrawing = Boolean(touchpadStroke);
    touchpadStroke = null;
    touchpadTouchId = null;
    if (!gamepadPenDown) ui.gamepadDrawingCursor.classList.remove("pen-down");
    if (wasDrawing) resumeMascotCycle();
  }

  function updateTouchpadDrawing(pad) {
    if (!controllerDrawingActive() || drawingLocked || answered) {
      stopTouchpadDrawing();
      return;
    }
    const touchWithPoint = [hidTouch, ...gamepadTouches(pad)]
      .filter(Boolean)
      .map(touch => ({ touch, point: gamepadTouchPoint(touch) }))
      .find(candidate => candidate.point);
    const touch = touchWithPoint?.touch;
    const point = touchWithPoint?.point;
    if (!touch || !point) {
      stopTouchpadDrawing();
      return;
    }

    const touchId = touch.touchId ?? touch.id ?? 0;
    gamepadCursor = point;
    positionGamepadCursor();
    const l2Pressed = gamepadButtonPressed(pad, physicalButtonFor(pad, 6)) || hidL2Pressed;
    if (!l2Pressed) {
      stopTouchpadDrawing();
      return;
    }
    ui.gamepadDrawingCursor.classList.add("pen-down");
    ui.drawingCanvas.classList.remove("needs-answer");

    if (!touchpadStroke || touchpadTouchId !== touchId) {
      touchpadTouchId = touchId;
      touchpadStroke = [{ ...point }];
      drawingStrokes.push(touchpadStroke);
      drawDot(point);
      reactMascot("write");
      if (drawingStrokes.length === 1) setMascotSpeech("タッチパッドで じょうずに かけているよ！", "reply");
      updateDrawingControls();
      return;
    }

    const previous = touchpadStroke[touchpadStroke.length - 1];
    if (Math.hypot(point.x - previous.x, point.y - previous.y) < 1) return;
    drawLine(previous, point);
    touchpadStroke.push({ ...point });
  }

  function poolFor(grade) {
    if (grade === "all") {
      return Object.entries(KANJI).flatMap(([level, entries]) => entries.map(([word, reading]) => ({ word, reading, level })));
    }
    const items = KANJI[grade].map(([word, reading]) => ({ word, reading, level: grade }));
    if (grade === "1") {
      // Teach the similar-looking tree family together: 木 (tree), 林 (woods), 森 (forest).
      const treeIndex = items.findIndex(item => item.word === "木");
      const restIndex = items.findIndex(item => item.word === "休");
      if (treeIndex >= 0 && restIndex >= 0) [items[treeIndex], items[restIndex]] = [items[restIndex], items[treeIndex]];
    }
    return items;
  }

  function allGroups() {
    return Object.keys(KANJI).flatMap(grade => {
      const items = poolFor(grade);
      const groups = [];
      for (let index = 0; index < items.length; index += LESSON_TOTAL) {
        groups.push({
          id: `grade-${grade}-group-${Math.floor(index / LESSON_TOTAL) + 1}`,
          grade,
          number: Math.floor(index / LESSON_TOTAL) + 1,
          items: items.slice(index, index + LESSON_TOTAL)
        });
      }
      return groups;
    });
  }

  function readGoldGroups() {
    try {
      const saved = JSON.parse(localStorage.getItem(GOLD_KEY) || "[]");
      return new Set(Array.isArray(saved) ? saved : []);
    } catch {
      return new Set();
    }
  }

  function readGroupReviews() {
    try {
      const saved = JSON.parse(localStorage.getItem(GROUP_REVIEW_KEY) || "{}");
      return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    } catch {
      return {};
    }
  }

  function writeGroupReviews(reviews) {
    localStorage.setItem(GROUP_REVIEW_KEY, JSON.stringify(reviews));
  }

  function groupIsDue(groupId, reviews = readGroupReviews(), now = Date.now()) {
    const review = reviews[groupId];
    return readGoldGroups().has(groupId) && Number(review?.dueAt) > 0 && Number(review.dueAt) <= now;
  }

  function makeGroupPerfect(groupId) {
    const gold = readGoldGroups();
    gold.add(groupId);
    localStorage.setItem(GOLD_KEY, JSON.stringify([...gold]));
    const reviews = readGroupReviews();
    const now = Date.now();
    const previous = reviews[groupId];
    const previousStage = Number.isInteger(previous?.stage) ? previous.stage : -1;
    const advances = !previous || Number(previous.dueAt) <= now;
    const stage = advances ? Math.min(previousStage + 1, REVIEW_INTERVALS.length - 1) : Math.max(0, previousStage);
    reviews[groupId] = { stage, perfectAt: now, dueAt: now + REVIEW_INTERVALS[stage] };
    writeGroupReviews(reviews);
  }

  function migrateSavedProgress() {
    localStorage.removeItem(LEGACY_TESTS_KEY);
    const reviews = readGroupReviews();
    const now = Date.now();
    let changed = false;
    readGoldGroups().forEach(groupId => {
      if (reviews[groupId]) return;
      reviews[groupId] = { stage: 0, perfectAt: now, dueAt: now + REVIEW_INTERVALS[0] };
      changed = true;
    });
    if (changed) writeGroupReviews(reviews);
  }

  function renderGroups() {
    const gold = readGoldGroups();
    const reviews = readGroupReviews();
    const now = Date.now();
    let nextDueAt = Infinity;
    clearTimeout(groupRefreshTimer);
    const groups = allGroups();
    ui.groupList.replaceChildren();
    Object.keys(KANJI).forEach(grade => {
      const section = document.createElement("section");
      section.className = "grade-group-section";
      section.id = `grade-groups-${grade}`;
      const gradeGroups = groups.filter(group => group.grade === grade);
      const heading = document.createElement("div");
      heading.className = "grade-group-heading";
      heading.innerHTML = `<h2>${grade}年生</h2><span>${gradeGroups.length}グループ・${KANJI[grade].length}こ</span>`;
      const grid = document.createElement("div");
      grid.className = "group-grid";
      gradeGroups.forEach(group => {
        const isPerfect = gold.has(group.id);
        const review = reviews[group.id];
        const isDue = isPerfect && Number(review?.dueAt) > 0 && Number(review.dueAt) <= now;
        if (isPerfect && !isDue && Number(review?.dueAt) > now) nextDueAt = Math.min(nextDueAt, Number(review.dueAt));
        const badge = isDue ? "REVIEW" : isPerfect ? "PERFECT" : "NEW";
        const action = isDue ? "ONE MORE TIME →" : isPerfect ? "★ PERFECT" : "START →";
        const button = document.createElement("button");
        button.type = "button";
        button.className = `kanji-group-card${isPerfect ? " gold" : ""}${isDue ? " due" : ""}`;
        button.setAttribute("aria-label", `${grade}年生 グループ${group.number} ${action}`);
        button.innerHTML = `
          <span class="group-card-top"><b>グループ ${group.number}</b><span>${badge}</span></span>
          <span class="kanji-preview">${group.items.map(item => `<span>${item.word}</span>`).join("")}</span>
          <span class="group-card-bottom"><span>${group.items.length}もん</span><strong>${action}</strong></span>
          ${isPerfect && !isDue ? '<span class="gold-star" aria-hidden="true">★</span>' : ""}`;
        button.addEventListener("click", () => startQuiz(group));
        grid.append(button);
      });
      section.append(heading, grid);
      ui.groupList.append(section);
    });
    if (Number.isFinite(nextDueAt)) {
      const delay = Math.min(2_147_000_000, Math.max(250, nextDueAt - Date.now() + 50));
      groupRefreshTimer = window.setTimeout(renderGroups, delay);
    }
  }

  function labelFor(grade) {
    return `${grade}年生`;
  }

  function questionKey(question) {
    return `${question.level}|${question.word}|${question.reading}`;
  }

  function readMastery() {
    try {
      const saved = JSON.parse(localStorage.getItem(MASTERY_KEY) || "{}");
      return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    } catch {
      return {};
    }
  }

  function masteryFor(question) {
    const saved = readMastery()[questionKey(question)];
    return {
      difficulty: Math.min(4, Math.max(1, Number(saved?.difficulty) || 1)),
      attempts: Number(saved?.attempts) || 0,
      correct: Number(saved?.correct) || 0,
      mistakes: Number(saved?.mistakes) || 0
    };
  }

  function recordAttempt(question, correct) {
    const mastery = readMastery();
    const key = questionKey(question);
    const previous = masteryFor(question);
    mastery[key] = {
      attempts: previous.attempts + 1,
      correct: previous.correct + (correct ? 1 : 0),
      mistakes: previous.mistakes + (correct ? 0 : 1),
      difficulty: correct ? Math.min(4, previous.difficulty + 1) : 1
    };
    localStorage.setItem(MASTERY_KEY, JSON.stringify(mastery));
    return mastery[key];
  }

  function setActiveGrade(grade = "") {
    ui.sideGrades.querySelectorAll("[data-grade]").forEach(button => {
      button.classList.toggle("active", button.dataset.grade === String(grade));
    });
  }

  function show(screen) {
    ui.start.hidden = screen !== "start";
    ui.quiz.hidden = screen !== "quiz";
    ui.result.hidden = screen !== "result";
    if (screen !== "quiz") {
      stopAllVoice(true);
      stopMascotCycle();
    }
    updateControllerUi();
    if (controllerConnected || keyboardControllerMode || hidTouchpad?.opened) requestAnimationFrame(focusDefaultControllerTarget);
  }

  function startQuiz(group) {
    if (!group?.items?.length) return;
    selectedGrade = String(group.grade);
    activeGroup = group;
    activeGroupWasDue = groupIsDue(group.id);
    questions = shuffle(group.items);
    current = 0;
    score = 0;
    ui.gradeLabel.textContent = labelFor(selectedGrade);
    ui.gradeLabel.style.background = gradeColors[selectedGrade];
    setActiveGrade(selectedGrade);
    show("quiz");
    renderQuestion();
  }

  function optionMeanings(question) {
    const source = poolFor(selectedGrade);
    const answer = meaningFor(question.word);
    const allMeanings = [...new Set(source.map(item => meaningFor(item.word)).filter(Boolean))];
    if (allMeanings.length < 4) {
      Object.values(KANJI).flat().forEach(([word]) => {
        const meaning = meaningFor(word);
        if (meaning && !allMeanings.includes(meaning)) allMeanings.push(meaning);
      });
    }
    const wrong = shuffle(allMeanings.filter(meaning => meaning !== answer)).slice(0, 3);
    return shuffle([answer, ...wrong]);
  }

  function renderQuestion() {
    const question = questions[current];
    const answerLanguage = readSettings().answerLanguage;
    stopBrowserRecognition();
    mascotVoiceMutedForDictation = false;
    stopMascotVoice();
    answered = false;
    questionLevel = masteryFor(question).difficulty;
    const writesKanji = questionLevel >= 3;
    ui.levelLabel.textContent = `じどう Lv.${questionLevel}`;
    ui.questionKicker.textContent = writesKanji
      ? answerLanguage === "japanese" ? "この よみの 漢字を かこう" : "この いみの 漢字を かこう"
      : "この かんじは どんな いみ？";
    ui.word.textContent = writesKanji
      ? answerLanguage === "japanese" ? question.reading : meaningFor(question.word)
      : question.word;
    ui.word.classList.toggle("meaning-word", writesKanji);
    ui.keyHint.hidden = questionLevel !== 1;
    ui.count.textContent = `${current + 1} / ${questions.length}`;
    ui.score.textContent = score;
    ui.progress.style.width = `${((current + 1) / questions.length) * 100}%`;
    ui.feedback.hidden = true;
    ui.feedback.classList.remove("wrong");
    ui.next.hidden = true;
    ui.answers.replaceChildren();
    ui.answers.hidden = questionLevel !== 1;
    ui.writeForm.hidden = questionLevel !== 2;
    ui.drawingAnswer.hidden = questionLevel < 3;
    ui.writeAnswer.value = "";
    ui.writeAnswer.disabled = false;
    ui.writeAnswer.className = "";
    ui.checkAnswer.disabled = false;
    ui.writeLabel.textContent = answerLanguage === "japanese" ? "よみを 日本語で はなすか かこう" : "いみを 英語で はなすか かこう";
    ui.writeAnswer.lang = answerLanguage === "japanese" ? "ja" : "en";
    ui.writeAnswer.placeholder = answerLanguage === "japanese" ? "やま" : "mountain";
    setTalkButton(false);
    ui.mascotTalk.disabled = questionLevel !== 2;
    ui.mascotTalk.textContent = questionLevel === 2 ? "🎙 はなす" : "🎙 Lv.2で つかえる";
    ui.mascotTalk.setAttribute("aria-label", answerLanguage === "japanese" ? "マイクで日本語のよみを言う" : "マイクで英語のこたえを言う");
    ui.mascotMicStatus.textContent = questionLevel === 2
      ? answerLanguage === "japanese"
        ? "L3か 🎙 をおして、日本語の よみを はなしてね"
        : "L3か 🎙 をおして、英語の こたえを はなしてね"
      : "ねこは 30この ことばで おうえんするよ";
    renderDrawingGuide(writesKanji ? question.word : "");
    ui.drawingLabel.textContent = writesKanji
      ? questionLevel === 4
        ? `コントローラーを うごかして かこう（${STROKE_COUNTS[question.word]}かく）`
        : `白い ところに マウスや ゆびで かこう（${STROKE_COUNTS[question.word]}かく）`
      : "白い ところに マウスや ゆびで かこう";
    resetDrawing();
    setMascotSpeech(MASCOT_QUESTION_SPEECH[current % MASCOT_QUESTION_SPEECH.length]);
    startMascotCycle(current);
    updateControllerUi();

    if (questionLevel === 1) {
      optionMeanings(question).forEach((meaning, index) => {
        const button = document.createElement("button");
        button.className = "answer-button";
        button.type = "button";
        button.dataset.meaning = meaning;
        button.textContent = `${index + 1}. ${meaning}`;
        button.addEventListener("click", () => chooseAnswer(button, meaning));
        ui.answers.append(button);
      });
    } else if (questionLevel === 2) {
      requestAnimationFrame(() => controllerConnected || keyboardControllerMode ? focusDefaultControllerTarget() : ui.writeAnswer.focus());
    } else if (controllerConnected || keyboardControllerMode) {
      requestAnimationFrame(focusDefaultControllerTarget);
    }
  }

  function nextLevelCopy(level) {
    if (level === 1) return "つぎは こたえを えらぶよ。";
    if (level === 2) return readSettings().answerLanguage === "japanese"
      ? "つぎは よみを 日本語で こたえるよ。"
      : "つぎは いみを 英語で かくよ。";
    if (level === 3) return "つぎは 漢字を かくよ。";
    return "つぎは コントローラーを うごかして 漢字を かくよ。";
  }

  function chooseAnswer(button, meaning) {
    if (answered) return;
    answered = true;
    const question = questions[current];
    const answer = meaningFor(question.word);
    const correct = meaning === answer;
    if (correct) score += 1;
    const nextProgress = recordAttempt(question, correct);

    [...ui.answers.children].forEach(answer => {
      answer.disabled = true;
      if (answer.dataset.meaning === meaningFor(question.word)) answer.classList.add("correct");
    });
    if (!correct) button.classList.add("wrong");

    ui.score.textContent = score;
    answerMascot(correct);
    ui.feedback.hidden = false;
    ui.feedback.classList.toggle("wrong", !correct);
    ui.feedbackIcon.textContent = correct ? "○" : "△";
    ui.feedbackTitle.textContent = correct && nextProgress.difficulty > questionLevel ? "せいかい！ レベルアップ！" : correct ? "せいかい！" : "ONE MORE TIME!";
    ui.feedbackCopy.textContent = `「${question.word}」の いみは「${answer}」。 ${nextLevelCopy(nextProgress.difficulty)}`;
    ui.next.textContent = current === questions.length - 1 ? "けっかを みる →" : "つぎの もんだい →";
    ui.next.hidden = false;
    updateControllerUi();
    ui.next.focus();
  }

  function normalizeText(value) {
    return String(value).normalize("NFKC").replace(/\s+/g, "").trim();
  }

  function spokenNumberAnswer(value) {
    const original = String(value || "").normalize("NFKC").trim();
    const digits = original.replace(/[.!?]+$/g, "").replace(/[\s,]/g, "");
    return SPOKEN_NUMBER_WORDS[digits] || original;
  }

  function normalizeLatin(value) {
    return spokenNumberAnswer(value)
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  function spellingDistance(first, second) {
    const rows = first.length + 1;
    const columns = second.length + 1;
    const distances = Array.from({ length: rows }, (_, row) =>
      Array.from({ length: columns }, (_, column) => row === 0 ? column : column === 0 ? row : 0)
    );
    for (let row = 1; row < rows; row += 1) {
      for (let column = 1; column < columns; column += 1) {
        const substitution = first[row - 1] === second[column - 1] ? 0 : 1;
        distances[row][column] = Math.min(
          distances[row - 1][column] + 1,
          distances[row][column - 1] + 1,
          distances[row - 1][column - 1] + substitution
        );
        if (row > 1 && column > 1 && first[row - 1] === second[column - 2] && first[row - 2] === second[column - 1]) {
          distances[row][column] = Math.min(distances[row][column], distances[row - 2][column - 2] + 1);
        }
      }
    }
    return distances[first.length][second.length];
  }

  function isShortTransposition(first, second) {
    if (first.length !== second.length || first.length < 3) return false;
    const different = [...first].map((letter, index) => letter === second[index] ? -1 : index).filter(index => index >= 0);
    return different.length === 2
      && different[1] === different[0] + 1
      && first[different[0]] === second[different[1]]
      && first[different[1]] === second[different[0]];
  }

  function meaningAnswer(value, question) {
    const typed = normalizeLatin(value);
    if (!typed) return { correct: false, corrected: "", autocorrected: false };
    const candidates = [...new Set([COMMON[question.word], ...(ENGLISH[question.word] || [])].map(answer => String(answer || "").trim()).filter(Boolean))]
      .map(answer => ({ answer, normalized: normalizeLatin(answer) }))
      .filter(candidate => candidate.normalized);
    const exact = candidates.find(candidate => candidate.normalized === typed);
    if (exact) return { correct: true, corrected: exact.answer, autocorrected: false };

    const close = candidates
      .map(candidate => ({ ...candidate, distance: spellingDistance(typed, candidate.normalized) }))
      .filter(candidate => {
        if (candidate.normalized.length <= 3) return candidate.distance === 1 && isShortTransposition(typed, candidate.normalized);
        const allowance = candidate.normalized.length >= 8 ? 2 : 1;
        return candidate.distance <= allowance;
      })
      .sort((first, second) => first.distance - second.distance || first.normalized.length - second.normalized.length)[0];
    return close
      ? { correct: true, corrected: close.answer, autocorrected: true }
      : { correct: false, corrected: "", autocorrected: false };
  }

  function normalizeKana(value) {
    return String(value || "")
      .normalize("NFKC")
      .trim()
      .replace(/[\s。、.!?,・]/g, "")
      .replace(/[ァ-ヶ]/g, character => String.fromCharCode(character.charCodeAt(0) - 0x60));
  }

  function writtenAnswer(value, question) {
    if (readSettings().answerLanguage !== "japanese") return meaningAnswer(value, question);
    const typed = normalizeKana(value);
    const reading = normalizeKana(question.reading);
    const correct = Boolean(typed) && (typed === reading || normalizeText(value) === question.word);
    return { correct, corrected: correct ? question.reading : "", autocorrected: false };
  }

  function chooseWrittenAnswer() {
    if (answered) return;
    const question = questions[current];
    const typed = normalizeText(ui.writeAnswer.value);
    if (!typed) {
      ui.writeAnswer.classList.remove("needs-answer");
      void ui.writeAnswer.offsetWidth;
      ui.writeAnswer.classList.add("needs-answer");
      ui.writeAnswer.focus();
      return;
    }
    const originalAnswer = ui.writeAnswer.value.trim();
    if (activeRecognition || mascotVoiceMutedForDictation) {
      dictationAttempt += 1;
      stopBrowserRecognition();
      setTalkButton(false);
      mascotVoiceMutedForDictation = false;
    }
    const answerLanguage = readSettings().answerLanguage;
    const match = writtenAnswer(originalAnswer, question);
    const correct = match.correct;
    if (match.autocorrected) ui.writeAnswer.value = match.corrected;
    answered = true;
    if (correct) score += 1;
    const nextProgress = recordAttempt(question, correct);

    ui.writeAnswer.disabled = true;
    ui.checkAnswer.disabled = true;
    ui.writeAnswer.classList.remove("needs-answer");
    ui.writeAnswer.classList.add(correct ? "correct" : "wrong");
    ui.score.textContent = score;
    answerMascot(correct);
    ui.feedback.hidden = false;
    ui.feedback.classList.toggle("wrong", !correct);
    ui.feedbackIcon.textContent = correct ? "○" : "△";
    ui.feedbackTitle.textContent = match.autocorrected
      ? "せいかい！ スペルを なおしたよ"
      : correct && nextProgress.difficulty > questionLevel ? "せいかい！ レベルアップ！" : correct ? "せいかい！" : "ONE MORE TIME!";
    const expectedAnswer = answerLanguage === "japanese" ? question.reading : meaningFor(question.word);
    const correction = match.autocorrected ? `「${originalAnswer}」→「${match.corrected}」。 ` : "";
    ui.feedbackCopy.textContent = answerLanguage === "japanese"
      ? `${correction}「${question.word}」の よみは「${expectedAnswer}」。 ${nextLevelCopy(nextProgress.difficulty)}`
      : `${correction}「${question.word}」の いみは「${expectedAnswer}」。 ${nextLevelCopy(nextProgress.difficulty)}`;
    ui.next.textContent = current === questions.length - 1 ? "けっかを みる →" : "つぎの もんだい →";
    ui.next.hidden = false;
    updateControllerUi();
    ui.next.focus();
  }

  function strokeLength(stroke) {
    let length = 0;
    for (let index = 1; index < stroke.length; index += 1) {
      length += Math.hypot(stroke[index].x - stroke[index - 1].x, stroke[index].y - stroke[index - 1].y);
    }
    return length;
  }

  function fixedInkMask(canvas, size = 128) {
    const scaled = document.createElement("canvas");
    scaled.width = size;
    scaled.height = size;
    const context = scaled.getContext("2d", { willReadFrequently: true });
    context.drawImage(canvas, 0, 0, size, size);
    const pixels = context.getImageData(0, 0, size, size).data;
    const mask = new Uint8Array(size * size);
    let count = 0;
    for (let index = 0; index < mask.length; index += 1) {
      if (pixels[index * 4 + 3] >= 32) {
        mask[index] = 1;
        count += 1;
      }
    }
    return { mask, count };
  }

  function expandedMask(mask, size, radius) {
    const expanded = new Uint8Array(mask.length);
    for (let index = 0; index < mask.length; index += 1) {
      if (!mask[index]) continue;
      const x = index % size;
      const y = Math.floor(index / size);
      for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
        for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
          if (offsetX * offsetX + offsetY * offsetY > radius * radius) continue;
          const nextX = x + offsetX;
          const nextY = y + offsetY;
          if (nextX >= 0 && nextX < size && nextY >= 0 && nextY < size) expanded[nextY * size + nextX] = 1;
        }
      }
    }
    return expanded;
  }

  function regionSimilarity(first, second, size, cells = 6) {
    const firstRegions = Array(cells * cells).fill(0);
    const secondRegions = Array(cells * cells).fill(0);
    for (let index = 0; index < first.length; index += 1) {
      const x = index % size;
      const y = Math.floor(index / size);
      const regionX = Math.min(cells - 1, Math.floor(x * cells / size));
      const regionY = Math.min(cells - 1, Math.floor(y * cells / size));
      const region = regionY * cells + regionX;
      firstRegions[region] += first[index];
      secondRegions[region] += second[index];
    }
    const firstTotal = firstRegions.reduce((sum, value) => sum + value, 0) || 1;
    const secondTotal = secondRegions.reduce((sum, value) => sum + value, 0) || 1;
    return firstRegions.reduce((score, value, index) =>
      score + Math.min(value / firstTotal, secondRegions[index] / secondTotal), 0);
  }

  function maskBounds(mask, size) {
    let left = size;
    let right = -1;
    let top = size;
    let bottom = -1;
    for (let index = 0; index < mask.length; index += 1) {
      if (!mask[index]) continue;
      const x = index % size;
      const y = Math.floor(index / size);
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
    return right < left ? null : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
  }

  function normalizedMask(source, size) {
    const bounds = maskBounds(source.mask, size);
    if (!bounds) return source;
    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = size;
    sourceCanvas.height = size;
    const sourceContext = sourceCanvas.getContext("2d");
    const pixels = sourceContext.createImageData(size, size);
    for (let index = 0; index < source.mask.length; index += 1) {
      if (!source.mask[index]) continue;
      pixels.data[index * 4 + 3] = 255;
    }
    sourceContext.putImageData(pixels, 0, 0);

    const normalized = document.createElement("canvas");
    normalized.width = size;
    normalized.height = size;
    const context = normalized.getContext("2d");
    const available = size - 20;
    const scale = available / Math.max(bounds.width, bounds.height);
    const width = bounds.width * scale;
    const height = bounds.height * scale;
    context.drawImage(sourceCanvas, bounds.x, bounds.y, bounds.width, bounds.height, (size - width) / 2, (size - height) / 2, width, height);
    return fixedInkMask(normalized, size);
  }

  function compareMasks(drawn, correctShape, size, radius = 5, regionCells = 6) {
    if (!drawn.count || !correctShape.count) return { precision: 0, recall: 0, score: 0, regions: 0 };
    const wideCorrect = expandedMask(correctShape.mask, size, radius);
    const wideDrawing = expandedMask(drawn.mask, size, radius);
    let matchingDrawing = 0;
    let matchingCorrect = 0;
    for (let index = 0; index < drawn.mask.length; index += 1) {
      if (drawn.mask[index] && wideCorrect[index]) matchingDrawing += 1;
      if (correctShape.mask[index] && wideDrawing[index]) matchingCorrect += 1;
    }
    const precision = matchingDrawing / drawn.count;
    const recall = matchingCorrect / correctShape.count;
    const score = precision + recall ? 2 * precision * recall / (precision + recall) : 0;
    const regions = regionSimilarity(drawn.mask, correctShape.mask, size, regionCells);
    return { precision, recall, score, regions };
  }

  function positionedEnough(result) {
    return result.precision >= .52 && result.recall >= .5 && result.score >= .5 && result.regions >= .48;
  }

  function shapeEnough(result) {
    return result.precision >= .46 && result.recall >= .43 && result.score >= .45 && result.regions >= .34;
  }

  function evenlySpacedStroke(stroke, gap = 8) {
    if (stroke.length < 2) return stroke;
    const points = [];
    for (let index = 1; index < stroke.length; index += 1) {
      const start = stroke[index - 1];
      const end = stroke[index];
      const steps = Math.max(1, Math.ceil(Math.hypot(end.x - start.x, end.y - start.y) / gap));
      for (let step = 0; step < steps; step += 1) {
        const amount = step / steps;
        points.push([
          (start.x + (end.x - start.x) * amount) * .4,
          (start.y + (end.y - start.y) * amount) * .4
        ]);
      }
    }
    const last = stroke[stroke.length - 1];
    points.push([last.x * .4, last.y * .4]);
    return points;
  }

  function usableDrawingStrokes() {
    return drawingStrokes
      .filter(stroke => strokeLength(stroke) >= 20)
      .map(stroke => evenlySpacedStroke(stroke))
      .filter(stroke => stroke.length >= 2);
  }

  function prepareRecognizer(strokes = usableDrawingStrokes()) {
    const recognizer = window.KanjiCanvas;
    if (!recognizer?.refPatterns?.length || !ui.drawingRecognizer || !strokes.length) return null;
    const id = ui.drawingRecognizer.id;
    recognizer[`canvas_${id}`] = ui.drawingRecognizer;
    recognizer[`ctx_${id}`] = ui.drawingRecognizer.getContext("2d");
    recognizer[`w_${id}`] = ui.drawingRecognizer.width;
    recognizer[`h_${id}`] = ui.drawingRecognizer.height;
    recognizer[`recordedPattern_${id}`] = strokes;
    return { recognizer, id };
  }

  function expectedPatternAssessment(word) {
    const prepared = prepareRecognizer();
    if (!prepared) return null;
    const { recognizer, id } = prepared;
    const reference = recognizer.refPatterns.find(pattern => pattern[0] === word)?.[2];
    if (!reference?.length) return null;
    try {
      const normalized = recognizer.momentNormalize(id);
      const features = recognizer.extractFeatures(normalized, 20);
      let strokeMap = recognizer.getMap(reference, features, recognizer.initialDistance);
      strokeMap = recognizer.completeMap(reference, features, recognizer.wholeWholeDistance, strokeMap);
      const divisor = Math.max(1, Math.min(reference.length, features.length));
      return {
        distance: recognizer.computeWholeDistanceWeighted(reference, features, strokeMap) / divisor,
        drawnStrokes: features.length,
        expectedStrokes: reference.length
      };
    } catch {
      return null;
    }
  }

  function handwritingCandidates() {
    const prepared = prepareRecognizer();
    if (!prepared) return [];
    const { recognizer, id } = prepared;
    try {
      const result = recognizer.recognize(id) || "";
      return result.trim().split(/\s+/).filter(Boolean);
    } catch {
      return [];
    }
  }

  function recognizedHandwriting(word, candidates, similarity) {
    const rank = candidates.indexOf(word);
    if (rank < 0) return false;
    if (rank < 3) return similarity.score >= .42 && similarity.regions >= .32;
    return rank < 8 && similarity.precision >= .6 && similarity.regions >= .58;
  }

  function expectedPatternEnough(word, expectedStrokes, candidates, assessment) {
    // For larger kanji, a whole-picture silhouette is not enough: a different
    // right- or left-hand component can overlap much of the same area. Compare
    // the player's individual strokes with this exact kanji's reference.
    if (expectedStrokes < 7 || !assessment) return true;
    const rank = candidates.indexOf(word);
    return assessment.distance <= 32 || (rank >= 0 && rank < 8 && assessment.distance <= 48);
  }

  function strokeBounds(stroke) {
    const xs = stroke.map(point => point.x);
    const ys = stroke.map(point => point.y);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    const top = Math.min(...ys);
    const bottom = Math.max(...ys);
    return { left, right, top, bottom, width: right - left, height: bottom - top };
  }

  function forgivingMouthStructure(word, strokes) {
    if (word !== "口" || strokes.length < 3 || strokes.length > 4) return false;
    const allPoints = strokes.flat();
    const whole = strokeBounds(allPoints);
    if (!whole.width || !whole.height) return false;
    const aspect = whole.width / whole.height;
    if (aspect < .38 || aspect > 1.55) return false;

    const parts = strokes.map(strokeBounds);
    const leftSide = parts.some(part =>
      part.height >= whole.height * .45
      && part.width <= whole.width * .4
      && (part.left + part.right) / 2 <= whole.left + whole.width * .45);
    const topAndRight = parts.some(part =>
      part.width >= whole.width * .45
      && part.height >= whole.height * .4
      && part.top <= whole.top + whole.height * .22
      && part.right >= whole.left + whole.width * .72);
    const bottomSide = parts.some(part =>
      part.width >= whole.width * .42
      && part.height <= whole.height * .32
      && part.bottom >= whole.top + whole.height * .78);
    return leftSide && topAndRight && bottomSide;
  }

  function forgivingSoundStructure(word, strokes) {
    if (word !== "音" || strokes.length < 7 || strokes.length > 11) return false;
    const whole = strokeBounds(strokes.flat());
    if (!whole.width || !whole.height) return false;
    const aspect = whole.width / whole.height;
    if (aspect < .28 || aspect > 1.1) return false;

    const parts = strokes.map(strokeBounds);
    const centerX = part => ((part.left + part.right) / 2 - whole.left) / whole.width;
    const centerY = part => ((part.top + part.bottom) / 2 - whole.top) / whole.height;
    const centralTop = parts.some(part =>
      part.height >= whole.height * .16
      && part.width <= whole.width * .3
      && part.top <= whole.top + whole.height * .14
      && part.bottom <= whole.top + whole.height * .45
      && centerX(part) >= .3 && centerX(part) <= .7);
    const upperBar = parts.some(part =>
      part.width >= whole.width * .32
      && part.height <= whole.height * .2
      && centerY(part) >= .12 && centerY(part) <= .38);
    const dividerBar = parts.some(part =>
      part.width >= whole.width * .48
      && part.height <= whole.height * .2
      && centerY(part) >= .34 && centerY(part) <= .58);

    const lowerPoints = strokes.flat().filter(point => point.y >= whole.top + whole.height * .54);
    if (lowerPoints.length < 4) return false;
    const lower = strokeBounds(lowerPoints);
    const lowerCenter = (lower.left + lower.right) / 2;
    const lowerCentered = lowerCenter >= whole.left + whole.width * .28
      && lowerCenter <= whole.left + whole.width * .72;
    const lowerBody = lower.width >= whole.width * .2 && lower.height >= whole.height * .3 && lowerCentered;
    const lowerParts = parts.filter(part => part.bottom >= whole.top + whole.height * .62);
    const lowerTall = lowerParts.some(part =>
      part.height >= lower.height * .55 && part.bottom >= lower.top + lower.height * .82);
    const loopLike = lowerParts.some(part => part.width >= lower.width * .55 && part.height >= lower.height * .55);
    const lowerBars = lowerParts.filter(part =>
      part.width >= lower.width * .4 && part.height <= lower.height * .24).length;
    const upperDetailCount = parts.filter(part => part.bottom <= whole.top + whole.height * .52).length;

    return centralTop && upperBar && dividerBar && lowerBody && lowerTall
      && lowerBars >= (loopLike ? 1 : 2) && upperDetailCount >= 4;
  }

  function forgivingVehicleStructure(word, strokes) {
    if (word !== "車" || strokes.length < 6 || strokes.length > 9) return false;
    const whole = strokeBounds(strokes.flat());
    if (!whole.width || !whole.height) return false;
    const aspect = whole.width / whole.height;
    if (aspect < .34 || aspect > 1.15) return false;

    const parts = strokes.map(strokeBounds);
    const centerX = part => ((part.left + part.right) / 2 - whole.left) / whole.width;
    const centerY = part => ((part.top + part.bottom) / 2 - whole.top) / whole.height;
    const centralLine = parts.some(part =>
      part.height >= whole.height * .7
      && part.width <= whole.width * .28
      && part.top <= whole.top + whole.height * .16
      && part.bottom >= whole.top + whole.height * .8
      && centerX(part) >= .34 && centerX(part) <= .66);
    const topBar = parts.some(part =>
      part.width >= whole.width * .5
      && part.height <= whole.height * .2
      && centerY(part) <= .3);
    const middleBar = parts.some(part =>
      part.width >= whole.width * .34
      && part.height <= whole.height * .2
      && centerY(part) >= .32 && centerY(part) <= .66);
    const bottomBar = parts.some(part =>
      part.width >= whole.width * .52
      && part.height <= whole.height * .18
      && centerY(part) >= .78);

    const middlePoints = strokes.flat().filter(point =>
      point.y >= whole.top + whole.height * .26
      && point.y <= whole.top + whole.height * .7);
    if (middlePoints.length < 4) return false;
    const middle = strokeBounds(middlePoints);
    const middleCenter = (middle.left + middle.right) / 2;
    const middleBody = middle.width >= whole.width * .38
      && middle.height >= whole.height * .24
      && middleCenter >= whole.left + whole.width * .25
      && middleCenter <= whole.left + whole.width * .75;
    const sideOrLoop = parts.some(part =>
      part.height >= whole.height * .22
      && part.width >= whole.width * .18
      && centerY(part) >= .3 && centerY(part) <= .68);

    return centralLine && topBar && middleBar && bottomBar && middleBody && sideOrLoop;
  }

  function forgivingSeeStructure(word, strokes) {
    if (word !== "見" || strokes.length < 5 || strokes.length > 9) return false;
    const whole = strokeBounds(strokes.flat());
    if (!whole.width || !whole.height) return false;
    const aspect = whole.width / whole.height;
    if (aspect < .28 || aspect > 1.05) return false;

    const parts = strokes.map(strokeBounds);
    const centerX = part => ((part.left + part.right) / 2 - whole.left) / whole.width;
    const centerY = part => ((part.top + part.bottom) / 2 - whole.top) / whole.height;
    const eyeLeft = parts.some(part =>
      part.height >= whole.height * .38
      && part.width <= whole.width * .3
      && part.top <= whole.top + whole.height * .14
      && centerX(part) <= .48);
    const eyeTopAndRight = parts.some(part =>
      part.width >= whole.width * .28
      && part.height >= whole.height * .3
      && part.top <= whole.top + whole.height * .15
      && part.right >= whole.left + whole.width * .6);
    const eyeBars = parts.filter(part =>
      part.width >= whole.width * .24
      && part.height <= whole.height * .22
      && centerY(part) >= .16 && centerY(part) <= .6).length;

    const leftLeg = parts.some(part =>
      part.height >= whole.height * .3
      && part.bottom >= whole.top + whole.height * .87
      && part.left <= whole.left + whole.width * .35
      && centerX(part) <= .52);
    const rightLeg = parts.some(part =>
      part.height >= whole.height * .24
      && part.bottom >= whole.top + whole.height * .75
      && part.right >= whole.left + whole.width * .64
      && centerX(part) >= .42);
    const lowerPoints = strokes.flat().filter(point => point.y >= whole.top + whole.height * .52);
    if (lowerPoints.length < 5) return false;
    const lower = strokeBounds(lowerPoints);
    const twoFeet = lower.width >= whole.width * .48 && lower.height >= whole.height * .3;

    return eyeLeft && eyeTopAndRight && eyeBars >= 2 && leftLeg && rightLeg && twoFeet;
  }

  function drawingSimilarity() {
    const size = 128;
    const drawn = fixedInkMask(ui.drawingCanvas, size);
    const correctShape = fixedInkMask(ui.drawingGuide, size);
    const positioned = compareMasks(drawn, correctShape, size, 7, 5);
    // The normalized check ignores where the child started and uses a wider
    // allowance for the small jumps and joined corners made by a controller pad.
    const shapeOnly = compareMasks(normalizedMask(drawn, size), normalizedMask(correctShape, size), size, 9, 4);
    if (positionedEnough(positioned)) return { ...positioned, passed: true };
    return { ...shapeOnly, passed: shapeEnough(shapeOnly) };
  }

  function judgeDrawing(question) {
    const expectedStrokes = Number(STROKE_COUNTS[question.word]) || 1;
    const realStrokes = drawingStrokes.filter(stroke => strokeLength(stroke) >= 20);
    if (!realStrokes.length) return { correct: false, message: "線が みじかすぎるよ。もういちど 大きく かこう。" };
    const points = realStrokes.flat();
    const width = Math.max(...points.map(point => point.x)) - Math.min(...points.map(point => point.x));
    const height = Math.max(...points.map(point => point.y)) - Math.min(...points.map(point => point.y));
    if (Math.max(width, height) < ui.drawingCanvas.width * .25) {
      return { correct: false, message: "小さすぎるよ。白い ところを もっと つかって かこう。" };
    }
    const minimumStrokes = expectedStrokes < 4 ? expectedStrokes : Math.ceil(expectedStrokes * .7);
    if (realStrokes.length < minimumStrokes) {
      return { correct: false, message: `大事な線が たりないよ。${minimumStrokes}かく いじょうを めやすに かこう。` };
    }
    const similarity = drawingSimilarity();
    const candidates = handwritingCandidates();
    const expectedPattern = expectedPatternAssessment(question.word);
    const structurePassed = expectedPatternEnough(question.word, expectedStrokes, candidates, expectedPattern);
    const forgivingMouth = forgivingMouthStructure(question.word, realStrokes);
    const forgivingSound = forgivingSoundStructure(question.word, realStrokes);
    const forgivingVehicle = forgivingVehicleStructure(question.word, realStrokes);
    const forgivingSee = forgivingSeeStructure(question.word, realStrokes);
    if (!structurePassed && !forgivingSound && !forgivingVehicle && !forgivingSee) {
      return { correct: false, message: "かんじの ぶぶんが ちがうよ。ひだり・みぎ・うえ・したの かたちを みなおそう。" };
    }
    if (question.word === "口" && !forgivingMouth) {
      return { correct: false, message: "「口」は、ひだり・うえとみぎ・したの 三つの線で かこう。小さな すきまは だいじょうぶだよ。" };
    }
    const recognized = recognizedHandwriting(question.word, candidates, similarity);
    if (!similarity.passed && !recognized && !forgivingMouth && !forgivingSound && !forgivingVehicle && !forgivingSee) {
      return { correct: false, message: "かたちが ちがうよ。線の むきと つながりを みなおそう。" };
    }
    if (forgivingMouth) {
      return { correct: true, message: "三つの線で「口」のかたちに かけたよ！ 小さな すきまが あっても だいじょうぶ。" };
    }
    if (forgivingSound) {
      return { correct: true, message: "上の「立」と 下の「日」が わかる「音」に かけたよ！ タッチパッドの ゆれは だいじょうぶ。" };
    }
    if (forgivingVehicle) {
      return { correct: true, message: "まんなかの 長い線と、上下・中の かたちが わかる「車」に かけたよ！ タッチパッドの ゆれは だいじょうぶ。" };
    }
    if (forgivingSee) {
      return { correct: true, message: "上の「目」と 下の 二つのあしが わかる「見」に かけたよ！ 線が つながっても だいじょうぶ。" };
    }
    const strokeTip = realStrokes.length === expectedStrokes ? "" : ` お手本は ${expectedStrokes}かくだよ。`;
    return { correct: true, message: `お手本と よく にた かたちに かけたよ！${strokeTip}` };
  }

  function checkDrawingAnswer() {
    if (answered || drawingLocked) return;
    if (!drawingStrokes.length) {
      ui.drawingCanvas.classList.remove("needs-answer");
      void ui.drawingCanvas.offsetWidth;
      ui.drawingCanvas.classList.add("needs-answer");
      return;
    }
    const question = questions[current];
    const result = judgeDrawing(question);
    answered = true;
    drawingLocked = true;
    setGamepadPen(false);
    ui.drawingCanvas.classList.add("locked");
    updateDrawingControls();
    if (result.correct) score += 1;
    const nextProgress = recordAttempt(question, result.correct);
    ui.score.textContent = score;
    answerMascot(result.correct);
    ui.feedback.hidden = false;
    ui.feedback.classList.toggle("wrong", !result.correct);
    ui.feedbackIcon.textContent = result.correct ? "○" : "△";
    ui.feedbackTitle.textContent = result.correct ? "せいかい！" : `ONE MORE TIME! こたえは「${question.word}」`;
    ui.feedbackCopy.textContent = `${result.message} 「${meaningFor(question.word)}」は「${question.word}」。 ${nextLevelCopy(nextProgress.difficulty)}`;
    ui.next.textContent = current === questions.length - 1 ? "けっかを みる →" : "つぎの もんだい →";
    ui.next.hidden = false;
    updateControllerUi();
    ui.next.focus();
  }

  function nextQuestion() {
    if (!answered) return;
    current += 1;
    if (current < questions.length) renderQuestion();
    else showResult();
  }

  function showResult() {
    const total = questions.length;
    const ratio = score / total;
    const perfect = score === total;
    if (perfect && activeGroup) makeGroupPerfect(activeGroup.id);
    const key = `kanjiQuizBest-${activeGroup?.id || selectedGrade}`;
    const previousBest = Number(localStorage.getItem(key) || 0);
    const best = Math.max(previousBest, score);
    localStorage.setItem(key, String(best));

    const result = ratio === 1
      ? ["かんぺき！", "かんじマスターだね！", "王"]
      : ratio >= .7
        ? ["すごい！", "とっても よくできました！", "★"]
        : ratio >= .4
          ? ["いいちょうし！", "もういちど やったら もっとできるよ！", "字"]
          : ["がんばったね！", "ゆっくり おぼえていこう！", "芽"];

    ui.finalScore.textContent = score;
    ui.resultTitle.textContent = result[0];
    ui.resultMessage.textContent = result[1];
    ui.resultBadge.textContent = result[2];
    ui.resultTotal.textContent = `/ ${total}もん`;
    ui.resultGrade.textContent = `${labelFor(selectedGrade)}・グループ ${activeGroup?.number || ""}の けっか`;
    ui.best.textContent = perfect
      ? activeGroupWasDue ? "★ PERFECT！ また おぼえたよ！" : "★ PERFECT！"
      : activeGroupWasDue ? "むらさきのまま：ONE MORE TIME" : `ベスト：${best} / ${total}`;
    ui.retry.textContent = perfect ? "グループへ もどる" : "ONE MORE TIME";
    show("result");
  }

  function returnToStart() {
    setActiveGrade();
    renderGroups();
    show("start");
  }

  function showGradeGroups(grade) {
    if (ui.start.hidden) {
      renderGroups();
      show("start");
    }
    setActiveGrade(grade);
    requestAnimationFrame(() => document.querySelector(`#grade-groups-${grade}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function buildControllerKeyboard() {
    const keys = [
      ..."abcdefghijklmnopqrstuvwxyz".split("").map(letter => ({ label: letter, value: letter })),
      { label: "SPACE", value: "space", wide: true },
      { label: "⌫", value: "backspace", wide: true },
      { label: "ANSWER", value: "answer", answer: true }
    ];
    keys.forEach(key => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `controller-key${key.wide ? " controller-key-wide" : ""}${key.answer ? " controller-key-answer" : ""}`;
      button.textContent = key.label;
      button.dataset.controllerKey = key.value;
      button.addEventListener("click", () => useControllerKeyboardKey(key.value));
      ui.controllerKeyboard.append(button);
    });
  }

  function useControllerKeyboardKey(key) {
    if (answered || ui.writeAnswer.disabled) return;
    if (key === "answer") {
      chooseWrittenAnswer();
      return;
    }
    if (key === "backspace") ui.writeAnswer.value = ui.writeAnswer.value.slice(0, -1);
    else if (key === "space") {
      if (ui.writeAnswer.value && !ui.writeAnswer.value.endsWith(" ")) ui.writeAnswer.value += " ";
    } else ui.writeAnswer.value += key;
    ui.writeAnswer.classList.remove("needs-answer");
    ui.writeAnswer.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function controllerInputActive() {
    return controllerConnected || keyboardControllerMode || Boolean(hidTouchpad?.opened);
  }

  function controllerDrawingActive() {
    return controllerInputActive() && !activeDialog() && !ui.quiz.hidden && questionLevel >= 3 && !answered;
  }

  function updateControllerUi() {
    const controllerActive = controllerInputActive();
    const writingAnswer = controllerActive && !ui.quiz.hidden && questionLevel === 2 && !answered;
    const writingEnglish = writingAnswer && readSettings().answerLanguage === "english";
    const drawing = controllerDrawingActive();
    document.body.classList.toggle("gamepad-active", controllerActive);
    ui.controllerNotice.hidden = !controllerActive || ui.start.hidden;
    ui.controllerKeyboard.hidden = !writingEnglish;
    ui.drawingControllerHint.hidden = !drawing;
    ui.gamepadDrawingCursor.hidden = !drawing;
    if (drawing) {
      const motion = questionLevel === 4;
      ui.drawingControllerCopy.textContent = motion
        ? "R2を おして コントローラーを うごかすか、L2を おして タッチパッドで かく"
        : "タッチパッドで ばしょを きめて、L2を おしながら なぞる";
      ui.drawingControllerEnglish.textContent = motion
        ? "HOLD R2 + MOVE CONTROLLER · HOLD L2 + TOUCHPAD"
        : "MOVE TO AIM · HOLD L2 AND SLIDE TO DRAW";
      ui.drawingL2Hint.innerHTML = motion ? "<kbd>L2</kbd> タッチパッド" : "<kbd>L2</kbd> かく";
      ui.drawingR2Hint.innerHTML = motion ? "<kbd>R2</kbd> モーション" : "<kbd>R2</kbd> チェック";
      ui.drawingCheckHint.hidden = !motion;
      ui.connectTouchpad.textContent = hidTouchpad?.opened
        ? motion ? "✓ MOTION + TOUCHPAD CONNECTED" : "✓ TOUCHPAD CONNECTED"
        : motion ? "モーション + タッチパッドを つなぐ" : "タッチパッドを つなぐ / CONNECT TOUCHPAD";
    }
    if (!controllerActive) return;
    ui.controllerNoticeTitle.textContent = `🎮 ${controllerName}`;
    ui.controllerNoticeText.textContent = drawing
      ? questionLevel === 4
        ? "R2：コントローラーをうごかしてかく・L2：タッチパッドでかく・L1：もどす・R1：けす・✕/OPTIONS：チェック"
        : "タッチパッド：ばしょ・L2：かく・L1：ひとつけす・R1：ぜんぶけす・R2：チェック"
      : writingEnglish
        ? "L3：マイク入力・方向キー：文字・✕：入力・□：1文字けす・OPTIONS：こたえる"
        : writingAnswer
          ? "L3：日本語のよみをマイク入力・OPTIONS：こたえる"
        : "方向キーで うごく・✕で えらぶ・○で もどる";
  }

  function visibleControllerButtons() {
    const scope = activeDialog() || document;
    return [...scope.querySelectorAll("button:not([disabled]), input:not([disabled])")].filter(button => {
      const style = getComputedStyle(button);
      return !button.hidden && style.display !== "none" && style.visibility !== "hidden" && button.getClientRects().length > 0;
    });
  }

  function focusControllerTarget(target) {
    if (!target) return;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function focusDefaultControllerTarget() {
    let target = null;
    const dialog = activeDialog();
    if (dialog) {
      target = dialog.querySelector("button:not([disabled]), input:not([disabled])");
    } else if (!ui.quiz.hidden) {
      if (answered && !ui.next.hidden) target = ui.next;
      else if (questionLevel === 1) target = ui.answers.querySelector("button:not([disabled])");
      else if (questionLevel === 2) target = readSettings().answerLanguage === "english"
        ? ui.controllerKeyboard.querySelector("button")
        : ui.mascotTalk;
      else if (questionLevel >= 3) target = ui.drawingCanvas;
      target ||= ui.back;
    } else if (!ui.result.hidden) {
      target = ui.retry;
    } else {
      target = ui.groupList.querySelector("button") || ui.sideGrades.querySelector("button");
    }
    focusControllerTarget(target);
  }

  function moveControllerFocus(directionX, directionY) {
    const buttons = visibleControllerButtons();
    if (!buttons.length) return;
    const currentButton = buttons.includes(document.activeElement) ? document.activeElement : null;
    if (!currentButton) {
      focusDefaultControllerTarget();
      return;
    }
    const currentBox = currentButton.getBoundingClientRect();
    const currentX = currentBox.left + currentBox.width / 2;
    const currentY = currentBox.top + currentBox.height / 2;
    const ranked = buttons.filter(button => button !== currentButton).map(button => {
      const box = button.getBoundingClientRect();
      const deltaX = box.left + box.width / 2 - currentX;
      const deltaY = box.top + box.height / 2 - currentY;
      const forward = deltaX * directionX + deltaY * directionY;
      const sideways = Math.abs(deltaX * directionY - deltaY * directionX);
      return { button, forward, score: forward + sideways * 2.2 };
    }).filter(candidate => candidate.forward > 4).sort((first, second) => first.score - second.score);
    if (ranked[0]) focusControllerTarget(ranked[0].button);
  }

  function controllerBack() {
    if (activeDialog()) closeGameDialog();
    else if (!ui.quiz.hidden) ui.back.click();
    else if (!ui.result.hidden) ui.changeGrade.click();
  }

  function activateControllerTarget() {
    if (activeDialog()) {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement && active.type === "checkbox") active.click();
      else if (active instanceof HTMLButtonElement && !active.disabled) active.click();
      else focusDefaultControllerTarget();
      return;
    }
    if (!ui.quiz.hidden && answered && !ui.next.hidden) {
      ui.next.click();
      return;
    }
    const active = document.activeElement;
    if (active instanceof HTMLButtonElement && !active.disabled && active.getClientRects().length) active.click();
    else focusDefaultControllerTarget();
  }

  function handleGamepadButton(buttonIndex) {
    const directions = { 12: [0, -1], 13: [0, 1], 14: [-1, 0], 15: [1, 0] };
    const direction = directions[buttonIndex];
    if (buttonIndex === 10 && !ui.quiz.hidden) {
      startAnswerDictation();
      return;
    }
    if (controllerDrawingActive()) {
      if (direction) moveGamepadCursor(...direction);
      else if (buttonIndex === 0) ui.checkDrawing.click();
      else if (buttonIndex === 1) controllerBack();
      else if (buttonIndex === 2) ui.undoDrawing.click();
      else if (buttonIndex === 3) ui.clearDrawing.click();
      else if (buttonIndex === 4) ui.undoDrawing.click();
      else if (buttonIndex === 5) ui.clearDrawing.click();
      else if (buttonIndex === 6 && questionLevel < 4) setGamepadPen(true);
      else if (buttonIndex === 7 && questionLevel === 4) {
        gamepadR2Pressed = true;
        syncMotionPen();
      }
      else if (buttonIndex === 7) ui.checkDrawing.click();
      else if (buttonIndex === 9) ui.checkDrawing.click();
      return;
    }
    if (direction) {
      moveControllerFocus(...direction);
      return;
    }
    if (buttonIndex === 0) activateControllerTarget();
    else if (buttonIndex === 1) controllerBack();
    else if (buttonIndex === 2 && !ui.quiz.hidden && questionLevel === 2 && !answered) useControllerKeyboardKey("backspace");
    else if (buttonIndex === 3 && !ui.quiz.hidden && questionLevel === 2 && !answered) ui.writeAnswer.value = "";
    else if (buttonIndex === 9 && !ui.quiz.hidden && questionLevel === 2 && !answered) chooseWrittenAnswer();
  }

  function handleGamepadButtonRelease(buttonIndex) {
    if (buttonIndex === 6 && !ui.quiz.hidden && questionLevel === 3) setGamepadPen(false);
    if (buttonIndex === 7 && !ui.quiz.hidden && questionLevel === 4) {
      gamepadR2Pressed = false;
      syncMotionPen();
    }
    if (buttonIndex === 0 && !controllerConnected && !ui.quiz.hidden && questionLevel >= 3) setGamepadPen(false);
  }

  function connectedGamepad() {
    try {
      return [...(navigator.getGamepads?.() || [])].find(Boolean) || null;
    } catch {
      return null;
    }
  }

  function recognizeController(pad) {
    const id = String(pad?.id || "");
    return /dualsense|playstation|wireless controller|054c/i.test(id) ? "PS5 コントローラー" : "コントローラー";
  }

  function gamepadButtonPressed(pad, index) {
    const button = pad.buttons?.[index];
    return Boolean(button && (button.pressed || button.value > .55));
  }

  function rawPlayStationController(pad) {
    return pad.mapping !== "standard" && /dualsense|playstation|wireless controller|054c/i.test(String(pad.id || ""));
  }

  function physicalButtonFor(pad, logicalButton) {
    if (!rawPlayStationController(pad)) return logicalButton;
    return ({ 0: 1, 1: 2, 2: 0, 3: 3, 9: 9 })[logicalButton] ?? logicalButton;
  }

  function gamepadDirections(pad) {
    const directions = {
      up: gamepadButtonPressed(pad, 12),
      down: gamepadButtonPressed(pad, 13),
      left: gamepadButtonPressed(pad, 14),
      right: gamepadButtonPressed(pad, 15)
    };
    const axes = pad.axes || [];
    [[0, 1], [4, 5], [6, 7]].forEach(([horizontalIndex, verticalIndex]) => {
      const horizontal = Number(axes[horizontalIndex]) || 0;
      const vertical = Number(axes[verticalIndex]) || 0;
      directions.left ||= horizontal < -.65;
      directions.right ||= horizontal > .65;
      directions.up ||= vertical < -.65;
      directions.down ||= vertical > .65;
    });

    // Some browsers expose an unmapped controller's D-pad as a single hat axis.
    // These ranges match the raw DualSense/DualShock layout used by Chromium.
    const hat = Number(axes[9]);
    if (Number.isFinite(hat) && hat !== 0) {
      directions.up ||= (hat >= -1 && hat < -.7) || (hat >= .95 && hat <= 1);
      directions.right ||= hat >= -.75 && hat < -.1;
      directions.down ||= hat >= -.2 && hat < .45;
      directions.left ||= hat >= .4 && hat <= 1;
    }
    return directions;
  }

  function updateGamepadControl(key, pressed, buttonIndex, time, repeats = false) {
    const state = gamepadButtonState.get(key) || { down: false, repeatAt: 0 };
    if (pressed && !state.down) {
      state.down = true;
      state.repeatAt = time + 280;
      handleGamepadButton(buttonIndex);
    } else if (pressed && repeats && time >= state.repeatAt) {
      state.repeatAt = time + (controllerDrawingActive() ? 55 : 115);
      handleGamepadButton(buttonIndex);
    } else if (!pressed) {
      if (state.down) handleGamepadButtonRelease(buttonIndex);
      state.down = false;
    }
    gamepadButtonState.set(key, state);
  }

  function pollGamepad(time) {
    const pad = connectedGamepad();
    if (!!pad !== controllerConnected) {
      controllerConnected = !!pad;
      gamepadButtonState.clear();
      if (pad) controllerName = recognizeController(pad);
      else {
        gamepadR2Pressed = false;
        setGamepadPen(false);
      }
      updateControllerUi();
      if (pad) requestAnimationFrame(focusDefaultControllerTarget);
    }
    updateTouchpadDrawing(pad);
    if (pad) {
      [0, 1, 2, 3, 4, 5, 6, 7, 9, 10].forEach(logicalButton => {
        const physicalButton = physicalButtonFor(pad, logicalButton);
        updateGamepadControl(`button-${logicalButton}`, gamepadButtonPressed(pad, physicalButton), logicalButton, time);
      });
      const directions = gamepadDirections(pad);
      updateGamepadControl("direction-up", directions.up, 12, time, true);
      updateGamepadControl("direction-down", directions.down, 13, time, true);
      updateGamepadControl("direction-left", directions.left, 14, time, true);
      updateGamepadControl("direction-right", directions.right, 15, time, true);
    }
    requestAnimationFrame(pollGamepad);
  }

  ui.sideGrades.addEventListener("click", event => {
    const button = event.target.closest("[data-grade]");
    if (button) showGradeGroups(button.dataset.grade);
  });
  ui.next.addEventListener("click", nextQuestion);
  ui.back.addEventListener("click", returnToStart);
  ui.writeForm.addEventListener("submit", event => {
    event.preventDefault();
    chooseWrittenAnswer();
  });
  ui.drawingCanvas.addEventListener("pointerdown", startDrawing);
  ui.drawingCanvas.addEventListener("pointermove", continueDrawing);
  ui.drawingCanvas.addEventListener("pointerup", stopDrawing);
  ui.drawingCanvas.addEventListener("pointercancel", stopDrawing);
  ui.undoDrawing.addEventListener("click", () => {
    if (drawingLocked) return;
    setGamepadPen(false);
    stopTouchpadDrawing();
    drawingStrokes.pop();
    activeStroke = null;
    redrawDrawing();
    updateDrawingControls();
  });
  ui.clearDrawing.addEventListener("click", () => {
    if (drawingLocked) return;
    setGamepadPen(false);
    stopTouchpadDrawing();
    drawingStrokes = [];
    activeStroke = null;
    redrawDrawing();
    updateDrawingControls();
  });
  ui.checkDrawing.addEventListener("click", checkDrawingAnswer);
  ui.connectTouchpad.addEventListener("click", requestHidTouchpad);
  ui.mascotTalk.addEventListener("click", startAnswerDictation);
  ui.retry.addEventListener("click", () => score === questions.length ? returnToStart() : startQuiz(activeGroup));
  ui.changeGrade.addEventListener("click", returnToStart);
  ui.help.addEventListener("click", () => openGameDialog(ui.helpDialog, ui.help));
  ui.settings.addEventListener("click", () => openGameDialog(ui.settingsDialog, ui.settings));
  ui.privacy.addEventListener("click", () => openGameDialog(ui.helpDialog, ui.privacy));
  ui.fullscreen.addEventListener("click", toggleFullscreen);
  ui.resetProgress.addEventListener("click", resetSavedProgress);
  [ui.largeText, ui.contrast, ui.motion, ui.answerLanguage, ui.motionSensitivity, ui.touchpadSensitivity, ui.catVoice, ui.catVoiceVolume, ui.catVoiceStyle]
    .forEach(input => input.addEventListener("change", saveSettings));
  ui.motionSensitivity.addEventListener("input", () => { ui.motionSensitivityValue.textContent = `${Math.round(Number(ui.motionSensitivity.value) * 100)}%`; });
  ui.touchpadSensitivity.addEventListener("input", () => { ui.touchpadSensitivityValue.textContent = `${Math.round(Number(ui.touchpadSensitivity.value) * 100)}%`; });
  ui.catVoiceVolume.addEventListener("input", () => {
    ui.catVoiceVolumeValue.textContent = `${Math.round(Number(ui.catVoiceVolume.value))}%`;
    if (activeMascotAudio) activeMascotAudio.volume = Number(ui.catVoiceVolume.value) / 100;
  });
  ui.previewCatVoice.addEventListener("click", () => { void speakMascot("Nice!"); });
  document.querySelectorAll("[data-close-dialog]").forEach(button => {
    button.addEventListener("click", () => closeGameDialog(button.closest("dialog")));
  });
  [ui.helpDialog, ui.settingsDialog].forEach(dialog => {
    dialog.addEventListener("close", () => {
      updateControllerUi();
      const target = lastDialogTrigger;
      lastDialogTrigger = null;
      requestAnimationFrame(() => focusControllerTarget(target));
    });
  });
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  window.addEventListener("pagehide", () => stopAllVoice(false));
  document.addEventListener("keydown", event => {
    const arrowDirections = {
      ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0]
    };
    const arrowDirection = arrowDirections[event.key];
    if (!controllerConnected && arrowDirection) {
      event.preventDefault();
      keyboardControllerMode = true;
      controllerName = "PS5 / リモコン";
      updateControllerUi();
      if (controllerDrawingActive()) moveGamepadCursor(...arrowDirection);
      else moveControllerFocus(...arrowDirection);
      return;
    }
    if (!controllerConnected && keyboardControllerMode && controllerDrawingActive()) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setGamepadPen(true);
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        ui.undoDrawing.click();
        return;
      }
      if (event.key === "Delete") {
        event.preventDefault();
        ui.clearDrawing.click();
        return;
      }
    }
    if (ui.quiz.hidden) return;
    if (!answered && questionLevel === 1 && /^[1-4]$/.test(event.key)) {
      ui.answers.children[Number(event.key) - 1]?.click();
    } else if (answered && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      nextQuestion();
    }
  });

  document.addEventListener("keyup", event => {
    if (!controllerConnected && keyboardControllerMode && (event.key === "Enter" || event.key === " ")) {
      setGamepadPen(false);
    }
  });

  applySettings();
  updateFullscreenButton();
  buildControllerKeyboard();
  void refreshControllerSpeaker();
  navigator.mediaDevices?.addEventListener?.("devicechange", refreshControllerSpeaker);
  ui.drawingCanvas.tabIndex = 0;
  window.__kanjiQuizController = {
    press: handleGamepadButton,
    connected: () => controllerConnected || Boolean(hidTouchpad?.opened),
    hidReport: readDualSenseTouch,
    drawing: () => ({ cursor: { ...gamepadCursor }, penDown: gamepadPenDown || Boolean(touchpadStroke), strokes: drawingStrokes.length, mode: questionLevel === 4 ? "motion" : "touchpad" }),
    talk: startAnswerDictation,
    voice: () => ({ listening: Boolean(activeRecognition), mode: "answer-dictation" }),
    responseCount: () => MASCOT_RESPONSE_COUNT,
    practice: question => startQuiz({
      id: question.groupId || `practice-${question.word}`,
      grade: String(question.level || "1"),
      number: Number(question.groupNumber) || 1,
      items: [{ word: question.word, reading: question.reading, level: String(question.level || "1") }]
    })
  };
  navigator.hid?.addEventListener("disconnect", event => {
    if (event.device !== hidTouchpad) return;
    hidTouch = null;
    hidL2Pressed = false;
    hidR2Pressed = false;
    gamepadR2Pressed = false;
    hidTouchSeen = false;
    hidMotionSeen = false;
    hidMotion = { x: 0, y: 0, z: 0, lastAt: 0 };
    hidSpeakerConfigured = false;
    hidTouchpad = null;
    ui.connectTouchpad.disabled = false;
    ui.connectTouchpad.textContent = "コントローラーを つなぐ / CONNECT CONTROLLER";
    setTouchpadStatus("コントローラーが きれたよ。つないで ボタンを おしてね", "error");
    updateControllerUi();
  });
  restoreHidTouchpad();
  requestAnimationFrame(pollGamepad);
  migrateSavedProgress();
  renderGroups();
  show("start");
})();
