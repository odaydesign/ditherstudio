import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

/**
 * Layers source — real 3D stacked glass objects (not a flat shader).
 *
 * A perspective scene of translucent rounded-glass objects stacked in space, lit by
 * per-gap RectAreaLights (area lights that cast colour + a specular streak onto the
 * glass but render no geometry — the source stays hidden, only the reflection shows),
 * plus environment reflections and coloured rim lights.
 *
 * Two animation regimes, both seamless loops (every term is sin(integer·phase) or
 * phase·integer-turns, identical at phase 0 and 2π; the studio drives phase = t·speed):
 *  - Uniform: one of 9 motion modes applied to every object.
 *  - Variety: each object gets its own shape (card/ring/disc/hex/bar/gem) AND its own
 *    looping behaviour (bob/orbit/spin/figure-8/pendulum/pulse), phase-staggered.
 */

export const LAYERS_LOOP_SECONDS = 14;

export type LayersShape = 'card' | 'ring' | 'disc' | 'hex' | 'bar' | 'gem';
const SHAPE_KEYS: LayersShape[] = ['card', 'ring', 'disc', 'hex', 'bar', 'gem'];
const N_BEHAVIORS = 6; // bob · orbit · spin · figure-8 · pendulum · pulse

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
  motion: number;    // uniform mode: 0 sway·1 spin·2 tumble·3 float·4 wave·5 breathe·6 orbit·7 figure-8·8 pendulum
  motionAmt: number; // motion amplitude 0..1
  dir: number;       // motion direction +1 / -1
  variety: boolean;  // per-object mixed shapes + behaviours
  seed: number;      // shuffles the variety shape/behaviour assignment
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

// Geometry per shape, baked "flat in Y" so the layout rotation applies uniformly.
function makeGeometry(shape: LayersShape, T: number, rad: number): THREE.BufferGeometry {
  const t = Math.max(T, 0.02);
  switch (shape) {
    case 'ring': { const g = new THREE.TorusGeometry(1.25, Math.max(t * 1.1, 0.13), 20, 64); g.rotateX(Math.PI / 2); return g; }
    case 'disc': return new THREE.CylinderGeometry(1.4, 1.4, t, 64);
    case 'hex':  return new THREE.CylinderGeometry(1.5, 1.5, t, 6);
    case 'bar':  return new RoundedBoxGeometry(SLAB_W * 0.62, t, SLAB_D * 0.4, 5, Math.min(rad, t * 0.49, 0.06) || 0.001);
    case 'gem':  { const g = new THREE.OctahedronGeometry(1.25, 0); g.scale(1, 0.62, 1); return g; }
    case 'card':
    default:     return new RoundedBoxGeometry(SLAB_W, t, SLAB_D, 6, Math.max(Math.min(rad, Math.min(SLAB_W, SLAB_D, t) * 0.49), 0.001));
  }
}

const _q = new THREE.Quaternion();
const _yAxis = new THREE.Vector3(0, 1, 0);
const _xAxis = new THREE.Vector3(1, 0, 0);

let rectLibReady = false;

