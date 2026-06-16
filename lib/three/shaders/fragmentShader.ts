export const fragmentShader = `
                    // ============================================================
                    // UNIFORMS
                    // ============================================================
                    // ============================================================
                    // UNIFORMS
                    // ============================================================
                    uniform sampler2D tAsciiCustomShape;
                    uniform sampler2D tAsciiChars;
                    uniform sampler2D tDiffuse;
                    uniform sampler2D tPrevious;
                    uniform float uShowOriginal; // 1 → bypass dithering, show raw source (before/after compare)
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
                    uniform float uSaturation;
                    uniform float uHueShift;
                    // Effect animation (animates the dither / ASCII on any source)
                    uniform float uFxAnimate; // 0 or 1
                    uniform float uFxSpeed;
                    uniform int uFxMotion;    // 1 drift, 2 zoom, 3 wobble, 4 shimmer
                    uniform float uParam1, uParam2, uParam3, uParam4;
                    uniform float uScale, uMidtones, uHighlights, uLumThreshold, uBlur;
                    uniform float uPointSize;
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

                    // Post-Processing Effects
                    uniform float uFilmGrain;
                    uniform float uFilmGrainSize;
                    uniform float uGlitchIntensity;
                    uniform float uGlitchSpeed;
                    uniform bool uColorGradeEnabled;
                    uniform vec3 uColorGradeLift;
                    uniform vec3 uColorGradeGamma;
                    uniform vec3 uColorGradeGain;
                    uniform float uSharpen;
                    uniform float uNoise;
                    uniform float uPosterize;

                    // New Effects
                    uniform float uVhsEffect;
                    uniform float uEdgeGlow;
                    uniform float uEmboss;

                    // Analog signal effects (composite / VHS / CRT artifacts)
                    uniform float uAnalogWobble; // sync wobble + tracking jitter + head-switch tear
                    uniform float uAnalogBleed;  // composite chroma bleed (horizontal)
                    uniform float uAnalogStatic; // TV snow / signal noise
                    uniform float uAnalogHum;    // rolling AC hum bar
                    uniform float uAnalogGhost;  // signal ghost / echo
                    uniform float uAnalogRate;   // loop-matched phase rate (= active anim speed) so smooth analog motion tiles

                    // ASCII / Shape Effect Uniforms
                    uniform float uAsciiCellSizeNew;
                    uniform float uAsciiGap;
                    uniform float uAsciiBaseScale;
                    uniform float uAsciiIntensityNew;
                    uniform int uAsciiModeNew;
                    uniform int uAsciiShape;
                    uniform bool uAsciiUseColor;
                    uniform vec3 uAsciiBgColor;
                    uniform vec3 uAsciiFgColor;
                    uniform bool uAsciiInvertNew;
                    
                    // ASCII Art Settings (kept for compatibility)
                    uniform bool uAsciiEnabled;
                    uniform float uAsciiIntensity;
                    uniform float uAsciiCellSize;
                    uniform float uAsciiCharSet;
                    uniform float uAsciiColorMode;
                    uniform vec3 uAsciiForeground;
                    uniform vec3 uAsciiBackground;
                    uniform bool uAsciiInvert;
                    uniform float uAsciiContrast;
                    uniform float uCustomAsciiCharCount;
                    uniform sampler2D uAsciiTexture;
                    uniform float uAsciiCharCount;
                    
                    uniform bool uComparison;
                    uniform float uComparisonPos;
                    uniform bool uGridMode;
                    uniform int uGridAlgorithms[4];

                    varying vec2 vUv;


                    // ============================================================
                    // HELPER FUNCTIONS
                    // ============================================================

                    float hash(vec2 p) {
                        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                    }

                    // --- SDF PRIMITIVES (from CodePen) ---
                    #define PI 3.14159265359

                    float sdCircle(vec2 p, float r) { return length(p) - r; }
                    float sdBox(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
                    float sdTri(vec2 p, float r) { const float k = sqrt(3.0); p.x = abs(p.x) - r; p.y = p.y + r/k; if(p.x+k*p.y > 0.0) p = vec2(p.x-k*p.y, -k*p.x-p.y)/2.0; p.x -= clamp(p.x, -2.0*r, 0.0); return -length(p)*sign(p.y); }
                    float sdDiamond(vec2 p, float r) {
                        vec2 q = p / r;
                        q.x = abs(q.x);
                        q.x *= 1.3; 
                        q.y = -q.y;
                        q.y += 0.45; 
                        float d1 = dot(q, normalize(vec2(1.0, 1.2))) - 0.85;
                        float d2 = dot(q, normalize(vec2(0.3, -1.0))) - 0.4;
                        float d3 = q.y - 0.45;
                        return max(d1, max(d2, d3)) * r;
                    }
                    
                    float toGray(vec3 color) {
                        return dot(color, vec3(0.299, 0.587, 0.114));
                    }

                    float sdHex(vec2 p, float r) { const vec3 k = vec3(-0.866025404, 0.5, 0.577350269); p = abs(p.yx); p -= 2.0*min(dot(k.xy, p), 0.0)*k.xy; p -= vec2(clamp(p.x, -k.z*r, k.z*r), r); return length(p)*sign(p.y); }
                    float sdOctagon(vec2 p, float r) { const vec3 k = vec3(-0.9238795325, 0.3826834323, 0.4142135623); p = abs(p); p -= 2.0*min(dot(vec2(k.x,k.y),p),0.0)*vec2(k.x,k.y); p -= 2.0*min(dot(vec2(-k.x,k.y),p),0.0)*vec2(-k.x,k.y); return length(p) - r; }
                    
                    // Complex Shapes
                    float sdStar5(vec2 p, float r, float ratio) {
                        vec2 q = p / r; 
                        const vec2 k1 = vec2(0.809016994375, -0.587785252292);
                        const vec2 k2 = vec2(-k1.x, k1.y);
                        q.x = abs(q.x);
                        q -= 2.0*max(dot(k1,q),0.0)*k1;
                        q -= 2.0*max(dot(k2,q),0.0)*k2;
                        q.x = abs(q.x);
                        q.y -= 1.0; 
                        vec2 ba = ratio*vec2(-k1.y,k1.x) - vec2(0,1);
                        float h = clamp( dot(q,ba)/dot(ba,ba), 0.0, 1.0 );
                        return length(q-ba*h) * sign(q.y*ba.x-q.x*ba.y) * r;
                    }
                    float sdHeart(vec2 p) { p.x = abs(p.x); if(p.y+p.x>1.0) return sqrt(dot(p-vec2(0.25,0.75),p-vec2(0.25,0.75))) - sqrt(2.0)/4.0; return sqrt(min(dot(p-vec2(0.00,1.00),p-vec2(0.00,1.00)), dot(p-0.5*max(p.x+p.y,0.0),p-0.5*max(p.x+p.y,0.0)))) * sign(p.x-p.y); }
                    float sdFlower(vec2 p, float r) { float a = atan(p.y, p.x); float d = length(p); return d - (r + sin(a*5.0)*r*0.3); }
                    float sdGear(vec2 p, float r) { float a = atan(p.y, p.x); float d = length(p); return d - (r + step(0.5, sin(a*8.0))*r*0.2); }
                    float sdRing(vec2 p, float r, float th) { return abs(length(p) - r) - th; }
                    float sdTrapezoid(vec2 p, float r1, float r2, float he) { vec2 k1 = vec2(r2,he); vec2 k2 = vec2(r2-r1,2.0*he); p.x = abs(p.x); p.y -= 0.0; vec2 ca = vec2(p.x-min(p.x,(p.y<0.0)?r1:r2), abs(p.y)-he); vec2 cb = p - k1 + k2*clamp( dot(k1-p,k2)/dot(k2,k2), 0.0, 1.0 ); float s = (cb.x<0.0 && ca.y<0.0) ? -1.0 : 1.0; return s*sqrt( min(dot(ca,ca),dot(cb,cb)) ); }
                    float sdCross(vec2 p, float b, float r) { p = abs(p); p = (p.y>p.x) ? p.yx : p.xy; vec2  q = p - b; float k = max(q.y,q.x); vec2  w = (k>0.0) ? q : vec2(b-p.x,-k); return sign(k)*length(max(w,0.0)) + r; }
                    float sdSemiCircle(vec2 p, float r) { float d = length(p) - r; if(p.y > 0.0) d = max(d, p.y); else d = max(d, -p.y - r); return d; } 
                    float sdShuriken(vec2 p, float r) {
                        float a = atan(p.y, p.x);
                        float r0 = r;
                        float r1 = r * 0.2;
                        float f = smoothstep(-0.5, 1.0, cos(a*4.0)) * 0.2 + 0.5;
                        return length(p) - r * f;
                    }
                    float sdLightning(vec2 p, float r) {
                        p.x = abs(p.x);
                        float d = dot(p, normalize(vec2(1.0, 4.0)));
                        return abs(d) - r * 0.2; // Simplified
                    }
                    float sdGhost(vec2 p, float r) {
                        float head = length(p - vec2(0.0, r*0.2)) - r*0.8;
                        float bottom = p.y + r;
                        return max(head, -bottom); // Rough approx
                    }
                    float sdLeaf(vec2 p, float r) {
                        float d = length(p) - r;
                        return max(d, abs(p.x)*2.0 + p.y - r*2.0); // Rough leaf
                    }
                    float sdCloud(vec2 p, float r) {
                        float d1 = length(p) - r*0.5;
                        float d2 = length(p - vec2(r*0.4, 0.0)) - r*0.4;
                        float d3 = length(p - vec2(-r*0.4, 0.0)) - r*0.4;
                        return min(min(d1, d2), d3);
                    }

                    mat2 rotate2d(float angle){ return mat2(cos(angle), -sin(angle), sin(angle), cos(angle)); }

                    // Smooth Sampling
                    vec3 getAverageColor(vec2 uv, float cellSize, vec2 res) {
                        vec2 d = (1.0 / res) * cellSize * 0.25;
                        vec3 c1 = texture2D(tDiffuse, uv).rgb;
                        vec3 c2 = texture2D(tDiffuse, uv + vec2(d.x, d.y)).rgb;
                        vec3 c3 = texture2D(tDiffuse, uv + vec2(-d.x, d.y)).rgb;
                        vec3 c4 = texture2D(tDiffuse, uv + vec2(d.x, -d.y)).rgb;
                        vec3 c5 = texture2D(tDiffuse, uv + vec2(-d.x, -d.y)).rgb;
                        return (c1 + c2 + c3 + c4 + c5) / 5.0;
                    }



// Removed duplicate tAsciiCustomShape definition
// New Geometric/Halftone Uniforms
uniform int uHalftoneShape; // 0=Circle, 1=Square, 2=Diamond, 3=Triangle, 4=Line
uniform float uHalftoneRotation; // 0-360
uniform float uHalftoneSpread; // 0-2 (Controls overlap)

// Utility functions
float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

// 2D Rotation function
vec2 rotate(vec2 uv, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c) * uv;
}

// Signed Distance Functions
// sdCircle and sdBox are already defined above, so we'll use those.

// Triangle (equilateral)
float sdTriangle(vec2 p, float r) {
    const float k = sqrt(3.0);
    p.x = abs(p.x) - r;
    p.y = p.y + r/k;
    if( p.x+k*p.y>0.0 ) p = vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;
    p.x -= clamp( p.x, -2.0*r, 0.0 );
    return -length(p)*sign(p.y);
}

// Rhombus / Diamond
float sdRhombus(vec2 p, vec2 b) {
    p = abs(p);
    float h = clamp( 0.5*dot(b-2.0*p,b)/dot(b,b), -1.0, 1.0 );
    float d = length( p - 0.5*b*vec2(1.0-h,1.0+h) );
    return d * sign( p.x*b.y + p.y*b.x - b.x*b.y );
}

// Oriented Box (Line)
float sdOrientedBox( vec2 p, vec2 a, vec2 b, float th )
{
    float l = length(b-a);
    vec2  d = (b-a)/l;
    vec2  q = (p-(a+b)*0.5);
    q = mat2(d.x,-d.y,d.y,d.x)*q;
    q = abs(q) - vec2(l,th)*0.5;
    return length(max(q,0.0)) + min(max(q.x,q.y),0.0);    
}


                    // Forward declare
                    vec3 rgb2oklab(vec3 rgb);

                    // Find closest color in palette using Perceptual Oklab Distance
                    vec3 findClosestColor(vec3 color) {
                        // Check if we are in custom palette mode (2)
                        if (uColorMode != 2) return color;

                        vec3 targetLab = rgb2oklab(color);
                        float minDist = 1e9;
                        vec3 bestColor = color;
                        
                        // We iterate up to 16. Using loop with variable bound is okay in WebGL 2,
                        // but safer to use fixed loop with break or if check in WebGL 1.
                        // We will use integer loop 
                        for(int i=0; i<16; i++) {
                            // GLSL loop unrolling requires constant bounds usually.
                            // We can check if i < uPaletteSize inside.
                            if (i >= uPaletteSize) break;
                            
                            vec3 pColor = uPaletteColors[i];
                            vec3 pLab = rgb2oklab(pColor);
                            
                            // Euclidean distance in Oklab is perceptually uniform
                            float d = distance(targetLab, pLab);
                            
                            if (d < minDist) {
                                minDist = d;
                                bestColor = pColor;
                            }
                        }
                        return bestColor;
                    }

                    vec3 quantize(vec3 color, int levels) {
                        // usage: if uColorMode == 2, use findClosestColor
                        // else use simple quantization
                        
                        if (uColorMode == 2) {
                            return findClosestColor(color);
                        }
                        
                        // Standard quantization
                        float step = 1.0 / float(levels - 1);
                        return floor(color / step + 0.5) * step;
                    }


                    // Gamma correction
                    vec3 srgbToLinear(vec3 color) {
                        return pow(color, vec3(2.2));
                    }

                    vec3 linearToSrgb(vec3 color) {
                        return pow(color, vec3(1.0 / 2.2));
                    }

                    // ============================================================
                    // COLOR SPACE CONVERSIONS
                    // ============================================================

                    vec3 rgb2xyz(vec3 rgb) {
                        vec3 linear;
                        for (int i = 0; i < 3; i++) {
                            float c = rgb[i];
                            linear[i] = (c > 0.04045) ? pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
                        }
                        mat3 transform = mat3(
                            0.4124564, 0.3575761, 0.1804375,
                            0.2126729, 0.7151522, 0.0721750,
                            0.0193339, 0.1191920, 0.9503041
                        );
                        return linear * transform;
                    }

                    vec3 xyz2lab(vec3 xyz) {
                        vec3 ref = vec3(0.95047, 1.0, 1.08883);
                        xyz = xyz / ref;
                        vec3 f;
                        float delta = 6.0 / 29.0;
                        for (int i = 0; i < 3; i++) {
                            float val = xyz[i];
                            f[i] = (val > delta * delta * delta) ? pow(val, 1.0 / 3.0) : val / (3.0 * delta * delta) + 4.0 / 29.0;
                        }
                        float L = 116.0 * f.y - 16.0;
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
                        float delta = 6.0 / 29.0;
                        vec3 xyz;
                        xyz.x = (fx > delta) ? pow(fx, 3.0) : 3.0 * delta * delta * (fx - 4.0/29.0);
                        xyz.y = (fy > delta) ? pow(fy, 3.0) : 3.0 * delta * delta * (fy - 4.0/29.0);
                        xyz.z = (fz > delta) ? pow(fz, 3.0) : 3.0 * delta * delta * (fz - 4.0/29.0);
                        vec3 ref = vec3(0.95047, 1.0, 1.08883);
                        return xyz * ref;
                    }

                    vec3 xyz2rgb(vec3 xyz) {
                        mat3 transform = mat3(
                            3.2404542, -1.5371385, -0.4985314,
                            -0.9692660, 1.8760108, 0.0415560,
                            0.0556434, -0.2040259, 1.0572252
                        );
                        vec3 linear = xyz * transform;
                        vec3 rgb;
                        for (int i = 0; i < 3; i++) {
                            float c = linear[i];
                            rgb[i] = (c > 0.0031308) ? 1.055 * pow(c, 1.0/2.4) - 0.055 : 12.92 * c;
                        }
                        return clamp(rgb, 0.0, 1.0);
                    }

                    vec3 lab2rgb(vec3 lab) {
                        return xyz2rgb(lab2xyz(lab));
                    }

                    // Oklab color space
                    vec3 rgb2oklab(vec3 rgb) {
                        vec3 lms = mat3(
                            0.4122214708, 0.5363325363, 0.0514459929,
                            0.2119034982, 0.6806995451, 0.1073969566,
                            0.0883024619, 0.2817188376, 0.6299787005
                        ) * rgb;
                        lms = pow(lms, vec3(1.0/3.0));
                        return mat3(
                            0.2104542553, 0.7936177850, -0.0040720468,
                            1.9779984951, -2.4285922050, 0.4505937099,
                            0.0259040371, 0.7827717662, -0.8086757660
                        ) * lms;
                    }

                    vec3 oklab2rgb(vec3 lab) {
                        vec3 lms = mat3(
                            1.0, 0.3963377774, 0.2158037573,
                            1.0, -0.1055613458, -0.0638541728,
                            1.0, -0.0894841775, -1.2914855480
                        ) * lab;
                        lms = lms * lms * lms;
                        return mat3(
                            4.0767416621, -3.3077115913, 0.2309699292,
                            -1.2684380046, 2.6097574011, -0.3413193965,
                            -0.0041960863, -0.7034186147, 1.7076147010
                        ) * lms;
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

                    float colorDistance(vec3 c1, vec3 c2) {
                        vec3 lab1 = rgb2lab(c1);
                        vec3 lab2 = rgb2lab(c2);
                        vec3 delta = lab1 - lab2;
                        return sqrt(dot(delta, delta));
                    }

                    // ============================================================
                    // DITHERING ALGORITHMS
                    // Add your algorithms here. Each should return a threshold value 0-1.
                    // The main loop will use: if (luminance > threshold) pixel = white else black
                    // ============================================================

                    // Algorithm 0: No dithering (threshold at 0.5)
                    float noDither(vec2 coord) {
                        return 0.5;
                    }

                    // Blue noise hash for organic randomness
                    float blueNoiseHash(vec2 p) {
                        // Interleaved gradient noise - approximates blue noise distribution
                        return fract(52.9829189 * fract(0.06711056 * p.x + 0.00583715 * p.y));
                    }

                    // Algorithm 1: Floyd-Steinberg (GPU Approximation)
                    // True F-S is sequential; this approximates the visual result using
                    // local neighborhood analysis + blue noise for organic dithering
                    float floydSteinbergApprox(vec2 coord, vec2 uv) {
                        float diffusionStrength = uParam1;
                        float feedback = uParam2;
                        float errorClamping = uParam3;
                        
                        vec2 pixelSize = 1.0 / uResolution;
                        
                        // Sample current and neighboring pixels
                        vec3 current = texture2D(tDiffuse, uv).rgb;
                        
                        // Sample neighbors in the F-S diffusion pattern
                        vec3 left = texture2D(tDiffuse, uv + vec2(-pixelSize.x, 0.0)).rgb;
                        vec3 topLeft = texture2D(tDiffuse, uv + vec2(-pixelSize.x, -pixelSize.y)).rgb;
                        vec3 top = texture2D(tDiffuse, uv + vec2(0.0, -pixelSize.y)).rgb;
                        vec3 topRight = texture2D(tDiffuse, uv + vec2(pixelSize.x, -pixelSize.y)).rgb;
                        
                        // Calculate luminances
                        float currentLum = toGray(current);
                        float leftLum = toGray(left);
                        float topLeftLum = toGray(topLeft);
                        float topLum = toGray(top);
                        float topRightLum = toGray(topRight);
                        
                        // Estimate accumulated error from neighbors using F-S weights (reversed)
                        // Original F-S diffuses: right 7/16, bottom-left 3/16, bottom 5/16, bottom-right 1/16
                        // We look at the inverse direction to estimate incoming error
                        float leftQuantized = floor(leftLum * float(uColors - 1) + 0.5) / float(uColors - 1);
                        float topLeftQuantized = floor(topLeftLum * float(uColors - 1) + 0.5) / float(uColors - 1);
                        float topQuantized = floor(topLum * float(uColors - 1) + 0.5) / float(uColors - 1);
                        float topRightQuantized = floor(topRightLum * float(uColors - 1) + 0.5) / float(uColors - 1);
                        
                        // Error from each neighbor
                        float leftError = leftLum - leftQuantized;
                        float topLeftError = topLeftLum - topLeftQuantized;
                        float topError = topLum - topQuantized;
                        float topRightError = topRightLum - topRightQuantized;
                        
                        // Weighted error accumulation (F-S weights reversed)
                        float accumulatedError = (leftError * 7.0/16.0 + 
                                                  topLeftError * 1.0/16.0 + 
                                                  topError * 5.0/16.0 + 
                                                  topRightError * 3.0/16.0) * feedback;
                        
                        // Clamp error to prevent extreme values
                        accumulatedError = clamp(accumulatedError, -errorClamping, errorClamping);
                        
                        // Add blue noise for organic feel and to break up patterns
                        float noise = blueNoiseHash(coord);
                        
                        // Serpentine scanning simulation - alternate direction based on row
                        float serpentineMod = 1.0;
                        if (uSerpentine) {
                            serpentineMod = (mod(coord.y, 2.0) < 1.0) ? 1.0 : -1.0;
                            accumulatedError *= serpentineMod;
                        }
                        
                        // Edge preservation - reduce dithering on edges
                        float threshold = 0.5 + accumulatedError;
                        if (uEdgePreservation > 0.0) {
                            float edge = abs(currentLum - topLum) + abs(currentLum - leftLum);
                            edge = clamp(edge * 4.0, 0.0, 1.0);
                            threshold = mix(threshold, 0.5, edge * uEdgePreservation);
                        }
                        return threshold;
                    }

                    // Algorithm 3: Ostromoukhov Diffusion (Approximation)
                    // (Variable weights based on luma)
                    float ostromoukhovApprox(vec2 coord, vec2 uv) {
                        vec2 pixelSize = 1.0 / uResolution;
                        vec3 current = texture2D(tDiffuse, uv).rgb;
                        float lum = toGray(current);
                        
                        // Ostromoukhov coefficients (Variable weights based on luma)
                        float w1 = 0.5 - 0.5 * lum; 
                        float w2 = 0.25 + 0.25 * lum; 
                        float w3 = 0.25;            
                        float startW = w1 + w2 + w3;
                        w1 /= startW; w2 /= startW; w3 /= startW;
                        
                        vec3 top = texture2D(tDiffuse, uv + vec2(0.0, -pixelSize.y)).rgb;
                        vec3 topLeft = texture2D(tDiffuse, uv + vec2(-pixelSize.x, -pixelSize.y)).rgb;
                        vec3 topRight = texture2D(tDiffuse, uv + vec2(pixelSize.x, -pixelSize.y)).rgb;
                        vec3 left = texture2D(tDiffuse, uv + vec2(-pixelSize.x, 0.0)).rgb;

                        float steps = float(uColors - 1);
                        float errLeft = toGray(left) - (floor(toGray(left) * steps + 0.5) / steps);
                        float errTop = toGray(top) - (floor(toGray(top) * steps + 0.5) / steps);
                        float errTL = toGray(topLeft) - (floor(toGray(topLeft) * steps + 0.5) / steps);
                        float errTR = toGray(topRight) - (floor(toGray(topRight) * steps + 0.5) / steps);

                        // Variable weight accumulation
                        float accError = (errLeft * w1 + errTL * w2 + errTop * w3 + errTR * w2) * uParam1;
                        
                        // Contrast noise
                        float noise = (blueNoiseHash(coord) - 0.5) * 0.2 * uParam2;
                        
                        return 0.5 + accError + noise;
                    }

                    // Algorithm 4: Atkinson Dithering (Approximation)
                    // Distributes 1/8 to 6 neighbors, discarding 1/4 of the error (high contrast)
                    float atkinsonApprox(vec2 coord, vec2 uv) {
                         vec2 pixelSize = 1.0 / uResolution;
                         vec3 current = texture2D(tDiffuse, uv).rgb;
                         float lum = toGray(current);
                         
                         // Approx: Sample generic neighbors and weight
                         // Atkinson Pattern (Source X):
                         //   X 1 1 
                         // 1 1 1
                         //   1
                         
                         vec3 n1 = texture2D(tDiffuse, uv + vec2(pixelSize.x, 0.0)).rgb;
                         vec3 n2 = texture2D(tDiffuse, uv + vec2(pixelSize.x * 2.0, 0.0)).rgb; // Right 2
                         vec3 n3 = texture2D(tDiffuse, uv + vec2(-pixelSize.x, pixelSize.y)).rgb;
                         vec3 n4 = texture2D(tDiffuse, uv + vec2(0.0, pixelSize.y)).rgb;
                         vec3 n5 = texture2D(tDiffuse, uv + vec2(pixelSize.x, pixelSize.y)).rgb;
                         vec3 n6 = texture2D(tDiffuse, uv + vec2(0.0, pixelSize.y * 2.0)).rgb; // Down 2
                         
                         float steps = float(uColors - 1);
                         float accError = 0.0;
                         
                         // Gather error from neighbors (inverse direction)
                         vec3[] neighbors = vec3[](n1, n2, n3, n4, n5, n6);
                         for(int i=0; i<6; i++) {
                             float l = toGray(neighbors[i]);
                             float q = floor(l * steps + 0.5) / steps;
                             accError += (l - q);
                         }
                         
                         // Atkinson weight is 1/8 per neighbor
                         accError *= (1.0/8.0);
                         
                         // Only 75% error is preserved in Atkinson (6 * 1/8 = 0.75)
                         // This is characteristic of the look.
                         
                         float noise = (blueNoiseHash(coord) - 0.5) * 0.1;
                         return 0.5 + accError * uParam1 + noise;
                    }

                    // Algorithm 5: Stucki Dithering (Approximation)
                    // Clean, sharp, 3-row distribution
                    float stuckiApprox(vec2 coord, vec2 uv) {
                         vec2 pixelSize = 1.0 / uResolution;
                         vec3 current = texture2D(tDiffuse, uv).rgb;
                         
                         // Simple 4-neighbor lookup for speed/approx
                         // Stucki is complex (12 neighbors), we approximate with wider sampling
                         
                         vec3 right = texture2D(tDiffuse, uv + vec2(pixelSize.x, 0.0)).rgb;
                         vec3 right2 = texture2D(tDiffuse, uv + vec2(pixelSize.x * 2.0, 0.0)).rgb;
                         
                         vec3 down = texture2D(tDiffuse, uv + vec2(0.0, pixelSize.y)).rgb;
                         vec3 downLeft = texture2D(tDiffuse, uv + vec2(-pixelSize.x, pixelSize.y)).rgb;
                         vec3 downRight = texture2D(tDiffuse, uv + vec2(pixelSize.x, pixelSize.y)).rgb;
                         vec3 downRight2 = texture2D(tDiffuse, uv + vec2(pixelSize.x * 2.0, pixelSize.y)).rgb;
                         vec3 downLeft2 = texture2D(tDiffuse, uv + vec2(-pixelSize.x * 2.0, pixelSize.y)).rgb;
                         
                         vec3 down2 = texture2D(tDiffuse, uv + vec2(0.0, pixelSize.y * 2.0)).rgb;
                         
                         float steps = float(uColors - 1);
                         float totalError = 0.0;
                         
                         // Weights (Stucki uses /42)
                         // We gather roughly proportional to kernel
                         totalError += (toGray(right) - floor(toGray(right) * steps + 0.5)/steps) * (8.0/42.0);
                         totalError += (toGray(right2) - floor(toGray(right2) * steps + 0.5)/steps) * (4.0/42.0);
                         
                         totalError += (toGray(down) - floor(toGray(down) * steps + 0.5)/steps) * (8.0/42.0);
                         totalError += (toGray(downLeft) - floor(toGray(downLeft) * steps + 0.5)/steps) * (4.0/42.0);
                         totalError += (toGray(downRight) - floor(toGray(downRight) * steps + 0.5)/steps) * (4.0/42.0);
                         
                         totalError += (toGray(down2) - floor(toGray(down2) * steps + 0.5)/steps) * (4.0/42.0);

                         float noise = (blueNoiseHash(coord) - 0.5) * 0.05; // Less noise for Stucki (cleaner)
                         return 0.5 + totalError * uParam1 + noise;
                    }


                    // Algorithm 7: Sierra Lite (Approximation)
                    // Simplified Sierra. Fast, clean.
                    float sierraLiteApprox(vec2 coord, vec2 uv) {
                        vec2 pixelSize = 1.0 / uResolution;
                        vec3 current = texture2D(tDiffuse, uv).rgb;
                        float lum = toGray(current);
                        
                        // Sierra Lite Kernel (Divisor 4)
                        //   X 2
                        // 1 1
                        
                        vec3 right = texture2D(tDiffuse, uv + vec2(pixelSize.x, 0.0)).rgb;
                        vec3 downLeft = texture2D(tDiffuse, uv + vec2(-pixelSize.x, pixelSize.y)).rgb;
                        vec3 down = texture2D(tDiffuse, uv + vec2(0.0, pixelSize.y)).rgb;
                        
                        float steps = float(uColors - 1);
                        float totalError = 0.0;
                        
                        totalError += (toGray(right) - floor(toGray(right) * steps + 0.5)/steps) * (2.0/4.0);
                        totalError += (toGray(downLeft) - floor(toGray(downLeft) * steps + 0.5)/steps) * (1.0/4.0);
                        totalError += (toGray(down) - floor(toGray(down) * steps + 0.5)/steps) * (1.0/4.0);
                        
                        float noise = (blueNoiseHash(coord) - 0.5) * 0.05;
                        return 0.5 + totalError * uParam1 + noise;
                    }

                    // Algorithm 8: Sierra 2-Row (Approximation)
                    // Good balance.
                    float sierra2Approx(vec2 coord, vec2 uv) {
                        vec2 pixelSize = 1.0 / uResolution;
                        vec3 current = texture2D(tDiffuse, uv).rgb;
                        float lum = toGray(current);
                        
                        // Sierra 2-Row Kernel (Divisor 16)
                        //     X 4 3
                        // 1 2 3 2 1
                        
                        vec3 right = texture2D(tDiffuse, uv + vec2(pixelSize.x, 0.0)).rgb;
                        vec3 right2 = texture2D(tDiffuse, uv + vec2(pixelSize.x * 2.0, 0.0)).rgb;
                        
                        vec3 downLeft2 = texture2D(tDiffuse, uv + vec2(-pixelSize.x * 2.0, pixelSize.y)).rgb;
                        vec3 downLeft = texture2D(tDiffuse, uv + vec2(-pixelSize.x, pixelSize.y)).rgb;
                        vec3 down = texture2D(tDiffuse, uv + vec2(0.0, pixelSize.y)).rgb;
                        vec3 downRight = texture2D(tDiffuse, uv + vec2(pixelSize.x, pixelSize.y)).rgb;
                        vec3 downRight2 = texture2D(tDiffuse, uv + vec2(pixelSize.x * 2.0, pixelSize.y)).rgb;

                        float steps = float(uColors - 1);
                        float totalError = 0.0;
                        
                        totalError += (toGray(right) - floor(toGray(right) * steps + 0.5)/steps) * (4.0/16.0);
                        totalError += (toGray(right2) - floor(toGray(right2) * steps + 0.5)/steps) * (3.0/16.0);
                        
                        totalError += (toGray(downLeft2) - floor(toGray(downLeft2) * steps + 0.5)/steps) * (1.0/16.0);
                        totalError += (toGray(downLeft) - floor(toGray(downLeft) * steps + 0.5)/steps) * (2.0/16.0);
                        totalError += (toGray(down) - floor(toGray(down) * steps + 0.5)/steps) * (3.0/16.0);
                        totalError += (toGray(downRight) - floor(toGray(downRight) * steps + 0.5)/steps) * (2.0/16.0);
                        totalError += (toGray(downRight2) - floor(toGray(downRight2) * steps + 0.5)/steps) * (1.0/16.0);
                        
                        float noise = (blueNoiseHash(coord) - 0.5) * 0.05;
                        return 0.5 + totalError * uParam1 + noise;
                    }


                    // Algorithm 9: Sierra 3-Row (Approximation)
                    // High quality, smooth.
                    float sierra3Approx(vec2 coord, vec2 uv) {
                        vec2 pixelSize = 1.0 / uResolution;
                        vec3 current = texture2D(tDiffuse, uv).rgb;
                        float lum = toGray(current);
                        
                        // Sierra 3-Row Kernel (Divisor 32)
                        //     X 5 3
                        // 2 4 5 4 2
                        //   2 3 2
                        
                        vec3 right = texture2D(tDiffuse, uv + vec2(pixelSize.x, 0.0)).rgb;
                        vec3 right2 = texture2D(tDiffuse, uv + vec2(pixelSize.x * 2.0, 0.0)).rgb;
                        
                        vec3 downLeft2 = texture2D(tDiffuse, uv + vec2(-pixelSize.x * 2.0, pixelSize.y)).rgb;
                        vec3 downLeft = texture2D(tDiffuse, uv + vec2(-pixelSize.x, pixelSize.y)).rgb;
                        vec3 down = texture2D(tDiffuse, uv + vec2(0.0, pixelSize.y)).rgb;
                        vec3 downRight = texture2D(tDiffuse, uv + vec2(pixelSize.x, pixelSize.y)).rgb;
                        vec3 downRight2 = texture2D(tDiffuse, uv + vec2(pixelSize.x * 2.0, pixelSize.y)).rgb;
                        
                        vec3 down2Left = texture2D(tDiffuse, uv + vec2(-pixelSize.x, pixelSize.y * 2.0)).rgb;
                        vec3 down2 = texture2D(tDiffuse, uv + vec2(0.0, pixelSize.y * 2.0)).rgb;
                        vec3 down2Right = texture2D(tDiffuse, uv + vec2(pixelSize.x, pixelSize.y * 2.0)).rgb;

                        float steps = float(uColors - 1);
                        float totalError = 0.0;
                        
                        totalError += (toGray(right) - floor(toGray(right) * steps + 0.5)/steps) * (5.0/32.0);
                        totalError += (toGray(right2) - floor(toGray(right2) * steps + 0.5)/steps) * (3.0/32.0);
                        
                        totalError += (toGray(downLeft2) - floor(toGray(downLeft2) * steps + 0.5)/steps) * (2.0/32.0);
                        totalError += (toGray(downLeft) - floor(toGray(downLeft) * steps + 0.5)/steps) * (4.0/32.0);
                        totalError += (toGray(down) - floor(toGray(down) * steps + 0.5)/steps) * (5.0/32.0);
                        totalError += (toGray(downRight) - floor(toGray(downRight) * steps + 0.5)/steps) * (4.0/32.0);
                        totalError += (toGray(downRight2) - floor(toGray(downRight2) * steps + 0.5)/steps) * (2.0/32.0);
                        
                        totalError += (toGray(down2Left) - floor(toGray(down2Left) * steps + 0.5)/steps) * (2.0/32.0);
                        totalError += (toGray(down2) - floor(toGray(down2) * steps + 0.5)/steps) * (3.0/32.0);
                        totalError += (toGray(down2Right) - floor(toGray(down2Right) * steps + 0.5)/steps) * (2.0/32.0);
                        
                        float noise = (blueNoiseHash(coord) - 0.5) * 0.05;
                        return 0.5 + totalError * uParam1 + noise;
                    }

                    // Algorithm 10: Burkes (Approximation)
                    // Clean, sharp.
                    float burkesApprox(vec2 coord, vec2 uv) {
                        vec2 pixelSize = 1.0 / uResolution;
                        vec3 current = texture2D(tDiffuse, uv).rgb;
                        float lum = toGray(current);
                        
                        // Burkes Kernel (Divisor 32)
                        //     X 8 4
                        // 2 4 8 4 2
                        
                        vec3 right = texture2D(tDiffuse, uv + vec2(pixelSize.x, 0.0)).rgb;
                        vec3 right2 = texture2D(tDiffuse, uv + vec2(pixelSize.x * 2.0, 0.0)).rgb;
                        
                        vec3 downLeft2 = texture2D(tDiffuse, uv + vec2(-pixelSize.x * 2.0, pixelSize.y)).rgb;
                        vec3 downLeft = texture2D(tDiffuse, uv + vec2(-pixelSize.x, pixelSize.y)).rgb;
                        vec3 down = texture2D(tDiffuse, uv + vec2(0.0, pixelSize.y)).rgb;
                        vec3 downRight = texture2D(tDiffuse, uv + vec2(pixelSize.x, pixelSize.y)).rgb;
                        vec3 downRight2 = texture2D(tDiffuse, uv + vec2(pixelSize.x * 2.0, pixelSize.y)).rgb;

                        float steps = float(uColors - 1);
                        float totalError = 0.0;
                        
                        totalError += (toGray(right) - floor(toGray(right) * steps + 0.5)/steps) * (8.0/32.0);
                        totalError += (toGray(right2) - floor(toGray(right2) * steps + 0.5)/steps) * (4.0/32.0);
                        
                        totalError += (toGray(downLeft2) - floor(toGray(downLeft2) * steps + 0.5)/steps) * (2.0/32.0);
                        totalError += (toGray(downLeft) - floor(toGray(downLeft) * steps + 0.5)/steps) * (4.0/32.0);
                        totalError += (toGray(down) - floor(toGray(down) * steps + 0.5)/steps) * (8.0/32.0);
                        totalError += (toGray(downRight) - floor(toGray(downRight) * steps + 0.5)/steps) * (4.0/32.0);
                        totalError += (toGray(downRight2) - floor(toGray(downRight2) * steps + 0.5)/steps) * (2.0/32.0);
                        
                        float noise = (blueNoiseHash(coord) - 0.5) * 0.05;
                        return 0.5 + totalError * uParam1 + noise;
                    }

                    // Algorithm 11: Jarvis-Judice-Ninke (Approximation)
                    // High contrast, sharp.
                    float jarvisApprox(vec2 coord, vec2 uv) {
                        // Structurally identical to Sierra 3-Row but with different weights
                        // JJN Kernel (Divisor 48)
                        //     X 7 5
                        // 3 5 7 5 3
                        // 1 3 5 3 1
                        
                        vec2 pixelSize = 1.0 / uResolution;
                        vec3 current = texture2D(tDiffuse, uv).rgb;
                        float lum = toGray(current);
                        
                        vec3 right = texture2D(tDiffuse, uv + vec2(pixelSize.x, 0.0)).rgb;
                        vec3 right2 = texture2D(tDiffuse, uv + vec2(pixelSize.x * 2.0, 0.0)).rgb;
                        
                        vec3 downLeft2 = texture2D(tDiffuse, uv + vec2(-pixelSize.x * 2.0, pixelSize.y)).rgb;
                        vec3 downLeft = texture2D(tDiffuse, uv + vec2(-pixelSize.x, pixelSize.y)).rgb;
                        vec3 down = texture2D(tDiffuse, uv + vec2(0.0, pixelSize.y)).rgb;
                        vec3 downRight = texture2D(tDiffuse, uv + vec2(pixelSize.x, pixelSize.y)).rgb;
                        vec3 downRight2 = texture2D(tDiffuse, uv + vec2(pixelSize.x * 2.0, pixelSize.y)).rgb;
                        
                        vec3 down2Left2 = texture2D(tDiffuse, uv + vec2(-pixelSize.x * 2.0, pixelSize.y * 2.0)).rgb;
                        vec3 down2Left = texture2D(tDiffuse, uv + vec2(-pixelSize.x, pixelSize.y * 2.0)).rgb;
                        vec3 down2 = texture2D(tDiffuse, uv + vec2(0.0, pixelSize.y * 2.0)).rgb;
                        vec3 down2Right = texture2D(tDiffuse, uv + vec2(pixelSize.x, pixelSize.y * 2.0)).rgb;
                        vec3 down2Right2 = texture2D(tDiffuse, uv + vec2(pixelSize.x * 2.0, pixelSize.y * 2.0)).rgb;

                        float steps = float(uColors - 1);
                        float totalError = 0.0;
                        
                        totalError += (toGray(right) - floor(toGray(right) * steps + 0.5)/steps) * (7.0/48.0);
                        totalError += (toGray(right2) - floor(toGray(right2) * steps + 0.5)/steps) * (5.0/48.0);
                        
                        totalError += (toGray(downLeft2) - floor(toGray(downLeft2) * steps + 0.5)/steps) * (3.0/48.0);
                        totalError += (toGray(downLeft) - floor(toGray(downLeft) * steps + 0.5)/steps) * (5.0/48.0);
                        totalError += (toGray(down) - floor(toGray(down) * steps + 0.5)/steps) * (7.0/48.0);
                        totalError += (toGray(downRight) - floor(toGray(downRight) * steps + 0.5)/steps) * (5.0/48.0);
                        totalError += (toGray(downRight2) - floor(toGray(downRight2) * steps + 0.5)/steps) * (3.0/48.0);
                        
                        totalError += (toGray(down2Left2) - floor(toGray(down2Left2) * steps + 0.5)/steps) * (1.0/48.0);
                        totalError += (toGray(down2Left) - floor(toGray(down2Left) * steps + 0.5)/steps) * (3.0/48.0);
                        totalError += (toGray(down2) - floor(toGray(down2) * steps + 0.5)/steps) * (5.0/48.0);
                        totalError += (toGray(down2Right) - floor(toGray(down2Right) * steps + 0.5)/steps) * (3.0/48.0);
                        totalError += (toGray(down2Right2) - floor(toGray(down2Right2) * steps + 0.5)/steps) * (1.0/48.0);
                        
                        float noise = (blueNoiseHash(coord) - 0.5) * 0.05;
                        return 0.5 + totalError * uParam1 + noise;
                    }

                    // Algorithm 6: Bayer Ordered Dithering
                    // Structued, non-error-diffusion
                    float bayer2(vec2 c) {
                        // 2x2 Bayer Matrix
                        // 0 2
                        // 3 1
                        int x = int(mod(c.x, 2.0));
                        int y = int(mod(c.y, 2.0));
                        float v = 0.0;
                        if(x==0 && y==0) v=0.0; else if(x==1 && y==0) v=2.0;
                        else if(x==0 && y==1) v=3.0; else v=1.0;
                        return (v + 0.5) / 4.0;
                    }

                    float bayer4(vec2 c) {
                        // 4x4 derived from 2x2
                        // M4 = [ 4*M2,   4*M2+2 ]
                        //      [ 4*M2+3, 4*M2+1 ]
                        // But easier to just compute or hardcode for performance. 
                        // Using algorithmic approach for recursion:
                        
                        // Recursive definition:
                        // val(x, y, 4) = 4 * val(x%2, y%2, 2) + val(x/2, y/2, 2)
                        // Simplified 4x4 lookup:
                        int x = int(mod(c.x, 4.0));
                        int y = int(mod(c.y, 4.0));
                        
                        // Flat array approach is messy in GLSL 1.0 (no array initializers)
                        // So we compute.
                        float v = 0.0;
                        // 2x2 base
                        vec2 c2 = floor(c * 0.5); // "Upper" coordinates
                        float b2_base = bayer2(c); // Lower bits
                        float b2_upper = bayer2(c2); 
                        
                        // Formula: D_2n(x,y) = 4 * D_n(x%n, y%n) + D_2(x/n, y/n)
                        
                        // Normalized approach:
                        // return fract(bayer2(c) + bayer2(c/2.0) / 4.0)? Not quite.
                        
                        // Let's use standard hardcoded logic for 4x4 and 8x8 stability
                        const float s = 4.0;
                        if (x==0) { 
                            if(y==0) v=0.0; else if(y==1) v=8.0; else if(y==2) v=2.0; else v=10.0; 
                        } else if (x==1) {
                            if(y==0) v=12.0; else if(y==1) v=4.0; else if(y==2) v=14.0; else v=6.0;
                        } else if (x==2) {
                            if(y==0) v=3.0; else if(y==1) v=11.0; else if(y==2) v=1.0; else v=9.0;
                        } else {
                            if(y==0) v=15.0; else if(y==1) v=7.0; else if(y==2) v=13.0; else v=5.0;
                        }
                        return (v + 0.5) / 16.0;
                    }

                    float bayer8(vec2 c) {
                         // 8x8
                         int x = int(mod(c.x, 8.0));
                         int y = int(mod(c.y, 8.0));
                         
                         // Recursion: 4 * bayer4(x%4, y%4) + bayer2(x/4, y/4)
                         float v4 = floor(bayer4(c) * 16.0); // 0..15
                         float v2_upper = floor(bayer2(c / 4.0) * 4.0); // 0..3
                         
                         // Formula for D_2n is actually:
                         // D_2n = 4 * D_n + D_2_val_from_quadrant
                         
                         return (4.0 * v4 + v2_upper + 0.5) / 64.0;
                    }

                    float bayerOrdered(vec2 coord) {
                        int size = int(uParam1); // 0=2x2, 1=4x4, 2=8x8
                        
                        if (size == 0) return bayer2(coord);
                        if (size == 1) return bayer4(coord);
                        if (size == 2) return bayer8(coord);
                        
                        return bayer4(coord);
                    }
                        
                    // Algorithm 12: Halftone Dot
                    float halftoneDot(vec2 coord, vec2 uv) {
                        // Angle from param1 (in degrees), encoded as 0-90
                        float angle = radians(uParam1);
                        mat2 rot = rotate2d(angle);
                        
                        vec2 p = coord;
                        p = rot * p;
                        
                        // Grid size depends on scale parameter from UI (uScale)
                        // But here we use a fixed size relative to pixel space for the pattern
                        // The 's' value drives the frequency. 
                        float s = 4.0; 
                        
                        // Nearest grid center
                        vec2 nearest = floor(p / s + 0.5) * s;
                        float dist = length(p - nearest) / (s * 0.75); // Normalize
                        
                        return clamp(dist, 0.0, 1.0);
                    }

                    // Algorithm 13: Halftone Line
                    float halftoneLine(vec2 coord, vec2 uv) {
                        float angle = radians(uParam1);
                        mat2 rot = rotate2d(angle);
                        vec2 p = rot * coord;
                        
                        // Sine wave pattern
                        float s = 4.0;
                        float v = sin(p.y * (PI * 2.0 / s));
                        return (v + 1.0) * 0.5;
                    }

                    // Algorithm 14: Crosshatch
                    float crosshatch(vec2 coord, vec2 uv) {
                        vec3 current = texture2D(tDiffuse, uv).rgb;
                        float lum = toGray(current);
                        
                        // We return a threshold that makes it likely to be black if lum is low
                        // But 'threshold' is compared: if (lum > threshold) pixel = white
                        
                        // We want:
                        // Lum 1.0 -> White
                        // Lum 0.8 -> Occasional dot
                        // Lum 0.6 -> Single diagonal
                        // Lum 0.4 -> Cross
                        // Lum 0.2 -> Heavy cross
                        
                        // Dist = distance to line
                        float dist = 0.0;
                        float s = 6.0; // Spacing
                        
                        // Diagonal 1
                        float d1 = abs(mod(coord.x + coord.y, s) - s/2.0) / (s/2.0); // 0..1 triangle wave
                        // Diagonal 2
                        float d2 = abs(mod(coord.x - coord.y, s) - s/2.0) / (s/2.0);
                        
                        // If we return a value K, and lum > K, we get white.
                        // If lum < threshold, pixel is black.
                        
                        // Invert d: 1.0 - d1 is 1.0 at line center.
                        float l1 = 1.0 - d1;
                        float l2 = 1.0 - d2;
                        
                        // Combined density
                        float density = (l1 + l2) * 0.5;
                        
                        // We want the threshold to be HIGH where lines are (so lum < threshold -> black)
                        // And LOW where space is (so lum > threshold -> white)
                        
                        // But actually, simpler GLSL hatch usually works by defining levels.
                        // Let's stick to a procedural threshold that mimics the ramp.
                        
                        // 1.0 at line center. 0.0 between lines.
                        // 1.0 at line center. 0.0 between lines.
                        float t1 = (sin((coord.x + coord.y) * PI / 4.0) + 1.0) * 0.5;
                        float t2 = (sin((coord.x - coord.y) * PI / 4.0) + 1.0) * 0.5;
                        
                        // We mix them based on desired density, but here we return a single threshold value
                        // that represents the "darkness" required to trigger this pixel.
                        
                        // If we return 0.5, then 50% gray triggers it.
                        // Code below uses: if (lum > threshold) color = white;
                        
                        // So if we want a line at pixel P, we want threshold(P) to be HIGH (e.g. 0.9).
                        // Then even bright gray (0.8) > 0.9 is FALSE -> Black.
                        
                        // So at line center, return 1.0. At gap, return 0.0.
                        
                        // Hatch 1: Diagonal /
                        float h1 = (sin((coord.x + coord.y) * PI / 4.0) + 1.0) * 0.5;
                        // Hatch 2: Diagonal
                        float h2 = (sin((coord.x - coord.y) * PI / 4.0) + 1.0) * 0.5;
                        
                        // Combine: darker areas get both. Lighter get one.
                        // To simulate this with a single threshold:
                        // We need a gradient.
                        
                        // Let's try simpler logic:
                        // The threshold func should return a gradient from 0..1 distributed over the pattern.
                        
                        float m = (h1 + h2) * 0.5; // 0..1
                        // This effectively means intersections are 1, gaps are 0.
                        // But we want progressive hatching.
                        
                        // Let's use ordered Bayer 4x4 as a base but bias it with lines
                        float b = bayer4(coord);
                        
                        // Bias bayer towards lines?
                        return mix(b, m, 0.7);
                    }

                     // Get dither threshold based on selected algorithm
                     float getDitherThreshold(vec2 coord, int algorithm) {
                         vec2 uv = coord / uResolution;
                         
                         // Algorithm 0: No dithering
                         if (algorithm == 0) return noDither(coord);
                         
                         // Algorithm 1: Floyd-Steinberg
                         if (algorithm == 1) return floydSteinbergApprox(coord, uv);
                         
                         // Algorithm 3: Ostromoukhov
                         if (algorithm == 3) return ostromoukhovApprox(coord, uv);
                         
                         // Algorithm 4: Atkinson
                         if (algorithm == 4) return atkinsonApprox(coord, uv);
 
                         // Algorithm 5: Stucki
                         if (algorithm == 5) return stuckiApprox(coord, uv);
 
                         // Algorithm 6: Bayer
                         if (algorithm == 6) return bayerOrdered(coord);
 
                         // Algorithm 7: Sierra Lite
                         if (algorithm == 7) return sierraLiteApprox(coord, uv);
 
                         // Algorithm 8: Sierra 2-Row
                         if (algorithm == 8) return sierra2Approx(coord, uv);
 
                         // Algorithm 9: Sierra 3-Row
                         if (algorithm == 9) return sierra3Approx(coord, uv);
 
                         // Algorithm 10: Burkes
                         if (algorithm == 10) return burkesApprox(coord, uv);
 
                         // Algorithm 11: Jarvis-Judice-Ninke
                         if (algorithm == 11) return jarvisApprox(coord, uv);
 
                         // Algorithm 12: Halftone Dot
                         if (algorithm == 12) return halftoneDot(coord, uv);
 
                         // Algorithm 13: Halftone Line
                         if (algorithm == 13) return halftoneLine(coord, uv);
 
                         // Algorithm 14: Crosshatch
                         if (algorithm == 14) return crosshatch(coord, uv);
 
                         // Default: no dithering
                         return 0.5;
                     }

                    // ============================================================
                    // CRT / POST-PROCESSING EFFECTS
                    // ============================================================

                    vec3 applyCRTEffect(vec3 color, vec2 uv, float strength) {
                        vec3 result = color;

                        // Chromatic Aberration
                        if (uChromatic > 0.0) {
                            float shift = uChromatic * 0.01;
                            result.r = texture2D(tDiffuse, uv + vec2(shift, 0.0)).r;
                            result.b = texture2D(tDiffuse, uv - vec2(shift, 0.0)).b;
                        }

                        // Scanlines
                        if (uScanlines > 0.0) {
                            float scanline = sin(uv.y * uResolution.y * 3.14159) * 0.5 + 0.5;
                            result *= 1.0 - uScanlines * (1.0 - scanline) * 0.3;
                        }

                        // Vignette
                        if (uVignette > 0.0) {
                            vec2 vignetteUv = uv * 2.0 - 1.0;
                            float vignette = 1.0 - dot(vignetteUv, vignetteUv) * uVignette * 0.5;
                            result *= vignette;
                        }

                        // Screen curvature
                        if (uCurvature > 0.0) {
                            vec2 curvedUv = uv * 2.0 - 1.0;
                            float mag = dot(curvedUv, curvedUv);
                            curvedUv *= 1.0 + mag * uCurvature * 0.1;
                            result *= 1.0 - mag * uCurvature * 0.05;
                        }

                        // Phosphor Trail
                        if (uPhosphor) {
                            vec3 prev = texture2D(tPrevious, uv).rgb;
                            result = mix(result, prev, 0.2);
                        }

                        // Bloom
                        if (uBloom > 0.0) {
                            result += max(vec3(0.0), result - 0.5) * uBloom;
                        }

                        return result;
                    }

                    vec3 applyPostProcessing(vec3 color, vec2 uv) {
                        vec3 result = color;

                        // Posterize
                        if (uPosterize > 0.0) {
                            float steps = mix(256.0, 4.0, uPosterize);
                            result = floor(result * steps + 0.5) / steps;
                        }

                        // Sharpen
                        if (uSharpen > 0.0) {
                            vec2 off = 1.0 / uResolution;
                            vec3 neighborhood = texture2D(tDiffuse, uv + vec2(0.0, off.y)).rgb +
                                               texture2D(tDiffuse, uv - vec2(0.0, off.y)).rgb +
                                               texture2D(tDiffuse, uv + vec2(off.x, 0.0)).rgb +
                                               texture2D(tDiffuse, uv - vec2(off.x, 0.0)).rgb;
                            result = mix(result, result * 5.0 - neighborhood, uSharpen * 0.5);
                        }

                        // VHS Jitter/Noise
                        if (uVhsEffect > 0.0) {
                            float jitter = hash(vec2(uTime, uv.y)) * 0.01 * uVhsEffect;
                            float noise = hash(uv + uTime) * 0.1 * uVhsEffect;
                            result += noise;
                            result.r = texture2D(tDiffuse, uv + vec2(jitter, 0.0)).r;
                        }

                        // Glitch
                        if (uGlitchIntensity > 0.0) {
                            float gTime = uTime * uGlitchSpeed;
                            float block = floor(uv.y * 10.0 + gTime);
                            if (hash(vec2(block, gTime)) > 1.0 - uGlitchIntensity * 0.3) {
                                result = texture2D(tDiffuse, uv + vec2(hash(vec2(block)) * 0.1, 0.0)).rgb;
                            }
                        }

                        // Edge Glow
                        if (uEdgeGlow > 0.0) {
                            vec2 off = 1.0 / uResolution;
                            float l = toGray(result);
                            float r = toGray(texture2D(tDiffuse, uv + vec2(off.x, 0.0)).rgb);
                            float d = toGray(texture2D(tDiffuse, uv + vec2(0.0, off.y)).rgb);
                            float edge = abs(l - r) + abs(l - d);
                            result += vec3(edge) * uEdgeGlow;
                        }

                        // Emboss
                        if (uEmboss > 0.0) {
                            vec2 off = 1.0 / uResolution;
                            vec3 c = texture2D(tDiffuse, uv).rgb;
                            vec3 ne = texture2D(tDiffuse, uv + vec2(off.x, off.y)).rgb;
                            vec3 sw = texture2D(tDiffuse, uv - vec2(off.x, off.y)).rgb;
                            float embossed = toGray(ne) - toGray(sw) + 0.5;
                            result = mix(result, vec3(embossed), uEmboss * 0.5);
                        }

                        // Film grain
                        if (uFilmGrain > 0.0) {
                            float grain = hash(uv * uTime * 100.0) * 2.0 - 1.0;
                            result += grain * uFilmGrain * 0.1;
                        }

                        // Noise
                        if (uNoise > 0.0) {
                            float noise = hash(uv + uTime) * 2.0 - 1.0;
                            result += noise * uNoise;
                        }

                        return result;
                    }

                    // ============================================================
                    // ASCII / SHAPE RENDERER (The CodePen Effect)
                    // ============================================================
                    vec3 renderAsciiShapes(vec2 vUv) {
                        // Adjust UVs for aspect ratio
                        float aspect = uResolution.x / uResolution.y;
                        vec2 pixelUV = vUv;
                        pixelUV.x *= aspect;
                        
                        float cellsCountY = uResolution.y / uAsciiCellSizeNew;
                        vec2 currentCellIndex = floor(pixelUV * cellsCountY);

                        float globalMinDist = 100.0; 
                        float maxPriority = -1.0;    
                        vec3 finalShapeColor = vec3(0.0);
                        
                        float aa = 2.0 / uAsciiCellSizeNew;

                        // 5x5 Neighbor Loop
                        for(float y = -2.0; y <= 2.0; y++) {
                            for(float x = -2.0; x <= 2.0; x++) {
                                
                                vec2 neighborIndex = currentCellIndex + vec2(x, y);
                                vec2 neighborCenterUV = (neighborIndex + 0.5) / cellsCountY;
                                neighborCenterUV.x /= aspect; 

                                if(neighborCenterUV.x < 0.0 || neighborCenterUV.x > 1.0 || neighborCenterUV.y < 0.0 || neighborCenterUV.y > 1.0) continue;

                                vec3 col = getAverageColor(neighborCenterUV, uAsciiCellSizeNew, uResolution);
                                
                                // Apply global contrast/brightness before luma calc (optional, but good for consistency)
                                col = (col - 0.5) * uContrast + 0.5 + uBrightness;
                                col = clamp(col, 0.0, 1.0);

                                if (uInvert || uAsciiInvertNew) col = 1.0 - col;

                                float fLuma = toGray(col);

                                // --- ASCII CHARACTERS (glyph atlas, chosen by luminance) ---
                                if (uAsciiShape == 31) {
                                    vec2 cc = (neighborIndex + 0.5) / cellsCountY;
                                    vec2 pc = (pixelUV - cc) * cellsCountY; // cell-local, [-0.5, 0.5]
                                    float dC = 1.0;
                                    if (pc.x > -0.5 && pc.x < 0.5 && pc.y > -0.5 && pc.y < 0.5) {
                                        vec2 luv = pc + 0.5; // 0..1 within the cell
                                        float cnt = max(uAsciiCharCount, 1.0);
                                        // brighter cell -> later glyph (charset is ordered dark -> light)
                                        float gi = floor(clamp(fLuma, 0.0, 1.0) * (cnt - 1.0) + 0.5);
                                        float u = (gi + luv.x) / cnt;
                                        float cov = texture2D(tAsciiChars, vec2(u, 1.0 - luv.y)).a;
                                        dC = 1.0 - cov;
                                    }
                                    globalMinDist = min(globalMinDist, dC);
                                    if (dC < aa && fLuma > maxPriority) {
                                        maxPriority = fLuma;
                                        finalShapeColor = uAsciiUseColor ? col : uAsciiFgColor;
                                    }
                                    continue;
                                }

                                // --- ALGORITHMS ---
                                float scaleX = uAsciiBaseScale;
                                float scaleY = uAsciiBaseScale;
                                float rot = 0.0;
                                vec2 offset = vec2(0.0);
                                
                                int mode = uAsciiModeNew;
                                float intensity = uAsciiIntensityNew;
                                float time = uTime;

                                if (mode == 0) { // Geometric Halftones (New)
    // --- HALFTONE / GEOMETRIC SHAPES LOOP ---
    // Instead of texture lookup, sample neighbors and draw procedural shapes
    // To support large shapes (spread > 1), we check neighbors further out.
    // Standard 3x3 check should cover moderate spread. 
    
    // Grid Setup
    // Use uAsciiCellSizeNew 
    float cellSize = max(4.0, uAsciiCellSizeNew);
    
    vec2 gridPos = floor(gl_FragCoord.xy / cellSize);
    vec2 cellCenterPixel = gridPos * cellSize + cellSize * 0.5;
    
    float minDist = 1.0; // Initialize with "outside" (d=1)
    
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighborGridPos = gridPos + vec2(float(x), float(y));
            vec2 neighborCenterCtx = neighborGridPos * cellSize + cellSize * 0.5;
            
            // Sample brightness at neighbor center
            vec2 sampleUV = neighborCenterCtx / uResolution;
            
            // Boundary check
            if (sampleUV.x < 0.0 || sampleUV.x > 1.0 || sampleUV.y < 0.0 || sampleUV.y > 1.0) continue;
            
            vec3 color = texture2D(tDiffuse, sampleUV).rgb;
            if (uAsciiInvertNew) color = 1.0 - color;
            float brightness = luma(color);
            
            // Calculate Shape Size based on brightness
            // Darker = Bigger shapes (if ink on paper metaphor)
            float shapeSizeNorm = 1.0 - brightness; 
            shapeSizeNorm = clamp(shapeSizeNorm * uAsciiIntensityNew * 1.5, 0.0, 1.0 + uHalftoneSpread); 
            
            // If size is 0, skip
            if (shapeSizeNorm <= 0.001) continue;
            
            // Vector from neighbor center to current pixel
            vec2 p = gl_FragCoord.xy - neighborCenterCtx;
            
            // Rotate p if needed
            if (uHalftoneRotation != 0.0) {
                 float rad = radians(uHalftoneRotation);
                 p = rotate(p, -rad); // Rotate space opposite to shape
            }
            
            float d = 1.0;
            float max_r = (cellSize * 0.5) * shapeSizeNorm; // Radius
            
            if (uHalftoneShape == 0) { // Circle
                d = sdCircle(p, max_r);
            } 
            else if (uHalftoneShape == 1) { // Square
                d = sdBox(p, vec2(max_r));
            }
            else if (uHalftoneShape == 2) { // Diamond
                 d = sdRhombus(p, vec2(max_r * 1.2)); 
            }
            else if (uHalftoneShape == 3) { // Triangle
                d = sdTriangle(p, max_r * 1.3);
            }
            else if (uHalftoneShape == 4) { // Line
                float thickness = (cellSize * shapeSizeNorm); 
                d = sdBox(p, vec2(cellSize * 1.5, thickness * 0.25)); 
            }
            
            minDist = min(minDist, d);
        }
    }
    
    // Render
    float aa = 1.0; 
    float shapeAlpha = 1.0 - smoothstep(-aa, 0.0, minDist); 
    
    // Coloring
    vec3 outColor;
    if (uAsciiUseColor) {
        vec3 pixelColor = texture2D(tDiffuse, vUv).rgb;
        if (uAsciiInvertNew) pixelColor = 1.0 - pixelColor;
        outColor = mix(uAsciiBgColor, pixelColor, shapeAlpha);
    } else {
        outColor = mix(uAsciiBgColor, uAsciiFgColor, shapeAlpha);
    }
    
    return outColor;

                                } else if (mode == 1) { scaleX = scaleY = fLuma * uAsciiBaseScale * 1.5; }
                                else if (mode == 2) { scaleX = scaleY = (1.0 - fLuma) * uAsciiBaseScale * 1.5; }
                                else if (mode == 3) { rot = fLuma * PI * intensity; }
                                else if (mode == 4) { scaleY = fLuma * uAsciiBaseScale * 3.0; scaleX = uAsciiBaseScale * 0.4; }
                                else if (mode == 5) { scaleX = fLuma * uAsciiBaseScale * 3.0; scaleY = uAsciiBaseScale * 0.4; }
                                else if (mode == 6) { if (mod(neighborIndex.x + neighborIndex.y, 2.0) < 0.5) scaleX = scaleY = fLuma * uAsciiBaseScale * 1.5; else scaleX = scaleY = (1.0 - fLuma) * uAsciiBaseScale * 1.5; }
                                else if (mode == 7) { offset.x = sin(time * 5.0 + neighborIndex.y * 0.5) * 0.2 * intensity; offset.y = cos(time * 3.0 + neighborIndex.x * 0.5) * 0.2 * intensity; }
                                else if (mode == 8) { offset.x = (fLuma - 0.5) * intensity; }
                                else if (mode == 9) { offset.y = fLuma * intensity; }
                                else if (mode == 10) { scaleX = scaleY = abs(fLuma - 0.5) * 2.0 * uAsciiBaseScale; }
                                else if (mode == 11) { float dist = length(neighborCenterUV - 0.5); scaleX = scaleY = (sin(dist * 20.0 - time * 5.0) * 0.5 + 0.5) * fLuma * uAsciiBaseScale * 2.0; }
                                else if (mode == 12) { float q = floor(fLuma * 4.0) / 4.0; scaleX = scaleY = q * uAsciiBaseScale * 1.5; }
                                else if (mode == 13) { float n = hash(neighborIndex); scaleX = scaleY = (fLuma + n * 0.5) * uAsciiBaseScale; }
                                else if (mode == 14) { rot = atan(neighborIndex.y, neighborIndex.x) * intensity + fLuma; scaleX = scaleY = fLuma * uAsciiBaseScale; }
                                else if (mode == 15) { if (fLuma < 0.5) scaleX = scaleY = 0.0; else scaleX = scaleY = uAsciiBaseScale; }
                                // New Modes from Canvas
                                else if (mode == 16) { // Flow Field
                                    vec3 cR = getAverageColor((neighborIndex + vec2(1.0, 0.0) + 0.5)/cellsCountY, uAsciiCellSizeNew, uResolution);
                                    vec3 cB = getAverageColor((neighborIndex + vec2(0.0, 1.0) + 0.5)/cellsCountY, uAsciiCellSizeNew, uResolution);
                                    float lR = toGray(cR); float lB = toGray(cB);
                                    float dx = lR - fLuma; float dy = lB - fLuma;
                                    rot = atan(dy, dx) * intensity;
                                    scaleX = scaleY = fLuma * uAsciiBaseScale * 1.2;
                                }
                                else if (mode == 17) { // Edge Detect
                                    vec3 cR = getAverageColor((neighborIndex + vec2(1.0, 0.0) + 0.5)/cellsCountY, uAsciiCellSizeNew, uResolution);
                                    float lR = toGray(cR);
                                    float diff = abs(fLuma - lR);
                                    scaleX = scaleY = diff * 5.0 * uAsciiBaseScale * intensity;
                                }
                                else if (mode == 18) { // Mosaic Jitter
                                    float jit = (hash(neighborIndex) - 0.5) * 2.0;
                                    if(fLuma > 0.5) { offset.x = jit * intensity; offset.y = jit * intensity; }
                                    scaleX = scaleY = fLuma * uAsciiBaseScale;
                                }
                                else if (mode == 19) { // Posterize
                                    float level = 0.2;
                                    if(fLuma > 0.3) level = 0.5;
                                    if(fLuma > 0.6) level = 0.8;
                                    if(fLuma > 0.8) level = 1.0;
                                    scaleX = scaleY = level * uAsciiBaseScale;
                                }
                                else if (mode == 20) { // Interference
                                    float pattern = sin((neighborIndex.x * neighborIndex.y) * 0.1 * intensity);
                                    scaleX = scaleY = (fLuma + pattern * 0.5) * 0.5 * uAsciiBaseScale * 1.5;
                                }
                                else if (mode == 21) { // CRT Scanline
                                    if(mod(neighborIndex.y, 2.0) == 0.0) {
                                        scaleX = uAsciiBaseScale * 1.2; scaleY = uAsciiBaseScale * 0.2; offset.x = 0.2 * intensity;
                                    } else {
                                        scaleX = fLuma * uAsciiBaseScale; scaleY = uAsciiBaseScale * 0.8;
                                    }
                                }
                                else if (mode == 22) { // Bio
                                    rot = sin(fLuma * PI * 2.0) + (hash(neighborIndex) * 0.5);
                                    scaleX = scaleY = (fLuma + 0.2) * uAsciiBaseScale;
                                }
                                else if (mode == 23) { // Eraser
                                    if(hash(neighborIndex) > fLuma * intensity) scaleX = scaleY = 0.0;
                                }

                                vec2 cellCenter = (neighborIndex + 0.5 + offset) / cellsCountY;
                                vec2 p = pixelUV - cellCenter;
                                if (rot != 0.0) p = rotate2d(rot) * p;
                                p *= cellsCountY; 

                                float gapFactor = 1.0 - (uAsciiGap / uAsciiCellSizeNew);
                                
                                if (scaleX < 0.001 || scaleY < 0.001) continue;

                                float effSize = 0.5 * gapFactor;
                                float d = 1.0;
                                int shape = uAsciiShape;

                                if (shape == 0) d = sdCircle(p, effSize * scaleX); 
                                else if (shape == 1) d = sdBox(p, vec2(effSize * scaleX, effSize * scaleY));
                                else if (shape == 2) d = sdTri(p, effSize * scaleX);
                                else if (shape == 3) d = sdDiamond(p, effSize * scaleX);
                                else if (shape == 4) d = sdHex(p, effSize * scaleX);
                                else if (shape == 5) d = sdBox(p, vec2(effSize * scaleX * 0.2, effSize * scaleY)); 
                                else if (shape == 6) d = sdBox(p, vec2(effSize * scaleX, effSize * scaleY * 0.2)); 
                                else if (shape == 7) d = sdBox(rotate2d(0.785)*p, vec2(effSize * scaleX * 0.2, effSize * scaleY * 1.5));
                                else if (shape == 8) d = sdBox(rotate2d(-0.785)*p, vec2(effSize * scaleX * 0.2, effSize * scaleY * 1.5));
                                else if (shape == 9) d = sdOctagon(p, effSize * scaleX);
                                else if (shape == 10) d = sdStar5(vec2(p.x, -p.y), effSize * scaleX, 0.5);
                                else if (shape == 11) d = sdHeart(rotate2d(PI)*p / (effSize * scaleX * 1.5));
                                else if (shape == 12) d = sdFlower(p, effSize * scaleX * 0.8);
                                else if (shape == 13) d = sdGear(p, effSize * scaleX * 0.8);
                                else if (shape == 14) d = sdRing(p, effSize * scaleX, effSize * scaleX * 0.2);
                                else if (shape == 15) d = max(sdBox(p, vec2(effSize*scaleX)), -sdBox(p, vec2(effSize*scaleX*0.8)));
                                else if (shape == 16) d = sdTrapezoid(p, effSize*scaleX*0.5, effSize*scaleX, effSize*scaleY);
                                else if (shape == 17) d = sdBox(rotate2d(0.785)*p, vec2(effSize*scaleX, effSize*scaleY));
                                else if (shape == 18) d = min(sdBox(p, vec2(effSize*scaleX*0.2, effSize*scaleY)), sdBox(p, vec2(effSize*scaleX, effSize*scaleY*0.2)));
                                else if (shape == 19) { vec2 pc = p; pc.y += effSize*scaleY*0.5; d = abs(sdTri(pc, effSize*scaleX)) - effSize*scaleX*0.2; }
                                else if (shape == 20) { float a = atan(p.y, p.x); float mouth = step(0.5, sin(a + uTime*10.0)); d = sdCircle(p, effSize * scaleX); if (p.x > 0.0 && abs(p.y) < p.x * 0.5) d = 1.0; }
                                // New Shapes
                                else if (shape == 21) d = sdCross(p, effSize*scaleX, effSize*scaleY*0.3);
                                else if (shape == 22) d = sdSemiCircle(rotate2d(PI)*p, effSize*scaleX);
                                else if (shape == 23) d = sdSemiCircle(p, effSize*scaleX);
                                else if (shape == 24) d = sdShuriken(p, effSize*scaleX);
                                else if (shape == 25) d = sdLightning(p, effSize*scaleX);
                                else if (shape == 26) d = sdGhost(p, effSize*scaleX);
                                else if (shape == 27) d = sdLeaf(p, effSize*scaleX);
                                else if (shape == 28) d = sdCloud(p, effSize*scaleX);
                                else if (shape == 29) d = sdRing(p, effSize*scaleX, effSize*scaleX * 0.5); // Concentric approx
                                else if (shape == 30) { // Custom SVG
                                    vec2 localUV = p * cellsCountY / (uAsciiBaseScale * scaleX) + 0.5;
                                    // Flip Y for texture sampling to match SVG coordinates
                                    localUV.y = 1.0 - localUV.y;
                                    
                                    if (localUV.x < 0.0 || localUV.x > 1.0 || localUV.y < 0.0 || localUV.y > 1.0) {
                                        d = 1.0; 
                                    } else {
                                        vec4 texColor = texture2D(tAsciiCustomShape, localUV);
                                        // Assume shape is black on transparent/white background or use alpha
                                        float shapeVal = (texColor.r + texColor.g + texColor.b) / 3.0;
                                        if (texColor.a < 0.1) shapeVal = 1.0; 
                                        else shapeVal = 1.0 - shapeVal; // Invert: Black(0) -> d=1 (background), White(1) -> d=0 (shape)? No.
                                        // SDF: d=0 is surface. d < 0 is inside. d > 0 is outside.
                                        // Standard dithering here uses d < aa to draw.
                                        // So we need d < small_value for the shape pixels.
                                        
                                        // If image is black shape on white bg:
                                        // Black (0) -> we want d=0. 
                                        // White (1) -> we want d=1.
                                        // So d = luminance.
                                        
                                        // If image is white shape on transparent bg:
                                        // Alpha 0 -> d=1.
                                        // Alpha 1, White (1) -> d=0.
                                        // so d = 1.0 - alpha.
                                        
                                        if (texColor.a > 0.5) {
                                           // Use luminance if opaque
                                            d = (texColor.r + texColor.g + texColor.b) / 3.0;
                                            // Ensure high contrast
                                            d = smoothstep(0.2, 0.8, d); 
                                        } else {
                                            d = 1.0;
                                        }
                                    }
                                }

                                globalMinDist = min(globalMinDist, d);

                                if (d < aa) {
                                    if (fLuma > maxPriority) {
                                        maxPriority = fLuma;
                                        finalShapeColor = (uAsciiUseColor) ? col : uAsciiFgColor;
                                    }
                                }
                            }
                        }

                        float mask = 1.0 - smoothstep(0.0, aa, globalMinDist);
                        vec3 result = mix(uAsciiBgColor, finalShapeColor, mask);
                        return result;
                    }

                    // ============================================================
                    // MAIN
                    // ============================================================

                    // Effect animation: displace the source UV over time so the dither /
                    // ASCII animates on ANY source. Loop-exact (sin/cos period 2pi in ft).
                    vec2 applyFx(vec2 uv) {
                        if (uFxAnimate < 0.5) return uv;
                        float ft = uTime * uFxSpeed;
                        if (uFxMotion == 1) {            // drift
                            uv += vec2(sin(ft), cos(ft)) * 0.02;
                        } else if (uFxMotion == 2) {     // zoom (breathing)
                            float z = 1.0 + 0.06 * sin(ft);
                            uv = (uv - 0.5) / z + 0.5;
                        } else if (uFxMotion == 3) {     // wobble
                            uv += vec2(sin(ft + uv.y * 12.0), sin(ft + uv.x * 12.0)) * 0.012;
                        }
                        return uv;
                    }

                    // Analog horizontal displacement: sync wobble + per-line tracking jitter
                    // + a head-switch noise tear near the bottom of the frame.
                    vec2 analogUV(vec2 uv) {
                        if (uAnalogWobble <= 0.0) return uv;
                        // ph completes an integer number of cycles over a loop export, so the
                        // smooth sync wobble tiles seamlessly. The high-freq jitter/tear are
                        // noise — a 1-frame seam in them is invisible — so they stay on raw time.
                        float ph = uTime * uAnalogRate;
                        uv.x += sin(uv.y * 8.0 + ph * 2.0) * 0.004 * uAnalogWobble;
                        uv.x += (hash(vec2(floor(uv.y * uResolution.y), floor(uTime * 24.0))) - 0.5) * 0.012 * uAnalogWobble;
                        float band = smoothstep(0.07, 0.0, uv.y); // bottom edge
                        uv.x += (hash(vec2(uv.y * 220.0, uTime)) - 0.5) * 0.09 * band * uAnalogWobble;
                        return uv;
                    }

                    // Post-dither analog: ghost echo, AC hum bar, TV static.
                    vec3 applyAnalog(vec3 color, vec2 uv) {
                        vec3 r = color;
                        float ph = uTime * uAnalogRate; // loop-locked phase for the smooth hum bar
                        if (uAnalogGhost > 0.0) {
                            vec3 g = texture2D(tDiffuse, uv - vec2(0.018, 0.0)).rgb;
                            r = mix(r, max(r, g * 0.85), uAnalogGhost * 0.6);
                        }
                        if (uAnalogHum > 0.0) {
                            float bar = sin(uv.y * 6.2831853 - ph * 2.0) * 0.5 + 0.5;
                            r *= 1.0 - uAnalogHum * 0.25 * bar;
                        }
                        if (uAnalogStatic > 0.0) {
                            float sn = hash(uv * uResolution * 0.5 + fract(uTime) * 137.0) - 0.5;
                            r += sn * uAnalogStatic * 0.6;
                        }
                        return r;
                    }

                    void main() {
                        // Before/after compare: show the raw source, no dithering.
                        if (uShowOriginal > 0.5) {
                            gl_FragColor = vec4(texture2D(tDiffuse, vUv).rgb, 1.0);
                            return;
                        }
                        // Algorithm 2: ASCII / Shape Renderer (Bypasses standard pipeline)
                        if (uAlgorithm == 2) {
                            vec3 asciiResult = renderAsciiShapes(analogUV(applyFx(vUv)));
                            // Apply CRT effects on top if desired (optional)
                            if (uCRTEffect > 0.0 || uScanlines > 0.0 || uPhosphor || uCurvature > 0.0 || uVignette > 0.0 || uChromatic > 0.0 || uBloom > 0.0) {
                                asciiResult = applyCRTEffect(asciiResult, vUv, uCRTEffect);
                            }
                            // Apply post-processing (grain, etc.)
                            asciiResult = applyPostProcessing(asciiResult, vUv);
                            asciiResult = applyAnalog(asciiResult, vUv);

                            gl_FragColor = vec4(asciiResult, 1.0);
                            return;
                        }

                        vec2 coord = gl_FragCoord.xy;
                        vec2 sampleUv = vUv;

                        // Apply scale - creates larger dither blocks/dots
                        // Both the dither pattern coordinates AND texture sampling are pixelated
                        if (uScale != 1.0) {
                            // Scale down coordinates for dither pattern
                            coord = floor(coord / uScale) * uScale;
                            
                            // Pixelate texture sampling to match
                            vec2 pixelSize = uScale / uResolution;
                            sampleUv = floor(vUv / pixelSize) * pixelSize + pixelSize * 0.5;
                        }

                        // Animated effects: pan / zoom / wobble the source under the dither
                        sampleUv = applyFx(sampleUv);
                        sampleUv = analogUV(sampleUv); // VHS wobble / tracking

                        // Sample input texture (using potentially pixelated coordinates)
                        vec3 color = texture2D(tDiffuse, sampleUv).rgb;

                        // Composite chroma bleed: smear R left / B right before dithering
                        if (uAnalogBleed > 0.0) {
                            float o = 0.004 * uAnalogBleed;
                            color.r = mix(color.r, texture2D(tDiffuse, sampleUv - vec2(o, 0.0)).r, uAnalogBleed * 0.7);
                            color.b = mix(color.b, texture2D(tDiffuse, sampleUv + vec2(o, 0.0)).b, uAnalogBleed * 0.7);
                        }

                        // Gamma correction (if enabled)
                        if (uGammaCorrect) {
                            color = srgbToLinear(color);
                        }

                         // Get dither threshold from selected algorithm
                         int activeAlgo = uAlgorithm;
                         if (uGridMode) {
                            if (vUv.x < 0.5 && vUv.y > 0.5) activeAlgo = uGridAlgorithms[0];
                            else if (vUv.x >= 0.5 && vUv.y > 0.5) activeAlgo = uGridAlgorithms[1];
                            else if (vUv.x < 0.5 && vUv.y <= 0.5) activeAlgo = uGridAlgorithms[2];
                            else activeAlgo = uGridAlgorithms[3];
                         }
                         float ditherPattern = getDitherThreshold(coord, activeAlgo);
                         if (uFxAnimate > 0.5 && uFxMotion == 4) ditherPattern = fract(ditherPattern + uTime * uFxSpeed / 6.2831853); // shimmer

                         // Adaptive Thresholding logic
                         if (uAdaptiveThreshold) {
                            float windowScale = float(uAdaptiveWindow);
                            float avgLuma = toGray(getAverageColor(vUv, windowScale, uResolution));
                            ditherPattern = mix(ditherPattern, avgLuma, 0.5);
                         }

                         // Pattern Randomization
                         if (uPatternRandomization > 0.0) {
                            ditherPattern = mix(ditherPattern, hash(coord + uTime), uPatternRandomization);
                         }

                         // Temporal Dithering
                         if (uTemporalDither) {
                            ditherPattern = fract(ditherPattern + uTime * uTemporalSpeed);
                         }

                        // Calculate number of levels from colors
                        float numLevels = float(uColors);
                        float levelScale = numLevels - 1.0;

                        // Banding Reduction (Dither before quantization)
                        if (uBandingReduction > 0.0) {
                           float bandNoise = (hash(coord + uTime) * 2.0 - 1.0) * (1.0 / levelScale) * uBandingReduction;
                           color += vec3(bandNoise);
                        }

                        // Motion Adaptive Calculation
                        float motionFactor = 1.0;
                        if (uMotionAdaptive) {
                           vec3 prevColor = texture2D(tPrevious, sampleUv).rgb;
                           float diff = distance(color, prevColor);
                           motionFactor = 1.0 - smoothstep(0.0, uMotionSensitivity, diff);
                        }

                        vec3 dithered;

                        if (uGrayscale) {
                            float gray = toGray(color);
                            gray = (gray - 0.5) * uContrast + 0.5 + uBrightness;
                            gray = clamp(gray, 0.0, 1.0);
                            
                            float scaled = gray * levelScale + ditherPattern * uDitherStrength;
                            float quantized = floor(scaled) / levelScale;
                            dithered = vec3(clamp(quantized, 0.0, 1.0));
                        } else {
                            vec3 workingColor = color;

                            if (uColorSpace == 1) {
                                workingColor = rgb2lab(color);
                            } else if (uColorSpace == 2) {
                                workingColor = rgb2oklab(color);
                            }

                            workingColor = (workingColor - 0.5) * uContrast + 0.5 + uBrightness;
                            
                            // Apply Hue & Saturation
                            if (uSaturation != 1.0 || uHueShift != 0.0) {
                               vec3 hsv = rgb2hsv(workingColor);
                               hsv.x = fract(hsv.x + uHueShift);
                               hsv.y *= uSaturation;
                               workingColor = hsv2rgb(hsv);
                            }

                            workingColor = clamp(workingColor, 0.0, 1.0);

                            dithered.r = floor(workingColor.r * levelScale + ditherPattern * uDitherStrength) / levelScale;
                            dithered.g = floor(workingColor.g * levelScale + ditherPattern * uDitherStrength) / levelScale;
                            dithered.b = floor(workingColor.b * levelScale + ditherPattern * uDitherStrength) / levelScale;

                            dithered = clamp(dithered, 0.0, 1.0);

                            if (uColorSpace == 1) {
                                dithered = lab2rgb(dithered);
                            } else if (uColorSpace == 2) {
                                dithered = oklab2rgb(dithered);
                            }
                        }

                        // Temporal coherence / Motion Adaptive
                        float blendVal = uTemporalWeight;
                        if (uMotionAdaptive) blendVal *= motionFactor;

                        if (blendVal > 0.01) {
                            vec3 previousColor = texture2D(tPrevious, vUv).rgb;
                            float prevLum = dot(previousColor, vec3(0.299, 0.587, 0.114));
                            if (prevLum > 0.01) {
                                dithered = mix(dithered, previousColor, blendVal);
                            }
                        }

                        // Invert
                        if (uInvert) {
                            dithered = 1.0 - dithered;
                        }

                        // Apply color modes
                        if (uColorMode == 1) {
                            float lum = dot(dithered, vec3(0.299, 0.587, 0.114));
                            dithered = vec3(lum) * uDuotoneLight;
                        } else if (uColorMode == 2) {
                            float lum = dot(dithered, vec3(0.299, 0.587, 0.114));
                            dithered = mix(uDuotoneDark, uDuotoneLight, lum);
                        } else if (uColorMode == 3) {
                            float lum = dot(dithered, vec3(0.299, 0.587, 0.114));
                            if (lum < 0.33) {
                                dithered = mix(uTritoneShadow, uTritoneMid, lum * 3.0);
                            } else if (lum < 0.67) {
                                dithered = mix(uTritoneMid, uTritoneHighlight, (lum - 0.33) * 3.0);
                            } else {
                                dithered = uTritoneHighlight;
                            }
                        } else if (uColorMode == 4 && uPaletteSize > 0) {
                            float minDist = 999.0;
                            vec3 closestColor = dithered;
                            for (int i = 0; i < 16; i++) {
                                if (i >= uPaletteSize) break;
                                float dist = colorDistance(dithered, uPaletteColors[i]);
                                if (dist < minDist) {
                                    minDist = dist;
                                    closestColor = uPaletteColors[i];
                                }
                            }
                            dithered = closestColor;
                        }

                        // Dither strength blending
                        if (uDitherStrength < 1.0) {
                            vec3 original = texture2D(tDiffuse, vUv).rgb;
                            if (uGammaCorrect) {
                                original = srgbToLinear(original);
                            }
                            dithered = mix(original, dithered, uDitherStrength);
                        }

                        // Gamma correction output
                        if (uGammaCorrect) {
                            dithered = linearToSrgb(dithered);
                        }

                        // CRT effects
                        if (uCRTEffect > 0.0 || uScanlines > 0.0 || uPhosphor || uCurvature > 0.0 || uVignette > 0.0 || uChromatic > 0.0 || uBloom > 0.0) {
                            dithered = applyCRTEffect(dithered, vUv, uCRTEffect);
                        }

                        // Post-processing
                        dithered = applyPostProcessing(dithered, vUv);
                        dithered = applyAnalog(dithered, vUv);

                        // Comparison Mode
                        if (uComparison) {
                            float splitX = uComparisonPos * uResolution.x;
                            
                            // Show original (unprocessed) on the right side
                            if (gl_FragCoord.x > splitX) {
                                vec3 original = texture2D(tDiffuse, vUv).rgb;
                                dithered = original;
                            }
                            
                            // Draw separator line
                            if (abs(gl_FragCoord.x - splitX) < 1.0) {
                                dithered = vec3(1.0) - dithered;
                            }
                        }

                        if (uGridMode) {
                            // Draw grid lines
                            float gridAA = 1.0;
                            if (abs(vUv.x - 0.5) < gridAA/uResolution.x || abs(vUv.y - 0.5) < gridAA/uResolution.y) {
                                dithered = vec3(1.0) - dithered;
                            }
                        }

                        gl_FragColor = vec4(dithered, 1.0);
                    }
`;
