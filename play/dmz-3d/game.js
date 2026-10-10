import * as THREE from "./vendor/three.module.js";
import { GLTFLoader } from "./vendor/GLTFLoader.js";
import { applyVoxelOperatorPixelSkin, createVoxelOperator, setVoxelOperatorTeam } from "./voxel-operator.js";
import {
  createFirstPersonWeapon, createVoxelEnemy, createVoxelThrowable,
  disposeVoxelObject, poseVoxelEnemy, setVoxelEnemyHighDetail, setVoxelEnemyHit, setVoxelOpacity
} from "./voxel-gameplay.js?v=20260920.26";

const canvas = document.getElementById("game");

const W = 480;
const H = 270;
const BASE_FOV = 65;
const ADS_FOV = 42;
const BASE_DAMAGE = 38;
const TARGET_FPS = 120;
const ENEMY_HIGH_DETAIL_NEAR = 12.5;
const ENEMY_HIGH_DETAIL_FAR = 15;
const THROW_GROUND_DRAG = .12;
const SMOKE_THROW_PHYSICS = Object.freeze({
  speed: 9.5,
  lift: 2.8,
  fuse: 1.28,
  groundDrag: .86
});
const SMOKE_LOBE_LAYOUT = Object.freeze([
  { x: 0, z: 0, width: 3.5, height: 2.3, rotation: 0, opacity: 1, density: 1, radius: 1.18 },
  { x: -.95, z: .35, width: 2.45, height: 1.9, rotation: -.08, opacity: .54, density: .38, radius: .78 },
  { x: .95, z: -.25, width: 2.65, height: 2, rotation: .07, opacity: .92, density: .9, radius: .9 },
  { x: -.4, z: -.7, width: 2.6, height: 1.8, rotation: .04, opacity: .36, density: .24, radius: .7 },
  { x: .45, z: .68, width: 2.75, height: 1.9, rotation: -.05, opacity: .7, density: .58, radius: .82 }
]);
const ENEMY_DAMAGE_RANGE = 5;
const WEAPON_ACTION_DURATIONS = { reload: 2.4, smoke: .9, frag: 1, medkit: 2.15 };
const WEAPON_ACTION_MOTION_FRAMES = { reload: 56, smoke: 28, frag: 32, medkit: 48 };
const WEAPON_ACTION_ART_FRAMES = 8;
const ACTION_SCREEN_ANCHORS = {
  reload: { x: .05, y: -.11, z: -.54, roll: .03 },
  reloadGun: { x: .14, y: -.23, z: -.82, roll: 0 },
  smoke: { x: .28, y: -.18, z: -.68, roll: 0 },
  frag: { x: .28, y: -.15, z: -.68, roll: 0 },
  medkit: { x: .2, y: -.17, z: -.72, roll: 0 }
};
const FIRING_RANGE_BOUNDS = { minX: 19.8, maxX: 27.2, minZ: 2, maxZ: 11 };
const FIRING_RANGE_TARGET_HP = 100;
const FIRING_RANGE_RESPAWN_SECONDS = 3.2;
const FIRING_RANGE_HITBOX_WIDTH = 1.46;
const FIRING_RANGE_HITBOX_HEIGHT = 2.02;
const FIRING_RANGE_HIT_COLOR = new THREE.Color(0xffb447);
const FIRING_RANGE_HIT_EMISSIVE = new THREE.Color(0xff7a1a);
const $ = (id) => document.getElementById(id);
const ui = {
  loading: $("loading"), menu: $("menu"), hud: $("hud"), pause: $("pause"), result: $("result"),
  deploy: $("deploy"), range: $("range"), hostCoop: $("hostCoop"), hostDuel: $("hostDuel"), joinCoop: $("joinCoop"), roomCode: $("roomCode"), roomStatus: $("roomStatus"),
  resume: $("resume"), abort: $("abort"), redeploy: $("redeploy"), backMenu: $("backMenu"),
  objective: $("objective"), clock: $("clock"), clockLabel: document.querySelector("#clock small"), timer: $("timer"), coopStatus: $("coopStatus"), operatorName: $("operatorName"), threatText: $("threatText"), threatBars: [...document.querySelectorAll("#threatBars i")],
  fps: $("fps"), fpsValue: $("fpsValue"), gpuStats: $("gpuStats"),
  stageName: $("stageName"),
  stance: $("stance"), stanceIcon: $("stanceIcon"), stanceText: $("stanceText"),
  prompt: $("prompt"), toasts: $("toasts"), hitmark: $("hitmark"), hitZone: $("hitZone"), damage: $("damage"),
  hpBar: $("hpBar"), armorBar: $("armorBar"), hpText: $("hpText"), armorText: $("armorText"),
  cash: $("cash"), meds: $("meds"), intel: $("intel"), mag: $("mag"), reserve: $("reserve"), smokes: $("smokes"), grenades: $("grenades"), reloadText: $("reloadText"),
  controller: $("controller"), sound: $("sound"), resultBox: $("resultBox"), resultKicker: $("resultKicker"),
  resultTitle: $("resultTitle"), resultCopy: $("resultCopy"), resultCash: $("resultCash"), resultKills: $("resultKills"), resultTime: $("resultTime")
};

const MAP_W = 72;
const MAP_H = 72;
const CEILING_HEIGHT = 5.35;
const scatteredPlatforms = [
  [5.2, 11.4, 1.8, 1.2, .64], [10.8, 22.2, 1.7, 1.15, .7], [22.1, 13.1, 1.9, 1.2, .66], [34.5, 8.1, 1.75, 1.2, .74], [48.3, 10.4, 1.9, 1.2, .68], [62.1, 21.4, 1.8, 1.2, .72],
  [7.2, 35.1, 1.9, 1.2, .66], [21.2, 35.4, 1.8, 1.15, .74], [49.2, 36.2, 1.75, 1.2, .68], [63.1, 36.5, 1.9, 1.2, .72],
  [7.1, 49.2, 1.8, 1.15, .7], [21.4, 49.6, 1.9, 1.2, .66], [35.1, 49.1, 1.8, 1.2, .74], [49.2, 49.7, 1.75, 1.15, .68], [63.1, 49.4, 1.9, 1.2, .72],
  [7.1, 63.1, 1.9, 1.2, .72], [21.5, 63.2, 1.8, 1.15, .66], [35.4, 63.1, 1.85, 1.2, .74], [49.3, 63.2, 1.8, 1.2, .7], [63.1, 63.2, 1.9, 1.15, .68]
].map(([x, z, w, d, height]) => ({ x, z, w, d, height, climbGroup: "cover" }));
function staircasePlatforms(centerX, centerZ, axis, direction, group) {
  const along = 1.42;
  const across = 2.35;
  return Array.from({ length: 5 }, (_, index) => {
    const x = centerX + (axis === "x" ? direction * index * along : 0);
    const z = centerZ + (axis === "z" ? direction * index * along : 0);
    return {
      x: x - (axis === "x" ? along : across) / 2,
      z: z - (axis === "z" ? along : across) / 2,
      w: axis === "x" ? along : across,
      d: axis === "z" ? along : across,
      height: .46 * (index + 1), climbGroup: group, climbStep: index + 1
    };
  });
}
const climbStructures = [
  [8, 9, "x", 1, "northwest"], [64, 9, "x", -1, "northeast"],
  [8, 35, "z", 1, "west"], [64, 37, "z", -1, "east"],
  [8, 63, "x", 1, "southwest"], [64, 63, "x", -1, "southeast"],
  [35, 9, "z", 1, "north-center"], [37, 64, "z", -1, "south-center"]
];
const platformData = [
  ...scatteredPlatforms,
  ...climbStructures.flatMap(([x, z, axis, direction, group]) => staircasePlatforms(x, z, axis, direction, group))
];
const spawnPoints = [
  [3, 9], [3, 36], [3, 63], [9, 3], [36, 3], [63, 3],
  [69, 9], [69, 36], [69, 63], [9, 69], [36, 69], [63, 69],
  [18, 18], [36, 18], [54, 18], [18, 36], [54, 36], [18, 54], [36, 54], [54, 54]
];

const input = {
  keys: new Set(), mouseDown: false, mouseAim: false, padMoveX: 0, padMoveY: 0,
  padLookX: 0, padLookY: 0, padShoot: false, padAim: false, padSprint: false,
  padSmoke: false, padFrag: false
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const snapStep = (value, step) => Math.round(value / step) * step;
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

let state = "loading";
let playMode = "solo";
let lastTime = performance.now();
let activeGamepad = -1;
let previousPadButtons = [];
let currentPadButtons = [];
let soundOn = true;
let audio = null;
let ambience = 0;
let hitmarkTimer = 0;
let hitmarkKill = false;
let hitZoneTimer = 0;
let damageFlash = 0;
let muzzleTime = 0;
let hudTimer = 0;
let networkHudTimer = 0;
let weaponRecoil = 0;
let cameraKick = 0;
let weaponBob = 0;
let weaponHoldTime = 0;
let weaponLookSwayX = 0;
let weaponLookSwayY = 0;
let sprintAmount = 0;
let lastWeaponYaw = 0;
let lastWeaponPitch = 0;
let weaponSwayReady = false;
let adsAmount = 0;
let wave = 0;
let waveDelay = -1;
let score = 0;
let streakTimer = 0;
let lastHit = null;
let lastSfx = "";
let lastR3Press = -Infinity;
let webEnemyAsset = null;
let webEnemyAssets = [];
let firingRangeShellVisible = true;
const frameMeter = { frames: 0, sampledAt: performance.now(), fps: 0, frameMs: 0, peakFps: 0, displayHz: 0, targetFps: TARGET_FPS };
let player;
let nextEnemyId = 1;
let enemies = [];
let projectiles = [];
let smokeClouds = [];
let blastEffects = [];
const network = {
  active: false, role: "solo", code: "", token: "", slot: 0,
  peerConnected: false, remote: null, outgoing: [], syncing: false, syncInFlight: 0,
  syncTimer: 0, syncSeq: 0, worldWave: 0, worldSeq: 0, status: "offline", mode: "coop",
  duelScores: [0, 0], duelFinished: false, eventSeq: 0, lastRevision: 0, lastPeerSeq: 0,
  stream: null, streamConnected: false, sentSample: null, rtt: 0, session: 0
};

// Smooth only true 3D silhouettes at the framebuffer. Pixel textures remain
// nearest-filtered and screen sprites still snap to the 480x270 pixel grid.
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x314858);
scene.fog = new THREE.FogExp2(0x314858, .009);
const camera = new THREE.PerspectiveCamera(BASE_FOV, W / H, .04, 140);
camera.rotation.order = "YXZ";
scene.add(camera);
const raycaster = new THREE.Raycaster();
const shotPoint = new THREE.Vector2();
const hitmarkPoint = new THREE.Vector2();
const solidMeshes = [];
const colliders = [];
const colliderGrid = new Map();
const boxGeometryCache = new Map();
const planeGeometryCache = new Map();
const textures = {};
const platforms = [];
const firingRangeTargets = [];
const firingRangeShellObjects = [];
const firingRangeStats = { hits: 0, kills: 0, bullseyes: 0, score: 0, inside: false, lastPoints: 0 };
const staticBatchStats = { batches: 0, instances: 0, drawCallsSaved: 0 };
const indoorMapStats = { wallSections: 0, ceilingPanels: 0, doorways: 0, doorHeaders: 0, lightFixtures: 0, activeLights: 0, zoneMarkers: 0, rooms: 25 };
const NAV_DIRECTIONS = [
  [1, 0], [0, 1], [-1, 0], [0, -1],
  [1, 1], [-1, 1], [-1, -1], [1, -1]
];
const navigationWalkable = new Uint8Array(MAP_W * MAP_H);
const navigationFields = { local: null, remote: null };
let navigationWalkableCount = 0;
let weaponHip;
let weaponAds;
let weaponSprintCover;
let muzzleLight;
let reloadMagazine;
let reloadGun;
let throwHand;
const heldThrowables = { smoke: null, frag: null, medkit: null };
const weaponAction = { kind: "idle", elapsed: 0, duration: 0, frame: 0, totalFrames: 0, artFrame: 0, released: false, phase: "idle" };
let remoteOperator;
let remoteShadow;
let throwPreview;

function loadTexture(url, stableDistance = false) {
  return new Promise((resolve) => {
    let complete = false;
    const finish = (texture) => {
      if (complete) return;
      complete = true;
      clearTimeout(timeout);
      resolve(texture);
    };
    const timeout = setTimeout(() => finish(null), 6000);
    new THREE.TextureLoader().load(url, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = stableDistance ? THREE.LinearMipmapLinearFilter : THREE.NearestFilter;
      texture.generateMipmaps = stableDistance;
      texture.anisotropy = stableDistance ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 1;
      finish(texture);
    }, undefined, () => finish(null));
  });
}

function lockSpriteToPixelGrid(material) {
  material.onBeforeCompile = (shader) => {
    const spriteProjection = "mvPosition.xy += rotatedPosition;\n\tgl_Position = projectionMatrix * mvPosition;";
    const lockedProjection = `vec4 pixelCenterClip = projectionMatrix * mvPosition;
      vec2 pixelCenterNdc = pixelCenterClip.xy / pixelCenterClip.w;
      vec2 lockedPixel = floor((pixelCenterNdc * 0.5 + 0.5) * vec2(${W.toFixed(1)}, ${H.toFixed(1)})) + 0.5;
      vec2 lockedCenterNdc = lockedPixel / vec2(${W.toFixed(1)}, ${H.toFixed(1)}) * 2.0 - 1.0;
      vec2 pixelOffsetNdc = lockedCenterNdc - pixelCenterNdc;
      mvPosition.xy += rotatedPosition;
      gl_Position = projectionMatrix * mvPosition;
      gl_Position.xy += pixelOffsetNdc * gl_Position.w;`;
    shader.vertexShader = shader.vertexShader.replace(spriteProjection, lockedProjection);
  };
  material.customProgramCacheKey = () => "dmz-smoke-pixel-lock-v1";
  return material;
}

function transparentFallbackTexture() {
  const texture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}

async function loadAssets() {
  const entries = {
    operatorSkin: "assets/operator-3d-pixel-skin.webp",
    wallPanel: "assets/wall-panel-full.webp",
    floorTile: "assets/floor-tile-decal.webp",
    cargoSide: "assets/cargo-side-decal.png",
    rangeHitPlate: "assets/chatgpt-range-hit-plate-v1.webp",
    terminal: "assets/intel-terminal.png",
    weapon: "assets/carbine-hud.png",
    weaponSprint: "assets/carbine-sprint.webp",
    weaponAds: "assets/carbine-ads-eotech.webp",
    smokeGrenade: "assets/smoke-canister.png",
    fragGrenade: "assets/frag-grenade.png",
    actionReload: "assets/action-reload-sheet-v2.webp",
    actionReloadGun: "assets/action-reload-gun-layer-v3.webp",
    actionSmoke: "assets/action-smoke-sheet-v2.webp",
    actionFrag: "assets/action-frag-sheet-v2.webp",
    actionMedkit: "assets/action-medkit-sheet-v2.webp",
    firingRangeTarget: "assets/firing-range-target-v1.webp",
    fragExplosion: "assets/frag-explosion-sheet.png",
    smokeCloud: "assets/smoke-cloud.png"
  };
  const stableEnvironmentTextures = new Set(["wallPanel", "floorTile", "cargoSide"]);
  const rangeCharacterUrls = ["a", "j", "m", "p", "q", "r"].map((variant) => `assets/kenney-character-${variant}.glb`);
  const webEnemyPromise = Promise.all(rangeCharacterUrls.map((url) => new GLTFLoader().loadAsync(url)))
    .then((characters) => {
      webEnemyAssets = characters;
      webEnemyAsset = characters[0] || null;
    })
    .catch((error) => { console.warn("Kenney CC0 firing-range characters failed to load; using the built-in 3D fallback", error); });
  await Promise.all([
    webEnemyPromise,
    ...Object.entries(entries).map(async ([key, url]) => {
      textures[key] = await loadTexture(url, stableEnvironmentTextures.has(key));
    })
  ]);
  const fallback = transparentFallbackTexture();
  for (const key of Object.keys(entries)) if (!textures[key]) textures[key] = fallback;
  createWorld();
  createWeapon();
  createRemoteOperator();
  createThrowPreview();
  resetRun();
  state = "menu";
  checkRoomServer();
  setTimeout(() => ui.loading.classList.add("done"), 180);
  setTimeout(() => ui.loading.classList.add("hidden"), 600);
}

function cachedBoxGeometry(width, height, depth) {
  const key = `${width},${height},${depth}`;
  if (!boxGeometryCache.has(key)) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    geometry.userData.shared = true;
    boxGeometryCache.set(key, geometry);
  }
  return boxGeometryCache.get(key);
}

function cachedPlaneGeometry(width, height) {
  const key = `${width},${height}`;
  if (!planeGeometryCache.has(key)) {
    const geometry = new THREE.PlaneGeometry(width, height);
    geometry.userData.shared = true;
    planeGeometryCache.set(key, geometry);
  }
  return planeGeometryCache.get(key);
}

function registerCollider(collider) {
  const minCellX = Math.floor(collider.minX);
  const maxCellX = Math.ceil(collider.maxX) - 1;
  const minCellZ = Math.floor(collider.minZ);
  const maxCellZ = Math.ceil(collider.maxZ) - 1;
  for (let z = minCellZ; z <= maxCellZ; z++) {
    for (let x = minCellX; x <= maxCellX; x++) {
      const key = `${x},${z}`;
      const bucket = colliderGrid.get(key);
      if (bucket) bucket.push(collider);
      else colliderGrid.set(key, [collider]);
    }
  }
}

function nearbyColliders(x, z, radius = 0) {
  const result = [];
  const seen = new Set();
  const minCellX = Math.floor(x - radius);
  const maxCellX = Math.floor(x + radius);
  const minCellZ = Math.floor(z - radius);
  const maxCellZ = Math.floor(z + radius);
  for (let cellZ = minCellZ; cellZ <= maxCellZ; cellZ++) {
    for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
      for (const collider of colliderGrid.get(`${cellX},${cellZ}`) || []) {
        if (seen.has(collider)) continue;
        seen.add(collider);
        result.push(collider);
      }
    }
  }
  return result;
}

function someNearbyCollider(x, z, radius, predicate) {
  const minCellX = Math.floor(x - radius);
  const maxCellX = Math.floor(x + radius);
  const minCellZ = Math.floor(z - radius);
  const maxCellZ = Math.floor(z + radius);
  for (let cellZ = minCellZ; cellZ <= maxCellZ; cellZ++) {
    for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
      for (const collider of colliderGrid.get(`${cellX},${cellZ}`) || []) {
        if (predicate(collider)) return true;
      }
    }
  }
  return false;
}

function addBox(x, y, z, width, height, depth, material, colliderKind = null) {
  const mesh = new THREE.Mesh(cachedBoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.updateMatrix();
  mesh.matrixAutoUpdate = false;
  scene.add(mesh);
  if (colliderKind) {
    solidMeshes.push(mesh);
    const collider = {
      minX: x - width / 2, maxX: x + width / 2, minZ: z - depth / 2, maxZ: z + depth / 2,
      top: y + height / 2, kind: colliderKind, mesh
    };
    colliders.push(collider);
    registerCollider(collider);
  }
  return mesh;
}

function decalMaterial(texture, options = {}) {
  return new THREE.MeshStandardMaterial({
    map: texture,
    transparent: options.transparent ?? false,
    alphaTest: options.alphaTest ?? .1,
    depthTest: true,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    side: THREE.DoubleSide,
    roughness: options.roughness ?? .7,
    metalness: options.metalness ?? .22
  });
}

function pixelCoverMaterial(texture, options = {}) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: options.alphaTest ?? .08,
    depthTest: options.depthTest ?? true,
    depthWrite: options.depthWrite ?? true,
    side: THREE.DoubleSide,
    toneMapped: false
  });
  material.color.setHex(0xffffff);
  material.userData.pixelCover = true;
  return material;
}

function hideVoxelSurface(root) {
  const hitMeshes = new Set(root.userData.hitMeshes || []);
  root.traverse(object => {
    if ((object.isMesh || object.isLineSegments) && !hitMeshes.has(object)) object.visible = false;
  });
}

function addPixelCover(root, texture, width, height, position = [0, 0, 0], options = {}) {
  const material = pixelCoverMaterial(texture, options);
  const geometry = cachedPlaneGeometry(width, height);
  const cover = new THREE.Mesh(geometry, material);
  cover.name = options.name || "PixelArtCover";
  cover.position.set(...position);
  cover.renderOrder = options.renderOrder ?? 20;
  cover.frustumCulled = false;
  cover.userData.pixelArtCover = true;
  cover.userData.baseOpacity = 1;
  root.add(cover);
  root.userData.pixelCover = cover;
  return cover;
}

const coverWorldPosition = new THREE.Vector3();
const coverParentQuaternion = new THREE.Quaternion();
const coverWorldQuaternion = new THREE.Quaternion();
const coverEuler = new THREE.Euler();
const adsAimWorldPosition = new THREE.Vector3();

function facePixelCover(root, cover = root?.userData?.pixelCover) {
  if (!root || !cover || !root.visible) return;
  cover.getWorldPosition(coverWorldPosition);
  const yaw = Math.atan2(camera.position.x - coverWorldPosition.x, camera.position.z - coverWorldPosition.z);
  coverEuler.set(0, yaw, 0);
  coverWorldQuaternion.setFromEuler(coverEuler);
  root.getWorldQuaternion(coverParentQuaternion).invert();
  cover.quaternion.copy(coverParentQuaternion.multiply(coverWorldQuaternion));
  if (cover.userData.pixelRoll) cover.rotateZ(cover.userData.pixelRoll);
}

function addCrossedPixelArt(texture, x, y, z, width, height) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  for (const [offsetX, offsetZ, rotationY] of [
    [0, .385, 0], [0, -.385, Math.PI], [.385, 0, Math.PI / 2], [-.385, 0, -Math.PI / 2]
  ]) {
    const cover = new THREE.Mesh(cachedPlaneGeometry(width, height), pixelCoverMaterial(texture, { depthWrite: true }));
    cover.position.set(offsetX, 0, offsetZ);
    cover.rotation.y = rotationY;
    cover.renderOrder = 4;
    cover.userData.pixelArtCover = true;
    group.add(cover);
  }
  scene.add(group);
  return group;
}

function addDecal(width, height, material, x, y, z, rotationX = 0, rotationY = 0) {
  const mesh = new THREE.Mesh(cachedPlaneGeometry(width, height), material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rotationX, rotationY, 0);
  // Environment art renders before characters; the solid mesh depth still
  // hides characters that are physically behind a wall or platform.
  mesh.renderOrder = 1;
  mesh.updateMatrix();
  mesh.matrixAutoUpdate = false;
  scene.add(mesh);
  return mesh;
}

function batchStaticWorldMeshes() {
  const solidSet = new Set(solidMeshes);
  const groups = new Map();
  for (const mesh of scene.children) {
    if (!mesh.isMesh || mesh.matrixAutoUpdate || Array.isArray(mesh.material) || mesh.material.transparent || mesh.userData.noStaticBatch) continue;
    const solid = solidSet.has(mesh);
    const key = [mesh.geometry.uuid, mesh.material.uuid, mesh.castShadow ? 1 : 0, mesh.receiveShadow ? 1 : 0, mesh.renderOrder, mesh.layers.mask, solid ? 1 : 0].join("|");
    if (!groups.has(key)) groups.set(key, { meshes: [], solid });
    groups.get(key).meshes.push(mesh);
  }

  const removedSolids = new Set();
  for (const { meshes, solid } of groups.values()) {
    if (meshes.length < 2) continue;
    const source = meshes[0];
    const batch = new THREE.InstancedMesh(source.geometry, source.material, meshes.length);
    batch.name = `WebGLStaticBatch${staticBatchStats.batches + 1}`;
    batch.castShadow = source.castShadow;
    batch.receiveShadow = source.receiveShadow;
    batch.renderOrder = source.renderOrder;
    batch.layers.mask = source.layers.mask;
    batch.matrixAutoUpdate = false;
    batch.updateMatrix();
    batch.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    batch.userData.staticWorldBatch = true;
    batch.userData.instanceCount = meshes.length;
    meshes.forEach((mesh, index) => {
      batch.setMatrixAt(index, mesh.matrix);
      scene.remove(mesh);
      if (solid) removedSolids.add(mesh);
    });
    batch.instanceMatrix.needsUpdate = true;
    batch.computeBoundingBox();
    batch.computeBoundingSphere();
    scene.add(batch);
    if (solid) solidMeshes.push(batch);
    staticBatchStats.batches++;
    staticBatchStats.instances += meshes.length;
    staticBatchStats.drawCallsSaved += meshes.length - 1;
  }
  for (let index = solidMeshes.length - 1; index >= 0; index--) {
    if (removedSolids.has(solidMeshes[index])) solidMeshes.splice(index, 1);
  }
}

