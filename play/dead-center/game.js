(() => {
  "use strict";

  // Gameplay uses a compact 128 x 72 world, rendered at 4x internal resolution
  // so the generated pixel art keeps much finer square pixels on screen.
  const W = 128;
  const H = 72;
  const RENDER_SCALE = 4;
  const GROUND = 56;
  const MAX_ACTIVE_ZOMBIES = 90;
  // The hero artwork fills more of its cell, so 12px visually matches the enemies' padded 13px cells.
  const PLAYER_SPRITE_SIZE = 12;
  const ENEMY_SPRITE_SIZE = 13;
  const PROJECTILE_SCALE = 3;
  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);

  const $ = selector => document.querySelector(selector);
  const ui = {
    hud: $("#hud"), title: $("#titleScreen"), upgrades: $("#upgradeScreen"), pause: $("#pauseScreen"), over: $("#gameOverScreen"),
    level: $("#levelValue"), healthText: $("#healthText"), healthFill: $("#healthFill"), timer: $("#zombieValue"),
    waveBlock: $("#waveBlock"), waveProgress: $("#waveProgress"),
    weapon: $("#weaponName"), weaponIcons: $("#weaponIcons"), weaponIcon: $("#weaponIcon"), weaponIcon2: $("#weaponIcon2"), healthIcon: $("#healthIcon"),
    ammo: $("#ammoValue"), reload: $("#reloadText"), cards: $("#upgradeCards"),
    reroll: $("#rerollButton"), rerollCost: $("#rerollCost"),
    babyHud: $("#babyHud"), babyBuffs: $("#babyBuffs"), teeth: $("#teethValue"), teethIcon: $("#teethIcon"),
    shopBank: $("#shopBank"),
    nextRound: $("#nextRoundButton"), gameTip: $("#gameTip"), healthBlock: $(".health-block"),
    slotButtons: [...document.querySelectorAll(".equip-slot")],
    gunDeleteButtons: [...document.querySelectorAll(".gun-delete")],
    loadoutPreview: $("#loadoutPreview"), buildStats: $("#buildStats"),
    weaponCount: $("#weaponCount"), itemCount: $("#itemCount"),
    cleared: $("#clearedLevel"), best: $("#bestWave"), banner: $("#waveBanner"),
    finalLevel: $("#finalLevel"), finalKills: $("#finalKills"), finalScore: $("#finalScore"),
    controllerCard: $("#controllerCard"), controllerStatus: $("#controllerStatus")
  };

  const IMAGE_PATHS = {
    background: "assets/generated/graveyard-background-fine.webp",
    heroIdle: "assets/generated/hero-idle-30.webp",
    heroWalk: "assets/generated/hero-walk-30-v2.webp",
    heroJump: "assets/generated/hero-jump-30-v2.webp",
    heroShoot: "assets/generated/hero-shoot-30.webp",
    heroReload: "assets/generated/hero-reload-30.webp",
    heroFront: "assets/generated/hero-front-dual-v1.webp",
    heroHeavyDualIdle: "assets/generated/hero-heavy-dual-idle-30-v1.webp",
    heroHeavyDualWalk: "assets/generated/hero-heavy-dual-walk-30-v1.webp",
    heroHeavyDualJump: "assets/generated/hero-heavy-dual-jump-30-v1.webp",
    heroHeavyDualShoot: "assets/generated/hero-heavy-dual-shoot-30-v1.webp",
    heroHeavyDualReload: "assets/generated/hero-heavy-dual-reload-30-v1.webp",
    grandmaWalk: "assets/generated/grandma-walk-30.webp",
    grandmaCane: "assets/generated/grandma-cane-attack-30.webp",
    grandmaThrow: "assets/generated/grandma-throw-30.webp",
    grandmaDefeat: "assets/generated/grandma-defeat-30.webp",
    grandpaWalk: "assets/generated/grandpa-walk-30.webp",
    grandpaShotgun: "assets/generated/grandpa-shotgun-30.webp",
    grandpaDefeat: "assets/generated/grandpa-defeat-30.webp",
    trackGrandpaWalk: "assets/generated/track-grandpa-walk-30-v2.webp",
    trackGrandpaCane: "assets/generated/track-grandpa-cane-attack-30-v3.webp",
    trackGrandpaDefeat: "assets/generated/track-grandpa-defeat-30-v3.webp",
    breakfastGrandmaWalk: "assets/generated/breakfast-grandma-walk-30-v2.webp",
    breakfastGrandmaThrow: "assets/generated/breakfast-grandma-throw-24-v2.webp",
    breakfastGrandmaDefeat: "assets/generated/breakfast-grandma-defeat-30-v2.webp",
    tankGrandpaMove: "assets/generated/tank-grandpa-move-v1.webp",
    tankGrandpaFire: "assets/generated/tank-grandpa-fire-v1.webp",
    tankGrandpaDefeat: "assets/generated/tank-grandpa-defeat-v1.webp",
    nurseGrandmaWalk: "assets/generated/nurse-grandma-walk-v1.webp",
    nurseGrandmaSpray: "assets/generated/nurse-grandma-spray-v1.webp",
    nurseGrandmaDefeat: "assets/generated/nurse-grandma-defeat-v1.webp",
    chefGrandpaWalk: "assets/generated/chef-grandpa-walk-v1.webp",
    chefGrandpaPan: "assets/generated/chef-grandpa-pan-v1.webp",
    chefGrandpaDefeat: "assets/generated/chef-grandpa-defeat-v1.webp",
    jetpackGrandmaHover: "assets/generated/jetpack-grandma-hover-v1.webp",
    jetpackGrandmaRockets: "assets/generated/jetpack-grandma-rockets-v1.webp",
    jetpackGrandmaDefeat: "assets/generated/jetpack-grandma-defeat-v1.webp",
    seniorProjectiles: "assets/generated/senior-projectiles.webp",
    upgradeIcons: "assets/generated/upgrade-icons-v2.webp",
    hudItemIcons: "assets/generated/hud-item-icons-v2.webp",
    gunPistol: "assets/generated/gun-pistol-v1.webp",
    gunSmg: "assets/generated/gun-smg-v1.webp",
    gunShotgun: "assets/generated/gun-scattergun-v1.png",
    gunRifle: "assets/generated/gun-rifle-v1.png",
    babyBlaster: "assets/generated/baby-blaster-v1.webp",
    babyTurbo: "assets/generated/baby-turbo-v1.webp",
    babyGuardian: "assets/generated/baby-guardian-v1.webp",
    babyLucky: "assets/generated/baby-lucky-v1.webp",
    babyHopper: "assets/generated/baby-hopper-v1.webp",
    babyAmmo: "assets/generated/baby-ammo-v1.webp",
    babyVampire: "assets/generated/baby-vampire-v1.webp",
    babyFrost: "assets/generated/baby-frost-v1.webp",
    babyShield: "assets/generated/baby-shield-v1.webp",
    babyMagnet: "assets/generated/baby-magnet-v1.webp",
    babyBoom: "assets/generated/baby-boom-v1.webp",
    babyNinja: "assets/generated/baby-ninja-v1.webp",
    babyScout: "assets/generated/baby-scout-v1.webp",
    fakeTeeth: "assets/generated/fake-teeth-v1.webp"
  };
  const STATIC_ATLASES = new Set([
    "background", "seniorProjectiles", "upgradeIcons", "hudItemIcons", "gunPistol", "gunSmg", "gunShotgun", "gunRifle", "heroFront",
    "babyBlaster", "babyTurbo", "babyGuardian", "babyLucky", "babyHopper", "babyAmmo", "babyVampire",
    "babyFrost", "babyShield", "babyMagnet", "babyBoom", "babyNinja", "babyScout", "fakeTeeth"
  ]);
  const PIXEL_ATLAS_CONFIG = {
    upgradeIcons: { columns: 5, rows: 5, cssVariable: "--upgrade-icon-atlas" },
    hudItemIcons: { columns: 4, rows: 2, cssVariable: "--hud-item-atlas" },
    gunPistol: { columns: 1, rows: 1, outputCell: 24, padding: 1, brightness: 1.35, smooth: true, alphaThreshold: 110, ignoreDarkGlow: true },
    gunSmg: { columns: 1, rows: 1, outputCell: 24, padding: 1, brightness: 1.35, smooth: true, alphaThreshold: 110, ignoreDarkGlow: true },
    gunShotgun: { columns: 1, rows: 1, outputCell: 24, padding: 1, brightness: 1.3, smooth: true, alphaThreshold: 110, ignoreDarkGlow: true },
    gunRifle: { columns: 1, rows: 1, outputCell: 24, padding: 1, brightness: 1.3, smooth: true, alphaThreshold: 110, ignoreDarkGlow: true },
    heroFront: { columns: 1, rows: 1, outputCell: 96, padding: 4, brightness: 1, smooth: false, alphaThreshold: 150 },
    babyBlaster: { columns: 1, rows: 1, outputCell: 24, padding: 1, brightness: 1.12, smooth: true, alphaThreshold: 125, ignoreDarkGlow: true },
    babyTurbo: { columns: 1, rows: 1, outputCell: 24, padding: 1, brightness: 1.12, smooth: true, alphaThreshold: 125, ignoreDarkGlow: true },
    babyGuardian: { columns: 1, rows: 1, outputCell: 24, padding: 1, brightness: 1.12, smooth: true, alphaThreshold: 125, ignoreDarkGlow: true },
    babyLucky: { columns: 1, rows: 1, outputCell: 24, padding: 1, brightness: 1.12, smooth: true, alphaThreshold: 125, ignoreDarkGlow: true },
    babyHopper: { columns: 1, rows: 1, outputCell: 24, padding: 1, brightness: 1.12, smooth: true, alphaThreshold: 125, ignoreDarkGlow: true },
    babyAmmo: { columns: 1, rows: 1, outputCell: 24, padding: 1, brightness: 1.12, smooth: true, alphaThreshold: 125, ignoreDarkGlow: true },
    babyVampire: { columns: 1, rows: 1, outputCell: 24, padding: 1, brightness: 1.12, smooth: true, alphaThreshold: 125, ignoreDarkGlow: true },
    babyFrost: { columns: 1, rows: 1, outputCell: 24, padding: 1, brightness: 1.12, smooth: true, alphaThreshold: 125, ignoreDarkGlow: true },
    babyShield: { columns: 1, rows: 1, outputCell: 24, padding: 1, brightness: 1.12, smooth: true, alphaThreshold: 125, ignoreDarkGlow: true },
    babyMagnet: { columns: 1, rows: 1, outputCell: 24, padding: 1, brightness: 1.12, smooth: true, alphaThreshold: 125, ignoreDarkGlow: true },
    babyBoom: { columns: 1, rows: 1, outputCell: 24, padding: 1, brightness: 1.12, smooth: true, alphaThreshold: 125, ignoreDarkGlow: true },
    babyNinja: { columns: 1, rows: 1, outputCell: 24, padding: 1, brightness: 1.12, smooth: true, alphaThreshold: 125, ignoreDarkGlow: true },
    babyScout: { columns: 1, rows: 1, outputCell: 24, padding: 1, brightness: 1.12, smooth: true, alphaThreshold: 125, ignoreDarkGlow: true },
    fakeTeeth: { columns: 1, rows: 1, outputCell: 24, padding: 1, brightness: 1.12, smooth: true, alphaThreshold: 125, ignoreDarkGlow: true }
  };
  const cleanSheets = new WeakMap();
  const sheetFrameCounts = new WeakMap();
  const equippedHeroSheets = new Map();
  const frontHeroSheets = new Map();
  const gearIconCache = new Map();
  const pixelAtlases = Object.create(null);
  let cleanedSheetCount = 0;
  const art = Object.fromEntries(Object.entries(IMAGE_PATHS).map(([key, source]) => {
    const image = new Image();
    image.decoding = "async";
    if (!STATIC_ATLASES.has(key)) image.addEventListener("load", () => {
      cleanSheets.set(image, cleanSpriteSheet(image, key));
      cleanedSheetCount++;
    }, { once: true });
    if (PIXEL_ATLAS_CONFIG[key]) image.addEventListener("load", () => {
      const config = PIXEL_ATLAS_CONFIG[key];
      const atlas = buildPixelAtlas(image, config.columns, config.rows, config);
      atlas.dataUrl = `url("${atlas.toDataURL("image/png")}")`;
      pixelAtlases[key] = atlas;
      if (config.cssVariable) document.documentElement.style.setProperty(config.cssVariable, atlas.dataUrl);
    }, { once: true });
    image.src = source;
    return [key, image];
  }));
  const SHEET_COLUMNS = 6;
  const SHEET_ROWS = 5;
  const ANIMATION_FRAMES = 30;

  const COLORS = {
    sky: "#070b18", skyBand: "#0b1224", stars: "#7e8ba6", moon: "#dce6c5", moonShade: "#a9b99b",
    cloud: "#17223a", cityFar: "#10192b", city: "#16223a", window: "#776f45",
    dirt: "#24273a", soil: "#171b2c", grass: "#3d5542", grassLight: "#66804f",
    stone: "#343d50", stoneLight: "#4e5a6c", bone: "#f2e0c0", skin: "#d69c7a",
    jacket: "#4e78b8", jacketDark: "#29496f", boot: "#171c29", gun: "#aeb7c5", gunDark: "#465167",
    blood: "#f13d5b", flash: "#fff4a3", acid: "#b8ef4d", toxic: "#70dc5c"
  };

  const WEAPONS = {
    pistol: { name: "PISTOL", damage: 18, rate: .28, speed: 72, mag: 10, reload: 1.05, spread: .018, pellets: 1, color: "#fff0a0", kick: .6 },
    smg: { name: "SMG", damage: 9, rate: .095, speed: 67, mag: 28, reload: 1.35, spread: .12, pellets: 1, color: "#ffe06c", kick: .28 },
    shotgun: { name: "SCATTERGUN", damage: 10, rate: .72, speed: 60, mag: 6, reload: 1.55, spread: .42, pellets: 7, color: "#ffb95f", kick: 1.5 },
    rifle: { name: "RIFLE", damage: 38, rate: .44, speed: 92, mag: 8, reload: 1.45, spread: .01, pellets: 1, color: "#91efff", kick: 1 }
  };
  const WEAPON_ART_KEY = { pistol: "gunPistol", smg: "gunSmg", shotgun: "gunShotgun", rifle: "gunRifle" };
  const HELD_WEAPON_ART = {
    pistol: { width: 6, height: 4, grip: .28, top: -1, muzzle: 4 },
    smg: { width: 8, height: 5, grip: .33, top: -1, muzzle: 5 },
    shotgun: { width: 10, height: 4, grip: .44, top: -1, muzzle: 7 },
    rifle: { width: 12, height: 4, grip: .43, top: -1, muzzle: 8 }
  };
  // The dual-wield pose holds the original gun art out on both sides.
  const DUAL_HELD_WEAPON_ART = {
    pistol: { width: 8, height: 4, grip: .3, muzzle: 6 },
    smg: { width: 9, height: 5, grip: .34, muzzle: 7 },
    shotgun: { width: 11, height: 4, grip: .44, muzzle: 8 },
    rifle: { width: 13, height: 4, grip: .43, muzzle: 9 }
  };
  const MAX_BABY_LEVEL = 5;
  const BABY_TYPES = [
    { id: "blaster", name: "BLASTER BABY", artKey: "babyBlaster", baseCost: 8, color: "#ff795c", values: [.05, .12, .22, .35, .5], describe: value => `+${Math.round(value * 100)}% DAMAGE` },
    { id: "turbo", name: "TURBO BABY", artKey: "babyTurbo", baseCost: 9, color: "#58dcff", values: [.03, .07, .12, .18, .25], describe: value => `+${Math.round(value * 100)}% SPEED + FIRE` },
    { id: "guardian", name: "GUARDIAN BABY", artKey: "babyGuardian", baseCost: 10, color: "#79dc81", values: [{ armor: .03, regen: .2 }, { armor: .07, regen: .5 }, { armor: .12, regen: .9 }, { armor: .18, regen: 1.4 }, { armor: .25, regen: 2 }], describe: value => `+${Math.round(value.armor * 100)}% ARMOR + ${value.regen} HP/S` },
    { id: "lucky", name: "LUCKY BABY", artKey: "babyLucky", baseCost: 9, color: "#ffd45e", values: [.01, .03, .06, .1, .15], describe: value => `+${Math.round(value * 100)}% CRIT` },
    { id: "hopper", name: "HOPPER BABY", artKey: "babyHopper", baseCost: 8, color: "#b984ff", values: [.03, .07, .12, .18, .25], describe: value => `+${Math.round(value * 100)}% JUMP` },
    { id: "ammo", name: "AMMO BABY", artKey: "babyAmmo", baseCost: 9, color: "#e5ad45", values: [.05, .12, .2, .3, .42], describe: value => `+${Math.round(value * 100)}% MAG SIZE` },
    { id: "vampire", name: "VAMPIRE BABY", artKey: "babyVampire", baseCost: 11, color: "#d34d77", values: [.01, .03, .06, .1, .15], describe: value => `+${Math.round(value * 100)}% LIFE STEAL` },
    { id: "frost", name: "FROST BABY", artKey: "babyFrost", baseCost: 10, color: "#9cecff", values: [.02, .05, .09, .14, .2], describe: value => `+${Math.round(value * 100)}% SLOW CHANCE` },
    { id: "shield", name: "SHIELD BABY", artKey: "babyShield", baseCost: 10, color: "#73a8ff", values: [3, 8, 15, 24, 35], describe: value => `+${value} START SHIELD` },
    { id: "magnet", name: "MAGNET BABY", artKey: "babyMagnet", baseCost: 9, color: "#ff6678", values: [.05, .12, .22, .35, .5], describe: value => `+${Math.round(value * 100)}% FAKE TEETH` },
    { id: "boom", name: "BOOM BABY", artKey: "babyBoom", baseCost: 11, color: "#ff9d45", values: [.4, 1, 1.8, 2.8, 4], describe: value => `+${value} BLAST RANGE` },
    { id: "ninja", name: "NINJA BABY", artKey: "babyNinja", baseCost: 10, color: "#8b70d8", values: [.01, .03, .06, .1, .15], describe: value => `+${Math.round(value * 100)}% DODGE` },
    { id: "scout", name: "SCOUT BABY", artKey: "babyScout", baseCost: 8, color: "#4fd6c8", values: [.03, .07, .12, .18, .25], describe: value => `+${Math.round(value * 100)}% BULLET SPEED` }
  ];
  const SHOP_ITEMS = [
    { id: "firstAid", name: "FIRST AID KIT", cost: 4, iconIndex: 3, copy: "+35 HEALTH NOW", apply: () => { state.player.hp = Math.min(state.player.maxHp, state.player.hp + 35); } },
    { id: "ammoCrate", name: "AMMO CRATE", cost: 3, iconIndex: 5, copy: "REFILL EVERY GUN", apply: () => refillAll(state.player) },
    { id: "shieldPack", name: "SHIELD PACK", cost: 5, iconIndex: 16, copy: "+20 SHIELD NEXT LEVEL", apply: () => { state.nextWaveShield += 20; } },
    { id: "reroll", name: "REROLL COUPON", cost: 6, iconIndex: 12, copy: "GET 1 FREE REROLL · PRESS REROLL WHEN READY", apply: () => { state.freeShopRerolls++; } }
  ];
  const GUN_SHOP = [
    { id: "smg", name: "SMG", cost: 12, minWave: 1, iconIndex: 21, copy: "FIRES FAST. GREAT FOR CROWDS." },
    { id: "shotgun", name: "SCATTERGUN", cost: 18, minWave: 2, iconIndex: 22, copy: "7 PELLETS UP CLOSE." },
    { id: "rifle", name: "RIFLE", cost: 22, minWave: 3, iconIndex: 23, copy: "POWERFUL SHOTS PIERCE ENEMIES." }
  ];
  const SHOP_GUNS = [{ id: "pistol", name: "PISTOL", cost: 6, minWave: 1, iconIndex: 20, copy: "RELIABLE SIDEARM. 10 SHOTS." }, ...GUN_SHOP];
  const BODY_ARMORS = [
    { id: "light", name: "LIGHT ARMOR", cost: 10, iconIndex: 2, copy: "+15 MAX HP · +6% ARMOR", maxHp: 15, armor: .06, regen: 0, speedMult: 1 },
    { id: "heavy", name: "HEAVY ARMOR", cost: 18, iconIndex: 8, copy: "+30 MAX HP · +12% ARMOR · -8% SPEED", maxHp: 30, armor: .12, regen: 0, speedMult: .92 },
    { id: "medic", name: "MEDIC ARMOR", cost: 16, iconIndex: 13, copy: "+10 MAX HP · +3% ARMOR · +0.5 HP/S", maxHp: 10, armor: .03, regen: .5, speedMult: 1 }
  ];
  const GEAR_SHOP = [
    ...BODY_ARMORS.map(armor => ({ ...armor, slot: "body", color: armor.id === "heavy" ? "#8594a5" : armor.id === "medic" ? "#91d8a1" : "#7cb5d5" })),
    { id: "hardHat", slot: "head", name: "HARD HAT", cost: 10, copy: "+12 MAX HP", maxHp: 12, color: "#e0b456" },
    { id: "scoutVisor", slot: "head", name: "SCOUT VISOR", cost: 15, copy: "+8% CRITICAL CHANCE", crit: .08, color: "#74dce4" },
    { id: "medicCap", slot: "head", name: "MEDIC CAP", cost: 16, copy: "+0.4 HEALTH PER SECOND", regen: .4, color: "#9bdc9a" },
    { id: "gripGloves", slot: "hands", name: "GRIP GLOVES", cost: 10, copy: "+10% BULLET DAMAGE", damageMult: 1.1, color: "#d7a76d" },
    { id: "quickGloves", slot: "hands", name: "QUICK GLOVES", cost: 14, copy: "+14% FIRE RATE", fireMult: .86, color: "#e6c475" },
    { id: "vampGloves", slot: "hands", name: "VAMP GLOVES", cost: 18, copy: "+2.5% LIFE STEAL", lifeSteal: .025, color: "#d06a88" },
    { id: "runnerBoots", slot: "feet", name: "RED RUNNER BOOTS", cost: 10, copy: "+15% MOVE SPEED", speedMult: 1.15, color: "#ed4652" },
    { id: "springBoots", slot: "feet", name: "SPRING BOOTS", cost: 14, copy: "+15% JUMP POWER", jumpMult: 1.15, color: "#8ed4dd" },
    { id: "shadowBoots", slot: "feet", name: "SHADOW BOOTS", cost: 18, copy: "+6% DODGE CHANCE", dodge: .06, color: "#ab91dc" }
  ];
  const GEAR_SLOTS = ["head", "hands", "feet", "body"];
  const SHOP_SLOT_ORDER = ["gun1", "gun2", "head", "hands", "body", "feet", "baby"];
  const SHOP_SLOT_LABELS = { gun1: "GUN 1", gun2: "GUN 2", head: "HEAD", hands: "HANDS", body: "BODY", feet: "FEET", baby: "BABY" };
  const BUFF_FOOTWEAR = {
    speed: { id: "speed", color: "#ed4652" },
    jumpPower: { id: "jumpPower", color: "#ef704a" },
    dodge: { id: "dodge", color: "#88d177" }
  };

  const keys = Object.create(null);
  const pointer = { x: W * .72, y: GROUND - 8, active: false, down: false };
  const touch = { left: false, right: false, shoot: false };
  const controller = {
    connected: false, index: -1, id: "", moveX: 0, aimX: 1, aimY: 0, aiming: false, shooting: false,
    buttons: [], menuIndex: 0, navLatch: false, kind: "PS5"
  };
  let audio = null;
  let last = performance.now();
  let mode = "title";
  let screenShake = 0;
  let selectedUpgrades = [];
  let selectedSlot = "gun1";
  let pendingGunDelete = null;
  let state = makeState();

  function makeState() {
    return {
      wave: 1, waveTime: 20, waveDuration: 20, spawned: 0, spawnTimer: 1.2,
      kills: 0, score: 0, teeth: 0, time: 0, flash: 0, babySerial: 0, nextWaveShield: 0,
      shopPurchases: Object.create(null), shopRerolls: 0, freeShopRerolls: 0, activeBabyType: null, babyPurchaseUsed: false,
      zombies: [], corpses: [], bullets: [], enemyShots: [], particles: [], texts: [], babies: [],
      player: {
        x: W / 2, y: GROUND - 12, w: 6, h: 12, vx: 0, vy: 0, onGround: true,
        hp: 100, maxHp: 100, speed: 22, jumpPower: 40, maxJumps: 1, jumpsLeft: 1,
        damageMult: 1, fireMult: 1, magMult: 1, bulletSpeed: 1, armor: 0, crit: .05,
        pierce: 0, bonusShots: 0, fireTimer: 0, reloadTimers: { pistol: 0 }, reloadDurations: { pistol: 0 }, reloadMult: 1, invulnerable: 0,
        regen: 0, lifeSteal: 0, dodge: 0, knockback: 0, blastRadius: 0, slowChance: 0,
        shield: 0, shieldMax: 0,
        facing: 1, aimX: 1, aimY: 0, weapon: "pistol", unlocked: ["pistol"], ownedGuns: ["pistol"], ammo: { pistol: 10 },
        equipment: { head: null, hands: null, feet: null, body: null }, cosmeticFootwearBuff: null,
        ownedGear: { head: [], hands: [], feet: [], body: [] },
        upgradeLevels: Object.create(null), bodyArmor: null, muzzle: 0, hurt: 0, shootAnim: 0,
        jumpAnim: 0, jumpLaunchSpeed: 40, walkCycle: 0, walking: false
      }
    };
  }

  function showOnly(target) {
    [ui.title, ui.upgrades, ui.pause, ui.over].forEach(screen => screen.classList.toggle("visible", screen === target));
  }

  function startGame() {
    ensureAudio();
    state = makeState();
    selectedUpgrades = [];
    pendingGunDelete = null;
    equippedHeroSheets.clear();
    mode = "playing";
    showOnly(null);
    ui.hud.classList.remove("hidden");
    startWave(1);
    updateHud();
  }

  function startWave(number) {
    state.wave = number;
    state.waveDuration = Math.min(38, 20 + (number - 1) * 2);
    state.waveTime = state.waveDuration;
    state.spawned = 0;
    state.spawnTimer = .7;
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + Math.ceil(state.player.maxHp * .18));
    state.player.shield = state.player.shieldMax + (babyPower("shield") || 0) + state.nextWaveShield;
    state.nextWaveShield = 0;
    deployBabies();
    ui.banner.innerHTML = `<small>LEVEL ${pad(number)}</small><b>${number === 1 ? `SURVIVE ${state.waveDuration}s` : "SURVIVE THE TIMER"}</b>`;
    ui.banner.classList.remove("show");
    void ui.banner.offsetWidth;
    ui.banner.classList.add("show");
    beep(120, .11, "square", .045);
    setTimeout(() => beep(165, .13, "square", .035), 130);
  }

  function finishWave() {
    if (mode !== "playing") return;
    mode = "upgrade";
    returnCarriedBabies();
    for (const zombie of state.zombies) puff(zombie.x + zombie.w / 2, zombie.y + zombie.h / 2, "#8eeeff", 4, 12);
    state.zombies.length = 0;
    state.enemyShots.length = 0;
    state.bullets.length = 0;
    state.corpses.length = 0;
    ui.cleared.textContent = pad(state.wave);
    ui.hud.classList.add("hidden");
    state.shopPurchases = Object.create(null);
    equippedHeroSheets.clear();
    state.babyPurchaseUsed = false;
    state.shopRerolls = 0;
    selectedUpgrades = shopOffersWithLocks();
    selectedSlot = "gun1";
    pendingGunDelete = null;
    controller.menuIndex = 0;
    controller.offerColumn = 0;
    controller.nextReturn = null;
    renderUpgradeCards();
    setUpgradeSelection(0, false);
    showOnly(ui.upgrades);
    victorySound();
  }

  function renderUpgradeCards() {
    ui.shopBank.textContent = state.teeth.toLocaleString();
    ui.cards.replaceChildren(...selectedUpgrades.map((offer, index) => {
      const slot = document.createElement("div");
      slot.className = `shop-offer-slot${offer.locked ? " locked" : ""}`;
      const button = document.createElement("button");
      const alreadyOwned = offer.kind === "gun" && state.player.ownedGuns.includes(offer.source.id);
      const unavailable = offer.purchased || alreadyOwned || state.teeth < offer.cost || (offer.kind === "baby" && state.babyPurchaseUsed);
      button.type = "button";
      button.className = `upgrade-card offer-card${offer.purchased ? " purchased" : unavailable ? " unavailable" : ""}${offer.locked ? " locked" : ""}`;
      button.setAttribute("aria-disabled", String(unavailable));
      const iconX = (offer.iconIndex % 5) * 25;
      const iconY = Math.floor(offer.iconIndex / 5) * 25;
      const image = offer.kind === "baby"
        ? babyArtUrl(offer.source)
        : offer.kind === "gun"
          ? (pixelAtlases[WEAPON_ART_KEY[offer.source.id]]?.dataUrl || `url("${IMAGE_PATHS[WEAPON_ART_KEY[offer.source.id]]}")`)
          : offer.kind === "gear"
            ? gearArtUrl(offer.source)
          : null;
      const price = offer.purchased ? "BOUGHT" : alreadyOwned ? "OWNED · SWAP ON RIGHT" : offer.cost === 0 ? "EQUIP FREE" : `${offer.cost} FAKE TEETH`;
      button.innerHTML = `<span class="number">0${index + 1}</span><span class="category">${offer.category}</span><span class="icon" aria-hidden="true"></span><b>${offer.name}</b><p>${offer.copy}</p><em class="price">${price}</em>`;
      const icon = button.querySelector(".icon");
      if (image) {
        icon.style.backgroundImage = image;
        icon.style.backgroundSize = "contain";
        icon.style.backgroundPosition = "center";
      } else {
        icon.style.setProperty("--icon-x", `${iconX}%`);
        icon.style.setProperty("--icon-y", `${iconY}%`);
      }
      button.addEventListener("click", () => purchaseOffer(index));
      button.addEventListener("focus", () => setUpgradeSelection(index, false));
      const lock = document.createElement("button");
      lock.type = "button";
      lock.className = `offer-lock${offer.locked ? " locked" : ""}`;
      lock.textContent = offer.locked ? "LOCKED · UNLOCK" : "LOCK PICK";
      lock.setAttribute("aria-label", `${offer.locked ? "Unlock" : "Lock"} ${offer.name} for rerolls and the next shop`);
      lock.setAttribute("aria-pressed", String(Boolean(offer.locked)));
      lock.disabled = offer.purchased;
      lock.addEventListener("click", () => toggleOfferLock(index));
      lock.addEventListener("focus", () => setUpgradeSelection(index + 12, false));
      slot.append(button, lock);
      return slot;
    }));
    const allLocked = selectedUpgrades.every(offer => offer.locked && !offer.purchased);
    ui.rerollCost.textContent = allLocked ? "UNLOCK A PICK FIRST" : state.freeShopRerolls
      ? `FREE · ${state.freeShopRerolls} COUPON${state.freeShopRerolls === 1 ? "" : "S"}` : `${shopRerollCost()} FAKE TEETH`;
    ui.reroll.disabled = allLocked || state.teeth < shopRerollCost();
    renderLoadout();
  }

  function shopRerollCost() { return state.freeShopRerolls ? 0 : Math.min(20, 2 + state.shopRerolls * 2); }

  function shopOffersWithLocks() {
    const locked = selectedUpgrades.map(offer => offer?.locked && !offer.purchased ? offer : null);
    const used = new Set(locked.filter(Boolean).map(offer => offer.id));
    const fresh = chooseShopOffers();
    return fresh.map((offer, index) => {
      if (locked[index]) return locked[index];
      let candidate = offer;
      for (let attempt = 0; used.has(candidate.id) && attempt < 12; attempt++) {
        candidate = chooseShopOffers().find(next => !used.has(next.id)) || candidate;
      }
      used.add(candidate.id);
      return candidate;
    });
  }

  function toggleOfferLock(index) {
    const offer = selectedUpgrades[index];
    if (mode !== "upgrade" || !offer || offer.purchased) return false;
    offer.locked = !offer.locked;
    const selection = controller.menuIndex === index + 12 ? index + 12 : index;
    renderUpgradeCards();
    setUpgradeSelection(selection, false);
    beep(offer.locked ? 350 : 210, .05, "square", .02);
    return true;
  }

  function rerollUpgrades() {
    if (mode !== "upgrade" || selectedUpgrades.every(offer => offer.locked && !offer.purchased)
      || state.teeth < shopRerollCost()) {
      beep(72, .12, "square", .025);
      return false;
    }
    if (state.freeShopRerolls) state.freeShopRerolls--;
    else state.teeth -= shopRerollCost();
    state.shopRerolls++;
    selectedUpgrades = shopOffersWithLocks();
    renderUpgradeCards();
    setUpgradeSelection(controller.menuIndex === 16 && ui.reroll.disabled ? 0 : controller.menuIndex, false);
    beep(460, .06, "square", .03);
    return true;
  }

  function deployBabies() {
    const owned = state.babies.filter(baby => baby.status !== "lost");
    owned.forEach(baby => {
      baby.status = baby.type === state.activeBabyType ? "ground" : "stored";
      baby.carrier = null;
      baby.x = W / 2;
      baby.y = GROUND - 1;
    });
  }

  function returnCarriedBabies() {
    for (const baby of state.babies) {
      if (baby.status !== "carried") continue;
      baby.status = "ground";
      baby.carrier = null;
      baby.y = GROUND - 1;
    }
  }

  function babyArtUrl(type) {
    const definition = typeof type === "string" ? BABY_TYPES.find(entry => entry.id === type) : type;
    if (!definition) return "none";
    return pixelAtlases[definition.artKey]?.dataUrl || `url("${IMAGE_PATHS[definition.artKey]}")`;
  }

  function gearArtUrl(item) {
    if (gearIconCache.has(item.id)) return gearIconCache.get(item.id);
    const icon = document.createElement("canvas");
    icon.width = icon.height = 24;
    const artContext = icon.getContext("2d");
    const block = (color, x, y, w, h) => { artContext.fillStyle = color; artContext.fillRect(x, y, w, h); };
    const outline = "#20202d";
    if (item.slot === "head") {
      block(outline, 5, 5, 14, 12); block(outline, 2, 15, 20, 4);
      block(item.color, 7, 7, 10, 8); block(item.color, 4, 15, 16, 2);
      block("#fff2d1", 9, 7, 6, 2);
    } else if (item.slot === "hands") {
      block(outline, 5, 3, 14, 17); block(outline, 2, 10, 5, 8); block(outline, 7, 19, 10, 3);
      block(item.color, 7, 6, 10, 12); block(item.color, 4, 12, 4, 4);
      block("#fff2d1", 9, 7, 6, 2);
    } else if (item.slot === "feet") {
      block(outline, 3, 5, 8, 15); block(outline, 13, 5, 8, 15);
      block(outline, 1, 17, 11, 4); block(outline, 12, 17, 11, 4);
      block(item.color, 5, 7, 5, 11); block(item.color, 14, 7, 5, 11);
      block("#fff2d1", 4, 19, 7, 2); block("#fff2d1", 13, 19, 8, 2);
    } else {
      block(outline, 5, 3, 14, 18); block(outline, 2, 6, 6, 9); block(outline, 16, 6, 6, 9);
      block(item.color, 7, 5, 10, 14); block(item.color, 4, 8, 4, 5); block(item.color, 16, 8, 4, 5);
      block("#fff2d1", 9, 7, 6, 2);
    }
    const url = `url("${icon.toDataURL("image/png")}")`;
    gearIconCache.set(item.id, url);
    return url;
  }

  function buyBaby(index) {
    const babyType = BABY_TYPES[index];
    if (mode !== "upgrade" || !babyType || state.babyPurchaseUsed) return false;
    const level = ownedBabyLevel(babyType.id);
    const cost = level >= MAX_BABY_LEVEL ? 0 : babyUpgradeCost(babyType, level);
    if (state.teeth < cost) {
      beep(72, .12, "square", .025);
      return false;
    }
    state.teeth -= cost;
    applyBabyChoice(babyType);
    renderUpgradeCards();
    renderBabyHud();
    beep(523, .08, "square", .035);
    setTimeout(() => beep(784, .11, "square", .03), 75);
    return true;
  }

  function applyBabyChoice(babyType) {
    let baby = state.babies.find(entry => entry.type === babyType.id && entry.status !== "lost");
    if (baby) baby.level = Math.min(MAX_BABY_LEVEL, baby.level + 1);
    else {
      baby = {
        id: ++state.babySerial,
        type: babyType.id,
        level: 1,
        status: "stored",
        carrier: null,
        x: W / 2,
        y: GROUND - 1
      };
      state.babies.push(baby);
    }
    state.activeBabyType = babyType.id;
    state.babyPurchaseUsed = true;
    equippedHeroSheets.clear();
  }

  function buyShopItem(index) {
    const item = SHOP_ITEMS[index];
    if (mode !== "upgrade" || !item || state.shopPurchases[item.id]) return false;
    if (state.teeth < item.cost) {
      beep(72, .12, "square", .025);
      return false;
    }
    state.teeth -= item.cost;
    state.shopPurchases[item.id] = true;
    item.apply();
    renderUpgradeCards();
    beep(392, .07, "square", .03);
    setTimeout(() => beep(587, .09, "square", .025), 65);
    return true;
  }

  function hasBaby(type) {
    return babyLevel(type) > 0;
  }

  function ownedBabyLevel(type) {
    return state.babies.find(baby => baby.type === type && baby.status !== "lost")?.level || 0;
  }

  function babyLevel(type) {
    return state.activeBabyType === type ? ownedBabyLevel(type) : 0;
  }

  function babyPower(type) {
    const babyType = BABY_TYPES.find(entry => entry.id === type);
    const level = babyLevel(type);
    return babyType && level ? babyType.values[level - 1] : null;
  }

  function babyBuffCopy(babyType, level) {
    if (level <= 0) return `LV 1: ${babyType.describe(babyType.values[0])}`;
    if (level >= MAX_BABY_LEVEL) return `LV ${level}: ${babyType.describe(babyType.values[level - 1])}`;
    return `LV ${level}: ${babyType.describe(babyType.values[level - 1])} → LV ${level + 1}: ${babyType.describe(babyType.values[level])}`;
  }

  function babyUpgradeCost(babyType, currentLevel) {
    return Math.ceil(babyType.baseCost * [1, 1.7, 2.6, 3.8, 5.2][Math.min(currentLevel, MAX_BABY_LEVEL - 1)]);
  }

  function renderLoadout() {
    const player = state.player;
    const buffCount = Object.values(player.upgradeLevels).reduce((sum, level) => sum + level, 0);
    const signedPercent = value => `${value >= 0 ? "+" : ""}${Math.round(value)}%`;
    ui.weaponCount.textContent = `${player.unlocked.length} / 2 · ${player.unlocked.length === 2 ? "BOTH FIRE" : "BUY A GUN"}`;
    const equippedItems = GEAR_SLOTS.filter(slot => player.equipment[slot]).length + Number(Boolean(state.activeBabyType));
    ui.itemCount.textContent = `${equippedItems} EQUIPPED · ${buffCount} BUFF${buffCount === 1 ? "" : "S"}`;
    ui.itemCount.title = Object.entries(player.upgradeLevels)
      .filter(([, level]) => level > 0)
      .map(([id, level]) => `${upgradePool.find(upgrade => upgrade.id === id)?.name || id} LV ${level}`)
      .join(" · ") || "No buffs yet";
    const buildStats = [
      { key: "hp", label: "HP", value: `${Math.ceil(player.hp)} / ${player.maxHp}`, change: player.maxHp - 100 },
      { key: "damage", label: "DAMAGE", value: signedPercent((player.damageMult - 1) * 100), change: player.damageMult - 1 },
      { key: "fire", label: "FIRE RATE", value: signedPercent((1 / player.fireMult - 1) * 100), change: 1 - player.fireMult },
      { key: "speed", label: "SPEED", value: signedPercent((player.speed / 22 - 1) * 100), change: player.speed - 22 },
      { key: "armor", label: "ARMOR", value: `${Math.round(player.armor * 100)}%`, change: player.armor },
      { key: "dodge", label: "DODGE", value: `${Math.round(player.dodge * 100)}%`, change: player.dodge }
    ];
    ui.buildStats.innerHTML = buildStats.map(stat => `<div class="build-stat${stat.change > .001 ? " positive" : stat.change < -.001 ? " negative" : ""}" data-stat="${stat.key}"><small>${stat.label}</small><b>${stat.value}</b></div>`).join("");
    for (const button of ui.slotButtons) {
      const slot = button.dataset.slot;
      const id = slot === "gun1" ? player.unlocked[0] : slot === "gun2" ? player.unlocked[1] : slot === "baby" ? state.activeBabyType : player.equipment[slot];
      const item = GEAR_SHOP.find(entry => entry.id === id && entry.slot === slot);
      const definition = slot === "baby" ? BABY_TYPES.find(entry => entry.id === id) : null;
      const name = slot.startsWith("gun") ? WEAPONS[id]?.name : slot === "baby" ? definition?.name : item?.name;
      const icon = slot.startsWith("gun") && id ? pixelAtlases[WEAPON_ART_KEY[id]]?.dataUrl || `url("${IMAGE_PATHS[WEAPON_ART_KEY[id]]}")`
        : slot === "baby" && id ? babyArtUrl(id) : item ? gearArtUrl(item) : "none";
      button.innerHTML = `<span class="slot-label">${SHOP_SLOT_LABELS[slot]}</span><span class="slot-icon" aria-hidden="true"></span><span class="slot-name">${name || "EMPTY"}</span>`;
      button.querySelector(".slot-icon").style.backgroundImage = icon;
      button.classList.toggle("selected", controller.menuIndex >= 4 && controller.menuIndex < 11 && slot === selectedSlot);
      button.classList.toggle("empty", !id);
      button.setAttribute("aria-label", `${SHOP_SLOT_LABELS[slot]}: ${name || "empty"}. Select to switch owned equipment.`);
    }
    for (const button of ui.gunDeleteButtons) {
      const gun = equippedInSlot(button.dataset.gunSlot);
      const canDelete = Boolean(gun && playerCanDeleteGun());
      button.classList.toggle("hidden", !canDelete);
      button.classList.toggle("confirm", canDelete && pendingGunDelete === gun);
      button.dataset.gunId = gun || "";
      button.textContent = pendingGunDelete === gun ? "SURE?" : "DEL";
      button.setAttribute("aria-label", `${pendingGunDelete === gun ? "Confirm deleting" : "Delete"} ${WEAPONS[gun]?.name || "gun"}. ${pendingGunDelete === gun ? "Press again to confirm." : "Press twice to confirm."}`);
    }
    drawLoadoutPreview();
  }

  function equippedInSlot(slot) {
    if (slot === "gun1") return state.player.unlocked[0] || null;
    if (slot === "gun2") return state.player.unlocked[1] || null;
    if (slot === "baby") return state.activeBabyType;
    return state.player.equipment[slot];
  }

  function ownedSlotOptions(slot) {
    const player = state.player;
    if (slot === "gun1") return [...player.ownedGuns];
    if (slot === "gun2") return [null, ...player.ownedGuns.filter(id => id !== player.unlocked[0])];
    if (slot === "baby") return [null, ...BABY_TYPES.filter(type => ownedBabyLevel(type.id)).map(type => type.id)];
    return [null, ...player.ownedGear[slot]];
  }

  function cycleOwnedSlot(slot) {
    if (mode !== "upgrade" || !SHOP_SLOT_ORDER.includes(slot)) return false;
    const choices = ownedSlotOptions(slot);
    if (choices.length < 2) { beep(85, .07, "square", .015); return false; }
    const current = equippedInSlot(slot);
    const next = choices[(choices.indexOf(current) + 1) % choices.length];
    const changed = slot.startsWith("gun") ? equipOwnedGun(slot === "gun1" ? 0 : 1, next)
      : slot === "baby" ? (state.activeBabyType = next, equippedHeroSheets.clear(), true)
        : equipGear(slot, next);
    if (!changed) { beep(85, .07, "square", .015); return false; }
    selectedSlot = slot;
    pendingGunDelete = null;
    renderLoadout();
    beep(390, .05, "square", .018);
    return true;
  }

  function playerCanDeleteGun() { return state.player.ownedGuns.length > 1; }

  function drawLoadoutPreview() {
    const preview = ui.loadoutPreview;
    const context = preview.getContext("2d");
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, preview.width, preview.height);
    context.fillStyle = "#0a1220";
    context.fillRect(0, 0, preview.width, preview.height);
    context.fillStyle = "#223a3b";
    context.fillRect(0, 111, preview.width, 17);
    context.fillStyle = "#49745c";
    context.fillRect(0, 108, preview.width, 4);
    const sheet = getEquippedHeroSheet("idle", art.heroIdle, state.player);
    if (!sheet?.width || !sheet?.height) return;
    const cellWidth = state.player.unlocked.length > 1 ? 256 : 96;
    const cellHeight = 96;
    const source = sheet instanceof HTMLCanvasElement ? sheet : cleanSheets.get(sheet) || sheet;
    if (!source?.width) return;
    context.drawImage(source, 0, 0, cellWidth, cellHeight, 0, 4, preview.width, 104);
  }

  function requestDeleteGun(key) {
    const player = state.player;
    if (mode !== "upgrade" || !player.ownedGuns.includes(key) || !playerCanDeleteGun()) {
      beep(72, .08, "square", .018);
      return false;
    }
    if (pendingGunDelete !== key) {
      pendingGunDelete = key;
      renderLoadout();
      return false;
    }
    player.ownedGuns = player.ownedGuns.filter(id => id !== key);
    player.unlocked = player.unlocked.filter(id => id !== key);
    if (!player.unlocked.length) player.unlocked = [player.ownedGuns[0]];
    if (!player.unlocked.includes(player.weapon)) player.weapon = player.unlocked[0];
    delete player.ammo[key];
    delete player.reloadTimers[key];
    delete player.reloadDurations[key];
    pendingGunDelete = null;
    equippedHeroSheets.clear();
    renderUpgradeCards();
    setUpgradeSelection(controller.menuIndex >= 17 ? controller.menuIndex - 13 : controller.menuIndex, false);
    beep(115, .12, "square", .025);
    return true;
  }

  const upgradePool = [
    { id: "damage", name: "HEAVY ROUNDS", icon: "+", copy: "+25% bullet damage. Every hit lands harder.", apply: p => p.damageMult *= 1.25 },
    { id: "rate", name: "HAIR TRIGGER", icon: ">", copy: "+18% fire rate for every unlocked gun.", apply: p => p.fireMult *= .82 },
    { id: "speed", name: "RUNNER BOOTS", icon: "»", copy: "+18% movement speed. Keep space around you.", apply: p => p.speed *= 1.18 },
    { id: "health", name: "TOUGHNESS", icon: "♥", copy: "+25 maximum health and heal 25 health now.", apply: p => { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 25); } },
    { id: "medkit", name: "FIELD MEDKIT", icon: "+", copy: "Restore all health and gain 5 maximum health.", apply: p => { p.maxHp += 5; p.hp = p.maxHp; } },
    { id: "mag", name: "DEEP MAGS", icon: "▣", copy: "+35% magazine capacity for all guns.", apply: p => { p.magMult *= 1.35; refillAll(p); } },
    { id: "crit", name: "DEAD EYE", icon: "×", copy: "+10% critical-hit chance for double damage.", apply: p => p.crit = Math.min(.65, p.crit + .10) },
    { id: "pierce", name: "PIERCING", icon: "→", copy: "Bullets pass through one more zombie.", apply: p => p.pierce += 1 },
    { id: "armor", name: "RIOT PADDING", icon: "◆", copy: "Take 12% less damage from every attack.", apply: p => p.armor = Math.min(.6, p.armor + .12) },
    { id: "multishot", name: "DOUBLE TAP", icon: "∴", copy: "Fire one extra round in a narrow spread.", apply: p => p.bonusShots += 1 },
    { id: "velocity", name: "HOT LOAD", icon: "!", copy: "+20% bullet speed and longer effective range.", apply: p => p.bulletSpeed *= 1.2 },
    { id: "jumpPower", name: "ROCKET SOLES", icon: "↟", copy: "+14% jump height and stronger air control.", apply: p => p.jumpPower *= 1.14 },
    { id: "reload", name: "QUICK HANDS", icon: "↻", copy: "Reload every weapon 18% faster.", apply: p => p.reloadMult *= .82 },
    { id: "regen", name: "VITAMINS", icon: "✚", copy: "Regenerate 0.6 health every second.", apply: p => p.regen += .6 },
    { id: "lifesteal", name: "VAMPIRE ROUNDS", icon: "◒", copy: "Heal for 2.5% of bullet damage dealt.", apply: p => p.lifeSteal = Math.min(.15, p.lifeSteal + .025) },
    { id: "dodge", name: "LUCKY SLIPPERS", icon: "◇", copy: "+8% chance to dodge an enemy hit completely.", apply: p => p.dodge = Math.min(.4, p.dodge + .08) },
    { id: "shield", name: "ENERGY SHIELD", icon: "◉", copy: "+15 shield restored at the start of every level.", apply: p => { p.shieldMax += 15; p.shield = p.shieldMax; } },
    { id: "knockback", name: "KNOCKBACK ROUNDS", icon: "⇥", copy: "Every bullet pushes enemies farther away.", apply: p => p.knockback += 1.4 },
    { id: "blast", name: "BLAST ROUNDS", icon: "✹", copy: "Bullet impacts damage nearby enemies.", apply: p => p.blastRadius += 2.5 },
    { id: "slow", name: "ICE ROUNDS", icon: "❄", copy: "+12% chance to slow an enemy for two seconds.", apply: p => p.slowChance = Math.min(.72, p.slowChance + .12) },
    { id: "doubleJump", name: "DOUBLE JUMP", icon: "↑", copy: "Jump one extra time while in the air.", oneTime: true, eligible: p => p.maxJumps === 1, apply: p => { p.maxJumps = 2; p.jumpsLeft = 2; } },
    { id: "tripleJump", name: "TRIPLE JUMP", icon: "⇈", copy: "Add a third mid-air jump.", oneTime: true, eligible: p => p.maxJumps === 2, apply: p => { p.maxJumps = 3; p.jumpsLeft = 3; } },
    { id: "smg", name: "UNLOCK: SMG", icon: "▰", copy: "Fast automatic fire and a 28-round magazine.", oneTime: true, eligible: p => !p.unlocked.includes("smg"), apply: p => unlockWeapon(p, "smg") },
    { id: "shotgun", name: "UNLOCK: SCATTERGUN", icon: "≡", copy: "Seven pellets. Huge damage up close.", oneTime: true, minWave: 2, eligible: p => !p.unlocked.includes("shotgun"), apply: p => unlockWeapon(p, "shotgun") },
    { id: "rifle", name: "UNLOCK: RIFLE", icon: "═", copy: "High damage, perfect accuracy, piercing shots.", oneTime: true, minWave: 3, eligible: p => !p.unlocked.includes("rifle"), apply: p => unlockWeapon(p, "rifle") }
  ];

  function chooseShopOffers() {
    const player = state.player;
    const regularBuffs = upgradePool.filter(upgrade =>
      !["smg", "shotgun", "rifle"].includes(upgrade.id)
      && (!upgrade.minWave || state.wave >= upgrade.minWave)
      && (!upgrade.eligible || upgrade.eligible(player))
    );
    const buff = shuffle(regularBuffs)[0];
    const gunChoices = SHOP_GUNS.filter(gun => state.wave >= gun.minWave && !player.ownedGuns.includes(gun.id));
    const gearChoices = GEAR_SHOP.filter(item => !player.ownedGear[item.slot].includes(item.id));
    const featuredSlot = ["gun", ...GEAR_SLOTS][(state.wave - 1) % (GEAR_SLOTS.length + 1)];
    const featuredChoices = featuredSlot === "gun" ? gunChoices.map(source => ({ kind: "gun", source }))
      : gearChoices.filter(source => source.slot === featuredSlot).map(source => ({ kind: "gear", source }));
    const gear = shuffle(featuredChoices.length ? featuredChoices : [
      ...gunChoices.map(source => ({ kind: "gun", source })),
      ...gearChoices.map(source => ({ kind: "gear", source }))
    ])[0];
    const baby = shuffle(BABY_TYPES)[0];
    const itemChoices = SHOP_ITEMS.filter(item => !state.shopPurchases[item.id]);
    const item = shuffle(itemChoices)[0] || shuffle(regularBuffs.filter(entry => entry !== buff))[0];
    return shuffle([
      makeBuffOffer(buff),
      gear ? makeGearOffer(gear) : makeBuffOffer(shuffle(regularBuffs.filter(entry => entry !== buff))[0] || buff),
      makeBabyOffer(baby),
      itemChoices.includes(item) ? makeItemOffer(item) : makeBuffOffer(item)
    ]);
  }

  function makeBuffOffer(upgrade) {
    const level = state.player.upgradeLevels[upgrade.id] || 0;
    return {
      kind: "buff", id: `buff:${upgrade.id}`, source: upgrade, name: upgrade.name,
      category: upgrade.oneTime ? "PERMANENT SKILL" : "STACKABLE BUFF · UNLIMITED SLOTS",
      copy: `${upgrade.copy} ${upgrade.oneTime ? "" : `CURRENT STACK ${level}.`}`.trim(),
      cost: upgrade.oneTime ? 14 + state.wave * 2 : 6 + Math.min(18, level * 2),
      iconIndex: Math.max(0, upgradePool.indexOf(upgrade)), purchased: false
    };
  }

  function makeGearOffer(choice) {
    const { kind, source } = choice;
    const slotLabel = { head: "HEADWEAR", hands: "HANDWEAR", feet: "FOOTWEAR", body: "BODY ARMOR" }[source.slot];
    return {
      kind, id: `${kind}:${source.id}`, source, name: source.name,
      category: kind === "gun" ? "GUN · 2 SLOTS MAX" : `${slotLabel} · 1 SLOT`,
      copy: kind === "gear" && state.player.equipment[source.slot]
        ? `${source.copy} · OLD GEAR GOES TO BACKPACK`
        : source.copy,
      cost: source.cost, iconIndex: source.iconIndex || 0, purchased: false
    };
  }

  function makeBabyOffer(baby) {
    const level = ownedBabyLevel(baby.id);
    const maxed = level >= MAX_BABY_LEVEL;
    return {
      kind: "baby", id: `baby:${baby.id}`, source: baby, name: baby.name,
      category: "BABY · 1 ACTIVE EACH ROUND",
      copy: maxed ? `MAX LV ${level}: ${baby.describe(baby.values[level - 1])} · EQUIP FOR THE NEXT ROUND` : babyBuffCopy(baby, level),
      cost: maxed ? 0 : babyUpgradeCost(baby, level), iconIndex: 0, purchased: false
    };
  }

  function makeItemOffer(item) {
    return {
      kind: "item", id: `item:${item.id}`, source: item, name: item.name,
      category: "CONSUMABLE ITEM", copy: item.copy, cost: item.cost,
      iconIndex: item.iconIndex, purchased: false
    };
  }

  function purchaseOffer(index) {
    const offer = selectedUpgrades[index];
    if (mode !== "upgrade" || !offer || offer.purchased || state.teeth < offer.cost
      || (offer.kind === "baby" && state.babyPurchaseUsed)
      || (offer.kind === "gun" && state.player.ownedGuns.includes(offer.source.id))) {
      beep(72, .12, "square", .025);
      return false;
    }
    state.teeth -= offer.cost;
    offer.purchased = true;
    offer.locked = false;
    if (offer.kind === "buff") {
      offer.source.apply(state.player);
      state.player.upgradeLevels[offer.source.id] = (state.player.upgradeLevels[offer.source.id] || 0) + 1;
      if (BUFF_FOOTWEAR[offer.source.id]) state.player.cosmeticFootwearBuff = offer.source.id;
      equippedHeroSheets.clear();
    } else if (offer.kind === "gun") {
      equipGun(offer.source.id);
    } else if (offer.kind === "gear") {
      equipGear(offer.source.slot, offer.source.id);
    } else if (offer.kind === "baby") {
      applyBabyChoice(offer.source);
    } else if (offer.kind === "item") {
      state.shopPurchases[offer.source.id] = true;
      offer.source.apply();
    }
    renderUpgradeCards();
    setUpgradeSelection(Math.min(index, 3), false);
    beep(440, .08, "square", .04);
    setTimeout(() => beep(660, .12, "square", .035), 80);
    return true;
  }

  function takeUpgrade(index) {
    return purchaseOffer(index);
  }

  function leaveShop() {
    if (mode !== "upgrade") return false;
    mode = "playing";
    showOnly(null);
    ui.hud.classList.remove("hidden");
    beep(330, .08, "square", .035);
    setTimeout(() => beep(494, .12, "square", .03), 80);
    startWave(state.wave + 1);
    updateHud();
    return true;
  }

  function unlockWeapon(player, key) {
    equipGun(key, player);
  }

  function equipGun(key, player = state.player) {
    if (!WEAPONS[key]) return false;
    if (!player.ownedGuns.includes(key)) player.ownedGuns.push(key);
    if (!player.unlocked.includes(key)) {
      if (player.unlocked.length < 2) player.unlocked.push(key);
      else {
        const replaceIndex = Math.max(0, player.unlocked.indexOf(player.weapon));
        player.unlocked[replaceIndex] = key;
      }
    }
    player.weapon = key;
    player.ammo[key] = magazineSize(player, key);
    player.reloadTimers[key] = 0;
    player.reloadDurations[key] = 0;
    equippedHeroSheets.clear();
    return true;
  }

  function equipOwnedGun(slotIndex, key) {
    const player = state.player;
    if (slotIndex !== 0 && slotIndex !== 1) return false;
    if (key === null) {
      if (slotIndex !== 1) return false;
      player.unlocked.splice(1, 1);
    } else {
      if (!player.ownedGuns.includes(key)) return false;
      const otherIndex = player.unlocked.indexOf(key);
      if (otherIndex === slotIndex) return true;
      if (otherIndex >= 0) {
        if (slotIndex === 1 && !player.unlocked[1]) return false;
        if (player.unlocked[slotIndex]) [player.unlocked[slotIndex], player.unlocked[otherIndex]] = [player.unlocked[otherIndex], player.unlocked[slotIndex]];
      } else player.unlocked[slotIndex] = key;
      if (player.ammo[key] == null) player.ammo[key] = magazineSize(player, key);
    }
    if (!player.unlocked.includes(player.weapon)) player.weapon = player.unlocked[0];
    equippedHeroSheets.clear();
    return true;
  }

  function equipBodyArmor(id) {
    return equipGear("body", id);
  }

  function equipGear(slot, id) {
    if (!GEAR_SLOTS.includes(slot)) return false;
    const player = state.player;
    const next = id === null ? null : GEAR_SHOP.find(item => item.slot === slot && item.id === id);
    if (id !== null && !next) return false;
    if (id !== null && !player.ownedGear[slot].includes(id)) player.ownedGear[slot].push(id);
    if (player.equipment[slot] === id) return true;
    const old = GEAR_SHOP.find(item => item.slot === slot && item.id === player.equipment[slot]);
    const previousMaxHp = player.maxHp;
    const applyStats = (item, sign) => {
      if (!item) return;
      for (const stat of ["maxHp", "armor", "regen", "crit", "lifeSteal", "dodge"]) player[stat] += sign * (item[stat] || 0);
      for (const [stat, bonus] of [["speed", "speedMult"], ["jumpPower", "jumpMult"], ["fireMult", "fireMult"], ["damageMult", "damageMult"]]) {
        const factor = item[bonus] || 1;
        player[stat] *= sign > 0 ? factor : 1 / factor;
      }
    };
    applyStats(old, -1);
    applyStats(next, 1);
    player.maxHp = Math.max(1, player.maxHp);
    player.hp = Math.min(player.maxHp, player.hp + Math.max(0, player.maxHp - previousMaxHp));
    player.equipment[slot] = id;
    if (slot === "body") player.bodyArmor = id;
    equippedHeroSheets.clear();
    return true;
  }

  function refillAll(player) {
    player.unlocked.forEach(key => {
      player.ammo[key] = magazineSize(player, key);
      player.reloadTimers[key] = 0;
      player.reloadDurations[key] = 0;
    });
  }

  function update(dt, elapsed = dt) {
    updateController();
    state.time += dt;
    state.flash = Math.max(0, state.flash - dt);
    screenShake = Math.max(0, screenShake - dt * 10);
    updateParticles(dt);
    updateTexts(dt);
    updateCorpses(dt);
    if (mode !== "playing") return;
    const p = state.player;
    p.fireTimer = Math.max(0, p.fireTimer - dt);
    p.invulnerable = Math.max(0, p.invulnerable - dt);
    p.muzzle = Math.max(0, p.muzzle - dt);
    p.hurt = Math.max(0, p.hurt - dt);
    p.shootAnim = Math.max(0, p.shootAnim - dt);
    const guardianPower = babyPower("guardian");
    const regenRate = p.regen + (guardianPower?.regen || 0);
    if (regenRate > 0 && p.hp > 0) p.hp = Math.min(p.maxHp, p.hp + regenRate * dt);

    const keyboardMove = (keys.KeyD || keys.ArrowRight || touch.right ? 1 : 0) - (keys.KeyA || keys.ArrowLeft || touch.left ? 1 : 0);
    const move = Math.abs(controller.moveX) > .08 ? controller.moveX : keyboardMove;
    const targetVx = move * p.speed * (1 + (babyPower("turbo") || 0));
    p.vx += (targetVx - p.vx) * Math.min(1, dt * (p.onGround ? 14 : 7));
    if (!move && Math.abs(p.vx) < .08) p.vx = 0;
    p.vy += 82 * dt;
    const previousX = p.x;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.x = clamp(p.x, 27, W - 27 - p.w);
    if (p.y + p.h >= GROUND) {
      if (!p.onGround && p.vy > 18) landParticles(p.x + p.w / 2);
      p.y = GROUND - p.h; p.vy = 0; p.onGround = true; p.jumpsLeft = p.maxJumps;
    } else {
      p.onGround = false;
      p.jumpAnim = clamp((p.vy + p.jumpLaunchSpeed) / (2 * p.jumpLaunchSpeed), 0, 1);
    }
    p.walking = p.onGround && Math.abs(move) > .08 && Math.abs(p.x - previousX) > .01;
    if (p.walking) p.walkCycle = (p.walkCycle + Math.abs(p.x - previousX) * ANIMATION_FRAMES / 22) % ANIMATION_FRAMES;
    else p.walkCycle = 0;

    const shooting = pointer.down || keys.KeyJ || keys.KeyK || touch.shoot || controller.shooting;
    updateAim();
    // Walking determines the body's direction until the player actively fires.
    // Keep shooting aimed where the bullets travel so the gun never points backward.
    if (Math.abs(move) > .08 && !shooting) p.facing = Math.sign(move);
    if (shooting) fire();
    for (const key of Object.keys(p.reloadTimers)) {
      if (p.reloadTimers[key] <= 0) continue;
      p.reloadTimers[key] = Math.max(0, p.reloadTimers[key] - dt);
      if (p.reloadTimers[key] === 0) {
        p.reloadDurations[key] = 0;
        p.ammo[key] = magazineSize(p, key);
        beep(230, .05, "square", .025);
      }
    }

    // The countdown follows real elapsed time even when rendering drops frames.
    // Movement still uses the capped step above to keep collisions stable.
    state.waveTime = Math.max(0, state.waveTime - elapsed);
    if (state.waveTime <= 0) {
      finishWave();
      updateHud();
      return;
    }
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.zombies.length < MAX_ACTIVE_ZOMBIES) spawnZombie();
    updateZombies(dt);
    updateBullets(dt);
    updateEnemyShots(dt);
    updateHud();
  }

  function jump() {
    if (mode !== "playing") return;
    const p = state.player;
    if (p.jumpsLeft <= 0) return;
    p.jumpLaunchSpeed = p.jumpPower * (1 + (babyPower("hopper") || 0));
    p.vy = -p.jumpLaunchSpeed;
    p.onGround = false;
    p.jumpAnim = 0;
    p.jumpsLeft--;
    puff(p.x + p.w / 2, p.y + p.h, "#8c91a0", 4, 10);
    beep(175, .07, "square", .025);
  }

  function startReload(key = null) {
    if (mode !== "playing") return false;
    const p = state.player;
    const equipped = p.unlocked.slice(0, 2);
    const candidates = key === null ? equipped : equipped.filter(equippedKey => equippedKey === key);
    let started = false;
    for (const gun of candidates) {
      if ((p.reloadTimers[gun] || 0) > 0 || (p.ammo[gun] ?? magazineSize(p, gun)) >= magazineSize(p, gun)) continue;
      p.reloadDurations[gun] = WEAPONS[gun].reload * p.reloadMult;
      p.reloadTimers[gun] = p.reloadDurations[gun];
      started = true;
    }
    if (!started) return false;
    rumble(.06, .18, 70);
    beep(100, .05, "square", .02);
    return true;
  }

  function fire() {
    const p = state.player;
    if (p.fireTimer > 0) return;
    const equipped = p.unlocked.slice(0, 2);
    equipped.forEach(key => { if (p.ammo[key] <= 0) startReload(key); });
    const firing = equipped.filter(key => p.ammo[key] > 0 && (p.reloadTimers[key] || 0) <= 0);
    if (!firing.length) return;
    const combinedRate = firing.reduce((total, key) => total + WEAPONS[key].rate, 0) / firing.length;
    p.fireTimer = combinedRate * p.fireMult / (1 + (babyPower("turbo") || 0));
    p.muzzle = .055;
    if (p.shootAnim <= 0) p.shootAnim = .5;
    let totalKickX = 0;
    firing.forEach(key => {
      const weapon = WEAPONS[key];
      const weaponArt = equipped.length > 1 ? DUAL_HELD_WEAPON_ART[key] : HELD_WEAPON_ART[key];
      const equippedIndex = equipped.indexOf(key);
      const direction = equipped.length > 1 ? p.facing * (equippedIndex === 0 ? -1 : 1) : Math.sign(p.aimX || p.facing);
      const aimX = equipped.length > 1 ? direction * Math.max(.35, Math.abs(p.aimX)) : p.aimX;
      const aimY = p.aimY;
      const baseAngle = Math.atan2(aimY, aimX);
      const hand = weaponHandPosition(p, equippedIndex, equipped.length);
      const muzzleX = hand.x + (equipped.length > 1 ? direction : p.aimX) * Math.max(2, weaponArt.muzzle - 1);
      const muzzleY = hand.y + aimY * Math.min(4, weaponArt.muzzle * .45);
      p.ammo[key]--;
      totalKickX += aimX * weapon.kick;
      const count = weapon.pellets + p.bonusShots;
      for (let i = 0; i < count; i++) {
        const centered = count === 1 ? 0 : (i / (count - 1) - .5);
        const spread = centered * weapon.spread + (Math.random() - .5) * weapon.spread * .3;
        const angle = baseAngle + spread;
        const speed = weapon.speed * p.bulletSpeed * (1 + (babyPower("scout") || 0)) * (.94 + Math.random() * .1);
        const riflePierce = key === "rifle" ? 1 : 0;
        state.bullets.push({
          x: muzzleX, y: muzzleY,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: .9, damage: weapon.damage * p.damageMult * (1 + (babyPower("blaster") || 0)), color: weapon.color, pierce: p.pierce + riflePierce,
          weapon: key, hand: equippedIndex
        });
      }
      muzzleParticles(muzzleX, muzzleY, aimX, aimY);
    });
    p.vx -= totalKickX;
    shotSound(firing.includes(p.weapon) ? p.weapon : firing[0]);
    const heavyShot = firing.includes("shotgun");
    rumble(heavyShot ? .65 : .24, heavyShot ? .8 : .34, heavyShot ? 100 : 55);
    firing.forEach(key => { if (p.ammo[key] <= 0) startReload(key); });
  }

  function updateAim() {
    const p = state.player;
    let targetX = pointer.x, targetY = pointer.y;
    if (controller.aiming) {
      p.aimX = controller.aimX;
      p.aimY = controller.aimY;
      if (Math.abs(p.aimX) > .1) p.facing = Math.sign(p.aimX);
      return;
    }
    if (!pointer.active || touch.shoot || keys.KeyJ || keys.KeyK || controller.shooting) {
      const target = nearestZombie();
      if (target) { targetX = target.x + target.w / 2; targetY = target.y + target.h * .35; }
      else { targetX = p.x + p.facing * 30; targetY = p.y + 5; }
    }
    const dx = targetX - (p.x + p.w / 2), dy = targetY - (p.y + 5);
    const length = Math.hypot(dx, dy) || 1;
    p.aimX = dx / length; p.aimY = dy / length;
    if (Math.abs(p.aimX) > .1) p.facing = Math.sign(p.aimX);
  }

  function switchWeapon(direction = 1, direct = null) {
    const p = state.player;
    if (mode !== "playing") return;
    let index = direct === null ? (p.unlocked.indexOf(p.weapon) + direction + p.unlocked.length) % p.unlocked.length : direct;
    if (index < 0 || index >= p.unlocked.length) return;
    p.weapon = p.unlocked[index];
    beep(290, .035, "square", .018);
    updateHud();
  }

  function spawnZombie() {
    const wave = state.wave;
    const type = pickEnemyType(wave, Math.random());
    const left = Math.random() < .5;
    const data = {
      walker: { w: 6, h: 10, hp: 34, speed: 6.3, damage: 12, rate: .72, score: 100, teeth: 1 },
      runner: { w: 6, h: 10, hp: 25, speed: 10.5, damage: 9, rate: .52, score: 140, teeth: 2 },
      brute: { w: 6, h: 10, hp: 92, speed: 4.1, damage: 12, rate: 1.45, score: 260, teeth: 3 },
      spitter: { w: 6, h: 10, hp: 45, speed: 4.6, damage: 10, rate: 1.6, score: 220, teeth: 2 },
      tank: { w: 6, h: 10, hp: 145, speed: 3.5, damage: 18, rate: 1.9, score: 420, teeth: 5 },
      nurse: { w: 6, h: 10, hp: 58, speed: 5.2, damage: 8, rate: 1.35, score: 280, teeth: 3 },
      chef: { w: 6, h: 10, hp: 64, speed: 8.1, damage: 17, rate: .78, score: 245, teeth: 2 },
      jetpack: { w: 6, h: 10, hp: 52, speed: 7.2, damage: 11, rate: 1.15, score: 320, teeth: 4 }
    }[type];
    const scale = 1 + (wave - 1) * .2;
    const baseY = GROUND - data.h - (type === "jetpack" ? 8 : 0);
    state.zombies.push({
      ...data, type, x: left ? -data.w - 2 : W + 2, y: baseY, baseY, side: left ? 1 : -1,
      escapeSide: left ? -1 : 1, carryingBaby: null,
      hp: data.hp * scale, maxHp: data.hp * scale, speed: data.speed * (1 + Math.min(.8, wave * .04)),
      attackTimer: .2 + Math.random() * .45, attackAnim: 0, hurt: 0, slowTimer: 0,
      step: Math.random() * 10, dead: false
    });
    state.spawned++;
    state.spawnTimer = Math.max(.18, .9 - state.wave * .06) * (.7 + Math.random() * .55);
  }

  function pickEnemyType(wave, roll) {
    const roster = [{ type: "walker", weight: 42 }];
    if (wave >= 2) roster.push({ type: "runner", weight: 18 }, { type: "chef", weight: 16 });
    if (wave >= 3) roster.push({ type: "brute", weight: 12 });
    if (wave >= 4) roster.push({ type: "spitter", weight: 10 });
    if (wave >= 5) roster.push({ type: "nurse", weight: 8 });
    if (wave >= 6) roster.push({ type: "tank", weight: 6 });
    if (wave >= 7) roster.push({ type: "jetpack", weight: 6 });
    const totalWeight = roster.reduce((sum, entry) => sum + entry.weight, 0);
    let target = clamp(roll, 0, .999999) * totalWeight;
    for (const entry of roster) {
      target -= entry.weight;
      if (target < 0) return entry.type;
    }
    return "walker";
  }

  function updateZombies(dt) {
    const p = state.player;
    const groundBaby = state.babies.find(baby => baby.type === state.activeBabyType && baby.status === "ground");
    let babyHunter = null;
    if (groundBaby) {
      let nearestDistance = Infinity;
      for (const candidate of state.zombies) {
        if (candidate.dead || (candidate.carryingBaby !== null && candidate.carryingBaby !== undefined)) continue;
        const distance = Math.abs(groundBaby.x - (candidate.x + candidate.w / 2));
        if (distance >= nearestDistance) continue;
        nearestDistance = distance;
        babyHunter = candidate;
      }
    }
    for (const z of state.zombies) {
      if (z.dead) continue;
      z.attackTimer -= dt; z.attackAnim = Math.max(0, z.attackAnim - dt); z.hurt = Math.max(0, z.hurt - dt);
      z.slowTimer = Math.max(0, (z.slowTimer || 0) - dt);
      const moveSpeed = z.speed * (z.slowTimer > 0 ? .52 : 1);
      z.step += dt * moveSpeed;
      if (z.type === "jetpack") z.y = z.baseY + Math.sin(state.time * 5 + z.step * .2) * 1.2;

      if (z.carryingBaby !== null && z.carryingBaby !== undefined) {
        const baby = state.babies.find(entry => entry.id === z.carryingBaby);
        if (!baby) {
          z.carryingBaby = null;
        } else {
          z.side = z.escapeSide || (z.x < W / 2 ? -1 : 1);
          z.x += z.side * Math.max(7, moveSpeed * 1.25) * dt;
          baby.x = z.x + z.w / 2;
          baby.y = z.y - 1;
          if (z.x + z.w < -3 || z.x > W + 3) loseCarriedBaby(z, baby);
          continue;
        }
      }

      const babyTarget = z === babyHunter && groundBaby?.status === "ground" ? groundBaby : null;
      if (babyTarget) {
        const babyDx = babyTarget.x - (z.x + z.w / 2);
        z.side = Math.sign(babyDx) || z.side;
        if (Math.abs(babyDx) <= 2.8) pickUpBaby(z, babyTarget);
        else z.x += z.side * moveSpeed * dt;
        continue;
      }

      const dx = (p.x + p.w / 2) - (z.x + z.w / 2);
      z.side = Math.sign(dx) || z.side;
      const distance = Math.abs(dx);
      const ranged = ["spitter", "brute", "tank", "nurse", "jetpack"].includes(z.type);
      const rangedDistance = z.type === "brute" ? 16 : z.type === "tank" ? 20 : 21;
      const maxRange = z.type === "tank" || z.type === "jetpack" ? 55 : 46;
      if (ranged && distance > rangedDistance && distance < maxRange) {
        if (z.attackTimer <= 0) {
          if (z.type === "brute") fireGrandpaShotgun(z);
          else if (z.type === "tank") fireTankShell(z);
          else if (z.type === "nurse") fireNurseSpray(z);
          else if (z.type === "jetpack") fireJetpackVolley(z);
          else throwGrandmaSnack(z);
          z.attackAnim = .75;
          z.attackTimer = z.rate;
        }
      } else if (distance > (p.w + z.w) * .38) {
        z.x += z.side * moveSpeed * dt;
      } else if (z.attackTimer <= 0) {
        z.attackAnim = .75;
        hurtPlayer(z.damage, z.side);
        z.attackTimer = z.rate;
      }
    }
    state.zombies = state.zombies.filter(z => !z.dead);
  }

  function pickUpBaby(zombie, baby) {
    if (baby.status !== "ground") return;
    baby.status = "carried";
    baby.carrier = zombie;
    zombie.carryingBaby = baby.id;
    zombie.escapeSide = zombie.escapeSide || (zombie.x < W / 2 ? -1 : 1);
    state.texts.push({ x: clamp(zombie.x + zombie.w / 2, 12, W - 12), y: zombie.y - 3, life: 1.15, value: "BABY TAKEN!", color: "#ffb45c" });
    beep(88, .14, "sawtooth", .035);
    rumble(.25, .45, 120);
  }

  function dropCarriedBaby(zombie) {
    if (zombie.carryingBaby === null || zombie.carryingBaby === undefined) return;
    const baby = state.babies.find(entry => entry.id === zombie.carryingBaby);
    zombie.carryingBaby = null;
    if (!baby) return;
    baby.status = "ground";
    baby.carrier = null;
    baby.x = clamp(zombie.x + zombie.w / 2, 9, W - 9);
    baby.y = GROUND - 1;
    state.texts.push({ x: baby.x, y: zombie.y - 3, life: 1.15, value: "BABY SAVED!", color: "#8eff8e" });
    puff(baby.x, GROUND - 4, "#8effc1", 9, 15);
    beep(392, .07, "square", .03);
    setTimeout(() => beep(659, .1, "square", .025), 65);
  }

  function loseCarriedBaby(zombie, baby) {
    zombie.carryingBaby = null;
    zombie.dead = true;
    const babyType = BABY_TYPES.find(entry => entry.id === baby.type);
    state.babies = state.babies.filter(entry => entry !== baby);
    if (state.activeBabyType === baby.type) state.activeBabyType = null;
    state.player.shield = Math.min(state.player.shield, state.player.shieldMax + (babyPower("shield") || 0));
    for (const key of state.player.unlocked) state.player.ammo[key] = Math.min(state.player.ammo[key], magazineSize(state.player, key));
    state.texts.push({ x: zombie.escapeSide < 0 ? 15 : W - 15, y: 36, life: 1.7, value: `${babyType?.name || "BABY"} LOST!`, color: COLORS.blood });
    screenShake = Math.max(screenShake, 2.2);
    beep(70, .28, "sawtooth", .045);
    renderBabyHud();
  }

  function throwGrandmaSnack(z) {
    const p = state.player;
    const startX = z.x + z.w / 2, startY = z.y + 3;
    const dx = (p.x + p.w / 2) - startX;
    const flightTime = Math.max(.35, Math.abs(dx) / 27);
    const targetY = p.y + p.h * .45;
    const gravity = 18;
    state.enemyShots.push({
      kind: "thrown", atlasIndex: Math.floor(Math.random() * 8),
      x: startX, y: startY, vx: dx / flightTime,
      vy: (targetY - startY - gravity * flightTime * flightTime / 2) / flightTime,
      gravity, rotation: 0, spin: z.side * (5 + Math.random() * 5), size: 3.5,
      life: 2.2, damage: z.damage
    });
    beep(92, .08, "square", .018);
  }

  function fireGrandpaShotgun(z) {
    const p = state.player;
    const startX = z.x + z.w / 2 + z.side * 4, startY = z.y + 4;
    const baseAngle = Math.atan2((p.y + 5) - startY, (p.x + p.w / 2) - startX);
    for (let i = 0; i < 5; i++) {
      const angle = baseAngle + (i - 2) * .085;
      state.enemyShots.push({
        kind: "buckshot", x: startX, y: startY,
        vx: Math.cos(angle) * 38, vy: Math.sin(angle) * 38,
        gravity: 0, rotation: 0, spin: 0, size: 1,
        life: 1.25, damage: z.damage
      });
    }
    muzzleParticles(startX, startY, Math.cos(baseAngle), Math.sin(baseAngle));
    screenShake = Math.max(screenShake, .8);
    beep(63, .14, "square", .045);
  }

  function fireTankShell(z) {
    const p = state.player;
    const startX = z.x + z.w / 2 + z.side * 4, startY = z.y + 4;
    const dx = (p.x + p.w / 2) - startX, dy = (p.y + 5) - startY;
    const length = Math.hypot(dx, dy) || 1;
    state.enemyShots.push({
      kind: "tankShell", x: startX, y: startY,
      vx: dx / length * 30, vy: dy / length * 30,
      gravity: 0, rotation: 0, spin: z.side * 8, size: 2.5,
      life: 2.2, damage: z.damage
    });
    screenShake = Math.max(screenShake, 1.2);
    puff(startX, startY, "#9ca4ad", 8, 15);
    beep(48, .2, "square", .055);
  }

  function fireNurseSpray(z) {
    const p = state.player;
    const startX = z.x + z.w / 2 + z.side * 3, startY = z.y + 4;
    const baseAngle = Math.atan2((p.y + 5) - startY, (p.x + p.w / 2) - startX);
    for (let i = -1; i <= 1; i++) {
      const angle = baseAngle + i * .11;
      state.enemyShots.push({
        kind: "medicine", atlasIndex: Math.random() < .5 ? 0 : 1,
        x: startX, y: startY, vx: Math.cos(angle) * 26, vy: Math.sin(angle) * 26,
        gravity: 0, rotation: 0, spin: (4 + Math.random() * 4) * z.side, size: 2.4,
        life: 2, damage: z.damage
      });
    }
    for (const ally of state.zombies) {
      if (ally === z || ally.dead || Math.abs(ally.x - z.x) > 20) continue;
      ally.hp = Math.min(ally.maxHp, ally.hp + ally.maxHp * .1);
      puff(ally.x + ally.w / 2, ally.y + 3, "#70e77a", 3, 7);
    }
    beep(225, .1, "square", .018);
  }

  function fireJetpackVolley(z) {
    const p = state.player;
    const startX = z.x + z.w / 2 + z.side * 3, startY = z.y + 4;
    const baseAngle = Math.atan2((p.y + 5) - startY, (p.x + p.w / 2) - startX);
    for (let i = -1; i <= 1; i++) {
      const angle = baseAngle + i * .13;
      state.enemyShots.push({
        kind: "rocket", x: startX, y: startY,
        vx: Math.cos(angle) * 34, vy: Math.sin(angle) * 34,
        gravity: 0, rotation: angle, spin: 0, size: 2,
        life: 1.8, damage: z.damage
      });
    }
    puff(startX, startY, "#55d8ff", 5, 10);
    beep(112, .09, "sawtooth", .025);
  }

  function updateBullets(dt) {
    for (const bullet of state.bullets) {
      const oldX = bullet.x, oldY = bullet.y;
      bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt; bullet.life -= dt;
      let hit = null;
      let firstContact = Infinity;
      for (const zombie of state.zombies) {
        if (zombie.dead || bullet.hitTargets?.has(zombie)) continue;
        // The bright 3x sprite is visual only; the center path remains the fair hitbox.
        const contact = segmentBoxEntry(oldX, oldY, bullet.x, bullet.y, zombie.x, zombie.y, zombie.w, zombie.h);
        if (contact === null || contact >= firstContact) continue;
        hit = zombie;
        firstContact = contact;
      }
      if (hit) {
        (bullet.hitTargets ??= new Set()).add(hit);
        const p = state.player;
        const critical = Math.random() < Math.min(.9, p.crit + (babyPower("lucky") || 0));
        const damage = bullet.damage * (critical ? 2 : 1);
        hit.hp -= damage; hit.hurt = .09;
        if (p.knockback > 0) hit.x += Math.sign(bullet.vx) * p.knockback;
        const slowChance = Math.min(.9, p.slowChance + (babyPower("frost") || 0));
        const lifeSteal = Math.min(.3, p.lifeSteal + (babyPower("vampire") || 0));
        const blastRadius = p.blastRadius + (babyPower("boom") || 0);
        if (slowChance > 0 && Math.random() < slowChance) hit.slowTimer = 2;
        if (lifeSteal > 0) p.hp = Math.min(p.maxHp, p.hp + damage * lifeSteal);
        if (blastRadius > 0) {
          const centerX = hit.x + hit.w / 2;
          for (const nearby of state.zombies) {
            if (nearby === hit || nearby.dead || Math.abs((nearby.x + nearby.w / 2) - centerX) > blastRadius) continue;
            nearby.hp -= damage * .35;
            nearby.hurt = .09;
            if (nearby.hp <= 0) killZombie(nearby);
          }
          puff(centerX, hit.y + hit.h / 2, "#ff9f4a", 8, 20);
        }
        damageText(hit.x + hit.w / 2, hit.y - 1, Math.round(damage), critical);
        impactParticles(bullet.x, bullet.y, ["brute", "tank"].includes(hit.type) ? "#7892a4" : "#91c967", critical ? 8 : 4);
        beep(critical ? 180 : 120, .025, "square", .014);
        if (hit.hp <= 0) killZombie(hit);
        if (bullet.pierce > 0) { bullet.pierce--; bullet.damage *= .82; bullet.x += Math.sign(bullet.vx) * 1.5; }
        else bullet.life = 0;
      }
      if (bullet.x < -3 || bullet.x > W + 3 || bullet.y < -3 || bullet.y > H) bullet.life = 0;
    }
    state.bullets = state.bullets.filter(b => b.life > 0);
  }

  function updateEnemyShots(dt) {
    const p = state.player;
    for (const shot of state.enemyShots) {
      shot.x += shot.vx * dt; shot.y += shot.vy * dt;
      shot.vy += (shot.gravity || 0) * dt;
      shot.rotation = (shot.rotation || 0) + (shot.spin || 0) * dt;
      shot.life -= dt;
      // Large projectile art should not make near misses count as hits.
      if (shot.x > p.x && shot.x < p.x + p.w && shot.y > p.y && shot.y < p.y + p.h) {
        hurtPlayer(shot.damage, Math.sign(shot.vx)); shot.life = 0;
        const impactColor = shot.kind === "rocket" ? "#55d8ff" : shot.kind === "tankShell" ? "#ff9b45" : shot.kind === "buckshot" ? "#f1c06f" : "#f4e3b2";
        puff(shot.x, shot.y, impactColor, shot.kind === "tankShell" ? 13 : 7, shot.kind === "tankShell" ? 24 : 16);
      }
    }
    state.enemyShots = state.enemyShots.filter(s => s.life > 0 && s.x > -3 && s.x < W + 3 && s.y < H + 5);
  }

  function killZombie(zombie) {
    if (zombie.dead) return;
    dropCarriedBaby(zombie);
    zombie.dead = true;
    state.corpses.push({ ...zombie, corpseLife: .82, maxCorpseLife: .82 });
    state.kills++;
    const reward = Math.round(zombie.score * (1 + state.wave * .05));
    state.score += reward;
    const teethReward = Math.max(1, Math.round((zombie.teeth || 1) * (1 + (babyPower("magnet") || 0))));
    state.teeth += teethReward;
    state.texts.push({ x: zombie.x + zombie.w / 2, y: zombie.y - 6, life: .9, value: `+${teethReward} TEETH`, color: "#ffd6e2" });
    screenShake = zombie.type === "brute" ? 2 : .8;
    puff(zombie.x + zombie.w / 2, zombie.y + zombie.h / 2, "#79ad59", zombie.type === "brute" ? 15 : 9, 22);
    for (let i = 0; i < 3; i++) state.particles.push({ x: zombie.x + Math.random() * zombie.w, y: zombie.y + zombie.h / 2, vx: (Math.random() - .5) * 16, vy: -6 - Math.random() * 10, life: .7, max: .7, color: COLORS.blood, size: 1, gravity: 28 });
    beep(zombie.type === "brute" ? 58 : 82, .1, "square", .025);
    rumble(.18, zombie.type === "brute" ? .7 : .35, zombie.type === "brute" ? 110 : 55);
  }

  function hurtPlayer(amount, direction) {
    const p = state.player;
    if (p.invulnerable > 0 || mode !== "playing") return;
    const dodgeChance = Math.min(.6, p.dodge + (babyPower("ninja") || 0));
    if (dodgeChance > 0 && Math.random() < dodgeChance) {
      damageText(p.x + p.w / 2, p.y - 2, "DODGE", false, "#8eeeff");
      puff(p.x + p.w / 2, p.y + 6, "#8eeeff", 5, 12);
      p.invulnerable = .18;
      return;
    }
    const armor = Math.min(.85, p.armor + (babyPower("guardian")?.armor || 0));
    const dealt = Math.max(1, Math.round(amount * (1 - armor)));
    const absorbed = Math.min(p.shield, dealt);
    p.shield -= absorbed;
    const healthDamage = dealt - absorbed;
    p.hp = Math.max(0, p.hp - healthDamage); p.invulnerable = .48; p.hurt = .18; p.vx += direction * 9; p.vy = -5;
    state.flash = .08; screenShake = 2.5;
    damageText(p.x + p.w / 2, p.y - 2, absorbed === dealt ? "BLOCK" : healthDamage, false, absorbed ? "#8eeeff" : COLORS.blood);
    puff(p.x + p.w / 2, p.y + 6, absorbed ? "#8eeeff" : COLORS.blood, 6, 18);
    beep(58, .16, "sawtooth", .045);
    rumble(.85, .9, 170);
    if (p.hp <= 0) gameOver();
  }

  function gameOver() {
    mode = "gameover";
    const best = Math.max(Number(localStorage.getItem("deadCenterBestWave") || 0), state.wave);
    localStorage.setItem("deadCenterBestWave", String(best));
    ui.best.textContent = pad(best);
    ui.finalLevel.textContent = pad(state.wave);
    ui.finalKills.textContent = String(state.kills);
    ui.finalScore.textContent = state.score.toLocaleString();
    ui.hud.classList.add("hidden");
    showOnly(ui.over);
  }

  function pauseGame() {
    if (mode === "playing") { mode = "paused"; ui.hud.classList.add("hidden"); showOnly(ui.pause); }
    else if (mode === "paused") { mode = "playing"; ui.hud.classList.remove("hidden"); showOnly(null); last = performance.now(); }
  }

  function updateParticles(dt) {
    for (const p of state.particles) {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.gravity || 0) * dt;
    }
    state.particles = state.particles.filter(p => p.life > 0);
  }

  function updateTexts(dt) {
    for (const text of state.texts) { text.life -= dt; text.y -= dt * 8; }
    state.texts = state.texts.filter(text => text.life > 0);
  }

  function updateCorpses(dt) {
    for (const corpse of state.corpses) corpse.corpseLife -= dt;
    state.corpses = state.corpses.filter(corpse => corpse.corpseLife > 0);
  }

  function draw() {
    ctx.save();
    const shakeX = screenShake ? Math.round((Math.random() - .5) * screenShake) : 0;
    const shakeY = screenShake ? Math.round((Math.random() - .5) * screenShake) : 0;
    ctx.translate(shakeX, shakeY);
    drawBackground();
    drawEnemyShots();
    drawCorpses();
    drawBabies();
    drawZombies();
    drawPlayer();
    drawBullets();
    drawParticles();
    drawTexts();
    ctx.restore();
    if (state.flash > 0) { ctx.globalAlpha = Math.min(.45, state.flash * 5); fill(0, 0, W, H, "#ff3156"); ctx.globalAlpha = 1; }
  }

  function drawBackground() {
    if (art.background.complete && art.background.naturalWidth) {
      ctx.drawImage(art.background, 0, 0, art.background.naturalWidth, art.background.naturalHeight, 0, 0, W, H);
      return;
    }
    fill(0, 0, W, H, COLORS.sky);
    fill(0, 11, W, 18, COLORS.skyBand);
    // Every star, cloud, moon edge, building, and ground mark sits on the same one-pixel grid.
    [[7,7],[18,15],[28,5],[42,10],[76,6],[91,14],[111,7],[120,19],[59,4],[100,3]].forEach(([x,y], i) => fill(x, y, i % 3 ? 1 : 2, 1, COLORS.stars));
    drawMoon(101, 8);
    drawCloud(16, 18, 0); drawCloud(70, 13, 1);
    // Far city blocks.
    const buildings = [[0,34,9,16],[10,38,7,12],[18,31,10,19],[29,36,6,14],[36,28,12,22],[49,35,8,15],[58,30,11,20],[70,37,6,13],[77,32,10,18],[88,36,9,14],[98,29,8,21],[107,34,9,16],[117,27,11,23]];
    buildings.forEach((b, i) => {
      fill(b[0], b[1], b[2], b[3], i % 2 ? COLORS.city : COLORS.cityFar);
      for (let y = b[1] + 4; y < b[1] + b[3] - 2; y += 5) for (let x = b[0] + 2; x < b[0] + b[2] - 1; x += 4) if ((x + y + i) % 3 === 0) fill(x, y, 1, 1, COLORS.window);
    });
    // Graveyard layer.
    drawTomb(12, 51, 5, 9); drawTomb(21, 54, 4, 6); drawTomb(105, 52, 6, 8); drawTomb(116, 55, 4, 5);
    fill(0, 57, W, 3, COLORS.grass);
    for (let x = 1; x < W; x += 5) fill(x, 55 + ((x * 7) % 3), 1, 3, x % 2 ? COLORS.grass : COLORS.grassLight);
    fill(0, GROUND, W, H - GROUND, COLORS.dirt);
    fill(0, GROUND + 4, W, H - GROUND - 4, COLORS.soil);
    for (let x = 0; x < W; x += 7) fill(x + (x % 3), GROUND + 2 + (x % 5), 3, 1, x % 2 ? "#313349" : "#111625");
  }

  function drawMoon(x, y) {
    const rows = [[3,8],[1,12],[0,14],[0,14],[0,14],[1,12],[3,8]];
    rows.forEach((row, i) => fill(x + row[0], y + i, row[1], 1, COLORS.moon));
    fill(x + 3, y + 2, 3, 2, COLORS.moonShade); fill(x + 9, y + 5, 3, 1, COLORS.moonShade);
  }

  function drawCloud(x, y, flip) {
    fill(x + 2, y, 7, 2, COLORS.cloud); fill(x, y + 2, 13, 2, COLORS.cloud); fill(x + (flip ? 8 : 3), y - 1, 4, 2, COLORS.cloud);
  }

  function drawTomb(x, y, w, h) {
    fill(x + 1, y, w - 2, 1, COLORS.stoneLight); fill(x, y + 1, w, h - 1, COLORS.stone); fill(x + 1, y + 3, w - 2, 1, "#252d3e"); fill(x + Math.floor(w / 2), y + 2, 1, 3, COLORS.stoneLight);
  }

  function drawPlayer() {
    const p = state.player;
    if (mode === "title") return;
    if (p.invulnerable > 0 && Math.floor(p.invulnerable * 18) % 2) return;
    const size = PLAYER_SPRITE_SIZE;
    const dualWielding = p.unlocked.length > 1;
    const y = Math.round(p.y + p.h - size);
    const { key: animationKey, frame } = selectPlayerAnimation(p);
    const baseImages = { idle: art.heroIdle, walk: art.heroWalk, jump: art.heroJump, shoot: art.heroShoot, reload: art.heroReload };
    const image = getEquippedHeroSheet(animationKey, baseImages[animationKey], p);
    const spriteWidth = dualWielding && image.equipmentBaked ? 32 : size;
    const x = Math.round(p.x + p.w / 2 - spriteWidth / 2);
    drawSheetFrame(image, frame, x, y, spriteWidth, size, p.facing < 0);
  }

  function selectPlayerAnimation(player) {
    if (!player.onGround) return { key: "jump", frame: Math.min(ANIMATION_FRAMES - 1, Math.floor(player.jumpAnim * ANIMATION_FRAMES)) };
    if (player.walking) return { key: "walk", frame: Math.floor(player.walkCycle) % ANIMATION_FRAMES };
    if (player.shootAnim > 0) return { key: "shoot", frame: Math.min(ANIMATION_FRAMES - 1, Math.floor((1 - player.shootAnim / .5) * ANIMATION_FRAMES)) };
    const reloading = player.reloadTimers[player.weapon] > 0 ? player.weapon
      : player.unlocked.find(key => player.reloadTimers[key] > 0);
    if (reloading) {
      const duration = player.reloadDurations[reloading] || WEAPONS[reloading].reload * player.reloadMult;
      return { key: "reload", frame: Math.min(ANIMATION_FRAMES - 1, Math.floor((1 - player.reloadTimers[reloading] / duration) * ANIMATION_FRAMES)) };
    }
    return { key: "idle", frame: Math.floor(state.time * 10) % ANIMATION_FRAMES };
  }

  function weaponHandPosition(player, slotIndex, total) {
    const direction = total > 1 ? player.facing * (slotIndex === 0 ? -1 : 1) : player.facing;
    return {
      x: player.x + player.w / 2 + direction * (total > 1 ? 5 : 2),
      y: player.y + 6
    };
  }

  function frontHeroPose(animationKey, frame) {
    const phase = frame * Math.PI * 2 / ANIMATION_FRAMES;
    const pose = { bodyX: 0, bodyY: 0, leftArmX: 0, rightArmX: 0, leftArmY: 0, rightArmY: 0, leftLegX: 0, rightLegX: 0, leftLegY: 0, rightLegY: 0 };
    if (animationKey === "walk") {
      const stride = Math.sin(phase * 2);
      pose.bodyX = Math.round(Math.sin(phase) * 2);
      pose.bodyY = -Math.round(Math.abs(stride) * 2);
      pose.leftArmY = Math.round(-stride * 3);
      pose.rightArmY = Math.round(stride * 3);
      pose.leftLegX = Math.round(-stride * 5);
      pose.rightLegX = Math.round(stride * 5);
      pose.leftLegY = -Math.round(Math.max(0, stride) * 3);
      pose.rightLegY = -Math.round(Math.max(0, -stride) * 3);
    } else if (animationKey === "jump") {
      const progress = frame / (ANIMATION_FRAMES - 1);
      const height = Math.sin(progress * Math.PI);
      const riseFall = progress - .5;
      pose.bodyX = Math.round(Math.sin(phase + .4) * 2);
      pose.bodyY = -Math.round(height * 2);
      pose.leftArmY = -Math.round(height * 7) + Math.round(Math.sin(phase * 2));
      pose.rightArmY = -Math.round(height * 7) + Math.round(Math.cos(phase * 2));
      pose.leftArmX = Math.round(height * 3 + Math.sin(phase) * 2);
      pose.rightArmX = -Math.round(height * 3 - Math.cos(phase) * 2);
      pose.leftLegX = Math.round(height * 8 + riseFall * 4);
      pose.rightLegX = -Math.round(height * 8 - riseFall * 4);
      pose.leftLegY = -Math.round(height * 4) + Math.round(riseFall * 2);
      pose.rightLegY = -Math.round(height * 4) - Math.round(riseFall * 2);
    } else if (animationKey === "shoot") {
      const recoil = Math.max(0, 5 - frame % 10);
      pose.bodyX = Math.round(Math.sin(phase) * 2);
      pose.bodyY = Math.round(Math.sin(phase * 2));
      pose.leftArmX = recoil;
      pose.rightArmX = -recoil;
      pose.leftArmY = -Math.round(recoil / 3);
      pose.rightArmY = -Math.round(recoil / 3);
    } else if (animationKey === "reload") {
      const dip = Math.sin(frame / (ANIMATION_FRAMES - 1) * Math.PI);
      pose.bodyY = Math.round(dip * 2);
      pose.leftArmX = Math.round(dip * 4);
      pose.rightArmX = -Math.round(dip * 4);
      pose.leftArmY = Math.round(dip * 6);
      pose.rightArmY = Math.round(dip * 6);
      pose.leftLegX = Math.round(Math.sin(phase) * 2);
      pose.rightLegX = -pose.leftLegX;
    } else {
      pose.bodyY = Math.round(Math.sin(phase) * 2);
      pose.bodyX = Math.round(Math.sin(phase + .7));
      pose.leftArmY = Math.round(Math.sin(phase + .4) * 2);
      pose.rightArmY = Math.round(Math.sin(phase + 1.7) * 2);
      pose.leftArmX = Math.round(Math.sin(phase * 2));
      pose.rightArmX = -Math.round(Math.cos(phase * 2));
    }
    return pose;
  }

  function getFrontHeroSheet(animationKey) {
    if (frontHeroSheets.has(animationKey)) return frontHeroSheets.get(animationKey);
    const sprite = pixelAtlases.heroFront;
    if (!sprite) return null;
    const cell = 96;
    const sheet = document.createElement("canvas");
    sheet.width = cell * SHEET_COLUMNS;
    sheet.height = cell * SHEET_ROWS;
    const context = sheet.getContext("2d");
    context.imageSmoothingEnabled = false;
    const bounds = sprite.cellBounds[0];
    const waist = Math.round(bounds.y + bounds.height * .66);
    const middle = Math.round(bounds.x + bounds.width / 2);
    const armTop = Math.round(bounds.y + bounds.height * .38);
    const leftShoulder = Math.round(bounds.x + bounds.width * .36);
    const rightShoulder = Math.round(bounds.x + bounds.width * .64);

    for (let frame = 0; frame < ANIMATION_FRAMES; frame++) {
      const frameX = frame % SHEET_COLUMNS * cell;
      const frameY = Math.floor(frame / SHEET_COLUMNS) * cell;
      context.save();
      context.beginPath();
      context.rect(frameX, frameY, cell, cell);
      context.clip();
      const pose = frontHeroPose(animationKey, frame);
      const baseX = frameX + pose.bodyX;
      const baseY = frameY + pose.bodyY;
      // Legs and arms are cut from the same source sprite; the torso overlaps
      // their joins so every frame keeps the original clean pixel silhouette.
      context.drawImage(sprite, 0, waist, middle, cell - waist, baseX + pose.leftLegX, baseY + waist + pose.leftLegY, middle, cell - waist);
      context.drawImage(sprite, middle, waist, cell - middle, cell - waist, baseX + middle + pose.rightLegX, baseY + waist + pose.rightLegY, cell - middle, cell - waist);
      context.drawImage(sprite, 0, armTop, leftShoulder + 3, waist + 3 - armTop, baseX + pose.leftArmX, baseY + armTop + pose.leftArmY, leftShoulder + 3, waist + 3 - armTop);
      context.drawImage(sprite, rightShoulder - 3, armTop, cell - rightShoulder + 3, waist + 3 - armTop, baseX + rightShoulder - 3 + pose.rightArmX, baseY + armTop + pose.rightArmY, cell - rightShoulder + 3, waist + 3 - armTop);
      context.drawImage(sprite, 0, 0, cell, armTop, baseX, baseY, cell, armTop);
      context.drawImage(sprite, leftShoulder - 5, armTop, rightShoulder - leftShoulder + 10, waist + 5 - armTop, baseX + leftShoulder - 5, baseY + armTop, rightShoulder - leftShoulder + 10, waist + 5 - armTop);
      context.restore();
    }
    frontHeroSheets.set(animationKey, sheet);
    return sheet;
  }

  function getEquippedHeroSheet(animationKey, baseImage, player) {
    const guns = player.unlocked.slice(0, 2);
    const footwear = playerFootwear(player);
    const buffSignature = Object.entries(player.upgradeLevels).filter(([, level]) => level > 0).map(([id, level]) => `${id}${level}`).sort().join(",");
    const activeBabyLevel = state.activeBabyType ? ownedBabyLevel(state.activeBabyType) : 0;
    const itemSignature = Object.keys(state.shopPurchases).filter(id => state.shopPurchases[id]).sort().join(",");
    const cacheKey = `${animationKey}:${GEAR_SLOTS.map(slot => player.equipment[slot] || "none").join("+")}:${footwear?.id || "none"}:${guns.join("+")}:${buffSignature}:${state.activeBabyType || "none"}:${activeBabyLevel}:${itemSignature}`;
    if (equippedHeroSheets.has(cacheKey)) return equippedHeroSheets.get(cacheKey);
    const dual = guns.length > 1;
    const baseSheet = dual ? getFrontHeroSheet(animationKey) : cleanSheets.get(baseImage);
    if (!baseSheet || guns.some(key => !pixelAtlases[WEAPON_ART_KEY[key]])) return baseImage;

    const cell = 96;
    const outputCellWidth = guns.length > 1 ? 256 : cell;
    const bodyInset = (outputCellWidth - cell) / 2;
    const recolored = document.createElement("canvas");
    recolored.width = baseSheet.width;
    recolored.height = baseSheet.height;
    const recolorContext = recolored.getContext("2d", { willReadFrequently: true });
    recolorContext.imageSmoothingEnabled = false;
    recolorContext.drawImage(baseSheet, 0, 0);
    if (player.bodyArmor) recolorHeroSuit(recolorContext, recolored.width, recolored.height, player.bodyArmor);
    if (footwear) recolorHeroFootwear(recolorContext, recolored.width, recolored.height, footwear.color);
    recolorHeroDetails(recolorContext, baseSheet, player);

    const sourcePixels = recolorContext.getImageData(0, 0, recolored.width, recolored.height).data;
    const output = document.createElement("canvas");
    output.width = outputCellWidth * SHEET_COLUMNS;
    output.height = recolored.height;
    const outputContext = output.getContext("2d");
    outputContext.imageSmoothingEnabled = false;

    for (let frame = 0; frame < ANIMATION_FRAMES; frame++) {
      const frameX = frame % SHEET_COLUMNS * cell;
      const frameY = Math.floor(frame / SHEET_COLUMNS) * cell;
      const outputX = frame % SHEET_COLUMNS * outputCellWidth;
      const bounds = opaqueFrameBounds(sourcePixels, recolored.width, frameX, frameY, cell);
      const bodyWidth = bounds.maxX - bounds.minX + 1;
      const bodyHeight = bounds.maxY - bounds.minY + 1;
      const pose = dual ? frontHeroPose(animationKey, frame) : null;
      const centerX = dual ? outputX + bodyInset + 48 + pose.bodyX : outputX + bodyInset + bounds.minX - frameX + bodyWidth * .5;
      const frontBounds = dual ? pixelAtlases.heroFront.cellBounds[0] : null;
      const handBaseY = dual ? frameY + frontBounds.y + frontBounds.height * .43 + pose.bodyY : bounds.minY + bodyHeight * .53;
      const gripX = dual ? [Math.round(centerX - 38 + pose.leftArmX), Math.round(centerX + 38 + pose.rightArmX)] : null;

      guns.forEach((key, index) => {
        const gun = pixelAtlases[WEAPON_ART_KEY[key]];
        const gunBounds = gun.cellBounds?.[0] || { x: 0, y: 0, width: gun.width, height: gun.height };
        const spec = dual ? DUAL_HELD_WEAPON_ART[key] : HELD_WEAPON_ART[key];
        const width = spec.width * 8;
        const height = spec.height * 8;
        const handY = dual ? handBaseY + (index === 0 ? pose.leftArmY : pose.rightArmY) : handBaseY;
        const handX = dual ? gripX[index] : outputX + bounds.minX - frameX + bodyWidth * .69;
        const gunX = Math.round(handX - width * (index === 0 && dual ? 1 - spec.grip : spec.grip));
        const gunY = Math.round(handY + (spec.top || -1) * 8);
        if (index === 0 && dual) {
          outputContext.save();
          outputContext.translate(gunX + width, 0);
          outputContext.scale(-1, 1);
          outputContext.drawImage(gun, gunBounds.x, gunBounds.y, gunBounds.width, gunBounds.height, 0, gunY, width, height);
          outputContext.restore();
        } else {
          outputContext.drawImage(gun, gunBounds.x, gunBounds.y, gunBounds.width, gunBounds.height, gunX, gunY, width, height);
        }
      });

      outputContext.drawImage(recolored, frameX, frameY, cell, cell, outputX + bodyInset, frameY, cell, cell);
    }
    output.equipmentBaked = true;
    equippedHeroSheets.set(cacheKey, output);
    return output;
  }

  function playerFootwear(player) {
    const equipped = GEAR_SHOP.find(item => item.slot === "feet" && item.id === player.equipment.feet);
    if (equipped) return equipped;
    const buff = player.cosmeticFootwearBuff || ["speed", "jumpPower", "dodge"].find(id => player.upgradeLevels[id]);
    return BUFF_FOOTWEAR[buff] || null;
  }

  function recolorHeroFootwear(context, width, height, color) {
    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    const tint = [1, 3, 5].map(offset => Number.parseInt(color.slice(offset, offset + 2), 16));
    for (let frame = 0; frame < ANIMATION_FRAMES; frame++) {
      const frameX = frame % SHEET_COLUMNS * 96;
      const frameY = Math.floor(frame / SHEET_COLUMNS) * 96;
      const bounds = opaqueFrameBounds(pixels, width, frameX, frameY, 96);
      for (let y = Math.max(frameY, bounds.maxY - 15); y <= bounds.maxY; y++) {
        for (let x = bounds.minX; x <= bounds.maxX; x++) {
          const index = (y * width + x) * 4;
          if (pixels[index + 3] === 0) continue;
          const brightness = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
          if (brightness < 13) continue; // Keep the sprite's original black outline.
          const shade = brightness < 42 ? .58 : brightness < 80 ? .82 : 1.08;
          for (let channel = 0; channel < 3; channel++) pixels[index + channel] = Math.min(255, Math.round(tint[channel] * shade));
        }
      }
    }
    context.putImageData(imageData, 0, 0);
  }

  function recolorHeroDetails(context, baseSheet, player) {
    const width = baseSheet.width;
    const imageData = context.getImageData(0, 0, width, baseSheet.height);
    const pixels = imageData.data;
    const original = baseSheet.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, width, baseSheet.height).data;
    const head = GEAR_SHOP.find(item => item.id === player.equipment.head);
    const hands = GEAR_SHOP.find(item => item.id === player.equipment.hands);
    const baby = BABY_TYPES.find(type => type.id === state.activeBabyType && ownedBabyLevel(type.id) > 0);
    const itemColors = { firstAid: "#e7eee5", ammoCrate: "#e1b45e", shieldPack: "#80d6ec", reroll: "#ba88db" };
    const purchasedItems = Object.keys(state.shopPurchases).filter(id => state.shopPurchases[id] && itemColors[id]);
    const itemColor = purchasedItems.length ? itemColors[purchasedItems[purchasedItems.length - 1]] : null;
    const buffs = Object.entries(player.upgradeLevels).filter(([, level]) => level > 0).sort(([a], [b]) => a.localeCompare(b));
    let buffHash = 2166136261;
    for (const [id, level] of buffs) for (const letter of `${id}:${level}`) buffHash = Math.imul(buffHash ^ letter.charCodeAt(0), 16777619) >>> 0;
    const buffColor = buffs.length ? `#${[buffHash & 255, buffHash >>> 8 & 255, buffHash >>> 16 & 255].map(value => Math.max(105, value).toString(16).padStart(2, "0")).join("")}` : null;
    const rgb = color => color && [1, 3, 5].map(offset => Number.parseInt(color.slice(offset, offset + 2), 16));
    const headColor = rgb(head?.color), handColor = rgb(hands?.color), itemTint = rgb(itemColor);
    const buffTint = rgb(buffColor), babyTint = rgb(baby?.color);
    const white = rgb("#e9eee0"), medicRed = rgb("#d65365");

    for (let frame = 0; frame < ANIMATION_FRAMES; frame++) {
      const frameX = frame % SHEET_COLUMNS * 96;
      const frameY = Math.floor(frame / SHEET_COLUMNS) * 96;
      const bounds = opaqueFrameBounds(original, width, frameX, frameY, 96);
      const bodyWidth = bounds.maxX - bounds.minX + 1;
      const bodyHeight = bounds.maxY - bounds.minY + 1;
      for (let y = bounds.minY; y <= bounds.maxY; y++) {
        const vertical = (y - bounds.minY) / bodyHeight;
        for (let x = bounds.minX; x <= bounds.maxX; x++) {
          const index = (y * width + x) * 4;
          if (!original[index + 3]) continue;
          const red = original[index], green = original[index + 1], blue = original[index + 2];
          const brightness = (red + green + blue) / 3;
          if (brightness < 16) continue; // Preserve the original dark pixel outline.
          const horizontal = (x - bounds.minX) / bodyWidth;
          const hair = red > green * 1.1 && green > blue * 1.02 && red < 170;
          const skin = red > green * 1.12 && green > blue * 1.06 && red > 90;
          const fabric = blue > red * 1.08 && blue > green * 1.03 && blue > 42;
          let tint = null;

          if (head && hair && vertical < .3) {
            if (head.id === "hardHat") tint = headColor;
            else if (head.id === "medicCap") tint = vertical < .2 ? white : headColor;
          }
          if (head?.id === "scoutVisor" && skin && vertical > .28 && vertical < .42 && horizontal > .53) tint = headColor;
          if (hands && skin && vertical > .54 && vertical < .78 && horizontal > .44) tint = handColor;
          if (fabric) {
            if (itemTint && horizontal > .12 && horizontal < .5 && vertical > .43 && vertical < .54) tint = itemTint;
            if (buffTint && horizontal > .12 && horizontal < .52 && vertical >= .54 && vertical < .66) tint = buffTint;
            if (babyTint && horizontal > .16 && horizontal < .53 && vertical >= .66 && vertical < .77) tint = babyTint;
            if (player.bodyArmor === "medic" && horizontal > .53 && horizontal < .64 && vertical > .55 && vertical < .69) tint = medicRed;
          }
          if (!tint) continue;
          const shade = brightness < 45 ? .58 : brightness < 90 ? .8 : 1.04;
          for (let channel = 0; channel < 3; channel++) pixels[index + channel] = Math.min(255, Math.round(tint[channel] * shade));
        }
      }
    }
    context.putImageData(imageData, 0, 0);
  }

  function recolorHeroSuit(context, width, height, armor) {
    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    const palettes = {
      light: [[35, 52, 68], [83, 117, 139], [142, 172, 185]],
      heavy: [[25, 30, 38], [65, 75, 88], [126, 137, 149]],
      medic: [[43, 82, 61], [104, 158, 116], [225, 232, 220]]
    };
    const palette = palettes[armor];
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] === 0) continue;
      const red = pixels[index], green = pixels[index + 1], blue = pixels[index + 2];
      if (blue < 42 || blue < red * 1.12 || blue < green * 1.06) continue;
      const brightness = (red + green + blue) / 3;
      const color = brightness > 115 ? palette[2] : brightness > 65 ? palette[1] : palette[0];
      pixels[index] = color[0]; pixels[index + 1] = color[1]; pixels[index + 2] = color[2];
    }
    context.putImageData(imageData, 0, 0);
  }

  function opaqueFrameBounds(pixels, sheetWidth, frameX, frameY, cell) {
    let minX = frameX + cell, minY = frameY + cell, maxX = frameX, maxY = frameY;
    for (let y = frameY; y < frameY + cell; y++) {
      for (let x = frameX; x < frameX + cell; x++) {
        if (pixels[(y * sheetWidth + x) * 4 + 3] === 0) continue;
        minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
    }
    return maxX > minX ? { minX, minY, maxX, maxY } : { minX: frameX + 24, minY: frameY + 12, maxX: frameX + 72, maxY: frameY + 88 };
  }

  function drawBabies() {
    for (const baby of state.babies) {
      if (baby.status !== "ground") continue;
      const babyType = BABY_TYPES.find(entry => entry.id === baby.type);
      if (!babyType) continue;
      drawBabySprite(baby, baby.x, GROUND - 1, 6);
    }
  }

  function drawBabySprite(baby, centerX, bottomY, size) {
    const babyType = BABY_TYPES.find(entry => entry.id === baby.type);
    if (!babyType) return;
    const source = pixelAtlases[babyType.artKey] || art[babyType.artKey];
    const sourceWidth = source.width || source.naturalWidth;
    const sourceHeight = source.height || source.naturalHeight;
    if (!sourceWidth || !sourceHeight) return;
    const tightFrame = source.cellBounds?.[0];
    ctx.drawImage(
      source,
      tightFrame?.x ?? 0,
      tightFrame?.y ?? 0,
      tightFrame?.width ?? sourceWidth,
      tightFrame?.height ?? sourceHeight,
      Math.round(centerX - size / 2),
      Math.round(bottomY - size),
      Math.round(size),
      Math.round(size)
    );
  }

  function drawZombies() {
    for (const z of state.zombies) {
      const size = ENEMY_SPRITE_SIZE;
      const x = Math.round(z.x + z.w / 2 - size / 2), y = Math.round(z.y + z.h - size);
      const images = enemyImages(z.type);
      const image = z.attackAnim > 0 ? images.attack : images.walk;
      const availableFrames = sheetFrameCount(image);
      const frame = z.attackAnim > 0
        ? Math.min(availableFrames - 1, Math.max(0, Math.floor((1 - z.attackAnim / .75) * availableFrames)))
        : Math.floor(z.step * 2.1) % availableFrames;
      if (z.hurt > 0) ctx.globalAlpha = .6;
      drawSheetFrame(image, frame, x, y, size, size, z.side < 0);
      ctx.globalAlpha = 1;
      if (z.carryingBaby !== null && z.carryingBaby !== undefined) {
        const baby = state.babies.find(entry => entry.id === z.carryingBaby);
        if (baby) {
          drawBabySprite(baby, z.x + z.w / 2, z.y + 1, 5);
          fill(z.x + z.w / 2 - 1, z.y - 7, 3, 1, COLORS.blood);
        }
      }
      if (z.hp < z.maxHp && z.hp > 0) {
        const barX = Math.round(z.x), barY = Math.round(z.y) - 2;
        fill(barX, barY, z.w, 1, "#28131c");
        fill(barX, barY, Math.max(1, Math.round(z.w * z.hp / z.maxHp)), 1, COLORS.acid);
      }
    }
  }

  function drawCorpses() {
    for (const corpse of state.corpses) {
      const size = 13;
      const x = Math.round(corpse.x + corpse.w / 2 - size / 2), y = Math.round(GROUND - size);
      const progress = 1 - corpse.corpseLife / corpse.maxCorpseLife;
      const image = enemyImages(corpse.type).defeat;
      const availableFrames = sheetFrameCount(image);
      const frame = Math.min(availableFrames - 1, Math.floor(progress * availableFrames));
      ctx.globalAlpha = Math.min(1, corpse.corpseLife * 3);
      drawSheetFrame(image, frame, x, y, size, size, corpse.side < 0);
      ctx.globalAlpha = 1;
    }
  }

  function enemyImages(type) {
    if (type === "runner") return { walk: art.trackGrandpaWalk, attack: art.trackGrandpaCane, defeat: art.trackGrandpaDefeat };
    if (type === "brute") return { walk: art.grandpaWalk, attack: art.grandpaShotgun, defeat: art.grandpaDefeat };
    if (type === "spitter") return { walk: art.breakfastGrandmaWalk, attack: art.breakfastGrandmaThrow, defeat: art.breakfastGrandmaDefeat };
    if (type === "tank") return { walk: art.tankGrandpaMove, attack: art.tankGrandpaFire, defeat: art.tankGrandpaDefeat };
    if (type === "nurse") return { walk: art.nurseGrandmaWalk, attack: art.nurseGrandmaSpray, defeat: art.nurseGrandmaDefeat };
    if (type === "chef") return { walk: art.chefGrandpaWalk, attack: art.chefGrandpaPan, defeat: art.chefGrandpaDefeat };
    if (type === "jetpack") return { walk: art.jetpackGrandmaHover, attack: art.jetpackGrandmaRockets, defeat: art.jetpackGrandmaDefeat };
    return { walk: art.grandmaWalk, attack: art.grandmaCane, defeat: art.grandmaDefeat };
  }

  function buildPixelAtlas(image, columns, rows, options = {}) {
    const outputCell = options.outputCell ?? 18;
    const padding = options.padding ?? 2;
    const brightness = options.brightness ?? 1;
    const alphaThreshold = options.alphaThreshold ?? 160;
    const scan = document.createElement("canvas");
    scan.width = image.naturalWidth;
    scan.height = image.naturalHeight;
    const scanContext = scan.getContext("2d", { willReadFrequently: true });
    scanContext.drawImage(image, 0, 0);
    const sourcePixels = scanContext.getImageData(0, 0, scan.width, scan.height).data;
    const output = document.createElement("canvas");
    output.width = columns * outputCell;
    output.height = rows * outputCell;
    const outputContext = output.getContext("2d", { willReadFrequently: true });
    outputContext.imageSmoothingEnabled = Boolean(options.smooth);
    if (options.smooth) outputContext.imageSmoothingQuality = "high";
    const cellBounds = [];

    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const cellLeft = Math.round(column * scan.width / columns);
        const cellRight = Math.round((column + 1) * scan.width / columns);
        const cellTop = Math.round(row * scan.height / rows);
        const cellBottom = Math.round((row + 1) * scan.height / rows);
        let minX = cellRight, minY = cellBottom, maxX = cellLeft - 1, maxY = cellTop - 1;
        for (let y = cellTop + 1; y < cellBottom - 1; y++) {
          for (let x = cellLeft + 1; x < cellRight - 1; x++) {
            const sourceIndex = (y * scan.width + x) * 4;
            if (sourcePixels[sourceIndex + 3] < 190) continue;
            if (options.ignoreDarkGlow && Math.max(sourcePixels[sourceIndex], sourcePixels[sourceIndex + 1], sourcePixels[sourceIndex + 2]) < 45) continue;
            minX = Math.min(minX, x); minY = Math.min(minY, y);
            maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
          }
        }
        if (maxX < minX || maxY < minY) continue;
        const sourceWidth = maxX - minX + 1;
        const sourceHeight = maxY - minY + 1;
        const scale = Math.min((outputCell - padding * 2) / sourceWidth, (outputCell - padding * 2) / sourceHeight);
        const drawWidth = Math.max(1, Math.round(sourceWidth * scale));
        const drawHeight = Math.max(1, Math.round(sourceHeight * scale));
        const drawX = column * outputCell + Math.floor((outputCell - drawWidth) / 2);
        const drawY = row * outputCell + Math.floor((outputCell - drawHeight) / 2);
        outputContext.drawImage(image, minX, minY, sourceWidth, sourceHeight, drawX, drawY, drawWidth, drawHeight);
        cellBounds[row * columns + column] = { x: drawX, y: drawY, width: drawWidth, height: drawHeight };
      }
    }

    const cleaned = outputContext.getImageData(0, 0, output.width, output.height);
    for (let index = 0; index < cleaned.data.length; index += 4) {
      if (cleaned.data[index + 3] < alphaThreshold) {
        cleaned.data[index] = 0; cleaned.data[index + 1] = 0; cleaned.data[index + 2] = 0; cleaned.data[index + 3] = 0;
      } else {
        cleaned.data[index] = Math.min(255, Math.round(cleaned.data[index] * brightness / 24) * 24);
        cleaned.data[index + 1] = Math.min(255, Math.round(cleaned.data[index + 1] * brightness / 24) * 24);
        cleaned.data[index + 2] = Math.min(255, Math.round(cleaned.data[index + 2] * brightness / 24) * 24);
        cleaned.data[index + 3] = 255;
      }
    }
    outputContext.putImageData(cleaned, 0, 0);
    output.cellBounds = cellBounds;
    return output;
  }

  function cleanSpriteSheet(image, key = "") {
    const outputCell = 96;
    const output = document.createElement("canvas");
    output.width = outputCell * SHEET_COLUMNS;
    output.height = outputCell * SHEET_ROWS;
    const cleanContext = output.getContext("2d", { willReadFrequently: true });
    cleanContext.imageSmoothingEnabled = false;
    const sourceCellWidth = image.naturalWidth / SHEET_COLUMNS;
    const sourceCellHeight = image.naturalHeight / SHEET_ROWS;
    for (let row = 0; row < SHEET_ROWS; row++) {
      for (let column = 0; column < SHEET_COLUMNS; column++) {
        cleanContext.drawImage(
          image,
          column * sourceCellWidth,
          row * sourceCellHeight,
          sourceCellWidth,
          sourceCellHeight,
          column * outputCell,
          row * outputCell,
          outputCell,
          outputCell
        );
      }
    }
    const imageData = cleanContext.getImageData(0, 0, output.width, output.height);
    const pixels = imageData.data;
    const cellWidth = outputCell;
    const cellHeight = outputCell;
    const edgeInset = 2;

    for (let y = 0; y < output.height; y++) {
      const localY = y % cellHeight;
      for (let x = 0; x < output.width; x++) {
        const localX = x % cellWidth;
        const index = (y * output.width + x) * 4;
        const red = pixels[index], green = pixels[index + 1], blue = pixels[index + 2], alpha = pixels[index + 3];
        const saturatedRedFringe = red > 190 && green < 80 && red > green * 3 && red > blue * 2.5;
        const saturatedGreenFringe = green > 105 && red < 70 && green > red * 2.4 && green > blue * 1.8;
        const onCellEdge = localX < edgeInset || localX >= cellWidth - edgeInset || localY < edgeInset || localY >= cellHeight - edgeInset;
        const lowChroma = Math.max(red, green, blue) - Math.min(red, green, blue) < 38;
        const oldHeroGun = key.startsWith("hero") && !key.startsWith("heroHeavyDual") && localX >= 58 && localY >= 30 && localY <= 67 && lowChroma;
        if (onCellEdge || alpha < 200 || saturatedRedFringe || saturatedGreenFringe || oldHeroGun) {
          pixels[index] = 0; pixels[index + 1] = 0; pixels[index + 2] = 0; pixels[index + 3] = 0;
        } else pixels[index + 3] = 255;
      }
    }

    // Generated sheets sometimes contain tiny dark scraps near a cell edge. Clean
    // connected components inside each frame so debris cannot leak into its neighbor.
    const visited = new Uint8Array(output.width * output.height);
    for (let frame = 0; frame < ANIMATION_FRAMES; frame++) {
      const frameX = (frame % SHEET_COLUMNS) * outputCell;
      const frameY = Math.floor(frame / SHEET_COLUMNS) * outputCell;
      for (let localY = edgeInset; localY < outputCell - edgeInset; localY++) {
        for (let localX = edgeInset; localX < outputCell - edgeInset; localX++) {
          const startX = frameX + localX;
          const startY = frameY + localY;
          const startPixel = startY * output.width + startX;
          if (visited[startPixel] || pixels[startPixel * 4 + 3] === 0) continue;
          const stack = [startPixel];
          const component = [];
          let touchesCutEdge = false;
          visited[startPixel] = 1;
          while (stack.length) {
            const pixel = stack.pop();
            component.push(pixel);
            const x = pixel % output.width;
            const y = Math.floor(pixel / output.width);
            const cellX = x - frameX;
            const cellY = y - frameY;
            if (cellX <= edgeInset || cellX >= outputCell - edgeInset - 1 || cellY <= edgeInset || cellY >= outputCell - edgeInset - 1) touchesCutEdge = true;
            for (let offsetY = -1; offsetY <= 1; offsetY++) {
              for (let offsetX = -1; offsetX <= 1; offsetX++) {
                if (!offsetX && !offsetY) continue;
                const nextX = x + offsetX;
                const nextY = y + offsetY;
                if (nextX < frameX + edgeInset || nextX >= frameX + outputCell - edgeInset || nextY < frameY + edgeInset || nextY >= frameY + outputCell - edgeInset) continue;
                const nextPixel = nextY * output.width + nextX;
                if (visited[nextPixel] || pixels[nextPixel * 4 + 3] === 0) continue;
                visited[nextPixel] = 1;
                stack.push(nextPixel);
              }
            }
          }
          if (component.length < 18 || (touchesCutEdge && component.length < 220)) {
            for (const pixel of component) {
              const index = pixel * 4;
              pixels[index] = 0; pixels[index + 1] = 0; pixels[index + 2] = 0; pixels[index + 3] = 0;
            }
          }
        }
      }
    }
    cleanContext.putImageData(imageData, 0, 0);
    let occupiedFrames = 0;
    for (let frame = 0; frame < ANIMATION_FRAMES; frame++) {
      const startX = (frame % SHEET_COLUMNS) * outputCell;
      const startY = Math.floor(frame / SHEET_COLUMNS) * outputCell;
      let occupied = false;
      for (let y = startY; y < startY + outputCell && !occupied; y += 3) {
        for (let x = startX; x < startX + outputCell; x += 3) {
          if (pixels[(y * output.width + x) * 4 + 3] > 0) { occupied = true; break; }
        }
      }
      if (occupied) occupiedFrames = frame + 1;
    }
    sheetFrameCounts.set(image, Math.max(1, occupiedFrames));
    return output;
  }

  function sheetFrameCount(image) { return sheetFrameCounts.get(image) || ANIMATION_FRAMES; }

  function drawSheetFrame(image, frame, x, y, width, height, flip = false) {
    if (!image || ("complete" in image && (!image.complete || !image.naturalWidth))) return;
    const source = cleanSheets.get(image) || image;
    const sourceWidth = source.width || image.naturalWidth;
    const sourceHeight = source.height || image.naturalHeight;
    const cellWidth = sourceWidth / SHEET_COLUMNS;
    const cellHeight = sourceHeight / SHEET_ROWS;
    frame = Math.max(0, Math.min(sheetFrameCount(image) - 1, frame));
    const sourceX = (frame % SHEET_COLUMNS) * cellWidth;
    const sourceY = Math.floor(frame / SHEET_COLUMNS) * cellHeight;
    const sourceInset = 1;
    ctx.save();
    if (flip) { ctx.translate(Math.round(x + width), 0); ctx.scale(-1, 1); x = 0; }
    ctx.drawImage(source, sourceX + sourceInset, sourceY + sourceInset, cellWidth - sourceInset * 2, cellHeight - sourceInset * 2, Math.round(x), Math.round(y), Math.round(width), Math.round(height));
    ctx.restore();
  }

  function bulletDimensions(bullet) {
    return Math.abs(bullet.vx) > Math.abs(bullet.vy)
      ? { width: 2 * PROJECTILE_SCALE, height: PROJECTILE_SCALE }
      : { width: PROJECTILE_SCALE, height: 2 * PROJECTILE_SCALE };
  }

  function enemyShotDimensions(shot) {
    if (shot.kind === "thrown" || shot.kind === "medicine") {
      const size = Math.round((shot.size || 1) * PROJECTILE_SCALE);
      return { width: size, height: size };
    }
    if (shot.kind === "tankShell") return { width: 3 * PROJECTILE_SCALE, height: 3 * PROJECTILE_SCALE };
    if (shot.kind === "rocket") return { width: 3 * PROJECTILE_SCALE, height: PROJECTILE_SCALE };
    return { width: PROJECTILE_SCALE, height: PROJECTILE_SCALE };
  }

  function drawBullets() {
    for (const b of state.bullets) {
      const x = Math.round(b.x), y = Math.round(b.y);
      const { width, height } = bulletDimensions(b);
      fill(x - width / 2, y - height / 2, width, height, b.color);
      fill(x - Math.sign(b.vx) * 2 * PROJECTILE_SCALE - PROJECTILE_SCALE / 2,
        y - PROJECTILE_SCALE / 2, PROJECTILE_SCALE, PROJECTILE_SCALE, "#d66e45");
    }
  }

  function drawEnemyShots() {
    for (const s of state.enemyShots) {
      const x = Math.round(s.x), y = Math.round(s.y);
      const { width, height } = enemyShotDimensions(s);
      if (["thrown", "medicine"].includes(s.kind) && art.seniorProjectiles.complete && art.seniorProjectiles.naturalWidth) {
        drawAtlasFrame(art.seniorProjectiles, s.atlasIndex, 4, 2, x, y, width, height, s.rotation);
      } else if (s.kind === "tankShell") {
        fill(x - width / 2, y - height / 2, width, height, "#36495f");
        fill(x - PROJECTILE_SCALE / 2, y - PROJECTILE_SCALE / 2, PROJECTILE_SCALE, PROJECTILE_SCALE, "#ff9b45");
      } else if (s.kind === "rocket") {
        fill(x - width / 2, y - height / 2, width, height, "#b8eaff");
        fill(x - Math.sign(s.vx) * 2 * PROJECTILE_SCALE - PROJECTILE_SCALE / 2,
          y - PROJECTILE_SCALE / 2, PROJECTILE_SCALE, PROJECTILE_SCALE, "#ff873e");
      } else {
        fill(x - width / 2, y - height / 2, width, height, "#ffd278");
        fill(x - Math.sign(s.vx) * PROJECTILE_SCALE - width / 2,
          y - height / 2, width, height, "#9b5c38");
      }
    }
  }

  function drawAtlasFrame(image, frame, columns, rows, x, y, width, height, rotation = 0) {
    const cellWidth = image.naturalWidth / columns;
    const cellHeight = image.naturalHeight / rows;
    const sourceX = (frame % columns) * cellWidth;
    const sourceY = Math.floor(frame / columns) * cellHeight;
    const inset = 7;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(rotation);
    ctx.drawImage(image, sourceX + inset, sourceY + inset, cellWidth - inset * 2, cellHeight - inset * 2, -width / 2, -height / 2, width, height);
    ctx.restore();
  }

  function drawParticles() {
    for (const p of state.particles) { ctx.globalAlpha = clamp(p.life / Math.min(.18, p.max), 0, 1); fill(Math.round(p.x), Math.round(p.y), p.size || 1, p.size || 1, p.color); }
    ctx.globalAlpha = 1;
  }

  function drawTexts() {
    ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.font = "bold 5px monospace";
    for (const text of state.texts) {
      ctx.globalAlpha = clamp(text.life * 2, 0, 1);
      ctx.fillStyle = "#090b13"; ctx.fillText(text.value, Math.round(text.x) + 1, Math.round(text.y) + 1);
      ctx.fillStyle = text.color; ctx.fillText(text.value, Math.round(text.x), Math.round(text.y));
    }
    ctx.globalAlpha = 1;
  }

  function fill(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); }

  function puff(x, y, color, count, force) {
    for (let i = 0; i < count; i++) state.particles.push({ x, y, vx: (Math.random() - .5) * force, vy: (Math.random() - .72) * force, gravity: 22, life: .3 + Math.random() * .35, max: .65, color, size: Math.random() < .18 ? 2 : 1 });
  }
  function muzzleParticles(x, y, dx, dy) { for (let i = 0; i < 4; i++) state.particles.push({ x, y, vx: dx * (15 + Math.random() * 14) + (Math.random() - .5) * 5, vy: dy * 18 + (Math.random() - .5) * 5, gravity: 0, life: .08 + Math.random() * .12, max: .2, color: i ? "#ffb648" : COLORS.flash, size: 1 }); }
  function impactParticles(x, y, color, count) { puff(x, y, color, count, 18); }
  function landParticles(x) { for (let i = 0; i < 4; i++) state.particles.push({ x, y: GROUND - 1, vx: (i - 1.5) * 4, vy: -2 - Math.random() * 3, gravity: 7, life: .3, max: .3, color: "#596071", size: 1 }); }
  function damageText(x, y, amount, critical, color = COLORS.bone) { state.texts.push({ x, y, life: .65, value: critical ? `${amount}!` : String(amount), color: critical ? "#fff06f" : color }); }

  function updateHud() {
    const p = state.player, weapon = WEAPONS[p.weapon];
    ui.level.textContent = pad(state.wave);
    ui.healthText.textContent = `${Math.ceil(p.hp)} / ${p.maxHp}${p.shield > 0 ? ` + ${Math.ceil(p.shield)} SHIELD` : ""}`;
    ui.healthFill.style.width = `${clamp(p.hp / p.maxHp * 100, 0, 100)}%`;
    ui.healthBlock.classList.toggle("low", p.hp / p.maxHp <= .3);
    const seconds = Math.max(0, Math.ceil(state.waveTime));
    ui.timer.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    ui.waveProgress.style.width = `${clamp(state.waveTime / state.waveDuration * 100, 0, 100)}%`;
    ui.waveBlock.classList.toggle("urgent", state.waveTime <= 5);
    const carriedBaby = state.babies.some(baby => baby.status === "carried");
    const tip = carriedBaby ? "BABY TAKEN! SHOOT THE THIEF BEFORE THEY ESCAPE"
      : p.hp / p.maxHp <= .3 ? "LOW HEALTH! KEEP AWAY FROM ENEMIES"
        : state.wave === 1 && state.waveTime < state.waveDuration - 2 && state.waveTime > state.waveDuration - 7
          ? controller.connected ? "SURVIVE UNTIL 0:00 · LEFT STICK MOVE · R2 SHOOT"
            : "SURVIVE UNTIL 0:00 · A/D MOVE · CLICK TO SHOOT"
          : "";
    if (ui.gameTip.textContent !== tip) ui.gameTip.textContent = tip;
    ui.gameTip.classList.toggle("hidden", !tip);
    ui.gameTip.classList.toggle("danger", carriedBaby || p.hp / p.maxHp <= .3);
    ui.weapon.textContent = p.unlocked.length > 1 ? `${WEAPONS[p.unlocked[0]].name} + ${WEAPONS[p.unlocked[1]].name}` : weapon.name;
    const secondGun = p.unlocked[1];
    ui.weaponIcons.classList.toggle("dual", Boolean(secondGun));
    ui.weaponIcon2.classList.toggle("hidden", !secondGun);
    [p.unlocked[0], secondGun].forEach((key, index) => {
      if (!key) return;
      const icon = index === 0 ? ui.weaponIcon : ui.weaponIcon2;
      const artKey = WEAPON_ART_KEY[key];
      const signature = `${key}:${Boolean(pixelAtlases[artKey])}`;
      if (icon.dataset.weapon === signature) return;
      icon.dataset.weapon = signature;
      icon.style.backgroundImage = pixelAtlases[artKey]?.dataUrl || `url("${IMAGE_PATHS[artKey]}")`;
    });
    ui.weaponIcon.classList.toggle("reloading", p.reloadTimers[p.unlocked[0]] > 0);
    ui.weaponIcon2.classList.toggle("reloading", Boolean(secondGun && p.reloadTimers[secondGun] > 0));
    ui.healthIcon.classList.toggle("shielded", p.shield > 0);
    ui.ammo.textContent = p.unlocked.slice(0, 2).map(key => `${p.ammo[key] ?? magazineSize(p, key)} / ${magazineSize(p, key)}`).join("  ·  ");
    const reloadingGuns = p.unlocked.filter(key => p.reloadTimers[key] > 0);
    ui.reload.textContent = reloadingGuns.length > 1 ? "BOTH RELOADING"
      : reloadingGuns.length === 1 ? `${WEAPONS[reloadingGuns[0]].name} RELOADING`
        : p.unlocked.length > 1 ? "BOTH GUNS FIRE" : "AUTO RELOAD";
    ui.teeth.textContent = state.teeth.toLocaleString();
    const teethArtReady = Boolean(pixelAtlases.fakeTeeth);
    if (ui.teethIcon.dataset.ready !== String(teethArtReady)) {
      ui.teethIcon.dataset.ready = String(teethArtReady);
      ui.teethIcon.style.backgroundImage = pixelAtlases.fakeTeeth?.dataUrl || `url("${IMAGE_PATHS.fakeTeeth}")`;
    }
    renderBabyHud();
  }

  function renderBabyHud() {
    const activeBabies = state.babies.filter(baby => baby.type === state.activeBabyType && baby.status !== "lost");
    const signature = `${state.activeBabyType || "none"}:` + activeBabies.map(baby => `${baby.type}:${baby.level}:${baby.status}`).join("|")
      + BABY_TYPES.map(entry => Boolean(pixelAtlases[entry.artKey])).join("");
    if (ui.babyBuffs.dataset.signature === signature) return;
    ui.babyBuffs.dataset.signature = signature;
    ui.babyBuffs.replaceChildren(...activeBabies.map(baby => {
      const babyType = BABY_TYPES.find(entry => entry.id === baby.type);
      const chip = document.createElement("span");
      chip.className = `baby-chip${baby.status === "carried" ? " carried" : ""}`;
      chip.style.setProperty("--baby-color", babyType?.color || "#8eeeff");
      chip.style.setProperty("--baby-art", babyArtUrl(babyType));
      const buffText = babyType ? babyType.describe(babyType.values[baby.level - 1]) : "BUFF";
      chip.title = `${babyType?.name || "BABY"} LV ${baby.level}: ${buffText}${baby.status === "carried" ? " — RESCUE!" : ""}`;
      chip.innerHTML = `<i aria-hidden="true"></i><b>${baby.level}</b>`;
      return chip;
    }));
  }

  function magazineSize(player, key) { return Math.max(1, Math.round(WEAPONS[key].mag * player.magMult * (1 + (babyPower("ammo") || 0)))); }
  function nearestZombie() { const p = state.player; return state.zombies.reduce((best, z) => !best || Math.abs(z.x - p.x) < Math.abs(best.x - p.x) ? z : best, null); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function pad(value) { return String(value).padStart(2, "0"); }
  function shuffle(items) { const copy = [...items]; for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }

  function segmentBoxEntry(x1, y1, x2, y2, bx, by, bw, bh) {
    let t0 = 0, t1 = 1; const dx = x2 - x1, dy = y2 - y1;
    const p = [-dx, dx, -dy, dy], q = [x1 - bx, bx + bw - x1, y1 - by, by + bh - y1];
    for (let i = 0; i < 4; i++) {
      if (p[i] === 0) { if (q[i] < 0) return null; }
      else { const r = q[i] / p[i]; if (p[i] < 0) { if (r > t1) return null; if (r > t0) t0 = r; } else { if (r < t0) return null; if (r < t1) t1 = r; } }
    }
    return t0;
  }

  function ensureAudio() {
    if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
  }
  function beep(frequency, duration, type = "square", volume = .025) {
    if (!audio) return;
    const oscillator = audio.createOscillator(), gain = audio.createGain(), now = audio.currentTime;
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, now); oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency * .72), now + duration);
    gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain).connect(audio.destination); oscillator.start(now); oscillator.stop(now + duration);
  }
  function shotSound(key) { const settings = { pistol: [145, .07, .035], smg: [125, .045, .025], shotgun: [72, .16, .06], rifle: [185, .11, .045] }[key]; beep(settings[0], settings[1], key === "rifle" ? "sawtooth" : "square", settings[2]); }
  function victorySound() { [262, 330, 392, 523].forEach((note, i) => setTimeout(() => beep(note, .13, "square", .025), i * 90)); }

  function updateController() {
    if (typeof navigator.getGamepads !== "function") return;
    const pads = Array.from(navigator.getGamepads() || []).filter(Boolean);
    let pad = pads.find(item => item.index === controller.index) || pads.find(item => /dualsense|wireless controller|playstation/i.test(item.id)) || pads[0];
    if (!pad) {
      if (controller.connected) setControllerStatus(false);
      controller.connected = false; controller.index = -1; controller.moveX = 0; controller.shooting = false; controller.aiming = false; controller.hatUp = false; controller.hatDown = false;
      return;
    }
    if (!controller.connected || controller.index !== pad.index) {
      controller.connected = true; controller.index = pad.index; controller.id = pad.id || "Gamepad";
      controller.kind = /dualsense|wireless controller|playstation/i.test(controller.id) ? "PS5" : "GAMEPAD";
      setControllerStatus(true);
    }

    const rawPlayStation = pad.mapping !== "standard" && /dualsense|playstation|wireless controller|054c/i.test(pad.id || "");
    const physicalButton = index => rawPlayStation ? ({ 0: 1, 1: 2, 2: 0 })[index] ?? index : index;
    const down = index => Boolean(pad.buttons[physicalButton(index)]?.pressed || pad.buttons[physicalButton(index)]?.value > .35);
    const edge = index => down(index) && !controller.buttons[index];
    const hat = Number(pad.axes[9]);
    const hatUp = Number.isFinite(hat) && ((hat >= -1 && hat < -.7) || hat >= .95);
    const hatDown = Number.isFinite(hat) && hat >= -.2 && hat < .45;
    const dpad = (down(15) || (Number.isFinite(hat) && hat >= -.75 && hat < -.1) ? 1 : 0)
      - (down(14) || (Number.isFinite(hat) && hat >= .4 && hat <= 1) ? 1 : 0);
    controller.moveX = deadzone(Number(pad.axes[0]) || 0);
    if (Math.abs(controller.moveX) < .08 && dpad) controller.moveX = dpad;
    const aimX = deadzone(Number(pad.axes[2]) || 0), aimY = deadzone(Number(pad.axes[3]) || 0);
    const aimLength = Math.hypot(aimX, aimY);
    controller.aiming = aimLength > .18;
    if (controller.aiming) { controller.aimX = aimX / aimLength; controller.aimY = aimY / aimLength; }
    controller.shooting = down(7) || down(5);

    if (mode === "playing") {
      if (edge(0)) jump();
      if (edge(2)) startReload();
      if (edge(3)) switchWeapon(1);
      if (edge(9)) pauseGame();
    } else if (mode === "title" || mode === "gameover") {
      if (edge(0)) startGame();
    } else if (mode === "paused") {
      if (edge(0) || edge(9)) pauseGame();
    } else if (mode === "upgrade") {
      let horizontal = 0;
      let vertical = 0;
      if (edge(14) || edge(4)) horizontal = -1;
      if (edge(15) || edge(5)) horizontal = 1;
      if (edge(12) || (hatUp && !controller.hatUp)) vertical = -1;
      if (edge(13) || (hatDown && !controller.hatDown)) vertical = 1;
      if (!horizontal && Math.abs(controller.moveX) > .62 && !controller.navLatch) horizontal = Math.sign(controller.moveX);
      if (horizontal) { focusUpgrade(horizontal); controller.navLatch = true; }
      if (vertical) { focusUpgradeRow(vertical); controller.navLatch = true; }
      if (Math.abs(controller.moveX) < .3 && !down(14) && !down(15)) controller.navLatch = false;
      if (edge(0)) {
        if (controller.menuIndex < 4) purchaseOffer(controller.menuIndex);
        else if (controller.menuIndex < 11) cycleOwnedSlot(selectedSlot);
        else if (controller.menuIndex === 11) leaveShop();
        else if (controller.menuIndex < 16) toggleOfferLock(controller.menuIndex - 12);
        else if (controller.menuIndex === 16) rerollUpgrades();
        else requestDeleteGun(equippedInSlot(SHOP_SLOT_ORDER[controller.menuIndex - 17]));
      }
      if (edge(2) && (controller.menuIndex < 4 || controller.menuIndex >= 12 && controller.menuIndex < 16)) {
        toggleOfferLock(controller.menuIndex < 4 ? controller.menuIndex : controller.menuIndex - 12);
      }
      if (edge(1) || edge(2)) {
        if (controller.menuIndex >= 4 && controller.menuIndex < 11) setUpgradeSelection(0, true);
      }
      if (edge(3) && (controller.menuIndex < 4 || controller.menuIndex >= 12 && controller.menuIndex <= 16)) rerollUpgrades();
      if (edge(3) && controller.menuIndex >= 4 && controller.menuIndex < 11 && selectedSlot.startsWith("gun") && playerCanDeleteGun()) {
        requestDeleteGun(equippedInSlot(selectedSlot));
      }
      if (edge(9)) leaveShop();
    }
    controller.buttons = Array.from(pad.buttons, (_, index) => down(index));
    controller.hatUp = hatUp;
    controller.hatDown = hatDown;
  }

  // Shop focus: 0–3 offers, 4–10 build slots, 11 next round, 12–15 locks, 16 reroll, 17–18 gun delete.
  function focusUpgrade(direction) {
    const index = controller.menuIndex;
    if (index < 4) setUpgradeSelection(index === 3 && direction > 0 ? 4 : clamp(index + direction, 0, 3));
    else if (index >= 12 && index < 16) {
      let next = index + direction;
      while (next >= 12 && next < 16 && selectedUpgrades[next - 12].purchased) next += direction;
      if (next >= 12 && next < 16) setUpgradeSelection(next);
      else if (direction > 0) setUpgradeSelection(4);
    } else if (index === 16 && direction > 0) setUpgradeSelection(4);
    else if (index === 4) setUpgradeSelection(direction < 0 ? 3 : 5);
    else if (index === 5 && direction < 0) setUpgradeSelection(4);
    else if (index >= 6 && index < 11) setUpgradeSelection(clamp(index + direction, 6, 10));
    else if (index === 17 && direction > 0 && !ui.gunDeleteButtons[1].classList.contains("hidden")) setUpgradeSelection(18);
    else if (index === 18 && direction < 0 && !ui.gunDeleteButtons[0].classList.contains("hidden")) setUpgradeSelection(17);
  }

  function focusUpgradeRow(direction) {
    const index = controller.menuIndex;
    if (index < 4 && direction > 0) {
      if (selectedUpgrades[index].purchased && ui.reroll.disabled) controller.nextReturn = index;
      setUpgradeSelection(selectedUpgrades[index].purchased ? (ui.reroll.disabled ? 11 : 16) : index + 12);
    } else if (index >= 12 && index < 16) {
      if (direction > 0 && ui.reroll.disabled) controller.nextReturn = index;
      setUpgradeSelection(direction < 0 ? index - 12 : ui.reroll.disabled ? 11 : 16);
    } else if (index === 16) {
      if (direction > 0) { controller.nextReturn = 16; setUpgradeSelection(11); }
      else setUpgradeSelection(selectedUpgrades[controller.offerColumn || 0].purchased ? controller.offerColumn || 0 : 12 + (controller.offerColumn || 0));
    } else if (index === 11 && direction < 0) {
      const returnIndex = controller.nextReturn ?? (ui.reroll.disabled ? 6 : 16);
      setUpgradeSelection(returnIndex === 16 && ui.reroll.disabled ? 6 : returnIndex);
    } else if (index === 4 || index === 5) {
      if (direction > 0) setUpgradeSelection(ui.gunDeleteButtons[index - 4].classList.contains("hidden") ? (index === 4 ? 7 : 9) : index + 13);
    } else if (index === 17 || index === 18) {
      setUpgradeSelection(direction < 0 ? index - 13 : index === 17 ? 7 : 9);
    } else if (index >= 6 && index < 11) {
      if (direction < 0) setUpgradeSelection(index <= 8 ? 4 : 5);
      else { controller.nextReturn = index; setUpgradeSelection(11); }
    }
  }

  function setUpgradeSelection(index, makeSound = true) {
    const previousIndex = controller.menuIndex;
    if (index >= 12 && index < 16 && selectedUpgrades[index - 12].purchased) index -= 12;
    if (index === 16 && ui.reroll.disabled) index = 11;
    if (index >= 17 && ui.gunDeleteButtons[index - 17].classList.contains("hidden")) index -= 13;
    controller.menuIndex = clamp(index, 0, 18);
    if (controller.menuIndex < 4) controller.offerColumn = controller.menuIndex;
    if (controller.menuIndex >= 12 && controller.menuIndex < 16) controller.offerColumn = controller.menuIndex - 12;
    if (previousIndex !== controller.menuIndex) {
      pendingGunDelete = null;
    }
    renderLoadout();
    paintShopSelection();
    const buttons = [...ui.cards.querySelectorAll(".offer-card")];
    const selected = controller.menuIndex === 11 ? ui.nextRound
      : controller.menuIndex === 16 ? ui.reroll
        : controller.menuIndex >= 17 ? ui.gunDeleteButtons[controller.menuIndex - 17]
          : controller.menuIndex >= 12 ? ui.cards.querySelectorAll(".offer-lock")[controller.menuIndex - 12]
            : controller.menuIndex >= 4 ? ui.slotButtons[controller.menuIndex - 4] : buttons[controller.menuIndex];
    selected?.focus({ preventScroll: true });
    if (makeSound) beep(310, .025, "square", .012);
  }

  function paintShopSelection() {
    const buttons = [...ui.cards.querySelectorAll(".offer-card")];
    buttons.forEach((card, cardIndex) => card.classList.toggle("gamepad-selected", cardIndex === controller.menuIndex));
    ui.cards.querySelectorAll(".offer-lock").forEach((lock, lockIndex) => lock.classList.toggle("gamepad-selected", controller.menuIndex === lockIndex + 12));
    ui.reroll.classList.toggle("gamepad-selected", controller.menuIndex === 16);
    ui.gunDeleteButtons.forEach((button, buttonIndex) => button.classList.toggle("gamepad-selected", controller.menuIndex === buttonIndex + 17));
    ui.nextRound.classList.toggle("gamepad-selected", controller.menuIndex === 11);
    ui.slotButtons.forEach((button, slotIndex) => {
      button.classList.toggle("gamepad-selected", controller.menuIndex === slotIndex + 4);
      button.classList.toggle("selected", controller.menuIndex === slotIndex + 4);
    });
    if (controller.menuIndex >= 4 && controller.menuIndex < 11) selectedSlot = SHOP_SLOT_ORDER[controller.menuIndex - 4];
  }

  function deadzone(value) {
    const magnitude = Math.abs(value);
    if (magnitude < .14) return 0;
    return Math.sign(value) * (magnitude - .14) / .86;
  }

  function setControllerStatus(connected) {
    ui.controllerCard.classList.toggle("connected", connected);
    ui.controllerStatus.textContent = connected
      ? `${controller.kind === "PS5" ? "DUALSENSE CONNECTED" : "GAMEPAD CONNECTED"} · LEFT STICK MOVE · RIGHT STICK AIM · R2 SHOOT · × JUMP`
      : "PRESS A BUTTON TO CONNECT";
  }

  function rumble(weak, strong, duration) {
    if (!controller.connected || typeof navigator.getGamepads !== "function") return;
    const pad = navigator.getGamepads()?.[controller.index];
    const actuator = pad?.vibrationActuator || pad?.hapticActuators?.[0];
    if (!actuator) return;
    try {
      if (typeof actuator.playEffect === "function") actuator.playEffect("dual-rumble", { startDelay: 0, duration, weakMagnitude: weak, strongMagnitude: strong });
      else if (typeof actuator.pulse === "function") actuator.pulse(Math.max(weak, strong), duration);
    } catch (_) { /* Some browsers expose an actuator before granting haptics. */ }
  }

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width * W;
    pointer.y = (event.clientY - rect.top) / rect.height * H;
    pointer.active = true;
  }

  window.addEventListener("keydown", event => {
    keys[event.code] = true;
    if (mode === "upgrade" && ["Enter", "Space"].includes(event.code)
      && document.activeElement?.matches(".gun-delete, .offer-lock, .reroll-button")) {
      event.preventDefault();
      if (!event.repeat) document.activeElement.click();
      return;
    }
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
    if (mode === "upgrade" && !event.repeat && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", "Space", "Escape", "Delete", "Backspace", "KeyL", "KeyR"].includes(event.code)) {
      if (event.code === "ArrowLeft") focusUpgrade(-1);
      else if (event.code === "ArrowRight") focusUpgrade(1);
      else if (event.code === "ArrowUp" || event.code === "ArrowDown") focusUpgradeRow(event.code === "ArrowUp" ? -1 : 1);
      else if (event.code === "Escape") {
        if (controller.menuIndex >= 4 && controller.menuIndex < 11) setUpgradeSelection(0, true);
      }
      else if (event.code === "Delete" || event.code === "Backspace") {
        if (controller.menuIndex >= 4 && controller.menuIndex < 11 && selectedSlot.startsWith("gun") && playerCanDeleteGun()) {
          requestDeleteGun(equippedInSlot(selectedSlot));
        }
      }
      else if (event.code === "KeyL" && (controller.menuIndex < 4 || controller.menuIndex >= 12 && controller.menuIndex < 16)) {
        toggleOfferLock(controller.menuIndex < 4 ? controller.menuIndex : controller.menuIndex - 12);
      }
      else if (event.code === "KeyR") rerollUpgrades();
      else if (event.code === "Enter" || event.code === "Space") {
        if (controller.menuIndex < 4) purchaseOffer(controller.menuIndex);
        else if (controller.menuIndex < 11) cycleOwnedSlot(selectedSlot);
        else if (controller.menuIndex === 11) leaveShop();
        else if (controller.menuIndex >= 17) requestDeleteGun(equippedInSlot(SHOP_SLOT_ORDER[controller.menuIndex - 17]));
      }
      event.preventDefault();
      return;
    }
    if ((event.code === "Enter" || event.code === "Space") && (mode === "title" || mode === "gameover")) startGame();
    else if ((event.code === "Space" || event.code === "KeyW" || event.code === "ArrowUp") && !event.repeat) jump();
    else if (event.code === "KeyR") startReload();
    else if (event.code === "KeyQ" && !event.repeat) switchWeapon(1);
    else if (/^Digit[1-9]$/.test(event.code)) {
      const index = Number(event.code.slice(-1)) - 1;
      if (mode === "upgrade") {
        if (index < 4) purchaseOffer(index);
      } else if (index < 4) switchWeapon(0, index);
    } else if (event.code === "Escape") pauseGame();
  });
  window.addEventListener("keyup", event => { keys[event.code] = false; });
  canvas.addEventListener("pointermove", pointerPosition);
  canvas.addEventListener("pointerdown", event => { ensureAudio(); pointerPosition(event); pointer.down = true; canvas.setPointerCapture?.(event.pointerId); });
  canvas.addEventListener("pointerup", event => { pointer.down = false; canvas.releasePointerCapture?.(event.pointerId); });
  canvas.addEventListener("contextmenu", event => event.preventDefault());
  window.addEventListener("blur", () => { pointer.down = false; Object.keys(keys).forEach(key => { keys[key] = false; }); if (mode === "playing") pauseGame(); });
  window.addEventListener("gamepadconnected", event => {
    controller.index = event.gamepad.index;
    controller.connected = true;
    controller.id = event.gamepad.id;
    controller.kind = /dualsense|wireless controller|playstation/i.test(controller.id) ? "PS5" : "GAMEPAD";
    setControllerStatus(true);
  });
  window.addEventListener("gamepaddisconnected", event => {
    if (event.gamepad.index !== controller.index) return;
    controller.connected = false; controller.index = -1; controller.buttons = [];
    setControllerStatus(false);
  });

  document.querySelectorAll("[data-control]").forEach(button => {
    const control = button.dataset.control;
    const down = event => { event.preventDefault(); ensureAudio(); if (control === "jump") jump(); else touch[control] = true; };
    const up = event => { event.preventDefault(); if (control !== "jump") touch[control] = false; };
    button.addEventListener("pointerdown", down); button.addEventListener("pointerup", up); button.addEventListener("pointercancel", up); button.addEventListener("pointerleave", up);
  });

  $("#startButton").addEventListener("click", startGame);
  $("#restartButton").addEventListener("click", startGame);
  $("#pauseRestartButton").addEventListener("click", startGame);
  $("#pauseButton").addEventListener("click", pauseGame);
  $("#resumeButton").addEventListener("click", pauseGame);
  ui.nextRound.addEventListener("click", leaveShop);
  ui.nextRound.addEventListener("focus", () => { if (mode === "upgrade") setUpgradeSelection(11, false); });
  ui.reroll.addEventListener("click", () => rerollUpgrades());
  ui.reroll.addEventListener("focus", () => { if (mode === "upgrade") setUpgradeSelection(16, false); });
  ui.slotButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      setUpgradeSelection(index + 4, false);
      cycleOwnedSlot(SHOP_SLOT_ORDER[index]);
    });
    button.addEventListener("focus", () => {
      if (mode !== "upgrade" || controller.menuIndex === index + 4) return;
      controller.menuIndex = index + 4;
      paintShopSelection();
    });
  });
  ui.gunDeleteButtons.forEach((button, index) => {
    button.addEventListener("click", () => requestDeleteGun(button.dataset.gunId));
    button.addEventListener("focus", () => { if (mode === "upgrade") setUpgradeSelection(index + 17, false); });
  });

  function frame(now) {
    const elapsed = Math.max(0, (now - last) / 1000 || 0);
    last = now;
    update(Math.min(.033, elapsed), elapsed);
    draw();
    requestAnimationFrame(frame);
  }

  ui.best.textContent = pad(Number(localStorage.getItem("deadCenterBestWave") || 0));
  draw(); requestAnimationFrame(frame);
  window.__deadCenter = {
    get state() { return state; },
    get mode() { return mode; },
    get playerAnimation() { return selectPlayerAnimation(state.player); },
    dualAnimationSheet(key) {
      const base = { idle: art.heroIdle, walk: art.heroWalk, jump: art.heroJump, shoot: art.heroShoot, reload: art.heroReload }[key];
      return base ? getEquippedHeroSheet(key, base, state.player) : null;
    },
    get cleanedSheetCount() { return cleanedSheetCount; },
    controller, art, pixelAtlases, heldWeaponArt: HELD_WEAPON_ART,
    renderScale: RENDER_SCALE, animationFrames: ANIMATION_FRAMES, projectileScale: PROJECTILE_SCALE,
    spriteSizes: { player: PLAYER_SPRITE_SIZE, enemy: ENEMY_SPRITE_SIZE },
    get shopOffers() { return selectedUpgrades; },
    startGame, takeUpgrade, purchaseOffer, leaveShop, buyBaby, buyShopItem, equipGun, equipBodyArmor, equipGear,
    spawnZombie, pickEnemyType, upgradePool, bodyArmors: BODY_ARMORS, gearShop: GEAR_SHOP,
    babyTypes: BABY_TYPES, shopItems: SHOP_ITEMS, babyPower, ownedBabyLevel, WEAPONS,
    hasBaby, killZombie, dropCarriedBaby, loseCarriedBaby
  };
})();
