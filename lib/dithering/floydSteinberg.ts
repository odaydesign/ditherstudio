/**
 * Floyd-Steinberg Error Diffusion Dithering
 * CPU-accurate implementation for high-quality export
 * 
 * This is a true error diffusion implementation that processes pixels
 * sequentially, propagating quantization errors to neighboring pixels.
 */

export interface FloydSteinbergOptions {
    /** Number of output color levels (2 = black & white, 256 = full color per channel) */
    colorLevels: number;
    /** Use serpentine (alternating left-right) scanning to reduce directional artifacts */
    serpentine: boolean;
    /** Overall dither strength (0-1, where 1 is full diffusion) */
    diffusionStrength: number;
    /** Maximum error that can be diffused to prevent extreme artifacts (0-1) */
    errorClamping: number;
    /** Process in linear color space for perceptual accuracy */
    gammaCorrect: boolean;
    /** Color space for error calculation: 'rgb' | 'lab' | 'oklab' */
    colorSpace: 'rgb' | 'lab' | 'oklab';
    /** Reduce dithering on edges (0-1) */
    edgePreservation: number;
}

const DEFAULT_OPTIONS: FloydSteinbergOptions = {
    colorLevels: 2,
    serpentine: true,
    diffusionStrength: 1.0,
    errorClamping: 0.3,
    gammaCorrect: true,
    colorSpace: 'rgb',
    edgePreservation: 0.0,
};

/**
 * Floyd-Steinberg error diffusion weights
 * Classic distribution:
 *       X   7/16
 * 3/16 5/16 1/16
 */
const FS_WEIGHTS = {
    right: 7 / 16,
    bottomLeft: 3 / 16,
    bottom: 5 / 16,
    bottomRight: 1 / 16,
};

/**
 * Convert sRGB to linear color space
 */
function srgbToLinear(value: number): number {
    return value <= 0.04045
        ? value / 12.92
        : Math.pow((value + 0.055) / 1.055, 2.4);
}

/**
 * Convert linear to sRGB color space
 */
function linearToSrgb(value: number): number {
    return value <= 0.0031308
        ? value * 12.92
        : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
}

/**
 * Calculate luminance from RGB
 */
