// ============================================================
// GENERATOR FRAGMENT SHADER
// ------------------------------------------------------------
// Renders an abstract pattern (gradient / noise / mesh / cells)
// into a render target. That render target's texture is then fed
// to the main dithering material as `tDiffuse`, so the entire
// existing pipeline (pixelation -> dither -> palette -> CRT -> fx)
// runs on it unchanged.
//
// Colour notes: gradient stops arrive as RAW sRGB vec3 (hex/255,
// NOT THREE.Color) and we output raw sRGB. This makes a generated
// gradient behave identically to dithering a real gradient image.
//
// Targets GLSL ES 1.00 (WebGL1) — Three prepends the precision
// prefix, and uniform arrays are only indexed by loop counters
// (constant-index-expressions), matching fragmentShader.ts.
// ============================================================

export const generatorShader = `
    varying vec2 vUv;

    uniform float uTime;
    uniform vec2  uResolution;
    uniform float uSeed;

    uniform int   uPattern;       // see PATTERNS list in GenerativePanel
    uniform vec3  uColors[8];     // gradient stops, raw sRGB
    uniform int   uColorCount;    // active stops (2..8)

    uniform float uAngle;         // degrees
    uniform float uScale;         // feature scale / zoom
    uniform float uWarp;          // domain warp / turbulence amount
    uniform float uWarpFreq;      // warp frequency
    uniform float uGrain;         // film grain on top
    uniform float uContrast;      // contrast around midpoint
    uniform float uBlend;         // 0 = smooth stops, 1 = hard steps

    uniform int   uMotion;        // 1 drift,2 pulse,3 hue,4 swirl,5 zoom,6 strobe
    uniform float uSpeed;         // animation speed
    uniform float uAnimate;       // 0 or 1
    uniform float uBPM;           // strobe beats per minute

    uniform float uGridCols;      // grid quantization columns (0 = off)
    uniform float uGridRows;      // grid quantization rows (0 = off)
    uniform float uSteps;         // posterize the scalar field into N bands (0 = off)

    // Symmetry & composition
    uniform int   uMirror;        // 0 none,1 mirror-X,2 mirror-Y,3 quad,4 kaleidoscope
    uniform float uKaleido;       // kaleidoscope segment count
    uniform float uTileX;         // repeat count X (<=1 = off)
    uniform float uTileY;         // repeat count Y (<=1 = off)
    uniform float uGenVignette;   // edge darkening 0..1
    uniform float uBorder;        // inset frame width in uv (0 = off)
    uniform vec3  uBorderColor;   // frame colour (raw sRGB)

    // ---------- hashing / noise ----------
    float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
    }

    vec2 hash22(vec2 p) {
        float n = sin(dot(p, vec2(41.0, 289.0)));
        return fract(vec2(262144.0, 32768.0) * n);
    }

    float vnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash21(i + vec2(0.0, 0.0));
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    float fbm(vec2 p) {
        float v = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 6; i++) {
            v += amp * vnoise(p);
            p *= 2.0;
            amp *= 0.5;
        }
        return v;
    }

    // Animated cellular / Voronoi distance field
    float voronoi(vec2 p, float t) {
        vec2 n = floor(p);
        vec2 f = fract(p);
        float md = 1.5;
        for (int j = -1; j <= 1; j++) {
            for (int i = -1; i <= 1; i++) {
                vec2 g = vec2(float(i), float(j));
                vec2 o = hash22(n + g);
                o = 0.5 + 0.5 * sin(t + 6.2831853 * o);
                vec2 r = g + o - f;
                md = min(md, dot(r, r));
            }
        }
        return sqrt(md);
    }

    // Voronoi cell id -> flat-shaded shards / stained glass
    float voronoiCell(vec2 p, float t) {
        vec2 n = floor(p);
        vec2 f = fract(p);
        float md = 999.0;
        vec2 mcell = n;
        for (int j = -1; j <= 1; j++) {
            for (int i = -1; i <= 1; i++) {
                vec2 g = vec2(float(i), float(j));
                vec2 o = hash22(n + g);
                o = 0.5 + 0.5 * sin(t + 6.2831853 * o);
                vec2 r = g + o - f;
                float d = dot(r, r);
                if (d < md) { md = d; mcell = n + g; }
            }
        }
        return hash21(mcell);
    }

    // ---------- colour helpers ----------
    vec3 samplePalette(float tt) {
        float t = clamp(tt, 0.0, 1.0);
        int count = uColorCount;
        if (count <= 1) return uColors[0];
        float scaled = t * float(count - 1);
        scaled = min(scaled, float(count - 1) - 0.0001);
        float seg = floor(scaled);
        float fr = scaled - seg;
        float steppedFr = step(0.5, fr);
        fr = mix(fr, steppedFr, uBlend);
        int iSeg = int(seg);
        vec3 cA = uColors[0];
        vec3 cB = uColors[0];
        for (int i = 0; i < 8; i++) {
            if (i == iSeg) cA = uColors[i];
            if (i == iSeg + 1) cB = uColors[i];
        }
        return mix(cA, cB, fr);
    }

    vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    vec3 hueRotate(vec3 col, float a) {
        vec3 hsv = rgb2hsv(col);
        hsv.x = fract(hsv.x + a);
        return hsv2rgb(hsv);
    }

    // Multi-point mesh gradient: smooth inverse-distance blend of N stops
    vec3 meshGradient(vec2 p, float t) {
        vec3 acc = vec3(0.0);
        float wsum = 0.0;
        int count = uColorCount;
        for (int i = 0; i < 8; i++) {
            if (i >= count) break;
            float fi = float(i);
            vec2 base = (hash22(vec2(fi + uSeed, fi * 1.7 + uSeed)) - 0.5) * 1.5;
            vec2 pos = base + 0.18 * vec2(sin(t + fi * 1.3), cos(t + fi * 2.1)) * uAnimate;
            float d = distance(p, pos);
            float w = 1.0 / (d * d * (12.0 / max(uScale, 0.1)) + 0.02);
            acc += uColors[i] * w;
            wsum += w;
        }
        if (wsum <= 0.0) return uColors[0];
        return acc / wsum;
    }

    void main() {
        float t = uTime * uSpeed * uAnimate;
        vec2 asp = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);

        // ---- coordinate: motion -> symmetry/tiling -> warp -> grid snap ----
        vec2 uv = vUv;

        if (uMotion == 4) {             // swirl
            vec2 c = (uv - 0.5) * asp;
            float r = length(c);
            float a = atan(c.y, c.x) + sin(t) * 1.2 * (1.0 - clamp(r, 0.0, 1.0));
            uv = (vec2(cos(a), sin(a)) * r) / asp + 0.5;
        }
        if (uMotion == 1) {             // drift (orbit -> loops at t = 2pi)
            uv += vec2(sin(t) * 0.06, cos(t) * 0.05);
        }
        if (uMotion == 5) {             // zoom (breathing -> loop-friendly)
            float z = pow(1.7, sin(t));
            uv = (uv - 0.5) / z + 0.5;
        }

        // tiling / repeat
        if (uTileX > 1.0 || uTileY > 1.0) {
            uv = fract(uv * vec2(max(uTileX, 1.0), max(uTileY, 1.0)));
        }
        // mirror / kaleidoscope
        if (uMirror == 1 || uMirror == 3) uv.x = 0.5 + abs(uv.x - 0.5);
        if (uMirror == 2 || uMirror == 3) uv.y = 0.5 + abs(uv.y - 0.5);
        if (uMirror == 4) {
            vec2 c = (uv - 0.5) * asp;
            float seg = 6.2831853 / max(uKaleido, 1.0);
            float a = mod(atan(c.y, c.x), seg);
            a = abs(a - seg * 0.5);
            uv = (vec2(cos(a), sin(a)) * length(c)) / asp + 0.5;
        }

        if (uWarp > 0.0) {              // domain warp
            vec2 q = vec2(
                fbm(uv * (uWarpFreq * 3.0) + uSeed),
                fbm(uv * (uWarpFreq * 3.0) + uSeed + 5.2)
            );
            uv += (q - 0.5) * uWarp;
        }
        // grid quantization (last) -> snap to flat rectangular cells
        if (uGridCols > 0.0) uv.x = (floor(uv.x * uGridCols) + 0.5) / uGridCols;
        if (uGridRows > 0.0) uv.y = (floor(uv.y * uGridRows) + 0.5) / uGridRows;

        vec2 puv = uv;
        vec2 ccuv = (uv - 0.5) * asp;

        float angRad = radians(uAngle);
        vec2 dir = vec2(cos(angRad), sin(angRad));
        float val = 0.5;
        vec3 color = vec3(0.0);
        bool haveColor = false;

        if (uPattern == 0) {            // linear gradient
            val = dot(puv - 0.5, dir) / max(uScale, 0.001) + 0.5;
        } else if (uPattern == 1) {     // radial
            val = length(ccuv) / (0.7071 * max(uScale, 0.001));
        } else if (uPattern == 2) {     // conic
            val = fract((atan(ccuv.y, ccuv.x) / 6.2831853) + 0.5 + uAngle / 360.0);
        } else if (uPattern == 3) {     // mesh gradient (colour directly)
            color = meshGradient(ccuv, t);
            haveColor = true;
        } else if (uPattern == 4) {     // flow / fbm
            vec2 p = puv * (3.0 * uScale) + uSeed;
            val = fbm(p + fbm(p));
        } else if (uPattern == 5) {     // waves / bands
            float coord = dot(puv - 0.5, dir);
            val = sin(coord * (10.0 / max(uScale, 0.001)) + t + fbm(puv * 3.0 + uSeed) * uWarp * 3.0) * 0.5 + 0.5;
        } else if (uPattern == 6) {     // cellular
            val = voronoi(puv * (4.0 * uScale) + uSeed, t);
        } else if (uPattern == 7) {     // spectrum: 2-axis (brightness x palette)
            float bAxis = clamp((dot(puv - 0.5, dir) / max(uScale, 0.001)) * uContrast + 0.5, 0.0, 1.0);
            float pAxis = dot(puv - 0.5, vec2(dir.y, -dir.x)) + 0.5;
            vec3 bright = samplePalette(pAxis);
            color = mix(bright * 0.04, bright, bAxis);
            haveColor = true;
        } else if (uPattern == 8) {     // tunnel: concentric rectangles (Chebyshev distance)
            float d = max(abs(puv.x - 0.5), abs(puv.y - 0.5)) * 2.0 / max(uScale, 0.001);
            val = fract(d - t / 6.2831853);
        } else if (uPattern == 9) {     // plasma
            float s = 6.0 * uScale;
            float v1 = sin(puv.x * s + t);
            float v2 = sin(puv.y * s + t * 2.0);
            float v3 = sin((puv.x + puv.y) * s * 0.5 + t);
            float v4 = sin(length(ccuv) * s * 1.5 + t * 2.0);
            val = (v1 + v2 + v3 + v4) * 0.125 + 0.5;
        } else if (uPattern == 10) {    // contour / topographic lines
            // sample point orbits a small circle so the motion loops at t = 2pi
            float f = fbm(puv * (2.5 * uScale) + uSeed + vec2(sin(t), cos(t)) * 0.15);
            val = abs(fract(f * 6.0) * 2.0 - 1.0);
        } else if (uPattern == 11) {    // moiré interference
            float f = 40.0 * uScale;
            vec2 d2 = vec2(cos(angRad + 0.12), sin(angRad + 0.12));
            val = (sin(dot(puv - 0.5, dir) * f) * sin(dot(puv - 0.5, d2) * f)) * 0.5 + 0.5;
        } else if (uPattern == 12) {    // truchet tiles
            float N = max(2.0, floor(6.0 * uScale));
            vec2 gp = puv * N;
            vec2 cell = floor(gp);
            vec2 f = fract(gp);
            if (hash21(cell + uSeed) > 0.5) f.x = 1.0 - f.x;
            float d = min(abs(distance(f, vec2(0.0)) - 0.5), abs(distance(f, vec2(1.0)) - 0.5));
            val = smoothstep(0.18, 0.0, d);
        } else if (uPattern == 13) {    // voronoi shards (flat per-cell)
            val = voronoiCell(puv * (4.0 * uScale) + uSeed, t);
        } else if (uPattern == 14) {    // spiral
            float a = atan(ccuv.y, ccuv.x);
            float r = length(ccuv);
            float arms = max(1.0, floor(uScale * 3.0));
            val = fract(a / 6.2831853 * arms + r * (3.0 * uScale) - t / 6.2831853);
        }

        if (!haveColor) {
            if (uSteps > 0.5) val = (floor(val * uSteps) + 0.5) / uSteps; // posterize into bands
            val = clamp((val - 0.5) * uContrast + 0.5, 0.0, 1.0);
            if (uMotion == 2) val = clamp(val + sin(t) * 0.15, 0.0, 1.0); // pulse
            color = samplePalette(val);
        } else if (uMotion == 2) {      // pulse on colour-direct patterns
            color *= (1.0 + sin(t) * 0.12);
        }

        if (uMotion == 3) color = hueRotate(color, t / 6.2831853); // hue cycle (loops at t = 2pi)
        if (uMotion == 6) {             // BPM strobe
            float beat = uTime * (uBPM / 60.0) * uAnimate;
            color *= mix(0.12, 1.0, step(0.5, fract(beat)));
        }

        if (uGrain > 0.0) {
            // sin(t) (not fract(t)) so animated grain matches at the loop seam
            float g = hash21(vUv * uResolution + sin(t) * 23.0) - 0.5;
            color += g * uGrain;
        }

        // edge vignette
        if (uGenVignette > 0.0) {
            float vig = smoothstep(0.9, 0.25, length(vUv - 0.5) * (1.0 + uGenVignette));
            color *= mix(1.0, vig, uGenVignette);
        }
        // inset border / frame
        if (uBorder > 0.0) {
            vec2 bw = vec2(uBorder / max(asp.x, 0.001), uBorder);
            vec2 lo = step(bw, vUv);
            vec2 hi = step(vUv, 1.0 - bw);
            color = mix(uBorderColor, color, lo.x * lo.y * hi.x * hi.y);
        }

        gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }
`;
