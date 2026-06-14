import * as THREE from 'three';

/**
 * "Flowing silk" wave terrain — a displaced ground plane rendered at a low angle
 * with fine contour lines, a blue→red gradient, fresnel rim glow and distance fog.
 *
 * Seamless loop: every time-dependent term in the height field is an INTEGER
 * harmonic of the phase (k·uPhase, uPhase in radians), so the field is identical
 * whenever uPhase advances by 2π. The studio drives uPhase = t·speed (matching
 * the generator/3D loop convention, period = 2π/speed); the standalone preview
 * drives it via update() so the motion repeats every WAVE_LOOP_SECONDS.
 */

export const WAVE_LOOP_SECONDS = 14;

/** Per-theme presets for the flow-field source. Values map 1:1 to the wave* store
 *  fields; setWaveType() spreads the chosen one. */
export interface WaveTypePreset {
  waveType: number;
  label: string;
  waveScale: number;
  waveAmp: number;
  waveLineCount: number;
  waveLineStrength: number;
  waveGradient: number;
  waveSpeed: number;
  waveGlow: number;
  waveColorLow: string;
  waveColorMid: string;
  waveColorHigh: string;
  waveColorFog: string;
  waveBg: string;
  waveCamHeight: number;
  waveCamDistance: number;
  waveFov: number;
}

export const WAVE_TYPE_PRESETS: WaveTypePreset[] = [
  { waveType: 0, label: 'Waves',
    waveScale: 0.15, waveAmp: 2.3, waveLineCount: 1.3, waveLineStrength: 0.42, waveGradient: 0.011, waveSpeed: 0.45, waveGlow: 0.18,
    waveColorLow: '#1b46e0', waveColorMid: '#cfeeff', waveColorHigh: '#ff3b6b', waveColorFog: '#03141a', waveBg: '#04080c',
    waveCamHeight: 8, waveCamDistance: 36, waveFov: 42 },
  { waveType: 1, label: 'Wind',
    waveScale: 0.12, waveAmp: 1.8, waveLineCount: 2.6, waveLineStrength: 0.6, waveGradient: 0.012, waveSpeed: 0.85, waveGlow: 0.32,
    waveColorLow: '#4a7fb5', waveColorMid: '#ffffff', waveColorHigh: '#aee6ff', waveColorFog: '#070f18', waveBg: '#05090f',
    waveCamHeight: 8, waveCamDistance: 36, waveFov: 46 },
  { waveType: 2, label: 'Water',
    waveScale: 0.2, waveAmp: 2.1, waveLineCount: 1.9, waveLineStrength: 0.72, waveGradient: 0.009, waveSpeed: 0.55, waveGlow: 0.5,
    waveColorLow: '#0d6b86', waveColorMid: '#c8fff0', waveColorHigh: '#2f9bd8', waveColorFog: '#02141c', waveBg: '#02101a',
    waveCamHeight: 8, waveCamDistance: 35, waveFov: 44 },
  { waveType: 3, label: 'Sun',
    waveScale: 0.13, waveAmp: 2.6, waveLineCount: 1.0, waveLineStrength: 0.32, waveGradient: 0.011, waveSpeed: 0.4, waveGlow: 0.5,
    waveColorLow: '#6e1a00', waveColorMid: '#ffd98a', waveColorHigh: '#ff6e10', waveColorFog: '#ffce6a', waveBg: '#000000',
    waveCamHeight: 5, waveCamDistance: 34, waveFov: 46 },
];

