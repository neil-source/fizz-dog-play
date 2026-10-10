import * as THREE from "./vendor/three.module.js";
import { createVoxelOperator, setVoxelOperatorTeam } from "./voxel-operator.js";

const canvas = document.querySelector("#operator");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1);
renderer.setSize(960, 540, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x08100e, .12);
const camera = new THREE.PerspectiveCamera(36, 16 / 9, .05, 30);
camera.position.set(.28, 1.08, 3.55);

const operator = createVoxelOperator("coop");
operator.scale.setScalar(1.35);
operator.position.y = .02;
scene.add(operator);

const floor = new THREE.Mesh(
  new THREE.CylinderGeometry(1.15, 1.28, .12, 12),
  new THREE.MeshStandardMaterial({ color: 0x182421, roughness: .65, metalness: .42, flatShading: true })
);
floor.position.y = -.06;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(8, 32, 0x315e57, 0x172a27);
grid.position.y = -.001;
scene.add(grid);

scene.add(new THREE.HemisphereLight(0x9fd9ce, 0x1c140e, 1.7));
const key = new THREE.DirectionalLight(0xffd28c, 3.2);
key.position.set(2.8, 4.5, 3.2);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
scene.add(key);
const rim = new THREE.PointLight(0x55eee0, 8, 7, 2);
rim.position.set(-2.2, 1.7, -.8);
scene.add(rim);

let dragging = false;
let pointerX = 0;
let targetYaw = -.58;
let yaw = targetYaw;
let cameraDistance = 3.55;
let rival = false;
let previousCross = false;

canvas.addEventListener("pointerdown", event => {
  dragging = true;
  pointerX = event.clientX;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", event => {
  if (!dragging) return;
  targetYaw += (event.clientX - pointerX) * .012;
  pointerX = event.clientX;
});
canvas.addEventListener("pointerup", () => { dragging = false; });
canvas.addEventListener("wheel", event => {
  cameraDistance = THREE.MathUtils.clamp(cameraDistance + Math.sign(event.deltaY) * .18, 2.6, 4.6);
  event.preventDefault();
}, { passive: false });

function pollDualSense(dt) {
  const pad = navigator.getGamepads?.().find(Boolean);
  if (!pad) return;
  const axis = Math.abs(pad.axes[2] || 0) > .16 ? pad.axes[2] : 0;
  targetYaw += axis * dt * 2.5;
  if (pad.buttons[4]?.pressed) cameraDistance = Math.max(2.6, cameraDistance - dt * 1.5);
  if (pad.buttons[5]?.pressed) cameraDistance = Math.min(4.6, cameraDistance + dt * 1.5);
  const cross = Boolean(pad.buttons[0]?.pressed);
  if (cross && !previousCross) {
    rival = !rival;
    setVoxelOperatorTeam(operator, rival ? "rival" : "coop");
  }
  previousCross = cross;
}

let lastTime = performance.now();
renderer.setAnimationLoop(now => {
  const dt = Math.min(.05, (now - lastTime) / 1000);
  lastTime = now;
  pollDualSense(dt);
  if (!dragging && Math.abs(targetYaw - yaw) < .015) targetYaw += dt * .16;
  yaw += (targetYaw - yaw) * Math.min(1, dt * 8);
  operator.rotation.y = yaw;
  camera.position.z += (cameraDistance - camera.position.z) * Math.min(1, dt * 7);
  camera.lookAt(0, .82, 0);
  renderer.render(scene, camera);
});

window.__operatorShowcase = { renderer, scene, camera, operator };
