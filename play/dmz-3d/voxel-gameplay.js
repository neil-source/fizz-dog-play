import * as THREE from "./vendor/three.module.js";

function standard(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: options.emissive ?? new THREE.Color(color).multiplyScalar(options.emissiveLift ?? .055),
    emissiveIntensity: options.emissiveIntensity ?? .55,
    roughness: options.roughness ?? .7,
    metalness: options.metalness ?? .22,
    flatShading: true,
    transparent: Boolean(options.transparent),
    opacity: options.opacity ?? 1,
    depthTest: options.depthTest ?? true,
    depthWrite: options.depthWrite ?? true
  });
}

let enemyToonGradient;
let enemyDetailGeometry;

function toonGradient() {
  if (enemyToonGradient) return enemyToonGradient;
  // One tiny shared ramp gives every enemy the same three hard lighting bands.
  // Nearest sampling and no mipmaps keep those bands stable at the game's
  // deliberately low internal resolution.
  enemyToonGradient = new THREE.DataTexture(new Uint8Array([42, 154, 255]), 3, 1, THREE.RedFormat);
  enemyToonGradient.magFilter = THREE.NearestFilter;
  enemyToonGradient.minFilter = THREE.NearestFilter;
  enemyToonGradient.generateMipmaps = false;
  enemyToonGradient.needsUpdate = true;
  return enemyToonGradient;
}

function toon(color, options = {}) {
  const material = new THREE.MeshToonMaterial({
    color,
    emissive: options.emissive ?? new THREE.Color(color).multiplyScalar(options.emissiveLift ?? .035),
    emissiveIntensity: options.emissiveIntensity ?? .5,
    gradientMap: toonGradient(),
    transparent: false,
    opacity: 1,
    dithering: false,
    toneMapped: false
  });
  material.userData.toonBands = 3;
  material.userData.paletteLocked = true;
  return material;
}

function detailGeometry() {
  if (enemyDetailGeometry) return enemyDetailGeometry;
  enemyDetailGeometry = new THREE.BoxGeometry(1, 1, 1);
  enemyDetailGeometry.userData.shared = true;
  return enemyDetailGeometry;
}

function addBlock(root, name, size, position, material, rotation = [0, 0, 0], outline = true) {
  const geometry = new THREE.BoxGeometry(...size);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = material.depthTest;
  mesh.receiveShadow = material.depthTest;
  if (outline) {
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0x080d0c, transparent: true, opacity: .7, depthTest: material.depthTest, depthWrite: false })
    );
    edges.raycast = () => {};
    mesh.add(edges);
  }
  root.add(mesh);
  return mesh;
}

export function disposeVoxelObject(root) {
  const geometries = new Set();
  const materials = new Set();
  root.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    const list = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
    list.forEach(material => materials.add(material));
  });
  geometries.forEach(geometry => { if (!geometry.userData.shared) geometry.dispose(); });
  materials.forEach(material => material.dispose());
}

