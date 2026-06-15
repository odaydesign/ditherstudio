import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

/**
 * Layers source — real 3D stacked glass slabs (not a flat shader).
 *
 * A perspective scene of translucent rounded-glass panels stacked in space. The
 * neon lives in each gap as a pair of RectAreaLights — area lights that cast soft
 * coloured light and a crisp specular streak onto the glossy glass but render NO
 * geometry, so the light source itself is never visible in the background; you only
 * see it *reflected* on the slabs. Plus environment reflections, coloured rim
 * lights, and a gentle looping animation. Rendered into the dither pre-pass.
 *
 * Seamless loop: every animated term is sin(integer·phase) or phase·(integer turns),
 * identical at phase 0 and 2π. The studio drives phase = t·speed.
 */

export const LAYERS_LOOP_SECONDS = 14;

export interface LayersParams {
  layout: number;   // 0 stack (Y) · 1 tunnel (Z) · 2 wall (X)
  count: number;
  spacing: number;
  thickness: number;
  radius: number;
  tilt: number;     // group pitch (radians)
  roughness: number; // frost 0..1
  glow: number;      // neon light strength 0..2
  reflect: number;   // env reflection 0..1
  opacity: number;   // glass opacity 0..1
  fov: number;       // camera field of view (zoom)
  motion: number;    // 0 sway · 1 spin · 2 tumble · 3 float · 4 wave · 5 breathe
  motionAmt: number; // motion amplitude 0..1
  dir: number;       // motion direction +1 / -1
  tint: [number, number, number];  // glass colour (raw sRGB 0..1)
  glowA: [number, number, number]; // neon A
  glowB: [number, number, number]; // neon B
  bg: [number, number, number];
}

export interface LayersField {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  setParams: (p: LayersParams) => void;
  update: (phase: number) => void;
  dispose: () => void;
}

const SLAB_W = 3.5;
const SLAB_D = 2.0;

// The two axes perpendicular to the stack axis — the plane each object loops in.
function perpAxes(ax: number): [number, number] {
  if (ax === 1) return [0, 2]; // stack Y → loop in X,Z
  if (ax === 2) return [0, 1]; // tunnel Z → loop in X,Y
  return [1, 2];               // wall X → loop in Y,Z
}

let rectLibReady = false;