const vertexShader = /* glsl */ `
  uniform float uPhase;   // loop phase, radians (one full loop every 2π)
  uniform float uScale;   // spatial frequency of the field
  uniform float uAmp;     // height amplitude
  uniform float uType;    // 0 waves, 1 wind, 2 water, 3 sun

  varying vec3 vWorldPos;
  varying float vHeight;   // normalised height (~ -2.8 .. 2.8)

  // Sum of travelling waves. Each time term is an integer multiple of uPhase
  // → the whole field loops perfectly whenever uPhase advances by 2π.
  float waves(vec2 p) {
    float t = uPhase;
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
    vec2 pq = pos.xz * uScale;
    float t = uPhase;
    int ty = int(uType + 0.5);
    float h = waves(pq);
    if (ty == 2) {
      // WATER — choppier cross-ripple interference on top of the swell
      h = h * 0.65
        + 0.35 * sin(pq.x * 2.6 + pq.y * 2.2 + t * 2.0)
        + 0.20 * sin(pq.x * 3.9 - pq.y * 3.1 - t * 3.0)
        + 0.11 * sin(pq.x * 5.6 + pq.y * 4.7 + t * 3.0);
    } else if (ty == 3) {
      // SUN — slow radial churn (concentric plasma)
      float r = length(pq);
      h = h * 0.6 + 0.5 * sin(r * 1.6 - t) + 0.28 * sin(r * 3.0 + t * 2.0);
    }
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
  uniform float uType;          // 0 waves, 1 wind, 2 water, 3 sun
  uniform float uGlow;          // crest emission strength
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

    int ty = int(uType + 0.5);
    vec3 base;
    if (ty == 3) {
      // SUN — colour by height: molten troughs → hot crests (horizon blazes via hot fog)
      float gh = clamp(vHeight * 0.4 + 0.5, 0.0, 1.0);
      base = mix(uColorLow, uColorHigh, smoothstep(0.15, 0.9, gh));
    } else {
      // Gradient across the width (accent confined to the far side).
      float gx = clamp(vWorldPos.x * uGradX + 0.42, 0.0, 1.0);
      base = mix(uColorLow, uColorHigh, smoothstep(0.5, 1.05, gx));
    }

    // Lit crests pull toward the bright highlight colour.
    float crest = smoothstep(0.5, 1.0, diff) * smoothstep(0.7, 2.3, vHeight);
    base = mix(base, uColorMid, crest * 0.45);

    vec3 color = base * (0.10 + 0.70 * diff);
    color += base * fres * 0.7;          // rim glow
    color += uColorMid * crest * uGlow;  // crest emission (per-type)

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
      uType: { value: 0 },
      uGlow: { value: 0.18 },
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
      material.uniforms.uPhase.value =
        ((t % WAVE_LOOP_SECONDS) / WAVE_LOOP_SECONDS) * Math.PI * 2;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Screen-space themes — drawn natively (not as a terrain) for phenomena that
// don't read as a surface: WIND (flowing streamlines) and SUN (corona disc).
// Rendered on a fullscreen quad whose vertex shader emits clip-space directly,
// so any camera works. Same seamless-loop rule: time terms are integer
// harmonics of uPhase (radians), so it loops whenever uPhase advances by 2π.
// ---------------------------------------------------------------------------

const screenVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const screenFragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uPhase;     // radians, loops at 2π
  uniform float uType;      // 1 wind, 3 sun
  uniform float uAspect;    // width / height
  uniform float uScale;
  uniform float uLineCount;
  uniform float uLineStrength;
  uniform float uGlow;
  uniform vec3 uColorLow;
  uniform vec3 uColorMid;
  uniform vec3 uColorHigh;
  uniform vec3 uBg;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
  }

  // Travelling flow field — the +t terms make it blow in -x and loop at 2π.
  float windField(vec2 p) {
    float t = uPhase;
    float h = 0.0;
    h += 1.00 * sin(p.x * 0.70 + p.y * 0.15 + t);
    h += 0.55 * sin(p.x * 0.50 - p.y * 0.50 - t + 1.7);
    h += 0.35 * sin(p.x * 1.20 + p.y * 0.40 + t * 2.0 + 0.5);
    h += 0.20 * sin(p.x * 2.00 - p.y * 0.90 - t * 2.0 + 2.3);
    h += 0.10 * sin(p.x * 3.20 + p.y * 1.60 + t * 3.0);
    return h;
  }

  void main() {
    int ty = int(uType + 0.5);
    vec2 uv = vUv;
    vec2 c = uv - 0.5; c.x *= uAspect;
    vec3 color;

    if (ty == 1) {
      // ---- WIND: flowing streamlines = level-sets of a travelling flow field.
      // Level sets of a flow field naturally read as curved, blowing air currents.
      vec2 p = vec2(uv.x * uAspect, uv.y);
      float f = windField(p * (3.0 + uScale * 24.0));        // curvy flow (animates, loops)
      float gust = 0.5 + 0.5 * windField(p * 1.3 + 20.0);
      float s = f * (uLineCount * 2.2);
      float aa = fwidth(s);
      float dl = abs(fract(s) - 0.5);
      float line = 1.0 - smoothstep(0.0, aa * 1.5 + 0.012, dl);
      vec3 bg = mix(uColorLow, uBg, smoothstep(0.0, 1.0, uv.y)); // blue base → dark top
      color = bg;
      color += uColorMid * line * (0.35 + 0.65 * gust) * (0.7 + uLineStrength);
      color += uColorHigh * line * gust * uGlow;
    } else {
      // ---- SUN: vertical light bars / rays — a hot spectrum that blazes on the
      // left and fades into black on the right (per reference). ----
      float t = uPhase;
      float density = 16.0 + uLineCount * 28.0;             // bar count via Line Density
      float bow = sin(uv.y * 2.1 + t) * 0.025
                + sin(uv.y * 5.1 - t * 2.0) * 0.012;        // subtle vertical bow (loops)
      float bp = (uv.x + bow) * density;
      float id = floor(bp);
      float fp = fract(bp);
      float rnd = hash(vec2(id, 1.7));
      float rnd2 = hash(vec2(id, 9.1));
      // per-bar shimmer — integer harmonics of t → loops
      float flick = 0.6 + 0.4 * sin(t * (1.0 + floor(rnd * 3.0)) + rnd * 6.2831);
      float width = mix(0.04, 0.30, rnd);                  // bar half-width in cell
      float core = smoothstep(width, 0.0, abs(fp - 0.5));
      float halo = smoothstep(width + 0.5, 0.0, abs(fp - 0.5)) * 0.3; // soft glow
      float strength = mix(0.1, 1.0, rnd2 * rnd2);         // a few bars dominate
      // bright cluster left-of-centre, fading to black on the right
      float env = exp(-pow((uv.x - 0.3) / 0.3, 2.0));
      env *= 0.85 + 0.15 * sin(uv.y * 3.1415);             // slight vertical falloff
      float v = (core + halo) * strength * flick * env * (1.0 + uGlow);
      v = clamp(v, 0.0, 1.5);
      vec3 col = mix(uBg, uColorLow, smoothstep(0.0, 0.2, v));    // dark red emerges
      col = mix(col, uColorHigh, smoothstep(0.16, 0.55, v));      // orange
      col = mix(col, uColorMid, smoothstep(0.55, 1.05, v));       // yellow-white core
      color = col;
    }

    gl_FragColor = vec4(max(color, 0.0), 1.0);
  }
`;

export interface WaveScreen {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  dispose: () => void;
}

export function createWaveScreen(): WaveScreen {
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uPhase: { value: 0 },
      uType: { value: 1 },
      uAspect: { value: 16 / 9 },
      uScale: { value: 0.12 },
      uLineCount: { value: 2.6 },
      uLineStrength: { value: 0.6 },
      uGlow: { value: 0.32 },
      uColorLow: { value: lin('#4a7fb5') },
      uColorMid: { value: lin('#ffffff') },
      uColorHigh: { value: lin('#aee6ff') },
      uBg: { value: lin('#05090f') },
    },
    vertexShader: screenVertexShader,
    fragmentShader: screenFragmentShader,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return {
    mesh,
    material,
    dispose: () => { geometry.dispose(); material.dispose(); },
  };
}