function addCargoArt(data, material) {
  const centerX = data.x + data.w / 2;
  const centerZ = data.z + data.d / 2;
  const centerY = data.height / 2;
  const decalHeight = data.height + .004;
  addDecal(data.w + .004, decalHeight, material, centerX, centerY, data.z - .018, 0, Math.PI);
  addDecal(data.w + .004, decalHeight, material, centerX, centerY, data.z + data.d + .018, 0, 0);
  addDecal(data.d + .004, decalHeight, material, data.x - .018, centerY, centerZ, 0, -Math.PI / 2);
  addDecal(data.d + .004, decalHeight, material, data.x + data.w + .018, centerY, centerZ, 0, Math.PI / 2);
}

function createIndoorComplex() {
  scene.background.setHex(0x101819);
  scene.fog = new THREE.FogExp2(0x172223, .01);

  const wallTexture = textures.wallPanel.clone();
  wallTexture.wrapS = THREE.RepeatWrapping;
  wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(2, 2);
  wallTexture.needsUpdate = true;
  const ceilingTexture = textures.floorTile.clone();
  ceilingTexture.wrapS = THREE.RepeatWrapping;
  ceilingTexture.wrapT = THREE.RepeatWrapping;
  ceilingTexture.repeat.set(2, 2);
  ceilingTexture.needsUpdate = true;
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b9992, map: wallTexture, emissive: 0x111a18, emissiveIntensity: .58, roughness: .78, metalness: .18
  });
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0x66736d, map: ceilingTexture, emissive: 0x15201d, emissiveIntensity: .68, roughness: .78, metalness: .26
  });
  const beamMaterial = new THREE.MeshStandardMaterial({ color: 0x0d1314, roughness: .58, metalness: .62 });
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x1b2424, roughness: .72, metalness: .34 });
  const cyan = new THREE.MeshBasicMaterial({ color: 0x55d9d1, toneMapped: false });
  const amber = new THREE.MeshBasicMaterial({ color: 0xe7a94d, toneMapped: false });
  const red = new THREE.MeshBasicMaterial({ color: 0xd9473f, toneMapped: false });
  const coldWhite = new THREE.MeshBasicMaterial({ color: 0xd8eee9, toneMapped: false });
  const wallHeight = CEILING_HEIGHT - .16;
  const wallThickness = .46;
  const lineAccents = [cyan, amber, red, cyan];

  const addInteriorWall = (x, z, width, depth, accent = cyan, boundary = false) => {
    const wall = addBox(x, wallHeight / 2, z, width, wallHeight, depth, wallMaterial, "wall");
    wall.userData.indoorWall = true;
    wall.userData.boundaryWall = boundary;
    addBox(x, .18, z, width + .025, .32, depth + .025, baseMaterial).userData.wallSkirting = true;
    addBox(x, 3.72, z, width + .028, .105, depth + .028, accent).userData.zoneStripe = true;
    indoorMapStats.wallSections++;
    return wall;
  };

  // A fully enclosed shell makes every sightline terminate in real geometry.
  addInteriorWall(.5, MAP_H / 2, .62, MAP_H - .35, cyan, true);
  addInteriorWall(MAP_W - .5, MAP_H / 2, .62, MAP_H - .35, amber, true);
  addInteriorWall(MAP_W / 2, .5, MAP_W - .35, .62, red, true);
  addInteriorWall(MAP_W / 2, MAP_H - .5, MAP_W - .35, .62, cyan, true);

  const doorwayCenters = [8, 22, 36, 50, 64];
  const doorwayWidth = 3.8;
  const addHorizontalRoomWall = (z, accent) => {
    let cursor = 1;
    for (const center of doorwayCenters) {
      const start = center - doorwayWidth / 2;
      if (start > cursor) addInteriorWall((cursor + start) / 2, z, start - cursor, wallThickness, accent);
      addBox(center, .034, z, doorwayWidth - .45, .018, .2, accent).userData.doorwayMarker = true;
      const header = addBox(center, 4.68, z, doorwayWidth, 1.02, wallThickness + .06, beamMaterial);
      header.userData.doorHeader = true;
      solidMeshes.push(header);
      addBox(center, 4.145, z, doorwayWidth - .2, .075, wallThickness + .075, accent).userData.doorLight = true;
      indoorMapStats.doorways++;
      indoorMapStats.doorHeaders++;
      indoorMapStats.zoneMarkers++;
      cursor = center + doorwayWidth / 2;
    }
    if (cursor < MAP_W - 1) addInteriorWall((cursor + MAP_W - 1) / 2, z, MAP_W - 1 - cursor, wallThickness, accent);
  };
  const addVerticalRoomWall = (x, accent) => {
    let cursor = 1;
    for (const center of doorwayCenters) {
      const start = center - doorwayWidth / 2;
      if (start > cursor) addInteriorWall(x, (cursor + start) / 2, wallThickness, start - cursor, accent);
      addBox(x, .035, center, .2, .018, doorwayWidth - .45, accent).userData.doorwayMarker = true;
      const header = addBox(x, 4.68, center, wallThickness + .06, 1.02, doorwayWidth, beamMaterial);
      header.userData.doorHeader = true;
      solidMeshes.push(header);
      addBox(x, 4.145, center, wallThickness + .075, .075, doorwayWidth - .2, accent).userData.doorLight = true;
      indoorMapStats.doorways++;
      indoorMapStats.doorHeaders++;
      indoorMapStats.zoneMarkers++;
      cursor = center + doorwayWidth / 2;
    }
    if (cursor < MAP_H - 1) addInteriorWall(x, (cursor + MAP_H - 1) / 2, wallThickness, MAP_H - 1 - cursor, accent);
  };

  [16, 28, 44, 56].forEach((z, index) => addHorizontalRoomWall(z, lineAccents[index]));
  [16, 28, 44, 56].forEach((x, index) => addVerticalRoomWall(x, lineAccents[3 - index]));

  // Sixty-four fixed ceiling panels cover the sky. Thin beams hide every seam.
  for (let z = 4.5; z < MAP_H; z += 9) {
    for (let x = 4.5; x < MAP_W; x += 9) {
      const panel = addBox(x, CEILING_HEIGHT, z, 9.02, .24, 9.02, ceilingMaterial);
      panel.userData.ceilingPanel = true;
      indoorMapStats.ceilingPanels++;
    }
  }
  for (let seam = 0; seam <= MAP_W; seam += 9) {
    addBox(seam, CEILING_HEIGHT - .17, MAP_H / 2, .12, .16, MAP_H, beamMaterial).userData.ceilingBeam = true;
    addBox(MAP_W / 2, CEILING_HEIGHT - .17, seam, MAP_W, .16, .12, beamMaterial).userData.ceilingBeam = true;
  }

  // Fluorescent bars and a small number of real lights give each zone its own read.
  doorwayCenters.forEach((z, zi) => doorwayCenters.forEach((x, xi) => {
    const accent = zi === 2 ? red : (xi + zi) % 4 === 0 ? cyan : coldWhite;
    const horizontal = (xi + zi) % 2 === 0;
    const fixture = addBox(x, CEILING_HEIGHT - .235, z, horizontal ? 2.15 : .16, .055, horizontal ? .16 : 2.15, accent);
    fixture.userData.ceilingFixture = true;
    indoorMapStats.lightFixtures++;
    if ((xi + zi) % 2 !== 0) return;
    const color = zi === 2 ? 0xff7658 : (xi + zi) % 4 === 0 ? 0x76e8dc : 0xdcebd7;
    const light = new THREE.PointLight(color, zi === 2 ? 5.2 : 4.4, 18, 1.7);
    light.position.set(x, 4.7, z);
    light.castShadow = false;
    light.userData.indoorLight = true;
    scene.add(light);
    indoorMapStats.activeLights++;
  }));
}

function addVoxelBeacon(x, z, color) {
  const accent = new THREE.Color(color);
  const dark = new THREE.MeshStandardMaterial({ color: 0x29403d, roughness: .58, metalness: .42 });
  const glow = new THREE.MeshStandardMaterial({ color: accent.clone().multiplyScalar(.38), emissive: accent, emissiveIntensity: .28, roughness: .42, metalness: .22 });
  const mark = (mesh) => { mesh.userData.voxelArt = true; return mesh; };
  mark(addBox(x, 1.05, z, .72, 2.1, .72, dark, "streetProp"));
  mark(addBox(x, .16, z, 1.02, .32, 1.02, dark));
  mark(addBox(x, .65, z, .78, .13, .78, glow));
  mark(addBox(x, 1.38, z, .78, .13, .78, glow));
  mark(addBox(x, 2.12, z, .44, .44, .44, glow));
  mark(addBox(x, 2.46, z, .14, .3, .14, glow));
  mark(addBox(x - .43, 1.38, z, .16, .16, .16, glow));
  mark(addBox(x + .43, 1.38, z, .16, .16, .16, glow));
  mark(addBox(x, 1.38, z - .43, .16, .16, .16, glow));
  mark(addBox(x, 1.38, z + .43, .16, .16, .16, glow));
  addCrossedPixelArt(textures.terminal, x, .92, z, 1.12, 1.72);
  const light = new THREE.PointLight(color, 2.2, 5.5, 2);
  light.position.set(x, 2.2, z);
  scene.add(light);
}

function trackFiringRangeShell(object) {
  object.userData.rangeShell = true;
  object.userData.noStaticBatch = true;
  firingRangeShellObjects.push(object);
  return object;
}

function createFiringRangeTarget(x, z, lane, motion) {
  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x202725, roughness: .5, metalness: .58 });
  const supportMaterial = new THREE.MeshStandardMaterial({ color: 0x5d633e, roughness: .68, metalness: .28 });
  if (!webEnemyAsset?.scene) trackFiringRangeShell(addBox(x, 1.2, z, 1.12, 1.7, .12, frameMaterial, "rangeTarget"));

  const root = new THREE.Group();
  root.name = `FiringRangeTarget${lane}`;
  root.position.set(x, 1.43, z - .071);
  const trolley = new THREE.Mesh(cachedBoxGeometry(.78, .13, .58), supportMaterial);
  trolley.position.set(0, -1.19, .02);
  trolley.castShadow = true;
  trolley.receiveShadow = true;
  trolley.userData.movingTargetTrolley = true;
  root.add(trolley);
  const trolleyPost = new THREE.Mesh(cachedBoxGeometry(.11, .38, .11), frameMaterial);
  trolleyPost.position.set(0, -1.03, .02);
  trolleyPost.castShadow = true;
  root.add(trolleyPost);
  const cover = addPixelCover(root, textures.firingRangeTarget, FIRING_RANGE_HITBOX_WIDTH, FIRING_RANGE_HITBOX_HEIGHT, [0, -.1, 0], {
    depthTest: true, depthWrite: true, renderOrder: 12, name: `ChatGPTFiringRangeTarget${lane}`
  });
  const hitPlate = new THREE.Mesh(cachedPlaneGeometry(.13, .16), pixelCoverMaterial(textures.rangeHitPlate, { depthTest: true, depthWrite: false }));
  hitPlate.name = `ChatGPTHitZonePlate${lane}`;
  hitPlate.position.set(0, -.08, -.54);
  hitPlate.renderOrder = 14;
  hitPlate.userData.chatGPTPixelArt = true;
  root.add(hitPlate);
  const modelMaterials = [];
  const body3D = new THREE.Group();
  body3D.name = `PixelBlockRangeBody${lane}`;
  body3D.position.z = -.3;
  body3D.userData.genuine3DBody = true;
  const bodyMaterial = (color) => {
    const material = new THREE.MeshLambertMaterial({ color, flatShading: true, toneMapped: false });
    modelMaterials.push({ material, color: material.color.clone(), emissive: material.emissive.clone(), emissiveIntensity: material.emissiveIntensity });
    return material;
  };
  const uniformMaterial = bodyMaterial(lane % 2 ? 0x747c55 : 0x687263);
  const armorMaterial = bodyMaterial(lane % 2 ? 0xa0a271 : 0x8b906b);
  const darkBodyMaterial = bodyMaterial(0x303a37);
  const skinMaterial = bodyMaterial(0xb58b60);
  const bodyPart = (name, width, height, depth, px, py, pz, material, rz = 0) => {
    const part = new THREE.Mesh(cachedBoxGeometry(width, height, depth), material);
    part.name = name;
    part.position.set(px, py, pz);
    part.rotation.z = rz;
    part.castShadow = true;
    part.receiveShadow = true;
    part.renderOrder = 11;
    body3D.add(part);
    return part;
  };
  bodyPart("LeftBoot", .23, .16, .34, -.17, -1.1, -.055, darkBodyMaterial);
  bodyPart("RightBoot", .23, .16, .34, .17, -1.1, -.055, darkBodyMaterial);
  bodyPart("LeftLeg", .19, .58, .2, -.17, -.76, 0, uniformMaterial, -.025);
  bodyPart("RightLeg", .19, .58, .2, .17, -.76, 0, uniformMaterial, .025);
  bodyPart("Hips", .48, .2, .24, 0, -.43, 0, darkBodyMaterial);
  bodyPart("Torso", .58, .66, .27, 0, -.05, 0, uniformMaterial);
  bodyPart("ChestArmor", .52, .38, .09, 0, -.01, -.18, armorMaterial);
  bodyPart("LeftArm", .17, .66, .18, -.39, -.08, .015, uniformMaterial, -.08);
  bodyPart("RightArm", .17, .66, .18, .39, -.08, .015, uniformMaterial, .08);
  bodyPart("LeftGlove", .19, .17, .2, -.415, -.43, -.005, darkBodyMaterial);
  bodyPart("RightGlove", .19, .17, .2, .415, -.43, -.005, darkBodyMaterial);
  bodyPart("Neck", .16, .12, .15, 0, .34, 0, skinMaterial);
  bodyPart("Head", .3, .31, .27, 0, .54, -.005, skinMaterial);
  bodyPart("Helmet", .36, .16, .31, 0, .7, 0, darkBodyMaterial);
  bodyPart("Visor", .2, .07, .035, 0, .56, -.155, darkBodyMaterial);
  root.add(body3D);
  body3D.visible = !webEnemyAsset?.scene;
  let webModel = null;
  let mixer = null;
  if (webEnemyAsset?.scene) {
    const laneAsset = webEnemyAssets[lane - 1] || webEnemyAsset;
    const modelScene = laneAsset.scene;
    webModel = new THREE.Group();
    webModel.name = `KenneyCC0BlockyCharacterLane${lane}`;
    webModel.userData.webSource = "Kenney Blocky Characters CC0";
    const bounds = new THREE.Box3().setFromObject(modelScene);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const modelScale = 1.84 / Math.max(.001, size.y);
    const upright = new THREE.Group();
    modelScene.position.set(-center.x, -bounds.min.y, -center.z);
    webModel.scale.setScalar(modelScale);
    webModel.position.set(0, -1.2, .025);
    webModel.rotation.y = Math.PI;
    let webMeshCount = 0;
    modelScene.traverse((object) => {
      object.visible = true;
      if (!object.isMesh) return;
      webMeshCount++;
      object.castShadow = true;
      object.receiveShadow = true;
      object.frustumCulled = true;
      object.renderOrder = 10;
      const materials = (Array.isArray(object.material) ? object.material : [object.material]).map((sourceMaterial) => {
        const material = sourceMaterial.clone();
        material.side = THREE.DoubleSide;
        material.depthTest = true;
        material.depthWrite = true;
        material.flatShading = true;
        material.toneMapped = false;
        if (material.map) {
          material.map.magFilter = THREE.NearestFilter;
          material.map.minFilter = THREE.NearestFilter;
          material.map.generateMipmaps = false;
          material.map.needsUpdate = true;
        }
        if ("roughness" in material) material.roughness = .88;
        if ("metalness" in material) material.metalness = 0;
        material.needsUpdate = true;
        modelMaterials.push({ material, color: material.color?.clone(), emissive: material.emissive?.clone(), emissiveIntensity: material.emissiveIntensity || 0 });
        return material;
      });
      object.material = Array.isArray(object.material) ? materials : materials[0];
    });
    webModel.userData.meshCount = webMeshCount;
    upright.add(modelScene);
    webModel.add(upright);
    root.add(webModel);
    cover.material.opacity = 0;
    cover.material.colorWrite = false;
    cover.material.depthWrite = false;
    if (laneAsset.animations?.length) {
      mixer = new THREE.AnimationMixer(modelScene);
      const animation = laneAsset.animations.find((clip) => /idle$/i.test(clip.name)) || laneAsset.animations[0];
      mixer.clipAction(animation).play();
      mixer.update(lane * .09);
      mixer.timeScale = 0;
    }
  }
  scene.add(root);
  const target = {
    lane, x, z, startZ: z, root, cover, hitPlate, body3D, webModel, mixer, modelMaterials,
    width: FIRING_RANGE_HITBOX_WIDTH, height: FIRING_RANGE_HITBOX_HEIGHT, baseY: 1.43,
    minZ: motion.minZ, maxZ: motion.maxZ, moveSpeed: 0, moveDirection: 0, startDirection: 0, stationary: true,
    maxHp: FIRING_RANGE_TARGET_HP, hp: FIRING_RANGE_TARGET_HP, dead: false, respawnTimer: 0,
    hitTimer: 0, hits: 0, score: 0, flashing: false
  };
  cover.userData.rangeTarget = target;
  cover.userData.chatGPTPixelArt = true;
  solidMeshes.push(cover);
  firingRangeTargets.push(target);
  return target;
}

function createFiringRange() {
  const laneMaterial = new THREE.MeshBasicMaterial({ color: 0xd9a33b, toneMapped: false });
  const edgeMaterial = new THREE.MeshBasicMaterial({ color: 0x56d9cf, toneMapped: false });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x11181a, roughness: .74, metalness: .32 });
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x182125, roughness: .66, metalness: .42 });
  const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x202a2e, roughness: .55, metalness: .5 });
  const stageMaterial = new THREE.MeshStandardMaterial({ color: 0x313a3c, roughness: .62, metalness: .38 });
  const redStripMaterial = new THREE.MeshBasicMaterial({ color: 0xe43b35, toneMapped: false });
  const rangeWallTexture = textures.wallPanel.clone();
  rangeWallTexture.wrapS = THREE.RepeatWrapping;
  rangeWallTexture.wrapT = THREE.RepeatWrapping;
  rangeWallTexture.repeat.set(4, 2);
  rangeWallTexture.needsUpdate = true;
  const wallArtMaterial = decalMaterial(rangeWallTexture, { roughness: .68, metalness: .34 });

  trackFiringRangeShell(addBox(23.5, .032, 6.6, 7.3, .06, 9.2, darkMaterial));
  trackFiringRangeShell(addBox(19.72, 1.62, 6.6, .16, 3.24, 9.4, wallMaterial));
  trackFiringRangeShell(addBox(27.28, 1.62, 6.6, .16, 3.24, 9.4, wallMaterial));
  trackFiringRangeShell(addBox(23.5, 1.62, 11.22, 7.72, 3.24, .16, wallMaterial));
  trackFiringRangeShell(addBox(23.5, 3.25, 6.6, 7.72, .12, 9.4, ceilingMaterial));
  trackFiringRangeShell(addDecal(9.3, 3.12, wallArtMaterial, 19.815, 1.6, 6.6, 0, Math.PI / 2));
  trackFiringRangeShell(addDecal(9.3, 3.12, wallArtMaterial, 27.185, 1.6, 6.6, 0, -Math.PI / 2));
  trackFiringRangeShell(addDecal(7.3, 3.12, wallArtMaterial, 23.5, 1.6, 11.125, 0, Math.PI));
  trackFiringRangeShell(addBox(19.83, 2.85, 6.6, .055, .075, 8.95, redStripMaterial));
  trackFiringRangeShell(addBox(27.17, 2.85, 6.6, .055, .075, 8.95, redStripMaterial));
  for (let z = 2.35; z <= 10.8; z += 1.2) {
    trackFiringRangeShell(addBox(23.5, 3.16, z, 7.36, .055, .065, ceilingMaterial));
  }

  for (const x of [19.94, 22.3, 24.7, 27.06]) trackFiringRangeShell(addBox(x, .071, 6.55, .045, .026, 8.85, x < 20 || x > 27 ? edgeMaterial : laneMaterial));
  trackFiringRangeShell(addBox(23.5, .074, 2.18, 7.12, .03, .1, redStripMaterial));
  for (const z of [4.7, 7.1, 9.5]) trackFiringRangeShell(addBox(23.5, .068, z, 7.15, .022, .035, laneMaterial));

  const targetConfigs = [
    { x: 20.55, z: 6.1, minZ: 5.05, maxZ: 9.85, speed: .54, direction: 1 },
    { x: 21.73, z: 8.9, minZ: 5.35, maxZ: 10.15, speed: .43, direction: -1 },
    { x: 22.91, z: 7.25, minZ: 5.15, maxZ: 9.95, speed: .62, direction: 1 },
    { x: 24.09, z: 9.45, minZ: 5.45, maxZ: 10.25, speed: .48, direction: -1 },
    { x: 25.27, z: 6.75, minZ: 5.05, maxZ: 9.85, speed: .58, direction: 1 },
    { x: 26.45, z: 8.35, minZ: 5.3, maxZ: 10.1, speed: .46, direction: -1 }
  ];
  for (const [laneIndex, config] of targetConfigs.entries()) {
    const railCenter = (config.minZ + config.maxZ) / 2;
    const railLength = config.maxZ - config.minZ + .72;
    trackFiringRangeShell(addBox(config.x, .095, railCenter, .82, .12, railLength, stageMaterial));
    trackFiringRangeShell(addBox(config.x - .27, .167, railCenter, .045, .025, railLength - .12, edgeMaterial));
    trackFiringRangeShell(addBox(config.x + .27, .167, railCenter, .045, .025, railLength - .12, edgeMaterial));
    const target = createFiringRangeTarget(config.x, config.z, laneIndex + 1, config);
    if (laneIndex % 2 === 0) {
      const spot = new THREE.SpotLight(0xe9f5ff, 4.5, 6.5, .68, .5, 1.4);
      spot.position.set(config.x + .58, 2.92, 4.25);
      spot.target = target.root;
      spot.castShadow = false;
      scene.add(spot);
      trackFiringRangeShell(spot);
    }
  }
}

function playerInsideFiringRange() {
  return player && player.x >= FIRING_RANGE_BOUNDS.minX && player.x <= FIRING_RANGE_BOUNDS.maxX
    && player.z >= FIRING_RANGE_BOUNDS.minZ && player.z <= FIRING_RANGE_BOUNDS.maxZ;
}

function damageFiringRangeTarget(target, damage, points = damage) {
  if (!target || target.dead || damage <= 0) return { hit: false, killed: false, damage: 0 };
  const appliedDamage = Math.max(1, Math.round(damage));
  const awardedPoints = Math.max(1, Math.round(points));
  target.hitTimer = .22;
  target.hp = Math.max(0, target.hp - appliedDamage);
  target.hits++;
  target.score += awardedPoints;
  firingRangeStats.hits++;
  firingRangeStats.score += awardedPoints;
  firingRangeStats.lastPoints = awardedPoints;
  const killed = target.hp <= 0;
  if (killed) {
    target.dead = true;
    target.respawnTimer = FIRING_RANGE_RESPAWN_SECONDS;
    target.root.visible = false;
    firingRangeStats.kills++;
  }
  return { hit: true, killed, damage: appliedDamage, points: awardedPoints };
}

