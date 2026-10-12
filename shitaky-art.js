(() => {
  "use strict";

  const actions = ["idle", "walk-right", "walk-left", "run-right", "run-left", "jump-right", "jump-left", "fall-right", "fall-left"];
  window.loadShitakySheets = async () => Object.fromEntries(await Promise.all(actions.map((action) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => image.naturalWidth === 320 && image.naturalHeight === 192
        ? resolve([action, image])
        : reject(new Error(`Shitaky ${action} sheet has an unexpected size`));
      image.onerror = () => reject(new Error(`Shitaky ${action} sheet could not load`));
      image.src = `./art/shitaky/${action}.png?v=2`;
    })
  )));
})();