export function createVoxelEnemy(kind = "grunt", height = 1.08) {
  const root = new THREE.Group();
  root.name = `PixelForgeEnemy3D_${kind}`;
  root.rotation.order = "YXZ";
  const palette = kind === "heavy"
    ? { armor: 0x57523d, armorLight: 0x777056, cloth: 0x282a29, rust: 0x914838, steel: 0x747b78, accent: 0xd3a149, visor: 0xffa12d, cyan: 0x31d0d1 }
    : kind === "raider"
      ? { armor: 0x625a3d, armorLight: 0x80734c, cloth: 0x2f302b, rust: 0xa64e34, steel: 0x747871, accent: 0xd8a747, visor: 0xffa331, cyan: 0x2ad1ce }
      : { armor: 0x55533e, armorLight: 0x777157, cloth: 0x292c2b, rust: 0x984937, steel: 0x727975, accent: 0xcaa04f, visor: 0xffa32f, cyan: 0x2bc9ce };
  const materials = {
    armor: toon(palette.armor),
    armorLight: toon(palette.armorLight),
    cloth: toon(palette.cloth),
    dark: toon(0x151b1a),
    rust: toon(palette.rust),
    steel: toon(palette.steel),
    accent: toon(palette.accent, { emissive: palette.accent, emissiveIntensity: .62 }),
    visor: toon(palette.visor, { emissive: palette.visor, emissiveIntensity: 1.3 }),
    cyan: toon(palette.cyan, { emissive: palette.cyan, emissiveIntensity: 1.15 })
  };
  const outlineMaterial = new THREE.MeshBasicMaterial({
    color: 0x090d0c, side: THREE.BackSide, transparent: false, opacity: 1,
    depthTest: true, depthWrite: true, toneMapped: false
  });
  const scale = height / 1.4;
  root.scale.setScalar(scale);
  const wide = kind === "heavy" ? 1.22 : kind === "raider" ? .88 : 1;

  const joints = {};
  const joint = (name, parent, position) => {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(...position);
    group.rotation.order = "YXZ";
    parent.add(group);
    joints[name] = group;
    return group;
  };
  const pixelBlock = (parent, name, size, position, material, rotation = [0, 0, 0], outlined = false) => {
    const block = addBlock(parent, name, size, position, material, rotation, false);
    block.userData.pixelForgeBlock = true;
    if (outlined) {
      const hull = new THREE.Mesh(block.geometry, outlineMaterial);
      hull.name = `${name}InvertedHull`;
      hull.scale.setScalar(kind === "heavy" ? 1.048 : 1.042);
      hull.raycast = () => {};
      hull.castShadow = false;
      hull.receiveShadow = false;
      hull.userData.enemyOutline = true;
      block.add(hull);
    }
    return block;
  };
  let detailVoxelCount = 0;
  const voxelCluster = (parent, name, material, voxels) => {
    const cluster = new THREE.InstancedMesh(detailGeometry(), material, voxels.length);
    cluster.name = name;
    cluster.castShadow = false;
    cluster.receiveShadow = true;
    cluster.userData.pixelForgeDetail = true;
    cluster.userData.voxelCount = voxels.length;
    const dummy = new THREE.Object3D();
    voxels.forEach(([size, position, rotation = [0, 0, 0]], index) => {
      dummy.position.set(...position);
      dummy.rotation.set(...rotation);
      dummy.scale.set(...size);
      dummy.updateMatrix();
      cluster.setMatrixAt(index, dummy.matrix);
    });
    cluster.instanceMatrix.needsUpdate = true;
    parent.add(cluster);
    detailVoxelCount += voxels.length;
    return cluster;
  };

  // Rigid joint groups mirror PixelForge's deterministic no-skinning rig,
  // with near-human seven-head proportions adapted to the low-resolution view.
  const hips = joint("EnemyHipsJoint", root, [0, .70, 0]);
  const torso = joint("EnemyTorsoJoint", hips, [0, 0, 0]);
  pixelBlock(torso, "EnemyPelvis", [.34 * wide, .16, .22], [0, .015, 0], materials.dark, [0, 0, 0], true);
  pixelBlock(torso, "EnemyAbdomen", [.35 * wide, .22, .22], [0, .15, 0], materials.cloth, [0, 0, 0], true);
  pixelBlock(torso, "EnemyUpperTorso", [.44 * wide, .27, .245], [0, .32, 0], materials.cloth, [0, 0, 0], true);
  pixelBlock(torso, "EnemyChestPlate", [.38 * wide, .22, .06], [0, .34, .153], materials.armor, [0, 0, 0], true);
  pixelBlock(torso, "EnemyChestMark", [.05, .065, .024], [0, .38, .195], materials.cyan);
  pixelBlock(torso, "EnemyBackpack", [.28 * wide, .34, .13], [0, .30, -.185], materials.armorLight);
  voxelCluster(torso, "EnemyVestPixelTiles", materials.armorLight, [
    ...[-.105, .105].flatMap(x => [.27, .335, .40].map(y => [[.058, .04, .018], [x * wide, y, .193]]))
  ]);
  voxelCluster(torso, "EnemyWebbingPixels", materials.dark, [
    [[.026, .255, .018], [-.15 * wide, .33, .194]], [[.026, .255, .018], [.15 * wide, .33, .194]],
    [[.082, .068, .052], [-.11 * wide, .13, .138]], [[.082, .068, .052], [0, .13, .138]],
    [[.082, .068, .052], [.11 * wide, .13, .138]]
  ]);
  voxelCluster(torso, "EnemyBackpackPixelClips", materials.rust, [
    [[.038, .06, .022], [-.08, .35, -.255]], [[.038, .06, .022], [.08, .35, -.255]]
  ]);
  voxelCluster(torso, "EnemyRadioHardware", materials.dark, [
    [[.095, .18, .085], [.205 * wide, .37, -.22]], [[.025, .34, .025], [.205 * wide, .63, -.22]],
    [[.04, .05, .04], [.205 * wide, .825, -.22]]
  ]);
  pixelBlock(torso, "EnemyRadioScreen", [.048, .06, .022], [.205 * wide, .40, -.27], materials.cyan);
  pixelBlock(torso, "EnemySmokeCanister", [.07, .18, .07], [-.225 * wide, -.07, .08], materials.steel);
  pixelBlock(torso, "EnemySmokeBand", [.077, .036, .077], [-.225 * wide, -.07, .08], materials.cyan);
  pixelBlock(torso, "EnemySmokeCap", [.052, .042, .052], [-.225 * wide, .045, .08], materials.dark);

  const head = joint("EnemyHeadJoint", torso, [0, .46, 0]);
  pixelBlock(head, "EnemyNeck", [.13, .095, .13], [0, -.03, 0], materials.dark);
  pixelBlock(head, "EnemyHelmet", [.30 * wide, .22, .255], [0, .095, 0], materials.armor, [0, 0, 0], true);
  pixelBlock(head, "EnemyHelmetCrown", [.23 * wide, .055, .205], [0, .215, -.01], materials.armorLight);
  pixelBlock(head, "EnemyMask", [.17 * wide, .075, .06], [0, .025, .15], materials.dark);
  voxelCluster(head, "EnemyVisorPixels", materials.visor, [-.078, 0, .078].map(x => (
    [[.065 * wide, .057, .032], [x * wide, .105, .145]]
  )));
  voxelCluster(head, "EnemyRespiratorPixels", materials.steel, [
    [[.05, .05, .03], [-.064 * wide, 0, .185]], [[.05, .05, .03], [.064 * wide, 0, .185]],
    [[.17 * wide, .022, .022], [0, .15, .15]]
  ]);
  voxelCluster(head, "EnemyHelmetEarArmor", materials.rust, [
    [[.05, .115, .115], [-.165 * wide, .09, 0]], [[.05, .115, .115], [.165 * wide, .09, 0]]
  ]);
  voxelCluster(head, "EnemyHelmetCamera", materials.steel, [
    [[.078, .07, .04], [.065 * wide, .205, .09]], [[.032, .032, .022], [.065 * wide, .205, .122]]
  ]);

  for (const [side, sign] of [["L", -1], ["R", 1]]) {
    const hip = joint(`EnemyHip${side}Joint`, hips, [.095 * wide * sign, -.05, 0]);
    pixelBlock(hip, `EnemyThigh${side}`, [.145, .29, .155], [0, -.145, 0], materials.cloth, [0, 0, 0], true);
    pixelBlock(hip, `EnemyThighPouch${side}`, [.115, .15, .068], [.047 * sign, -.145, .105], materials.armorLight);
    pixelBlock(hip, `EnemyThighClip${side}`, [.04, .065, .016], [.047 * sign, -.145, .147], materials.steel);
    const knee = joint(`EnemyKnee${side}Joint`, hip, [0, -.285, 0]);
    pixelBlock(knee, `EnemyKnee${side}`, [.165, .12, .075], [0, -.015, .078], materials.rust);
    pixelBlock(knee, `EnemyKneeInset${side}`, [.11, .072, .022], [0, -.015, .127], materials.steel);
    pixelBlock(knee, `EnemyShin${side}`, [.13, .275, .14], [0, -.145, 0], materials.dark, [0, 0, 0], true);
    const ankle = joint(`EnemyAnkle${side}Joint`, knee, [0, -.285, 0]);
    pixelBlock(ankle, `EnemyBoot${side}`, [.16, .105, .24], [0, -.03, .04], materials.dark, [0, 0, 0], true);
    pixelBlock(ankle, `EnemyBootStrap${side}`, [.17, .048, .205], [0, -.012, .05], materials.armorLight);
    pixelBlock(ankle, `EnemyBootToe${side}`, [.15, .042, .065], [0, -.03, .15], materials.steel);

    const shoulder = joint(`EnemyShoulder${side}Joint`, torso, [.25 * wide * sign, .36, .015]);
    const shoulderMaterial = side === "R" ? materials.rust : materials.armor;
    const shoulderScale = side === "R" ? 1.1 : .94;
    pixelBlock(shoulder, `EnemyShoulder${side}`, [.16 * shoulderScale, .145 * shoulderScale, .20], [0, -.03, 0], shoulderMaterial, [0, 0, sign * .065], true);
    pixelBlock(shoulder, `EnemyShoulderRivet${side}`, [.045, .045, .02], [0, -.015, .114], materials.steel);
    pixelBlock(shoulder, `EnemyUpperArm${side}`, [.115, .265, .13], [0, -.15, .035], materials.cloth);
    const elbow = joint(`EnemyElbow${side}Joint`, shoulder, [0, -.28, .035]);
    pixelBlock(elbow, `EnemyForearm${side}`, [.115, .24, .125], [-.04 * sign, -.01, .105], materials.armorLight, [.92, 0, sign * .24]);
    pixelBlock(elbow, `EnemyForearmPlate${side}`, [.098, .10, .03], [-.065 * sign, -.01, .17], materials.rust, [.92, 0, sign * .24]);
    pixelBlock(elbow, `EnemyGlove${side}`, [.105, .10, .105], [-.075 * sign, .015, .215], materials.dark);
  }

  // Unlike the retired billboard art, the carbine points along local +Z, so
  // its muzzle follows the enemy's real world yaw.
  const weapon = joint("EnemyWeaponJoint", torso, [.06, .27, .30]);
  pixelBlock(weapon, "EnemyRifleBody", [.13, .13, .55], [0, 0, .18], materials.dark, [0, 0, 0], true);
  pixelBlock(weapon, "EnemyRifleStock", [.19, .15, .20], [0, 0, -.19], materials.rust);
  pixelBlock(weapon, "EnemyRifleRail", [.075, .035, .37], [0, .085, .18], materials.steel);
  pixelBlock(weapon, "EnemyMagazine", [.11, .22, .10], [0, -.14, .07], materials.steel, [-.16, 0, 0]);
  pixelBlock(weapon, "EnemyBarrel", [.045, .045, .34], [0, .005, .61], materials.dark);
  pixelBlock(weapon, "EnemyMuzzle", [.08, .08, .10], [0, .005, .82], materials.armorLight);
  pixelBlock(weapon, "EnemyRifleOptic", [.11, .09, .10], [0, .145, .20], materials.steel);
  pixelBlock(weapon, "EnemyRifleLens", [.062, .048, .026], [0, .147, .255], materials.cyan);
  pixelBlock(weapon, "EnemyForegrip", [.07, .18, .07], [0, -.135, .39], materials.dark, [-.1, 0, 0]);
  pixelBlock(weapon, "EnemyStockPixel", [.13, .065, .025], [0, .045, -.298], materials.rust);
  const muzzleFlash = joint("EnemyMuzzleFlashJoint", weapon, [0, .005, .92]);
  pixelBlock(muzzleFlash, "EnemyMuzzleFlashCore", [.06, .06, .06], [0, 0, 0], materials.accent, [0, Math.PI / 4, 0]);
  pixelBlock(muzzleFlash, "EnemyMuzzleFlashWide", [.13, .026, .026], [0, 0, 0], materials.accent, [0, 0, Math.PI / 4]);
  pixelBlock(muzzleFlash, "EnemyMuzzleFlashTall", [.026, .13, .026], [0, 0, 0], materials.accent, [0, 0, Math.PI / 4]);
  muzzleFlash.visible = false;

  const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });
  const hitbox = addBlock(root, "EnemyHitbox", [.62 * wide, 1.4, .46], [0, .70, .03], hitMaterial, [0, 0, 0], false);
  hitbox.castShadow = false;
  hitbox.receiveShadow = false;
  root.userData.hitMeshes = [hitbox];
  root.userData.visualMaterials = Object.values(materials);
  root.userData.baseEmissive = Object.values(materials).map(material => material.emissive.clone());
  root.userData.outlineMaterials = [outlineMaterial];
  root.userData.joints = joints;
  root.userData.muzzleFlash = muzzleFlash;
  root.userData.enemy3D = true;
  root.userData.pixelForge3D = true;
  let visibleMeshCount = 0;
  let visibleVoxelCount = 0;
  root.traverse(object => {
    if (object.userData.pixelForgeBlock) { visibleMeshCount++; visibleVoxelCount++; }
    if (object.userData.pixelForgeDetail) { visibleMeshCount++; visibleVoxelCount += object.userData.voxelCount; }
  });
  root.userData.renderMode = "chatgpt-reference-detailed-voxel-3d";
  root.userData.visibleMeshCount = visibleMeshCount;
  root.userData.visibleBlockCount = visibleVoxelCount;
  root.userData.visibleVoxelCount = visibleVoxelCount;
  root.userData.detailVoxelCount = visibleVoxelCount - 35;
  root.userData.pixelAnimationFps = 12;
  root.userData.highDetail = true;
  root.userData.lodDetailMeshes = [];
  root.traverse(object => {
    if (object.userData.pixelForgeDetail || object.userData.enemyOutline) root.userData.lodDetailMeshes.push(object);
  });
  root.userData.humanProportions = true;
  root.userData.proportionStyle = "near-human-seven-head";
  root.userData.modelReference = "assets/dmz-operator-reference-v1.webp";
  root.userData.referenceDesign = "ChatGPT DMZ operator concept v1";
  root.userData.kind = kind;
  return root;
}