function updateFiringRange(dt) {
  const inside = playerInsideFiringRange();
  if (inside && !firingRangeStats.inside) toast("FIRING RANGE // LIVE TARGETS");
  firingRangeStats.inside = inside;
  const showRangeEnvironment = playMode === "range" || inside;
  if (showRangeEnvironment !== firingRangeShellVisible) {
    firingRangeShellVisible = showRangeEnvironment;
    for (const object of firingRangeShellObjects) object.visible = showRangeEnvironment;
  }
  for (const target of firingRangeTargets) {
    if (target.dead) {
      target.respawnTimer = Math.max(0, target.respawnTimer - dt);
      target.root.visible = false;
      if (target.respawnTimer <= 0) {
        target.dead = false;
        target.hp = target.maxHp;
        target.hitTimer = 0;
        target.flashing = false;
        target.root.rotation.z = 0;
        target.root.position.x = target.x;
        target.root.position.z = target.z - .071;
        target.cover.material.color.setHex(0xffffff);
        target.hitPlate.material.color.setHex(0xffffff);
        for (const entry of target.modelMaterials) {
          if (entry.color) entry.material.color.copy(entry.color);
          if (entry.emissive) entry.material.emissive.copy(entry.emissive);
          entry.material.emissiveIntensity = entry.emissiveIntensity;
        }
        target.root.visible = showRangeEnvironment;
        if (playMode === "range") toast(`LANE ${target.lane} DUMMY READY`);
      }
      continue;
    }
    target.root.visible = showRangeEnvironment;
    const showWebModel = showRangeEnvironment;
    if (target.webModel) target.webModel.visible = showWebModel;
    if (target.body3D) target.body3D.visible = showRangeEnvironment && !target.webModel;
    target.root.position.x = target.x;
    target.z = target.startZ;
    target.root.position.z = target.z - .071;
    target.hitTimer = Math.max(0, target.hitTimer - dt);
    const impact = target.hitTimer > 0 ? target.hitTimer / .22 : 0;
    const flashing = impact > .55;
    if (flashing !== target.flashing) {
      target.flashing = flashing;
      target.cover.material.color.setHex(flashing ? 0xffb447 : 0xffffff);
      target.hitPlate.material.color.setHex(flashing ? 0xffb447 : 0xffffff);
      for (const entry of target.modelMaterials) {
        if (entry.color) entry.material.color.copy(entry.color).lerp(FIRING_RANGE_HIT_COLOR, flashing ? .68 : 0);
        if (entry.emissive) entry.material.emissive.copy(entry.emissive).lerp(FIRING_RANGE_HIT_EMISSIVE, flashing ? .7 : 0);
        entry.material.emissiveIntensity = entry.emissiveIntensity + (flashing ? 1.8 : 0);
      }
    }
    target.root.rotation.z = Math.sin(impact * Math.PI * 5) * impact * .035;
  }
}

function createWorld() {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(MAP_W, MAP_H),
    new THREE.MeshStandardMaterial({ color: 0x252a26, roughness: .95, metalness: .12 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(MAP_W / 2, 0, MAP_H / 2);
  floor.receiveShadow = true;
  floor.updateMatrix(); floor.matrixAutoUpdate = false;
  scene.add(floor);

  const floorTexture = textures.floorTile.clone();
  floorTexture.wrapS = THREE.RepeatWrapping; floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(MAP_W / 2, MAP_H / 2); floorTexture.needsUpdate = true;
  const floorArt = new THREE.Mesh(
    new THREE.PlaneGeometry(MAP_W, MAP_H),
    decalMaterial(floorTexture, { roughness: .82, metalness: .16 })
  );
  floorArt.rotation.x = -Math.PI / 2;
  floorArt.position.set(MAP_W / 2, .018, MAP_H / 2);
  floorArt.receiveShadow = true; floorArt.renderOrder = 1;
  floorArt.updateMatrix(); floorArt.matrixAutoUpdate = false;
  scene.add(floorArt);
  createIndoorComplex();

  const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x273332, roughness: .5, metalness: .55 });
  const cargoArtMaterial = decalMaterial(textures.cargoSide, { roughness: .58, metalness: .32 });
  const platformTopMaterial = decalMaterial(textures.floorTile, { roughness: .7, metalness: .25 });
  for (const data of platformData) {
    const core = addBox(data.x + data.w / 2, data.height / 2, data.z + data.d / 2, data.w, data.height, data.d, platformMaterial, "platform");
    const topArt = addDecal(data.w + .004, data.d + .004, platformTopMaterial, data.x + data.w / 2, data.height + .018, data.z + data.d / 2, -Math.PI / 2, 0);
    addCargoArt(data, cargoArtMaterial);
    platforms.push({ ...data, mesh: core, topMesh: topArt });
  }

  createFiringRange();

  addVoxelBeacon(6, 6, 0x5ce0d2);
  addVoxelBeacon(MAP_W - 6, 6, 0xe7a43c);
  addVoxelBeacon(6, MAP_H - 6, 0xe7a43c);
  addVoxelBeacon(MAP_W - 6, MAP_H - 6, 0x5ce0d2);

  const ambient = new THREE.AmbientLight(0xb9cec7, 1.3);
  scene.add(ambient);
  const hemi = new THREE.HemisphereLight(0xd0ece8, 0x4b463a, 1.12);
  scene.add(hemi);
  batchStaticWorldMeshes();
  buildNavigationGrid();
  // The facility shell and its lights never move. Render their shadow map once instead
  // of rebuilding hundreds of static shadow casters on every frame.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
}

function createWeapon() {
  weaponHip = createFirstPersonWeapon(false);
  hideVoxelSurface(weaponHip);
  const hipCover = addPixelCover(weaponHip, textures.weapon, 1.61, .91, [0, .375, .08], { depthTest: false, depthWrite: false, renderOrder: 1100, name: "OriginalCarbinePixelCover" });
  weaponHip.userData.materials.push(hipCover.material);
  weaponSprintCover = addPixelCover(weaponHip, textures.weaponSprint, 1.61, .906, [0, .375, .081], { depthTest: false, depthWrite: false, renderOrder: 1101, name: "ChatGPTSprintCarbinePixelCover" });
  weaponSprintCover.visible = false;
  weaponSprintCover.material.opacity = 0;
  weaponHip.userData.pixelCover = hipCover;
  weaponHip.userData.sprintCover = weaponSprintCover;
  weaponHip.position.set(.12, -.44, -.58);
  weaponHip.scale.setScalar(.72);
  camera.add(weaponHip);
  weaponAds = createFirstPersonWeapon(true);
  hideVoxelSurface(weaponAds);
  const adsCover = addPixelCover(weaponAds, textures.weaponAds, .92, .92, [0, -.136, .15], { depthTest: false, depthWrite: false, renderOrder: 1100, name: "OriginalEotechPixelCover" });
  // The generated artwork's red dot sits .135 units above the image center.
  // Its plane offset places that dot on the weapon root's optical center.
  adsCover.userData.aimDotY = .135;
  weaponAds.userData.materials.push(adsCover.material);
  weaponAds.position.set(0, 0, -.62);
  weaponAds.scale.setScalar(.74);
  setVoxelOpacity(weaponAds, 0);
  camera.add(weaponAds);
  muzzleLight = new THREE.PointLight(0xffc04d, 0, 2.2, 2);
  muzzleLight.position.set(.12, -.2, -1.1);
  camera.add(muzzleLight);

  // ChatGPT-generated transparent action sprites use fixed camera-space roots;
  // motion lives inside each atlas so no action frame can leave the screen.
  const actionSprite = (name, texture, width, height) => {
    const root = new THREE.Group();
    root.name = name;
    root.userData.chatGPTPixelArt = true;
    const atlasTexture = texture.clone();
    atlasTexture.repeat.set(1 / 4, 1 / 2);
    atlasTexture.offset.set(0, 1 / 2);
    atlasTexture.needsUpdate = true;
    const cover = addPixelCover(root, atlasTexture, width, height, [0, 0, .02], {
      depthTest: false, depthWrite: false, renderOrder: 1104, name: `${name}TransparentCover`
    });
    cover.userData.actionSprite = true;
    root.userData.atlasColumns = 4;
    root.userData.atlasRows = 2;
    root.userData.atlasFrames = WEAPON_ACTION_ART_FRAMES;
    root.userData.frame = 0;
    root.visible = false;
    return root;
  };
  reloadMagazine = actionSprite("ChatGPTPixelReloadHand", textures.actionReload, .42, .42);
  camera.add(reloadMagazine);

  reloadGun = new THREE.Group();
  reloadGun.name = "ChatGPTPixelReloadGun";
  reloadGun.userData.chatGPTPixelArt = true;
  const reloadGunCover = addPixelCover(reloadGun, textures.actionReloadGun, .95, .535, [0, 0, .02], {
    depthTest: false, depthWrite: false, renderOrder: 1105, name: "ChatGPTPixelReloadGunTransparentCover"
  });
  reloadGunCover.userData.actionSprite = true;
  reloadGun.visible = false;
  camera.add(reloadGun);

  throwHand = new THREE.Group();
  throwHand.name = "ChatGPTPixelActionRig";
  heldThrowables.smoke = actionSprite("ChatGPTPixelSmokeThrow", textures.actionSmoke, .44, .44);
  heldThrowables.frag = actionSprite("ChatGPTPixelFragThrow", textures.actionFrag, .44, .44);
  heldThrowables.medkit = actionSprite("ChatGPTPixelMedkitUse", textures.actionMedkit, .53, .53);
  for (const held of Object.values(heldThrowables)) throwHand.add(held);
  throwHand.visible = false;
  camera.add(throwHand);
}

function lockActionArtToScreen(root, kind) {
  const anchor = ACTION_SCREEN_ANCHORS[kind];
  root.position.set(anchor.x, anchor.y, anchor.z);
  root.rotation.set(0, 0, anchor.roll);
}

function createRemoteOperator() {
  remoteOperator = createVoxelOperator("coop");
  applyVoxelOperatorPixelSkin(remoteOperator, textures.operatorSkin);
  remoteOperator.scale.setScalar(.8);
  remoteOperator.rotation.order = "YXZ";
  remoteOperator.visible = false;
  remoteOperator.userData.remoteOperator = true;
  scene.add(remoteOperator);
  remoteShadow = new THREE.Mesh(
    new THREE.CircleGeometry(.42, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .36, depthTest: true, depthWrite: false })
  );
  remoteShadow.rotation.x = -Math.PI / 2;
  remoteShadow.renderOrder = 2;
  remoteShadow.visible = false;
  scene.add(remoteShadow);
}

function createThrowPreview() {
  const material = new THREE.MeshBasicMaterial({ color: 0x75e0d4, depthTest: true, depthWrite: false, transparent: true, opacity: .92 });
  const geometry = new THREE.BoxGeometry(.018, .018, .018);
  const markers = Array.from({ length: 56 }, () => {
    const marker = new THREE.Mesh(geometry, material);
    marker.visible = false;
    marker.renderOrder = 16;
    scene.add(marker);
    return marker;
  });
  const target = new THREE.Mesh(
    new THREE.RingGeometry(.13, .22, 16),
    new THREE.MeshBasicMaterial({ color: 0x75e0d4, side: THREE.DoubleSide, depthTest: true, depthWrite: false, transparent: true, opacity: .9 })
  );
  target.rotation.x = -Math.PI / 2;
  target.visible = false;
  target.renderOrder = 16;
  scene.add(target);
  throwPreview = { markers, target, material, kind: null, end: null, markerCount: 0 };
}

function clearEnemies() {
  for (const enemy of enemies) {
    if (enemy.sprite) {
      scene.remove(enemy.sprite);
      disposeVoxelObject(enemy.sprite);
    }
  }
  enemies = [];
}

function clearOrdnance() {
  for (const projectile of projectiles) {
    scene.remove(projectile.sprite);
    disposeVoxelObject(projectile.sprite);
  }
  for (const cloud of smokeClouds) {
    for (const sprite of cloud.sprites) {
      scene.remove(sprite);
      sprite.material.dispose();
    }
  }
  for (const effect of blastEffects) {
    scene.remove(effect.light);
    for (const particle of effect.particles) {
      scene.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      particle.mesh.material.dispose();
    }
    for (const burst of effect.bursts || []) {
      scene.remove(burst.sprite);
      burst.sprite.material.dispose();
      burst.texture.dispose();
    }
  }
  projectiles = [];
  smokeClouds = [];
  blastEffects = [];
}

function smoothAction(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function actionWindow(t, enterStart, enterEnd, exitStart, exitEnd) {
  return smoothAction((t - enterStart) / Math.max(.001, enterEnd - enterStart))
    * (1 - smoothAction((t - exitStart) / Math.max(.001, exitEnd - exitStart)));
}

function setActionSpriteFrame(root, requestedFrame) {
  if (!root?.userData?.pixelCover) return;
  const columns = root.userData.atlasColumns || 1;
  const rows = root.userData.atlasRows || 1;
  const frames = root.userData.atlasFrames || 1;
  const frame = clamp(Math.floor(requestedFrame), 0, frames - 1);
  if (root.userData.frame === frame) return;
  root.userData.frame = frame;
  const column = frame % columns;
  const row = Math.floor(frame / columns);
  const texture = root.userData.pixelCover.material.map;
  texture.repeat.set(1 / columns, 1 / rows);
  texture.offset.set(column / columns, 1 - (row + 1) / rows);
  texture.needsUpdate = true;
}

function weaponActionBusy() {
  return weaponAction.kind !== "idle";
}

function resetWeaponAction() {
  weaponAction.kind = "idle";
  weaponAction.elapsed = 0;
  weaponAction.duration = 0;
  weaponAction.frame = 0;
  weaponAction.totalFrames = 0;
  weaponAction.artFrame = 0;
  weaponAction.released = false;
  weaponAction.phase = "idle";
  if (reloadMagazine) reloadMagazine.visible = false;
  if (reloadGun) reloadGun.visible = false;
  if (throwHand) throwHand.visible = false;
  for (const held of Object.values(heldThrowables)) if (held) held.visible = false;
}

function beginWeaponAction(kind) {
  weaponAction.kind = kind;
  weaponAction.elapsed = 0;
  weaponAction.duration = WEAPON_ACTION_DURATIONS[kind];
  weaponAction.totalFrames = WEAPON_ACTION_MOTION_FRAMES[kind];
  weaponAction.frame = 0;
  weaponAction.artFrame = 0;
  weaponAction.released = false;
  weaponAction.phase = kind === "reload" ? "weapon-down" : "draw";
}

function finishReload() {
  if (playMode === "range") {
    player.mag = 30;
    player.reserve = 999;
    player.reloading = 0;
    sfx("reloadEnd");
    return;
  }
  const amount = Math.min(30 - player.mag, player.reserve);
  player.mag += amount;
  player.reserve -= amount;
  player.reloading = 0;
  sfx("reloadEnd");
}

function updateWeaponAction(dt) {
  if (!weaponActionBusy()) return;
  weaponAction.elapsed = Math.min(weaponAction.duration, weaponAction.elapsed + dt);
  const t = weaponAction.elapsed / weaponAction.duration;
  weaponAction.frame = Math.min(weaponAction.totalFrames - 1, Math.floor(t * weaponAction.totalFrames));
  weaponAction.artFrame = Math.min(WEAPON_ACTION_ART_FRAMES - 1, Math.floor(t * WEAPON_ACTION_ART_FRAMES));
  if (weaponAction.kind === "reload") {
    player.reloading = Math.max(0, weaponAction.duration - weaponAction.elapsed);
    weaponAction.phase = t < .12 ? "weapon-down" : t < .3 ? "reach-magazine" : t < .48 ? "magazine-out" : t < .64 ? "fresh-magazine" : t < .78 ? "magazine-in" : t < .91 ? "charge" : "recover";
  } else if (weaponAction.kind === "smoke" || weaponAction.kind === "frag") {
    const releaseAt = weaponAction.kind === "smoke" ? .63 : .66;
    weaponAction.phase = t < .18 ? "draw" : t < .42 ? "raise" : t < releaseAt ? (weaponAction.kind === "smoke" ? "sidearm-windup" : "overhand-windup") : t < .86 ? "follow-through" : "recover";
    if (!weaponAction.released && t < releaseAt) weaponAction.artFrame = Math.min(5, Math.floor(t / releaseAt * 6));
    if (!weaponAction.released && t >= releaseAt) {
      weaponAction.released = true;
      launchOrdnance(weaponAction.kind);
    }
    // The projectile and held drawing swap on the exact same update. Frames
    // six and seven contain only the empty follow-through hand, preventing a
    // duplicate grenade from lingering after it has entered the world.
    if (weaponAction.released) weaponAction.artFrame = t < .86 ? 6 : 7;
  } else {
    weaponAction.phase = t < .14 ? "draw" : t < .38 ? "open" : t < .72 ? "apply" : t < .88 ? "close" : "stow";
  }
  if (weaponAction.elapsed < weaponAction.duration) return;
  if (weaponAction.kind === "reload") finishReload();
  resetWeaponAction();
}

function resetRun() {
  clearEnemies();
  clearOrdnance();
  nextEnemyId = 1;
  const duel = network.active && network.mode === "duel";
  const range = playMode === "range";
  const startX = range ? 23.5 : duel ? MAP_W / 2 + (network.slot === 0 ? -12 : 12) : MAP_W / 2 + (network.active ? (network.slot === 0 ? -.8 : .8) : -.5);
  const startZ = range ? 3.2 : MAP_H / 2 + .4;
  player = {
    x: startX, z: startZ, y: 0, vy: 0, grounded: true, eyeHeight: .56,
    yaw: range ? Math.PI : duel ? (network.slot === 0 ? -Math.PI / 2 : Math.PI / 2) : 0, pitch: range ? .08 : 0, radius: .21, hp: 100, armor: 50,
    mag: 30, reserve: range ? 999 : 150, reloading: 0, fireCd: 0, throwCd: 0, smokes: range ? 99 : 2, grenades: range ? 99 : 2, meds: 1, kills: 0, streak: 0,
    slideTimer: 0, slideX: 0, slideZ: 0, stance: "stand", lastSafeX: startX, lastSafeZ: startZ, spawnShield: duel ? 1 : 0
  };
  resetWeaponAction();
  firingRangeStats.hits = 0;
  firingRangeStats.kills = 0;
  firingRangeStats.bullseyes = 0;
  firingRangeStats.score = 0;
  firingRangeStats.inside = false;
  firingRangeStats.lastPoints = 0;
  for (const target of firingRangeTargets) {
    target.hitTimer = 0;
    target.hp = target.maxHp;
    target.dead = false;
    target.respawnTimer = 0;
    target.hits = 0;
    target.score = 0;
    target.root.rotation.z = 0;
    target.root.position.x = target.x;
    target.z = target.startZ;
    target.moveDirection = target.startDirection;
    target.root.position.z = target.z - .071;
    target.root.visible = true;
    target.flashing = false;
    target.cover.material.color.setHex(0xffffff);
    target.hitPlate.material.color.setHex(0xffffff);
    for (const entry of target.modelMaterials) {
      if (entry.color) entry.material.color.copy(entry.color);
      if (entry.emissive) entry.material.emissive.copy(entry.emissive);
      entry.material.emissiveIntensity = entry.emissiveIntensity;
    }
  }
  network.worldWave = 0;
  network.remote = null;
  network.peerConnected = false;
  if (remoteOperator) remoteOperator.visible = false;
  if (remoteShadow) remoteShadow.visible = false;
  wave = 0; waveDelay = -1; score = 0; streakTimer = 0;
  hudTimer = 0; networkHudTimer = 0;
  damageFlash = 0; hitmarkTimer = 0; hitmarkKill = false; hitZoneTimer = 0; muzzleTime = 0; weaponRecoil = 0; cameraKick = 0; weaponBob = 0; weaponHoldTime = 0; adsAmount = 0; sprintAmount = 0;
  placeHitConfirm();
  weaponLookSwayX = 0; weaponLookSwayY = 0; lastWeaponYaw = player.yaw; lastWeaponPitch = player.pitch; weaponSwayReady = true;
  lastHit = null; lastSfx = ""; ui.hitZone.className = "hit-zone"; ui.hitZone.textContent = "";
  lastR3Press = -Infinity;
  input.mouseAim = false; input.padAim = false; input.padSmoke = false; input.padFrag = false;
  hideThrowPreview();
  ui.toasts.replaceChildren(); ui.prompt.classList.add("hidden");
  if (!duel && !range) spawnWave();
  updateCamera(); updateHUD();
}

function makeEnemy(x, z, kind = "grunt", forcedId = null) {
  const stats = kind === "heavy"
    ? { hp: 135, radius: .3, speed: .78, damage: 17, rate: .82, height: 1.22 }
    : kind === "raider"
      ? { hp: 52, radius: .2, speed: 1.45, damage: 9, rate: .7, height: 1.05 }
      : { hp: 74, radius: .22, speed: .95, damage: 11, rate: 1.02, height: 1.08 };
  const sprite = createVoxelEnemy(kind, stats.height);
  sprite.position.set(x, 0, z);
  scene.add(sprite);
  const enemy = {
    id: forcedId ?? nextEnemyId++, x, z, kind, ...stats, maxHp: stats.hp, alert: 4, fireCd: .6 + Math.random(), hit: 0, dead: false,
    strafe: Math.random() * 6, targetSlot: "local", smokeVisibility: 1, sprite,
    action: "idle", firePose: 0, animTime: Math.random() * 4, yaw: 0,
    vx: 0, vz: 0, moveSpeed: 0, waypointX: x, waypointZ: z, navigationState: "idle",
    pathTimer: Math.random() * .22, decisionTimer: .45 + Math.random() * .8, pauseTimer: 0, stuckTimer: 0,
    strafeDir: Math.random() < .5 ? -1 : 1, pace: .9 + Math.random() * .18, turnLean: 0
  };
  if (forcedId !== null) nextEnemyId = Math.max(nextEnemyId, forcedId + 1);
  sprite.userData.hitMeshes.forEach(mesh => { mesh.userData.enemy = enemy; });
  return enemy;
}

function spawnWave() {
  clearEnemies();
  wave++;
  const count = Math.min(5 + wave * 2, 23);
  const ordered = [...spawnPoints].sort(() => Math.random() - .5);
  for (let i = 0; i < count; i++) {
    const point = ordered[i % ordered.length];
    const ring = Math.floor(i / ordered.length) * .45;
    const x = clamp(point[0] + Math.cos(i * 2.399) * ring, 1.35, MAP_W - 1.35);
    const z = clamp(point[1] + Math.sin(i * 2.399) * ring, 1.35, MAP_H - 1.35);
    let kind = "grunt";
    if (wave >= 2 && i % 3 === 1) kind = "raider";
    if (wave >= 4 && i % 7 === 0) kind = "heavy";
    enemies.push(makeEnemy(x, z, kind));
  }
  waveDelay = -1;
  if (state === "playing") toast(`WAVE ${String(wave).padStart(2, "0")} // ${count} HOSTILES`, wave > 2);
  if (wave > 1) {
    player.reserve = Math.min(240, player.reserve + 45);
    player.smokes = Math.min(3, player.smokes + 1);
    player.grenades = Math.min(3, player.grenades + 1);
    player.armor = Math.min(100, player.armor + 15);
    player.hp = Math.min(100, player.hp + 10);
    score += wave * 100;
    sfx("wave"); rumble(.18, .42, 180);
  }
}

function circleHitsCollider(x, z, radius, collider) {
  const closestX = clamp(x, collider.minX, collider.maxX);
  const closestZ = clamp(z, collider.minZ, collider.maxZ);
  return Math.hypot(x - closestX, z - closestZ) < radius;
}

function groundHeightAt(x, z) {
  let height = 0;
  for (const platform of platforms) {
    if (x > platform.x + .08 && x < platform.x + platform.w - .08 && z > platform.z + .08 && z < platform.z + platform.d - .08) height = Math.max(height, platform.height);
  }
  return height;
}

function canPlayerStand(x, z) {
  return !someNearbyCollider(x, z, player.radius, (collider) => {
    if (!circleHitsCollider(x, z, player.radius, collider)) return false;
    return colliderBlocksPlayer(collider);
  });
}

function colliderBlocksPlayer(collider) {
  return collider.kind === "wall" || player.y < collider.top - .09;
}

function pushPlayerOutOfCollider(collider) {
  const clearance = .004;
  const closestX = clamp(player.x, collider.minX, collider.maxX);
  const closestZ = clamp(player.z, collider.minZ, collider.maxZ);
  const dx = player.x - closestX;
  const dz = player.z - closestZ;
  const distanceFromCollider = Math.hypot(dx, dz);

  if (distanceFromCollider > .00001) {
    const overlap = player.radius + clearance - distanceFromCollider;
    if (overlap <= 0) return false;
    player.x += dx / distanceFromCollider * overlap;
    player.z += dz / distanceFromCollider * overlap;
    return true;
  }

  const exits = [
    { amount: player.x - (collider.minX - player.radius - clearance), x: -1, z: 0 },
    { amount: collider.maxX + player.radius + clearance - player.x, x: 1, z: 0 },
    { amount: player.z - (collider.minZ - player.radius - clearance), x: 0, z: -1 },
    { amount: collider.maxZ + player.radius + clearance - player.z, x: 0, z: 1 }
  ];
  const exit = exits.reduce((best, item) => item.amount < best.amount ? item : best);
  player.x += exit.x * exit.amount;
  player.z += exit.z * exit.amount;
  return true;
}

function recoverPlayerFromColliders() {
  const edge = player.radius + .004;
  player.x = clamp(player.x, 1 + edge, MAP_W - 1 - edge);
  player.z = clamp(player.z, 1 + edge, MAP_H - 1 - edge);

  for (let pass = 0; pass < 8; pass++) {
    let corrected = false;
    for (const collider of nearbyColliders(player.x, player.z, player.radius)) {
      if (!colliderBlocksPlayer(collider) || !circleHitsCollider(player.x, player.z, player.radius, collider)) continue;
      corrected = pushPlayerOutOfCollider(collider) || corrected;
    }
    player.x = clamp(player.x, 1 + edge, MAP_W - 1 - edge);
    player.z = clamp(player.z, 1 + edge, MAP_H - 1 - edge);
    if (!corrected) break;
  }

  if (canPlayerStand(player.x, player.z)) {
    player.lastSafeX = player.x;
    player.lastSafeZ = player.z;
    return true;
  }

  player.x = player.lastSafeX;
  player.z = player.lastSafeZ;
  player.y = groundHeightAt(player.x, player.z);
  player.vy = 0;
  player.grounded = true;
  return false;
}

function canEnemyStand(x, z, radius) {
  return !someNearbyCollider(x, z, radius, (collider) => circleHitsCollider(x, z, radius, collider));
}

function navigationIndex(x, z) {
  return z * MAP_W + x;
}

function navigationCellOpen(x, z) {
  return x >= 1 && z >= 1 && x < MAP_W - 1 && z < MAP_H - 1 && navigationWalkable[navigationIndex(x, z)] === 1;
}

function navigationStepOpen(x, z, nextX, nextZ) {
  if (!navigationCellOpen(nextX, nextZ)) return false;
  const dx = nextX - x;
  const dz = nextZ - z;
  return !dx || !dz || (navigationCellOpen(x + dx, z) && navigationCellOpen(x, z + dz));
}

function buildNavigationGrid() {
  navigationWalkable.fill(0);
  navigationWalkableCount = 0;
  for (let z = 1; z < MAP_H - 1; z++) {
    for (let x = 1; x < MAP_W - 1; x++) {
      if (!canEnemyStand(x + .5, z + .5, .31)) continue;
      navigationWalkable[navigationIndex(x, z)] = 1;
      navigationWalkableCount++;
    }
  }
  navigationFields.local = null;
  navigationFields.remote = null;
}

function nearestNavigationCell(x, z, maxRadius = 9) {
  const centerX = clamp(Math.floor(x), 1, MAP_W - 2);
  const centerZ = clamp(Math.floor(z), 1, MAP_H - 2);
  if (navigationCellOpen(centerX, centerZ)) return { x: centerX, z: centerZ, index: navigationIndex(centerX, centerZ) };
  for (let radius = 1; radius <= maxRadius; radius++) {
    let best = null;
    let bestDistance = Infinity;
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== radius) continue;
        const cellX = centerX + dx;
        const cellZ = centerZ + dz;
        if (!navigationCellOpen(cellX, cellZ)) continue;
        const cellDistance = Math.hypot(cellX + .5 - x, cellZ + .5 - z);
        if (cellDistance < bestDistance) {
          bestDistance = cellDistance;
          best = { x: cellX, z: cellZ, index: navigationIndex(cellX, cellZ) };
        }
      }
    }
    if (best) return best;
  }
  return null;
}