function getLuminance(r: number, g: number, b: number): number {
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Quantize a value to the nearest level
 */
function quantize(value: number, levels: number): number {
    const step = 1 / (levels - 1);
    return Math.round(value / step) * step;
}

/**
 * Clamp a value between 0 and 1
 */
function clamp(value: number, min = 0, max = 1): number {
    return Math.min(max, Math.max(min, value));
}

/**
 * Simple Sobel edge detection for edge preservation
 */
function detectEdge(
    pixels: Float32Array,
    width: number,
    x: number,
    y: number
): number {
    const getPixel = (px: number, py: number): number => {
        px = clamp(px, 0, width - 1);
        py = clamp(py, 0, width - 1);
        const idx = (py * width + px) * 4;
        return getLuminance(pixels[idx], pixels[idx + 1], pixels[idx + 2]);
    };

    // Simplified edge detection using gradient magnitude
    const left = getPixel(x - 1, y);
    const right = getPixel(x + 1, y);
    const top = getPixel(x, y - 1);
    const bottom = getPixel(x, y + 1);
    const center = getPixel(x, y);

    const gx = Math.abs(right - left);
    const gy = Math.abs(bottom - top);

    return Math.min(1, Math.sqrt(gx * gx + gy * gy) * 2);
}

/**
 * Process an image with Floyd-Steinberg error diffusion dithering
 * 
 * @param imageData - The source ImageData to process
 * @param options - Dithering options
 * @returns New ImageData with dithered result
 */
export function floydSteinbergDither(
    imageData: ImageData,
    options: Partial<FloydSteinbergOptions> = {}
): ImageData {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const { width, height } = imageData;

    // Create working buffer as Float32Array for precision
    const pixels = new Float32Array(width * height * 4);

    // Convert input to float and optionally linearize
    for (let i = 0; i < imageData.data.length; i += 4) {
        let r = imageData.data[i] / 255;
        let g = imageData.data[i + 1] / 255;
        let b = imageData.data[i + 2] / 255;

        if (opts.gammaCorrect) {
            r = srgbToLinear(r);
            g = srgbToLinear(g);
            b = srgbToLinear(b);
        }

        pixels[i] = r;
        pixels[i + 1] = g;
        pixels[i + 2] = b;
        pixels[i + 3] = imageData.data[i + 3] / 255;
    }

    // Create output buffer
    const output = new Uint8ClampedArray(width * height * 4);

    // Process each row
    for (let y = 0; y < height; y++) {
        // Determine scan direction (serpentine = alternating)
        const leftToRight = !opts.serpentine || y % 2 === 0;
        const xStart = leftToRight ? 0 : width - 1;
        const xEnd = leftToRight ? width : -1;
        const xStep = leftToRight ? 1 : -1;

        for (let x = xStart; x !== xEnd; x += xStep) {
            const idx = (y * width + x) * 4;

            // Get current pixel values
            let r = clamp(pixels[idx]);
            let g = clamp(pixels[idx + 1]);
            let b = clamp(pixels[idx + 2]);
            const a = pixels[idx + 3];

            // Calculate edge strength for edge preservation
            let edgeStrength = 0;
            if (opts.edgePreservation > 0) {
                edgeStrength = detectEdge(pixels, width, x, y) * opts.edgePreservation;
            }

            // Calculate diffusion multiplier (reduced on edges)
            const diffusionMult = opts.diffusionStrength * (1 - edgeStrength);

            // Quantize to target levels
            const quantR = quantize(r, opts.colorLevels);
            const quantG = quantize(g, opts.colorLevels);
            const quantB = quantize(b, opts.colorLevels);

            // Calculate quantization error
            let errorR = (r - quantR) * diffusionMult;
            let errorG = (g - quantG) * diffusionMult;
            let errorB = (b - quantB) * diffusionMult;

            // Clamp error to prevent extreme artifacts
            const maxError = opts.errorClamping;
            errorR = clamp(errorR, -maxError, maxError);
            errorG = clamp(errorG, -maxError, maxError);
            errorB = clamp(errorB, -maxError, maxError);

            // Store quantized output
            let outR = quantR;
            let outG = quantG;
            let outB = quantB;

            // Convert back to sRGB if needed
            if (opts.gammaCorrect) {
                outR = linearToSrgb(outR);
                outG = linearToSrgb(outG);
                outB = linearToSrgb(outB);
            }

            output[idx] = Math.round(outR * 255);
            output[idx + 1] = Math.round(outG * 255);
            output[idx + 2] = Math.round(outB * 255);
            output[idx + 3] = Math.round(a * 255);

            // Diffuse error to neighbors using Floyd-Steinberg weights
            // Adjust indices based on scan direction
            const rightX = x + xStep;
            const leftX = x - xStep;

            // Right neighbor (or left in reverse scan)
            if (rightX >= 0 && rightX < width) {
                const rightIdx = (y * width + rightX) * 4;
                pixels[rightIdx] += errorR * FS_WEIGHTS.right;
                pixels[rightIdx + 1] += errorG * FS_WEIGHTS.right;
                pixels[rightIdx + 2] += errorB * FS_WEIGHTS.right;
            }

            // Bottom-left neighbor (or bottom-right in reverse scan)
            if (y + 1 < height && leftX >= 0 && leftX < width) {
                const blIdx = ((y + 1) * width + leftX) * 4;
                pixels[blIdx] += errorR * FS_WEIGHTS.bottomLeft;
                pixels[blIdx + 1] += errorG * FS_WEIGHTS.bottomLeft;
                pixels[blIdx + 2] += errorB * FS_WEIGHTS.bottomLeft;
            }

            // Bottom neighbor
            if (y + 1 < height) {
                const bIdx = ((y + 1) * width + x) * 4;
                pixels[bIdx] += errorR * FS_WEIGHTS.bottom;
                pixels[bIdx + 1] += errorG * FS_WEIGHTS.bottom;
                pixels[bIdx + 2] += errorB * FS_WEIGHTS.bottom;
            }

            // Bottom-right neighbor (or bottom-left in reverse scan)
            if (y + 1 < height && rightX >= 0 && rightX < width) {
                const brIdx = ((y + 1) * width + rightX) * 4;
                pixels[brIdx] += errorR * FS_WEIGHTS.bottomRight;
                pixels[brIdx + 1] += errorG * FS_WEIGHTS.bottomRight;
                pixels[brIdx + 2] += errorB * FS_WEIGHTS.bottomRight;
            }
        }
    }

    return new ImageData(output, width, height);
}

/**
 * Apply Floyd-Steinberg dithering to a canvas
 */
export function ditherCanvas(
    canvas: HTMLCanvasElement,
    options: Partial<FloydSteinbergOptions> = {}
): HTMLCanvasElement {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const ditheredData = floydSteinbergDither(imageData, options);

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;

    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) throw new Error('Could not get output canvas context');

    outputCtx.putImageData(ditheredData, 0, 0);
    return outputCanvas;
}

/**
 * Apply Floyd-Steinberg dithering to an image file
 */
export async function ditherImage(
    file: File,
    options: Partial<FloydSteinbergOptions> = {}
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0);

            try {
                const ditheredCanvas = ditherCanvas(canvas, options);
                ditheredCanvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob'));
                    }
                }, 'image/png');
            } catch (err) {
                reject(err);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}