export function createLayersField(renderer: THREE.WebGLRenderer): LayersField {
  if (!rectLibReady) { RectAreaLightUniformsLib.init(); rectLibReady = true; }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.1, 100);
  camera.position.set(0, 0, 6.0);
  camera.lookAt(0, 0, 0);

  const group = new THREE.Group();
  scene.add(group);

  // Soft fill so the glass isn't pure black where no neon reaches — the neon
  // itself comes from the per-gap RectAreaLights built in setParams().
  const amb = new THREE.AmbientLight(0xffffff, 0.22);
  const key = new THREE.DirectionalLight(0xffffff, 0.55);
  key.position.set(2.5, 4, 5);
  const rimA = new THREE.PointLight(0x9b6bff, 9, 26, 2.0);
  rimA.position.set(-2.6, 1.8, 3.4);
  const rimB = new THREE.PointLight(0x4f7bff, 7, 26, 2.0);
  rimB.position.set(2.6, -1.8, 3.4);
  scene.add(amb, key, rimA, rimB);

  // Environment map → realistic soft reflections on the glass.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envRT = pmrem.fromScene(room, 0.04);
  scene.environment = envRT.texture;
  (room as unknown as { dispose?: () => void }).dispose?.();

  const slabs: THREE.Mesh[] = [];
  const lights: THREE.RectAreaLight[] = []; // 2 per gap (facing both adjacent slabs)
  const slabAxisBase: number[] = [];
  const slabBaseRot: THREE.Euler[] = [];
  const lightAxisBase: number[] = [];
  let axisIdx = 1;                    // stack→y(1), tunnel→z(2), wall→x(0)
  let spc = 0.6;
  let slabGeo: THREE.BufferGeometry | null = null;
  let glassMat: THREE.MeshPhysicalMaterial | null = null;
  let cur: LayersParams | null = null;

  function clear() {
    for (const m of slabs) group.remove(m);
    for (const l of lights) group.remove(l);
    slabs.length = 0; lights.length = 0;
    slabAxisBase.length = 0; slabBaseRot.length = 0; lightAxisBase.length = 0;
    slabGeo?.dispose(); slabGeo = null;
    glassMat?.dispose(); glassMat = null;
  }

  function placeSlab(slab: THREE.Mesh, layout: number, off: number) {
    if (layout === 1) { slab.position.z = off; slab.rotation.x = -Math.PI / 2; }      // tunnel
    else if (layout === 2) { slab.position.x = off; slab.rotation.z = Math.PI / 2; }   // wall
    else { slab.position.y = off; }                                                    // stack
  }

  // A slab is thin along the stack axis, so its broad faces' normals point ±axis.
  // Place an area light at the gap centre aimed along the axis toward the adjacent
  // slab face. `sign` = +1 aims toward +axis, -1 toward -axis.
  function aimGapLight(light: THREE.RectAreaLight, layout: number, mid: number, sign: number) {
    if (layout === 1) {            // tunnel — axis Z
      light.position.set(0, 0, mid);
      light.rotation.set(sign > 0 ? Math.PI : 0, 0, 0);
    } else if (layout === 2) {     // wall — axis X
      light.position.set(mid, 0, 0);
      light.rotation.set(0, sign > 0 ? -Math.PI / 2 : Math.PI / 2, 0);
    } else {                       // stack — axis Y
      light.position.set(0, mid, 0);
      light.rotation.set(sign > 0 ? Math.PI / 2 : -Math.PI / 2, 0, 0);
    }
  }

  function setParams(p: LayersParams) {
    cur = p;
    clear();
    axisIdx = p.layout === 1 ? 2 : p.layout === 2 ? 0 : 1;
    spc = p.spacing;
    camera.fov = p.fov;
    camera.updateProjectionMatrix();
    const n = Math.max(2, Math.round(p.count));
    const T = Math.max(p.thickness, 0.02);
    const rad = Math.min(p.radius, Math.min(SLAB_W, SLAB_D, T) * 0.49);

    slabGeo = new RoundedBoxGeometry(SLAB_W, T, SLAB_D, 6, Math.max(rad, 0.001));
    glassMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color().setRGB(p.tint[0], p.tint[1], p.tint[2], THREE.SRGBColorSpace),
      metalness: 0.0,
      roughness: 0.04 + p.roughness * 0.5,
      transparent: true,
      opacity: p.opacity,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06 + p.roughness * 0.22,
      ior: 1.45,
      reflectivity: 0.6,
      envMapIntensity: p.reflect * 1.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const span = (n - 1) * p.spacing;
    for (let i = 0; i < n; i++) {
      const off = i * p.spacing - span / 2;
      const slab = new THREE.Mesh(slabGeo, glassMat);
      placeSlab(slab, p.layout, off);
      slab.renderOrder = 2;
      group.add(slab);
      slabs.push(slab);
      slabAxisBase.push(off);
      slabBaseRot.push(slab.rotation.clone());
    }

    // Neon in each gap: two RectAreaLights aimed at the adjacent slab faces.
    const lw = SLAB_W * 0.92, lh = SLAB_D * 0.92;
    const baseI = p.glow * 4.4;
    for (let i = 0; i < n - 1; i++) {
      const mid = (i * p.spacing - span / 2) + p.spacing * 0.5;
      const col = i % 2 === 0 ? p.glowA : p.glowB; // alternate neon A / B per gap
      for (const sign of [1, -1]) {
        const light = new THREE.RectAreaLight(0xffffff, baseI, lw, lh);
        light.color.setRGB(col[0], col[1], col[2], THREE.SRGBColorSpace);
        aimGapLight(light, p.layout, mid, sign);
        group.add(light);
        lights.push(light);
        lightAxisBase.push(light.position.getComponent(axisIdx));
      }
    }

    scene.background = new THREE.Color().setRGB(p.bg[0], p.bg[1], p.bg[2], THREE.SRGBColorSpace);
    rimA.color.setRGB(p.glowA[0], p.glowA[1], p.glowA[2], THREE.SRGBColorSpace);
    rimB.color.setRGB(p.glowB[0], p.glowB[1], p.glowB[2], THREE.SRGBColorSpace);
  }

  function update(phase: number) {
    const p = cur;
    if (!p) return;
    const dir = p.dir >= 0 ? 1 : -1;
    const amt = p.motionAmt;
    const mode = Math.round(p.motion);
    const ax = axisIdx;

    // Reset to base each frame, then layer on the active motion.
    group.rotation.set(p.tilt, 0, 0);
    for (let i = 0; i < slabs.length; i++) { slabs[i].position.setComponent(ax, slabAxisBase[i]); slabs[i].rotation.copy(slabBaseRot[i]); }
    for (let i = 0; i < lights.length; i++) lights[i].position.setComponent(ax, lightAxisBase[i]);

    if (mode === 1) {                 // Spin — continuous full turns
      const turns = Math.max(1, Math.round(1 + amt * 2));
      group.rotation.y = phase * turns * dir;
    } else if (mode === 2) {          // Tumble — spin + nod
      const turns = Math.max(1, Math.round(1 + amt * 2));
      group.rotation.y = phase * turns * dir;
      group.rotation.x = p.tilt + Math.sin(phase) * (0.15 + amt * 0.5);
    } else if (mode === 3) {          // Float — gaps breathe unevenly
      const a = spc * (0.12 + amt * 0.6);
      for (let i = 0; i < slabs.length; i++) slabs[i].position.setComponent(ax, slabAxisBase[i] + Math.sin(phase + i * 0.7) * a);
      for (let i = 0; i < lights.length; i++) lights[i].position.setComponent(ax, lightAxisBase[i] + Math.sin(phase + (Math.floor(i / 2) + 0.5) * 0.7) * a);
    } else if (mode === 4) {          // Wave — travelling ripple through the stack
      const a = spc * (0.12 + amt * 0.7);
      for (let i = 0; i < slabs.length; i++) slabs[i].position.setComponent(ax, slabAxisBase[i] + Math.sin(phase - i * 0.9) * a);
      for (let i = 0; i < lights.length; i++) lights[i].position.setComponent(ax, lightAxisBase[i] + Math.sin(phase - (Math.floor(i / 2) + 0.5) * 0.9) * a);
    } else if (mode === 5) {          // Breathe — whole stack expands/contracts
      const sc = 1 + Math.sin(phase) * (0.08 + amt * 0.45);
      for (let i = 0; i < slabs.length; i++) slabs[i].position.setComponent(ax, slabAxisBase[i] * sc);
      for (let i = 0; i < lights.length; i++) lights[i].position.setComponent(ax, lightAxisBase[i] * sc);
    } else if (mode === 6) {          // Orbit — each card loops a circle, phase-staggered
      const [pa, pb] = perpAxes(ax);
      const r = 0.12 + amt * 0.7;
      const spread = (2 * Math.PI) / Math.max(slabs.length, 1);
      const ph = phase * dir;
      for (let i = 0; i < slabs.length; i++) {
        slabs[i].position.setComponent(pa, Math.cos(ph + i * spread) * r);
        slabs[i].position.setComponent(pb, Math.sin(ph + i * spread) * r);
      }
      for (let i = 0; i < lights.length; i++) {
        const o = (Math.floor(i / 2) + 0.5) * spread;
        lights[i].position.setComponent(pa, Math.cos(ph + o) * r);
        lights[i].position.setComponent(pb, Math.sin(ph + o) * r);
      }
    } else if (mode === 7) {          // Figure-8 — each card traces a lissajous loop
      const [pa, pb] = perpAxes(ax);
      const r = 0.12 + amt * 0.75;
      const spread = (2 * Math.PI) / Math.max(slabs.length, 1);
      const ph = phase * dir;
      for (let i = 0; i < slabs.length; i++) {
        slabs[i].position.setComponent(pa, Math.sin(ph + i * spread) * r);
        slabs[i].position.setComponent(pb, Math.sin(2 * (ph + i * spread)) * r * 0.6);
      }
      for (let i = 0; i < lights.length; i++) {
        const o = (Math.floor(i / 2) + 0.5) * spread;
        lights[i].position.setComponent(pa, Math.sin(ph + o) * r);
        lights[i].position.setComponent(pb, Math.sin(2 * (ph + o)) * r * 0.6);
      }
    } else if (mode === 8) {          // Pendulum — each card swings, phase-staggered ripple
      const spread = (2 * Math.PI) / Math.max(slabs.length, 1);
      const amp = 0.18 + amt * 0.8;
      const ph = phase * dir;
      for (let i = 0; i < slabs.length; i++) slabs[i].rotation.x = slabBaseRot[i].x + Math.sin(ph + i * spread) * amp;
    } else {                          // Sway — gentle rock (default)
      group.rotation.y = Math.sin(phase) * (0.12 + amt * 0.5) * dir;
      group.rotation.x = p.tilt + Math.sin(phase * 2.0) * 0.04;
    }

    // Gentle neon pulse (per gap → /2 because two lights share a gap).
    const baseI = p.glow * 4.4;
    for (let i = 0; i < lights.length; i++) {
      const pulse = 0.78 + 0.22 * Math.sin(phase * 2.0 + Math.floor(i / 2) * 0.9);
      lights[i].intensity = baseI * pulse;
    }
  }

  function dispose() {
    clear();
    scene.environment = null;
    envRT.texture.dispose();
    pmrem.dispose();
  }

  return { scene, camera, setParams, update, dispose };
}
