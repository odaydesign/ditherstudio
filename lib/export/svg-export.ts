
/**
 * Export canvas data as SVG
 * Optimized for pixel art and dithered images by combining adjacent pixels
 */
export function generateSvg(
    canvas: HTMLCanvasElement,
    filename: string
): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Start SVG string
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">`;

    // Helper to convert RGBA to Hex
    const rgbToHex = (r: number, g: number, b: number, a: number) => {
        if (a === 0) return null; // Transparent
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    };

    // Iterate over pixels
    // Optimization: Combine horizontal runs of the same color
    for (let y = 0; y < height; y++) {
        let currentRunStart = 0;
        let currentColor: string | null = null;

        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            const hex = rgbToHex(r, g, b, a);

            if (hex !== currentColor) {
                // Run ended, flush previous run
                if (currentColor !== null) {
                    const runWidth = x - currentRunStart;
                    // Optimization: Don't draw white pixels if background is assumed white? 
                    // Better to be explicit for SVG.
                    // Or strictly transparency check.
                    svg += `<rect x="${currentRunStart}" y="${y}" width="${runWidth}" height="1" fill="${currentColor}" />`;
                }

                // Start new run
                currentRunStart = x;
                currentColor = hex;
            }
        }

        // Flush last run of the row
        if (currentColor !== null) {
            const runWidth = width - currentRunStart;
            svg += `<rect x="${currentRunStart}" y="${y}" width="${runWidth}" height="1" fill="${currentColor}" />`;
        }
    }

    svg += '</svg>';

    // Create Blob and download
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
