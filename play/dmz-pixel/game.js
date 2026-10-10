(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const mapCanvas = document.getElementById("minimap");
  const mctx = mapCanvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  mctx.imageSmoothingEnabled = false;

  const W = canvas.width;
  const H = canvas.height;
  const WORLD = { w: 2400, h: 1600 };
  const $ = (id) => document.getElementById(id);
  const ui = {
    loading: $("loading"), menu: $("menu"), hud: $("hud"), pause: $("pause"), result: $("result"),
    deploy: $("deployBtn"), resume: $("resumeBtn"), abort: $("abortBtn"), redeploy: $("redeployBtn"), menuBtn: $("menuBtn"),
    objective: $("objective"), timer: $("timer"), threatText: $("threatText"), threatBars: [...document.querySelectorAll(".threat-bars i")],
    crosshair: $("crosshair"), interact: $("interact"), toastStack: $("toastStack"),
    healthBar: $("healthBar"), armorBar: $("armorBar"), healthText: $("healthText"), armorText: $("armorText"),
    cashText: $("cashText"), medText: $("medText"), intelText: $("intelText"), magText: $("magText"), reserveText: $("reserveText"),
    sound: $("soundBtn"), resultPanel: $("resultPanel"), resultKicker: $("resultKicker"), resultTitle: $("resultTitle"),
    resultCopy: $("resultCopy"), resultCash: $("resultCash"), resultKills: $("resultKills"), resultTime: $("resultTime")
  };

  const input = { keys: new Set(), mouseX: W / 2, mouseY: H / 2, down: false };
  const camera = { x: 0, y: 0, shake: 0 };
  let state = "loading";
  let lastTime = performance.now();
  let gameTime = 360;
  let extractProgress = 0;
  let nearbyInteractable = null;
  let soundOn = true;
  let audio = null;
  let ambienceTimer = 0;
  let runSeed = 1;

  const images = {};
  const assets = {
    operator: "assets/operator.png",
    hostile: "assets/hostile.png",
    crate: "assets/supply-case.png"
  };

  const roads = [
    { x: 0, y: 690, w: 2400, h: 190, dir: "h" },
    { x: 1085, y: 0, w: 220, h: 1600, dir: "v" }
  ];

  const obstacles = [
    { x: 395, y: 190, w: 380, h: 270, type: "building", label: "WAREHOUSE 04" },
    { x: 1420, y: 150, w: 410, h: 245, type: "building", label: "COMMS" },
    { x: 320, y: 1040, w: 470, h: 300, type: "building", label: "DEPOT" },
    { x: 1505, y: 1070, w: 480, h: 280, type: "building", label: "PROCESSING" },
    { x: 845, y: 101, w: 170, h: 82, type: "container" },
    { x: 864, y: 505, w: 185, h: 76, type: "container" },
    { x: 1338, y: 475, w: 70, h: 185, type: "container" },
    { x: 1910, y: 530, w: 190, h: 80, type: "container" },
    { x: 178, y: 564, w: 165, h: 70, type: "container" },
    { x: 845, y: 1210, w: 178, h: 76, type: "container" },
    { x: 1270, y: 1008, w: 180, h: 76, type: "container" },
    { x: 2070, y: 960, w: 175, h: 70, type: "container" },
    { x: 2080, y: 220, w: 76, h: 220, type: "wall" },
    { x: 90, y: 925, w: 220, h: 38, type: "wall" },
    { x: 915, y: 910, w: 260, h: 38, type: "wall" },
    { x: 1310, y: 1375, w: 240, h: 38, type: "wall" }
  ];

  const decor = makeDecor();
  let player = null;
  let enemies = [];
  let bullets = [];
  let particles = [];
  let lootCases = [];
  let intelNodes = [];
  let drops = [];

  function makeDecor() {
    const out = [];
    let n = 7391;
    for (let i = 0; i < 170; i++) {
      n = (n * 16807) % 2147483647;
      const x = n % WORLD.w;
      n = (n * 16807) % 2147483647;
      const y = n % WORLD.h;
      n = (n * 16807) % 2147483647;
      out.push({ x, y, kind: n % 4, size: 2 + (n % 7) });
    }
    return out;
  }

  function trimImage(img) {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const cctx = c.getContext("2d", { willReadFrequently: true });
    cctx.drawImage(img, 0, 0);
    let data;
    try {
      data = cctx.getImageData(0, 0, c.width, c.height).data;
    } catch (_) {
      return img;
    }
    let minX = c.width, minY = c.height, maxX = 0, maxY = 0;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        if (data[(y * c.width + x) * 4 + 3] > 10) {
          minX = Math.min(minX, x); minY = Math.min(minY, y);
          maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        }
      }
    }
    if (minX > maxX) return img;
    const pad = 2;
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(c.width - 1, maxX + pad); maxY = Math.min(c.height - 1, maxY + pad);
    const out = document.createElement("canvas");
    out.width = maxX - minX + 1; out.height = maxY - minY + 1;
    out.getContext("2d").drawImage(c, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
    return out;
  }

  async function loadAssets() {
    await Promise.all(Object.entries(assets).map(([key, src]) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { images[key] = trimImage(img); resolve(); };
      img.onerror = () => { images[key] = null; resolve(); };
      img.src = src;
    })));
    state = "menu";
    resetRun();
    setTimeout(() => ui.loading.classList.add("done"), 180);
    setTimeout(() => ui.loading.classList.add("hidden"), 650);
  }

  function resetRun() {
    runSeed++;
    gameTime = 360;
    extractProgress = 0;
    nearbyInteractable = null;
    player = {
      x: 180, y: 180, r: 17, angle: 0, hp: 100, armor: 50, cash: 0, medkits: 1, intel: 0,
      mag: 30, reserve: 120, fireCd: 0, reloading: 0, hurtFlash: 0, kills: 0, step: 0
    };
    bullets = [];
    particles = [];
    drops = [];
    enemies = [
      makeEnemy(560, 560, 540, 535), makeEnemy(890, 405, 925, 440), makeEnemy(1250, 320, 1200, 360),
      makeEnemy(1580, 490, 1600, 520), makeEnemy(2010, 680, 2000, 650), makeEnemy(980, 940, 1030, 970),
      makeEnemy(480, 920, 510, 920), makeEnemy(720, 1440, 750, 1430), makeEnemy(1390, 1210, 1380, 1170),
      makeEnemy(1840, 930, 1810, 920), makeEnemy(2130, 1210, 2100, 1200), makeEnemy(2200, 420, 2190, 430),
      makeEnemy(1690, 1450, 1660, 1460, true), makeEnemy(1160, 730, 1150, 745, true)
    ];
    lootCases = [
      makeCase(275, 330), makeCase(820, 300), makeCase(1325, 285), makeCase(1875, 290),
      makeCase(250, 780), makeCase(690, 925), makeCase(1440, 900), makeCase(2210, 760),
      makeCase(1040, 1425), makeCase(2050, 1430)
    ];
    intelNodes = [
      { x: 790, y: 515, active: true, id: "A" },
      { x: 1515, y: 455, active: true, id: "B" },
      { x: 1460, y: 1190, active: true, id: "C" }
    ];
    camera.x = 0; camera.y = 0; camera.shake = 0;
    updateHUD();
  }

  function makeEnemy(x, y, px, py, heavy = false) {
    return { x, y, homeX: x, homeY: y, patrolX: px, patrolY: py, r: heavy ? 21 : 16, angle: 0, hp: heavy ? 120 : 68,
      maxHp: heavy ? 120 : 68, heavy, state: "patrol", alert: 0, fireCd: Math.random(), moveT: Math.random() * 4, hit: 0, dead: false };
  }

  function makeCase(x, y) { return { x, y, opened: false, bob: Math.random() * Math.PI * 2 }; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const formatTime = (s) => `${String(Math.max(0, Math.floor(s / 60))).padStart(2, "0")}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, "0")}`;

  function circleRect(cx, cy, r, o) {
    const nx = clamp(cx, o.x, o.x + o.w);
    const ny = clamp(cy, o.y, o.y + o.h);
    const dx = cx - nx, dy = cy - ny;
    return dx * dx + dy * dy < r * r;
  }

  function blocked(x, y, r = 12) {
    if (x - r < 12 || y - r < 12 || x + r > WORLD.w - 12 || y + r > WORLD.h - 12) return true;
    return obstacles.some((o) => circleRect(x, y, r, o));
  }

  function moveEntity(entity, dx, dy) {
    const nx = entity.x + dx;
    if (!blocked(nx, entity.y, entity.r)) entity.x = nx;
    const ny = entity.y + dy;
    if (!blocked(entity.x, ny, entity.r)) entity.y = ny;
  }

  function lineBlocked(x1, y1, x2, y2) {
    const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 30);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
      if (obstacles.some((o) => x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h)) return true;
    }
    return false;
  }

  function startGame() {
    resetRun();
    state = "playing";
    ui.menu.classList.add("hidden");
    ui.result.classList.add("hidden");
    ui.pause.classList.add("hidden");
    ui.hud.classList.remove("hidden");
    initAudio();
    sfx("deploy");
    toast("INFIL COMPLETE // FIND 3 ENCRYPTED DRIVES");
    canvas.focus();
  }

  function showMenu() {
    state = "menu";
    resetRun();
    ui.menu.classList.remove("hidden");
    ui.hud.classList.add("hidden");
    ui.pause.classList.add("hidden");
    ui.result.classList.add("hidden");
  }

  function togglePause(force) {
    if (state !== "playing" && state !== "paused") return;
    const paused = force === undefined ? state === "playing" : force;
    state = paused ? "paused" : "playing";
    ui.pause.classList.toggle("hidden", !paused);
    input.down = false;
  }

  function finishRun(success, reason = "") {
    if (state !== "playing") return;
    state = success ? "success" : "failure";
    input.down = false;
    ui.hud.classList.add("hidden");
    ui.result.classList.remove("hidden");
    ui.resultPanel.className = `result-panel ${success ? "success" : "failure"}`;
    ui.resultKicker.textContent = success ? "EXTRACTION COMPLETE" : "OPERATION FAILED";
    ui.resultTitle.textContent = success ? "PACKAGE SECURED" : reason || "OPERATOR LOST";
    ui.resultCopy.textContent = success ? "The drives and field loot are safely out of the zone." : "The Deadzone keeps everything you leave behind.";
    ui.resultCash.textContent = success ? `$${player.cash.toLocaleString()}` : "$0";
    ui.resultKills.textContent = player.kills;
    ui.resultTime.textContent = formatTime(gameTime);
    sfx(success ? "extract" : "fail");
  }

  function update(dt) {
    if (state !== "playing") return;
    gameTime -= dt;
    if (gameTime <= 0) { gameTime = 0; finishRun(false, "LOST IN THE STORM"); return; }

    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateParticles(dt);
    updateDrops(dt);
    updateInteraction();
    updateExtraction(dt);

    camera.x += (clamp(player.x - W / 2, 0, WORLD.w - W) - camera.x) * Math.min(1, dt * 7);
    camera.y += (clamp(player.y - H / 2, 0, WORLD.h - H) - camera.y) * Math.min(1, dt * 7);
    camera.shake = Math.max(0, camera.shake - dt * 16);
    player.hurtFlash = Math.max(0, player.hurtFlash - dt);
    ambienceTimer -= dt;
    if (ambienceTimer <= 0) { ambienceTimer = 4 + Math.random() * 8; sfx("distant"); }
    updateHUD();
  }

  function updatePlayer(dt) {
    const left = input.keys.has("KeyA") || input.keys.has("ArrowLeft");
    const right = input.keys.has("KeyD") || input.keys.has("ArrowRight");
    const up = input.keys.has("KeyW") || input.keys.has("ArrowUp");
    const down = input.keys.has("KeyS") || input.keys.has("ArrowDown");
    let mx = (right ? 1 : 0) - (left ? 1 : 0);
    let my = (down ? 1 : 0) - (up ? 1 : 0);
    if (mx || my) {
      const len = Math.hypot(mx, my); mx /= len; my /= len;
      const sprinting = input.keys.has("ShiftLeft") || input.keys.has("ShiftRight");
      const speed = sprinting ? 245 : 185;
      moveEntity(player, mx * speed * dt, my * speed * dt);
      player.step += dt * (sprinting ? 14 : 10);
      if (Math.floor(player.step) !== Math.floor(player.step - dt * (sprinting ? 14 : 10)) && Math.floor(player.step) % 3 === 0) {
        particle(player.x + (Math.random() - .5) * 10, player.y + 11, "#a6976b", 0, 10, .35, 2);
      }
    }
    const aimX = input.mouseX + camera.x;
    const aimY = input.mouseY + camera.y;
    player.angle = Math.atan2(aimY - player.y, aimX - player.x);
    player.fireCd = Math.max(0, player.fireCd - dt);
    if (player.reloading > 0) {
      player.reloading -= dt;
      if (player.reloading <= 0) {
        const need = 30 - player.mag, amount = Math.min(need, player.reserve);
        player.mag += amount; player.reserve -= amount;
        sfx("reloadEnd");
      }
    }
    if (input.down) shootPlayer();
  }

  function shootPlayer() {
    if (player.fireCd > 0 || player.reloading > 0) return;
    if (player.mag <= 0) { player.fireCd = .2; sfx("empty"); return; }
    player.mag--;
    player.fireCd = .105;
    const spread = (Math.random() - .5) * .045;
    const a = player.angle + spread;
    const x = player.x + Math.cos(a) * 27, y = player.y + Math.sin(a) * 27;
    bullets.push({ x, y, vx: Math.cos(a) * 900, vy: Math.sin(a) * 900, life: .8, owner: "player", damage: 34 });
    for (let i = 0; i < 3; i++) particle(x, y, i ? "#efb64f" : "#fff1a0", Math.cos(a) * (90 + Math.random() * 80), Math.sin(a) * (90 + Math.random() * 80), .12, 2 + Math.random() * 2);
    camera.shake = 2.5;
    alertNearby(player.x, player.y, 520);
    sfx("shot");
  }

  function startReload() {
    if (!player || state !== "playing" || player.reloading > 0 || player.mag >= 30 || player.reserve <= 0) return;
    player.reloading = 1.35;
    sfx("reload");
  }

  function useMedkit() {
    if (!player || state !== "playing" || player.medkits <= 0 || player.hp >= 100) return;
    player.medkits--;
    player.hp = Math.min(100, player.hp + 55);
    burst(player.x, player.y, "#c7dd78", 14);
    toast("MEDKIT USED // +55 HEALTH");
    sfx("heal");
  }

  function updateEnemies(dt) {
    for (const e of enemies) {
      if (e.dead) continue;
      e.fireCd -= dt; e.hit = Math.max(0, e.hit - dt); e.moveT += dt;
      const d = dist(e, player);
      const canSee = d < (e.heavy ? 500 : 430) && !lineBlocked(e.x, e.y, player.x, player.y);
      if (canSee) { e.state = "alert"; e.alert = 3.2; }
      else e.alert -= dt;
      if (e.state === "alert" && e.alert <= 0 && d > 480) e.state = "patrol";

      if (e.state === "alert") {
        e.angle = Math.atan2(player.y - e.y, player.x - e.x);
        if (d > (e.heavy ? 245 : 205)) {
          moveEntity(e, Math.cos(e.angle) * (e.heavy ? 67 : 86) * dt, Math.sin(e.angle) * (e.heavy ? 67 : 86) * dt);
        } else if (d < 125) {
          moveEntity(e, -Math.cos(e.angle) * 48 * dt, -Math.sin(e.angle) * 48 * dt);
        } else {
          const strafe = Math.sin(e.moveT * 1.8) * 34;
          moveEntity(e, Math.cos(e.angle + Math.PI / 2) * strafe * dt, Math.sin(e.angle + Math.PI / 2) * strafe * dt);
        }
        if (canSee && d < 490 && e.fireCd <= 0) enemyShoot(e);
      } else {
        const targetX = Math.sin(e.moveT * .55) > 0 ? e.patrolX : e.homeX;
        const targetY = Math.sin(e.moveT * .55) > 0 ? e.patrolY : e.homeY;
        e.angle = Math.atan2(targetY - e.y, targetX - e.x);
        moveEntity(e, Math.cos(e.angle) * 32 * dt, Math.sin(e.angle) * 32 * dt);
      }
    }
  }

  function enemyShoot(e) {
    const spread = (Math.random() - .5) * (e.heavy ? .18 : .13);
    const a = e.angle + spread;
    bullets.push({ x: e.x + Math.cos(a) * 22, y: e.y + Math.sin(a) * 22, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, life: 1.25, owner: "enemy", damage: e.heavy ? 18 : 12 });
    e.fireCd = e.heavy ? .42 : .72 + Math.random() * .42;
    particle(e.x + Math.cos(a) * 24, e.y + Math.sin(a) * 24, "#ff9c53", Math.cos(a) * 70, Math.sin(a) * 70, .14, 3);
    sfx("enemyShot");
  }

  function alertNearby(x, y, radius) {
    enemies.forEach((e) => {
      if (!e.dead && Math.hypot(e.x - x, e.y - y) < radius) { e.state = "alert"; e.alert = 4; }
    });
  }

  function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      const ox = b.x, oy = b.y;
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      let remove = b.life <= 0 || b.x < 0 || b.y < 0 || b.x > WORLD.w || b.y > WORLD.h;
      if (!remove && obstacles.some((o) => b.x > o.x && b.x < o.x + o.w && b.y > o.y && b.y < o.y + o.h)) {
        remove = true;
        for (let n = 0; n < 4; n++) particle(b.x, b.y, "#d4c18a", -b.vx * .08 + (Math.random() - .5) * 70, -b.vy * .08 + (Math.random() - .5) * 70, .25, 2);
      }
      if (!remove && b.owner === "player") {
        for (const e of enemies) {
          if (!e.dead && Math.hypot(b.x - e.x, b.y - e.y) < e.r + 5) {
            e.hp -= b.damage; e.hit = .12; e.state = "alert"; e.alert = 5; remove = true;
            burst(b.x, b.y, "#e46142", 7); sfx("hit");
            if (e.hp <= 0) killEnemy(e);
            break;
          }
        }
      } else if (!remove && b.owner === "enemy" && Math.hypot(b.x - player.x, b.y - player.y) < player.r + 5) {
        damagePlayer(b.damage); remove = true;
      }
      if (remove) bullets.splice(i, 1);
      else if (Math.random() < .35) particle((ox + b.x) / 2, (oy + b.y) / 2, b.owner === "player" ? "#e7da8a" : "#d67d59", 0, 0, .08, 1);
    }
  }

  function killEnemy(e) {
    e.dead = true; player.kills++;
    burst(e.x, e.y, "#ad422e", 16);
    drops.push({ x: e.x, y: e.y, type: Math.random() < .23 ? "med" : Math.random() < .45 ? "ammo" : "cash", value: e.heavy ? 850 : 350, bob: 0 });
    toast(e.heavy ? "HEAVY HOSTILE DOWN" : "HOSTILE ELIMINATED");
    sfx("down");
  }

  function damagePlayer(amount) {
    if (player.armor > 0) {
      const absorbed = Math.min(player.armor, amount * .7);
      player.armor -= absorbed; amount -= absorbed;
    }
    player.hp -= amount;
    player.hurtFlash = .25; camera.shake = 7;
    burst(player.x, player.y, "#dc563e", 9); sfx("hurt");
    if (player.hp <= 0) { player.hp = 0; finishRun(false, "OPERATOR LOST"); }
  }

  function updateDrops(dt) {
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i]; d.bob += dt * 3;
      if (dist(d, player) < 33) {
        if (d.type === "cash") { player.cash += d.value; toast(`CASH SECURED // +$${d.value}`); }
        if (d.type === "ammo") { player.reserve = Math.min(180, player.reserve + 30); toast("RIFLE AMMO // +30"); }
        if (d.type === "med") { player.medkits++; toast("MEDKIT ACQUIRED"); }
        sfx("pickup"); drops.splice(i, 1);
      }
    }
  }

  function updateInteraction() {
    nearbyInteractable = null;
    let best = 62;
    for (const c of lootCases) {
      if (c.opened) continue;
      const d = dist(c, player);
      if (d < best) { best = d; nearbyInteractable = { kind: "case", target: c, label: "OPEN SUPPLY CASE" }; }
    }
    for (const n of intelNodes) {
      if (!n.active) continue;
      const d = dist(n, player);
      if (d < best) { best = d; nearbyInteractable = { kind: "intel", target: n, label: "SECURE ENCRYPTED DRIVE" }; }
    }
    ui.interact.classList.toggle("hidden", !nearbyInteractable);
    if (nearbyInteractable) ui.interact.querySelector("span").textContent = nearbyInteractable.label;
  }

  function interact() {
    if (state !== "playing" || !nearbyInteractable) return;
    if (nearbyInteractable.kind === "case") openCase(nearbyInteractable.target);
    else secureIntel(nearbyInteractable.target);
    nearbyInteractable = null;
  }

  function openCase(c) {
    c.opened = true;
    const roll = Math.random();
    if (roll < .35) { const value = 600 + Math.floor(Math.random() * 8) * 100; player.cash += value; toast(`VALUABLES // +$${value}`); }
    else if (roll < .62) { player.reserve = Math.min(210, player.reserve + 60); toast("RIFLE AMMO // +60"); }
    else if (roll < .82) { player.armor = Math.min(100, player.armor + 45); toast("ARMOR PLATES // +45"); }
    else { player.medkits++; toast("MEDKIT ACQUIRED"); }
    burst(c.x, c.y, "#e6c85c", 13); sfx("crate");
  }

  function secureIntel(n) {
    n.active = false; player.intel++;
    toast(`ENCRYPTED DRIVE ${n.id} SECURED // ${player.intel}/3`);
    burst(n.x, n.y, "#a9e9d5", 18); sfx("intel");
    alertNearby(n.x, n.y, 680);
    if (player.intel === 3) {
      toast("EXFIL UNLOCKED // MOVE TO THE GREEN FLARE");
      setTimeout(() => state === "playing" && sfx("extractReady"), 400);
    }
  }

  function updateExtraction(dt) {
    if (player.intel < 3) { extractProgress = 0; return; }
    const zone = { x: 2200, y: 1430 };
    if (Math.hypot(player.x - zone.x, player.y - zone.y) < 88) {
      extractProgress += dt;
      if (extractProgress >= 4) finishRun(true);
    } else extractProgress = Math.max(0, extractProgress - dt * 1.5);
  }

  function particle(x, y, color, vx, vy, life = .4, size = 3) {
    particles.push({ x, y, color, vx, vy, life, maxLife: life, size });
  }

  function burst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, speed = 35 + Math.random() * 140;
      particle(x, y, color, Math.cos(a) * speed, Math.sin(a) * speed, .25 + Math.random() * .35, 2 + Math.random() * 3);
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .96; p.vy *= .96; p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function toast(text, warn = false) {
    const el = document.createElement("div");
    el.className = `toast${warn ? " warn" : ""}`;
    el.textContent = text;
    ui.toastStack.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function updateHUD() {
    if (!player) return;
    ui.timer.textContent = formatTime(gameTime);
    ui.timer.parentElement.classList.toggle("danger", gameTime < 60);
    ui.objective.innerHTML = player.intel < 3 ? `SECURE ENCRYPTED DRIVES <b>${player.intel} / 3</b>` : `REACH THE EXTRACTION FLARE <b>${Math.floor(extractProgress / 4 * 100)}%</b>`;
    ui.healthBar.style.width = `${clamp(player.hp, 0, 100)}%`;
    ui.armorBar.style.width = `${clamp(player.armor, 0, 100)}%`;
    ui.healthText.textContent = Math.ceil(player.hp);
    ui.armorText.textContent = Math.ceil(player.armor);
    ui.cashText.textContent = `$${player.cash.toLocaleString()}`;
    ui.medText.textContent = `x${player.medkits}`;
    ui.intelText.textContent = `${player.intel}/3`;
    ui.magText.textContent = String(player.mag).padStart(2, "0");
    ui.reserveText.textContent = String(player.reserve).padStart(3, "0");
    ui.magText.parentElement.classList.toggle("reloading", player.reloading > 0);
    const threat = enemies.filter((e) => !e.dead && e.state === "alert").length;
    const level = clamp(Math.ceil(threat / 2), 0, 5);
    ui.threatBars.forEach((b, i) => b.classList.toggle("active", i < level));
    ui.threatText.textContent = level === 0 ? "LOW" : level < 3 ? "ELEVATED" : level < 5 ? "HIGH" : "MAXIMUM";
    ui.threatText.style.color = level > 2 ? "var(--red)" : level ? "var(--amber)" : "var(--lime)";
  }

  function draw() {
    ctx.save();
    const shakeX = camera.shake ? (Math.random() - .5) * camera.shake : 0;
    const shakeY = camera.shake ? (Math.random() - .5) * camera.shake : 0;
    ctx.translate(Math.round(-camera.x + shakeX), Math.round(-camera.y + shakeY));
    drawGround();
    drawExtraction();
    drawObstacles();
    drawIntel();
    drawCases();
    drawDrops();
    drawEnemies();
    drawPlayer();
    drawBullets();
    drawParticles();
    ctx.restore();
    drawScreenFX();
    if (state === "playing" || state === "paused") drawMinimap();
  }

  function drawGround() {
    ctx.fillStyle = "#79704e"; ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    const tile = 64;
    for (let y = 0; y < WORLD.h; y += tile) {
      for (let x = 0; x < WORLD.w; x += tile) {
        const v = ((x / tile) * 17 + (y / tile) * 31) % 5;
        ctx.fillStyle = v < 2 ? "#7c7250" : v < 4 ? "#766d4c" : "#817752";
        ctx.fillRect(x, y, tile, tile);
        ctx.fillStyle = "rgba(38,42,28,.1)"; ctx.fillRect(x, y, tile, 1); ctx.fillRect(x, y, 1, tile);
      }
    }
    roads.forEach((r) => {
      ctx.fillStyle = "#555443"; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = "#656250"; ctx.fillRect(r.x + (r.dir === "v" ? 8 : 0), r.y + (r.dir === "h" ? 8 : 0), r.w - (r.dir === "v" ? 16 : 0), r.h - (r.dir === "h" ? 16 : 0));
      ctx.fillStyle = "rgba(25,27,23,.24)";
      if (r.dir === "h") {
        for (let x = 20; x < r.w; x += 90) ctx.fillRect(x, r.y + r.h / 2 - 2, 45, 4);
      } else {
        for (let y = 20; y < r.h; y += 90) ctx.fillRect(r.x + r.w / 2 - 2, y, 4, 45);
      }
    });
    decor.forEach((d) => {
      if (d.kind === 0) { ctx.fillStyle = "#4d5437"; ctx.fillRect(d.x, d.y, d.size, d.size + 5); ctx.fillStyle = "#687048"; ctx.fillRect(d.x - 2, d.y - 2, d.size + 4, 3); }
      else if (d.kind === 1) { ctx.fillStyle = "rgba(66,60,43,.45)"; ctx.fillRect(d.x, d.y, d.size + 5, 2); }
      else { ctx.fillStyle = d.kind === 2 ? "#8a7d56" : "#625f45"; ctx.fillRect(d.x, d.y, d.size, Math.max(2, d.size / 2)); }
    });
    ctx.strokeStyle = "rgba(221,203,137,.16)"; ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, WORLD.w - 36, WORLD.h - 36);
  }

  function drawObstacles() {
    for (const o of obstacles) {
      if (o.type === "building") drawBuilding(o);
      else if (o.type === "container") drawContainer(o);
      else drawWall(o);
    }
  }

  function drawBuilding(o) {
    ctx.fillStyle = "rgba(32,29,22,.35)"; ctx.fillRect(o.x + 13, o.y + 14, o.w, o.h);
    ctx.fillStyle = "#393b31"; ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = "#45483b"; ctx.fillRect(o.x + 8, o.y + 8, o.w - 16, o.h - 16);
    ctx.fillStyle = "#30342b"; ctx.fillRect(o.x + 18, o.y + 18, o.w - 36, o.h - 36);
    ctx.strokeStyle = "#595b49"; ctx.lineWidth = 3; ctx.strokeRect(o.x + 5, o.y + 5, o.w - 10, o.h - 10);
    ctx.fillStyle = "#252921";
    for (let x = o.x + 30; x < o.x + o.w - 30; x += 72) ctx.fillRect(x, o.y + 30, 42, 15);
    ctx.fillStyle = "#687049"; ctx.fillRect(o.x + 20, o.y + o.h - 37, 100, 17);
    ctx.fillStyle = "#afb56e"; ctx.font = "10px Share Tech Mono"; ctx.fillText(o.label, o.x + 27, o.y + o.h - 25);
    ctx.fillStyle = "#c38f3f"; ctx.fillRect(o.x + o.w - 44, o.y + 16, 25, 6);
    ctx.fillRect(o.x + o.w - 44, o.y + 27, 17, 4);
  }

  function drawContainer(o) {
    ctx.fillStyle = "rgba(33,30,24,.35)"; ctx.fillRect(o.x + 9, o.y + 10, o.w, o.h);
    ctx.fillStyle = "#515642"; ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = "#62684d"; ctx.fillRect(o.x + 5, o.y + 5, o.w - 10, o.h - 10);
    ctx.strokeStyle = "#33382d"; ctx.lineWidth = 4;
    for (let x = o.x + 18; x < o.x + o.w; x += 28) { ctx.beginPath(); ctx.moveTo(x, o.y + 6); ctx.lineTo(x, o.y + o.h - 6); ctx.stroke(); }
    ctx.fillStyle = "#c2a24d"; ctx.fillRect(o.x + 8, o.y + 10, 5, o.h - 20);
  }

  function drawWall(o) {
    ctx.fillStyle = "rgba(32,28,22,.35)"; ctx.fillRect(o.x + 6, o.y + 7, o.w, o.h);
    ctx.fillStyle = "#545345"; ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = "#6d6955"; ctx.fillRect(o.x + 3, o.y + 3, o.w - 6, 7);
    ctx.fillStyle = "#393a31";
    if (o.w > o.h) for (let x = o.x + 20; x < o.x + o.w; x += 50) ctx.fillRect(x, o.y + 10, 5, o.h - 10);
    else for (let y = o.y + 20; y < o.y + o.h; y += 50) ctx.fillRect(o.x + 10, y, o.w - 10, 5);
  }

  function drawExtraction() {
    const x = 2200, y = 1430, active = player && player.intel >= 3;
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = active ? "rgba(193,225,107,.78)" : "rgba(115,119,99,.35)";
    ctx.lineWidth = 4; ctx.setLineDash([16, 10]); ctx.lineDashOffset = -performance.now() / 80;
    ctx.beginPath(); ctx.arc(0, 0, 88, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = active ? "rgba(188,225,98,.08)" : "rgba(80,84,70,.05)"; ctx.beginPath(); ctx.arc(0, 0, 84, 0, Math.PI * 2); ctx.fill();
    if (active) {
      const pulse = 14 + Math.sin(performance.now() / 170) * 5;
      ctx.fillStyle = "rgba(195,232,103,.18)"; ctx.fillRect(-3, -160, 6, 160);
      ctx.fillStyle = "#d6eb7d"; ctx.beginPath(); ctx.arc(0, -8, pulse, 0, Math.PI * 2); ctx.fill();
      if (extractProgress > 0) { ctx.strokeStyle = "#e8f4b0"; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, 69, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * extractProgress / 4); ctx.stroke(); }
    }
    ctx.fillStyle = active ? "#dbe99a" : "#858779"; ctx.font = "11px Share Tech Mono"; ctx.textAlign = "center";
    ctx.fillText(active ? (extractProgress > 0 ? `EXTRACTING ${Math.ceil(4 - extractProgress)}` : "EXFIL ACTIVE") : "EXFIL LOCKED", 0, 112);
    ctx.restore();
  }

  function drawCases() {
    lootCases.forEach((c) => {
      c.bob += .015;
      ctx.save(); ctx.translate(c.x, c.y);
      if (!c.opened) {
        const pulse = .35 + Math.sin(c.bob * 2) * .15;
        ctx.fillStyle = `rgba(225,188,71,${pulse})`; ctx.fillRect(-24, 18, 48, 3);
      }
      ctx.globalAlpha = c.opened ? .35 : 1;
      if (images.crate) ctx.drawImage(images.crate, -31, -22, 62, 43);
      else { ctx.fillStyle = "#4d543c"; ctx.fillRect(-25, -15, 50, 30); }
      if (c.opened) { ctx.strokeStyle = "#22261e"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-24, -9); ctx.lineTo(24, 9); ctx.stroke(); }
      ctx.restore();
    });
  }

  function drawIntel() {
    intelNodes.forEach((n) => {
      if (!n.active) return;
      const p = Math.sin(performance.now() / 180 + n.x) * 3;
      ctx.save(); ctx.translate(n.x, n.y + p);
      ctx.fillStyle = "rgba(117,225,206,.18)"; ctx.fillRect(-19, -24, 38, 48);
      ctx.fillStyle = "#91ddcb"; ctx.fillRect(-12, -16, 24, 31);
      ctx.fillStyle = "#1e524e"; ctx.fillRect(-8, -12, 16, 18);
      ctx.fillStyle = "#d8f2dd"; ctx.fillRect(-5, -8, 10, 3); ctx.fillRect(-5, -2, 7, 2);
      ctx.strokeStyle = "rgba(144,232,211,.4)"; ctx.strokeRect(-17, -21, 34, 41);
      ctx.restore();
    });
  }

  function drawDrops() {
    drops.forEach((d) => {
      const y = d.y + Math.sin(d.bob) * 4;
      ctx.fillStyle = "rgba(0,0,0,.28)"; ctx.fillRect(d.x - 10, d.y + 8, 20, 5);
      ctx.fillStyle = d.type === "cash" ? "#e8c95b" : d.type === "med" ? "#d5e581" : "#d9984d";
      ctx.fillRect(d.x - 8, y - 8, 16, 16);
      ctx.fillStyle = "#25281f";
      if (d.type === "med") { ctx.fillRect(d.x - 2, y - 6, 4, 12); ctx.fillRect(d.x - 6, y - 2, 12, 4); }
      else ctx.fillRect(d.x - 5, y - 2, 10, 4);
    });
  }

  function drawEnemies() {
    enemies.forEach((e) => {
      if (e.dead) return;
      ctx.save(); ctx.translate(e.x, e.y);
      if (Math.cos(e.angle) < 0) ctx.scale(-1, 1);
      if (e.state === "alert") { ctx.fillStyle = "rgba(224,81,55,.32)"; ctx.beginPath(); ctx.arc(0, 0, e.r + 11, 0, Math.PI * 2); ctx.fill(); }
      if (e.hit) ctx.globalAlpha = .58;
      const h = e.heavy ? 69 : 59, w = e.heavy ? 55 : 47;
      if (images.hostile) ctx.drawImage(images.hostile, -w / 2, -h / 2, w, h);
      else { ctx.fillStyle = "#8e4a35"; ctx.fillRect(-13, -16, 26, 32); }
      ctx.restore();
      if (e.hp < e.maxHp || e.state === "alert") {
        ctx.fillStyle = "rgba(18,18,14,.72)"; ctx.fillRect(e.x - 20, e.y - e.r - 22, 40, 5);
        ctx.fillStyle = e.heavy ? "#df9a4c" : "#d75a44"; ctx.fillRect(e.x - 19, e.y - e.r - 21, 38 * e.hp / e.maxHp, 3);
      }
      if (e.heavy) { ctx.fillStyle = "#e0a54d"; ctx.font = "8px Share Tech Mono"; ctx.textAlign = "center"; ctx.fillText("HEAVY", e.x, e.y - e.r - 27); }
    });
  }

  function drawPlayer() {
    if (!player) return;
    ctx.save(); ctx.translate(player.x, player.y);
    ctx.fillStyle = "rgba(17,18,14,.36)"; ctx.beginPath(); ctx.ellipse(3, 15, 22, 10, 0, 0, Math.PI * 2); ctx.fill();
    if (Math.cos(player.angle) < 0) ctx.scale(-1, 1);
    const moving = input.keys.has("KeyW") || input.keys.has("KeyA") || input.keys.has("KeyS") || input.keys.has("KeyD");
    const bob = moving ? Math.sin(player.step) * 2 : Math.sin(performance.now() / 350) * .6;
    if (player.hurtFlash) ctx.globalAlpha = .5;
    if (images.operator) ctx.drawImage(images.operator, -29, -36 + bob, 58, 70);
    else { ctx.fillStyle = "#7e874a"; ctx.fillRect(-14, -18, 28, 36); }
    ctx.restore();
    if (player.reloading > 0) {
      ctx.strokeStyle = "#e0b755"; ctx.lineWidth = 3; ctx.beginPath();
      ctx.arc(player.x, player.y, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - player.reloading / 1.35)); ctx.stroke();
    }
  }

  function drawBullets() {
    ctx.lineWidth = 2;
    bullets.forEach((b) => {
      ctx.strokeStyle = b.owner === "player" ? "#fff1a0" : "#ff7956";
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * .018, b.y - b.vy * .018); ctx.stroke();
    });
  }

  function drawParticles() {
    particles.forEach((p) => {
      ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), Math.ceil(p.size), Math.ceil(p.size));
    });
    ctx.globalAlpha = 1;
  }

  function drawScreenFX() {
    const grad = ctx.createRadialGradient(W / 2, H / 2, 210, W / 2, H / 2, 760);
    grad.addColorStop(0, "rgba(0,0,0,0)"); grad.addColorStop(1, "rgba(5,8,5,.48)");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    if (state === "playing" && gameTime < 60) { ctx.fillStyle = `rgba(156,49,31,${.02 + Math.sin(performance.now() / 170) * .015})`; ctx.fillRect(0, 0, W, H); }
    if (player && player.hurtFlash) { ctx.fillStyle = `rgba(188,41,28,${player.hurtFlash * .6})`; ctx.fillRect(0, 0, W, H); }
  }

  function drawMinimap() {
    const mw = mapCanvas.width, mh = mapCanvas.height, sx = mw / WORLD.w, sy = mh / WORLD.h;
    mctx.fillStyle = "#25291f"; mctx.fillRect(0, 0, mw, mh);
    mctx.fillStyle = "#47483b"; roads.forEach((r) => mctx.fillRect(r.x * sx, r.y * sy, r.w * sx, r.h * sy));
    mctx.fillStyle = "#111510"; obstacles.forEach((o) => mctx.fillRect(o.x * sx, o.y * sy, Math.max(2, o.w * sx), Math.max(2, o.h * sy)));
    if (player.intel >= 3) { mctx.fillStyle = "#c9e16b"; mctx.fillRect(2200 * sx - 2, 1430 * sy - 2, 5, 5); }
    intelNodes.forEach((n) => { if (n.active) { mctx.fillStyle = "#86ddcc"; mctx.fillRect(n.x * sx - 1, n.y * sy - 1, 3, 3); } });
    enemies.forEach((e) => { if (!e.dead && e.state === "alert" && dist(e, player) < 520) { mctx.fillStyle = "#de5b42"; mctx.fillRect(e.x * sx - 1, e.y * sy - 1, 3, 3); } });
    mctx.save(); mctx.translate(player.x * sx, player.y * sy); mctx.rotate(player.angle); mctx.fillStyle = "#e4eca3"; mctx.beginPath(); mctx.moveTo(5, 0); mctx.lineTo(-3, -3); mctx.lineTo(-3, 3); mctx.fill(); mctx.restore();
    mctx.strokeStyle = "rgba(221,229,177,.18)"; mctx.strokeRect(0, 0, mw, mh);
  }

  function initAudio() {
    if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
  }

  function tone(freq, duration, type = "square", volume = .04, endFreq = null, delay = 0) {
    if (!soundOn || !audio) return;
    const osc = audio.createOscillator(), gain = audio.createGain();
    const t = audio.currentTime + delay;
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + duration);
    gain.gain.setValueAtTime(volume, t); gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
    osc.connect(gain); gain.connect(audio.destination); osc.start(t); osc.stop(t + duration);
  }

  function noise(duration = .05, volume = .025) {
    if (!soundOn || !audio) return;
    const count = Math.floor(audio.sampleRate * duration), buffer = audio.createBuffer(1, count, audio.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < count; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / count);
    const src = audio.createBufferSource(), gain = audio.createGain(); src.buffer = buffer; gain.gain.value = volume; src.connect(gain); gain.connect(audio.destination); src.start();
  }

  function sfx(name) {
    if (!soundOn || !audio) return;
    if (name === "shot") { tone(165, .055, "square", .045, 65); noise(.065, .035); }
    else if (name === "enemyShot") { tone(110, .07, "sawtooth", .018, 55); noise(.045, .015); }
    else if (name === "hit") tone(80, .045, "square", .035, 45);
    else if (name === "hurt") { tone(95, .16, "sawtooth", .055, 48); noise(.09, .025); }
    else if (name === "down") { tone(130, .11, "square", .035, 70); tone(75, .18, "square", .025, 40, .08); }
    else if (name === "empty") tone(220, .035, "square", .018, 180);
    else if (name === "reload") { tone(260, .035, "square", .02, 180); tone(170, .04, "square", .015, 120, .25); }
    else if (name === "reloadEnd") tone(340, .06, "square", .025, 470);
    else if (name === "pickup") { tone(510, .05, "square", .025, 670); tone(730, .07, "square", .02, 900, .055); }
    else if (name === "crate") { tone(140, .1, "square", .03, 210); tone(420, .09, "square", .02, 600, .09); }
    else if (name === "intel") { tone(390, .1, "sine", .04, 620); tone(700, .16, "sine", .035, 980, .1); }
    else if (name === "heal") { tone(360, .18, "sine", .035, 690); }
    else if (name === "deploy") { tone(70, .5, "sawtooth", .03, 38); tone(260, .14, "square", .025, 420, .35); }
    else if (name === "extractReady") { tone(310, .12, "square", .03, 500); tone(520, .12, "square", .03, 720, .14); tone(780, .2, "square", .03, 1000, .28); }
    else if (name === "extract") { [240, 360, 520, 760].forEach((f, i) => tone(f, .22, "square", .035, f * 1.2, i * .12)); }
    else if (name === "fail") { tone(160, .35, "sawtooth", .04, 80); tone(75, .7, "sine", .035, 36, .25); }
    else if (name === "distant" && Math.random() < .35) { tone(48, .65, "sine", .006, 35); noise(.3, .003); }
  }

  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * W / rect.width, y: (e.clientY - rect.top) * H / rect.height, cssX: e.clientX - rect.left, cssY: e.clientY - rect.top };
  }

  window.addEventListener("keydown", (e) => {
    input.keys.add(e.code);
    if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    if (e.code === "KeyR" && !e.repeat) startReload();
    if (e.code === "KeyQ" && !e.repeat) useMedkit();
    if (e.code === "KeyE" && !e.repeat) interact();
    if (e.code === "Escape" && !e.repeat) togglePause();
  });
  window.addEventListener("keyup", (e) => input.keys.delete(e.code));
  canvas.addEventListener("mousemove", (e) => {
    const p = pointerPos(e); input.mouseX = p.x; input.mouseY = p.y;
    ui.crosshair.style.left = `${p.cssX}px`; ui.crosshair.style.top = `${p.cssY}px`;
    if (player) {
      const wx = p.x + camera.x, wy = p.y + camera.y;
      ui.crosshair.classList.toggle("hot", enemies.some((en) => !en.dead && Math.hypot(en.x - wx, en.y - wy) < 32));
    }
  });
  canvas.addEventListener("mousedown", (e) => { if (e.button === 0) { input.down = true; initAudio(); } });
  window.addEventListener("mouseup", (e) => { if (e.button === 0) input.down = false; });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  window.addEventListener("blur", () => { input.down = false; input.keys.clear(); if (state === "playing") togglePause(true); });

  ui.deploy.addEventListener("click", startGame);
  ui.resume.addEventListener("click", () => togglePause(false));
  ui.abort.addEventListener("click", showMenu);
  ui.redeploy.addEventListener("click", startGame);
  ui.menuBtn.addEventListener("click", showMenu);
  ui.sound.addEventListener("click", () => { soundOn = !soundOn; ui.sound.textContent = `SOUND: ${soundOn ? "ON" : "OFF"}`; if (soundOn) { initAudio(); tone(520, .05, "square", .025, 680); } });

  function loop(now) {
    const dt = Math.min(.033, (now - lastTime) / 1000 || .016);
    lastTime = now;
    if (state === "menu") {
      camera.x += (560 - camera.x) * dt * .18;
      camera.y += (340 - camera.y) * dt * .18;
    }
    update(dt); draw(); requestAnimationFrame(loop);
  }

  window.__deadzone = { get state() { return state; }, get player() { return player; }, startGame, resetRun };
  loadAssets();
  requestAnimationFrame(loop);
})();