function navigationFieldFor(slot, target) {
  const goal = nearestNavigationCell(target.x, target.z);
  if (!goal) return null;
  const cached = navigationFields[slot];
  if (cached?.goalIndex === goal.index) return cached;
  const distances = new Int16Array(MAP_W * MAP_H);
  distances.fill(-1);
  const queue = new Int32Array(MAP_W * MAP_H);
  let head = 0;
  let tail = 0;
  distances[goal.index] = 0;
  queue[tail++] = goal.index;
  while (head < tail) {
    const index = queue[head++];
    const x = index % MAP_W;
    const z = Math.floor(index / MAP_W);
    const nextDistance = distances[index] + 1;
    for (const [dx, dz] of NAV_DIRECTIONS) {
      const nextX = x + dx;
      const nextZ = z + dz;
      if (!navigationStepOpen(x, z, nextX, nextZ)) continue;
      const nextIndex = navigationIndex(nextX, nextZ);
      if (distances[nextIndex] !== -1) continue;
      distances[nextIndex] = nextDistance;
      queue[tail++] = nextIndex;
    }
  }
  const field = { goalIndex: goal.index, goalX: goal.x + .5, goalZ: goal.z + .5, distances, reachable: tail };
  navigationFields[slot] = field;
  return field;
}

function navigationLineClear(x1, z1, x2, z2, radius) {
  const length = Math.hypot(x2 - x1, z2 - z1);
  if (length > 12) return false;
  const steps = Math.max(1, Math.ceil(length / .28));
  for (let index = 1; index <= steps; index++) {
    const amount = index / steps;
    if (!canEnemyStand(x1 + (x2 - x1) * amount, z1 + (z2 - z1) * amount, radius)) return false;
  }
  return true;
}

function navigationWaypoint(enemy, target, field) {
  if (navigationLineClear(enemy.x, enemy.z, target.x, target.z, enemy.radius)) {
    return { x: target.x, z: target.z, state: "direct" };
  }
  const start = nearestNavigationCell(enemy.x, enemy.z, 4);
  if (!start || !field || field.distances[start.index] < 0) {
    return { x: target.x, z: target.z, state: "fallback" };
  }
  let cellX = start.x;
  let cellZ = start.z;
  let cellDistance = field.distances[start.index];
  const candidates = [];
  for (let step = 0; step < 11 && cellDistance > 0; step++) {
    let best = null;
    const offset = (enemy.id + step + (enemy.strafeDir > 0 ? 2 : 0)) % NAV_DIRECTIONS.length;
    for (let directionIndex = 0; directionIndex < NAV_DIRECTIONS.length; directionIndex++) {
      const [dx, dz] = NAV_DIRECTIONS[(directionIndex + offset) % NAV_DIRECTIONS.length];
      const nextX = cellX + dx;
      const nextZ = cellZ + dz;
      if (!navigationStepOpen(cellX, cellZ, nextX, nextZ)) continue;
      const nextDistance = field.distances[navigationIndex(nextX, nextZ)];
      if (nextDistance < 0 || nextDistance >= cellDistance) continue;
      if (!best || nextDistance < best.distance) best = { x: nextX, z: nextZ, distance: nextDistance };
    }
    if (!best) break;
    cellX = best.x;
    cellZ = best.z;
    cellDistance = best.distance;
    candidates.push({ x: cellX + .5, z: cellZ + .5 });
  }
  for (let index = candidates.length - 1; index >= 0; index--) {
    const candidate = candidates[index];
    if (navigationLineClear(enemy.x, enemy.z, candidate.x, candidate.z, enemy.radius)) {
      return { ...candidate, state: "route" };
    }
  }
  const first = candidates[0];
  return first ? { ...first, state: "corner" } : { x: field.goalX, z: field.goalZ, state: "goal" };
}

function movePlayer(dx, dz) {
  recoverPlayerFromColliders();
  if (canPlayerStand(player.x + dx, player.z)) player.x += dx;
  if (canPlayerStand(player.x, player.z + dz)) player.z += dz;
  recoverPlayerFromColliders();
}

function moveEnemy(enemy, dx, dz) {
  const oldX = enemy.x;
  const oldZ = enemy.z;
  if (canEnemyStand(enemy.x + dx, enemy.z, enemy.radius)) enemy.x += dx;
  if (canEnemyStand(enemy.x, enemy.z + dz, enemy.radius)) enemy.z += dz;
  return Math.hypot(enemy.x - oldX, enemy.z - oldZ);
}

function solidLineBlocked(x1, z1, y1, x2, z2, y2) {
  const length = Math.hypot(x2 - x1, z2 - z1);
  const steps = Math.ceil(length / .09);
  for (let i = 2; i < steps - 2; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const z = z1 + (z2 - z1) * t;
    const y = y1 + (y2 - y1) * t;
    const bucket = colliderGrid.get(`${Math.floor(x)},${Math.floor(z)}`) || [];
    if (bucket.some((collider) => x > collider.minX && x < collider.maxX && z > collider.minZ && z < collider.maxZ && y < collider.top)) return true;
  }
  return false;
}

function smokeDensityAlongSegment(x1, z1, x2, z2) {
  const dx = x2 - x1, dz = z2 - z1;
  const lengthSquared = dx * dx + dz * dz;
  let strongest = 0;
  for (const cloud of smokeClouds) {
    if (cloud.timer <= .25) continue;
    const age = cloud.maxTimer - cloud.timer;
    const lifeStrength = Math.min(1, age * 2.8) * Math.min(1, cloud.timer / 1.35);
    for (const lobe of cloud.lobes || [{ x: cloud.x, z: cloud.z, radius: cloud.radius, density: 1 }]) {
      const t = lengthSquared > 0 ? clamp(((lobe.x - x1) * dx + (lobe.z - z1) * dz) / lengthSquared, 0, 1) : 0;
      const closestDistance = Math.hypot(x1 + dx * t - lobe.x, z1 + dz * t - lobe.z);
      if (closestDistance >= lobe.radius) continue;
      const edgeDepth = clamp((lobe.radius - closestDistance) / (lobe.radius * .7), 0, 1);
      const pocketDensity = (.12 + .88 * smoothAction(edgeDepth)) * lobe.density;
      strongest = Math.max(strongest, pocketDensity * lifeStrength);
    }
  }
  return strongest;
}

function smokeVisibilityAlongSegment(x1, z1, x2, z2) {
  return 1 - .94 * smokeDensityAlongSegment(x1, z1, x2, z2);
}

function smokeBlocksSegment(x1, z1, x2, z2) {
  return smokeDensityAlongSegment(x1, z1, x2, z2) > .42;
}

function updateSmokeFade(root, current, target, dt) {
  const speed = target < current ? 5.2 : 11;
  const nextOpacity = current + (target - current) * Math.min(1, dt * speed);
  const opacity = target >= .999 && nextOpacity > .985 ? 1 : nextOpacity;
  const smokeObscured = opacity < .999;
  if (root) root.userData.smokeObscured = smokeObscured;
  const cover = root?.userData?.pixelCover;
  if (cover) {
    if (cover.material.transparent !== smokeObscured) cover.material.needsUpdate = true;
    cover.material.opacity = smokeObscured ? opacity : 1;
    cover.material.transparent = smokeObscured;
    cover.material.depthWrite = !smokeObscured;
  }
  if (root?.userData?.voxelOperator) {
    for (const material of Object.values(root.userData.materials || {})) {
      const transparent = smokeObscured;
      if (material.transparent !== transparent) material.needsUpdate = true;
      material.transparent = transparent;
      material.opacity = transparent ? opacity : 1;
      material.depthWrite = !transparent;
    }
    if (root.userData.pixelSkinMaterial) {
      root.userData.pixelSkinMaterial.opacity = (root.userData.pixelSkinMaterial.userData.baseOpacity ?? 1) * opacity;
      root.userData.pixelSkinMaterial.transparent = true;
      root.userData.pixelSkinMaterial.depthWrite = false;
    }
    if (root.userData.edgeMaterial) root.userData.edgeMaterial.opacity = .72 * opacity;
  }
  if (root?.userData?.enemy3D) {
    for (const material of root.userData.visualMaterials || []) {
      if (material.transparent !== smokeObscured) material.needsUpdate = true;
      material.transparent = smokeObscured;
      material.opacity = smokeObscured ? opacity : 1;
      material.depthWrite = !smokeObscured;
    }
    for (const material of root.userData.outlineMaterials || []) {
      if (material.transparent !== smokeObscured) material.needsUpdate = true;
      material.transparent = smokeObscured;
      material.opacity = smokeObscured ? opacity * .82 : 1;
      material.depthWrite = !smokeObscured;
    }
  }
  return opacity;
}

function lineBlocked(x1, z1, y1, x2, z2, y2) {
  if (solidLineBlocked(x1, z1, y1, x2, z2, y2)) return true;
  return smokeBlocksSegment(x1, z1, x2, z2);
}

function setRoomStatus(text, kind = "") {
  ui.roomStatus.textContent = text;
  ui.roomStatus.className = `room-status${kind ? ` ${kind}` : ""}`;
}

async function roomRequest(pathname, body, options = {}) {
  const response = await fetch(pathname, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: options.signal
  });
  const data = await response.json().catch(() => ({ ok: false, error: `HTTP_${response.status}` }));
  if (!response.ok || !data.ok) throw new Error(data.error || `HTTP_${response.status}`);
  return data;
}

async function checkRoomServer() {
  try {
    const response = await fetch("/api/info", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || data.game !== "EXFIL ZERO" || !data.multiplayer) throw new Error("WRONG_SERVER");
    if (state === "menu") setRoomStatus("MULTIPLAYER READY // CO-OP + 1V1 ROOM CODES ONLINE", "ready");
    return true;
  } catch (error) {
    if (state === "menu") setRoomStatus("MULTIPLAYER LINK OFFLINE // OPEN THE CURRENT DMZ GAME LINK", "error");
    return false;
  }
}

function clearNetwork() {
  network.session++;
  network.stream?.close();
  network.stream = null;
  network.streamConnected = false;
  network.active = false;
  network.role = "solo";
  network.code = "";
  network.token = "";
  network.slot = 0;
  network.peerConnected = false;
  network.remote = null;
  network.outgoing = [];
  network.syncing = false;
  network.syncInFlight = 0;
  network.syncTimer = 0;
  network.syncSeq = 0;
  network.worldWave = 0;
  network.worldSeq = 0;
  network.status = "offline";
  network.mode = "coop";
  network.duelScores = [0, 0];
  network.duelFinished = false;
  network.eventSeq = 0;
  network.lastRevision = 0;
  network.lastPeerSeq = 0;
  network.sentSample = null;
  network.rtt = 0;
  if (remoteOperator) remoteOperator.visible = false;
  if (remoteShadow) remoteShadow.visible = false;
  ui.coopStatus.classList.add("hidden");
  ui.operatorName.textContent = "VANGUARD-6";
}

function leaveNetwork() {
  if (network.active && network.code && network.token) {
    const payload = JSON.stringify({ code: network.code, token: network.token });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/room/leave", new Blob([payload], { type: "application/json" }));
    else fetch("/api/room/leave", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
  }
  clearNetwork();
}

function activateNetworkRoom(data, role) {
  network.session++;
  network.active = true;
  network.role = role;
  network.code = data.code;
  network.token = data.token;
  network.slot = data.slot;
  network.mode = data.mode === "duel" ? "duel" : "coop";
  network.duelScores = Array.isArray(data.scores) ? data.scores.slice(0, 2) : [0, 0];
  network.duelFinished = false;
  network.eventSeq = 0;
  network.syncSeq = 0;
  network.syncInFlight = 0;
  network.lastRevision = 0;
  network.lastPeerSeq = 0;
  network.worldSeq = 0;
  network.sentSample = null;
  network.status = "waiting";
  network.syncTimer = 0;
  const label = network.mode === "duel" ? "1V1" : "CO-OP";
  setRoomStatus(`${label} ROOM ${data.code} // ${role === "host" ? "SHARE THIS CODE WITH PLAYER 2" : "JOINED AS PLAYER 2"}`, "ready");
  startGame("online");
  connectNetworkStream();
  toast(`${label} ROOM ${data.code} // ${role === "host" ? "WAITING FOR PLAYER 2" : "CONNECTED"}`);
}

async function createCoopRoom() {
  ui.hostCoop.disabled = true;
  setRoomStatus("CREATING CO-OP ROOM...");
  try {
    const data = await roomRequest("/api/room/create", { mode: "coop" });
    activateNetworkRoom(data, "host");
  } catch (error) {
    setRoomStatus(error.message === "HTTP_404" ? "WRONG GAME LINK // OPEN THE CURRENT DMZ LINK" : "CO-OP SERVER OFFLINE // START WITH: node server.cjs", "error");
  } finally {
    ui.hostCoop.disabled = false;
  }
}

async function createDuelRoom() {
  ui.hostDuel.disabled = true;
  setRoomStatus("CREATING 1V1 ROOM...");
  try {
    const data = await roomRequest("/api/room/create", { mode: "duel" });
    activateNetworkRoom(data, "host");
  } catch (error) {
    setRoomStatus(error.message === "HTTP_404" ? "WRONG GAME LINK // OPEN THE CURRENT DMZ LINK" : "1V1 SERVER OFFLINE // START WITH: node server.cjs", "error");
  } finally {
    ui.hostDuel.disabled = false;
  }
}

async function joinCoopRoom() {
  const code = ui.roomCode.value.trim().toUpperCase();
  if (code.length !== 5) { setRoomStatus("ENTER THE 5-CHARACTER ROOM CODE", "error"); return; }
  ui.joinCoop.disabled = true;
  setRoomStatus(`JOINING ROOM ${code}...`);
  try {
    const data = await roomRequest("/api/room/join", { code });
    activateNetworkRoom(data, "guest");
  } catch (error) {
    const message = error.message === "ROOM_FULL" ? "ROOM ALREADY HAS TWO PLAYERS" : error.message === "ROOM_NOT_FOUND" ? "ROOM CODE NOT FOUND" : "MULTIPLAYER SERVER OFFLINE";
    setRoomStatus(message, "error");
  } finally {
    ui.joinCoop.disabled = false;
  }
}

function queueNetworkEvent(event) {
  if (!network.active) return;
  network.outgoing.push({ ...event, id: `${network.slot}-${Date.now().toString(36)}-${(++network.eventSeq).toString(36)}` });
  if (network.outgoing.length > 40) network.outgoing.splice(0, network.outgoing.length - 40);
  network.syncTimer = 0;
}

function playerNetworkState() {
  const now = performance.now();
  const previous = network.sentSample;
  const elapsed = previous ? (now - previous.at) / 1000 : 0;
  const vx = elapsed > .005 && elapsed < .3 ? clamp((player.x - previous.x) / elapsed, -6, 6) : 0;
  const vz = elapsed > .005 && elapsed < .3 ? clamp((player.z - previous.z) / elapsed, -6, 6) : 0;
  network.sentSample = { x: player.x, z: player.z, at: now };
  return {
    x: player.x, z: player.z, y: player.y, eyeHeight: player.eyeHeight,
    vx, vz, vy: player.vy,
    yaw: player.yaw, pitch: player.pitch, stance: player.stance,
    hp: player.hp, armor: player.armor, mag: player.mag, kills: player.kills
  };
}

function hostWorldState() {
  return {
    wave, waveDelay, score,
    enemies: enemies.map((enemy) => ({
      id: enemy.id, kind: enemy.kind, x: enemy.x, z: enemy.z,
      hp: enemy.hp, maxHp: enemy.maxHp, dead: enemy.dead,
      yaw: enemy.yaw, action: enemy.action
    }))
  };
}

function applyHostWorld(world) {
  if (!world || !Array.isArray(world.enemies)) return;
  const changedWave = network.worldWave !== world.wave;
  if (changedWave) {
    const hadWave = network.worldWave > 0;
    clearEnemies();
    for (const data of world.enemies) enemies.push(makeEnemy(data.x, data.z, data.kind, data.id));
    network.worldWave = world.wave;
    if (hadWave) {
      player.reserve = Math.min(240, player.reserve + 45);
      player.smokes = Math.min(3, player.smokes + 1);
      player.grenades = Math.min(3, player.grenades + 1);
      player.armor = Math.min(100, player.armor + 15);
      player.hp = Math.min(100, player.hp + 10);
    }
  }
  const byId = new Map(enemies.map((enemy) => [enemy.id, enemy]));
  for (const data of world.enemies) {
    let enemy = byId.get(data.id);
    if (!enemy || enemy.kind !== data.kind) {
      if (enemy) { scene.remove(enemy.sprite); disposeVoxelObject(enemy.sprite); enemies.splice(enemies.indexOf(enemy), 1); }
      enemy = makeEnemy(data.x, data.z, data.kind, data.id);
      enemies.push(enemy);
    }
    enemy.x += (data.x - enemy.x) * .72;
    enemy.z += (data.z - enemy.z) * .72;
    enemy.hp = data.hp;
    enemy.maxHp = data.maxHp;
    enemy.dead = Boolean(data.dead);
    enemy.yaw = Number(data.yaw) || 0;
    enemy.action = ["walk", "aim", "fire"].includes(data.action) ? data.action : "idle";
    enemy.sprite.visible = !enemy.dead;
    enemy.sprite.position.set(enemy.x, 0, enemy.z);
  }
  const validIds = new Set(world.enemies.map((enemy) => enemy.id));
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (validIds.has(enemies[i].id)) continue;
    scene.remove(enemies[i].sprite);
    disposeVoxelObject(enemies[i].sprite);
    enemies.splice(i, 1);
  }
  wave = world.wave;
  waveDelay = world.waveDelay;
  score = world.score;
}

function processNetworkEvents(events) {
  for (const event of events || []) {
    if (event.type === "enemyDamage" && network.role === "host") {
      const enemy = enemies.find((item) => item.id === event.enemyId && !item.dead);
      if (!enemy) continue;
      enemy.hp -= clamp(Number(event.damage) || 0, 0, 150);
      enemy.hit = .14;
      if (enemy.hp <= 0) killEnemy(enemy);
    } else if (event.type === "takeDamage") {
      damagePlayer(clamp(Number(event.amount) || 0, 0, 40));
    } else if (event.type === "playerHit" && network.mode === "duel") {
      damagePlayer(clamp(Number(event.damage) || 0, 0, 150));
    } else if (event.type === "smoke") {
      deploySmoke(clamp(Number(event.x) || 1, 1, MAP_W - 1), clamp(Number(event.z) || 1, 1, MAP_H - 1), false);
    }
  }
}

