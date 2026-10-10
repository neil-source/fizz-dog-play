(() => {
  "use strict";

  // Each image-generated sheet holds 30 poses on a 5 x 6 grid. Keeping the
  // source pixels intact gives the dog a consistent silhouette in every pose.
  const ACTIONS = ["idle", "walk", "jump", "fall"];
  const COLUMNS = 5;
  const FRAMES = 30;
  const FRAME_WIDTH = 32;
  const FRAME_HEIGHT = 24;

  function loadSheet(action) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        if (image.naturalWidth !== COLUMNS * FRAME_WIDTH ||
            image.naturalHeight !== FRAMES / COLUMNS * FRAME_HEIGHT) {
          reject(new Error(`Dog ${action} sheet has an unexpected size`));
          return;
        }
        resolve(image);
      };
      image.onerror = () => reject(new Error(`Dog ${action} art could not load`));
      image.src = `./art/dog/${action}.png`;
    });
  }

  function framesFromSheet(sheet) {
    return Array.from({ length: FRAMES }, (_, index) => {
      const frame = document.createElement("canvas");
      frame.width = FRAME_WIDTH;
      frame.height = FRAME_HEIGHT;
      const pen = frame.getContext("2d");
      pen.imageSmoothingEnabled = false;
      pen.drawImage(
        sheet,
        (index % COLUMNS) * FRAME_WIDTH,
        Math.floor(index / COLUMNS) * FRAME_HEIGHT,
        FRAME_WIDTH, FRAME_HEIGHT,
        0, 0, FRAME_WIDTH, FRAME_HEIGHT
      );
      return frame;
    });
  }

  window.createDogAnimations = async () => Object.fromEntries(
    await Promise.all(ACTIONS.map(async (action) => [
      action, framesFromSheet(await loadSheet(action))
    ]))
  );
})();
