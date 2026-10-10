import * as THREE from "./vendor/three.module.js";

const TEAM_COLORS = {
  coop: { armor: 0x4d5c56, cloth: 0x647265, dark: 0x242a2c, plate: 0x3d9690, visor: 0x55eee0, light: 0xe8b84d },
  rival: { armor: 0x6e3533, cloth: 0x5c3335, dark: 0x291b1d, plate: 0xb54842, visor: 0xff6c58, light: 0xffb34a }
};

export function setVoxelOperatorTeam(operator, team = "coop") {
  const colors = TEAM_COLORS[team] || TEAM_COLORS.coop;
  const materials = operator.userData.materials;
  if (!materials) return;
  materials.armor.color.setHex(colors.armor);
  materials.armor.emissive.setHex(colors.armor).multiplyScalar(.08);
  materials.cloth.color.setHex(colors.cloth);
  materials.cloth.emissive.setHex(colors.cloth).multiplyScalar(.07);
  materials.dark.color.setHex(colors.dark);
  materials.plate.color.setHex(colors.plate);
  materials.plate.emissive.setHex(colors.plate).multiplyScalar(.12);
  materials.visor.color.setHex(colors.visor);
  materials.visor.emissive.setHex(colors.visor);
  materials.light.color.setHex(colors.light);
  materials.light.emissive.setHex(colors.light);
  if (operator.userData.pixelSkinMaterial) {
    operator.userData.pixelSkinMaterial.color.setHex(0xffffff);
  }
  operator.userData.team = team;
}

export function applyVoxelOperatorPixelSkin(operator, texture) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color: 0xffffff,
    transparent: true,
    opacity: .48,
    alphaTest: .075,
    depthTest: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });
  material.userData.baseOpacity = .48;
  const blocks = operator.children.filter(object => object.isMesh && !object.userData.operatorHitbox);
  const skins = [];
  for (const block of blocks) {
    const skin = new THREE.Mesh(block.geometry, material);
    skin.name = `${block.name}PixelSkin3D`;
    skin.scale.setScalar(1.018);
    skin.renderOrder = 4;
    skin.raycast = () => {};
    skin.castShadow = false;
    skin.receiveShadow = false;
    skin.userData.pixelSkin3D = true;
    block.add(skin);
    skins.push(skin);
  }
  operator.userData.pixelSkinMaterial = material;
  operator.userData.pixelSkinMeshes = skins;
  operator.userData.pixelSkin3D = true;
  operator.userData.renderMode = "3d-blocks-chatgpt-pixel-skin";
  setVoxelOperatorTeam(operator, operator.userData.team || "coop");
  return operator;
}

