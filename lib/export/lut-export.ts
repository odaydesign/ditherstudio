import * as THREE from 'three';
import { saveAs } from 'file-saver';
import { fragmentShader } from '../three/shaders/fragmentShader';
import { vertexShader } from '../three/shaders/vertexShader';

const LUT_SIZE = 32;

/**
 * Generates a .cube LUT file from the current dither settings
 * Note: content-dependent effects (Dither patterns, Vignette, Scanlines, Grain)
 * cannot be baked into a LUT. This only captures Color Grading and Palette mapping.
 */
export async function exportLUT(
    settings: Record<string, any>,
    filename: string = 'dither-grade'
) {
    // 1. Create Identity Texture (N slices of NxN)
    // Layout: A straight strip of slices. Width = SIZE * SIZE, Height = SIZE.
    const width = LUT_SIZE * LUT_SIZE;
    const height = LUT_SIZE;
    const size = width * height * 4;
    const data = new Float32Array(size);

    for (let i = 0; i < size / 4; i++) {
        // 3D coordinates based on slice index
        // x, y within slice. z is slice index.
        // i goes from 0 to (32*32*32)-1

        // x in texture (0..1023)
        const texX = i % width;
        const texY = Math.floor(i / width);

        // Identify which slice (z) we are in
        const sliceIndex = Math.floor(texX / LUT_SIZE);

        // Coordinates within the slice (0..31)
        const sliceX = texX % LUT_SIZE;
        const sliceY = texY;

        // Normalize to 0..1 RGB
        const r = sliceX / (LUT_SIZE - 1);
        const g = sliceY / (LUT_SIZE - 1);
        const b = sliceIndex / (LUT_SIZE - 1);

        const stride = i * 4;
        data[stride] = r;
        data[stride + 1] = g;
        data[stride + 2] = b;
        data[stride + 3] = 1.0;
    }

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
    texture.needsUpdate = true;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;

    // 2. Setup Offscreen Renderer
    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // 3. Setup Shader Material with current settings
    const uniforms = {
        tDiffuse: { value: texture },
        uResolution: { value: new THREE.Vector2(width, height) },
        uTime: { value: 0 },

        // Core Settings
        uAlgorithm: { value: settings.currentAlgorithm },
        uParam1: { value: settings.param1 ?? 0 },
        uParam2: { value: settings.param2 ?? 0 },
        uParam3: { value: settings.param3 ?? 0 },
        uParam4: { value: settings.param4 ?? 0 },
        uThreshold: { value: settings.threshold },
        uContrast: { value: settings.contrast },
        uBrightness: { value: settings.brightness },
        uColors: { value: settings.colors },
        uColorMode: { value: settings.colorMode },

        // Colors
        uPaletteColors: { value: (settings.customPalette || []).map((c: string) => new THREE.Color(c)) },
        uPaletteSize: { value: (settings.customPalette || []).length },
        uDuotoneDark: { value: new THREE.Color(settings.duotoneDark || '#000000') },
        uDuotoneLight: { value: new THREE.Color(settings.duotoneLight || '#ffffff') },

        // Disable Spatial Effects for LUT
        uDitherStrength: { value: 0.0 }, // CRITICAL: LUTs cannot dither spatial patterns
        uPatternRandomization: { value: 0.0 },
        uScanlines: { value: 0.0 },
        uVignette: { value: 0.0 },
        uFilmGrain: { value: 0.0 },
        uGlitchIntensity: { value: 0.0 },
        uNoise: { value: 0.0 },
        uPixelation: { value: 0.0 },
        uCurvature: { value: 0.0 },
        uBloom: { value: 0.0 },
        uSharpen: { value: 0.0 },

        // Defaults for others
        uAlgorithm2: { value: 0 },
        uAlgo2Enabled: { value: false },
        uAlgo2BlendMode: { value: 0 },
        uAlgo2BlendAmount: { value: 0 },
        uTemporalWeight: { value: 0 },
        uInvert: { value: false },
        uGrayscale: { value: false },
        uScale: { value: 1.0 },
        uMidtones: { value: 0 },
        uHighlights: { value: 0 },
        uLumThreshold: { value: 0 },
        uBlur: { value: 0 },
        uTritoneShadow: { value: new THREE.Color('#000000') },
        uTritoneMid: { value: new THREE.Color('#888888') },
        uTritoneHighlight: { value: new THREE.Color('#ffffff') },
        uSerpentine: { value: false },
        uGammaCorrect: { value: true },
        uTemporalDither: { value: false },
        uTemporalSpeed: { value: 0 },
        uColorSpace: { value: 0 },
        uAdaptiveThreshold: { value: false },
        uAdaptiveWindow: { value: 0 },
        uEdgePreservation: { value: 0 },
        uBandingReduction: { value: 0 },
        uPixelAspectRatio: { value: 1.0 },
        uCRTEffect: { value: 0 },
        uPhosphor: { value: false },
        uChromatic: { value: 0 },
        uFrameBlending: { value: false },
        uFrameBlendStrength: { value: 0 },
        uMotionAdaptive: { value: false },
        uMotionSensitivity: { value: 0 },
        uTemporalStability: { value: 0 },
        uFilmGrainSize: { value: 1.0 },
        uGlitchSpeed: { value: 0 },
        uColorGradeEnabled: { value: settings.colorGradeEnabled || false },
        uColorGradeLift: { value: new THREE.Vector3(0.5, 0.5, 0.5) }, // Default mid
        uColorGradeGamma: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
        uColorGradeGain: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
        uPosterize: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // 4. Render
    renderer.render(scene, camera);

    // 5. Read Pixels
    const buffer = new Float32Array(width * height * 4);
    renderer.readRenderTargetPixels(
        renderer.getRenderTarget()!, // Read from default framebuffer
        0, 0, width, height,
        buffer
    );

    // Note: readRenderTargetPixels usually requires a WebGLRenderTarget if not reading from screen.
    // The renderer.render() draws to the canvas default buffer.
    // readPixels logic in Three.js for default framebuffer might need directly calling gl.readPixels
    // Let's use a RenderTarget to be safe and compatible with headless-ish contexts.

    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
        type: THREE.FloatType,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat
    });

    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);

    renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, buffer);

    // 6. Generate .cube file content
    let cubeContent = `#Created by Dither Studio
#LUT Size ${LUT_SIZE}
TITLE "${filename}"
LUT_3D_SIZE ${LUT_SIZE}
DOMAIN_MIN 0.0 0.0 0.0
DOMAIN_MAX 1.0 1.0 1.0
`;

    // Helper to get pixel index
    // The buffer is Width * Height (1024 * 32).
    // We need to iterate z, y, x (standard .cube order varies, usually z-slowest, y, x-fastest)
    // Standard Cube:
    // for z = 0 to N-1
    //   for y = 0 to N-1
    //     for x = 0 to N-1
    //       RGB

    // Our Texture Layout:
    // Strip of 32 blocks.
    // Block 0 (leftmost) is Z=0.
    // Inside Block: Y is vertical, X is horizontal.

    for (let z = 0; z < LUT_SIZE; z++) {
        for (let y = 0; y < LUT_SIZE; y++) {
            for (let x = 0; x < LUT_SIZE; x++) {
                // Find position in buffer
                // Buffer is 1024 width.
                // Left offset for this Z slice = z * 32
                const pixelX = (z * LUT_SIZE) + x;
                const pixelY = y;

                const idx = (pixelY * width + pixelX) * 4;

                const r = buffer[idx];
                const g = buffer[idx + 1];
                const b = buffer[idx + 2];

                cubeContent += `${r.toFixed(6)} ${g.toFixed(6)} ${b.toFixed(6)}\n`;
            }
        }
    }

    // 7. Download
    const blob = new Blob([cubeContent], { type: 'text/plain' });
    saveAs(blob, `${filename}.cube`);

    // Cleanup
    renderer.dispose();
    texture.dispose();
    renderTarget.dispose();
    material.dispose();
    geometry.dispose();
}
