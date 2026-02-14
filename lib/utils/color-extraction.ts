
/**
 * Color extraction utilities using Median Cut algorithm
 */

interface RGB {
    r: number;
    g: number;
    b: number;
}

/**
 * Extract palette from an image URL using Median Cut
 */
export async function extractPaletteFromImage(
    imageUrl: string,
    colorCount: number
): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            // Resize for performance (max 100x100 is enough for palette)
            const MAX_SIZE = 100;
            let width = img.width;
            let height = img.height;
            if (width > MAX_SIZE || height > MAX_SIZE) {
                const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
                width = Math.floor(width * ratio);
                height = Math.floor(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            const imageData = ctx.getImageData(0, 0, width, height);
            const pixels = [];

            // Sample pixels
            for (let i = 0; i < imageData.data.length; i += 4) {
                const r = imageData.data[i];
                const g = imageData.data[i + 1];
                const b = imageData.data[i + 2];
                const a = imageData.data[i + 3];

                // Skip transparent or very dark pixels? 
                if (a > 128) {
                    pixels.push({ r, g, b });
                }
            }

            if (pixels.length === 0) {
                // Fallback to black/white
                resolve(['#000000', '#ffffff']);
                return;
            }

            const palette = medianCut(pixels, colorCount);
            const hexPalette = palette.map(p => rgbToHex(p.r, p.g, p.b));
            resolve(hexPalette);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
    });
}

/**
 * Median Cut Algorithm
 */
function medianCut(pixels: RGB[], count: number): RGB[] {
    if (count <= 0 || pixels.length === 0) return [];

    // If we have fewer pixels than requested colors, return all unique pixels
    if (pixels.length < count) {
        // Return averages? simplified: just return what we have
        return pixels;
    }

    const buckets = [pixels];

    while (buckets.length < count) {
        // Find bucket to split (e.g., the one with most pixels or largest volume)
        // Here we split the one with most pixels (simplest variant)
        // Or we could split the one with largest color range (better quality)

        // Let's use largest color range (Perceptual geometric volume)
        let bestBucketIndex = -1;
        let maxRange = -1;

        for (let i = 0; i < buckets.length; i++) {
            const range = getBucketRange(buckets[i]);
            if (range > maxRange) {
                maxRange = range;
                bestBucketIndex = i;
            }
        }

        if (bestBucketIndex === -1) break; // Should not happen if buckets not empty

        const bucketToSplit = buckets.splice(bestBucketIndex, 1)[0];
        const { bucket1, bucket2 } = splitBucket(bucketToSplit);

        if (bucket1.length > 0) buckets.push(bucket1);
        if (bucket2.length > 0) buckets.push(bucket2);
    }

    // Calculate average color for each bucket
    return buckets.map(calcAverageColor);
}

function getBucketRange(pixels: RGB[]): number {
    let minR = 255, maxR = 0;
    let minG = 255, maxG = 0;
    let minB = 255, maxB = 0;

    for (const p of pixels) {
        minR = Math.min(minR, p.r); maxR = Math.max(maxR, p.r);
        minG = Math.min(minG, p.g); maxG = Math.max(maxG, p.g);
        minB = Math.min(minB, p.b); maxB = Math.max(maxB, p.b);
    }

    const rRange = maxR - minR;
    const gRange = maxG - minG;
    const bRange = maxB - minB;

    return Math.max(rRange, gRange, bRange);
}

function splitBucket(pixels: RGB[]): { bucket1: RGB[], bucket2: RGB[] } {
    let minR = 255, maxR = 0;
    let minG = 255, maxG = 0;
    let minB = 255, maxB = 0;

    for (const p of pixels) {
        minR = Math.min(minR, p.r); maxR = Math.max(maxR, p.r);
        minG = Math.min(minG, p.g); maxG = Math.max(maxG, p.g);
        minB = Math.min(minB, p.b); maxB = Math.max(maxB, p.b);
    }

    const rRange = maxR - minR;
    const gRange = maxG - minG;
    const bRange = maxB - minB;
    const maxRange = Math.max(rRange, gRange, bRange);

    let sortChannel: 'r' | 'g' | 'b' = 'r';
    if (gRange === maxRange) sortChannel = 'g';
    if (bRange === maxRange) sortChannel = 'b';

    pixels.sort((a, b) => a[sortChannel] - b[sortChannel]);

    const mid = Math.floor(pixels.length / 2);
    return {
        bucket1: pixels.slice(0, mid),
        bucket2: pixels.slice(mid)
    };
}

function calcAverageColor(pixels: RGB[]): RGB {
    let r = 0, g = 0, b = 0;
    for (const p of pixels) {
        r += p.r;
        g += p.g;
        b += p.b;
    }
    const count = pixels.length;
    return {
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count)
    };
}

function rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
