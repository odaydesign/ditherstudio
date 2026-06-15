import * as THREE from 'three';

/**
 * Realistic fluted / ribbed glass source. Each rib is a cylindrical lens: the
 * surface normal is built across the rib, then the view ray is bent with real
 * refract() (per-channel for chromatic dispersion) to sample the subject behind,
 * and reflect() samples a studio environment. A Schlick fresnel term mixes the
 * two — transmissive at rib centres, reflective at the edges — which is what
 * gives glass its bright edge sheen. Frost adds roughness blur; a key-light
 * specular adds the sharp highlight.
 *
 * The subject behind the glass is either an uploaded image (tBg, cover-fit) or
 * an animated procedural glow. Rendered on a fullscreen quad into the dither
 * pre-pass. Seamless loop: subject + ribs drift on integer harmonics of uPhase.
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

  uniform float uPhase;       // radians, loops at 2π
  uniform float uAspect;      // frame width / height
  uniform float uRibs;        // ribs across
  uniform float uCurvature;   // rib lens curvature (refraction magnification)
  uniform float uIOR;         // index of refraction
  uniform float uReflect;     // reflection strength
  uniform float uFrost;       // roughness blur
  uniform float uSheen;       // specular highlight strength
  uniform float uDispersion;  // RGB chromatic split
  uniform float uWavy;        // bow the ribs
  uniform float uAngle;       // 0 vertical ribs, 1 horizontal
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec3 uBg;
  uniform sampler2D tBg;      // uploaded background
  uniform float uHasBg;       // 0 procedural, 1 image
  uniform float uBgAspect;    // image width / height

  // Animated procedural subject (when no image uploaded).
  vec3 procSubject(vec2 uv) {
    vec2 p = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5);
    float t = uPhase;
    vec3 col = mix(uBg, uColorC * 0.65, smoothstep(0.65, -0.25, uv.y));
    vec2 c1 = vec2(cos(t) * 0.26, sin(t) * 0.22);
    vec2 c2 = vec2(cos(t + 2.1) * 0.32, sin(t + 1.0) * 0.24) + vec2(0.04, -0.02);
    vec2 c3 = vec2(cos(-t + 4.0) * 0.22, sin(t * 2.0 + 3.0) * 0.18) + vec2(-0.05, 0.06);
    col = mix(col, uColorA * 1.15, smoothstep(0.62, 0.0, length(p - c1)));
    col = mix(col, uColorB * 1.10, smoothstep(0.50, 0.0, length(p - c2)));
    col = mix(col, uColorC * 1.15, smoothstep(0.58, 0.0, length(p - c3)));
    col += uColorA * smoothstep(0.55, 0.0, length(p)) * 0.22;
    return col;
  }

  // Subject behind the glass: uploaded image (cover-fit) or procedural glow.
  vec3 sampleBg(vec2 uv) {
    if (uHasBg > 0.5) {
      vec2 t = uv;
      if (uBgAspect > uAspect) {           // image wider → fit height, crop sides
        float s = uAspect / uBgAspect;
        t.x = (uv.x - 0.5) * s + 0.5;
      } else {                              // image taller → fit width, crop top/bottom
        float s = uBgAspect / uAspect;
        t.y = (uv.y - 0.5) * s + 0.5;
      }
      return texture2D(tBg, clamp(t, 0.0, 1.0)).rgb;
    }
    return procSubject(uv);
  }

  // Reflected studio environment — soft vertical sky + a horizontal softbox.
  vec3 environment(vec3 r) {
    float y = r.y * 0.5 + 0.5;
    vec3 sky = mix(vec3(0.015), vec3(0.42), smoothstep(0.15, 0.95, y));
    float bar = smoothstep(0.14, 0.0, abs(r.y - 0.35));   // soft light bar
    sky += vec3(1.0) * bar * 0.5;
    return sky;
  }

  void main() {
    vec2 uv = vUv;
    float t = uPhase;
    bool vert = uAngle < 0.5;
    float a    = vert ? uv.x : uv.y;
    float perp = vert ? uv.y : uv.x;
    a += sin(perp * 6.28318 + t) * uWavy * 0.05;          // bow the ribs

    // Cylindrical-lens surface normal across the rib.
    float ribF = (fract(a * uRibs) - 0.5) * 2.0;          // -1..1
    float nx = clamp(ribF * uCurvature, -0.999, 0.999);
    float nz = sqrt(max(0.0001, 1.0 - nx * nx));
    vec3 N = normalize(vert ? vec3(nx, 0.0, nz) : vec3(0.0, nx, nz));
    vec3 I = vec3(0.0, 0.0, -1.0);                         // view ray into the glass
    vec3 Vv = -I;

    // Schlick fresnel — reflective at grazing rib edges.
    float cosi = clamp(dot(N, Vv), 0.0, 1.0);
    float F = (0.04 + 0.96 * pow(1.0 - cosi, 5.0)) * uReflect;

    // Refraction with per-channel dispersion + frosted multi-tap.
    float eta = 1.0 / uIOR;
    float dEta = uDispersion * 0.05;
    vec3 rR = refract(I, N, eta + dEta);
    vec3 rG = refract(I, N, eta);
    vec3 rB = refract(I, N, eta - dEta);
    float depth = 0.18 * uCurvature;
    vec3 refr = vec3(0.0); float wsum = 0.0;
    for (int i = -2; i <= 2; i++) {
      float fo = float(i) / 2.0 * uFrost * 0.02;
      vec2 jit = vert ? vec2(fo, 0.0) : vec2(0.0, fo);
      float w = 1.0 - abs(float(i)) * 0.18;
      refr.r += sampleBg(clamp(uv + rR.xy * depth + jit, 0.0, 1.0)).r * w;
      refr.g += sampleBg(clamp(uv + rG.xy * depth + jit, 0.0, 1.0)).g * w;
      refr.b += sampleBg(clamp(uv + rB.xy * depth + jit, 0.0, 1.0)).b * w;
      wsum += w;
    }
    refr /= wsum;

    // Reflection of the environment.
    vec3 Rr = reflect(I, N);
    vec3 refl = environment(Rr);

    vec3 col = mix(refr, refl, F);

    // Sharp key-light specular at the rib crests.
    float spec = pow(max(dot(Rr, normalize(vec3(0.35, 0.55, 0.9))), 0.0), 90.0);
    col += vec3(1.0) * spec * uSheen * 1.3;

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
      uRibs: { value: 22 },
      uCurvature: { value: 0.7 },
      uIOR: { value: 1.45 },
      uReflect: { value: 0.5 },
      uFrost: { value: 0.45 },
      uSheen: { value: 0.6 },
      uDispersion: { value: 0.5 },
      uWavy: { value: 0.0 },
      uAngle: { value: 0 },
      uColorA: { value: lin('#2f6bff') },
      uColorB: { value: lin('#7a45ff') },
      uColorC: { value: lin('#16348f') },
      uBg: { value: lin('#05060c') },
      tBg: { value: null },
      uHasBg: { value: 0 },
      uBgAspect: { value: 16 / 9 },
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
