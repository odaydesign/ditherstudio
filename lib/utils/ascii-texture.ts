import * as THREE from 'three';

export const ASCII_CHAR_SETS = {
    0: ' .:-=+*#%@',          // Standard
    1: '░▒▓█',                // Blocks
    2: ' █',                  // Binary
    3: '·•●',                 // Dots
    4: '▁▂▃▄▅',               // Lines
    5: '┼START',              // Matrix (special case, might handle differently or use symbols)
    6: ''                     // Custom (handled by input)
};

// Matrix chars: ' ﾘｸﾑ' or similar katakana/symbols
export const MATRIX_CHARS = ' ｸﾑﾊﾘﾃﾂｾｷ';

/**
 * Generates a texture atlas containing the provided characters.
 * Returns a CanvasTexture that can be passed to a shader.
 * 
 * @param chars The string of characters to include in the atlas
 * @param fontSize Font size in pixels (default: 64 for high res)
 * @returns THREE.CanvasTexture
 */
export const generateAsciiTexture = (chars: string, fontSize: number = 64): THREE.CanvasTexture => {
    const numChars = chars.length;

    // We'll arrange characters in a horizontal strip for simplicity in the shader
    // Texture width = numChars * cellSize
    // Texture height = cellSize
    // Using a square aspect ratio for each character cell

    const cellWidth = Math.ceil(fontSize * 0.8); // Adjust aspect ratio as needed
    const cellHeight = fontSize;

    const canvas = document.createElement('canvas');
    canvas.width = cellWidth * numChars;
    canvas.height = cellHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get 2D context for ASCII texture generation');
    }

    // Clear background (transparent)
    ctx.fillStyle = '#000000'; // Fill with black for now, shader will use luminance or alpha
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set font properties
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff'; // White text

    // Draw each character
    for (let i = 0; i < numChars; i++) {
        const char = chars[i];
        const x = i * cellWidth + cellWidth / 2;
        const y = cellHeight / 2;
        ctx.fillText(char, x, y);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;

    return texture;
};