export function poseVoxelEnemy(root, action = "idle", time = 0, moveSpeed = 0, turnLean = 0, firePose = 0) {
  const joints = root?.userData?.joints;
  if (!joints) return;
  const hips = joints.EnemyHipsJoint;
  const torso = joints.EnemyTorsoJoint;
  const head = joints.EnemyHeadJoint;
  const weapon = joints.EnemyWeaponJoint;
  const walking = action === "walk";
  const aiming = action === "aim" || action === "fire";
  const poseFps = root.userData.pixelAnimationFps || 12;
  const sampledTime = Math.floor(time * poseFps) / poseFps;
  const poseFrame = Math.floor(time * poseFps);
  const poseKey = `${action}|${poseFrame}|${Math.round(moveSpeed * 8)}|${Math.round(turnLean * 128)}|${Math.round(firePose * 64)}`;
  if (root.userData.poseKey === poseKey) return;
  root.userData.poseKey = poseKey;
  const poseSnap = value => Math.round(value * 128) / 128;
  const cadence = 6.4 + Math.min(3.2, moveSpeed * 2.1);
  const stride = walking ? poseSnap(Math.sin(sampledTime * cadence)) : 0;
  const lift = walking ? poseSnap(Math.abs(Math.cos(sampledTime * cadence))) : 0;
  const recoil = action === "fire" ? Math.min(1, firePose / .14) : 0;

  hips.position.y = .70 + lift * .01;
  hips.rotation.set(0, 0, turnLean * 2.5);
  torso.rotation.set(aiming ? -.025 : 0, 0, walking ? -stride * .025 : 0);
  head.rotation.set(aiming ? .018 : poseSnap(Math.sin(sampledTime * 1.7) * .012), 0, 0);
  weapon.position.set(.06, .27 + (aiming ? .012 : 0), .30 - recoil * .055);
  weapon.rotation.set(aiming ? -.012 : .028, aiming ? 0 : .055, action === "fire" ? poseSnap(Math.sin(sampledTime * 46) * .012) : -.025);

  for (const [side, sign] of [["L", -1], ["R", 1]]) {
    const legStride = stride * sign;
    joints[`EnemyHip${side}Joint`].rotation.set(walking ? legStride * .38 : 0, 0, 0);
    joints[`EnemyKnee${side}Joint`].rotation.set(walking ? Math.max(0, -legStride) * .38 : 0, 0, 0);
    joints[`EnemyAnkle${side}Joint`].rotation.set(walking ? -legStride * .12 : 0, 0, 0);
    const shoulder = joints[`EnemyShoulder${side}Joint`];
    const elbow = joints[`EnemyElbow${side}Joint`];
    shoulder.rotation.set((aiming ? -.14 : -.05) - (walking ? legStride * .15 : 0), 0, sign * .055);
    elbow.rotation.set(aiming ? -.11 : -.035, 0, sign * (aiming ? .08 : .045));
  }
  root.userData.muzzleFlash.visible = action === "fire" && recoil > .08;
  root.userData.pose = action;
  root.userData.poseStride = stride;
  root.userData.poseFrame = poseFrame;
}

