import { DitherState } from '@/store/ditherStore';

export const generateSVG = (
    canvas: HTMLCanvasElement,
    state: DitherState
): string => {
    const { width, height } = canvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return '';

    // Get image data from the current canvas (which should have the source image)
    // Note: The WebGL canvas displays the result, but for SVG generation we might need
    // to sample the source image and re-apply the logic if we want "true" vector shapes
    // matching the shader.
    //
    // However, since the shader logic is complex (especially with dithering patterns),
    // duplicating it exactly in JS is hard.
    //
    // Strategy:
    // For Geometric Halftones (Mode 0), we can replicate the logic because it's
    // distinct shapes based on brightness.
    //
    // For other modes, we might just have to rasterize or use a very simple approximation.
    // The user specifically asked for "True vector export" for the geometric shapes.

    // Let's assume we have the source image drawn on a temp canvas or we access the
    // texture data. Since we don't have easy access to the source texture here, 
    // maybe we can pass the source image element or data?
    //
    // A common trick is to read the WebGL canvas pixels. But that gives us the *result*,
    // which is already pixels. We want to convert the *result* to vectors.
    //
    // IF the result is black/white pixels (dithered), we can trace it.
    // BUT the user wants "Geometric Halftones" which are Circles/Squares. 
    // If we just trace the pixels, we get jagged edges.
    //
    // To get perfect circles, we need to re-run the "Halftone Logic" in JS:
    // 1. Downscale/Grid the image (Cell Size)
    // 2. For each cell, calculate brightness.
    // 3. Output a <circle> or <rect> with size proportional to brightness.

    // So we need the SOURCE image data.
    // We can get this by asking the WebGL component to give us the source, 
    // or we can just read the canvas *before* the shader runs? No, that's hard.
    //
    // Best approach: Pass the original image data (or draw it to a temp canvas).
    //
    // For now, let's assume 'canvas' passed here IS the source image (or we pass a separate sourceCanvas).
    // The WebGLCanvas component has the source texture.

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const cellSize = Math.max(4, state.asciiCellSize);
    const cols = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);

    let svgContent = '';

    // Background
    if (!state.asciiInvert) { // If not inverted, BG is usually white/paper? 
        // Actually state.asciiBgColor
        svgContent += `<rect x="0" y="0" width="${width}" height="${height}" fill="${state.asciiBgColor}" />`;
    } else {
        svgContent += `<rect x="0" y="0" width="${width}" height="${height}" fill="${state.asciiBgColor}" />`;
    }

    const shape = state.halftoneShape; // 0=Circle, 1=Square, etc.
    const rotation = state.halftoneRotation;
    const spread = state.halftoneSpread;
    const intensity = state.asciiIntensity;
    const fgColor = state.asciiFgColor;

    // Helper to get brightness of a cell
    const getBrightness = (c: number, r: number) => {
        const x = c * cellSize + cellSize / 2;
        const y = r * cellSize + cellSize / 2;

        if (x >= width || y >= height) return 0;

        const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
        const rVal = data[idx];
        const gVal = data[idx + 1];
        const bVal = data[idx + 2];

        // Luma
        let lum = (rVal * 0.299 + gVal * 0.587 + bVal * 0.114) / 255;

        if (state.asciiInvert) lum = 1.0 - lum;

        return lum;
    };

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const lum = getBrightness(c, r);

            // Shape size logic from shader:
            // float shapeSizeNorm = 1.0 - brightness; // Darker = Bigger
            // shapeSizeNorm = clamp(shapeSizeNorm * uAsciiIntensityNew * 1.5, 0.0, 1.0 + uHalftoneSpread); 

            let sizeNorm = 1.0 - lum;
            sizeNorm = Math.min(Math.max(sizeNorm * intensity * 1.5, 0), 1.0 + spread);

            if (sizeNorm <= 0.01) continue;

            const cx = c * cellSize + cellSize / 2;
            const cy = r * cellSize + cellSize / 2;

            const size = (cellSize * 0.5) * sizeNorm; // Radius

            // Transform for rotation
            let transform = '';
            if (rotation !== 0) {
                transform = `transform="rotate(${rotation}, ${cx}, ${cy})"`;
            }

            if (shape === 0) { // Circle
                svgContent += `<circle cx="${cx}" cy="${cy}" r="${size}" fill="${fgColor}" ${transform} />`;
            }
            else if (shape === 1) { // Square
                // Rect centered
                const s = size * 2;
                svgContent += `<rect x="${cx - size}" y="${cy - size}" width="${s}" height="${s}" fill="${fgColor}" ${transform} />`;
            }
            else if (shape === 2) { // Diamond
                // Rotated square
                const s = size * 2.4; // 1.2 * 2
                // Add 45 to rotation
                transform = `transform="rotate(${rotation + 45}, ${cx}, ${cy})"`;
                svgContent += `<rect x="${cx - s / 2}" y="${cy - s / 2}" width="${s}" height="${s}" fill="${fgColor}" ${transform} />`;
            }
            else if (shape === 3) { // Triangle
                // Equilateral triangle
                // Height h = size * 2.6
                const r = size * 1.3;
                const h = r * Math.sqrt(3) * 1.5; // Rough approximation for visual match
                // Points: Top, BottomLeft, BottomRight
                // Centroid is complicated, let's just draw loosely centered
                const p1 = `${cx},${cy - r}`;
                const p2 = `${cx - r * 0.866},${cy + r * 0.5}`;
                const p3 = `${cx + r * 0.866},${cy + r * 0.5}`;
                svgContent += `<polygon points="${p1} ${p2} ${p3}" fill="${fgColor}" ${transform} />`;
            }
            else if (shape === 4) { // Line
                // Rectangle, width = full cell, height = variable?
                // Shader: d = sdBox(p, vec2(cellSize * 1.5, thickness * 0.25)); 
                // Thickness varies with brightness?
                // "float thickness = (cellSize * shapeSizeNorm);"
                const thickness = cellSize * sizeNorm;
                const w = cellSize * 1.5 * 2; // Long enough to cover diagonal
                const h = thickness * 0.5;

                svgContent += `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" fill="${fgColor}" ${transform} />`;
            }
        }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${svgContent}</svg>`;
};