function applyNetworkPayload(data) {
  if (!data?.ok || !network.active) return;
  const revision = Math.max(0, Number(data.revision) || 0);
  if (revision >= network.lastRevision) {
    network.lastRevision = revision;
    network.peerConnected = Boolean(data.peerConnected);
    network.mode = data.mode === "duel" ? "duel" : "coop";
    network.status = network.peerConnected ? "connected" : "waiting";
    if (!network.peerConnected) {
      network.remote = null;
      network.lastPeerSeq = 0;
    }
  }

  const peerSeq = Math.max(0, Number(data.peerSeq) || 0);
  if (data.peerState && (peerSeq > network.lastPeerSeq || !network.remote)) {
    const hadRemote = Boolean(network.remote);
    const serverAt = Number(data.peerState.serverAt) || Number(data.serverTime) || Date.now();
    const ageAtReceive = clamp(((Number(data.serverTime) || serverAt) - serverAt) / 1000, 0, .18);
    network.remote = {
      ...data.peerState,
      _receivedAt: performance.now(),
      _ageAtReceive: ageAtReceive
    };
    network.lastPeerSeq = peerSeq;
    if (!hadRemote && remoteOperator) remoteOperator.position.set(network.remote.x, network.remote.y || 0, network.remote.z);
  }

  const worldSeq = Math.max(0, Number(data.worldSeq) || 0);
  if (network.mode === "coop" && network.role === "guest" && data.world && worldSeq > network.worldSeq) {
    network.worldSeq = worldSeq;
    applyHostWorld(data.world);
  }
  processNetworkEvents(data.events);

  if (network.mode === "duel" && Array.isArray(data.scores)) {
    const oldScores = network.duelScores;
    network.duelScores = [
      Math.max(oldScores[0], Number(data.scores[0]) || 0),
      Math.max(oldScores[1], Number(data.scores[1]) || 0)
    ];
    if (network.duelScores[0] !== oldScores[0] || network.duelScores[1] !== oldScores[1]) {
      toast(`ROUND SCORED // P1 ${network.duelScores[0]} - ${network.duelScores[1]} P2`);
    }
    const winner = network.duelScores.findIndex((value) => value >= 5);
    if (winner >= 0) finishDuel(winner);
  }
}

function connectNetworkStream() {
  network.stream?.close();
  network.stream = null;
  network.streamConnected = false;
  if (!network.active || typeof EventSource === "undefined") return;
  const roomCode = network.code;
  const roomToken = network.token;
  const source = new EventSource(`/api/room/events?code=${encodeURIComponent(roomCode)}&token=${encodeURIComponent(roomToken)}`);
  network.stream = source;
  source.onopen = () => {
    if (!network.active || network.code !== roomCode || network.token !== roomToken) return source.close();
    network.streamConnected = true;
  };
  source.onmessage = (event) => {
    if (!network.active || network.code !== roomCode || network.token !== roomToken) return;
    try { applyNetworkPayload(JSON.parse(event.data)); }
    catch (error) { console.warn("Ignored malformed multiplayer update"); }
  };
  source.onerror = () => {
    if (network.stream !== source) return;
    network.streamConnected = false;
    if (network.status === "connected") network.status = "reconnecting";
  };
}

async function syncNetwork() {
  if (!network.active || network.syncInFlight >= 4 || !player || state !== "playing") return;
  const session = network.session;
  network.syncInFlight++;
  network.syncing = true;
  const seq = ++network.syncSeq;
  const events = network.outgoing.splice(0, network.outgoing.length);
  const startedAt = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const data = await roomRequest("/api/room/sync", {
      code: network.code,
      token: network.token,
      seq,
      state: playerNetworkState(),
      events,
      world: network.mode === "coop" && network.role === "host" ? hostWorldState() : undefined
    }, { signal: controller.signal });
    if (network.session !== session) return;
    const roundTrip = performance.now() - startedAt;
    network.rtt += (roundTrip - network.rtt) * (network.rtt ? .18 : 1);
    applyNetworkPayload(data);
  } catch (error) {
    if (network.session !== session) return;
    network.outgoing.unshift(...events);
    if (!network.streamConnected) network.status = "reconnecting";
  } finally {
    clearTimeout(timeout);
    if (network.session !== session) return;
    network.syncInFlight = Math.max(0, network.syncInFlight - 1);
    network.syncing = network.syncInFlight > 0;
  }
}

function updateNetwork(dt) {
  if (!network.active) return;
  network.syncTimer -= dt;
  if (network.syncTimer <= 0) {
    network.syncTimer = .033;
    syncNetwork();
  }
  const connected = network.peerConnected && network.remote;
  remoteOperator.visible = Boolean(connected);
  remoteShadow.visible = Boolean(connected);
  if (connected) {
    const remote = network.remote;
    const operatorTeam = network.mode === "duel" ? "rival" : "coop";
    if (remoteOperator.userData.team !== operatorTeam) {
      setVoxelOperatorTeam(remoteOperator, operatorTeam);
    }
    const predictionTime = clamp(
      (Number(remote._ageAtReceive) || 0) + (performance.now() - (Number(remote._receivedAt) || performance.now())) / 1000 + network.rtt / 2000,
      0,
      .16
    );
    const targetX = clamp((Number(remote.x) || 0) + (Number(remote.vx) || 0) * predictionTime, 1, MAP_W - 1);
    const targetZ = clamp((Number(remote.z) || 0) + (Number(remote.vz) || 0) * predictionTime, 1, MAP_H - 1);
    const targetY = (Number(remote.y) || 0) + (Number(remote.vy) || 0) * predictionTime + (remote.stance === "prone" ? .16 : 0);
    const snapRemote = Math.hypot(targetX - remoteOperator.position.x, targetZ - remoteOperator.position.z) > 3;
    const remoteBlend = snapRemote ? 1 : Math.min(1, dt * 22);
    remoteOperator.position.x += (targetX - remoteOperator.position.x) * remoteBlend;
    remoteOperator.position.y += (targetY - remoteOperator.position.y) * remoteBlend;
    remoteOperator.position.z += (targetZ - remoteOperator.position.z) * remoteBlend;
    const stanceScaleY = remote.stance === "crouch" ? .56 : .8;
    remoteOperator.scale.set(.8, stanceScaleY, .8);
    remoteOperator.rotation.set(remote.stance === "prone" ? -Math.PI / 2 : 0, (Number(remote.yaw) || 0) + Math.PI, 0);
    const rivalSmokeTarget = network.mode === "duel" ? smokeVisibilityAlongSegment(player.x, player.z, targetX, targetZ) : 1;
    remoteOperator.userData.smokeVisibility = updateSmokeFade(
      remoteOperator,
      remoteOperator.userData.smokeVisibility ?? 1,
      rivalSmokeTarget,
      dt
    );
    const ground = groundHeightAt(remoteOperator.position.x, remoteOperator.position.z);
    const air = Math.max(0, (Number(remote.y) || 0) - ground);
    const shadowScale = Math.max(.55, 1 - air * .22) * (remote.stance === "prone" ? 1.25 : 1);
    remoteShadow.position.set(remoteOperator.position.x, ground + .024, remoteOperator.position.z);
    remoteShadow.scale.set(shadowScale, shadowScale * (remote.stance === "prone" ? .62 : 1), 1);
    remoteShadow.material.opacity = Math.max(.14, .36 - air * .08);
  }
  networkHudTimer -= dt;
  if (networkHudTimer <= 0) {
    networkHudTimer = .1;
    ui.coopStatus.classList.remove("hidden");
    ui.coopStatus.classList.toggle("waiting", !network.peerConnected);
    const teammate = network.slot === 0 ? "P2" : "P1";
    const peerText = network.peerConnected ? `${network.mode === "duel" ? "RIVAL" : `2 PLAYERS CONNECTED // ${teammate}`} ${Math.max(0, Math.ceil(network.remote?.hp || 0))} HP` : network.status === "reconnecting" ? "RECONNECTING" : "WAITING FOR PLAYER 2";
    const modeText = network.mode === "duel" ? `1V1 // P1 ${network.duelScores[0]} - ${network.duelScores[1]} P2` : "CO-OP";
    ui.coopStatus.textContent = `${modeText} // ROOM ${network.code} // ${peerText}`;
  }
}

function projectileHitsSolid(projectile) {
  return pointHitsSolid(projectile.x, projectile.y, projectile.z);
}

function projectileFiringRangeTarget(projectile) {
  if (!(playMode === "range" || playerInsideFiringRange())) return null;
  for (const target of firingRangeTargets) {
    if (target.dead || projectile.hitTargets?.has(target.lane) || !target.root.visible) continue;
    const hitCenterY = target.root.position.y - .1;
    if (Math.abs(projectile.x - target.root.position.x) > target.width * .55) continue;
    if (Math.abs(projectile.y - hitCenterY) > target.height * .55) continue;
    if (Math.abs(projectile.z - target.root.position.z) > .42) continue;
    return target;
  }
  return null;
}

function showRangeOrdnanceHit(target, result, source) {
  hitmarkKill = result.killed;
  hitmarkTimer = result.killed ? .28 : .14;
  hitZoneTimer = result.killed ? .72 : .5;
  const hitSound = result.killed ? "killShot" : "hit";
  lastHit = { zone: "range", damage: result.damage, multiplier: 1, kill: result.killed, sound: hitSound, range: true, lane: target.lane, source };
  ui.hitZone.textContent = result.killed ? `LANE ${target.lane} DUMMY DOWN` : `${source.toUpperCase()} HIT // ${result.damage} DMG // ${target.hp} HP`;
  ui.hitZone.className = `hit-zone show body${result.killed ? " kill" : ""}`;
  sfx(hitSound);
  rumble(result.killed ? .16 : .08, result.killed ? .35 : .18, result.killed ? 85 : 45);
  if (result.killed) toast(`LANE ${target.lane} DUMMY DOWN // RESPAWN ${FIRING_RANGE_RESPAWN_SECONDS.toFixed(1)}S`);
}

function pointHitsSolid(x, y, z) {
  return someNearbyCollider(x, z, .04, (collider) => (
    x > collider.minX - .04 && x < collider.maxX + .04 &&
    z > collider.minZ - .04 && z < collider.maxZ + .04 &&
    y < collider.top + .04
  ));
}

function throwLaunch(kind) {
  const forwardX = -Math.sin(player.yaw), forwardZ = -Math.cos(player.yaw);
  const rightX = Math.cos(player.yaw), rightZ = -Math.sin(player.yaw);
  const downwardAim = Math.max(0, -player.pitch);
  const lookY = Math.sin(player.pitch);
  const distanceScale = clamp(1 + downwardAim * .9, 1, 1.9);
  const horizontalAim = Math.max(.22, Math.cos(player.pitch));
  const arcAssist = clamp(1 - downwardAim * 100, 0, 1);
  if (kind === "smoke") {
    const launchSpeed = SMOKE_THROW_PHYSICS.speed * distanceScale;
    return {
      kind,
      x: player.x + forwardX * .34 + rightX * .22,
      y: player.y + player.eyeHeight - .11,
      z: player.z + forwardZ * .34 + rightZ * .22,
      vx: forwardX * launchSpeed * horizontalAim,
      vy: SMOKE_THROW_PHYSICS.lift * arcAssist + lookY * launchSpeed,
      vz: forwardZ * launchSpeed * horizontalAim,
      fuse: SMOKE_THROW_PHYSICS.fuse
    };
  }
  const launchSpeed = 12 * distanceScale;
  return {
    kind,
    x: player.x + forwardX * .34 + rightX * .22,
    y: player.y + player.eyeHeight - .11,
    z: player.z + forwardZ * .34 + rightZ * .22,
    vx: forwardX * launchSpeed * horizontalAim,
    vy: 3.4 * arcAssist + lookY * launchSpeed,
    vz: forwardZ * launchSpeed * horizontalAim,
    fuse: kind === "smoke" ? 1.58 : 1.82
  };
}

function calculateThrowPath(kind) {
  const launch = throwLaunch(kind);
  const point = { ...launch };
  const points = [new THREE.Vector3(point.x, point.y, point.z)];
  const step = .033;
  for (let time = step; time <= launch.fuse + .001 && points.length < throwPreview.markers.length; time += step) {
    const oldX = point.x, oldY = point.y, oldZ = point.z;
    point.vy -= 8.4 * step;
    point.x += point.vx * step;
    point.y += point.vy * step;
    point.z += point.vz * step;
    if (pointHitsSolid(point.x, point.y, point.z)) {
      point.x = oldX; point.y = oldY; point.z = oldZ;
      point.vx *= -.34; point.vz *= -.34;
      point.vy = Math.abs(point.vy) * .32;
    }
    const ground = groundHeightAt(point.x, point.z) + .1;
    if (point.y <= ground) {
      point.y = ground;
      point.vy = Math.abs(point.vy) > .55 ? Math.abs(point.vy) * .34 : 0;
      const drag = point.kind === "smoke" ? SMOKE_THROW_PHYSICS.groundDrag : Math.pow(THROW_GROUND_DRAG, step);
      point.vx *= drag; point.vz *= drag;
    }
    points.push(new THREE.Vector3(point.x, point.y, point.z));
  }
  return { points, end: points[points.length - 1] };
}

function hideThrowPreview() {
  if (!throwPreview) return;
  throwPreview.kind = null;
  throwPreview.end = null;
  throwPreview.markerCount = 0;
  throwPreview.markers.forEach((marker) => { marker.visible = false; });
  throwPreview.target.visible = false;
}

function updateThrowPreview() {
  const kind = input.padSmoke || input.keys.has("KeyV") ? "smoke" : input.padFrag || input.keys.has("KeyG") ? "frag" : null;
  const stock = kind === "smoke" ? player.smokes : kind === "frag" ? player.grenades : 0;
  if (!kind || stock <= 0 || player.throwCd > 0 || weaponActionBusy() || state !== "playing") { hideThrowPreview(); return; }
  const path = calculateThrowPath(kind);
  const color = kind === "smoke" ? 0x75e0d4 : 0xe9b84d;
  throwPreview.material.color.setHex(color);
  throwPreview.target.material.color.setHex(color);
  throwPreview.kind = kind;
  throwPreview.end = { x: path.end.x, y: path.end.y, z: path.end.z };
  const visiblePoints = path.points.slice(1);
  throwPreview.markerCount = visiblePoints.length;
  throwPreview.markers.forEach((marker, index) => {
    marker.visible = index < visiblePoints.length;
    if (marker.visible) marker.position.copy(visiblePoints[index]);
  });
  throwPreview.target.position.set(path.end.x, groundHeightAt(path.end.x, path.end.z) + .025, path.end.z);
  throwPreview.target.visible = true;
}

function throwOrdnance(kind) {
  if (!player || state !== "playing" || player.throwCd > 0 || player.reloading > 0 || weaponActionBusy() || !["smoke", "frag"].includes(kind)) return false;
  const stock = kind === "smoke" ? "smokes" : "grenades";
  if (player[stock] <= 0) { sfx("empty"); toast(`${kind.toUpperCase()} STOCK EMPTY`, true); return false; }
  player[stock]--;
  player.throwCd = WEAPON_ACTION_DURATIONS[kind];
  beginWeaponAction(kind);
  hideThrowPreview();
  return true;
}

function launchOrdnance(kind) {
  const sprite = createVoxelThrowable(kind);
  hideVoxelSurface(sprite);
  addPixelCover(sprite, kind === "smoke" ? textures.smokeGrenade : textures.fragGrenade, .3, .3, [0, 0, .03], { renderOrder: 25, name: "OriginalThrowablePixelCover" });
  const launch = throwLaunch(kind);
  const { x, y, z } = launch;
  sprite.position.set(x, y, z);
  scene.add(sprite);
  projectiles.push({
    kind, sprite, x, y, z,
    vx: launch.vx, vy: launch.vy, vz: launch.vz, fuse: launch.fuse,
    spin: (Math.random() > .5 ? 1 : -1) * (7 + Math.random() * 4),
    visualSpin: 0, bouncePulse: 0, hitTargets: new Set()
  });
  sfx("throw");
  rumble(.08, .14, 80);
}

function deploySmoke(x, z, relay = true) {
  const baseY = groundHeightAt(x, z);
  const lobes = SMOKE_LOBE_LAYOUT.map((lobe) => ({
    x: x + lobe.x,
    z: z + lobe.z,
    radius: lobe.radius,
    density: lobe.density
  }));
  const sprites = SMOKE_LOBE_LAYOUT.map((lobe) => {
    const material = lockSpriteToPixelGrid(new THREE.SpriteMaterial({
      map: textures.smokeCloud, transparent: true, opacity: 0, alphaTest: .025,
      depthTest: true, depthWrite: false, fog: true, rotation: lobe.rotation
    }));
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x + lobe.x, baseY + lobe.height * .42, z + lobe.z);
    sprite.scale.set(lobe.width, lobe.height, 1);
    sprite.userData.smokeOpacity = lobe.opacity;
    sprite.renderOrder = 18;
    scene.add(sprite);
    return sprite;
  });
  smokeClouds.push({ x, z, radius: 2.35, timer: 9, maxTimer: 9, sprites, lobes, pixelPhysics: "pocketed-original" });
  sfx("smoke");
  toast("SMOKE DEPLOYED // SIGHTLINES BLOCKED");
  rumble(.12, .2, 140);
  if (relay && network.active) queueNetworkEvent({ type: "smoke", x, z });
}

function explodeGrenade(x, y, z) {
  const radius = 3.4;
  let kills = 0;
  let rangeHits = 0;
  let rangeKills = 0;
  for (const enemy of enemies) {
    if (enemy.dead) continue;
    const d = Math.hypot(enemy.x - x, enemy.z - z);
    if (d > radius || solidLineBlocked(x, z, Math.max(.18, y), enemy.x, enemy.z, enemy.height * .52)) continue;
    const damage = Math.max(24, Math.round(125 * (1 - d / radius)));
    enemy.hp -= damage;
    if (network.active && network.role === "guest") queueNetworkEvent({ type: "enemyDamage", enemyId: enemy.id, damage });
    enemy.hit = .18;
    enemy.alert = 6;
    setVoxelEnemyHit(enemy.sprite, true);
    if (enemy.hp <= 0) {
      if (network.active && network.role === "guest") { enemy.dead = true; enemy.sprite.visible = false; }
      else killEnemy(enemy);
      kills++;
    }
  }
  if (playMode === "range" || playerInsideFiringRange()) {
    for (const target of firingRangeTargets) {
      if (target.dead || !target.root.visible) continue;
      const d = Math.hypot(target.root.position.x - x, target.root.position.z - z);
      if (d > radius) continue;
      const damage = Math.max(24, Math.round(125 * (1 - d / radius)));
      const result = damageFiringRangeTarget(target, damage, damage);
      if (!result.hit) continue;
      rangeHits++;
      if (result.killed) {
        kills++;
        rangeKills++;
      }
      lastHit = { zone: "range", damage: result.damage, multiplier: 1, kill: result.killed, sound: result.killed ? "killShot" : "hit", range: true, lane: target.lane, source: "frag blast" };
    }
  }
  if (network.mode === "duel" && network.peerConnected && network.remote?.hp > 0) {
    const d = Math.hypot(network.remote.x - x, network.remote.z - z);
    const remoteEye = (Number(network.remote.y) || 0) + (Number(network.remote.eyeHeight) || .56);
    if (d <= radius && !solidLineBlocked(x, z, Math.max(.18, y), network.remote.x, network.remote.z, remoteEye)) {
      const damage = Math.max(24, Math.round(125 * (1 - d / radius)));
      const killed = hitRemotePlayer(damage, { key: "body", label: "RIVAL BLAST", multiplier: 1 }, false);
      if (killed) kills++;
    }
  }
  if (kills > 0) {
    placeHitConfirm();
    hitmarkKill = true;
    hitmarkTimer = .3;
    toast(rangeKills > 0 ? `FRAG BLAST // ${rangeKills} ${rangeKills === 1 ? "DUMMY" : "DUMMIES"} DOWN` : `FRAG BLAST // ${kills} ${kills === 1 ? "HOSTILE" : "HOSTILES"} DOWN`);
  } else if (rangeHits > 0) {
    hitmarkKill = false;
    hitmarkTimer = .15;
    hitZoneTimer = .52;
    ui.hitZone.textContent = `FRAG BLAST // ${rangeHits} ${rangeHits === 1 ? "DUMMY" : "DUMMIES"} HIT`;
    ui.hitZone.className = "hit-zone show body";
  }

  const light = new THREE.PointLight(0xff963d, 9, 6, 2);
  light.position.set(x, Math.max(.3, y + .25), z);
  scene.add(light);
  const particles = [];
  const colors = [0xffd55d, 0xff8a36, 0xe74d2e, 0x6f6350];
  for (let i = 0; i < 16; i++) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(.06 + Math.random() * .09, .06 + Math.random() * .09, .06 + Math.random() * .09),
      new THREE.MeshBasicMaterial({ color: colors[i % colors.length] })
    );
    mesh.position.set(x, Math.max(.15, y), z);
    scene.add(mesh);
    const angle = i / 16 * Math.PI * 2 + Math.random() * .24;
    const speed = 2.1 + Math.random() * 3.2;
    particles.push({ mesh, vx: Math.cos(angle) * speed, vy: .7 + Math.random() * 3.1, vz: Math.sin(angle) * speed });
  }
  const burstLayout = [
    [0, 0, 2.8, 0, 0],
    [-.36, .06, 1.65, .07, -.1],
    [.34, .12, 1.55, .12, .09]
  ];
  const bursts = burstLayout.map(([ox, oz, scale, delay, rotation], index) => {
    const texture = textures.fragExplosion.clone();
    texture.repeat.set(.25, 1);
    texture.offset.set(0, 0);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    const material = lockSpriteToPixelGrid(new THREE.SpriteMaterial({
      map: texture, transparent: true, opacity: 0, alphaTest: .025,
      depthTest: true, depthWrite: false, fog: true, toneMapped: false, rotation
    }));
    const sprite = new THREE.Sprite(material);
    const baseY = Math.max(.25, y) + scale * .24 + index * .035;
    sprite.position.set(x + ox, baseY, z + oz);
    sprite.scale.setScalar(.01);
    sprite.renderOrder = 32 + index;
    sprite.visible = false;
    scene.add(sprite);
    return { sprite, texture, delay, life: .54 - index * .035, scale, baseY, rotation, frame: -1 };
  });
  blastEffects.push({ light, particles, bursts, timer: .7, maxTimer: .7, pixelAnimation: "chatgpt-frag-atlas-4-frame" });
  sfx("explosion");
  rumble(.5, .95, 310);
}

function removeProjectile(index) {
  const [projectile] = projectiles.splice(index, 1);
  scene.remove(projectile.sprite);
  disposeVoxelObject(projectile.sprite);
}

