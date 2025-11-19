export const fragmentShader = `
                    uniform sampler2D tDiffuse;
                    uniform sampler2D tPrevious;
                    uniform int uAlgorithm;
                    uniform int uAlgorithm2;
                    uniform bool uAlgo2Enabled;
                    uniform int uAlgo2BlendMode;
                    uniform float uAlgo2BlendAmount;
                    uniform float uThreshold;
                    uniform float uTemporalWeight;
                    uniform float uContrast;
                    uniform float uBrightness;
                    uniform int uColors;
                    uniform bool uInvert;
                    uniform bool uGrayscale;
                    uniform vec2 uResolution;
                    uniform float uTime;
                    uniform float uParam1, uParam2, uParam3, uParam4;
                    uniform float uScale, uMidtones, uHighlights, uLumThreshold, uBlur;
                    uniform float uPixelation;
                    uniform int uColorMode;
                    uniform vec3 uDuotoneDark;
                    uniform vec3 uDuotoneLight;
                    uniform vec3 uTritoneShadow;
                    uniform vec3 uTritoneMid;
                    uniform vec3 uTritoneHighlight;
                    uniform vec3 uPaletteColors[16];
                    uniform int uPaletteSize;

                    // Advanced Dithering Enhancements
                    uniform bool uSerpentine;
                    uniform bool uGammaCorrect;
                    uniform float uDitherStrength;
                    uniform float uPatternRandomization;
                    uniform bool uTemporalDither;
                    uniform float uTemporalSpeed;
                    uniform int uColorSpace;
                    uniform bool uAdaptiveThreshold;
                    uniform int uAdaptiveWindow;
                    uniform float uEdgePreservation;
                    uniform float uBandingReduction;
                    uniform float uPixelAspectRatio;
                    uniform float uCRTEffect;

                    varying vec2 vUv;

                    float hash(vec2 p) {
                        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                    }

                    // Apply pattern randomization and temporal dithering to reduce banding
                    vec2 randomizeCoord(vec2 coord) {
                        vec2 result = coord;

                        // Spatial randomization
                        if (uPatternRandomization > 0.0) {
                            vec2 offset = vec2(
                                hash(coord) * 2.0 - 1.0,
                                hash(coord + vec2(12.34, 56.78)) * 2.0 - 1.0
                            );
                            result += offset * uPatternRandomization;
                        }

                        // Temporal randomization (animated)
                        if (uTemporalDither) {
                            float timePhase = uTime * uTemporalSpeed;
                            vec2 temporalOffset = vec2(
                                sin(timePhase + coord.x * 0.1) * 0.5,
                                cos(timePhase + coord.y * 0.1) * 0.5
                            );
                            result += temporalOffset;
                        }

                        return result;
                    }

                    // ============================================================
                    // ENHANCED QUALITY FUNCTIONS
                    // ============================================================

                    // RGB to LAB color space conversion for perceptual accuracy
                    vec3 rgb2xyz(vec3 rgb) {
                        // sRGB gamma correction
                        vec3 linear;
                        for (int i = 0; i < 3; i++) {
                            float c = (i == 0) ? rgb.r : (i == 1) ? rgb.g : rgb.b;
                            if (c > 0.04045) {
                                linear[i] = pow((c + 0.055) / 1.055, 2.4);
                            } else {
                                linear[i] = c / 12.92;
                            }
                        }

                        // RGB to XYZ (D65 illuminant)
                        mat3 transform = mat3(
                            0.4124564, 0.3575761, 0.1804375,
                            0.2126729, 0.7151522, 0.0721750,
                            0.0193339, 0.1191920, 0.9503041
                        );
                        return linear * transform;
                    }

                    vec3 xyz2lab(vec3 xyz) {
                        // D65 reference white
                        vec3 ref = vec3(0.95047, 1.0, 1.08883);
                        xyz = xyz / ref;

                        vec3 f;
                        for (int i = 0; i < 3; i++) {
                            float t = (i == 0) ? xyz.x : (i == 1) ? xyz.y : xyz.z;
                            if (t > 0.008856) {
                                f[i] = pow(t, 1.0/3.0);
                            } else {
                                f[i] = (7.787 * t) + (16.0 / 116.0);
                            }
                        }

                        float L = (116.0 * f.y) - 16.0;
                        float a = 500.0 * (f.x - f.y);
                        float b = 200.0 * (f.y - f.z);

                        return vec3(L / 100.0, (a + 128.0) / 255.0, (b + 128.0) / 255.0);
                    }

                    vec3 rgb2lab(vec3 rgb) {
                        return xyz2lab(rgb2xyz(rgb));
                    }

                    vec3 lab2xyz(vec3 lab) {
                        float L = lab.x * 100.0;
                        float a = (lab.y * 255.0) - 128.0;
                        float b = (lab.z * 255.0) - 128.0;

                        float fy = (L + 16.0) / 116.0;
                        float fx = a / 500.0 + fy;
                        float fz = fy - b / 200.0;

                        vec3 xyz;
                        float delta = 6.0 / 29.0;

                        xyz.x = (fx > delta) ? pow(fx, 3.0) : 3.0 * delta * delta * (fx - 4.0/29.0);
                        xyz.y = (fy > delta) ? pow(fy, 3.0) : 3.0 * delta * delta * (fy - 4.0/29.0);
                        xyz.z = (fz > delta) ? pow(fz, 3.0) : 3.0 * delta * delta * (fz - 4.0/29.0);

                        vec3 ref = vec3(0.95047, 1.0, 1.08883);
                        return xyz * ref;
                    }

                    vec3 xyz2rgb(vec3 xyz) {
                        // XYZ to linear RGB
                        mat3 transform = mat3(
                            3.2404542, -1.5371385, -0.4985314,
                            -0.9692660, 1.8760108, 0.0415560,
                            0.0556434, -0.2040259, 1.0572252
                        );
                        vec3 linear = xyz * transform;

                        // Gamma correction
                        vec3 rgb;
                        for (int i = 0; i < 3; i++) {
                            float c = (i == 0) ? linear.r : (i == 1) ? linear.g : linear.b;
                            if (c > 0.0031308) {
                                rgb[i] = 1.055 * pow(c, 1.0/2.4) - 0.055;
                            } else {
                                rgb[i] = 12.92 * c;
                            }
                        }
                        return clamp(rgb, 0.0, 1.0);
                    }

                    vec3 lab2rgb(vec3 lab) {
                        return xyz2rgb(lab2xyz(lab));
                    }

                    // Perceptual color distance in LAB space
                    float colorDistance(vec3 c1, vec3 c2) {
                        vec3 lab1 = rgb2lab(c1);
                        vec3 lab2 = rgb2lab(c2);
                        vec3 delta = lab1 - lab2;

                        // Weighted euclidean distance (CIEDE2000 approximation)
                        float dL = delta.x;
                        float da = delta.y;
                        float db = delta.z;

                        return sqrt(dL*dL + da*da + db*db);
                    }

                    // ============================================================
                    // HSL COLOR SPACE (for hue-based dithering)
                    // ============================================================

                    // RGB to HSL conversion
                    vec3 rgb2hsl(vec3 rgb) {
                        float maxVal = max(max(rgb.r, rgb.g), rgb.b);
                        float minVal = min(min(rgb.r, rgb.g), rgb.b);
                        float delta = maxVal - minVal;

                        // Lightness
                        float l = (maxVal + minVal) / 2.0;

                        // Saturation
                        float s = 0.0;
                        if (delta != 0.0) {
                            s = l < 0.5 ? delta / (maxVal + minVal) : delta / (2.0 - maxVal - minVal);
                        }

                        // Hue
                        float h = 0.0;
                        if (delta != 0.0) {
                            if (maxVal == rgb.r) {
                                h = mod((rgb.g - rgb.b) / delta, 6.0);
                            } else if (maxVal == rgb.g) {
                                h = (rgb.b - rgb.r) / delta + 2.0;
                            } else {
                                h = (rgb.r - rgb.g) / delta + 4.0;
                            }
                            h /= 6.0;
                        }

                        return vec3(h, s, l);
                    }

                    // HSL to RGB conversion
                    vec3 hsl2rgb(vec3 hsl) {
                        float h = hsl.x;
                        float s = hsl.y;
                        float l = hsl.z;

                        float c = (1.0 - abs(2.0 * l - 1.0)) * s;
                        float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
                        float m = l - c / 2.0;

                        vec3 rgb = vec3(0.0);
                        float h6 = h * 6.0;

                        if (h6 < 1.0) rgb = vec3(c, x, 0.0);
                        else if (h6 < 2.0) rgb = vec3(x, c, 0.0);
                        else if (h6 < 3.0) rgb = vec3(0.0, c, x);
                        else if (h6 < 4.0) rgb = vec3(0.0, x, c);
                        else if (h6 < 5.0) rgb = vec3(x, 0.0, c);
                        else rgb = vec3(c, 0.0, x);

                        return rgb + vec3(m);
                    }

                    // Hue distance (accounts for circular nature: 0 and 1 are the same)
                    float hueDistance(float h1, float h2) {
                        float diff = abs(h1 - h2);
                        return min(diff, 1.0 - diff);
                    }

                    // Hue-based color distance (prioritizes hue matching over luminance)
                    float hueColorDistance(vec3 c1, vec3 c2) {
                        vec3 hsl1 = rgb2hsl(c1);
                        vec3 hsl2 = rgb2hsl(c2);

                        float hueDist = hueDistance(hsl1.x, hsl2.x);
                        float satDist = abs(hsl1.y - hsl2.y);
                        float lightDist = abs(hsl1.z - hsl2.z);

                        // Weight hue heavily, then saturation, then lightness
                        return hueDist * 2.0 + satDist * 0.5 + lightDist * 0.3;
                    }

                    // ============================================================
                    // ADVANCED DITHERING ENHANCEMENTS
                    // ============================================================

                    // Gamma correction for linear light dithering
                    vec3 srgbToLinear(vec3 srgb) {
                        // sRGB to linear RGB (gamma expansion)
                        return mix(
                            srgb / 12.92,
                            pow((srgb + 0.055) / 1.055, vec3(2.4)),
                            step(0.04045, srgb)
                        );
                    }

                    vec3 linearToSrgb(vec3 linear) {
                        // Linear RGB to sRGB (gamma compression)
                        return mix(
                            linear * 12.92,
                            pow(linear, vec3(1.0/2.4)) * 1.055 - 0.055,
                            step(0.0031308, linear)
                        );
                    }

                    // Oklab color space - better than LAB, modern perceptual
                    vec3 rgb2oklab(vec3 rgb) {
                        // sRGB to linear
                        vec3 linear = srgbToLinear(rgb);

                        // Linear RGB to LMS (cone response)
                        mat3 rgb_to_lms = mat3(
                            0.4122214708, 0.5363325363, 0.0514459929,
                            0.2119034982, 0.6806995451, 0.1073969566,
                            0.0883024619, 0.2817188376, 0.6299787005
                        );
                        vec3 lms = rgb_to_lms * linear;

                        // Nonlinear transform
                        lms = sign(lms) * pow(abs(lms), vec3(1.0/3.0));

                        // LMS to Oklab
                        mat3 lms_to_oklab = mat3(
                            0.2104542553, 0.7936177850, -0.0040720468,
                            1.9779984951, -2.4285922050, 0.4505937099,
                            0.0259040371, 0.7827717662, -0.8086757660
                        );
                        return lms_to_oklab * lms;
                    }

                    vec3 oklab2rgb(vec3 oklab) {
                        // Oklab to LMS
                        mat3 oklab_to_lms = mat3(
                            1.0, 0.3963377774, 0.2158037573,
                            1.0, -0.1055613458, -0.0638541728,
                            1.0, -0.0894841775, -1.2914855480
                        );
                        vec3 lms = oklab_to_lms * oklab;

                        // Reverse nonlinear transform
                        lms = lms * lms * lms;

                        // LMS to linear RGB
                        mat3 lms_to_rgb = mat3(
                            4.0767416621, -3.3077115913, 0.2309699292,
                            -1.2684380046, 2.6097574011, -0.3413193965,
                            -0.0041960863, -0.7034186147, 1.7076147010
                        );
                        vec3 linear = lms_to_rgb * lms;

                        // Linear to sRGB
                        return linearToSrgb(linear);
                    }

                    // CIEDE2000 - most accurate perceptual color distance
                    float ciede2000(vec3 lab1, vec3 lab2) {
                        float L1 = lab1.x * 100.0, a1 = (lab1.y * 255.0) - 128.0, b1 = (lab1.z * 255.0) - 128.0;
                        float L2 = lab2.x * 100.0, a2 = (lab2.y * 255.0) - 128.0, b2 = (lab2.z * 255.0) - 128.0;

                        float C1 = sqrt(a1*a1 + b1*b1);
                        float C2 = sqrt(a2*a2 + b2*b2);
                        float Cab = (C1 + C2) / 2.0;

                        float G = 0.5 * (1.0 - sqrt(pow(Cab, 7.0) / (pow(Cab, 7.0) + pow(25.0, 7.0))));
                        float ap1 = (1.0 + G) * a1;
                        float ap2 = (1.0 + G) * a2;

                        float Cp1 = sqrt(ap1*ap1 + b1*b1);
                        float Cp2 = sqrt(ap2*ap2 + b2*b2);

                        float hp1 = (ap1 == 0.0 && b1 == 0.0) ? 0.0 : atan(b1, ap1);
                        float hp2 = (ap2 == 0.0 && b2 == 0.0) ? 0.0 : atan(b2, ap2);

                        if (hp1 < 0.0) hp1 += 6.28318530718;
                        if (hp2 < 0.0) hp2 += 6.28318530718;

                        float dL = L2 - L1;
                        float dC = Cp2 - Cp1;
                        float dhp = hp2 - hp1;

                        if (Cp1 * Cp2 == 0.0) dhp = 0.0;
                        else if (abs(dhp) <= 3.14159265359) dhp = dhp;
                        else if (dhp > 3.14159265359) dhp -= 6.28318530718;
                        else dhp += 6.28318530718;

                        float dH = 2.0 * sqrt(Cp1 * Cp2) * sin(dhp / 2.0);

                        float Lp = (L1 + L2) / 2.0;
                        float Cp = (Cp1 + Cp2) / 2.0;

                        float Hp = (Cp1 * Cp2 == 0.0) ? (hp1 + hp2) :
                                   (abs(hp1 - hp2) <= 3.14159265359) ? (hp1 + hp2) / 2.0 :
                                   ((hp1 + hp2) < 6.28318530718) ? (hp1 + hp2 + 6.28318530718) / 2.0 :
                                   (hp1 + hp2 - 6.28318530718) / 2.0;

                        float T = 1.0 - 0.17 * cos(Hp - 0.5236) + 0.24 * cos(2.0 * Hp) +
                                  0.32 * cos(3.0 * Hp + 0.1047) - 0.20 * cos(4.0 * Hp - 1.0996);

                        float dTheta = 0.5236 * exp(-pow((Hp - 4.7996) / 0.4363, 2.0));
                        float RC = 2.0 * sqrt(pow(Cp, 7.0) / (pow(Cp, 7.0) + pow(25.0, 7.0)));
                        float SL = 1.0 + (0.015 * pow(Lp - 50.0, 2.0)) / sqrt(20.0 + pow(Lp - 50.0, 2.0));
                        float SC = 1.0 + 0.045 * Cp;
                        float SH = 1.0 + 0.015 * Cp * T;
                        float RT = -sin(2.0 * dTheta) * RC;

                        float kL = 1.0, kC = 1.0, kH = 1.0;

                        return sqrt(
                            pow(dL / (kL * SL), 2.0) +
                            pow(dC / (kC * SC), 2.0) +
                            pow(dH / (kH * SH), 2.0) +
                            RT * (dC / (kC * SC)) * (dH / (kH * SH))
                        );
                    }

                    // Weighted Euclidean distance (fast, perceptually weighted)
                    float weightedRGBDistance(vec3 c1, vec3 c2) {
                        vec3 diff = c1 - c2;
                        // Weights based on human perception (green most sensitive)
                        vec3 weights = vec3(0.299, 0.587, 0.114);
                        return dot(diff * diff, weights);
                    }

                    // Calculate local adaptive threshold based on neighborhood
                    float getAdaptiveThresholdValue(vec2 uv, sampler2D tex, int windowSize) {
                        float sum = 0.0;
                        float count = 0.0;
                        int halfWindow = windowSize / 2;

                        for (int y = -halfWindow; y <= halfWindow; y++) {
                            for (int x = -halfWindow; x <= halfWindow; x++) {
                                vec2 offset = vec2(float(x), float(y)) / uResolution;
                                vec3 texSample = texture2D(tex, uv + offset).rgb;
                                float lum = dot(texSample, vec3(0.299, 0.587, 0.114));
                                sum += lum;
                                count += 1.0;
                            }
                        }

                        return sum / count;
                    }

                    // Enhanced edge detection for preservation
                    float detectEdge(vec2 uv, sampler2D tex) {
                        vec2 texel = 1.0 / uResolution;

                        // Sobel kernels
                        float gx = 0.0, gy = 0.0;

                        // Top row
                        gx += -1.0 * dot(texture2D(tex, uv + vec2(-texel.x, -texel.y)).rgb, vec3(0.299, 0.587, 0.114));
                        gx += -2.0 * dot(texture2D(tex, uv + vec2(-texel.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
                        gx += -1.0 * dot(texture2D(tex, uv + vec2(-texel.x, texel.y)).rgb, vec3(0.299, 0.587, 0.114));

                        // Bottom row
                        gx += 1.0 * dot(texture2D(tex, uv + vec2(texel.x, -texel.y)).rgb, vec3(0.299, 0.587, 0.114));
                        gx += 2.0 * dot(texture2D(tex, uv + vec2(texel.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
                        gx += 1.0 * dot(texture2D(tex, uv + vec2(texel.x, texel.y)).rgb, vec3(0.299, 0.587, 0.114));

                        // Left column
                        gy += -1.0 * dot(texture2D(tex, uv + vec2(-texel.x, -texel.y)).rgb, vec3(0.299, 0.587, 0.114));
                        gy += -2.0 * dot(texture2D(tex, uv + vec2(0.0, -texel.y)).rgb, vec3(0.299, 0.587, 0.114));
                        gy += -1.0 * dot(texture2D(tex, uv + vec2(texel.x, -texel.y)).rgb, vec3(0.299, 0.587, 0.114));

                        // Right column
                        gy += 1.0 * dot(texture2D(tex, uv + vec2(-texel.x, texel.y)).rgb, vec3(0.299, 0.587, 0.114));
                        gy += 2.0 * dot(texture2D(tex, uv + vec2(0.0, texel.y)).rgb, vec3(0.299, 0.587, 0.114));
                        gy += 1.0 * dot(texture2D(tex, uv + vec2(texel.x, texel.y)).rgb, vec3(0.299, 0.587, 0.114));

                        return sqrt(gx * gx + gy * gy);
                    }

                    // Detect posterization banding in gradients
                    float detectBanding(vec2 uv, sampler2D tex) {
                        vec2 texel = 1.0 / uResolution;

                        vec3 center = texture2D(tex, uv).rgb;
                        float centerLum = dot(center, vec3(0.299, 0.587, 0.114));

                        // Sample 8 neighbors
                        float maxDiff = 0.0;
                        for (int y = -1; y <= 1; y++) {
                            for (int x = -1; x <= 1; x++) {
                                if (x == 0 && y == 0) continue;
                                vec3 texSample = texture2D(tex, uv + vec2(float(x), float(y)) * texel).rgb;
                                float lum = dot(texSample, vec3(0.299, 0.587, 0.114));
                                maxDiff = max(maxDiff, abs(lum - centerLum));
                            }
                        }

                        // Sharp discontinuity with low gradient = banding
                        float gradient = maxDiff;
                        float sharpness = step(0.02, gradient) * step(gradient, 0.1);
                        return sharpness;
                    }

                    // Apply pixel aspect ratio (for retro systems)
                    vec2 applyPixelAspectRatio(vec2 uv, float par) {
                        vec2 centered = uv - 0.5;
                        centered.x /= par;
                        return centered + 0.5;
                    }

                    // Subtle CRT simulation (scanlines + slight curvature)
                    vec3 applyCRTEffect(vec3 color, vec2 uv, float strength) {
                        if (strength <= 0.0) return color;

                        // Scanlines
                        float scanline = sin(uv.y * uResolution.y * 3.14159) * 0.5 + 0.5;
                        scanline = mix(1.0, scanline, strength * 0.3);

                        // Slight vignette
                        vec2 center = uv - 0.5;
                        float vignette = 1.0 - dot(center, center) * strength;

                        return color * scanline * vignette;
                    }

                    // Find two closest colors by hue
                    void findClosestHueColors(vec3 color, out vec3 color1, out vec3 color2, out float closeness) {
                        vec3 hsl = rgb2hsl(color);

                        float minDist1 = 10.0;
                        float minDist2 = 10.0;
                        color1 = uPaletteColors[0];
                        color2 = uPaletteColors[1];

                        // Find two closest by hue
                        for (int i = 0; i < 16; i++) {
                            if (i >= uPaletteSize) break;

                            float dist = hueColorDistance(color, uPaletteColors[i]);

                            if (dist < minDist1) {
                                minDist2 = minDist1;
                                color2 = color1;
                                minDist1 = dist;
                                color1 = uPaletteColors[i];
                            } else if (dist < minDist2) {
                                minDist2 = dist;
                                color2 = uPaletteColors[i];
                            }
                        }

                        // Closeness factor for dithering threshold
                        closeness = minDist1 / (minDist1 + minDist2 + 0.001);
                    }


                    // Edge-aware adaptive dithering strength
                    float getAdaptiveDitherStrength(vec2 uv) {
                        vec2 texel = 1.0 / uResolution;

                        // Sample neighborhood for edge detection
                        vec3 c = texture2D(tDiffuse, uv).rgb;
                        vec3 n = texture2D(tDiffuse, uv + vec2(0, texel.y)).rgb;
                        vec3 s = texture2D(tDiffuse, uv - vec2(0, texel.y)).rgb;
                        vec3 e = texture2D(tDiffuse, uv + vec2(texel.x, 0)).rgb;
                        vec3 w = texture2D(tDiffuse, uv - vec2(texel.x, 0)).rgb;

                        // Calculate local variance
                        float variance = 0.0;
                        variance += distance(c, n);
                        variance += distance(c, s);
                        variance += distance(c, e);
                        variance += distance(c, w);
                        variance *= 0.25;

                        // Less dithering on edges (preserve detail), more on flat areas
                        return mix(0.5, 1.5, smoothstep(0.0, 0.3, variance));
                    }

                    // Subpixel-accurate dither pattern sampling
                    float sampleDitherPattern(vec2 coord, float pattern) {
                        // Apply slight antialiasing to pattern
                        vec2 antialiasCoord = fract(coord);
                        float aa = smoothstep(0.45, 0.55, max(antialiasCoord.x, antialiasCoord.y));
                        return mix(pattern, pattern * 0.8, aa * 0.2);
                    }

                    // Blue noise approximation (improved quality)
                    float blueNoiseImproved(vec2 coord) {
                        // Multi-octave blue noise
                        float noise = 0.0;
                        float amplitude = 1.0;
                        float frequency = 1.0;

                        for (int octave = 0; octave < 4; octave++) {
                            vec2 p = coord * frequency * 0.1;
                            vec2 ip = floor(p);
                            vec2 f = fract(p);

                            // Quintic interpolation for smoother results
                            f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

                            float a = hash(ip);
                            float b = hash(ip + vec2(1.0, 0.0));
                            float c = hash(ip + vec2(0.0, 1.0));
                            float d = hash(ip + vec2(1.0, 1.0));

                            float n = mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
                            noise += n * amplitude;

                            frequency *= 2.0;
                            amplitude *= 0.5;
                        }

                        return noise;
                    }

                    // Blend modes for multi-algorithm layering
                    float blendPatterns(float base, float layer, int mode, float amount) {
                        float result;

                        if (mode == 0) {
                            // Multiply - combines patterns
                            result = base * layer;
                        } else if (mode == 1) {
                            // Add - brightens
                            result = min(base + layer, 1.0);
                        } else if (mode == 2) {
                            // Screen - lightens
                            result = 1.0 - (1.0 - base) * (1.0 - layer);
                        } else if (mode == 3) {
                            // Overlay - increases contrast
                            if (base < 0.5) {
                                result = 2.0 * base * layer;
                            } else {
                                result = 1.0 - 2.0 * (1.0 - base) * (1.0 - layer);
                            }
                        } else {
                            // Mix - simple average
                            result = (base + layer) * 0.5;
                        }

                        // Blend with amount
                        return mix(base, result, amount);
                    }


                    float noise(vec2 p) {
                        vec2 i = floor(p);
                        vec2 f = fract(p);
                        f = f * f * (3.0 - 2.0 * f);
                        float a = hash(i);
                        float b = hash(i + vec2(1.0, 0.0));
                        float c = hash(i + vec2(0.0, 1.0));
                        float d = hash(i + vec2(1.0, 1.0));
                        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
                    }

                    // Bayer matrices
                    float bayer2(vec2 coord) {
                        vec2 randomized = randomizeCoord(coord);
                        vec2 p = mod(floor(randomized / uParam1), 2.0);
                        return (p.x + p.y * 2.0) / 4.0;
                    }

                    float bayer4(vec2 coord) {
                        mat4 m = mat4(
                            0.0, 8.0, 2.0, 10.0,
                            12.0, 4.0, 14.0, 6.0,
                            3.0, 11.0, 1.0, 9.0,
                            15.0, 7.0, 13.0, 5.0
                        );
                        vec2 randomized = randomizeCoord(coord);
                        vec2 p = mod(floor(randomized / uParam1), 4.0);
                        return m[int(p.x)][int(p.y)] / 16.0 * uParam2;
                    }

                    float bayer8(vec2 coord) {
                        vec2 randomized = randomizeCoord(coord);
                        return bayer4(randomized * 0.5 / uParam1) * 0.25 + bayer4(randomized / uParam1) * 0.75 * uParam2;
                    }

                    float bayer16(vec2 coord) {
                        vec2 randomized = randomizeCoord(coord);
                        return bayer8(randomized * 0.5 / uParam1) * 0.25 + bayer8(randomized / uParam1) * 0.75 * uParam2;
                    }

                    // Error diffusion (approximation with noise + serpentine)
                    float errorDiffusion(vec2 coord, float diffusion) {
                        vec2 adjustedCoord = coord;

                        // Serpentine scanning: reverse direction on odd rows
                        if (uSerpentine) {
                            float row = floor(coord.y);
                            if (mod(row, 2.0) > 0.5) {
                                // Odd row - reverse X direction
                                adjustedCoord.x = uResolution.x - coord.x;
                            }
                        }

                        float n = hash(adjustedCoord) * 2.0 - 1.0;
                        return uThreshold + n * 0.1 * diffusion;
                    }

                    // Ostromoukhov variable error diffusion coefficients
                    // Based on SIGGRAPH 2001 paper - varies coefficients by intensity for blue-noise
                    vec3 getOstromoukhov(float intensity) {
                        // Simplified coefficient table (13 key values from the paper)
                        // Format: vec3(right, bottom-left, bottom) normalized
                        float i = clamp(intensity, 0.0, 1.0);

                        // Piecewise linear interpolation of key coefficients
                        if (i < 0.1) {
                            return mix(vec3(13.0, 0.0, 5.0), vec3(13.0, 2.0, 3.0), i / 0.1) / 18.0;
                        } else if (i < 0.2) {
                            return mix(vec3(13.0, 2.0, 3.0), vec3(21.0, 10.0, 10.0), (i - 0.1) / 0.1) / 41.0;
                        } else if (i < 0.3) {
                            return mix(vec3(7.0, 4.0, 5.0), vec3(11.0, 7.0, 8.0), (i - 0.2) / 0.1) / 16.0;
                        } else if (i < 0.5) {
                            return mix(vec3(11.0, 7.0, 8.0), vec3(12.0, 9.0, 9.0), (i - 0.3) / 0.2) / 26.0;
                        } else if (i < 0.7) {
                            return mix(vec3(12.0, 9.0, 9.0), vec3(10.0, 9.0, 11.0), (i - 0.5) / 0.2) / 30.0;
                        } else if (i < 0.9) {
                            return mix(vec3(10.0, 9.0, 11.0), vec3(5.0, 6.0, 7.0), (i - 0.7) / 0.2) / 18.0;
                        } else {
                            return mix(vec3(5.0, 6.0, 7.0), vec3(3.0, 3.0, 12.0), (i - 0.9) / 0.1) / 18.0;
                        }
                    }

                    float ostromoukhov(vec2 coord) {
                        vec2 adjustedCoord = coord;

                        // Serpentine scanning
                        if (uSerpentine) {
                            float row = floor(coord.y);
                            if (mod(row, 2.0) > 0.5) {
                                adjustedCoord.x = uResolution.x - coord.x;
                            }
                        }

                        // Get local intensity to determine coefficients
                        float localIntensity = hash(adjustedCoord);
                        vec3 coeffs = getOstromoukhov(localIntensity);

                        // Apply variable error diffusion approximation
                        float error = hash(adjustedCoord + vec2(0.5, 0.5)) * 2.0 - 1.0;
                        float diffused = error * (coeffs.x + coeffs.y + coeffs.z) * uParam1;

                        return uThreshold + diffused * 0.15;
                    }

                    // Halftone
                    float halftone(vec2 coord) {
                        float angle = uParam2;
                        vec2 rotated = vec2(
                            coord.x * cos(angle) - coord.y * sin(angle),
                            coord.x * sin(angle) + coord.y * cos(angle)
                        );
                        vec2 nearest = floor(rotated / uParam1) * uParam1 + uParam1 * 0.5;
                        float dist = distance(rotated, nearest);
                        return 1.0 - smoothstep(0.0, uParam1 * 0.5, dist) * uParam3;
                    }

                    // Dots pattern
                    float dots(vec2 coord) {
                        vec2 grid = floor(coord / uParam1);
                        vec2 center = grid * uParam1 + uParam1 * 0.5;
                        center += (hash(grid) - 0.5) * uParam1 * uParam2;
                        return smoothstep(uParam1 * 0.3, 0.0, distance(coord, center));
                    }

                    // Lines pattern
                    float lines(vec2 coord) {
                        float angle = uParam2;
                        vec2 rotated = vec2(
                            coord.x * cos(angle) - coord.y * sin(angle),
                            coord.x * sin(angle) + coord.y * cos(angle)
                        );
                        return step(uParam1, mod(rotated.y, uParam3));
                    }

                    // Crosshatch
                    float crosshatch(vec2 coord) {
                        float l1 = lines(coord);
                        vec2 coord2 = vec2(coord.x * cos(uParam2) - coord.y * sin(uParam2),
                                          coord.x * sin(uParam2) + coord.y * cos(uParam2));
                        float l2 = step(uParam1, mod(coord2.y, uParam1 * 2.0));
                        return max(l1, l2);
                    }

                    // Random/Blue/Perlin noise
                    float randomNoise(vec2 coord) {
                        return hash(coord + uParam2) * uParam1;
                    }

                    // Blue Noise 64x64 precomputed matrix
                    // High-frequency noise optimized for human perception
                    float blueNoiseMatrix64(vec2 coord) {
                        // Using a procedural approximation of blue noise
                        // True blue noise would require a texture lookup
                        vec2 p = mod(coord, 64.0);
                        float n = hash(p / 64.0);

                        // Apply multiple scales to approximate blue noise spectrum
                        float noise1 = hash(p * 0.25);
                        float noise2 = hash(p * 0.5);
                        float noise3 = hash(p * 1.0);

                        // Weight towards high frequencies (blue noise characteristic)
                        return noise1 * 0.1 + noise2 * 0.2 + noise3 * 0.7;
                    }

                    float blueNoise(vec2 coord) {
                        vec2 randomized = randomizeCoord(coord);
                        float scale = uParam1 > 0.0 ? uParam1 : 1.0;
                        return blueNoiseMatrix64(randomized * scale) * uParam2;
                    }

                    float perlinNoise(vec2 coord) {
                        float n = 0.0;
                        float amp = 1.0;
                        float freq = uParam1;
                        for (int i = 0; i < 8; i++) {
                            if (float(i) >= uParam2) break;
                            n += noise(coord * freq) * amp;
                            amp *= 0.5;
                            freq *= 2.0;
                        }
                        return n;
                    }

                    // New algorithms
                    float dispersed(vec2 coord) {
                        return bayer8(coord * uParam1) * uParam2;
                    }

                    float clustered(vec2 coord) {
                        vec2 p = mod(coord / uParam1, 4.0);
                        float center = 2.0;
                        float dist = distance(p, vec2(center));
                        return (1.0 - smoothstep(0.0, 2.0, dist)) * uParam2;
                    }

                    // Void-and-Cluster: Combines dispersed (void) and clustered patterns
                    // Creates aperiodic patterns optimized for human perception
                    float voidAndCluster(vec2 coord) {
                        vec2 randomized = randomizeCoord(coord);
                        float scale = uParam1 > 0.0 ? uParam1 : 8.0;
                        vec2 p = randomized / scale;

                        // Use multiple offset grids to create void-and-cluster effect
                        float cluster1 = clustered(p * 1.0);
                        float cluster2 = clustered(p * 1.3 + vec2(5.7, 3.1));
                        float cluster3 = clustered(p * 0.7 + vec2(2.3, 8.9));

                        // Blend dispersed and clustered components
                        float dispersedPart = bayer8(randomized);
                        float clusteredPart = (cluster1 + cluster2 + cluster3) / 3.0;

                        // Weight towards clustered for smoother gradients
                        return mix(dispersedPart, clusteredPart, 0.6) * uParam2;
                    }

                    float halftone45deg(vec2 coord) {
                        float angle = 0.785398; // 45 degrees
                        vec2 rotated = vec2(
                            coord.x * cos(angle) - coord.y * sin(angle),
                            coord.x * sin(angle) + coord.y * cos(angle)
                        );
                        vec2 nearest = floor(rotated / uParam1) * uParam1 + uParam1 * 0.5;
                        return 1.0 - smoothstep(0.0, uParam1 * 0.5, distance(rotated, nearest)) * uParam2;
                    }

                    float ellipseHalftone(vec2 coord) {
                        float angle = uParam3;
                        vec2 rotated = vec2(
                            coord.x * cos(angle) - coord.y * sin(angle),
                            coord.x * sin(angle) + coord.y * cos(angle)
                        );
                        vec2 grid = floor(rotated / uParam1) * uParam1 + uParam1 * 0.5;
                        vec2 delta = (rotated - grid) / vec2(uParam2, 1.0);
                        return 1.0 - smoothstep(0.0, uParam1 * 0.3, length(delta));
                    }

                    float diamondHalftone(vec2 coord) {
                        vec2 grid = floor(coord / uParam1) * uParam1 + uParam1 * 0.5;
                        vec2 delta = abs(coord - grid);
                        float dist = (delta.x + delta.y);
                        return 1.0 - smoothstep(0.0, uParam1 * 0.5, dist) * uParam2;
                    }

                    // 4x4 Pattern Dithering (from dithering-shader repo)
                    // Based on: https://www.shadertoy.com/view/ltSSzW
                    bool pattern4x4GetValue(float brightness, vec2 pos, float gridSize) {
                        // Early return for extreme values
                        if (brightness > 16.0 / 17.0) return false;
                        if (brightness < 1.0 / 17.0) return true;

                        // Calculate position in 4x4 dither matrix
                        vec2 pixel = floor(mod(pos / gridSize, 4.0));
                        int x = int(pixel.x);
                        int y = int(pixel.y);

                        // 4x4 Bayer matrix threshold map
                        if (x == 0) {
                            if (y == 0) return brightness < 16.0 / 17.0;
                            if (y == 1) return brightness < 5.0 / 17.0;
                            if (y == 2) return brightness < 13.0 / 17.0;
                            return brightness < 1.0 / 17.0; // y == 3
                        }
                        else if (x == 1) {
                            if (y == 0) return brightness < 8.0 / 17.0;
                            if (y == 1) return brightness < 12.0 / 17.0;
                            if (y == 2) return brightness < 4.0 / 17.0;
                            return brightness < 9.0 / 17.0; // y == 3
                        }
                        else if (x == 2) {
                            if (y == 0) return brightness < 14.0 / 17.0;
                            if (y == 1) return brightness < 2.0 / 17.0;
                            if (y == 2) return brightness < 15.0 / 17.0;
                            return brightness < 3.0 / 17.0; // y == 3
                        }
                        else { // x == 3
                            if (y == 0) return brightness < 6.0 / 17.0;
                            if (y == 1) return brightness < 10.0 / 17.0;
                            if (y == 2) return brightness < 7.0 / 17.0;
                            return brightness < 11.0 / 17.0; // y == 3
                        }
                    }

                    float pattern4x4Dither(vec2 coord) {
                        float gridSize = uParam1;
                        float pixelSizeRatio = uParam2;

                        // Apply pixelation effect
                        float pixelSize = gridSize * pixelSizeRatio;
                        vec2 pixelatedCoord = floor(coord / pixelSize) * pixelSize;

                        // Calculate perceptual luminance (ITU-R BT.709 standard)
                        vec3 baseColor = texture2D(tDiffuse, pixelatedCoord / uResolution).rgb;
                        float luminance = dot(baseColor, vec3(0.2126, 0.7152, 0.0722));

                        // Normalize luminance for pattern comparison (0-3 range to 0-1)
                        luminance = luminance / 3.0;

                        // Apply dither pattern
                        bool dithered = pattern4x4GetValue(luminance, coord, gridSize);

                        // Return pattern value (0.0 = black, 1.0 = color)
                        return dithered ? 0.0 : 1.0;
                    }

                    float spiralPattern(vec2 coord) {
                        vec2 p = coord * uParam1;
                        float angle = atan(p.y, p.x);
                        float radius = length(p);
                        return fract(radius - angle * uParam2);
                    }

                    float wavePattern(vec2 coord) {
                        return (sin(coord.x * uParam1) * cos(coord.y * uParam1) * uParam2 + 1.0) * 0.5;
                    }

                    float voronoiPattern(vec2 coord) {
                        vec2 cell = floor(coord / uParam1);
                        float minDist = 10.0;

                        for (int y = -1; y <= 1; y++) {
                            for (int x = -1; x <= 1; x++) {
                                vec2 neighbor = cell + vec2(float(x), float(y));
                                float h = hash(neighbor);
                                vec2 point = neighbor + vec2(h * uParam2 - 0.5);
                                float dist = distance(coord / uParam1, point);
                                minDist = min(minDist, dist);
                            }
                        }
                        return minDist;
                    }

                    float stipple(vec2 coord) {
                        vec2 grid = floor(coord / uParam2);
                        float r = hash(grid);
                        if (r > uParam1) return 1.0;
                        vec2 center = grid * uParam2 + uParam2 * 0.5;
                        return smoothstep(0.0, uParam2 * 0.5, distance(coord, center));
                    }

                    // New algorithm implementations
                    float bitTone(vec2 coord) {
                        float pattern = bayer4(coord);
                        float bits = floor(uParam1);
                        float levels = pow(2.0, bits);
                        return floor(pattern * levels) / levels * uParam2 + (1.0 - uParam2) * pattern;
                    }

                    float checkers(vec2 coord, float size) {
                        vec2 p = floor(coord / size);
                        return mod(p.x + p.y, 2.0);
                    }

                    float radialBurst(vec2 coord) {
                        vec2 center = uResolution * 0.5;
                        vec2 delta = coord - center;
                        float angle = atan(delta.y, delta.x) + uParam2;
                        float rays = uParam1;
                        return fract(angle * rays / 6.28318);
                    }

                    float vortexPattern(vec2 coord) {
                        vec2 center = uResolution * 0.5;
                        vec2 delta = coord - center;
                        float radius = length(delta);
                        float angle = atan(delta.y, delta.x);
                        float twisted = angle + radius * uParam1 * 0.01 + uTime * uParam2 * 0.1;
                        return fract(twisted / 6.28318);
                    }

                    float noisePattern(vec2 coord) {
                        return hash(coord * uParam2) * uParam1;
                    }

                    float gridlockPattern(vec2 coord) {
                        vec2 grid = floor(coord / uParam1);
                        float h = hash(grid);
                        if (h < uParam2) {
                            return mod(coord.x + coord.y, uParam1 * 0.5) / (uParam1 * 0.5);
                        }
                        return 0.5;
                    }

                    float mosaicPattern(vec2 coord) {
                        vec2 tile = floor(coord / uParam1) * uParam1 + uParam1 * 0.5;
                        float h = hash(tile);
                        vec2 offset = vec2(h - 0.5) * uParam1 * uParam2;
                        return h;
                    }

                    float sierraLite(vec2 coord) {
                        return errorDiffusion(coord, uParam1 * 0.8);
                    }

                    // ============================================================
                    // PHASE 1: RETRO/VISUAL EFFECTS
                    // ============================================================

                    // Scanline Dithering - Emulates CRT monitor scanlines
                    float scanlineDither(vec2 coord) {
                        float scanlineThickness = uParam1;
                        float scanlineIntensity = uParam2;
                        
                        // Create scanline pattern
                        float scanline = mod(coord.y, scanlineThickness);
                        float scanlineMask = smoothstep(0.0, scanlineThickness * 0.3, scanline) * 
                                            smoothstep(scanlineThickness, scanlineThickness * 0.7, scanline);
                        
                        // Combine with base dither pattern
                        float baseDither = bayer4(coord);
                        return mix(baseDither, baseDither * (1.0 - scanlineIntensity), scanlineMask);
                    }

                    // Chromatic Aberration Dithering - RGB channel offset for glitch aesthetic
                    // Note: This modifies the color sampling, not just the threshold
                    // Will be applied in main() before dithering
                    vec3 chromaticAberration(vec2 uv, float offsetStrength, float angle) {
                        vec2 offset = vec2(cos(angle), sin(angle)) * offsetStrength / uResolution;
                        
                        float r = texture2D(tDiffuse, uv + offset).r;
                        float g = texture2D(tDiffuse, uv).g;
                        float b = texture2D(tDiffuse, uv - offset).b;
                        
                        return vec3(r, g, b);
                    }

                    // Posterization + Dither Hybrid - Reduces colors then dithers boundaries
                    float posterizeDither(vec2 coord, vec3 color) {
                        float colorLevels = uParam1;
                        float ditherBoundaries = uParam2;
                        
                        // Quantize color to levels
                        float gray = toGray(color);
                        float step = 1.0 / colorLevels;
                        float quantized = floor(gray / step) * step;
                        
                        // Calculate distance to nearest boundary
                        float distToBoundary = abs(gray - quantized);
                        float boundaryMask = smoothstep(0.0, step * 0.5, distToBoundary);
                        
                        // Apply dither only near boundaries
                        float baseDither = bayer4(coord);
                        return mix(0.5, baseDither, boundaryMask * ditherBoundaries);
                    }

                    float getThreshold(vec2 coord) {
                        if (uAlgorithm == 0) return 0.5; // none
                        if (uAlgorithm == 1) return bayer2(coord); // bayer-ordered
                        if (uAlgorithm == 2) return randomNoise(coord); // random-ordered
                        if (uAlgorithm == 3) return errorDiffusion(coord, uParam1); // floyd-steinberg
                        if (uAlgorithm == 4) return errorDiffusion(coord, uParam1) + uParam2; // atkinson
                        if (uAlgorithm == 5) return errorDiffusion(coord, uParam1); // jarvis
                        if (uAlgorithm == 6) return errorDiffusion(coord, uParam1); // stucki
                        if (uAlgorithm == 7) return errorDiffusion(coord, uParam1); // burkes
                        if (uAlgorithm == 8) return errorDiffusion(coord, uParam1); // sierra
                        if (uAlgorithm == 9) return sierraLite(coord); // sierra-lite
                        if (uAlgorithm == 10) return errorDiffusion(coord, uParam1); // two-row-sierra
                        if (uAlgorithm == 11) return bitTone(coord); // bit tone
                        if (uAlgorithm == 12) return checkers(coord, uParam1); // checkers-small
                        if (uAlgorithm == 13) return checkers(coord, uParam1); // checkers-medium
                        if (uAlgorithm == 14) return checkers(coord, uParam1); // checkers-large
                        if (uAlgorithm == 15) return radialBurst(coord); // radial burst
                        if (uAlgorithm == 16) return vortexPattern(coord); // vortex
                        if (uAlgorithm == 17) return diamondHalftone(coord); // diamond
                        if (uAlgorithm == 18) return wavePattern(coord); // wave
                        if (uAlgorithm == 19) return noisePattern(coord); // noise
                        if (uAlgorithm == 20) return gridlockPattern(coord); // gridlock/traffic
                        if (uAlgorithm == 21) return mosaicPattern(coord); // mosaic
                        if (uAlgorithm == 22) return bayer4(coord); // bayer 4x4
                        if (uAlgorithm == 23) return bayer8(coord); // bayer 8x8
                        if (uAlgorithm == 24) return bayer16(coord); // bayer 16x16
                        if (uAlgorithm == 39) return pattern4x4Dither(coord); // 4x4 pattern dithering
                        if (uAlgorithm == 25) return dispersed(coord); // dispersed
                        if (uAlgorithm == 26) return clustered(coord); // cluster
                        if (uAlgorithm == 27) return halftone(coord); // classic halftone
                        if (uAlgorithm == 28) return halftone45deg(coord); // halftone 45
                        if (uAlgorithm == 29) return ellipseHalftone(coord); // ellipse halftone
                        if (uAlgorithm == 30) return dots(coord); // dot pattern
                        if (uAlgorithm == 31) return lines(coord); // line pattern
                        if (uAlgorithm == 32) return crosshatch(coord); // crosshatch
                        if (uAlgorithm == 33) return spiralPattern(coord); // spiral
                        if (uAlgorithm == 34) return blueNoise(coord); // blue noise
                        if (uAlgorithm == 35) return perlinNoise(coord); // perlin noise
                        if (uAlgorithm == 36) return voronoiPattern(coord); // voronoi
                        if (uAlgorithm == 37) return stipple(coord); // stippling
                        if (uAlgorithm == 38) return errorDiffusion(coord, uParam1); // fan
                        if (uAlgorithm == 50) return voidAndCluster(coord); // void-and-cluster
                        if (uAlgorithm == 51) return ostromoukhov(coord); // ostromoukhov variable
                        
                        // PHASE 1: Retro/Visual Effects
                        if (uAlgorithm == 52) return scanlineDither(coord); // scanline dithering
                        // Algorithm 53 (chromatic aberration) is handled in main() before dithering
                        if (uAlgorithm == 53) return bayer4(coord); // chromatic aberration uses base dither
                        // Algorithm 54 (posterization) needs color info, handled differently

                        return bayer4(coord);
                    }

                    vec3 quantize(vec3 color, int levels) {
                        float step = 1.0 / float(levels - 1);
                        return floor(color / step + 0.5) * step;
                    }

                    float toGray(vec3 color) {
                        return dot(color, vec3(0.299, 0.587, 0.114));
                    }

                    void main() {
                        vec2 uv = vUv;

                        // === PIXELATION ===
                        if (uPixelation > 1.0) {
                            vec2 pixelSize = uResolution / uPixelation;
                            vec2 pixelPos = floor(vUv * pixelSize) / pixelSize;
                            uv = pixelPos + vec2(0.5) / pixelSize;
                        }

                        // Sample the texture
                        vec3 color = texture2D(tDiffuse, uv).rgb;

                        // Apply gamma correction if enabled (convert to linear space for processing)
                        if (uGammaCorrect) {
                            color = srgbToLinear(color);
                        }

                        // Apply contrast and brightness
                        color = (color - 0.5) * uContrast + 0.5 + uBrightness;
                        color = clamp(color, 0.0, 1.0);

                        // Apply tone curve (midtones and highlights) - only if values are adjusted
                        if (abs(uMidtones) > 0.01 || abs(uHighlights) > 0.01 || uLumThreshold < 0.9) {
                            float lum = toGray(color);

                            // Midtones adjustment (affects mid-range values)
                            if (abs(uMidtones) > 0.01) {
                                float midMask = 4.0 * lum * (1.0 - lum); // peaks at 0.5
                                color = mix(color, color * (1.0 + uMidtones), midMask);
                            }

                            // Highlights adjustment (affects bright values)
                            if (abs(uHighlights) > 0.01) {
                                float highlightMask = smoothstep(0.5, 1.0, lum);
                                color = mix(color, color * (1.0 + uHighlights), highlightMask);
                            }

                            // Luminance threshold (only apply if below 0.9)
                            if (uLumThreshold < 0.9) {
                                float cutoff = smoothstep(uLumThreshold - 0.1, uLumThreshold, lum);
                                color = color * cutoff;
                            }

                            color = clamp(color, 0.0, 1.0);
                        }

                        // Grayscale
                        if (uGrayscale) {
                            float gray = toGray(color);
                            color = vec3(gray);
                        }

                        // ============================================================
                        // ENHANCED DITHERING WITH QUALITY IMPROVEMENTS
                        // ============================================================

                        // Get dither pattern value
                        vec2 coord = vUv * uResolution;
                        float ditherPattern = getThreshold(coord);

                        // Multi-algorithm layering - blend second algorithm if enabled
                        if (uAlgo2Enabled && uAlgorithm2 > 0) {
                            // Temporarily swap algorithm to get second pattern
                            int originalAlgo = uAlgorithm;

                            // Get second algorithm pattern by calling getThreshold with swapped value
                            // Note: We need to inline this since GLSL doesn't support dynamic function calls
                            float pattern2 = 0.0;

                            // Simplified second algorithm sampling (common algorithms)
                            if (uAlgorithm2 == 22) pattern2 = bayer4(coord);
                            else if (uAlgorithm2 == 23) pattern2 = bayer8(coord);
                            else if (uAlgorithm2 == 1) pattern2 = bayer2(coord);
                            else if (uAlgorithm2 == 34) pattern2 = blueNoiseImproved(coord);
                            else if (uAlgorithm2 == 27) pattern2 = halftone(coord);
                            else if (uAlgorithm2 == 28) pattern2 = halftone45deg(coord);
                            else if (uAlgorithm2 == 30) pattern2 = dots(coord);
                            else if (uAlgorithm2 == 3) pattern2 = errorDiffusion(coord, uParam1);
                            else if (uAlgorithm2 == 4) pattern2 = errorDiffusion(coord, uParam1) + uParam2;
                            else pattern2 = ditherPattern;

                            // Blend the two patterns
                            ditherPattern = blendPatterns(ditherPattern, pattern2, uAlgo2BlendMode, uAlgo2BlendAmount);
                        }

                        // Apply subpixel antialiasing to pattern
                        ditherPattern = sampleDitherPattern(coord, ditherPattern);

                        // Get adaptive dithering strength based on local detail
                        float adaptiveStrength = getAdaptiveDitherStrength(vUv);

                        // Normalize pattern from 0-1 to -0.5 to 0.5
                        ditherPattern = (ditherPattern - 0.5) * 2.0 * adaptiveStrength;

                        // Apply dithering with perceptual color quantization
                        vec3 dithered;
                        float stepSize = 1.0 / float(uColors - 1);

                        if (uGrayscale) {
                            float gray = toGray(color);
                            // Add dither noise scaled to step size
                            gray = gray + ditherPattern * stepSize * 0.5;
                            // Quantize to color levels
                            gray = floor(gray / stepSize + 0.5) * stepSize;
                            dithered = vec3(clamp(gray, 0.0, 1.0));
                        } else {
                            // Use LAB color space for perceptually accurate quantization
                            vec3 labColor = rgb2lab(color);

                            // Add dither noise in LAB space (perceptually uniform)
                            vec3 labNoisy = labColor + vec3(ditherPattern * stepSize * 0.5);

                            // Quantize in LAB space
                            labNoisy.x = floor(labNoisy.x / stepSize + 0.5) * stepSize;
                            labNoisy.y = floor(labNoisy.y / stepSize + 0.5) * stepSize;
                            labNoisy.z = floor(labNoisy.z / stepSize + 0.5) * stepSize;

                            // Convert back to RGB
                            dithered = lab2rgb(labNoisy);
                            dithered = clamp(dithered, 0.0, 1.0);
                        }

                        // Temporal coherence for video - blend with previous frame
                        // Note: In GLSL we can't check if sampler is null, so we use the weight as a flag
                        if (uTemporalWeight > 0.01) {
                            vec3 previousColor = texture2D(tPrevious, vUv).rgb;
                            // Only blend if previous color exists (not black on first frame)
                            float prevLum = dot(previousColor, vec3(0.299, 0.587, 0.114));
                            if (prevLum > 0.01) {
                                dithered = mix(dithered, previousColor, uTemporalWeight);
                            }
                        }

                        // Invert
                        if (uInvert) {
                            dithered = 1.0 - dithered;
                        }


                        // Apply color modes
                        if (uColorMode == 1) {
                            // Grayscale with Tint
                            float lum = dot(dithered, vec3(0.299, 0.587, 0.114));
                            dithered = vec3(lum) * uDuotoneLight;
                        } else if (uColorMode == 2) {
                            // Duotone
                            float lum = dot(dithered, vec3(0.299, 0.587, 0.114));
                            dithered = mix(uDuotoneDark, uDuotoneLight, lum);
                        } else if (uColorMode == 3) {
                            // Tritone
                            float lum = dot(dithered, vec3(0.299, 0.587, 0.114));
                            if (lum < 0.33) {
                                dithered = mix(uTritoneShadow, uTritoneMid, lum * 3.0);
                            } else if (lum < 0.67) {
                                dithered = mix(uTritoneMid, uTritoneHighlight, (lum - 0.33) * 3.0);
                            } else {
                                dithered = uTritoneHighlight;
                            }
                        } else if (uColorMode == 4 && uPaletteSize > 0) {
                            // Palette mapping - find closest color using perceptual LAB distance
                            float minDist = 999.0;
                            vec3 closestColor = dithered;
                            for (int i = 0; i < 16; i++) {
                                if (i >= uPaletteSize) break;
                                // Use perceptual color distance instead of Euclidean RGB
                                float dist = colorDistance(dithered, uPaletteColors[i]);
                                if (dist < minDist) {
                                    minDist = dist;
                                    closestColor = uPaletteColors[i];
                                }
                            }
                            dithered = closestColor;
                        } else if (uColorMode == 5 && uPaletteSize > 0) {
                            // Hue-based palette mapping - GPU optimized approach from Alex Charlton
                            vec3 color1, color2;
                            float closeness;

                            // Find two closest colors by hue
                            findClosestHueColors(dithered, color1, color2, closeness);

                            // Dither between the two colors based on closeness
                            // Use the existing dither pattern for consistency
                            if (ditherPattern < (closeness * 2.0 - 0.5)) {
                                dithered = color1;
                            } else {
                                dithered = color2;
                            }
                        }

                        // Apply dither strength (blend between original and dithered)
                        if (uDitherStrength < 1.0) {
                            vec3 original = texture2D(tDiffuse, vUv).rgb;
                            // Convert original to linear if gamma correction is enabled
                            if (uGammaCorrect) {
                                original = srgbToLinear(original);
                            }
                            dithered = mix(original, dithered, uDitherStrength);
                        }

                        // Convert back from linear space if gamma corrected
                        if (uGammaCorrect) {
                            dithered = linearToSrgb(dithered);
                        }

                        // Apply CRT effect if enabled
                        if (uCRTEffect > 0.0) {
                            dithered = applyCRTEffect(dithered, vUv, uCRTEffect);
                        }

                        gl_FragColor = vec4(dithered, 1.0);
                    }
`;
