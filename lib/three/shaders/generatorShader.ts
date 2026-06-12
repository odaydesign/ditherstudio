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
    uniform int   uPolar;         // coord warp: 0 none,1 polar,2 log-polar,3 twist/spiral
    uniform float uTileX;         // repeat count X (<=1 = off)
    uniform float uTileY;         // repeat count Y (<=1 = off)
    uniform float uGenVignette;   // edge darkening 0..1
    uniform float uBorder;        // inset frame width in uv (0 = off)
    uniform vec3  uBorderColor;   // frame colour (raw sRGB)

    // ---- Image layer: composite an uploaded image with the pattern ----
    uniform sampler2D uImage;     // layer image (raw sRGB, may have alpha)
    uniform float uImageOn;       // 0/1 enabled
    uniform int   uImageMode;     // 1 alpha-over,2 luma-stencil,3 multiply,4 screen,5 overlay,6 add,7 crossfade
    uniform float uImageAmount;   // 0..1 strength / opacity
    uniform float uImageInvert;   // 0/1 flip mask / alpha
    uniform int   uImageFit;      // 0 cover, 1 contain, 2 stretch
    uniform vec2  uImageAspect;   // image (w,h) in px, for cover/contain

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

    // Signed distance to a flat-top hexagon (apothem r). iq.
    float sdHexagon(vec2 p, float r) {
        const vec3 k = vec3(-0.8660254, 0.5, 0.5773503);
        p = abs(p);
        p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
        p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
        return length(p) * sign(p.y);
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

    // Photoshop-style overlay blend
    vec3 ovl(vec3 b, vec3 s) {
        return mix(2.0 * b * s, 1.0 - 2.0 * (1.0 - b) * (1.0 - s), step(0.5, b));
    }

    // ---------- raymarch helpers (Group B 3D patterns) ----------
    mat2 rot2(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
    // Gyroid implicit surface, thickened into walls (rough distance estimate).
    float gyroidMap(vec3 p) { return (abs(dot(sin(p), cos(p.zxy))) - 0.4) * 0.4; }
    // Infinitely repeated square tube -> corridor of pillars.
    float corridorMap(vec3 p) {
        p.xy = mod(p.xy, 2.0) - 1.0;     // cell centre at 0; thin pillar so gaps stay open
        vec2 d = abs(p.xy) - 0.3;
        return max(d.x, d.y);
    }
    // Power-8 mandelbulb distance estimator.
    float mandelbulbMap(vec3 p) {
        vec3 z = p; float dr = 1.0; float r = 0.0;
        for (int i = 0; i < 5; i++) {
            r = length(z);
            if (r > 2.0) break;
            float th = acos(clamp(z.z / r, -1.0, 1.0));
            float ph = atan(z.y, z.x);
            dr = pow(r, 7.0) * 8.0 * dr + 1.0;
            float zr = pow(r, 8.0);
            th *= 8.0; ph *= 8.0;
            z = zr * vec3(sin(th) * cos(ph), sin(th) * sin(ph), cos(th)) + p;
        }
        return 0.5 * log(max(r, 0.0001)) * r / dr;
    }

    // Composite the layer image onto the generated pattern P (raw sRGB in/out).
    // The image is sampled in stable screen space (vUv), so it acts as a fixed
    // mask/layer while the pattern moves underneath.
    vec3 composeImage(vec3 P) {
        if (uImageOn < 0.5 || uImageMode == 0) return P;
        vec2 iuv = vUv;
        if (uImageFit != 2) {                       // cover / contain
            vec2 sc = uResolution / max(uImageAspect, vec2(1.0));
            float scale = (uImageFit == 1) ? min(sc.x, sc.y) : max(sc.x, sc.y);
            vec2 size = uImageAspect * scale;
            vec2 off = (uResolution - size) * 0.5;
            iuv = (vUv * uResolution - off) / size;
        }
        // 1 inside the image rect, 0 in any contain-letterbox (keep pattern there)
        float inb = step(0.0, iuv.x) * step(iuv.x, 1.0) * step(0.0, iuv.y) * step(iuv.y, 1.0);
        vec4 img = texture2D(uImage, clamp(iuv, 0.0, 1.0));
        vec3 I = img.rgb;
        float a = clamp(uImageAmount, 0.0, 1.0);
        float luma = dot(I, vec3(0.299, 0.587, 0.114));
        float alpha = img.a;
        if (uImageInvert > 0.5) { luma = 1.0 - luma; alpha = 1.0 - alpha; }
        vec3 C = P;
        if (uImageMode == 1)      C = mix(P, I, alpha * a);                      // alpha over (PNG logos)
        else if (uImageMode == 2) C = mix(I, P, luma * a);                      // luma stencil (pattern fills light)
        else if (uImageMode == 3) C = mix(P, P * I, a);                         // multiply
        else if (uImageMode == 4) C = mix(P, 1.0 - (1.0 - P) * (1.0 - I), a);   // screen
        else if (uImageMode == 5) C = mix(P, ovl(P, I), a);                     // overlay
        else if (uImageMode == 6) C = P + I * a;                                // add / dodge
        else if (uImageMode == 7) C = mix(P, I, a);                             // crossfade
        return mix(P, C, inb);
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

        // polar / log-polar / twist coordinate warp (applies to ANY pattern)
        if (uPolar > 0) {
            vec2 c = (uv - 0.5) * asp;
            float ang = atan(c.y, c.x) / 6.2831853 + 0.5;
            float rad = length(c);
            if (uPolar == 1) uv = vec2(ang, rad);                       // wrap around a circle
            else if (uPolar == 2) uv = vec2(ang, log(rad + 0.04));      // droste / infinite zoom
            else if (uPolar == 3) {                                     // twist into a spiral
                float a = atan(c.y, c.x) + rad * 6.2831853 * uScale;
                uv = (vec2(cos(a), sin(a)) * rad) / asp + 0.5;
            }
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
        } else if (uPattern == 15) {    // technical grid / graph paper (minor + major)
            vec2 p = puv * (8.0 * uScale);
            vec2 g = abs(fract(p) - 0.5);
            float minor = 1.0 - smoothstep(0.0, 0.04, min(g.x, g.y));
            vec2 gm = abs(fract(p * 0.25) - 0.5);
            float major = 1.0 - smoothstep(0.0, 0.02, min(gm.x, gm.y));
            val = clamp(minor * 0.5 + major, 0.0, 1.0);
        } else if (uPattern == 16) {    // isometric line grid (3 axes)
            vec2 p = ccuv * (8.0 * uScale);
            float l = 1.0 - smoothstep(0.0, 0.05, abs(fract(p.y) - 0.5));
            l = max(l, 1.0 - smoothstep(0.0, 0.05, abs(fract(p.x * 0.8660254 + p.y * 0.5) - 0.5)));
            l = max(l, 1.0 - smoothstep(0.0, 0.05, abs(fract(p.x * 0.8660254 - p.y * 0.5) - 0.5)));
            val = l;
        } else if (uPattern == 17) {    // hexagonal grid (honeycomb outlines)
            vec2 hp = ccuv * (6.0 * uScale);
            vec2 rr = vec2(1.0, 1.7320508); // pointy-top hex lattice (apothem 0.5)
            vec2 ha = mod(hp, rr) - rr * 0.5;
            vec2 hb = mod(hp - rr * 0.5, rr) - rr * 0.5;
            vec2 gv = dot(ha, ha) < dot(hb, hb) ? ha : hb;
            val = 1.0 - smoothstep(0.0, 0.05, abs(sdHexagon(gv.yx, 0.5)));
        } else if (uPattern == 18) {    // concentric polygons (nested hexagon rings)
            float sides = 6.0;
            float ang = atan(ccuv.y, ccuv.x);
            float seg = 6.2831853 / sides;
            float poly = cos(floor(0.5 + ang / seg) * seg - ang);
            float d = length(ccuv) * poly / (0.7071 * max(uScale, 0.001));
            val = fract(d * 5.0);
        } else if (uPattern == 19) {    // circuit board traces + vias
            float N = max(2.0, floor(8.0 * uScale));
            vec2 gp = ccuv * N;
            vec2 id = floor(gp);
            vec2 f = fract(gp) - 0.5;
            float lw = 0.09;
            float d = (hash21(id + uSeed) < 0.5) ? abs(f.y) : abs(f.x);
            float trace = 1.0 - smoothstep(0.0, lw, d);
            float node = (1.0 - smoothstep(lw * 1.3, lw * 1.7, length(f))) * step(0.72, hash21(id + 3.3));
            val = max(trace, node);
        } else if (uPattern == 20) {    // perspective floor grid
            float fy = abs(puv.y - 0.5) + 0.03;
            float depth = 0.15 / fy;
            float hl = abs(fract(depth * (6.0 * uScale)) - 0.5);
            float vx = (puv.x - 0.5) * depth;
            float vl = abs(fract(vx * (10.0 * uScale)) - 0.5);
            float lines = max(1.0 - smoothstep(0.0, 0.06, hl), 1.0 - smoothstep(0.0, 0.06, vl));
            val = lines * smoothstep(0.0, 0.12, fy - 0.03);
        } else if (uPattern == 21) {    // crosshatch / engraving
            vec2 p = ccuv * (14.0 * uScale);
            vec2 e1 = vec2(cos(angRad), sin(angRad));
            vec2 e2 = vec2(cos(angRad + 1.5708), sin(angRad + 1.5708));
            float h1 = 1.0 - smoothstep(0.0, 0.06, abs(fract(dot(p, e1)) - 0.5));
            float h2 = 1.0 - smoothstep(0.0, 0.06, abs(fract(dot(p, e2)) - 0.5));
            val = max(h1, h2);
        } else if (uPattern == 22) {    // quasicrystal (rotated grating interference)
            float q = 0.0;
            float f = 12.0 * uScale;
            for (int i = 0; i < 7; i++) {
                float a = angRad + float(i) * 3.14159265 / 7.0;
                q += cos(dot(ccuv, vec2(cos(a), sin(a))) * f + t);
            }
            val = q / 7.0 * 0.5 + 0.5;
        } else if (uPattern == 23) {    // kaleidoscopic IFS (kali fold) — alien lattice
            vec2 z = ccuv * (1.6 / max(uScale, 0.1));
            vec2 c = vec2(0.7 + 0.25 * sin(t), 0.6 + 0.25 * cos(t));
            float m = 1000.0;
            for (int i = 0; i < 12; i++) {
                z = abs(z) / max(dot(z, z), 0.0015) - c;
                m = min(m, length(z));
            }
            val = clamp(m, 0.0, 1.0);
        } else if (uPattern == 24) {    // julia fractal (animated seed orbits a circle)
            vec2 z = ccuv * (2.4 / max(uScale, 0.1));
            vec2 c = 0.7885 * vec2(cos(t), sin(t));
            float it = 0.0;
            for (int i = 0; i < 64; i++) {
                z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
                if (dot(z, z) > 16.0) break;
                it += 1.0;
            }
            float d2 = dot(z, z);
            float sm = it;
            if (d2 > 1.0) sm = it + 1.0 - log2(0.5 * log2(d2));
            val = sqrt(clamp(sm / 30.0, 0.0, 1.0)); // sqrt spreads the dark escape bands
        } else if (uPattern == 25) {    // metaballs (liquid blobs)
            float m = 0.0;
            for (int i = 0; i < 6; i++) {
                float fi = float(i);
                vec2 c = 0.6 * vec2(sin(t + fi * 1.7 + uSeed), cos(t + fi * 2.3 + uSeed));
                m += 0.05 / max(dot(ccuv - c, ccuv - c), 0.001);
            }
            val = clamp(m * (0.5 / max(uScale, 0.1)), 0.0, 1.0);
        } else if (uPattern == 26) {    // marble / turbulence veins
            vec2 p = puv * (3.0 * uScale) + uSeed;
            float turb = fbm(p + vec2(sin(t), cos(t)) * 0.3);
            val = sin((puv.x + puv.y) * (8.0 * uScale) + turb * 6.0) * 0.5 + 0.5;
        } else if (uPattern == 27) {    // caustics (iterative water light)
            vec2 p = ccuv * (6.0 * uScale) + uSeed;
            float v = 0.0;
            for (int i = 0; i < 4; i++) {
                p += vec2(sin(t + p.y), cos(t + p.x)) * 0.5;
                v += 0.5 / length(sin(p) + 1.3);
            }
            val = clamp(v * 0.35, 0.0, 1.0);
        } else if (uPattern == 28) {    // hyperspace starfield (radial streaks)
            float ang = atan(ccuv.y, ccuv.x);
            float rad = length(ccuv);
            float id = floor((ang / 6.2831853 + 0.5) * 120.0);
            float h = hash21(vec2(id, 1.0) + uSeed);
            float z = fract(rad * (1.5 / max(uScale, 0.1)) - t / 6.2831853 + h);
            val = smoothstep(0.8, 1.0, z) * step(0.55, h) * clamp(rad * 2.0, 0.0, 1.0);
        } else if (uPattern == 29) {    // lissajous oscilloscope curve
            float v = 0.0;
            for (int i = 0; i < 140; i++) {
                float s = float(i) / 140.0 * 6.2831853;
                vec2 q = 0.45 * vec2(sin(s * 3.0 + t), sin(s * 2.0));
                v = max(v, smoothstep(0.025, 0.0, distance(ccuv, q)));
            }
            val = v;
        } else if (uPattern == 30) {    // op-art interference rings
            vec2 c1 = vec2(-0.18 + 0.05 * sin(t), 0.0);
            vec2 c2 = vec2(0.18 - 0.05 * sin(t), 0.0);
            float f = 60.0 * uScale;
            val = (sin(length(ccuv - c1) * f) * sin(length(ccuv - c2) * f)) * 0.5 + 0.5;
        } else if (uPattern == 31) {    // gyroid — volumetric shells (robust, layered)
            vec3 rd = normalize(vec3(ccuv, 1.3));
            vec3 ro = vec3(0.0, 0.0, -2.0);
            float k = 1.4 / max(uScale, 0.2);
            float dens = 0.0;
            for (int i = 0; i < 56; i++) {
                vec3 p = (ro + rd * (float(i) * 0.09)) * k + t; // +t loops at 2pi
                float g = dot(sin(p), cos(p.zxy));
                dens += smoothstep(0.5, 0.28, abs(g)) * (1.0 - float(i) / 70.0); // near-surface shells, depth-faded
            }
            val = clamp(dens * 0.08, 0.0, 1.0);
        } else if (uPattern == 32) {    // raymarched infinite corridor (lit)
            vec3 rd = normalize(vec3(ccuv, 1.2));
            vec3 ro = vec3(0.0, 0.0, 0.0);          // gap centre (pillars sit at odd coords)
            float zoff = t / 6.2831853 * 2.0;       // one 2-unit cell per loop
            float k = 1.0 / max(uScale, 0.3);
            float tt = 0.0; bool hit = false; vec3 hp = vec3(0.0);
            for (int i = 0; i < 64; i++) {
                hp = ro + rd * tt; hp.z += zoff; hp *= k;
                float d = corridorMap(hp) / k;
                if (d < 0.002) { hit = true; break; }
                tt += d;
                if (tt > 16.0) break;
            }
            float sh = 0.0;
            if (hit) {
                vec2 e = vec2(0.02, 0.0);
                vec3 n = normalize(vec3(
                    corridorMap(hp + e.xyy) - corridorMap(hp - e.xyy),
                    corridorMap(hp + e.yxy) - corridorMap(hp - e.yxy),
                    corridorMap(hp + e.yyx) - corridorMap(hp - e.yyx)));
                float diff = max(0.0, dot(n, normalize(vec3(0.4, 0.7, -0.5))));
                sh = (0.2 + 0.8 * diff) * (1.0 - tt / 16.0);
            }
            val = clamp(sh, 0.0, 1.0);
        } else if (uPattern == 33) {    // raymarched mandelbulb
            vec3 rd = normalize(vec3(ccuv, 1.4));
            vec3 ro = vec3(0.0, 0.0, -2.4);
            float k = 1.0 / max(uScale, 0.4);
            float tt = 0.0; float st = 0.0; float hit = 0.0;
            for (int i = 0; i < 48; i++) {
                vec3 p = ro + rd * tt;
                p.xz = rot2(t) * p.xz;             // rotate -> loops at 2pi
                float d = mandelbulbMap(p * k) / k;
                if (d < 0.0015) { hit = 1.0; break; }
                tt += d; st += 1.0;
                if (tt > 6.0) break;
            }
            val = clamp(hit * 0.35 + (1.0 - st / 48.0) * 0.85, 0.0, 1.0);
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

        // composite the uploaded image layer (mask / blend) onto the pattern
        color = composeImage(color);

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