function updateOrdnance(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i];
    projectile.fuse -= dt;
    const oldX = projectile.x, oldY = projectile.y, oldZ = projectile.z;
    projectile.vy -= 8.4 * dt;
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.z += projectile.vz * dt;
    const directTarget = projectileFiringRangeTarget(projectile);
    if (directTarget) {
      projectile.hitTargets.add(directTarget.lane);
      const impactDamage = projectile.kind === "frag" ? 35 : 22;
      const result = damageFiringRangeTarget(directTarget, impactDamage, impactDamage);
      projectile.vx *= -.28;
      projectile.vy = Math.abs(projectile.vy) * .22 + .35;
      projectile.vz *= -.28;
      projectile.bouncePulse = 1;
      showRangeOrdnanceHit(directTarget, result, `${projectile.kind} impact`);
    }
    if (projectileHitsSolid(projectile)) {
      projectile.x = oldX; projectile.y = oldY; projectile.z = oldZ;
      projectile.vx *= -.34; projectile.vz *= -.34;
      projectile.vy = Math.abs(projectile.vy) * .32;
      projectile.bouncePulse = 1;
    }
    const ground = groundHeightAt(projectile.x, projectile.z) + .1;
    if (projectile.y < ground) {
      if (Math.abs(projectile.vy) > .55) projectile.bouncePulse = 1;
      projectile.y = ground;
      projectile.vy = Math.abs(projectile.vy) > .55 ? Math.abs(projectile.vy) * .34 : 0;
      const drag = projectile.kind === "smoke" ? SMOKE_THROW_PHYSICS.groundDrag : Math.pow(THROW_GROUND_DRAG, dt);
      projectile.vx *= drag; projectile.vz *= drag;
    }
    projectile.sprite.position.set(projectile.x, projectile.y, projectile.z);
    projectile.sprite.rotation.x += projectile.spin * dt;
    projectile.sprite.rotation.z += projectile.spin * .63 * dt;
    projectile.visualSpin += projectile.spin * dt;
    projectile.bouncePulse = Math.max(0, projectile.bouncePulse - dt * 6.5);
    facePixelCover(projectile.sprite);
    const projectileCover = projectile.sprite.userData.pixelCover;
    projectileCover.rotateZ(projectile.visualSpin);
    projectileCover.scale.set(1 + projectile.bouncePulse * .18, 1 - projectile.bouncePulse * .12, 1);
    const warningFlash = projectile.kind === "frag" && projectile.fuse < .46 && Math.floor(projectile.fuse * 18) % 2 === 0;
    projectileCover.material.color.setHex(warningFlash ? 0xff7a3c : 0xffffff);
    if (projectile.fuse <= 0) {
      if (projectile.kind === "smoke") deploySmoke(projectile.x, projectile.z);
      else explodeGrenade(projectile.x, projectile.y, projectile.z);
      removeProjectile(i);
    }
  }

  for (let i = smokeClouds.length - 1; i >= 0; i--) {
    const cloud = smokeClouds[i];
    cloud.timer -= dt;
    const age = cloud.maxTimer - cloud.timer;
    const opacity = .88 * Math.min(1, age * 2.8) * Math.min(1, cloud.timer / 1.35);
    cloud.sprites.forEach((sprite, index) => {
      sprite.material.opacity = opacity * (sprite.userData.smokeOpacity ?? (index === 0 ? 1 : .86));
      sprite.position.y += dt * (.008 + index * .0015);
    });
    if (cloud.timer <= 0) {
      for (const sprite of cloud.sprites) {
        scene.remove(sprite);
        sprite.material.dispose();
      }
      smokeClouds.splice(i, 1);
    }
  }

  for (let i = blastEffects.length - 1; i >= 0; i--) {
    const effect = blastEffects[i];
    effect.timer -= dt;
    const elapsed = effect.maxTimer - effect.timer;
    effect.light.intensity = 11 * Math.pow(Math.max(0, effect.timer / effect.maxTimer), 1.8);
    for (const burst of effect.bursts || []) {
      const localAge = elapsed - burst.delay;
      const progress = clamp(localAge / burst.life, 0, 1);
      burst.sprite.visible = localAge >= 0 && localAge < burst.life;
      if (!burst.sprite.visible) continue;
      const frame = Math.min(3, Math.floor(progress * 4));
      if (frame !== burst.frame) {
        burst.frame = frame;
        burst.texture.offset.x = frame * .25;
        burst.texture.needsUpdate = true;
      }
      burst.sprite.material.opacity = Math.min(1, localAge * 24) * Math.pow(1 - progress, .3);
      burst.sprite.material.rotation = burst.rotation + Math.sin(progress * Math.PI) * .035;
      const scale = burst.scale * (.74 + progress * .34);
      burst.sprite.scale.set(scale, scale, 1);
      burst.sprite.position.y = burst.baseY + progress * .18;
    }
    for (const particle of effect.particles) {
      particle.vy -= 8 * dt;
      particle.mesh.position.x += particle.vx * dt;
      particle.mesh.position.y += particle.vy * dt;
      particle.mesh.position.z += particle.vz * dt;
      particle.mesh.rotation.x += dt * 9;
      particle.mesh.rotation.z += dt * 7;
      particle.mesh.scale.setScalar(Math.max(.1, effect.timer / effect.maxTimer));
    }
    if (effect.timer <= 0) {
      scene.remove(effect.light);
      for (const particle of effect.particles) {
        scene.remove(particle.mesh);
        particle.mesh.geometry.dispose();
        particle.mesh.material.dispose();
      }
      for (const burst of effect.bursts || []) {
        scene.remove(burst.sprite);
        burst.sprite.material.dispose();
        burst.texture.dispose();
      }
      blastEffects.splice(i, 1);
    }
  }
}

function startGame(mode = "solo") {
  if (mode === "solo" || mode === "range") leaveNetwork();
  playMode = mode === "range" ? "range" : mode;
  resetRun();
  state = "playing";
  ui.menu.classList.add("hidden"); ui.pause.classList.add("hidden"); ui.result.classList.add("hidden");
  ui.hud.classList.remove("hidden");
  ui.operatorName.textContent = network.active ? (network.slot === 0 ? "VANGUARD-6 // P1" : "SPECTER-2 // P2") : "VANGUARD-6";
  ui.stageName.textContent = playMode === "range" ? "FIRING RANGE" : "IRON VEIL COMPLEX";
  ui.coopStatus.classList.toggle("hidden", !network.active);
  initAudio(); sfx("deploy");
  toast(playMode === "range" ? "FIRING RANGE // UNLIMITED AMMO // SIX STATIONARY 3D DUMMIES" : network.mode === "duel" ? "1V1 DUEL // FIRST TO 5" : "IRON VEIL COMPLEX // SURVIVE");
  canvas.focus();
  if (document.pointerLockElement !== canvas && activeGamepad < 0) requestGamePointerLock();
}

function showMenu() {
  leaveNetwork();
  playMode = "solo";
  state = "menu"; resetRun();
  ui.menu.classList.remove("hidden"); ui.pause.classList.add("hidden"); ui.result.classList.add("hidden");
  ui.hud.classList.add("hidden");
  input.mouseDown = false; input.mouseAim = false; input.padShoot = false; input.padAim = false; input.padSmoke = false; input.padFrag = false;
  hideThrowPreview();
  setRoomStatus("CO-OP OR 1V1 // TWO COMPUTERS // FULL SCREEN");
  checkRoomServer();
  document.exitPointerLock?.();
}

function requestGamePointerLock() {
  try {
    const request = canvas.requestPointerLock?.();
    if (request?.catch) request.catch(() => {});
  } catch (error) {
    // Controller play and the game itself continue if a browser blocks pointer lock.
  }
}

function togglePause(force) {
  if (state !== "playing" && state !== "paused") return;
  const pause = force === undefined ? state === "playing" : force;
  state = pause ? "paused" : "playing";
  ui.pause.classList.toggle("hidden", !pause);
  input.mouseDown = false; input.mouseAim = false; input.padShoot = false; input.padAim = false; input.padSmoke = false; input.padFrag = false;
  hideThrowPreview();
  if (pause) document.exitPointerLock?.();
}

function finish() {
  if (state !== "playing") return;
  state = "failure";
  input.mouseDown = false; input.mouseAim = false; input.padShoot = false; input.padAim = false;
  ui.hud.classList.add("hidden"); ui.result.classList.remove("hidden");
  ui.resultBox.className = "modal result-box failure";
  ui.resultKicker.textContent = "RUN OVER"; ui.resultTitle.textContent = "THE COMPLEX CLAIMED YOU";
  ui.resultCopy.textContent = `You reached wave ${wave}. Hit redeploy and beat the score.`;
  ui.resultCash.textContent = score.toLocaleString(); ui.resultKills.textContent = player.kills; ui.resultTime.textContent = wave;
  document.exitPointerLock?.(); sfx("fail"); rumble(.45, .8, 650);
}

function finishDuel(winnerSlot) {
  if (state !== "playing" || network.duelFinished) return;
  network.duelFinished = true;
  state = "failure";
  input.mouseDown = false; input.mouseAim = false; input.padShoot = false; input.padAim = false;
  ui.hud.classList.add("hidden"); ui.result.classList.remove("hidden");
  const won = winnerSlot === network.slot;
  ui.resultBox.className = `modal result-box ${won ? "success" : "failure"}`;
  ui.resultKicker.textContent = "1V1 COMPLETE";
  ui.resultTitle.textContent = won ? "DUEL WON" : "DUEL LOST";
  ui.resultCopy.textContent = `P1 ${network.duelScores[0]} - ${network.duelScores[1]} P2 // First to five takes the arena.`;
  ui.resultCash.textContent = `${network.duelScores[0]}-${network.duelScores[1]}`;
  ui.resultKills.textContent = player.kills;
  ui.resultTime.textContent = "1V1";
  document.exitPointerLock?.(); sfx(won ? "wave" : "fail"); rumble(.45, .8, 650);
}

function movementAxes() {
  let forward = (input.keys.has("KeyW") || input.keys.has("ArrowUp") ? 1 : 0) - (input.keys.has("KeyS") || input.keys.has("ArrowDown") ? 1 : 0) - input.padMoveY;
  let strafe = (input.keys.has("KeyD") || input.keys.has("ArrowRight") ? 1 : 0) - (input.keys.has("KeyA") || input.keys.has("ArrowLeft") ? 1 : 0) + input.padMoveX;
  const length = Math.hypot(forward, strafe);
  if (length > 1) { forward /= length; strafe /= length; }
  return { forward, strafe, length: Math.min(1, length) };
}

function jump() {
  if (state !== "playing" || !player.grounded || player.slideTimer > .06) return;
  if (player.stance !== "stand") setStance("stand");
  player.vy = 4.45; player.grounded = false; sfx("jump"); rumble(.08, .13, 70);
}

function setStance(next) {
  if (state !== "playing" || !player.grounded || !["stand", "crouch", "prone"].includes(next) || player.stance === next) return;
  player.slideTimer = 0;
  player.stance = next;
  sfx("stance"); rumble(.04, .07, 55);
}

function toggleCrouch() {
  if (!player) return;
  setStance(player.stance === "crouch" ? "stand" : "crouch");
}

function crouchOrSlide() {
  if (!player || state !== "playing") return false;
  const sprintHeld = input.padSprint || input.keys.has("ShiftLeft") || input.keys.has("ShiftRight");
  if (sprintHeld && movementAxes().length > .1 && player.stance === "stand" && player.grounded) {
    startSlide();
    return true;
  }
  toggleCrouch();
  return false;
}

function toggleProne() {
  if (!player) return;
  setStance(player.stance === "prone" ? "stand" : "prone");
}

function startSlide() {
  if (state !== "playing" || !player.grounded || player.slideTimer > 0 || player.stance !== "stand") return;
  const axes = movementAxes();
  const forward = axes.length > .1 ? axes.forward : 1;
  const strafe = axes.length > .1 ? axes.strafe : 0;
  const forwardX = -Math.sin(player.yaw), forwardZ = -Math.cos(player.yaw);
  const rightX = Math.cos(player.yaw), rightZ = -Math.sin(player.yaw);
  player.slideX = forwardX * forward + rightX * strafe;
  player.slideZ = forwardZ * forward + rightZ * strafe;
  const length = Math.hypot(player.slideX, player.slideZ) || 1;
  player.slideX /= length; player.slideZ /= length;
  player.slideTimer = .72; input.mouseAim = false; input.padAim = false;
  sfx("slide"); rumble(.1, .17, 100);
}

function updatePlayer(dt) {
  weaponHoldTime += dt;
  updateWeaponAction(dt);
  player.spawnShield = Math.max(0, (player.spawnShield || 0) - dt);
  const axes = movementAxes();
  const sprint = player.stance === "stand" && (input.keys.has("ShiftLeft") || input.keys.has("ShiftRight") || input.padSprint) && adsAmount < .15;
  if (player.slideTimer > 0) {
    const strength = 2.2 + player.slideTimer * 3.6;
    movePlayer(player.slideX * strength * dt, player.slideZ * strength * dt);
    player.slideTimer = Math.max(0, player.slideTimer - dt);
    weaponBob += dt * 17;
  } else {
    const stanceSpeed = player.stance === "crouch" ? .62 : player.stance === "prone" ? .3 : 1;
    const speed = (sprint ? 3.5 : 2.15) * stanceSpeed * (1 - adsAmount * .28);
    const forwardX = -Math.sin(player.yaw), forwardZ = -Math.cos(player.yaw);
    const rightX = Math.cos(player.yaw), rightZ = -Math.sin(player.yaw);
    movePlayer((forwardX * axes.forward + rightX * axes.strafe) * speed * dt, (forwardZ * axes.forward + rightZ * axes.strafe) * speed * dt);
    if (axes.length > .05) weaponBob += dt * (sprint ? 14 : player.stance === "prone" ? 4 : player.stance === "crouch" ? 6 : 9);
  }

  if (playMode === "range") {
    player.x = clamp(player.x, FIRING_RANGE_BOUNDS.minX + .22, FIRING_RANGE_BOUNDS.maxX - .22);
    player.z = clamp(player.z, FIRING_RANGE_BOUNDS.minZ + .18, FIRING_RANGE_BOUNDS.maxZ - .18);
  }

  const ground = groundHeightAt(player.x, player.z);
  if (player.grounded && ground < player.y - .04) player.grounded = false;
  if (!player.grounded) {
    player.vy -= 10.2 * dt;
    player.y += player.vy * dt;
    if (player.y <= ground && player.vy <= 0) {
      player.y = ground; player.vy = 0; player.grounded = true; sfx("land");
    }
  } else player.y = ground;

  const targetEye = player.slideTimer > 0 ? .31 : player.stance === "crouch" ? .37 : player.stance === "prone" ? .18 : .56;
  player.eyeHeight += (targetEye - player.eyeHeight) * Math.min(1, dt * 12);
  player.yaw -= input.padLookX * 2.25 * (1 - adsAmount * .52) * dt;
  player.pitch = clamp(player.pitch - input.padLookY * 1.7 * (1 - adsAmount * .45) * dt, -.82, .82);

  if (input.mouseDown || input.padShoot) shoot();
}

function updateCamera(dt = .016) {
  const axes = movementAxes();
  const moving = axes.length > .05 || player.slideTimer > 0;
  const sprinting = axes.length > .05 && player.stance === "stand" && player.grounded && player.slideTimer <= 0 && adsAmount < .15 && (input.keys.has("ShiftLeft") || input.keys.has("ShiftRight") || input.padSprint);
  sprintAmount += ((sprinting ? 1 : 0) - sprintAmount) * Math.min(1, dt * 10);
  camera.position.set(player.x, player.y + player.eyeHeight, player.z);
  camera.rotation.set(clamp(player.pitch + cameraKick, -.82, .86), player.yaw, 0);
  const nextFov = BASE_FOV + (ADS_FOV - BASE_FOV) * (adsAmount * adsAmount * (3 - 2 * adsAmount));
  if (Math.abs(camera.fov - nextFov) > .001) {
    camera.fov = nextFov;
    camera.updateProjectionMatrix();
  }

  if (!weaponSwayReady) {
    lastWeaponYaw = player.yaw;
    lastWeaponPitch = player.pitch;
    weaponSwayReady = true;
  }
  const yawDelta = Math.atan2(Math.sin(player.yaw - lastWeaponYaw), Math.cos(player.yaw - lastWeaponYaw));
  const pitchDelta = player.pitch - lastWeaponPitch;
  lastWeaponYaw = player.yaw;
  lastWeaponPitch = player.pitch;
  const freeAim = 1 - adsAmount * .78;
  const lookTargetX = clamp(-yawDelta * 1.2, -.032, .032) * freeAim;
  const lookTargetY = clamp(pitchDelta * .9, -.024, .024) * freeAim;
  const swayResponse = Math.min(1, dt * 15);
  weaponLookSwayX += (lookTargetX - weaponLookSwayX) * swayResponse;
  weaponLookSwayY += (lookTargetY - weaponLookSwayY) * swayResponse;

  // Give the block-built weapon deliberate, stepped swagger while its actual
  // geometry stays attached to the first-person camera.
  const stanceSway = player.stance === "prone" ? .46 : player.stance === "crouch" ? .75 : 1;
  const swayStrength = (moving ? 1 : .48) * stanceSway;
  const swayPhase = moving ? weaponBob : weaponHoldTime * 1.7;
  const swayX = snapStep(Math.sin(swayPhase * .75) * .03 * swayStrength, .004);
  const swayY = snapStep((moving ? Math.abs(Math.cos(swayPhase * 1.04)) - .5 : Math.sin(swayPhase * .96)) * .016 * swayStrength, .004);
  const swayDepth = snapStep(Math.sin(swayPhase * .68 + .8) * .012 * swayStrength, .004);
  const lookSwayX = snapStep(weaponLookSwayX, .002);
  const lookSwayY = snapStep(weaponLookSwayY, .002);
  const swayRoll = snapStep(-swayX * 1.55 - lookSwayX * .7, .004);
  const adsDriftX = snapStep((Math.sin(weaponHoldTime * 1.65) * .008 + lookSwayX * .24) * adsAmount, .0015);
  const adsDriftY = snapStep((Math.sin(weaponHoldTime * 1.25 + 1.1) * .0055 + lookSwayY * .22) * adsAmount, .0015);
  const adsDriftZ = snapStep(Math.sin(weaponHoldTime * .95 + .4) * .004 * adsAmount, .002);
  const recoil = weaponRecoil;
  const stanceDrop = player.stance === "crouch" ? .055 : player.stance === "prone" ? .09 : 0;
  const stanceTuck = player.stance === "crouch" ? -.016 : player.stance === "prone" ? -.035 : 0;
  const sprintStepX = snapStep(Math.sin(weaponBob * .62) * .024 * sprintAmount, .004);
  const sprintStepY = snapStep(Math.abs(Math.cos(weaponBob * 1.24)) * .018 * sprintAmount, .004);
  const sprintLift = .09 * sprintAmount + sprintStepY;
  const sprintShift = .035 * sprintAmount + sprintStepX;
  const sprintRoll = -.075 * sprintAmount + snapStep(Math.sin(weaponBob * .62) * .019 * sprintAmount, .004);
  weaponHip.position.set(.12 + stanceTuck + swayX + lookSwayX + recoil * .045 + sprintShift, -.44 + swayY + lookSwayY + recoil * .07 - stanceDrop - (player.slideTimer > 0 ? .08 : 0) + sprintLift, -.58 + swayDepth + recoil * .46 + .025 * sprintAmount);
  weaponAds.position.set(adsDriftX, adsDriftY, -.62 + adsDriftZ + recoil * .28);
  weaponHip.rotation.x = snapStep(-swayY * .6 - lookSwayY * .45, .004);
  weaponHip.rotation.y = snapStep(swayX * .48 + lookSwayX * .65, .004);
  weaponHip.rotation.z = swayRoll - recoil * .06 + sprintRoll;
  weaponAds.rotation.x = snapStep(-adsDriftY * .55, .0015);
  weaponAds.rotation.y = snapStep(adsDriftX * .72, .0015);
  weaponAds.rotation.z = snapStep(-adsDriftX * .7, .0015);

  const actionT = weaponAction.totalFrames > 1 ? weaponAction.frame / (weaponAction.totalFrames - 1) : 0;
  if (weaponAction.kind === "reload") {
    setActionSpriteFrame(reloadMagazine, weaponAction.artFrame);
    reloadGun.visible = true;
    lockActionArtToScreen(reloadGun, "reloadGun");
    const lowered = actionWindow(actionT, 0, .12, .88, 1);
    const charge = actionWindow(actionT, .78, .82, .9, .94);
    weaponHip.position.x -= .19 * lowered - .075 * charge;
    weaponHip.position.y -= .2 * lowered;
    weaponHip.position.z += .11 * lowered;
    weaponHip.rotation.x += .25 * lowered;
    weaponHip.rotation.y -= .18 * lowered;
    weaponHip.rotation.z += .42 * lowered - .12 * charge;
    reloadMagazine.visible = true;
    lockActionArtToScreen(reloadMagazine, "reload");
    throwHand.visible = false;
  } else if (weaponAction.kind === "smoke" || weaponAction.kind === "frag") {
    const stow = actionWindow(actionT, 0, .12, .86, 1);
    weaponHip.position.x += .22 * stow;
    weaponHip.position.y -= .36 * stow;
    weaponHip.position.z += .12 * stow;
    weaponHip.rotation.x += .2 * stow;
    weaponHip.rotation.z -= .38 * stow;
    reloadMagazine.visible = false;
    reloadGun.visible = false;
    throwHand.visible = true;
    heldThrowables.smoke.visible = weaponAction.kind === "smoke";
    heldThrowables.frag.visible = weaponAction.kind === "frag";
    heldThrowables.medkit.visible = false;
    setActionSpriteFrame(weaponAction.kind === "smoke" ? heldThrowables.smoke : heldThrowables.frag, weaponAction.artFrame);
    // The eight atlas drawings provide the throw motion. Keeping their parent
    // at a fixed camera-space anchor prevents the wrists from leaving the view.
    lockActionArtToScreen(throwHand, weaponAction.kind);
  } else if (weaponAction.kind === "medkit") {
    const raised = actionWindow(actionT, 0, .2, .78, 1);
    weaponHip.position.x += .24 * raised;
    weaponHip.position.y -= .38 * raised;
    weaponHip.position.z += .12 * raised;
    weaponHip.rotation.z -= .36 * raised;
    reloadMagazine.visible = false;
    reloadGun.visible = false;
    throwHand.visible = true;
    heldThrowables.smoke.visible = false;
    heldThrowables.frag.visible = false;
    heldThrowables.medkit.visible = true;
    setActionSpriteFrame(heldThrowables.medkit, weaponAction.artFrame);
    lockActionArtToScreen(throwHand, "medkit");
  } else {
    reloadMagazine.visible = false;
    reloadGun.visible = false;
    throwHand.visible = false;
  }
  const hipOpacity = weaponAction.kind === "reload" ? 0 : clamp(1 - adsAmount * 1.35, 0, 1);
  setVoxelOpacity(weaponHip, hipOpacity);
  const hipCover = weaponHip.userData.pixelCover;
  const normalOpacity = hipOpacity * (1 - sprintAmount);
  const sprintOpacity = hipOpacity * sprintAmount;
  hipCover.material.opacity = normalOpacity;
  hipCover.visible = normalOpacity > .01;
  weaponSprintCover.material.opacity = sprintOpacity;
  weaponSprintCover.visible = sprintOpacity > .01;
  setVoxelOpacity(weaponAds, weaponActionBusy() ? 0 : clamp(adsAmount * 1.35, 0, 1));
  muzzleLight.intensity = muzzleTime > 0 ? 5 : 0;
}

function hitZoneForHeight(normalizedHeight) {
  const height = clamp(normalizedHeight, 0, 1);
  if (height >= .72) return { key: "head", label: "HEADSHOT ×2", multiplier: 2, damage: BASE_DAMAGE * 2 };
  if (height < .32) return { key: "legs", label: "LEG HIT ×0.65", multiplier: .65, damage: Math.round(BASE_DAMAGE * .65) };
  return { key: "body", label: "BODY HIT ×1", multiplier: 1, damage: BASE_DAMAGE };
}

function placeHitConfirm(point = null) {
  const x = clamp(point?.x || 0, -1, 1);
  const y = clamp(point?.y || 0, -1, 1);
  hitmarkPoint.set(x, y);
  const left = (x + 1) * 50;
  const top = (1 - y) * 50;
  ui.hitmark.style.left = `${left}%`;
  ui.hitmark.style.top = `${top}%`;
  ui.hitZone.style.left = `${left}%`;
  ui.hitZone.style.top = `calc(${top}% + 28px)`;
}

function hitRemotePlayer(damage, zone, playConfirm = true) {
  if (network.mode !== "duel" || !network.peerConnected || !network.remote || network.remote.hp <= 0) return false;
  const remoteArmor = Math.max(0, Number(network.remote.armor) || 0);
  const absorbed = Math.min(remoteArmor, damage * .7);
  network.remote.armor = remoteArmor - absorbed;
  network.remote.hp = Math.max(0, (Number(network.remote.hp) || 0) - (damage - absorbed));
  const killed = network.remote.hp <= 0;
  queueNetworkEvent({ type: "playerHit", damage, zone: zone.key });
  placeHitConfirm(playConfirm ? shotPoint : null);
  hitmarkKill = killed;
  hitmarkTimer = killed ? .26 : .13;
  hitZoneTimer = killed ? .72 : .48;
  const hitSound = killed ? "killShot" : "hit";
  lastHit = { zone: zone.key, damage, multiplier: zone.multiplier, kill: killed, sound: hitSound, rival: true };
  ui.hitZone.textContent = `${zone.label} // ${damage} DMG`;
  ui.hitZone.className = `hit-zone show ${zone.key}${killed ? " kill" : ""}`;
  if (playConfirm) sfx(hitSound);
  rumble(killed ? .16 : .08, killed ? .35 : .18, killed ? 85 : 40);
  if (killed) player.kills++;
  return killed;
}