export function setVoxelEnemyHighDetail(root, highDetail) {
  const enabled = Boolean(highDetail);
  if (!root || root.userData.highDetail === enabled) return;
  root.userData.highDetail = enabled;
  for (const mesh of root.userData.lodDetailMeshes || []) mesh.visible = enabled;
}

export function setVoxelEnemyHit(root, active) {
  if (root.userData.hitActive === active) return;
  root.userData.hitActive = active;
  root.userData.visualMaterials.forEach((material, index) => {
    if (active) material.emissive.setHex(0xff6b3d);
    else material.emissive.copy(root.userData.baseEmissive[index]);
  });
  if (root.userData.pixelCover) root.userData.pixelCover.material.color.setHex(active ? 0xffa080 : 0xffffff);
}

function weaponMaterial(color, metalness = .35) {
  return standard(color, { metalness, roughness: .56, emissiveLift: .34, emissiveIntensity: 1, depthTest: false, depthWrite: false, transparent: true });
}

export function createFirstPersonWeapon(ads = false) {
  const root = new THREE.Group();
  root.name = ads ? "VoxelWeaponADS" : "VoxelWeaponHip";
  const materials = {
    gun: weaponMaterial(0x59645d, .52),
    dark: weaponMaterial(0x252b2c, .42),
    rail: weaponMaterial(0x85877a, .62),
    optic: weaponMaterial(0x596266, .55),
    sleeve: weaponMaterial(0x9a7952, .04),
    glove: weaponMaterial(0x3b3b37, .08),
    dot: standard(0xff3f2f, { emissive: 0xff3f2f, emissiveIntensity: 2.2, depthTest: false, depthWrite: false, transparent: true })
  };
  const y = ads ? -.23 : 0;
  addBlock(root, "Receiver", [.18, .13, .34], [0, y, -.02], materials.gun);
  addBlock(root, "Handguard", [.15, .12, .36], [0, y + .01, -.36], materials.gun);
  addBlock(root, "TopRail", [.13, .025, .52], [0, y + .085, -.2], materials.rail);
  addBlock(root, "Barrel", [.045, .045, .34], [0, y + .02, -.68], materials.dark);
  addBlock(root, "Muzzle", [.075, .075, .1], [0, y + .02, -.89], materials.dark);
  addBlock(root, "Stock", [.2, .15, .25], [0, y - .005, .27], materials.gun);
  addBlock(root, "Grip", [.085, .2, .105], [0, y - .145, .1], materials.dark, [-.12, 0, 0]);
  addBlock(root, "Magazine", [.105, .24, .13], [0, y - .17, -.08], materials.dark, [-.16, 0, 0]);

  const sightY = ads ? 0 : y + .16;
  addBlock(root, "SightTop", [.21, .032, .055], [0, sightY + .095, -.02], materials.optic);
  addBlock(root, "SightBottom", [.21, .04, .07], [0, sightY - .095, -.02], materials.optic);
  addBlock(root, "SightLeft", [.035, .19, .06], [-.088, sightY, -.02], materials.optic);
  addBlock(root, "SightRight", [.035, .19, .06], [.088, sightY, -.02], materials.optic);
  addBlock(root, "SightDot", [.009, .009, .012], [0, sightY, -.055], materials.dot, [0, 0, 0], false);

  const handY = ads ? -.36 : -.12;
  addBlock(root, "HandL", [.14, .13, .18], [-.13, handY, -.23], materials.glove, [.12, 0, -.12]);
  addBlock(root, "HandR", [.14, .13, .18], [.13, handY, .04], materials.glove, [-.12, 0, .12]);
  addBlock(root, "ArmL", [.18, .45, .2], [-.27, handY - .2, .02], materials.sleeve, [.46, 0, -.22]);
  addBlock(root, "ArmR", [.18, .45, .2], [.27, handY - .2, .2], materials.sleeve, [.42, 0, .22]);

  root.userData.materials = Object.values(materials);
  root.userData.weapon3D = true;
  root.userData.opticalCenter = ads ? { x: 0, y: 0 } : null;
  root.traverse(object => {
    if (object.isMesh || object.isLineSegments) object.renderOrder = 1000;
    if (object.isLineSegments) object.material.opacity = .38;
  });
  return root;
}