export function createVoxelOperator(team = "coop") {
  const operator = new THREE.Group();
  operator.name = "VoxelOperator3D";

  const materials = {
    armor: new THREE.MeshStandardMaterial({ color: 0x465155, emissive: 0x080b0c, emissiveIntensity: .55, roughness: .58, metalness: .42, flatShading: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x242a2c, emissive: 0x030404, emissiveIntensity: .45, roughness: .8, metalness: .18, flatShading: true }),
    cloth: new THREE.MeshStandardMaterial({ color: 0x56645d, emissive: 0x070908, emissiveIntensity: .5, roughness: .92, metalness: .04, flatShading: true }),
    plate: new THREE.MeshStandardMaterial({ color: 0x3d9690, emissive: 0x071312, emissiveIntensity: .6, roughness: .55, metalness: .34, flatShading: true }),
    visor: new THREE.MeshStandardMaterial({ color: 0x55eee0, emissive: 0x55eee0, emissiveIntensity: 1.5, roughness: .25, metalness: .24, flatShading: true }),
    light: new THREE.MeshStandardMaterial({ color: 0xe8b84d, emissive: 0xe8b84d, emissiveIntensity: 1.15, roughness: .3, metalness: .2, flatShading: true })
  };
  operator.userData.materials = materials;
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x07100f, transparent: true, opacity: .72 });
  operator.userData.edgeMaterial = edgeMaterial;

  const part = (name, size, position, material, rotation = [0, 0, 0]) => {
    const geometry = new THREE.BoxGeometry(...size);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.operatorRoot = operator;
    if (name !== "OperatorHitbox") {
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
      edges.name = `${name}BlockEdges`;
      edges.renderOrder = 3;
      mesh.add(edges);
    }
    operator.add(mesh);
    return mesh;
  };

  // Feet, articulated legs, and armor plates.
  part("BootL", [.18, .11, .28], [-.13, .055, .025], materials.dark);
  part("BootR", [.18, .11, .28], [.13, .055, .025], materials.dark);
  part("ShinL", [.14, .27, .15], [-.13, .235, 0], materials.cloth, [0, 0, -.035]);
  part("ShinR", [.14, .27, .15], [.13, .235, 0], materials.cloth, [0, 0, .035]);
  part("KneeL", [.18, .14, .07], [-.13, .385, .095], materials.plate);
  part("KneeR", [.18, .14, .07], [.13, .385, .095], materials.plate);
  part("ThighL", [.17, .25, .18], [-.13, .49, 0], materials.armor);
  part("ThighR", [.17, .25, .18], [.13, .49, 0], materials.armor);

  // Torso, webbing, backpack, shoulder armor, and arms.
  part("Pelvis", [.42, .18, .25], [0, .59, 0], materials.dark);
  part("Torso", [.48, .39, .25], [0, .79, 0], materials.cloth);
  part("ChestPlate", [.41, .29, .065], [0, .81, .155], materials.plate);
  part("ChestCore", [.15, .18, .025], [0, .8, .195], materials.armor);
  part("AmberMark", [.055, .075, .025], [0, .89, .215], materials.light);
  part("Backpack", [.34, .36, .14], [0, .8, -.19], materials.armor);
  part("ShoulderL", [.2, .18, .25], [-.32, .87, 0], materials.plate, [0, 0, -.12]);
  part("ShoulderR", [.2, .18, .25], [.32, .87, 0], materials.plate, [0, 0, .12]);
  part("UpperArmL", [.14, .27, .15], [-.34, .72, .06], materials.cloth, [-.48, 0, -.12]);
  part("UpperArmR", [.14, .27, .15], [.34, .72, .06], materials.cloth, [-.48, 0, .12]);
  part("ForearmL", [.15, .25, .16], [-.24, .72, .22], materials.armor, [1.02, 0, -.56]);
  part("ForearmR", [.15, .25, .16], [.24, .72, .22], materials.armor, [1.02, 0, .56]);
  part("GloveL", [.13, .12, .13], [-.12, .71, .33], materials.dark);
  part("GloveR", [.13, .12, .13], [.12, .71, .33], materials.dark);

  // Helmet is built from stacked hard-surface blocks with a luminous visor.
  part("Neck", [.16, .12, .15], [0, 1.005, 0], materials.dark);
  part("Helmet", [.34, .25, .29], [0, 1.075, 0], materials.armor);
  part("HelmetCrown", [.25, .07, .23], [0, 1.225, -.015], materials.plate);
  part("Visor", [.27, .075, .035], [0, 1.095, .165], materials.visor);
  part("Respirator", [.19, .09, .07], [0, 1.01, .17], materials.dark);
  part("Antenna", [.025, .25, .025], [-.135, 1.24, -.08], materials.dark, [0, 0, -.08]);
  part("AntennaTip", [.04, .045, .04], [-.145, 1.37, -.08], materials.light);

  // Compact voxel carbine held across the chest.
  part("RifleBody", [.66, .105, .105], [0, .735, .39], materials.dark);
  part("RifleRail", [.43, .035, .055], [-.04, .81, .39], materials.armor);
  part("RifleStock", [.23, .13, .08], [-.4, .74, .39], materials.armor);
  part("RifleBarrel", [.36, .045, .045], [.48, .75, .39], materials.dark);
  part("RifleMuzzle", [.1, .075, .075], [.7, .75, .39], materials.armor);
  part("RifleMag", [.12, .23, .08], [.08, .61, .39], materials.armor, [0, 0, -.18]);
  part("RifleSight", [.12, .1, .07], [.08, .855, .39], materials.plate);
  part("RifleDot", [.03, .035, .025], [.08, .87, .435], materials.light);

  // A transparent raycast volume makes online hit detection reliable while
  // every visible component remains genuine 3D geometry.
  const hitbox = part("OperatorHitbox", [.7, 1.4, .55], [0, .7, .04], new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  hitbox.castShadow = false;
  hitbox.receiveShadow = false;
  hitbox.userData.operatorHitbox = true;
  operator.userData.hitMeshes = [hitbox];
  operator.userData.voxelOperator = true;
  operator.userData.renderMode = "3d-blocks-no-sprites";
  operator.userData.visibleBlockCount = 37;
  setVoxelOperatorTeam(operator, team);
  return operator;
}