function shoot() {
  if (player.fireCd > 0 || player.reloading > 0 || weaponActionBusy()) return;
  if (player.mag <= 0) { player.fireCd = .2; sfx("empty"); return; }
  player.mag--; player.fireCd = .105; muzzleTime = .055;
  weaponRecoil = Math.min(.3, weaponRecoil + .12);
  cameraKick = Math.min(.06, cameraKick + (adsAmount > .5 ? .009 : .016));
  sfx("shot"); rumble(.13, .28, 60);
  shotPoint.set(0, 0);
  if (adsAmount > .45) {
    const adsCover = weaponAds.userData.pixelCover;
    adsAimWorldPosition.set(0, adsCover.userData.aimDotY || 0, 0);
    adsCover.localToWorld(adsAimWorldPosition);
    adsAimWorldPosition.project(camera);
    shotPoint.set(clamp(adsAimWorldPosition.x, -1, 1), clamp(adsAimWorldPosition.y, -1, 1));
  } else {
    const axes = movementAxes();
    const sprinting = player.stance === "stand" && (input.keys.has("ShiftLeft") || input.keys.has("ShiftRight") || input.padSprint) && axes.length > .1;
    let spread = .16 + axes.length * .07 + (sprinting ? .08 : 0) + (!player.grounded ? .06 : 0) + (player.slideTimer > 0 ? .06 : 0);
    if (player.stance === "crouch") spread -= .025;
    else if (player.stance === "prone") spread -= .045;
    spread = clamp(spread, .1, .34);
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * spread;
    shotPoint.set(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  raycaster.setFromCamera(shotPoint, camera);
  const enemyTargets = enemies.filter((enemy) => !enemy.dead).flatMap((enemy) => enemy.sprite.userData.hitMeshes);
  const duelTargets = network.mode === "duel" && network.peerConnected && network.remote?.hp > 0 ? remoteOperator.userData.hitMeshes : [];
  const hits = raycaster.intersectObjects([...solidMeshes, ...enemyTargets, ...duelTargets], false);
  const hit = hits.find((item) => item.distance > .12 && !item.object.userData.rangeTarget?.dead);
  if (hit?.object.userData.operatorRoot === remoteOperator) {
    const remote = network.remote;
    const stanceHeight = remote.stance === "prone" ? .36 : remote.stance === "crouch" ? .78 : 1.12;
    const operatorBottom = Number(remote.y) || 0;
    const zone = hitZoneForHeight((hit.point.y - operatorBottom) / stanceHeight);
    hitRemotePlayer(zone.damage, zone);
  } else if (hit?.object.userData.rangeTarget) {
    const target = hit.object.userData.rangeTarget;
    const localPoint = target.cover.worldToLocal(hit.point.clone());
    const chestDistance = Math.hypot(localPoint.x / (target.width * .5), (localPoint.y - .01) / (target.height * .5));
    const headDistance = Math.hypot(localPoint.x / (target.width * .5), (localPoint.y - .59) / (target.height * .5));
    const points = headDistance < .15 || chestDistance < .13 ? 100 : chestDistance < .3 ? 60 : chestDistance < .52 ? 30 : 10;
    const label = points === 100 ? "BULLSEYE" : points === 60 ? "INNER RING" : points === 30 ? "BODY RING" : "TARGET HIT";
    if (points === 100) firingRangeStats.bullseyes++;
    const targetKilled = damageFiringRangeTarget(target, points, points).killed;
    placeHitConfirm(shotPoint);
    hitmarkKill = targetKilled;
    hitmarkTimer = targetKilled ? .26 : .14;
    hitZoneTimer = targetKilled ? .72 : .52;
    const hitSound = targetKilled ? "killShot" : "hit";
    lastHit = { zone: "range", damage: points, multiplier: 1, kill: targetKilled, sound: hitSound, range: true, lane: target.lane };
    ui.hitZone.textContent = targetKilled ? `LANE ${target.lane} DUMMY DOWN` : `RANGE ${label} // ${points} PTS // ${target.hp} HP`;
    ui.hitZone.className = `hit-zone show body${targetKilled ? " kill" : ""}`;
    sfx(hitSound);
    rumble(targetKilled ? .16 : points === 100 ? .14 : .07, targetKilled ? .35 : points === 100 ? .28 : .14, targetKilled ? 85 : 55);
    if (targetKilled) toast(`LANE ${target.lane} DUMMY DOWN // RESPAWN ${FIRING_RANGE_RESPAWN_SECONDS.toFixed(1)}S`);
    else if (points === 100) toast(`LANE ${target.lane} BULLSEYE // ${firingRangeStats.score} TOTAL`);
  } else if (hit?.object.userData.enemy) {
    const enemy = hit.object.userData.enemy;
    const modelBottom = enemy.sprite.position.y;
    const normalizedHeight = (hit.point.y - modelBottom) / enemy.height;
    const zone = hitZoneForHeight(normalizedHeight);
    enemy.hp -= zone.damage; enemy.hit = .12; enemy.alert = 6;
    if (network.active && network.role === "guest") queueNetworkEvent({ type: "enemyDamage", enemyId: enemy.id, damage: zone.damage });
    placeHitConfirm(shotPoint);
    hitmarkKill = enemy.hp <= 0;
    hitmarkTimer = hitmarkKill ? .26 : .13;
    hitZoneTimer = hitmarkKill ? .72 : .48;
    const hitSound = hitmarkKill ? "killShot" : "hit";
    lastHit = { zone: zone.key, damage: zone.damage, multiplier: zone.multiplier, kill: hitmarkKill, sound: hitSound, normalizedHeight };
    ui.hitZone.textContent = `${zone.label} // ${zone.damage} DMG`;
    ui.hitZone.className = `hit-zone show ${zone.key}${hitmarkKill ? " kill" : ""}`;
    setVoxelEnemyHit(enemy.sprite, true);
    sfx(hitSound);
    rumble(hitmarkKill ? .16 : .08, hitmarkKill ? .35 : .18, hitmarkKill ? 85 : 40);
    if (enemy.hp <= 0) {
      if (network.active && network.role === "guest") { enemy.dead = true; enemy.sprite.visible = false; }
      else killEnemy(enemy);
    }
  }
  for (const enemy of enemies) if (!enemy.dead && distance(player, enemy) < 8) enemy.alert = 5;
}

function killEnemy(enemy) {
  enemy.dead = true; enemy.sprite.visible = false; player.kills++; player.streak++; streakTimer = 3.5;
  const base = enemy.kind === "heavy" ? 700 : enemy.kind === "raider" ? 425 : 300;
  const multiplier = 1 + Math.floor(player.streak / 4) * .25;
  const points = Math.floor(base * multiplier);
  score += points;
  if (Math.random() < .3) player.reserve = Math.min(240, player.reserve + 18);
  if (Math.random() < .1) player.meds = Math.min(3, player.meds + 1);
  toast(`${enemy.kind.toUpperCase()} DOWN // +${points}${multiplier > 1 ? ` x${multiplier.toFixed(2)}` : ""}`);
}

function presentEnemyAction(enemy, dt) {
  enemy.animTime += dt * clamp(.72 + enemy.moveSpeed * .5, .72, 1.45);
  const playerDistance = distance(player, enemy);
  const highDetailLimit = enemy.sprite.userData.highDetail ? ENEMY_HIGH_DETAIL_FAR : ENEMY_HIGH_DETAIL_NEAR;
  setVoxelEnemyHighDetail(enemy.sprite, playerDistance <= highDetailLimit);
  poseVoxelEnemy(enemy.sprite, enemy.action, enemy.animTime, enemy.moveSpeed, enemy.turnLean, enemy.firePose);
  enemy.sprite.rotation.y = enemy.yaw;
  const smokeTarget = smokeVisibilityAlongSegment(player.x, player.z, enemy.x, enemy.z);
  enemy.smokeVisibility = updateSmokeFade(enemy.sprite, enemy.smokeVisibility, smokeTarget, dt);
}

function updateSyncedEnemyPresentations(dt) {
  for (const enemy of enemies) {
    if (!enemy.dead) presentEnemyAction(enemy, dt);
  }
}

function updateEnemies(dt) {
  const localField = navigationFieldFor("local", player);
  const remoteAvailable = network.active && network.peerConnected && network.remote && network.remote.hp > 0;
  const remoteField = remoteAvailable ? navigationFieldFor("remote", network.remote) : null;
  for (const enemy of enemies) {
    if (enemy.dead) continue;
    enemy.fireCd -= dt; enemy.strafe += dt * (enemy.kind === "raider" ? 1.7 : 1);
    enemy.firePose = Math.max(0, enemy.firePose - dt);
    enemy.hit = Math.max(0, enemy.hit - dt);
    enemy.pathTimer -= dt;
    enemy.decisionTimer -= dt;
    enemy.pauseTimer = Math.max(0, enemy.pauseTimer - dt);
    setVoxelEnemyHit(enemy.sprite, enemy.hit > 0);
    const localTarget = { data: player, local: true, slot: "local" };
    let target = localTarget;
    if (remoteAvailable) {
      const remoteTarget = { data: network.remote, local: false, slot: "remote" };
      const localDistance = distance(enemy, player);
      const remoteDistance = distance(enemy, network.remote);
      if (enemy.targetSlot === "remote" && remoteDistance <= localDistance + .65) target = remoteTarget;
      else if (remoteDistance + .65 < localDistance) target = remoteTarget;
    }
    enemy.targetSlot = target.slot;
    const targetField = target.slot === "remote" ? remoteField : localField;
    const d = distance(enemy, target.data);
    const targetEye = (Number(target.data.y) || 0) + (Number(target.data.eyeHeight) || .56);
    const sightRange = enemy.kind === "heavy" ? 10.5 : enemy.kind === "raider" ? 12.5 : 11.5;
    const sees = d < sightRange && !lineBlocked(enemy.x, enemy.z, .52, target.data.x, target.data.z, targetEye);
    if (sees) enemy.alert = 4; else enemy.alert -= dt;
    const dx = target.data.x - enemy.x, dz = target.data.z - enemy.z;
    const length = Math.hypot(dx, dz) || 1;
    const nx = dx / length, nz = dz / length;
    const preferred = enemy.kind === "raider" ? 1.55 : 2.05;
    const oldX = enemy.x, oldZ = enemy.z;
    const waypointDistance = Math.hypot(enemy.waypointX - enemy.x, enemy.waypointZ - enemy.z);
    if (enemy.decisionTimer <= 0) {
      enemy.decisionTimer = .65 + Math.random() * 1.2;
      if (Math.random() < .42) enemy.strafeDir *= -1;
      enemy.pace = .88 + Math.random() * .22;
      if (sees && d < preferred + 1.1 && Math.random() < .2) enemy.pauseTimer = .11 + Math.random() * .22;
    }
    if (enemy.pathTimer <= 0 || waypointDistance < .38 || enemy.stuckTimer > .34) {
      const waypoint = navigationWaypoint(enemy, target.data, targetField);
      enemy.waypointX = waypoint.x;
      enemy.waypointZ = waypoint.z;
      enemy.navigationState = waypoint.state;
      enemy.pathTimer = .26 + Math.random() * .24;
      if (enemy.stuckTimer > .34) {
        enemy.strafeDir *= -1;
        enemy.stuckTimer = .16;
      }
    }

    const routeX = enemy.waypointX - enemy.x;
    const routeZ = enemy.waypointZ - enemy.z;
    const routeLength = Math.hypot(routeX, routeZ) || 1;
    let desiredX = routeX / routeLength;
    let desiredZ = routeZ / routeLength;
    let speedScale = 1;
    if (sees && enemy.navigationState === "direct") {
      const lateralX = -nz * enemy.strafeDir;
      const lateralZ = nx * enemy.strafeDir;
      if (d > preferred + .48) {
        desiredX = nx * .94 + lateralX * .18;
        desiredZ = nz * .94 + lateralZ * .18;
      } else if (d < preferred - .48) {
        desiredX = -nx * .88 + lateralX * .28;
        desiredZ = -nz * .88 + lateralZ * .28;
        speedScale = .82;
      } else {
        const distanceCorrection = clamp((d - preferred) * .42, -.28, .28);
        desiredX = lateralX * .88 + nx * distanceCorrection;
        desiredZ = lateralZ * .88 + nz * distanceCorrection;
        speedScale = .68;
      }
    } else {
      const pathWander = Math.sin(enemy.strafe * .7) * .055;
      desiredX += -desiredZ * pathWander;
      desiredZ += desiredX * pathWander;
    }

    let separationX = 0;
    let separationZ = 0;
    for (const other of enemies) {
      if (other === enemy || other.dead) continue;
      const awayX = enemy.x - other.x;
      const awayZ = enemy.z - other.z;
      const spacing = Math.hypot(awayX, awayZ);
      const comfort = enemy.radius + other.radius + .48;
      if (spacing <= .001 || spacing >= comfort) continue;
      const pressure = (comfort - spacing) / comfort;
      separationX += awayX / spacing * pressure;
      separationZ += awayZ / spacing * pressure;
    }
    desiredX += separationX * .72;
    desiredZ += separationZ * .72;
    const desiredLength = Math.hypot(desiredX, desiredZ) || 1;
    desiredX /= desiredLength;
    desiredZ /= desiredLength;
    if (enemy.pauseTimer > 0 && sees && enemy.navigationState === "direct") speedScale = 0;
    const desiredSpeed = enemy.speed * enemy.pace * speedScale;
    const targetVx = desiredX * desiredSpeed;
    const targetVz = desiredZ * desiredSpeed;
    // The first character controller responded immediately instead of easing
    // velocity over several frames. Keep modern pathfinding, poses, and online
    // state, but restore that original movement physics.
    enemy.vx = targetVx;
    enemy.vz = targetVz;
    const attemptedMove = Math.hypot(enemy.vx, enemy.vz) * dt;
    const movedDistance = moveEnemy(enemy, enemy.vx * dt, enemy.vz * dt);
    enemy.moveSpeed = dt > 0 ? movedDistance / dt : 0;
    if (attemptedMove > .002 && movedDistance < attemptedMove * .16) {
      enemy.stuckTimer += dt;
      enemy.pathTimer = Math.min(enemy.pathTimer, .04);
      if (enemy.stuckTimer > .3) {
        enemy.vx = -desiredZ * enemy.speed * .58 * enemy.strafeDir;
        enemy.vz = desiredX * enemy.speed * .58 * enemy.strafeDir;
      }
    } else enemy.stuckTimer = Math.max(0, enemy.stuckTimer - dt * 2.5);
    if (sees && d <= ENEMY_DAMAGE_RANGE && enemy.fireCd <= 0) enemyShoot(enemy, d, target.local);
    const moving = Math.hypot(enemy.x - oldX, enemy.z - oldZ) > .0001;
    const faceTarget = sees && d < 7.5;
    const faceX = faceTarget ? dx : moving ? enemy.vx : dx;
    const faceZ = faceTarget ? dz : moving ? enemy.vz : dz;
    const desiredYaw = Math.atan2(faceX, faceZ);
    const yawDifference = Math.atan2(Math.sin(desiredYaw - enemy.yaw), Math.cos(desiredYaw - enemy.yaw));
    const turnRate = enemy.kind === "heavy" ? 2.4 : enemy.kind === "raider" ? 4.8 : 3.5;
    enemy.turnLean += (clamp(yawDifference * .12, -.035, .035) - enemy.turnLean) * Math.min(1, dt * 8);
    enemy.yaw += clamp(yawDifference, -turnRate * dt, turnRate * dt);
    if (enemy.firePose > 0) enemy.action = "fire";
    else if (sees && d < 7 && (d <= preferred + .4 || enemy.fireCd < .38)) enemy.action = "aim";
    else if (moving) enemy.action = "walk";
    else if (sees && d < 7) enemy.action = "aim";
    else enemy.action = "idle";
    enemy.sprite.position.set(enemy.x, 0, enemy.z);
    presentEnemyAction(enemy, dt);
  }
}

function enemyShoot(enemy, d, localTarget = true) {
  if (!Number.isFinite(d) || d > ENEMY_DAMAGE_RANGE) return false;
  enemy.fireCd = enemy.rate + Math.random() * .55;
  enemy.firePose = .14;
  enemy.action = "fire";
  sfx("enemyShot");
  const accuracy = clamp((enemy.kind === "raider" ? .65 : .72) - d * .06, .2, .65);
  if (Math.random() < accuracy) {
    if (localTarget) damagePlayer(enemy.damage);
    else queueNetworkEvent({ type: "takeDamage", amount: enemy.damage });
    return true;
  }
  return false;
}

function damagePlayer(amount) {
  if (network.mode === "duel" && player.spawnShield > 0) return;
  if (player.armor > 0) {
    const absorbed = Math.min(player.armor, amount * .7);
    player.armor -= absorbed; amount -= absorbed;
  }
  player.hp -= amount; damageFlash = .23; sfx("hurt"); rumble(.45, .9, 170);
  if (player.hp <= 0) {
    if (network.active && network.mode === "duel") {
      queueNetworkEvent({ type: "duelDeath" });
      const startX = MAP_W / 2 + (network.slot === 0 ? -12 : 12);
      player.hp = 100; player.armor = 50;
      player.x = startX; player.z = MAP_H / 2 + .4;
      player.y = 0; player.vy = 0; player.grounded = true; player.stance = "stand";
      player.yaw = network.slot === 0 ? -Math.PI / 2 : Math.PI / 2;
      player.spawnShield = 1;
      player.lastSafeX = player.x; player.lastSafeZ = player.z;
      toast("ROUND LOST // RIVAL SCORES", true);
      sfx("fail");
    } else if (network.active) {
      player.hp = 100; player.armor = 25;
      player.x = MAP_W / 2 + (network.slot === 0 ? -.8 : .8); player.z = MAP_H / 2 + .4;
      player.y = 0; player.vy = 0; player.grounded = true; player.stance = "stand";
      toast("OPERATOR REDEPLOYED // CO-OP CONTINUES", true);
      sfx("deploy");
    } else { player.hp = 0; finish(); }
  }
}

function updateWaves(dt) {
  if (enemies.some((enemy) => !enemy.dead)) { waveDelay = -1; return; }
  if (waveDelay < 0) { waveDelay = 2.25; toast("WAVE CLEAR // RESUPPLY INBOUND"); }
  waveDelay -= dt;
  if (waveDelay <= 0) spawnWave();
}

function update(dt) {
  if (state !== "playing") return;
  const aiming = (input.mouseAim || input.padAim) && !weaponActionBusy();
  adsAmount += ((aiming ? 1 : 0) - adsAmount) * Math.min(1, dt * 11);
  ui.hud.classList.toggle("aiming", adsAmount > .45);
  updatePlayer(dt); updateCamera(dt); updateThrowPreview(); updateOrdnance(dt); updateFiringRange(dt); updateNetwork(dt);
  if (playMode !== "range") {
    if (!network.active || (network.mode === "coop" && network.role === "host")) { updateEnemies(dt); updateWaves(dt); }
    else if (network.mode === "coop") updateSyncedEnemyPresentations(dt);
  }
  player.fireCd = Math.max(0, player.fireCd - dt);
  player.throwCd = Math.max(0, player.throwCd - dt);
  muzzleTime = Math.max(0, muzzleTime - dt);
  damageFlash = Math.max(0, damageFlash - dt);
  hitmarkTimer = Math.max(0, hitmarkTimer - dt);
  hitZoneTimer = Math.max(0, hitZoneTimer - dt);
  weaponRecoil = Math.max(0, weaponRecoil - dt * .72);
  cameraKick = Math.max(0, cameraKick - dt * .05);
  if (hitmarkTimer <= 0) hitmarkKill = false;
  if (streakTimer > 0) streakTimer -= dt; else player.streak = 0;
  ui.hitmark.classList.toggle("show", hitmarkTimer > 0);
  ui.hitmark.classList.toggle("kill", hitmarkKill && hitmarkTimer > 0);
  ui.hitZone.classList.toggle("show", hitZoneTimer > 0);
  ui.damage.classList.toggle("show", damageFlash > 0);
  ambience -= dt;
  if (ambience <= 0) { ambience = 4 + Math.random() * 7; sfx("ambient"); }
  hudTimer -= dt;
  if (hudTimer <= 0) {
    hudTimer = .08;
    updateHUD();
  }
}

function startReload() {
  if (!player || state !== "playing" || player.reloading > 0 || weaponActionBusy() || player.mag >= 30 || player.reserve <= 0) return false;
  beginWeaponAction("reload");
  player.reloading = WEAPON_ACTION_DURATIONS.reload;
  sfx("reload");
  return true;
}

function useMedkit() {
  if (!player || state !== "playing" || player.meds <= 0 || player.hp >= 100 || weaponActionBusy()) return false;
  player.meds--;
  player.hp = Math.min(100, player.hp + 55);
  beginWeaponAction("medkit");
  toast("MEDKIT APPLIED // +55 HP"); sfx("heal"); rumble(.18, .2, 130);
  return true;
}

function updateHUD() {
  if (!player) return;
  const alive = enemies.filter((enemy) => !enemy.dead).length;
  if (network.mode === "duel") {
    ui.clockLabel.textContent = "DUEL SCORE";
    ui.timer.textContent = `${network.duelScores[0]}-${network.duelScores[1]}`;
    ui.clock.classList.remove("danger");
    ui.objective.innerHTML = `1V1 DUEL <em>FIRST TO 5</em>`;
  } else if (playMode === "range" || playerInsideFiringRange()) {
    ui.clockLabel.textContent = "RANGE SCORE";
    ui.timer.textContent = String(firingRangeStats.score).padStart(6, "0");
    ui.clock.classList.remove("danger");
    ui.objective.innerHTML = `FIRING RANGE <em>${firingRangeStats.score} PTS // ${firingRangeStats.kills} DOWN</em>`;
  } else {
    ui.clockLabel.textContent = "DISTRICT SCORE";
    ui.timer.textContent = String(score).padStart(6, "0"); ui.clock.classList.toggle("danger", waveDelay >= 0);
    ui.objective.innerHTML = waveDelay >= 0 ? `WAVE ${String(wave).padStart(2, "0")} CLEAR <em>${Math.max(0, waveDelay).toFixed(1)}S</em>` : `WAVE ${String(wave).padStart(2, "0")} <em>${alive} HOSTILES</em>`;
  }
  ui.hpBar.style.width = `${clamp(player.hp, 0, 100)}%`; ui.armorBar.style.width = `${clamp(player.armor, 0, 100)}%`;
  ui.hpText.textContent = Math.ceil(player.hp); ui.armorText.textContent = Math.ceil(player.armor);
  ui.cash.textContent = score.toLocaleString(); ui.meds.textContent = `x${player.meds}`; ui.intel.textContent = player.streak > 1 ? `x${player.streak}` : "x1";
  ui.mag.textContent = String(player.mag).padStart(2, "0"); ui.reserve.textContent = playMode === "range" ? "∞" : String(player.reserve).padStart(3, "0");
  ui.smokes.textContent = playMode === "range" ? "∞" : `x${player.smokes}`; ui.grenades.textContent = playMode === "range" ? "∞" : `x${player.grenades}`;
  const throwing = weaponAction.kind === "smoke" || weaponAction.kind === "frag";
  const healing = weaponAction.kind === "medkit";
  ui.reloadText.textContent = player.reloading > 0 ? `RELOADING ${player.reloading.toFixed(1)}` : throwing ? `${weaponAction.kind === "smoke" ? "SMOKE" : "FRAG"} // ${weaponAction.phase.toUpperCase()}` : healing ? `MEDKIT // ${weaponAction.phase.toUpperCase()}` : player.slideTimer > 0 ? "POWER SLIDE" : !player.grounded ? "AIRBORNE" : "FULL AUTO";
  ui.reloadText.classList.toggle("reload", player.reloading > 0 || throwing || healing);
  ui.stance.classList.toggle("hidden", player.stance === "stand");
  if (player.stance !== "stand") {
    const asset = player.stance === "crouch" ? "assets/stance-crouch-v2.png" : "assets/stance-prone.png";
    if (!ui.stanceIcon.src.endsWith(asset)) ui.stanceIcon.src = asset;
    ui.stanceIcon.alt = player.stance === "prone" ? "Operator prone" : "Operator crouching";
    ui.stanceText.textContent = player.stance === "prone" ? "PRONE" : "CROUCHED";
  }
  const close = enemies.filter((enemy) => !enemy.dead && distance(player, enemy) < 5).length;
  const level = clamp(Math.ceil(close / 2), 0, 4);
  ui.threatBars.forEach((bar, i) => bar.classList.toggle("active", i < level));
  ui.threatText.textContent = level === 0 ? "LOW" : level < 3 ? "ELEVATED" : "HIGH";
  ui.threatText.style.color = level > 2 ? "var(--red)" : level ? "var(--amber)" : "var(--lime)";
}

function toast(text, warn = false) {
  const element = document.createElement("div"); element.className = `toast${warn ? " warn" : ""}`; element.textContent = text;
  ui.toasts.appendChild(element); setTimeout(() => element.remove(), 2550);
}

function stick(value, deadzone = .18) {
  const amount = Math.abs(value); return amount <= deadzone ? 0 : Math.sign(value) * (amount - deadzone) / (1 - deadzone);
}
function justPressed(buttons, index) { return Boolean(buttons[index] && !previousPadButtons[index]); }
function justReleased(buttons, index) { return Boolean(!buttons[index] && previousPadButtons[index]); }

function pollGamepad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  let pad = null;
  for (const item of pads) {
    if (!item) continue;
    if (!pad) pad = item;
    if (item.mapping === "standard") { pad = item; break; }
  }
  if (!pad) {
    if (activeGamepad !== -1) { activeGamepad = -1; previousPadButtons = []; currentPadButtons = []; ui.controller.textContent = "PS5 CONTROLLER: WAITING"; ui.controller.classList.remove("connected"); }
    input.padMoveX = 0; input.padMoveY = 0; input.padLookX = 0; input.padLookY = 0; input.padShoot = false; input.padAim = false; input.padSprint = false; input.padSmoke = false; input.padFrag = false; return;
  }
  if (activeGamepad !== pad.index) {
    activeGamepad = pad.index; previousPadButtons = []; currentPadButtons = [];
    ui.controller.textContent = "PS5 CONTROLLER: CONNECTED"; ui.controller.classList.add("connected");
    if (state === "playing") toast("DUALSENSE CONNECTED");
  }
  const buttons = currentPadButtons;
  buttons.length = pad.buttons.length;
  for (let i = 0; i < pad.buttons.length; i++) buttons[i] = pad.buttons[i].pressed || pad.buttons[i].value > .5;
  let moveX = stick(pad.axes[0] || 0), moveY = stick(pad.axes[1] || 0);
  if (buttons[14]) moveX = -1; if (buttons[15]) moveX = 1;
  input.padMoveX = moveX; input.padMoveY = moveY;
  input.padLookX = stick(pad.axes[2] || 0, .2); input.padLookY = stick(pad.axes[3] || 0, .2);
  input.padAim = Boolean(buttons[4]);
  input.padShoot = Boolean(buttons[5]); input.padSprint = Boolean(buttons[10]);
  input.padSmoke = Boolean(buttons[7]); input.padFrag = Boolean(buttons[6]);
  if (justPressed(buttons, 9)) togglePause();
  if (justPressed(buttons, 0)) {
    if (state === "menu" || state === "failure") startGame();
    else if (state === "paused") togglePause(false); else jump();
  }
  if (state === "playing" && justPressed(buttons, 1)) startSlide();
  if (state === "playing" && justPressed(buttons, 11)) {
    if (input.padSprint && movementAxes().length > .1 && player.stance === "stand" && player.grounded) {
      startSlide();
      lastR3Press = -Infinity;
      currentPadButtons = previousPadButtons;
      previousPadButtons = buttons;
      return;
    }
    const now = performance.now();
    if (now - lastR3Press <= 360) {
      setStance("prone");
      lastR3Press = -Infinity;
      toast("R3 DOUBLE CLICK // PRONE");
    } else {
      toggleCrouch();
      lastR3Press = now;
    }
  }
  if (state === "playing" && justPressed(buttons, 13)) toggleProne();
  if (state === "playing" && justPressed(buttons, 2)) startReload();
  if (state === "playing" && (justPressed(buttons, 3) || justPressed(buttons, 12))) useMedkit();
  if (state === "playing" && justReleased(buttons, 7)) throwOrdnance("smoke");
  if (state === "playing" && justReleased(buttons, 6)) throwOrdnance("frag");
  if (state === "paused" && justPressed(buttons, 1)) showMenu();
  currentPadButtons = previousPadButtons;
  previousPadButtons = buttons;
}

function rumble(weak, strong, duration) {
  if (activeGamepad < 0 || !navigator.getGamepads) return;
  const pad = navigator.getGamepads()[activeGamepad];
  const actuator = pad && (pad.vibrationActuator || (pad.hapticActuators && pad.hapticActuators[0]));
  if (!actuator) return;
  if (actuator.playEffect) Promise.resolve(actuator.playEffect("dual-rumble", { duration, weakMagnitude: weak, strongMagnitude: strong })).catch(() => {});
  else if (actuator.pulse) Promise.resolve(actuator.pulse(Math.max(weak, strong), duration)).catch(() => {});
}

function initAudio() {
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === "suspended") audio.resume();
}
function tone(freq, duration, type = "square", volume = .035, end = null, delay = 0) {
  if (!soundOn || !audio) return;
  const osc = audio.createOscillator(), gain = audio.createGain(), time = audio.currentTime + delay;
  osc.type = type; osc.frequency.setValueAtTime(freq, time); if (end) osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), time + duration);
  gain.gain.setValueAtTime(volume, time); gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
  osc.connect(gain); gain.connect(audio.destination); osc.start(time); osc.stop(time + duration);
}
function noise(duration = .05, volume = .02) {
  if (!soundOn || !audio) return;
  const count = Math.floor(audio.sampleRate * duration), buffer = audio.createBuffer(1, count, audio.sampleRate), data = buffer.getChannelData(0);
  for (let i = 0; i < count; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / count);
  const source = audio.createBufferSource(), gain = audio.createGain(); source.buffer = buffer; gain.gain.value = volume; source.connect(gain); gain.connect(audio.destination); source.start();
}
function sfx(name) {
  if (name !== "ambient" && name !== "enemyShot") lastSfx = name;
  if (!soundOn || !audio) return;
  if (name === "shot") { tone(155, .06, "square", .045, 55); noise(.065, .04); }
  else if (name === "enemyShot") { tone(105, .08, "sawtooth", .018, 48); noise(.045, .014); }
  else if (name === "hit") tone(75, .045, "square", .03, 40);
  else if (name === "hurt") { tone(90, .16, "sawtooth", .05, 44); noise(.1, .025); }
  else if (name === "killShot") { tone(115, .055, "square", .04, 68); tone(620, .12, "square", .027, 920, .035); noise(.08, .022); }
  else if (name === "empty") tone(220, .04, "square", .016, 170);
  else if (name === "reload") { tone(250, .035, "square", .02, 170); tone(165, .04, "square", .015, 115, .23); }
  else if (name === "reloadEnd") tone(330, .06, "square", .025, 460);
  else if (name === "heal") tone(350, .17, "sine", .03, 680);
  else if (name === "jump") tone(130, .08, "square", .018, 220);
  else if (name === "land") { tone(72, .08, "square", .018, 48); noise(.045, .012); }
  else if (name === "slide") { noise(.14, .018); tone(85, .12, "sawtooth", .012, 45); }
  else if (name === "stance") tone(105, .055, "square", .012, 78);
  else if (name === "throw") { tone(185, .07, "square", .018, 120); noise(.05, .012); }
  else if (name === "smoke") { noise(.42, .032); tone(72, .28, "sawtooth", .015, 38); }
  else if (name === "explosion") { noise(.28, .085); tone(84, .32, "sawtooth", .07, 28); tone(190, .11, "square", .03, 52); }
  else if (name === "wave") { tone(280, .1, "square", .03, 450); tone(520, .16, "square", .03, 780, .1); }
  else if (name === "deploy") { tone(65, .5, "sawtooth", .025, 35); tone(250, .13, "square", .025, 410, .34); }
  else if (name === "fail") { tone(150, .35, "sawtooth", .04, 75); tone(70, .7, "sine", .03, 34, .24); }
  else if (name === "ambient" && Math.random() < .45) { tone(42, .7, "sine", .006, 31); noise(.25, .003); }
}

