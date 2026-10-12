(() => {
  "use strict";

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const artStatus = document.querySelector("#art-status");
  const prompt = document.querySelector("#portal-prompt");
  const promptName = document.querySelector("#portal-name");
  const enterButton = document.querySelector("#enter-portal");
  const requestDialog = document.querySelector("#request-dialog");
  const settingsDialog = document.querySelector("#settings-dialog");
  const PORTAL_GAP_PX = 24;
  const portals = [...document.querySelectorAll(".game-cover")].map((anchor) => ({
    x: 150, name: anchor.querySelector("strong").textContent, anchor
  }));
  const PLAYER_HEIGHT = 28;
  const FRAME_COUNT = 60;
  const STEP = 1 / 60;
  const GRAVITY = 9.81 * 80;
  const JUMP_HEIGHT = 58;
  const MAX_FALL_SPEED = 12 * 80;
  const player = { x: 35, y: 0, vx: 0, vy: 0, onGround: true, facing: 1, action: "idle", actionTime: 0, walkDistance: 0 };
  const keys = new Set();
  const touchKeys = new Set();
  const gamepadInput = { direction: 0, jump: false, run: false, play: false, menu: false, connected: false };
  let animations = null;
  let viewWidth = 0;
  let viewHeight = 0;
  let groundY = 0;
  let worldWidth = 0;
  let cameraX = 0;
  let nearPortal = null;
  let lastTime = 0;
  let accumulator = 0;
  let jumpBuffer = 0;
  let portalStep = 250;

  function resize() {
    const oldGround = groundY;
    const rect = canvas.getBoundingClientRect();
    viewWidth = Math.max(100, Math.round(rect.width / 3));
    viewHeight = Math.max(120, Math.round(rect.height / 3));
    canvas.width = viewWidth;
    canvas.height = viewHeight;
    ctx.imageSmoothingEnabled = false;
    groundY = viewHeight - 36;
    portals[0].x = viewWidth < 150 ? viewWidth / 2 : 150;
    const scale = canvas.clientWidth / viewWidth;
    const coverWidth = Math.max(...portals.map(({ anchor }) => anchor.offsetWidth));
    portalStep = Math.ceil((coverWidth + PORTAL_GAP_PX) / scale);
    for (let index = 1; index < portals.length; index++) portals[index].x = portals[0].x + index * portalStep;
    worldWidth = portals.at(-1).x + Math.max(140, viewWidth * 0.55);
    player.y = oldGround ? player.y + groundY - oldGround : groundY - PLAYER_HEIGHT;
    cameraX = Math.min(cameraX, Math.max(0, worldWidth - viewWidth));
    placeCovers();
  }

  function placeCovers() {
    const scale = canvas.clientWidth / viewWidth;
    const floorInset = canvas.clientHeight - groundY * scale;
    for (const portal of portals) {
      portal.anchor.style.left = Math.round((portal.x - cameraX) * scale - portal.anchor.offsetWidth / 2) + "px";
      portal.anchor.style.bottom = Math.round(floorInset + 3) + "px";
      portal.anchor.classList.toggle("near", portal === nearPortal);
    }
  }

  function pressJump() { jumpBuffer = 0.13; }
  const controlKeys = new Set(["arrowleft", "arrowright", "arrowup", "a", "d", "w", " ", "e", "enter", "shift"]);
  window.addEventListener("keydown", (event) => {
    if (requestDialog?.open || settingsDialog?.open ||
        (event.target.closest && event.target.closest("a, button, input, textarea, select, [contenteditable]"))) return;
    const key = event.key.toLowerCase();
    if (controlKeys.has(key)) event.preventDefault();
    if ((key === " " || key === "w" || key === "arrowup") && !keys.has(key)) pressJump();
    keys.add(key);
    if ((key === "e" || key === "enter") && nearPortal && !event.repeat) enterPortal(nearPortal);
  });
  window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
  window.addEventListener("blur", () => { keys.clear(); touchKeys.clear(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) { keys.clear(); touchKeys.clear(); } });
  for (const button of document.querySelectorAll("[data-control]")) {
    const control = button.dataset.control;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      touchKeys.add(control);
      button.classList.add("pressed");
      if (control === "jump") pressJump();
    });
    const release = () => { touchKeys.delete(control); button.classList.remove("pressed"); };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  }
  function enterPortal(portal) {
    window.location.href = portal.anchor.href;
  }
  enterButton.addEventListener("click", () => { if (nearPortal) enterPortal(nearPortal); });

  function pressed(pad, index) {
    return Boolean(pad.buttons?.[index]?.pressed || pad.buttons?.[index]?.value > 0.5);
  }
  function physicalButton(pad, logical) {
    const rawPlayStation = pad.mapping !== "standard" && /dualsense|playstation|wireless controller|054c/i.test(pad.id || "");
    return rawPlayStation ? ({ 0: 1, 2: 0 })[logical] ?? logical : logical;
  }
  function pollGamepad() {
    let pad = null;
    try { pad = Array.from(navigator.getGamepads?.() || []).find(Boolean) || null; }
    catch { /* Gamepad access is optional. */ }
    const connected = Boolean(pad);
    gamepadInput.connected = connected;
    const deviceMode = window.FizzSettings?.deviceMode || "auto";
    const useGamepad = deviceMode === "auto" || deviceMode === "controller";
    document.body.classList.toggle("gamepad-ready", connected && useGamepad);
    if (!pad) {
      gamepadInput.direction = 0;
      gamepadInput.jump = false;
      gamepadInput.run = false;
      gamepadInput.play = false;
      gamepadInput.menu = false;
      return;
    }
    const menu = pressed(pad, 9);
    if (menu && !gamepadInput.menu && !requestDialog?.open && !settingsDialog?.open) window.FizzSettings?.open();
    gamepadInput.menu = menu;
    if (settingsDialog?.open) {
      window.FizzSettings?.handleGamepad(pad);
      gamepadInput.direction = 0;
      gamepadInput.jump = false;
      gamepadInput.run = false;
      gamepadInput.play = false;
      return;
    }
    if (requestDialog?.open || !useGamepad) {
      gamepadInput.direction = 0;
      gamepadInput.jump = false;
      gamepadInput.run = false;
      gamepadInput.play = false;
      return;
    }
    const axis = Number(pad.axes?.[0]) || 0;
    const hat = Number(pad.axes?.[9]);
    const left = pressed(pad, 14) || axis < -0.25 || (Number.isFinite(hat) && hat >= 0.4 && hat <= 1);
    const right = pressed(pad, 15) || axis > 0.25 || (Number.isFinite(hat) && hat >= -0.75 && hat < -0.1);
    gamepadInput.direction = Number(right) - Number(left);
    const jump = pressed(pad, physicalButton(pad, 0)) || pressed(pad, 12);
    const play = pressed(pad, physicalButton(pad, 2)) || pressed(pad, 5);
    gamepadInput.run = pressed(pad, 7);
    if (jump && !gamepadInput.jump) pressJump();
    if (play && !gamepadInput.play && nearPortal) enterPortal(nearPortal);
    gamepadInput.jump = jump;
    gamepadInput.play = play;
  }

  function approach(value, target, amount) {
    return value < target ? Math.min(value + amount, target) : Math.max(value - amount, target);
  }
  function update(dt) {
    const left = keys.has("a") || keys.has("arrowleft") || touchKeys.has("left");
    const right = keys.has("d") || keys.has("arrowright") || touchKeys.has("right");
    const direction = Math.max(-1, Math.min(1, Number(right) - Number(left) + gamepadInput.direction));
    const running = keys.has("shift") || touchKeys.has("run") || gamepadInput.run;
    if (direction) player.facing = direction;
    player.vx = approach(player.vx, direction * (running ? 245 : 170), (direction ? 1000 : 1300) * dt);
    const oldX = player.x;
    player.x = Math.max(32, Math.min(worldWidth - 32, player.x + player.vx * dt));
    const moved = player.x - oldX;
    if (!moved && direction) player.vx = 0;
    if (player.onGround) player.walkDistance += Math.abs(moved);

    jumpBuffer = Math.max(0, jumpBuffer - dt);
    if (jumpBuffer > 0 && player.onGround) {
      const rise = Math.min(JUMP_HEIGHT, Math.max(24, groundY - PLAYER_HEIGHT - 12));
      player.vy = -Math.sqrt(2 * GRAVITY * rise);
      player.onGround = false;
      jumpBuffer = 0;
    }
    player.vy = Math.min(MAX_FALL_SPEED, player.vy + GRAVITY * dt);
    player.y += player.vy * dt;
    if (player.y + PLAYER_HEIGHT >= groundY) {
      player.y = groundY - PLAYER_HEIGHT;
      player.vy = 0;
      player.onGround = true;
    }

    const nextAction = !player.onGround ? (player.vy < 0 ? "jump" : "fall") : Math.abs(player.vx) > 12 && Math.abs(moved) > 0.01 ? (running ? "run" : "walk") : "idle";
    if (nextAction !== player.action) { player.action = nextAction; player.actionTime = 0; }
    else player.actionTime += dt;
    const targetCamera = Math.max(0, Math.min(worldWidth - viewWidth, player.x - viewWidth * 0.5));
    cameraX = targetCamera;
    nearPortal = player.onGround ? portals.find((portal, index) => {
      const range = index === 0 && viewWidth < 150
        ? Math.max(14, portal.x - 39)
        : Math.min(42, portalStep / 2 - 3);
      return Math.abs(portal.x - player.x) < range;
    }) || null : null;
    prompt.hidden = !nearPortal;
    if (nearPortal) promptName.textContent = nearPortal.name;
    placeCovers();
  }

  function draw() {
    ctx.clearRect(0, 0, viewWidth, viewHeight);
    ctx.fillStyle = "#ecd9b7";
    ctx.fillRect(0, groundY, viewWidth, viewHeight - groundY);
    ctx.fillStyle = "#bb775b";
    ctx.fillRect(0, groundY, viewWidth, 3);
    if (!animations) return;
    const frame = player.action === "walk" || player.action === "run"
      ? Math.floor(player.walkDistance / (player.action === "run" ? 3.4 : 5.5)) % FRAME_COUNT
      : player.action === "idle"
        ? Math.floor(player.actionTime * 24) % FRAME_COUNT
        : Math.min(FRAME_COUNT - 1, Math.floor(player.actionTime * 60));
    const direction = player.facing < 0 ? "left" : "right";
    const action = player.action === "walk" || player.action === "run" ? `${player.action}-${direction}` : player.action;
    const sheet = animations[action];
    const x = Math.round(player.x - cameraX - 32);
    const y = Math.round(player.y + PLAYER_HEIGHT - 50);
    ctx.drawImage(sheet, (frame % 10) * 32, Math.floor(frame / 10) * 32, 32, 32, x, y, 64, 64);
  }
  function loop(now) {
    if (!lastTime) lastTime = now;
    pollGamepad();
    accumulator += Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    while (accumulator >= STEP) { update(STEP); accumulator -= STEP; }
    draw();
    requestAnimationFrame(loop);
  }

  async function loadAnimations() {
    if (typeof window.loadShitakySheets !== "function") throw new Error("Shitaky art could not load");
    return window.loadShitakySheets();
  }
  function countClippedFrames(sheets) {
    let clipped = 0;
    const probe = document.createElement("canvas");
    probe.width = 320;
    probe.height = 192;
    const pen = probe.getContext("2d", { willReadFrequently: true });
    for (const sheet of Object.values(sheets)) {
      pen.clearRect(0, 0, 320, 192);
      pen.drawImage(sheet, 0, 0);
      const data = pen.getImageData(0, 0, 320, 192).data;
      for (let frame = 0; frame < FRAME_COUNT; frame++) {
        const ox = (frame % 10) * 32, oy = Math.floor(frame / 10) * 32;
        let edge = false;
        for (let y = 0; y < 32 && !edge; y++) for (let x = 0; x < 32; x++) {
          if ((x === 0 || y === 0 || x === 31 || y === 31) && data[((oy + y) * 320 + ox + x) * 4 + 3]) { edge = true; break; }
        }
        if (edge) clipped++;
      }
    }
    return clipped;
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(loop);
  loadAnimations().then((sheets) => {
    animations = sheets;
    artStatus.hidden = true;
    window.__shitakyArcade = window.__dogArcade = {
      animationCounts: Object.fromEntries(Object.keys(sheets).map((name) => [name, FRAME_COUNT])),
      clippedFrames: countClippedFrames(sheets),
      player,
      getFrame(action, index) {
        const sheet = sheets[action];
        if (!sheet || index < 0 || index >= FRAME_COUNT) return null;
        const sprite = document.createElement("canvas");
        sprite.width = sprite.height = 32;
        sprite.getContext("2d").drawImage(sheet, (index % 10) * 32, Math.floor(index / 10) * 32, 32, 32, 0, 0, 32, 32);
        return sprite;
      },
      get cameraX() { return cameraX; },
      get worldWidth() { return worldWidth; },
      gravity: GRAVITY,
      get nearPortal() { return nearPortal?.name || null; },
      get gamepad() { return { ...gamepadInput }; }
    };
  }).catch((error) => {
    artStatus.textContent = window.FizzSettings?.t("artError") || "Shitaky art could not load. Please refresh.";
    console.error(error);
  });
})();
