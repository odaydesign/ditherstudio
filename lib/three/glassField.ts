import * as THREE from 'three';

/**
 * Fluted / ribbed glass source — an animated colourful "subject" seen through a
 * sheet of textured glass: each rib is a little cylindrical lens that refracts,
 * disperses (RGB split) and frosts the image behind it, with a fresnel sheen on
 * the rib edges. Rendered on a fullscreen quad into the dither pre-pass.
 *
 * Seamless loop: the subject drifts on integer-harmonic sin paths of uPhase
 * (radians), so it repeats whenever uPhase advances by 2π. The studio drives
 * uPhase = t·speed (period 2π/speed); the preview uses update().
 */

export const GLASS_LOOP_SECONDS = 16;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uPhase;      // radians, loops at 2π
  uniform float uAspect;
  uniform float uRibs;       // ribs across
  uniform float uRefract;    // lens bend strength
  uniform float uFrost;      // blur (roughness)
  uniform float uSheen;      // fresnel edge sheen
  uniform float uDispersion; // RGB chromatic split
  uniform float uWavy;       // bow the ribs
  uniform float uAngle;      // 0 vertical ribs, 1 horizontal
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec3 uBg;

  // The animated colourful subject behind the glass — soft drifting glows.
  vec3 subject(vec2 uv) {
    vec2 p = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5);
    float t = uPhase;
    // soft coloured base wash so the glass always has light to bend
    vec3 col = mix(uBg, uColorC * 0.65, smoothstep(0.65, -0.25, uv.y));
    vec2 c1 = vec2(cos(t) * 0.26, sin(t) * 0.22);
    vec2 c2 = vec2(cos(t + 2.1) * 0.32, sin(t + 1.0) * 0.24) + vec2(0.04, -0.02);
    vec2 c3 = vec2(cos(-t + 4.0) * 0.22, sin(t * 2.0 + 3.0) * 0.18) + vec2(-0.05, 0.06);
    col = mix(col, uColorA * 1.15, smoothstep(0.62, 0.0, length(p - c1)));
    col = mix(col, uColorB * 1.10, smoothstep(0.50, 0.0, length(p - c2)));
    col = mix(col, uColorC * 1.15, smoothstep(0.58, 0.0, length(p - c3)));
    col += uColorA * smoothstep(0.55, 0.0, length(p)) * 0.22;   // central lift
    return col;
  }

  void main() {
    vec2 uv = vUv;
    float t = uPhase;
    float a    = mix(uv.x, uv.y, step(0.5, uAngle));
    float perp = mix(uv.y, uv.x, step(0.5, uAngle));
    a += sin(perp * 6.28318 + t) * uWavy * 0.06;          // bow the ribs

    float ribF = fract(a * uRibs) - 0.5;                  // -0.5..0.5 inside rib
    float slope = sin(ribF * 3.14159);                    // 0 centre, ±1 edges
    float disp = -slope * uRefract * 0.07;                // cylindrical-lens bend
    float dsp  = slope * uDispersion * 0.02;              // chromatic split

    vec2 axisD = (uAngle < 0.5) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec2 base  = uv + axisD * disp;

    // Frosted blur — a few taps along the rib axis, with per-channel dispersion.
    vec3 acc = vec3(0.0); float wsum = 0.0;
    for (int i = -2; i <= 2; i++) {
      float fo = float(i) / 2.0 * uFrost * 0.035;
      vec2 suv = clamp(base + axisD * fo, 0.0, 1.0);
      float w = 1.0 - abs(float(i)) * 0.18;
      acc.r += subject(clamp(suv + axisD * dsp, 0.0, 1.0)).r * w;
      acc.g += subject(suv).g * w;
      acc.b += subject(clamp(suv - axisD * dsp, 0.0, 1.0)).b * w;
      wsum += w;
    }
    vec3 col = acc / wsum;

    // Glass shading: bright rib crest, soft fresnel at the edges, dark seams.
    float edge = abs(slope);                              // 0 centre, 1 edge
    col += vec3(1.0) * pow(edge, 3.0) * uSheen * 0.45;    // fresnel sheen
    col += vec3(1.0) * pow(1.0 - edge, 14.0) * uSheen * 0.30; // specular crest line
    col *= mix(1.0, 0.72 + 0.28 * (1.0 - edge), uSheen * 0.7); // seam shadow

    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;

export interface GlassField {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  update: (elapsedSeconds: number) => void;
  dispose: () => void;
}

function lin(hex: string): THREE.Vector3 {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}

export function createGlassField(): GlassField {
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uPhase: { value: 0 },
      uAspect: { value: 16 / 9 },
      uRibs: { value: 26 },
      uRefract: { value: 1.0 },
      uFrost: { value: 0.5 },
      uSheen: { value: 0.6 },
      uDispersion: { value: 0.5 },
      uWavy: { value: 0.0 },
      uAngle: { value: 0 },
      uColorA: { value: lin('#2f6bff') },
      uColorB: { value: lin('#7a45ff') },
      uColorC: { value: lin('#16348f') },
      uBg: { value: lin('#05060c') },
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
      material.uniforms.uPhase.value = ((t % GLASS_LOOP_SECONDS) / GLASS_LOOP_SECONDS) * Math.PI * 2;
    },
    dispose: () => { geometry.dispose(); material.dispose(); },
  };
}