window.addEventListener("keydown", (event) => {
  input.keys.add(event.code);
  if (["KeyW", "KeyA", "KeyS", "KeyD", "KeyV", "KeyG", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "ControlLeft", "ControlRight"].includes(event.code)) event.preventDefault();
  if (event.code === "KeyR" && !event.repeat) startReload();
  if (event.code === "KeyQ" && !event.repeat) useMedkit();
  if (event.code === "Space" && !event.repeat) jump();
  if (["ControlLeft", "ControlRight"].includes(event.code) && !event.repeat) startSlide();
  if (event.code === "KeyC" && !event.repeat) crouchOrSlide();
  if (event.code === "KeyZ" && !event.repeat) toggleProne();
  if (event.code === "Escape" && !event.repeat && state === "playing") togglePause(true);
});
window.addEventListener("keyup", (event) => {
  const wasHeld = input.keys.has(event.code);
  input.keys.delete(event.code);
  if (state === "playing" && wasHeld && event.code === "KeyV") throwOrdnance("smoke");
  if (state === "playing" && wasHeld && event.code === "KeyG") throwOrdnance("frag");
});
window.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement === canvas && state === "playing") {
    player.yaw -= event.movementX * .0026 * (1 - adsAmount * .52);
    player.pitch = clamp(player.pitch - event.movementY * .0024 * (1 - adsAmount * .45), -.82, .82);
  }
});
canvas.addEventListener("mousedown", (event) => {
  if (state !== "playing" || (event.button !== 0 && event.button !== 2)) return;
  initAudio();
  if (event.button === 0) input.mouseDown = true;
  if (event.button === 2) input.mouseAim = true;
  if (document.pointerLockElement !== canvas) requestGamePointerLock();
});
window.addEventListener("mouseup", (event) => { if (event.button === 0) input.mouseDown = false; if (event.button === 2) input.mouseAim = false; });
document.addEventListener("pointerlockchange", () => { if (document.pointerLockElement !== canvas) input.mouseAim = false; });
canvas.addEventListener("contextmenu", (event) => event.preventDefault());
window.addEventListener("blur", () => { input.keys.clear(); input.mouseDown = false; input.mouseAim = false; if (state === "playing") togglePause(true); });

ui.deploy.addEventListener("click", () => startGame("solo"));
ui.range.addEventListener("click", () => startGame("range"));
ui.hostCoop.addEventListener("click", createCoopRoom);
ui.hostDuel.addEventListener("click", createDuelRoom);
ui.joinCoop.addEventListener("click", joinCoopRoom);
ui.roomCode.addEventListener("input", () => { ui.roomCode.value = ui.roomCode.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 5); });
ui.roomCode.addEventListener("keydown", (event) => { if (event.key === "Enter") joinCoopRoom(); });
ui.resume.addEventListener("click", () => togglePause(false));
ui.abort.addEventListener("click", showMenu);
ui.redeploy.addEventListener("click", () => startGame("solo"));
ui.backMenu.addEventListener("click", showMenu);
ui.sound.addEventListener("click", () => { soundOn = !soundOn; ui.sound.textContent = `SOUND: ${soundOn ? "ON" : "OFF"}`; if (soundOn) { initAudio(); tone(510, .05, "square", .025, 670); } });
window.addEventListener("beforeunload", () => {
  if (!network.active || !navigator.sendBeacon) return;
  navigator.sendBeacon("/api/room/leave", new Blob([JSON.stringify({ code: network.code, token: network.token })], { type: "application/json" }));
});

function loop(now) {
  const dt = Math.min(.033, (now - lastTime) / 1000 || .016); lastTime = now;
  pollGamepad();
  if (player) {
    if (state === "menu") { player.yaw += dt * .075; updateCamera(dt); }
    update(dt);
  }
  renderer.render(scene, camera);
  updateFrameMeter(now);
}

function updateFrameMeter(now) {
  const elapsed = now - frameMeter.sampledAt;
  if (elapsed > 2000) {
    frameMeter.frames = 0;
    frameMeter.sampledAt = now;
    return;
  }
  frameMeter.frames++;
  if (elapsed < 500) return;
  frameMeter.fps = Math.round(frameMeter.frames * 1000 / elapsed);
  frameMeter.frameMs = elapsed / frameMeter.frames;
  frameMeter.peakFps = Math.max(frameMeter.peakFps, frameMeter.fps);
  const refreshRates = [30, 60, 75, 90, 100, 120, 144, 165, 240];
  frameMeter.displayHz = refreshRates.reduce((nearest, rate) => (
    Math.abs(rate - frameMeter.peakFps) < Math.abs(nearest - frameMeter.peakFps) ? rate : nearest
  ), refreshRates[0]);
  frameMeter.frames = 0;
  frameMeter.sampledAt = now;
  ui.fpsValue.textContent = frameMeter.fps;
  const refreshLabel = frameMeter.displayHz >= TARGET_FPS ? "120HZ" : `${frameMeter.displayHz}HZ`;
  ui.gpuStats.textContent = `WEBGL2 ${refreshLabel} // ${renderer.info.render.calls} CALLS`;
  const availableTarget = Math.min(TARGET_FPS, frameMeter.displayHz || TARGET_FPS);
  ui.fps.classList.toggle("warn", frameMeter.fps < availableTarget * .9 && frameMeter.fps >= availableTarget * .65);
  ui.fps.classList.toggle("low", frameMeter.fps < availableTarget * .65);
}

window.__dmz3d = {
  engine: "Three.js WebGL 2",
  mapSize: { width: MAP_W, height: MAP_H, ceilingHeight: CEILING_HEIGHT, layout: "indoor-complex", openSky: false },
  renderer,
  scene,
  get indoorMap() {
    return { openSky: false, ceilingHeight: CEILING_HEIGHT, wallColliders: colliders.filter((collider) => collider.kind === "wall").length, ...indoorMapStats };
  },
  get streetMap() {
    return { deprecated: true, openSky: false, replacedBy: "indoorMap", wallColliders: colliders.filter((collider) => collider.kind === "wall").length, ...indoorMapStats };
  },
  get worldRendering() {
    const context = renderer.getContext();
    const attributes = context.getContextAttributes();
    return {
      antialias: Boolean(attributes?.antialias),
      samples: Number(context.getParameter(context.SAMPLES)) || 0,
      shadowFilter: renderer.shadowMap.type === THREE.PCFShadowMap ? "PCF 5-tap" : "other",
      pixelTextureFilter: "nearest",
      pixelGrid: `${W}x${H}`,
      targetFps: TARGET_FPS,
      refreshDriven: true,
      staticBatches: staticBatchStats.batches,
      staticInstances: staticBatchStats.instances,
      drawCallsSaved: staticBatchStats.drawCallsSaved
    };
  },
  get framePerformance() {
    return {
      fps: frameMeter.fps,
      frameMs: frameMeter.frameMs,
      targetFps: TARGET_FPS,
      displayHz: frameMeter.displayHz,
      refreshLimited: frameMeter.displayHz > 0 && frameMeter.displayHz < TARGET_FPS,
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles
    };
  },
  get state() { return state; }, get playMode() { return playMode; }, get player() { return player; },
  get network() { return { active: network.active, role: network.role, code: network.code, slot: network.slot, mode: network.mode, duelScores: [...network.duelScores], peerConnected: network.peerConnected, status: network.status, transport: network.streamConnected ? "live-push" : "http-fallback", rtt: network.rtt, remote: network.remote }; },
  get remoteOperator() { return remoteOperator; },
  get remoteShadow() { return remoteShadow; },
  get enemies() { return enemies; }, get platforms() { return platforms; },
  get firingRange() { return { bounds: { ...FIRING_RANGE_BOUNDS }, inside: playerInsideFiringRange(), hits: firingRangeStats.hits, kills: firingRangeStats.kills, bullseyes: firingRangeStats.bullseyes, score: firingRangeStats.score, lastPoints: firingRangeStats.lastPoints, respawnSeconds: FIRING_RANGE_RESPAWN_SECONDS, targetCount: firingRangeTargets.length, hitbox: { width: FIRING_RANGE_HITBOX_WIDTH, height: FIRING_RANGE_HITBOX_HEIGHT }, damageSources: ["bullets", "frag impact", "smoke impact", "frag blast"], webAssetLoaded: Boolean(webEnemyAsset?.scene), webAssetSource: "Kenney Blocky Characters CC0", animationNames: webEnemyAsset?.animations?.map(clip => clip.name) || [], targets: firingRangeTargets.map(target => {
    const box = target.webModel ? new THREE.Box3().setFromObject(target.webModel) : null;
    return { lane: target.lane, x: target.root.position.x, z: target.z, minZ: target.minZ, maxZ: target.maxZ, moveSpeed: target.moveSpeed, moveDirection: target.moveDirection, stationary: target.stationary, movingFrontBack: false, hp: target.hp, maxHp: target.maxHp, dead: target.dead, respawnTimer: target.respawnTimer, hits: target.hits, score: target.score, poseFrozen: target.mixer?.timeScale === 0 || !target.mixer, hitboxWidth: target.width, hitboxHeight: target.height, hitPlateWidth: .13, hitPlateHeight: .16, body3D: Boolean(target.webModel || target.body3D?.userData.genuine3DBody), fallbackBodyVisible: Boolean(target.body3D?.visible), bodyPartCount: target.webModel?.userData.meshCount || target.body3D?.children.length || 0, webEnemy3D: Boolean(target.webModel), webSource: target.webModel?.userData.webSource || "built-in fallback", visible: Boolean(target.root.visible && (target.webModel?.visible || target.body3D?.visible)), materialCount: target.modelMaterials.length, worldBounds: box ? { min: box.min.toArray(), max: box.max.toArray() } : null, chatGPTPixelArt: Boolean(target.hitPlate?.userData.chatGPTPixelArt), chatGPTPixelArtFallback: Boolean(target.cover.userData.chatGPTPixelArt) };
  }) }; },
  get projectiles() { return projectiles; }, get smokeClouds() { return smokeClouds; }, get blastEffects() { return blastEffects; },
  get colliders() { return colliders; }, get wave() { return wave; }, get score() { return score; },
  get navigation() { return { walkableCells: navigationWalkableCount, totalCells: navigationWalkable.length, localReachable: navigationFields.local?.reachable || 0, remoteReachable: navigationFields.remote?.reachable || 0 }; },
  get adsAmount() { return adsAmount; }, get currentFov() { return camera.fov; },
  get aimPoint() { return { x: shotPoint.x, y: shotPoint.y }; },
  get hitmarkPoint() { return { x: hitmarkPoint.x, y: hitmarkPoint.y }; },
  get enemyDamageRange() { return ENEMY_DAMAGE_RANGE; },
  get adsWeaponPosition() { return { x: weaponAds.position.x, y: weaponAds.position.y, z: weaponAds.position.z, rotationX: weaponAds.rotation.x, rotationY: weaponAds.rotation.y, rotation: weaponAds.rotation.z, centerX: 0, centerY: 0, is3D: weaponAds.userData.weapon3D, opacity: weaponAds.userData.opacity }; },
  get hipWeaponPosition() { return { x: weaponHip.position.x, y: weaponHip.position.y, z: weaponHip.position.z, rotationX: weaponHip.rotation.x, rotationY: weaponHip.rotation.y, rotation: weaponHip.rotation.z, scaleX: weaponHip.scale.x, scaleY: weaponHip.scale.y, is3D: weaponHip.userData.weapon3D, opacity: weaponHip.userData.opacity, sprintAmount, sprintArtOpacity: weaponSprintCover.material.opacity, sprintArtVisible: weaponSprintCover.visible }; },
  get throwablePreview() { return { kind: throwPreview?.kind || null, markerCount: throwPreview?.markerCount || 0, targetVisible: Boolean(throwPreview?.target.visible), end: throwPreview?.end ? { ...throwPreview.end } : null }; },
  get weaponAnimation() {
    const actionRoot = weaponAction.kind === "reload" ? reloadMagazine : throwHand;
    const anchor = ACTION_SCREEN_ANCHORS[weaponAction.kind] || null;
    const visibleActionArtCount = Number(Boolean(reloadGun?.visible)) + Number(Boolean(reloadMagazine?.visible)) + (throwHand?.visible ? Object.values(heldThrowables).filter(item => item?.visible).length : 0);
    const throwing = weaponAction.kind === "smoke" || weaponAction.kind === "frag";
    return { kind: weaponAction.kind, phase: weaponAction.phase, progress: weaponAction.duration ? weaponAction.elapsed / weaponAction.duration : 0, frame: weaponAction.frame, totalFrames: weaponAction.totalFrames, artFrame: weaponAction.artFrame, artFrames: WEAPON_ACTION_ART_FRAMES, released: weaponAction.released, throwObjectVisible: throwing && !weaponAction.released && weaponAction.artFrame <= 5, reloadMagazineVisible: Boolean(reloadMagazine?.visible), reloadGunVisible: Boolean(reloadGun?.visible), visibleActionArtCount, throwHandVisible: Boolean(throwHand?.visible), heldSmokeVisible: Boolean(heldThrowables.smoke?.visible), heldFragVisible: Boolean(heldThrowables.frag?.visible), heldMedkitVisible: Boolean(heldThrowables.medkit?.visible), throwHandY: throwHand?.position.y || 0, throwHandRotationX: throwHand?.rotation.x || 0, screenLocked: Boolean(anchor), screenAnchor: anchor ? { ...anchor } : null, screenPosition: actionRoot ? { x: actionRoot.position.x, y: actionRoot.position.y, z: actionRoot.position.z, roll: actionRoot.rotation.z } : null, reloadGunPosition: reloadGun ? { x: reloadGun.position.x, y: reloadGun.position.y, z: reloadGun.position.z, roll: reloadGun.rotation.z } : null, chatGPTPixelArt: Boolean(reloadGun?.userData.chatGPTPixelArt && reloadMagazine?.userData.chatGPTPixelArt && Object.values(heldThrowables).every(item => item?.userData.chatGPTPixelArt)) };
  },
  get weaponRecoil() { return weaponRecoil; }, get cameraKick() { return cameraKick; }, get hitmarkKill() { return hitmarkKill; },
  get lastHit() { return lastHit; }, get lastSfx() { return lastSfx; },
  startGame, resetRun, jump, startSlide, setStance, toggleCrouch, crouchOrSlide, toggleProne, startReload, useMedkit, shoot, throwOrdnance, explodeGrenade, getThrowLaunch: throwLaunch, createCoopRoom, createDuelRoom, joinCoopRoom, leaveNetwork, syncNetwork,
  groundHeightAt, canPlayerStand, recoverPlayerFromColliders, hitZoneForHeight, lineBlocked, solidLineBlocked, smokeDensityAlongSegment, smokeVisibilityAlongSegment
};

loadAssets().catch((error) => {
  console.error("EXFIL ZERO startup failed", error);
  window.__showBootError?.("STARTUP ERROR // CLICK TO RETRY");
});
renderer.setAnimationLoop(loop);