export function setVoxelOpacity(root, opacity) {
  root.userData.materials.forEach(material => {
    const transparent = Boolean(material.userData.pixelCover) || opacity < .999;
    if (material.transparent !== transparent) material.needsUpdate = true;
    material.opacity = opacity;
    material.transparent = transparent;
  });
  root.visible = opacity > .01;
  root.userData.opacity = opacity;
}

export function createVoxelThrowable(kind) {
  const root = new THREE.Group();
  root.name = kind === "smoke" ? "VoxelSmokeCanister" : "VoxelFragGrenade";
  const body = standard(kind === "smoke" ? 0x4f7770 : 0x48523d, { metalness: .45, roughness: .62 });
  const dark = standard(0x1b2220, { metalness: .5, roughness: .55 });
  const mark = standard(kind === "smoke" ? 0x5ce0d2 : 0xe9b84d, { emissive: kind === "smoke" ? 0x5ce0d2 : 0xe9b84d, emissiveIntensity: .7 });
  if (kind === "smoke") {
    const canister = new THREE.Mesh(new THREE.CylinderGeometry(.065, .065, .2, 8), body);
    canister.rotation.z = Math.PI / 2;
    canister.castShadow = true;
    root.add(canister);
    addBlock(root, "SmokeCap", [.045, .09, .09], [.115, 0, 0], dark);
    addBlock(root, "SmokeBand", [.035, .135, .135], [-.015, 0, 0], mark);
  } else {
    addBlock(root, "FragCore", [.14, .14, .14], [0, 0, 0], body);
    addBlock(root, "FragTop", [.07, .065, .07], [0, .1, 0], dark);
    addBlock(root, "FragLever", [.035, .12, .045], [.065, .13, 0], mark, [0, 0, -.25]);
  }
  root.userData.throwable3D = true;
  return root;
}

export function createVoxelSmokeCloud() {
  const root = new THREE.Group();
  root.name = "VoxelSmokeVolume";
  const colors = [0x60766f, 0x76877d, 0x4f625d];
  const materials = colors.map(color => new THREE.MeshStandardMaterial({
    color, transparent: true, opacity: 0, depthWrite: false, roughness: 1, metalness: 0, flatShading: true
  }));
  for (let i = 0; i < 26; i++) {
    const angle = i * 2.399963;
    const ring = .28 + (i % 7) * .19;
    const size = .34 + (i % 5) * .075;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size * (.78 + (i % 3) * .12), size), materials[i % materials.length]);
    mesh.position.set(Math.cos(angle) * ring, .22 + (i % 6) * .22, Math.sin(angle) * ring);
    mesh.rotation.set(i * .19, i * .31, i * .13);
    mesh.renderOrder = 18;
    root.add(mesh);
  }
  root.userData.materials = materials;
  root.userData.smoke3D = true;
  return root;
}
