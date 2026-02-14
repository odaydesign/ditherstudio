import { ASCII_CHAR_SETS, MATRIX_CHARS } from '@/lib/utils/ascii-texture';

export interface AsciiExportSettings {
    cellSize: number;
    charSet: number;
    customChars: string;
    invert: boolean;
    contrast: number;
    colorMode: number; // 0=Original, 1=Monochrome, 2=Tinted
    foreground: string;
    background: string;
}

/**
 * Convert pixel data to ASCII string (or HTML content for single frame)
 */
export const getAsciiFromImageData = (
    imageData: ImageData,
    settings: AsciiExportSettings,
    returnRawText: boolean = false
): string => {
    const { width, height, data } = imageData;
    const cols = Math.floor(width / settings.cellSize);
    const rows = Math.floor(height / settings.cellSize);

    // Determine character set string
    let chars = ASCII_CHAR_SETS[settings.charSet as keyof typeof ASCII_CHAR_SETS] || ASCII_CHAR_SETS[0];
    if (settings.charSet === 5) chars = MATRIX_CHARS;
    if (settings.charSet === 6) chars = settings.customChars || ' .:-=+*#%@';
    if (!chars) chars = ASCII_CHAR_SETS[0]; // Fallback

    const charCount = chars.length;
    let output = '';

    // Process image
    // We iterate by cell
    for (let y = 0; y < rows; y++) {
        if (!returnRawText) output += '<div class="row">';
        for (let x = 0; x < cols; x++) {
            // Calculate center of cell
            const cx = x * settings.cellSize + settings.cellSize / 2;
            const cy = y * settings.cellSize + settings.cellSize / 2;

            const px = Math.floor(cx);
            const py = Math.floor(cy);

            const i = (py * width + px) * 4;

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Calculate luminance
            let lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

            // Contrast - Shader implementation (asciiDither) samples raw texture and ignores contrast/brightness
            // So we skip applying contrast here to match the visual output if we are using the source image.
            // lum = (lum - 0.5) * settings.contrast + 0.5;
            lum = Math.max(0, Math.min(1, lum));

            // Invert
            if (settings.invert) lum = 1.0 - lum;

            // Map to char
            const charIndex = Math.floor(lum * (charCount - 0.01));
            const char = chars[Math.max(0, Math.min(charIndex, charCount - 1))];

            if (returnRawText) {
                output += char;
            } else {
                // Color handling for HTML mode
                let style = '';
                if (settings.colorMode === 0) {
                    // Original colors
                    style = `style="color: rgb(${r},${g},${b})"`;
                } else if (settings.colorMode === 2) {
                    // Tinted (simplified blending for HTML)
                    style = `style="color: rgb(${r},${g},${b})"`;
                }
                output += `<span ${style}>${char === ' ' ? '&nbsp;' : char}</span>`;
            }
        }
        if (returnRawText) {
            output += '\n';
        } else {
            output += '</div>\n';
        }
    }

    return output;
};

export const generateAsciiHtml = (
    canvas: HTMLCanvasElement,
    settings: AsciiExportSettings
): string => {
    const { width, height } = canvas;

    // Create a temporary canvas to read pixels (source is likely WebGL)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not get temp canvas context');

    // Draw the source canvas onto the temp canvas
    ctx.drawImage(canvas, 0, 0);

    const imageData = ctx.getImageData(0, 0, width, height);

    // Generate inner content
    const innerContent = getAsciiFromImageData(imageData, settings, false);

    let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>ASCII Art Export</title>
<style>
  body {
    background-color: ${settings.background};
    color: ${settings.foreground};
    font-family: monospace;
    font-size: ${settings.cellSize}px;
    line-height: ${settings.cellSize}px;
    white-space: pre;
    overflow: auto;
    margin: 0;
    padding: 20px;
  }
    .row { display: block; height: ${settings.cellSize}px; }
  span { display: inline-block; width: ${settings.cellSize}px; text-align: center; }
</style>
</head>
<body>
${innerContent}</body>
</html>`;

    return html;
};

export const downloadAsciiHtml = (html: string, filename: string = 'ascii-art.html') => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
