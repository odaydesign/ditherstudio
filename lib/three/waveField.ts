import * as THREE from 'three';

/**
 * "Flowing silk" wave terrain — a displaced ground plane rendered at a low angle
 * with fine contour lines, a blue→red gradient, fresnel rim glow and distance fog.
 *
 * Seamless loop: every time-dependent term in the height field is an INTEGER
 * harmonic of the loop phase (2π·k·p), so the field is identical at p=0 and p=1.
 * Drive it with update(elapsedSeconds) and the motion repeats exactly every
 * WAVE_LOOP_SECONDS with no visible seam.
 */

export const WAVE_LOOP_SECONDS = 14;

const vertexShader = /* glsl */ `
  uniform float uPhase;   // loop phase 0..1
  uniform float uScale;   // spatial frequency of the field
  uniform float uAmp;     // height amplitude

  varying vec3 vWorldPos;
  varying float vHeight;   // normalised height (~ -2.8 .. 2.8)

  const float TAU = 6.28318530718;

  // Sum of travelling waves. Each time term is an integer multiple of (uPhase*TAU)
  // → the whole field loops perfectly at uPhase = 1.
  float waves(vec2 p) {
    float t = uPhase * TAU;
    float h = 0.0;
    h += 1.10 * sin(p.x * 0.45 + p.y * 0.20 + t);
    h += 0.80 * sin(p.x * 0.30 - p.y * 0.55 + t + 1.3);
    h += 0.55 * sin(p.x * 0.75 + p.y * 0.60 - t + 2.1);
    h += 0.24 * sin(p.x * 1.30 - p.y * 1.00 + t * 2.0 + 0.7);
    h += 0.13 * sin(p.x * 1.90 + p.y * 1.55 + t * 2.0 + 3.0);
    h += 0.06 * sin(p.x * 3.10 + p.y * 2.60 - t * 3.0 + 1.1);
    return h;
  }

  void main() {
    vec3 pos = position;
    float h = waves(pos.xz * uScale);
    pos.y += h * uAmp;
    vHeight = h;
    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorldPos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uColorLow;    // deep blue   (linear)
  uniform vec3 uColorMid;    // cyan/white highlight (linear)
  uniform vec3 uColorHigh;   // red/pink    (linear)
  uniform vec3 uFog;         // far colour  (linear)
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uLineCount;     // contour lines per world unit (depth)
  uniform float uLineStrength;  // 0..1 grain contrast
  uniform float uGradX;         // gradient slope across X
  uniform vec3 uLightDir;

  varying vec3 vWorldPos;
  varying float vHeight;

  void main() {
    // Per-pixel normal from the displaced surface (screen-space derivatives).
    vec3 n = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
    if (n.y < 0.0) n = -n;

    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(uLightDir);
    float diff = clamp(dot(n, L), 0.0, 1.0);
    float fres = pow(1.0 - clamp(dot(n, V), 0.0, 1.0), 3.0);

    // Blue → red gradient across the width (red confined to the far right).
    float gx = clamp(vWorldPos.x * uGradX + 0.42, 0.0, 1.0);
    vec3 base = mix(uColorLow, uColorHigh, smoothstep(0.5, 1.05, gx));

    // Lit crests pull toward the bright highlight colour.
    float crest = smoothstep(0.5, 1.0, diff) * smoothstep(0.7, 2.3, vHeight);
    base = mix(base, uColorMid, crest * 0.45);

    vec3 color = base * (0.10 + 0.70 * diff);
    color += base * fres * 0.7;          // rim glow
    color += uColorMid * crest * 0.18;   // extra crest pop

    // Fine contour lines along depth — evenly spaced on the surface, so they
    // foreshorten naturally in perspective. fwidth keeps them anti-aliased.
    float lc = vWorldPos.z * uLineCount;
    float aa = fwidth(lc);
    float f = fract(lc);
    float dline = min(f, 1.0 - f);
    float line = 1.0 - smoothstep(0.0, aa * 1.5 + 0.0008, dline);
    color *= mix(1.0 - uLineStrength * 0.45, 1.0 + uLineStrength * 0.55, line);

    // Distance fog → dunes melt into the dark background.
    float dist = length(cameraPosition - vWorldPos);
    float fog = smoothstep(uFogNear, uFogFar, dist);
    color = mix(color, uFog, fog);

    gl_FragColor = vec4(max(color, 0.0), 1.0);
  }
`;

export interface WaveField {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  /** Advance the loop. Pass the renderer clock's elapsed seconds. */
  update: (elapsedSeconds: number) => void;
  dispose: () => void;
}

// Hex (sRGB) → linear vec3, so colours look as authored once OutputPass encodes.
function lin(hex: string): THREE.Vector3 {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}

export function createWaveField(): WaveField {
  const geometry = new THREE.PlaneGeometry(120, 150, 360, 440);
  geometry.rotateX(-Math.PI / 2); // lie flat in XZ, depth along -Z

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uPhase: { value: 0 },
      uScale: { value: 0.15 },
      uAmp: { value: 2.3 },
      uColorLow: { value: lin('#1b46e0') },
      uColorMid: { value: lin('#cfeeff') },
      uColorHigh: { value: lin('#ff3b6b') },
      uFog: { value: lin('#03141a') },
      uFogNear: { value: 30 },
      uFogFar: { value: 108 },
      uLineCount: { value: 1.3 },
      uLineStrength: { value: 0.42 },
      uGradX: { value: 0.011 },
      uLightDir: { value: new THREE.Vector3(0.25, 0.85, 0.5) },
    },
    vertexShader,
    fragmentShader,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;

  return {
    mesh,
    material,
    update: (t: number) => {
      material.uniforms.uPhase.value = (t % WAVE_LOOP_SECONDS) / WAVE_LOOP_SECONDS;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}