export function createLayersField(renderer: THREE.WebGLRenderer): LayersField {
  if (!rectLibReady) { RectAreaLightUniformsLib.init(); rectLibReady = true; }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.1, 100);
  camera.position.set(0, 0, 6.0);
  camera.lookAt(0, 0, 0);

  const group = new THREE.Group();
  scene.add(group);

  const amb = new THREE.AmbientLight(0xffffff, 0.22);
  const key = new THREE.DirectionalLight(0xffffff, 0.55);
  key.position.set(2.5, 4, 5);
  const rimA = new THREE.PointLight(0x9b6bff, 9, 26, 2.0);
  rimA.position.set(-2.6, 1.8, 3.4);
  const rimB = new THREE.PointLight(0x4f7bff, 7, 26, 2.0);
  rimB.position.set(2.6, -1.8, 3.4);
  scene.add(amb, key, rimA, rimB);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envRT = pmrem.fromScene(room, 0.04);
  scene.environment = envRT.texture;
  (room as unknown as { dispose?: () => void }).dispose?.();

  const slabs: THREE.Mesh[] = [];
  const lights: THREE.RectAreaLight[] = [];
  const slabAxisBase: number[] = [];
  const slabBaseRot: THREE.Euler[] = [];
  const slabBaseQuat: THREE.Quaternion[] = [];
  const objBehavior: number[] = []; // variety: per-object behaviour index
  const lightAxisBase: number[] = [];
  const geoCache = new Map<string, THREE.BufferGeometry>();
  let axisIdx = 1;
  let spc = 0.6;
  let glassMat: THREE.MeshPhysicalMaterial | null = null;
  let cur: LayersParams | null = null;

  function geoFor(shape: LayersShape, T: number, rad: number): THREE.BufferGeometry {
    const k = `${shape}|${T.toFixed(3)}|${rad.toFixed(3)}`;
    let g = geoCache.get(k);
    if (!g) { g = makeGeometry(shape, T, rad); geoCache.set(k, g); }
    return g;
  }

  function clear() {
    for (const m of slabs) group.remove(m);
    for (const l of lights) group.remove(l);
    slabs.length = 0; lights.length = 0;
    slabAxisBase.length = 0; slabBaseRot.length = 0; slabBaseQuat.length = 0;
    objBehavior.length = 0; lightAxisBase.length = 0;
    for (const g of geoCache.values()) g.dispose();
    geoCache.clear();
    glassMat?.dispose(); glassMat = null;
  }

  function placeSlab(slab: THREE.Mesh, layout: number, off: number) {
    if (layout === 1) { slab.position.z = off; slab.rotation.x = -Math.PI / 2; }
    else if (layout === 2) { slab.position.x = off; slab.rotation.z = Math.PI / 2; }
    else { slab.position.y = off; }
  }

  function aimGapLight(light: THREE.RectAreaLight, layout: number, mid: number, sign: number) {
    if (layout === 1) { light.position.set(0, 0, mid); light.rotation.set(sign > 0 ? Math.PI : 0, 0, 0); }
    else if (layout === 2) { light.position.set(mid, 0, 0); light.rotation.set(0, sign > 0 ? -Math.PI / 2 : Math.PI / 2, 0); }
    else { light.position.set(0, mid, 0); light.rotation.set(sign > 0 ? Math.PI / 2 : -Math.PI / 2, 0, 0); }
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
    const seed = Math.max(0, Math.round(p.seed));

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
      const shape: LayersShape = p.variety ? SHAPE_KEYS[(i + seed) % SHAPE_KEYS.length] : 'card';
      const slab = new THREE.Mesh(geoFor(shape, T, p.radius), glassMat);
      placeSlab(slab, p.layout, off);
      slab.renderOrder = 2;
      group.add(slab);
      slabs.push(slab);
      slabAxisBase.push(off);
      slabBaseRot.push(slab.rotation.clone());
      slabBaseQuat.push(slab.quaternion.clone());
      objBehavior.push((i * 2 + seed) % N_BEHAVIORS);
    }

    const lw = SLAB_W * 0.92, lh = SLAB_D * 0.92;
    const baseI = p.glow * 4.4;
    for (let i = 0; i < n - 1; i++) {
      const mid = (i * p.spacing - span / 2) + p.spacing * 0.5;
      const col = i % 2 === 0 ? p.glowA : p.glowB;
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

  // Variety: apply object i's own looping behaviour at staggered phase `ph`.
  function applyBehavior(i: number, behavior: number, ph: number, amt: number, pa: number, pb: number) {
    const o = slabs[i];
    const r = 0.15 + amt * 0.7;
    if (behavior === 0) {                 // bob along axis
      o.position.setComponent(axisIdx, slabAxisBase[i] + Math.sin(ph) * spc * (0.15 + amt * 0.6));
    } else if (behavior === 1) {          // orbit
      o.position.setComponent(pa, Math.cos(ph) * r);
      o.position.setComponent(pb, Math.sin(ph) * r);
    } else if (behavior === 2) {          // self-spin about its flat normal
      _q.setFromAxisAngle(_yAxis, ph * Math.max(1, Math.round(1 + amt * 2)));
      o.quaternion.multiplyQuaternions(slabBaseQuat[i], _q);
    } else if (behavior === 3) {          // figure-8
      o.position.setComponent(pa, Math.sin(ph) * r);
      o.position.setComponent(pb, Math.sin(2 * ph) * r * 0.6);
    } else if (behavior === 4) {          // pendulum swing
      _q.setFromAxisAngle(_xAxis, Math.sin(ph) * (0.2 + amt * 0.7));
      o.quaternion.multiplyQuaternions(slabBaseQuat[i], _q);
    } else {                              // pulse scale
      o.scale.setScalar(1 + Math.sin(ph) * (0.08 + amt * 0.32));
    }
  }

  function update(phase: number) {
    const p = cur;
    if (!p) return;
    const dir = p.dir >= 0 ? 1 : -1;
    const amt = p.motionAmt;
    const ax = axisIdx;
    const [pa, pb] = perpAxes(ax);

    // Reset to base each frame.
    group.rotation.set(p.tilt, 0, 0);
    for (let i = 0; i < slabs.length; i++) {
      slabs[i].position.setComponent(ax, slabAxisBase[i]);
      slabs[i].position.setComponent(pa, 0);
      slabs[i].position.setComponent(pb, 0);
      slabs[i].quaternion.copy(slabBaseQuat[i]);
      slabs[i].scale.setScalar(1);
    }
    for (let i = 0; i < lights.length; i++) lights[i].position.setComponent(ax, lightAxisBase[i]);

    if (p.variety) {
      // Each object loops on its own behaviour, phase-staggered.
      const spread = (2 * Math.PI) / Math.max(slabs.length, 1);
      for (let i = 0; i < slabs.length; i++) applyBehavior(i, objBehavior[i], phase * dir + i * spread, amt, pa, pb);
      for (let i = 0; i < lights.length; i++) {
        const pulse = 0.78 + 0.22 * Math.sin(phase * 2.0 + Math.floor(i / 2) * 0.9);
        lights[i].intensity = p.glow * 4.4 * pulse;
      }
      return;
    }

    const mode = Math.round(p.motion);
    if (mode === 1) {                 // Spin
      group.rotation.y = phase * Math.max(1, Math.round(1 + amt * 2)) * dir;
    } else if (mode === 2) {          // Tumble
      group.rotation.y = phase * Math.max(1, Math.round(1 + amt * 2)) * dir;
      group.rotation.x = p.tilt + Math.sin(phase) * (0.15 + amt * 0.5);
    } else if (mode === 3) {          // Float
      const a = spc * (0.12 + amt * 0.6);
      for (let i = 0; i < slabs.length; i++) slabs[i].position.setComponent(ax, slabAxisBase[i] + Math.sin(phase + i * 0.7) * a);
      for (let i = 0; i < lights.length; i++) lights[i].position.setComponent(ax, lightAxisBase[i] + Math.sin(phase + (Math.floor(i / 2) + 0.5) * 0.7) * a);
    } else if (mode === 4) {          // Wave
      const a = spc * (0.12 + amt * 0.7);
      for (let i = 0; i < slabs.length; i++) slabs[i].position.setComponent(ax, slabAxisBase[i] + Math.sin(phase - i * 0.9) * a);
      for (let i = 0; i < lights.length; i++) lights[i].position.setComponent(ax, lightAxisBase[i] + Math.sin(phase - (Math.floor(i / 2) + 0.5) * 0.9) * a);
    } else if (mode === 5) {          // Breathe
      const sc = 1 + Math.sin(phase) * (0.08 + amt * 0.45);
      for (let i = 0; i < slabs.length; i++) slabs[i].position.setComponent(ax, slabAxisBase[i] * sc);
      for (let i = 0; i < lights.length; i++) lights[i].position.setComponent(ax, lightAxisBase[i] * sc);
    } else if (mode === 6) {          // Orbit (whole stack, staggered)
      const r = 0.12 + amt * 0.7;
      const spread = (2 * Math.PI) / Math.max(slabs.length, 1);
      const ph = phase * dir;
      for (let i = 0; i < slabs.length; i++) { slabs[i].position.setComponent(pa, Math.cos(ph + i * spread) * r); slabs[i].position.setComponent(pb, Math.sin(ph + i * spread) * r); }
      for (let i = 0; i < lights.length; i++) { const o = (Math.floor(i / 2) + 0.5) * spread; lights[i].position.setComponent(pa, Math.cos(ph + o) * r); lights[i].position.setComponent(pb, Math.sin(ph + o) * r); }
    } else if (mode === 7) {          // Figure-8
      const r = 0.12 + amt * 0.75;
      const spread = (2 * Math.PI) / Math.max(slabs.length, 1);
      const ph = phase * dir;
      for (let i = 0; i < slabs.length; i++) { slabs[i].position.setComponent(pa, Math.sin(ph + i * spread) * r); slabs[i].position.setComponent(pb, Math.sin(2 * (ph + i * spread)) * r * 0.6); }
      for (let i = 0; i < lights.length; i++) { const o = (Math.floor(i / 2) + 0.5) * spread; lights[i].position.setComponent(pa, Math.sin(ph + o) * r); lights[i].position.setComponent(pb, Math.sin(2 * (ph + o)) * r * 0.6); }
    } else if (mode === 8) {          // Pendulum
      const spread = (2 * Math.PI) / Math.max(slabs.length, 1);
      const amp = 0.18 + amt * 0.8;
      const ph = phase * dir;
      for (let i = 0; i < slabs.length; i++) slabs[i].rotation.x = slabBaseRot[i].x + Math.sin(ph + i * spread) * amp;
    } else {                          // Sway (default)
      group.rotation.y = Math.sin(phase) * (0.12 + amt * 0.5) * dir;
      group.rotation.x = p.tilt + Math.sin(phase * 2.0) * 0.04;
    }

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
