(() => {
  "use strict";

  // The generated dog is one fixed, five-color pixel glyph. Like Clawd's
  // animation, only small parts move; the head and body never redraw or drift.
  const FRAME_COUNT = 30;
  const WIDTH = 32;
  const HEIGHT = 24;
  const LEG_PATCHES = [
    { x: 5, width: 4, phase: 0 },
    { x: 10, width: 4, phase: Math.PI },
    { x: 17, width: 4, phase: Math.PI },
    { x: 22, width: 5, phase: 0 },
  ];

  function loadBase() {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        if (image.naturalWidth !== WIDTH || image.naturalHeight !== HEIGHT) {
          reject(new Error("Simple dog sprite has an unexpected size"));
          return;
        }
        resolve(image);
      };
      image.onerror = () => reject(new Error("Simple dog sprite could not load"));
      image.src = "./art/dog/simple-base.png";
    });
  }

  function drawTail(pen, base, action, frame) {
    const cycle = frame / FRAME_COUNT * Math.PI * 2;
    const arc = Math.sin(frame / (FRAME_COUNT - 1) * Math.PI);
    const lift = action === "jump" ? -1 - Math.round(arc)
      : action === "fall" ? Math.round(arc)
        : Math.round(Math.sin(cycle * (action === "walk" ? 2 : 1)));
    if (!lift) return;
    pen.clearRect(1, 8, 4, 7);
    pen.drawImage(base, 1, 8, 4, 7, 1, 8 + lift, 4, 7);
  }

  function drawLegs(pen, base, action, frame) {
    if (action === "idle") return;
    pen.clearRect(5, 20, 9, 2);
    pen.clearRect(17, 20, 11, 2);
    const cycle = frame / FRAME_COUNT * Math.PI * 2;
    const arc = Math.sin(frame / (FRAME_COUNT - 1) * Math.PI);
    for (const leg of LEG_PATCHES) {
      let shift = 0;
      let lift = 0;
      if (action === "walk") {
        const step = Math.sin(cycle + leg.phase);
        shift = step > 0.4 ? 1 : step < -0.4 ? -1 : 0;
        lift = Math.cos(cycle + leg.phase) > 0.35 ? 1 : 0;
      } else {
        const direction = leg.x < 15 ? 1 : -1;
        shift = direction * (action === "jump" ? 1 + Math.round(arc) : Math.round(1 - arc));
        lift = action === "jump" ? 1 + Math.round(arc * 2) : Math.round(arc * 2);
      }
      pen.drawImage(base, leg.x, 20, leg.width, 2,
        leg.x + shift, 20 - lift, leg.width, 2);
    }
  }

  function frameFor(base, action, frame) {
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const pen = canvas.getContext("2d");
    pen.imageSmoothingEnabled = false;
    pen.drawImage(base, 0, 0);
    drawTail(pen, base, action, frame);
    drawLegs(pen, base, action, frame);
    return canvas;
  }

  window.createDogAnimations = async () => {
    const base = await loadBase();
    return Object.fromEntries(["idle", "walk", "jump", "fall"].map((action) => [
      action, Array.from({ length: FRAME_COUNT }, (_, frame) => frameFor(base, action, frame))
    ]));
  };
})();
