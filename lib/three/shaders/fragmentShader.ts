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

                    // CRT Display Effects
                    uniform float uScanlines;
                    uniform bool uPhosphor;
                    uniform float uCurvature;
                    uniform float uVignette;
                    uniform float uChromatic;
                    uniform float uBloom;

                    // Video/Animation
                    uniform bool uFrameBlending;
                    uniform float uFrameBlendStrength;
                    uniform bool uMotionAdaptive;
                    uniform float uMotionSensitivity;
                    uniform float uTemporalStability;

                    varying vec2 vUv;

                    float hash(vec2 p) {
                        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                    }

                    // Helper functions - must be declared early
                    float toGray(vec3 color) {
                        return dot(color, vec3(0.299, 0.587, 0.114));
                    }

                    vec3 quantize(vec3 color, int levels) {
                        float step = 1.0 / float(levels - 1);
                        return floor(color / step + 0.5) * step;
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

                    // Screen curvature distortion
                    vec2 applyCurvature(vec2 uv, float amount) {
                        if (amount <= 0.0) return uv;
                        vec2 centered = uv - 0.5;
                        float dist = dot(centered, centered);
                        centered *= 1.0 + dist * amount;
                        return centered + 0.5;
                    }

                    // Comprehensive CRT simulation
                    vec3 applyCRTEffect(vec3 color, vec2 uv, float strength) {
                        vec3 result = color;
                        vec2 curvedUV = uv;

                        // Apply screen curvature
                        if (uCurvature > 0.0) {
                            curvedUV = applyCurvature(uv, uCurvature);
                            // Clip to screen bounds
                            if (curvedUV.x < 0.0 || curvedUV.x > 1.0 || curvedUV.y < 0.0 || curvedUV.y > 1.0) {
                                return vec3(0.0);
                            }
                        }

                        // Chromatic aberration
                        if (uChromatic > 0.0) {
                            vec2 center = curvedUV - 0.5;
                            float dist = length(center);
                            vec2 offset = center * dist * uChromatic;
                            result.r = texture2D(tDiffuse, curvedUV + offset).r;
                            result.b = texture2D(tDiffuse, curvedUV - offset).b;
                        }

                        // Scanlines
                        if (uScanlines > 0.0) {
                            float scanline = sin(curvedUV.y * uResolution.y * 3.14159) * 0.5 + 0.5;
                            scanline = mix(1.0, scanline, uScanlines * 0.5);
                            result *= scanline;
                        }

                        // RGB Phosphor (sub-pixel rendering)
                        if (uPhosphor) {
                            float pixelX = mod(curvedUV.x * uResolution.x, 3.0);
                            vec3 phosphorMask;
                            if (pixelX < 1.0) {
                                phosphorMask = vec3(1.0, 0.3, 0.3);
                            } else if (pixelX < 2.0) {
                                phosphorMask = vec3(0.3, 1.0, 0.3);
                            } else {
                                phosphorMask = vec3(0.3, 0.3, 1.0);
                            }
                            result *= phosphorMask * 1.5;
                        }

                        // Vignette
                        if (uVignette > 0.0) {
                            vec2 center = curvedUV - 0.5;
                            float vignetteAmount = 1.0 - dot(center, center) * uVignette * 2.0;
                            vignetteAmount = clamp(vignetteAmount, 0.0, 1.0);
                            result *= vignetteAmount;
                        }

                        // Bloom/Glow
                        if (uBloom > 0.0) {
                            vec3 bloomColor = vec3(0.0);
                            float bloomSamples = 0.0;
                            for (float x = -2.0; x <= 2.0; x += 1.0) {
                                for (float y = -2.0; y <= 2.0; y += 1.0) {
                                    vec2 offset = vec2(x, y) / uResolution * 3.0;
                                    bloomColor += texture2D(tDiffuse, curvedUV + offset).rgb;
                                    bloomSamples += 1.0;
                                }
                            }
                            bloomColor /= bloomSamples;
                            // Only add bloom to bright areas
                            float brightness = dot(bloomColor, vec3(0.299, 0.587, 0.114));
                            result += bloomColor * uBloom * brightness;
                        }

                        // Legacy CRT effect (combines with new effects)
                        if (strength > 0.0) {
                            float legacyScanline = sin(curvedUV.y * uResolution.y * 3.14159) * 0.5 + 0.5;
                            legacyScanline = mix(1.0, legacyScanline, strength * 0.3);
                            vec2 center = curvedUV - 0.5;
                            float legacyVignette = 1.0 - dot(center, center) * strength;
                            result *= legacyScanline * legacyVignette;
                        }

                        return result;
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
                        // If edge preservation is disabled, return 1.0
                        if (uEdgePreservation <= 0.0) {
                            return 1.0;
                        }

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
                        // Scale the effect by uEdgePreservation (0-1)
                        float edgeEffect = mix(0.5, 1.5, smoothstep(0.0, 0.3, variance));
                        return mix(1.0, edgeEffect, uEdgePreservation);
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

                    // ============================================================
                    // ERROR DIFFUSION ALGORITHMS
                    // Each uses different noise characteristics to approximate
                    // the visual appearance of true error diffusion
                    // ============================================================

                    // Helper: Serpentine-aware coordinate adjustment
                    vec2 serpentineCoord(vec2 coord) {
                        vec2 adjustedCoord = coord;
                        if (uSerpentine) {
                            float row = floor(coord.y);
                            if (mod(row, 2.0) > 0.5) {
                                adjustedCoord.x = uResolution.x - coord.x;
                            }
                        }
                        return adjustedCoord;
                    }

                    // ============================================================
                    // ERROR DIFFUSION ALGORITHMS
                    // ============================================================
                    // These use texture sampling with exact diffusion weights to simulate
                    // the neighborhood-aware error diffusion effect. Each algorithm samples
                    // the actual image at specific neighbor positions weighted by the
                    // documented diffusion coefficients.

                    // Helper: Sample luminance from texture at pixel offset
                    float sampleLum(vec2 uv, vec2 offset) {
                        vec2 texel = 1.0 / uResolution;
                        vec3 col = texture2D(tDiffuse, uv + offset * texel).rgb;
                        return dot(col, vec3(0.299, 0.587, 0.114));
                    }

                    // Floyd-Steinberg (1976): divisor 16
                    // Matrix:     X  7
                    //          3  5  1
                    // Exact coefficients: 7/16, 3/16, 5/16, 1/16
                    float floydSteinberg(vec2 coord, float diffusion) {
                        vec2 uv = coord / uResolution;
                        vec2 texel = 1.0 / uResolution;

                        // Sample neighbors with Floyd-Steinberg weights
                        float center = sampleLum(uv, vec2(0.0, 0.0));
                        float right = sampleLum(uv, vec2(1.0, 0.0));
                        float bottomLeft = sampleLum(uv, vec2(-1.0, 1.0));
                        float bottom = sampleLum(uv, vec2(0.0, 1.0));
                        float bottomRight = sampleLum(uv, vec2(1.0, 1.0));

                        // Weighted neighborhood - simulates error spreading from neighbors
                        float neighborInfluence = (right * 7.0 + bottomLeft * 3.0 + bottom * 5.0 + bottomRight * 1.0) / 16.0;

                        // Compute threshold based on local neighborhood variance
                        float localVar = abs(center - neighborInfluence);
                        float threshold = uThreshold + (hash(coord) - 0.5) * 0.15 * diffusion;
                        threshold += (neighborInfluence - center) * 0.3 * diffusion;

                        return threshold;
                    }

                    // Atkinson (1984): divisor 8, only 75% error diffused
                    // Matrix:     X  1  1
                    //          1  1  1
                    //             1
                    // Bill Atkinson's algorithm for Macintosh - high contrast, crisp look
                    float atkinson(vec2 coord, float diffusion) {
                        vec2 uv = coord / uResolution;

                        // Sample 6 neighbors each at 1/8 (only 6/8 = 75% error diffused)
                        float center = sampleLum(uv, vec2(0.0, 0.0));
                        float n1 = sampleLum(uv, vec2(1.0, 0.0));   // right
                        float n2 = sampleLum(uv, vec2(2.0, 0.0));   // right+1
                        float n3 = sampleLum(uv, vec2(-1.0, 1.0));  // bottom-left
                        float n4 = sampleLum(uv, vec2(0.0, 1.0));   // bottom
                        float n5 = sampleLum(uv, vec2(1.0, 1.0));   // bottom-right
                        float n6 = sampleLum(uv, vec2(0.0, 2.0));   // bottom+1

                        // Only 75% of error is diffused - this creates the high-contrast Mac look
                        float neighborAvg = (n1 + n2 + n3 + n4 + n5 + n6) / 6.0;
                        float errorFactor = (neighborAvg - center) * 0.75;

                        // Atkinson pushes toward extremes - reduce midtones
                        float threshold = uThreshold + (hash(coord) - 0.5) * 0.1 * diffusion;
                        threshold += errorFactor * 0.4 * diffusion;

                        // High contrast adjustment - Atkinson's signature look
                        if (center > 0.25 && center < 0.75) {
                            threshold += (center - 0.5) * 0.2;
                        }

                        return threshold;
                    }

                    // Jarvis-Judice-Ninke (1976): divisor 48, 12 neighbors over 3 rows
                    // Matrix:        X  7  5
                    //          3  5  7  5  3
                    //          1  3  5  3  1
                    // Smoother gradients due to wider error spread
                    float jarvis(vec2 coord, float diffusion) {
                        vec2 uv = coord / uResolution;

                        float center = sampleLum(uv, vec2(0.0, 0.0));

                        // Row 0: X 7 5
                        float r0_1 = sampleLum(uv, vec2(1.0, 0.0)) * 7.0;
                        float r0_2 = sampleLum(uv, vec2(2.0, 0.0)) * 5.0;

                        // Row 1: 3 5 7 5 3
                        float r1_m2 = sampleLum(uv, vec2(-2.0, 1.0)) * 3.0;
                        float r1_m1 = sampleLum(uv, vec2(-1.0, 1.0)) * 5.0;
                        float r1_0 = sampleLum(uv, vec2(0.0, 1.0)) * 7.0;
                        float r1_1 = sampleLum(uv, vec2(1.0, 1.0)) * 5.0;
                        float r1_2 = sampleLum(uv, vec2(2.0, 1.0)) * 3.0;

                        // Row 2: 1 3 5 3 1
                        float r2_m2 = sampleLum(uv, vec2(-2.0, 2.0)) * 1.0;
                        float r2_m1 = sampleLum(uv, vec2(-1.0, 2.0)) * 3.0;
                        float r2_0 = sampleLum(uv, vec2(0.0, 2.0)) * 5.0;
                        float r2_1 = sampleLum(uv, vec2(1.0, 2.0)) * 3.0;
                        float r2_2 = sampleLum(uv, vec2(2.0, 2.0)) * 1.0;

                        float neighborSum = (r0_1 + r0_2 + r1_m2 + r1_m1 + r1_0 + r1_1 + r1_2 + r2_m2 + r2_m1 + r2_0 + r2_1 + r2_2) / 48.0;

                        float threshold = uThreshold + (hash(coord) - 0.5) * 0.08 * diffusion;
                        threshold += (neighborSum - center) * 0.35 * diffusion;

                        return threshold;
                    }

                    // Stucki (1981): divisor 42, sharper than Jarvis
                    // Matrix:        X  8  4
                    //          2  4  8  4  2
                    //          1  2  4  2  1
                    float stucki(vec2 coord, float diffusion) {
                        vec2 uv = coord / uResolution;

                        float center = sampleLum(uv, vec2(0.0, 0.0));

                        // Row 0: X 8 4
                        float r0_1 = sampleLum(uv, vec2(1.0, 0.0)) * 8.0;
                        float r0_2 = sampleLum(uv, vec2(2.0, 0.0)) * 4.0;

                        // Row 1: 2 4 8 4 2
                        float r1_m2 = sampleLum(uv, vec2(-2.0, 1.0)) * 2.0;
                        float r1_m1 = sampleLum(uv, vec2(-1.0, 1.0)) * 4.0;
                        float r1_0 = sampleLum(uv, vec2(0.0, 1.0)) * 8.0;
                        float r1_1 = sampleLum(uv, vec2(1.0, 1.0)) * 4.0;
                        float r1_2 = sampleLum(uv, vec2(2.0, 1.0)) * 2.0;

                        // Row 2: 1 2 4 2 1
                        float r2_m2 = sampleLum(uv, vec2(-2.0, 2.0)) * 1.0;
                        float r2_m1 = sampleLum(uv, vec2(-1.0, 2.0)) * 2.0;
                        float r2_0 = sampleLum(uv, vec2(0.0, 2.0)) * 4.0;
                        float r2_1 = sampleLum(uv, vec2(1.0, 2.0)) * 2.0;
                        float r2_2 = sampleLum(uv, vec2(2.0, 2.0)) * 1.0;

                        float neighborSum = (r0_1 + r0_2 + r1_m2 + r1_m1 + r1_0 + r1_1 + r1_2 + r2_m2 + r2_m1 + r2_0 + r2_1 + r2_2) / 42.0;

                        float threshold = uThreshold + (hash(coord) - 0.5) * 0.09 * diffusion;
                        threshold += (neighborSum - center) * 0.38 * diffusion;

                        return threshold;
                    }

                    // Burkes (1988): divisor 32, simplified 2-row kernel
                    // Matrix:        X  8  4
                    //          2  4  8  4  2
                    // Faster than Stucki with similar quality
                    float burkes(vec2 coord, float diffusion) {
                        vec2 uv = coord / uResolution;

                        float center = sampleLum(uv, vec2(0.0, 0.0));

                        // Row 0: X 8 4
                        float r0_1 = sampleLum(uv, vec2(1.0, 0.0)) * 8.0;
                        float r0_2 = sampleLum(uv, vec2(2.0, 0.0)) * 4.0;

                        // Row 1: 2 4 8 4 2
                        float r1_m2 = sampleLum(uv, vec2(-2.0, 1.0)) * 2.0;
                        float r1_m1 = sampleLum(uv, vec2(-1.0, 1.0)) * 4.0;
                        float r1_0 = sampleLum(uv, vec2(0.0, 1.0)) * 8.0;
                        float r1_1 = sampleLum(uv, vec2(1.0, 1.0)) * 4.0;
                        float r1_2 = sampleLum(uv, vec2(2.0, 1.0)) * 2.0;

                        float neighborSum = (r0_1 + r0_2 + r1_m2 + r1_m1 + r1_0 + r1_1 + r1_2) / 32.0;

                        float threshold = uThreshold + (hash(coord) - 0.5) * 0.1 * diffusion;
                        threshold += (neighborSum - center) * 0.4 * diffusion;

                        return threshold;
                    }

                    // Sierra Full (1989): divisor 32, 3-row kernel
                    // Matrix:        X  5  3
                    //          2  4  5  4  2
                    //             2  3  2
                    float sierra(vec2 coord, float diffusion) {
                        vec2 uv = coord / uResolution;

                        float center = sampleLum(uv, vec2(0.0, 0.0));

                        // Row 0: X 5 3
                        float r0_1 = sampleLum(uv, vec2(1.0, 0.0)) * 5.0;
                        float r0_2 = sampleLum(uv, vec2(2.0, 0.0)) * 3.0;

                        // Row 1: 2 4 5 4 2
                        float r1_m2 = sampleLum(uv, vec2(-2.0, 1.0)) * 2.0;
                        float r1_m1 = sampleLum(uv, vec2(-1.0, 1.0)) * 4.0;
                        float r1_0 = sampleLum(uv, vec2(0.0, 1.0)) * 5.0;
                        float r1_1 = sampleLum(uv, vec2(1.0, 1.0)) * 4.0;
                        float r1_2 = sampleLum(uv, vec2(2.0, 1.0)) * 2.0;

                        // Row 2: 2 3 2 (centered)
                        float r2_m1 = sampleLum(uv, vec2(-1.0, 2.0)) * 2.0;
                        float r2_0 = sampleLum(uv, vec2(0.0, 2.0)) * 3.0;
                        float r2_1 = sampleLum(uv, vec2(1.0, 2.0)) * 2.0;

                        float neighborSum = (r0_1 + r0_2 + r1_m2 + r1_m1 + r1_0 + r1_1 + r1_2 + r2_m1 + r2_0 + r2_1) / 32.0;

                        float threshold = uThreshold + (hash(coord) - 0.5) * 0.1 * diffusion;
                        threshold += (neighborSum - center) * 0.35 * diffusion;

                        return threshold;
                    }

                    // Two-Row Sierra (1990): divisor 16
                    // Matrix:        X  4  3
                    //          1  2  3  2  1
                    float sierra2Row(vec2 coord, float diffusion) {
                        vec2 uv = coord / uResolution;

                        float center = sampleLum(uv, vec2(0.0, 0.0));

                        // Row 0: X 4 3
                        float r0_1 = sampleLum(uv, vec2(1.0, 0.0)) * 4.0;
                        float r0_2 = sampleLum(uv, vec2(2.0, 0.0)) * 3.0;

                        // Row 1: 1 2 3 2 1
                        float r1_m2 = sampleLum(uv, vec2(-2.0, 1.0)) * 1.0;
                        float r1_m1 = sampleLum(uv, vec2(-1.0, 1.0)) * 2.0;
                        float r1_0 = sampleLum(uv, vec2(0.0, 1.0)) * 3.0;
                        float r1_1 = sampleLum(uv, vec2(1.0, 1.0)) * 2.0;
                        float r1_2 = sampleLum(uv, vec2(2.0, 1.0)) * 1.0;

                        float neighborSum = (r0_1 + r0_2 + r1_m2 + r1_m1 + r1_0 + r1_1 + r1_2) / 16.0;

                        float threshold = uThreshold + (hash(coord) - 0.5) * 0.11 * diffusion;
                        threshold += (neighborSum - center) * 0.4 * diffusion;

                        return threshold;
                    }

                    // Sierra Lite (1990): divisor 4
                    // Matrix:   X  2
                    //          1  1
                    // Fastest Sierra variant, similar quality to Floyd-Steinberg
                    float sierraLiteDither(vec2 coord, float diffusion) {
                        vec2 uv = coord / uResolution;

                        float center = sampleLum(uv, vec2(0.0, 0.0));

                        // Simple 3-neighbor kernel
                        float right = sampleLum(uv, vec2(1.0, 0.0)) * 2.0;
                        float bottomLeft = sampleLum(uv, vec2(-1.0, 1.0)) * 1.0;
                        float bottom = sampleLum(uv, vec2(0.0, 1.0)) * 1.0;

                        float neighborSum = (right + bottomLeft + bottom) / 4.0;

                        float threshold = uThreshold + (hash(coord) - 0.5) * 0.12 * diffusion;
                        threshold += (neighborSum - center) * 0.45 * diffusion;

                        return threshold;
                    }

                    // False Floyd-Steinberg: Simplified 3-neighbor
                    // Matrix:   X  3
                    //          3  2
                    // Divisor: 8
                    float falseFloydSteinberg(vec2 coord, float diffusion) {
                        vec2 uv = coord / uResolution;

                        float center = sampleLum(uv, vec2(0.0, 0.0));

                        float right = sampleLum(uv, vec2(1.0, 0.0)) * 3.0;
                        float bottom = sampleLum(uv, vec2(0.0, 1.0)) * 3.0;
                        float bottomRight = sampleLum(uv, vec2(1.0, 1.0)) * 2.0;

                        float neighborSum = (right + bottom + bottomRight) / 8.0;

                        float threshold = uThreshold + (hash(coord) - 0.5) * 0.13 * diffusion;
                        threshold += (neighborSum - center) * 0.42 * diffusion;

                        return threshold;
                    }

                    // Horizontal Stripe Dithering
                    // Error diffuses only to bottom rows - creates horizontal bands
                    float horizontalStripe(vec2 coord, float diffusion) {
                        vec2 uv = coord / uResolution;

                        float center = sampleLum(uv, vec2(0.0, 0.0));

                        // Only sample below - creates horizontal banding
                        float b1 = sampleLum(uv, vec2(0.0, 1.0));
                        float b2 = sampleLum(uv, vec2(0.0, 2.0));
                        float b3 = sampleLum(uv, vec2(0.0, 3.0));

                        float neighborSum = (b1 * 4.0 + b2 * 2.0 + b3 * 1.0) / 7.0;

                        float threshold = uThreshold + (hash(coord) - 0.5) * 0.1 * diffusion;
                        threshold += (neighborSum - center) * 0.5 * diffusion;

                        // Add slight row-based variation for band effect
                        threshold += sin(coord.y * 0.5) * 0.05;

                        return threshold;
                    }

                    // Vertical Stripe Dithering
                    // Error diffuses only to right columns - creates vertical bands
                    float verticalStripe(vec2 coord, float diffusion) {
                        vec2 uv = coord / uResolution;

                        float center = sampleLum(uv, vec2(0.0, 0.0));

                        // Only sample to the right - creates vertical banding
                        float r1 = sampleLum(uv, vec2(1.0, 0.0));
                        float r2 = sampleLum(uv, vec2(2.0, 0.0));
                        float r3 = sampleLum(uv, vec2(3.0, 0.0));

                        float neighborSum = (r1 * 4.0 + r2 * 2.0 + r3 * 1.0) / 7.0;

                        float threshold = uThreshold + (hash(coord) - 0.5) * 0.1 * diffusion;
                        threshold += (neighborSum - center) * 0.5 * diffusion;

                        // Add slight column-based variation for band effect
                        threshold += sin(coord.x * 0.5) * 0.05;

                        return threshold;
                    }

                    // Legacy generic error diffusion for backward compatibility
                    float errorDiffusion(vec2 coord, float diffusion) {
                        return floydSteinberg(coord, diffusion);
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
                        return sierraLiteDither(coord, uParam1 * 0.8);
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

                    // ============================================================
                    // PHASE 2: QUALITY ENHANCEMENT ALGORITHMS
                    // ============================================================

                    // Adaptive Threshold Dithering - Threshold varies based on local image content
                    float adaptiveThresholdDither(vec2 coord) {
                        vec2 uv = coord / uResolution;
                        float windowSize = uParam1; // Adaptive window size (e.g., 5.0 - 15.0)
                        float sensitivity = uParam2; // How much to adapt (0.0 - 1.0)

                        // Calculate local mean intensity
                        float localMean = 0.0;
                        float samples = 0.0;
                        int halfWindow = int(windowSize * 0.5);

                        for (int y = -halfWindow; y <= halfWindow; y++) {
                            for (int x = -halfWindow; x <= halfWindow; x++) {
                                vec2 offset = vec2(float(x), float(y)) / uResolution;
                                vec3 texSample = texture2D(tDiffuse, uv + offset).rgb;
                                localMean += toGray(texSample);
                                samples += 1.0;
                            }
                        }
                        localMean /= samples;

                        // Calculate adaptive threshold
                        // In bright areas, raise threshold; in dark areas, lower it
                        float basePattern = bayer8(coord);
                        float adaptiveOffset = (localMean - 0.5) * sensitivity;

                        return clamp(basePattern + adaptiveOffset, 0.0, 1.0);
                    }

                    // Anisotropic Dithering - Directional dithering following image gradients
                    float anisotropicDither(vec2 coord) {
                        vec2 uv = coord / uResolution;
                        float directionality = uParam1; // How much to follow gradients (0.0 - 1.0)
                        float scale = uParam2; // Pattern scale

                        // Calculate image gradient
                        vec2 texel = 1.0 / uResolution;
                        vec3 colorCenter = texture2D(tDiffuse, uv).rgb;
                        vec3 colorRight = texture2D(tDiffuse, uv + vec2(texel.x, 0.0)).rgb;
                        vec3 colorDown = texture2D(tDiffuse, uv + vec2(0.0, texel.y)).rgb;

                        float grayCenter = toGray(colorCenter);
                        float grayRight = toGray(colorRight);
                        float grayDown = toGray(colorDown);

                        // Gradient vector
                        vec2 gradient = vec2(grayRight - grayCenter, grayDown - grayCenter);
                        float gradientMag = length(gradient);

                        // Rotate dither pattern based on gradient direction
                        float angle = atan(gradient.y, gradient.x);
                        vec2 rotatedCoord;

                        if (gradientMag > 0.01) {
                            // Apply rotation based on gradient
                            float cosA = cos(angle * directionality);
                            float sinA = sin(angle * directionality);
                            rotatedCoord = vec2(
                                coord.x * cosA - coord.y * sinA,
                                coord.x * sinA + coord.y * cosA
                            );
                        } else {
                            // No gradient, use regular coordinates
                            rotatedCoord = coord;
                        }

                        // Apply line pattern along gradient direction
                        float pattern = fract(rotatedCoord.y / scale);

                        // Blend with base dither for variety
                        float baseDither = bayer4(coord);
                        return mix(baseDither, pattern, directionality * gradientMag * 10.0);
                    }

                    // Sobel Edge-Weighted Dithering - Less dithering on edges, more in flat areas
                    float sobelEdgeWeightedDither(vec2 coord) {
                        vec2 uv = coord / uResolution;
                        float edgePreservation = uParam1; // How much to preserve edges (0.0 - 1.0)
                        float flatBoost = uParam2; // Boost dithering in flat areas (1.0 - 3.0)

                        // Detect edges using Sobel operator
                        float edgeStrength = detectEdge(uv, tDiffuse);

                        // Generate base dither pattern
                        float baseDither = bayer8(coord);

                        // Weight dithering inversely to edge strength
                        // Strong edges → less dithering (preserve detail)
                        // Flat areas → more dithering (reduce banding)
                        float edgeMask = 1.0 - smoothstep(0.0, 0.3, edgeStrength);
                        float ditherStrength = mix(1.0, edgeMask * flatBoost, edgePreservation);

                        // Apply weighted dithering
                        return mix(0.5, baseDither, ditherStrength);
                    }

                    // ============================================================
                    // PHASE 3: ADVANCED ERROR DIFFUSION
                    // ============================================================

                    // Riemersma Dithering - Space-filling curve (Hilbert) error diffusion
                    // Produces temporally stable dithering, great for animation
                    float riemersmaDither(vec2 coord) {
                        // Simplified Hilbert curve approximation
                        // True implementation would require recursive curve generation
                        float scale = uParam1; // Curve scale (2.0 - 16.0)
                        float errorWeight = uParam2; // Error diffusion weight (0.1 - 1.0)

                        // Approximate Hilbert curve using recursive pattern
                        vec2 p = coord / scale;
                        vec2 hilbertCoord = p;

                        // Apply multiple iterations of Hilbert transform
                        for (int i = 0; i < 4; i++) {
                            vec2 quadrant = mod(hilbertCoord, 2.0);

                            // Hilbert curve rotation based on quadrant
                            if (quadrant.x < 1.0 && quadrant.y < 1.0) {
                                // Bottom-left: rotate 90° CCW
                                hilbertCoord = vec2(hilbertCoord.y, hilbertCoord.x);
                            } else if (quadrant.x >= 1.0 && quadrant.y >= 1.0) {
                                // Top-right: rotate 90° CW
                                hilbertCoord = vec2(2.0 - hilbertCoord.y, 2.0 - hilbertCoord.x);
                            }

                            hilbertCoord *= 0.5;
                        }

                        // Generate threshold based on position along curve
                        float curvePosition = hilbertCoord.x + hilbertCoord.y;

                        // Add error diffusion approximation
                        float error = hash(floor(coord / scale)) * 2.0 - 1.0;
                        float threshold = fract(curvePosition) + error * errorWeight * 0.1;

                        return clamp(threshold, 0.0, 1.0);
                    }

                    // ============================================================
                    // PHASE 4: PRINT/PROFESSIONAL EFFECTS
                    // ============================================================

                    // Halftone CMYK Separation - Simulates 4-color printing process
                    float halftoneCMYK(vec2 coord) {
                        // Screen angles for CMYK (industry standard)
                        float angleC = 0.2618; // 15°
                        float angleM = 1.3090; // 75°
                        float angleY = 0.0;    // 0°
                        float angleK = 0.7854; // 45°

                        float dotSize = uParam1; // Dot size (4.0 - 20.0)
                        float separation = uParam2; // Color separation visibility (0.0 - 1.0)

                        // Sample color
                        vec3 rgb = texture2D(tDiffuse, coord / uResolution).rgb;

                        // Convert to CMYK
                        float k = 1.0 - max(max(rgb.r, rgb.g), rgb.b);
                        float c = (1.0 - rgb.r - k) / (1.0 - k + 0.001);
                        float m = (1.0 - rgb.g - k) / (1.0 - k + 0.001);
                        float y = (1.0 - rgb.b - k) / (1.0 - k + 0.001);

                        // Generate halftone patterns for each channel
                        float patternC = halftone(coord);

                        // Rotate coordinates for each channel
                        vec2 rotatedM = vec2(
                            coord.x * cos(angleM) - coord.y * sin(angleM),
                            coord.x * sin(angleM) + coord.y * cos(angleM)
                        );
                        vec2 rotatedY = vec2(
                            coord.x * cos(angleY) - coord.y * sin(angleY),
                            coord.x * sin(angleY) + coord.y * cos(angleY)
                        );
                        vec2 rotatedK = vec2(
                            coord.x * cos(angleK) - coord.y * sin(angleK),
                            coord.x * sin(angleK) + coord.y * cos(angleK)
                        );

                        // Sample each channel's halftone
                        vec2 nearestC = floor(coord / dotSize) * dotSize + dotSize * 0.5;
                        vec2 nearestM = floor(rotatedM / dotSize) * dotSize + dotSize * 0.5;
                        vec2 nearestY = floor(rotatedY / dotSize) * dotSize + dotSize * 0.5;
                        vec2 nearestK = floor(rotatedK / dotSize) * dotSize + dotSize * 0.5;

                        float distC = distance(coord, nearestC);
                        float distM = distance(rotatedM, nearestM);
                        float distY = distance(rotatedY, nearestY);
                        float distK = distance(rotatedK, nearestK);

                        // Create dot patterns based on CMYK values
                        float dotC = smoothstep(dotSize * c * 0.5, 0.0, distC);
                        float dotM = smoothstep(dotSize * m * 0.5, 0.0, distM);
                        float dotY = smoothstep(dotSize * y * 0.5, 0.0, distY);
                        float dotK = smoothstep(dotSize * k * 0.5, 0.0, distK);

                        // Combine CMYK dots (simplified - just using grayscale for now)
                        return (dotC + dotM + dotY + dotK) * 0.25;
                    }

                    // Hexagonal Grid Dithering - Honeycomb pattern, optimal packing
                    float hexagonalDither(vec2 coord) {
                        float hexSize = uParam1; // Hexagon size (5.0 - 30.0)
                        float dotIntensity = uParam2; // Dot intensity (0.5 - 2.0)

                        // Hexagonal grid coordinates
                        float hexWidth = hexSize * sqrt(3.0);
                        float hexHeight = hexSize * 1.5;

                        // Convert to hexagonal coordinates
                        vec2 hexCoord;
                        hexCoord.y = coord.y / hexHeight;
                        float rowOffset = mod(floor(hexCoord.y), 2.0) * hexWidth * 0.5;
                        hexCoord.x = (coord.x - rowOffset) / hexWidth;

                        // Find nearest hexagon center
                        vec2 gridPos = floor(hexCoord);
                        vec2 gridFract = fract(hexCoord);

                        // Check 3 nearest hexagons
                        float minDist = 999.0;
                        vec2 nearestHex = gridPos;

                        for (float dy = 0.0; dy <= 1.0; dy += 1.0) {
                            for (float dx = 0.0; dx <= 1.0; dx += 1.0) {
                                vec2 testHex = gridPos + vec2(dx, dy);
                                vec2 hexCenter = testHex + vec2(0.5);

                                // Convert back to pixel space
                                float testRowOffset = mod(testHex.y, 2.0) * 0.5;
                                vec2 pixelCenter = vec2(
                                    (testHex.x + testRowOffset + 0.5) * hexWidth,
                                    (testHex.y + 0.5) * hexHeight
                                );

                                float dist = distance(coord, pixelCenter);
                                if (dist < minDist) {
                                    minDist = dist;
                                    nearestHex = testHex;
                                }
                            }
                        }

                        // Sample image at hexagon center
                        float testRowOffset = mod(nearestHex.y, 2.0) * 0.5;
                        vec2 hexPixelCenter = vec2(
                            (nearestHex.x + testRowOffset + 0.5) * hexWidth,
                            (nearestHex.y + 0.5) * hexHeight
                        );

                        vec3 hexColor = texture2D(tDiffuse, hexPixelCenter / uResolution).rgb;
                        float hexLum = toGray(hexColor);

                        // Create hexagonal dot based on luminance
                        float hexRadius = hexSize * hexLum * 0.5;
                        float dotPattern = 1.0 - smoothstep(0.0, hexRadius * dotIntensity, minDist);

                        return dotPattern;
                    }

                    // ============================================================
                    // PHASE 5: CREATIVE/ARTISTIC EFFECTS
                    // ============================================================

                    // Threshold Map Dithering - Custom artistic threshold patterns
                    float thresholdMapDither(vec2 coord) {
                        float patternType = floor(uParam1); // Pattern type (0-4)
                        float scale = uParam2; // Pattern scale (1.0 - 10.0)

                        vec2 p = coord / scale;
                        float threshold = 0.5;

                        if (patternType < 1.0) {
                            // Concentric circles
                            float dist = length(mod(p, 64.0) - 32.0);
                            threshold = fract(dist * 0.1);
                        } else if (patternType < 2.0) {
                            // Diagonal lines
                            threshold = fract((p.x + p.y) * 0.1);
                        } else if (patternType < 3.0) {
                            // Brick pattern
                            vec2 brick = floor(p / 8.0);
                            float rowOffset = mod(brick.y, 2.0) * 4.0;
                            threshold = fract((brick.x + rowOffset) * 0.5);
                        } else if (patternType < 4.0) {
                            // Organic noise
                            threshold = hash(floor(p));
                        } else {
                            // Radial burst from center
                            vec2 center = uResolution * 0.5;
                            vec2 delta = coord - center;
                            float angle = atan(delta.y, delta.x);
                            threshold = fract(angle * 8.0 / 6.28318);
                        }

                        return threshold;
                    }

                    // Kuwahara Filter + Dithering - Artistic painterly effect with dithering
                    float kuwaharaDither(vec2 coord) {
                        vec2 uv = coord / uResolution;
                        int kernelSize = int(uParam1); // Filter kernel size (2-5)
                        float ditherMix = uParam2; // Dither blend (0.0 - 1.0)

                        // Kuwahara filter finds the most uniform quadrant around a pixel
                        // This creates a painterly, posterized effect

                        vec3 means[4];
                        float variances[4];

                        // Calculate mean and variance for 4 quadrants
                        for (int q = 0; q < 4; q++) {
                            vec3 sum = vec3(0.0);
                            vec3 sumSq = vec3(0.0);
                            float count = 0.0;

                            int offsetX = (q % 2) * kernelSize - kernelSize;
                            int offsetY = (q / 2) * kernelSize - kernelSize;

                            for (int y = 0; y < kernelSize; y++) {
                                for (int x = 0; x < kernelSize; x++) {
                                    vec2 offset = vec2(float(x + offsetX), float(y + offsetY)) / uResolution;
                                    vec3 texSample = texture2D(tDiffuse, uv + offset).rgb;
                                    sum += texSample;
                                    sumSq += texSample * texSample;
                                    count += 1.0;
                                }
                            }

                            means[q] = sum / count;
                            vec3 variance = (sumSq / count) - (means[q] * means[q]);
                            variances[q] = variance.r + variance.g + variance.b;
                        }

                        // Find quadrant with minimum variance (most uniform)
                        int minQ = 0;
                        float minVar = variances[0];
                        for (int q = 1; q < 4; q++) {
                            if (variances[q] < minVar) {
                                minVar = variances[q];
                                minQ = q;
                            }
                        }

                        // Use the most uniform quadrant's mean
                        float lum = toGray(means[minQ]);

                        // Blend with dither pattern
                        float dither = bayer8(coord);
                        return mix(lum, dither, ditherMix);
                    }

                    // Dither Displacement Mapping - Dithering affects pixel positions
                    float ditherDisplacement(vec2 coord) {
                        float displacementStrength = uParam1; // How much to displace (0.0 - 10.0)
                        float scale = uParam2; // Pattern scale

                        // Generate displacement from dither pattern
                        vec2 ditherOffset;
                        ditherOffset.x = hash(coord * scale) * 2.0 - 1.0;
                        ditherOffset.y = hash(coord * scale + vec2(1.3, 7.1)) * 2.0 - 1.0;

                        // Sample image at displaced position
                        vec2 displacedUV = (coord + ditherOffset * displacementStrength) / uResolution;
                        displacedUV = clamp(displacedUV, 0.0, 1.0);

                        vec3 displacedColor = texture2D(tDiffuse, displacedUV).rgb;
                        float lum = toGray(displacedColor);

                        // Apply dithering to displaced sample
                        return bayer4(coord);
                    }

                    // Reaction-Diffusion Dithering - Organic pattern generation
                    float reactionDiffusionDither(vec2 coord) {
                        // Simplified reaction-diffusion approximation
                        // True implementation would require iterative simulation
                        float scale = uParam1; // Pattern scale (5.0 - 30.0)
                        float complexity = uParam2; // Pattern complexity (1.0 - 5.0)

                        vec2 p = coord / scale;

                        // Multi-octave noise to simulate reaction-diffusion patterns
                        float pattern = 0.0;
                        float amplitude = 1.0;
                        vec2 freq = p;

                        for (int i = 0; i < 4; i++) {
                            if (float(i) >= complexity) break;

                            // Simulate chemical diffusion with nested noise
                            float n1 = hash(floor(freq));
                            float n2 = hash(floor(freq + vec2(0.5)));

                            // Reaction term (activator-inhibitor)
                            float activator = n1;
                            float inhibitor = n2;
                            float reaction = activator * activator - inhibitor;

                            pattern += reaction * amplitude;

                            amplitude *= 0.5;
                            freq *= 2.3;
                        }

                        // Normalize and create organic threshold
                        return fract(pattern * 0.5 + 0.5);
                    }

                    // Dither Morphology - Erosion/dilation effects
                    float ditherMorphology(vec2 coord) {
                        vec2 uv = coord / uResolution;
                        float kernelSize = uParam1; // Morphology kernel size (1.0 - 5.0)
                        float operation = uParam2; // 0 = erode, 1 = dilate, 0.5 = open/close

                        // Generate base dither
                        float baseDither = bayer8(coord);

                        // Apply morphological operation
                        float result = baseDither;

                        if (operation < 0.33) {
                            // Erosion - minimum filter
                            result = 1.0;
                            for (float y = -kernelSize; y <= kernelSize; y += 1.0) {
                                for (float x = -kernelSize; x <= kernelSize; x += 1.0) {
                                    vec2 offset = vec2(x, y);
                                    float patternSample = bayer8(coord + offset);
                                    result = min(result, patternSample);
                                }
                            }
                        } else if (operation < 0.67) {
                            // Dilation - maximum filter
                            result = 0.0;
                            for (float y = -kernelSize; y <= kernelSize; y += 1.0) {
                                for (float x = -kernelSize; x <= kernelSize; x += 1.0) {
                                    vec2 offset = vec2(x, y);
                                    float patternSample = bayer8(coord + offset);
                                    result = max(result, patternSample);
                                }
                            }
                        } else {
                            // Opening (erosion then dilation) or closing
                            // Simplified as blend between eroded and dilated
                            float eroded = 1.0;
                            float dilated = 0.0;
                            for (float y = -kernelSize; y <= kernelSize; y += 1.0) {
                                for (float x = -kernelSize; x <= kernelSize; x += 1.0) {
                                    vec2 offset = vec2(x, y);
                                    float patternSample = bayer8(coord + offset);
                                    eroded = min(eroded, patternSample);
                                    dilated = max(dilated, patternSample);
                                }
                            }
                            result = mix(eroded, dilated, 0.5);
                        }

                        return result;
                    }

                    // Multi-Scale Dithering - Combines multiple dither scales
                    float multiScaleDither(vec2 coord) {
                        float scales = uParam1; // Number of scales (2.0 - 5.0)
                        float blendMode = uParam2; // 0 = add, 0.5 = multiply, 1 = max

                        float result = 0.0;
                        float weight = 1.0;
                        float totalWeight = 0.0;

                        for (int i = 0; i < 5; i++) {
                            if (float(i) >= scales) break;

                            float scale = pow(2.0, float(i));
                            float pattern = bayer8(coord / scale);

                            if (blendMode < 0.33) {
                                // Additive
                                result += pattern * weight;
                                totalWeight += weight;
                            } else if (blendMode < 0.67) {
                                // Multiplicative
                                if (i == 0) result = pattern;
                                else result *= pattern;
                            } else {
                                // Maximum
                                result = max(result, pattern * weight);
                            }

                            weight *= 0.5;
                        }

                        if (blendMode < 0.33) {
                            result /= totalWeight;
                        }

                        return clamp(result, 0.0, 1.0);
                    }

                    float getThreshold(vec2 coord) {
                        if (uAlgorithm == 0) return 0.5; // none
                        if (uAlgorithm == 1) return bayer2(coord); // bayer-ordered
                        if (uAlgorithm == 2) return randomNoise(coord); // random-ordered
                        if (uAlgorithm == 3) return floydSteinberg(coord, uParam1); // floyd-steinberg
                        if (uAlgorithm == 4) return atkinson(coord, uParam1); // atkinson
                        if (uAlgorithm == 5) return jarvis(coord, uParam1); // jarvis-judice-ninke
                        if (uAlgorithm == 6) return stucki(coord, uParam1); // stucki
                        if (uAlgorithm == 7) return burkes(coord, uParam1); // burkes
                        if (uAlgorithm == 8) return sierra(coord, uParam1); // sierra (full)
                        if (uAlgorithm == 9) return sierraLiteDither(coord, uParam1); // sierra-lite
                        if (uAlgorithm == 10) return sierra2Row(coord, uParam1); // two-row-sierra
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

                        // Error Diffusion Variants
                        if (uAlgorithm == 40) return falseFloydSteinberg(coord, uParam1); // false floyd-steinberg
                        if (uAlgorithm == 41) return horizontalStripe(coord, uParam1); // horizontal stripe
                        if (uAlgorithm == 42) return verticalStripe(coord, uParam1); // vertical stripe

                        if (uAlgorithm == 50) return voidAndCluster(coord); // void-and-cluster
                        if (uAlgorithm == 51) return ostromoukhov(coord); // ostromoukhov variable
                        
                        // PHASE 1: Retro/Visual Effects
                        if (uAlgorithm == 52) return scanlineDither(coord); // scanline dithering
                        // Algorithm 53 (chromatic aberration) is handled in main() before dithering
                        if (uAlgorithm == 53) return bayer4(coord); // chromatic aberration uses base dither
                        // Algorithm 54 (posterization) needs color info, handled differently

                        // PHASE 2: Quality Enhancement Algorithms
                        if (uAlgorithm == 55) return adaptiveThresholdDither(coord); // adaptive threshold
                        if (uAlgorithm == 56) return anisotropicDither(coord); // anisotropic
                        if (uAlgorithm == 57) return sobelEdgeWeightedDither(coord); // sobel edge-weighted

                        // PHASE 3: Advanced Error Diffusion
                        if (uAlgorithm == 58) return riemersmaDither(coord); // riemersma (hilbert curve)

                        // PHASE 4: Print/Professional Effects
                        if (uAlgorithm == 59) return halftoneCMYK(coord); // halftone CMYK
                        if (uAlgorithm == 60) return hexagonalDither(coord); // hexagonal grid

                        // PHASE 5: Creative/Artistic Effects
                        if (uAlgorithm == 61) return thresholdMapDither(coord); // threshold map
                        if (uAlgorithm == 62) return kuwaharaDither(coord); // kuwahara filter
                        if (uAlgorithm == 63) return ditherDisplacement(coord); // displacement mapping
                        if (uAlgorithm == 64) return reactionDiffusionDither(coord); // reaction-diffusion
                        if (uAlgorithm == 65) return ditherMorphology(coord); // morphology (erode/dilate)
                        if (uAlgorithm == 66) return multiScaleDither(coord); // multi-scale

                        return bayer4(coord);
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

                        // Apply pattern scale (advanced quality setting)
                        if (uScale != 1.0) {
                            coord = coord / uScale;
                        }

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

                        // Apply banding reduction - add extra noise to smooth gradients
                        if (uBandingReduction > 0.0) {
                            float bandingNoise = (hash(vUv * uResolution * 0.5) - 0.5) * 2.0;
                            ditherPattern += bandingNoise * uBandingReduction * 0.3;
                        }

                        // Apply dithering with perceptual color quantization
                        vec3 dithered;
                        float numLevels = float(uColors);
                        float stepSize = 1.0 / (numLevels - 1.0);

                        if (uGrayscale) {
                            float gray = toGray(color);
                            // Add dither noise scaled to step size
                            float noisyGray = gray + ditherPattern * stepSize * uDitherStrength;
                            // Quantize to color levels
                            float quantized = floor(noisyGray * (numLevels - 1.0) + 0.5) / (numLevels - 1.0);
                            dithered = vec3(clamp(quantized, 0.0, 1.0));
                        } else {
                            // Color space selection for better perceptual accuracy
                            vec3 workingColor = color;

                            // Convert to perceptual color space if selected
                            if (uColorSpace == 1) {
                                // LAB color space
                                workingColor = rgb2lab(color);
                            } else if (uColorSpace == 2) {
                                // Oklab color space (modern perceptual)
                                workingColor = rgb2oklab(color);
                            }

                            // Add dither noise
                            vec3 noisyColor = workingColor + vec3(ditherPattern * stepSize * uDitherStrength);

                            // Quantize each channel
                            dithered.r = floor(noisyColor.r * (numLevels - 1.0) + 0.5) / (numLevels - 1.0);
                            dithered.g = floor(noisyColor.g * (numLevels - 1.0) + 0.5) / (numLevels - 1.0);
                            dithered.b = floor(noisyColor.b * (numLevels - 1.0) + 0.5) / (numLevels - 1.0);

                            dithered = clamp(dithered, 0.0, 1.0);

                            // Convert back to RGB if we were in a perceptual space
                            if (uColorSpace == 1) {
                                dithered = lab2rgb(dithered);
                            } else if (uColorSpace == 2) {
                                dithered = oklab2rgb(dithered);
                            }
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

                        // Apply CRT/Display effects if any are enabled
                        if (uCRTEffect > 0.0 || uScanlines > 0.0 || uPhosphor || uCurvature > 0.0 || uVignette > 0.0 || uChromatic > 0.0 || uBloom > 0.0) {
                            dithered = applyCRTEffect(dithered, vUv, uCRTEffect);
                        }

                        gl_FragColor = vec4(dithered, 1.0);
                    }
`;
