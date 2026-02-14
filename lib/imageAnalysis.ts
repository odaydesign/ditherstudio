// Image Analysis Module for Smart Presets
// Analyzes uploaded images and suggests optimal dithering settings

export interface ImageAnalysis {
  // Brightness metrics
  averageBrightness: number; // 0-1
  brightnessVariance: number;
  isDark: boolean;
  isBright: boolean;

  // Contrast metrics
  contrast: number; // 0-1
  isHighContrast: boolean;
  isLowContrast: boolean;

  // Color metrics
  dominantColors: string[];
  colorfulness: number; // 0-1
  isColorful: boolean;
  isMonochromatic: boolean;
  saturation: number; // 0-1

  // Detail metrics
  detailLevel: number; // 0-1
  isHighDetail: boolean;
  hasSharpEdges: boolean;

  // Image classification
  imageType: 'photo' | 'illustration' | 'text' | 'gradient' | 'portrait' | 'landscape' | 'abstract';
  confidence: number;
}

export interface SuggestedSettings {
  algorithm: number;
  algorithmName: string;
  colors: number;
  colorMode: number;
  threshold: number;
  contrast: number;
  brightness: number;
  ditherStrength: number;
  serpentine: boolean;
  gammaCorrect: boolean;
  reason: string;
  confidence: number;
}

// Algorithm recommendations for different image types
const ALGORITHM_RECOMMENDATIONS = {
  'photo-high-detail': { id: 3, name: 'Floyd-Steinberg', reason: 'Best for preserving photo detail' },
  'photo-portrait': { id: 28, name: 'Halftone 45°', reason: 'Classic halftone look for portraits' },
  'photo-landscape': { id: 5, name: 'Ostromoukhov', reason: 'Smooth gradients for landscapes' },
  'illustration': { id: 4, name: 'Atkinson', reason: 'Clean lines for illustrations' },
  'text-lineart': { id: 1, name: 'Threshold', reason: 'Sharp edges for text and line art' },
  'gradient': { id: 22, name: 'Bayer 4x4', reason: 'Even distribution for gradients' },
  'low-contrast': { id: 2, name: 'Adaptive Threshold', reason: 'Enhances low contrast images' },
  'colorful': { id: 7, name: 'Jarvis', reason: 'Good color reproduction' },
  'abstract': { id: 32, name: 'Stipple', reason: 'Artistic effect for abstract images' },
  'default': { id: 3, name: 'Floyd-Steinberg', reason: 'Versatile general-purpose algorithm' }
};

export function analyzeImage(canvas: HTMLCanvasElement): ImageAnalysis {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Sample the image at a lower resolution for performance
  const sampleSize = Math.min(100, canvas.width, canvas.height);
  const scaleX = canvas.width / sampleSize;
  const scaleY = canvas.height / sampleSize;

  // Create a smaller canvas for sampling
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = sampleSize;
  sampleCanvas.height = sampleSize;
  const sampleCtx = sampleCanvas.getContext('2d')!;
  sampleCtx.drawImage(canvas, 0, 0, sampleSize, sampleSize);

  const imageData = sampleCtx.getImageData(0, 0, sampleSize, sampleSize);
  const pixels = imageData.data;

  // Calculate brightness metrics
  let totalBrightness = 0;
  const brightnessValues: number[] = [];

  // Calculate color metrics
  const colorCounts: Map<string, number> = new Map();
  let totalSaturation = 0;
  let totalRed = 0, totalGreen = 0, totalBlue = 0;

  // Edge detection for detail level
  const grayValues: number[][] = [];
  let edgeStrength = 0;

  for (let y = 0; y < sampleSize; y++) {
    grayValues[y] = [];
    for (let x = 0; x < sampleSize; x++) {
      const i = (y * sampleSize + x) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      // Calculate brightness (luminance)
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      totalBrightness += brightness;
      brightnessValues.push(brightness);
      grayValues[y][x] = brightness;

      // Track colors
      totalRed += r;
      totalGreen += g;
      totalBlue += b;

      // Calculate saturation
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      totalSaturation += sat;

      // Quantize color for counting
      const quantR = Math.floor(r / 32) * 32;
      const quantG = Math.floor(g / 32) * 32;
      const quantB = Math.floor(b / 32) * 32;
      const colorKey = `${quantR},${quantG},${quantB}`;
      colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
    }
  }

  // Sobel edge detection for detail level
  for (let y = 1; y < sampleSize - 1; y++) {
    for (let x = 1; x < sampleSize - 1; x++) {
      const gx =
        -grayValues[y-1][x-1] + grayValues[y-1][x+1] +
        -2*grayValues[y][x-1] + 2*grayValues[y][x+1] +
        -grayValues[y+1][x-1] + grayValues[y+1][x+1];

      const gy =
        -grayValues[y-1][x-1] - 2*grayValues[y-1][x] - grayValues[y-1][x+1] +
        grayValues[y+1][x-1] + 2*grayValues[y+1][x] + grayValues[y+1][x+1];

      edgeStrength += Math.sqrt(gx * gx + gy * gy);
    }
  }

  const pixelCount = sampleSize * sampleSize;
  const averageBrightness = totalBrightness / pixelCount;
  const averageSaturation = totalSaturation / pixelCount;

  // Calculate variance
  let varianceSum = 0;
  for (const b of brightnessValues) {
    varianceSum += Math.pow(b - averageBrightness, 2);
  }
  const brightnessVariance = varianceSum / pixelCount;

  // Contrast (based on variance and range)
  const minBrightness = Math.min(...brightnessValues);
  const maxBrightness = Math.max(...brightnessValues);
  const contrast = maxBrightness - minBrightness;

  // Colorfulness (based on saturation and color variance)
  const avgR = totalRed / pixelCount;
  const avgG = totalGreen / pixelCount;
  const avgB = totalBlue / pixelCount;
  const colorVariance = Math.sqrt(
    Math.pow(avgR - avgG, 2) + Math.pow(avgG - avgB, 2) + Math.pow(avgB - avgR, 2)
  ) / 255;
  const colorfulness = (averageSaturation + colorVariance) / 2;

  // Unique colors count
  const uniqueColors = colorCounts.size;
  const isMonochromatic = uniqueColors < 20 || averageSaturation < 0.1;

  // Detail level
  const maxEdgeStrength = (sampleSize - 2) * (sampleSize - 2) * 2; // max possible
  const detailLevel = Math.min(1, edgeStrength / maxEdgeStrength * 5);

  // Extract dominant colors
  const sortedColors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([color]) => {
      const [r, g, b] = color.split(',').map(Number);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    });

  // Classify image type
  let imageType: ImageAnalysis['imageType'] = 'photo';
  let confidence = 0.7;

  if (detailLevel < 0.1 && brightnessVariance < 0.05) {
    imageType = 'gradient';
    confidence = 0.85;
  } else if (detailLevel > 0.5 && isMonochromatic && contrast > 0.7) {
    imageType = 'text';
    confidence = 0.8;
  } else if (colorfulness > 0.6 && detailLevel > 0.3) {
    imageType = 'illustration';
    confidence = 0.75;
  } else if (detailLevel < 0.2 && colorfulness > 0.4) {
    imageType = 'abstract';
    confidence = 0.7;
  } else if (brightnessVariance > 0.1 && detailLevel > 0.3) {
    // Aspect ratio hint for landscape vs portrait
    if (canvas.width > canvas.height * 1.3) {
      imageType = 'landscape';
    } else if (canvas.height > canvas.width * 1.3) {
      imageType = 'portrait';
    } else {
      imageType = 'photo';
    }
    confidence = 0.7;
  }

  return {
    averageBrightness,
    brightnessVariance,
    isDark: averageBrightness < 0.3,
    isBright: averageBrightness > 0.7,

    contrast,
    isHighContrast: contrast > 0.7,
    isLowContrast: contrast < 0.3,

    dominantColors: sortedColors,
    colorfulness,
    isColorful: colorfulness > 0.4,
    isMonochromatic,
    saturation: averageSaturation,

    detailLevel,
    isHighDetail: detailLevel > 0.4,
    hasSharpEdges: detailLevel > 0.5,

    imageType,
    confidence
  };
}

export function suggestSettings(analysis: ImageAnalysis): SuggestedSettings {
  let algorithm = ALGORITHM_RECOMMENDATIONS.default;
  let colors = 4;
  let colorMode = 0; // normal
  let threshold = 0.5;
  let contrast = 1.0;
  let brightness = 0.0;
  let ditherStrength = 1.0;
  let serpentine = true;
  let gammaCorrect = true;

  // Select algorithm based on image type and characteristics
  if (analysis.imageType === 'text') {
    algorithm = ALGORITHM_RECOMMENDATIONS['text-lineart'];
    colors = 2;
    colorMode = 1; // grayscale
    serpentine = false;
    ditherStrength = 0.5;
  } else if (analysis.imageType === 'gradient') {
    algorithm = ALGORITHM_RECOMMENDATIONS.gradient;
    colors = 8;
    ditherStrength = 1.2;
  } else if (analysis.imageType === 'illustration') {
    algorithm = ALGORITHM_RECOMMENDATIONS.illustration;
    colors = analysis.isColorful ? 8 : 4;
    ditherStrength = 0.8;
  } else if (analysis.imageType === 'portrait') {
    algorithm = ALGORITHM_RECOMMENDATIONS['photo-portrait'];
    colors = 4;
    if (analysis.isMonochromatic) {
      colorMode = 1;
      colors = 4;
    }
  } else if (analysis.imageType === 'landscape') {
    algorithm = ALGORITHM_RECOMMENDATIONS['photo-landscape'];
    colors = analysis.isColorful ? 8 : 4;
  } else if (analysis.imageType === 'abstract') {
    algorithm = ALGORITHM_RECOMMENDATIONS.abstract;
    colors = 6;
    ditherStrength = 0.9;
  } else {
    // Default photo handling
    if (analysis.isHighDetail) {
      algorithm = ALGORITHM_RECOMMENDATIONS['photo-high-detail'];
    } else if (analysis.isLowContrast) {
      algorithm = ALGORITHM_RECOMMENDATIONS['low-contrast'];
    } else if (analysis.isColorful) {
      algorithm = ALGORITHM_RECOMMENDATIONS.colorful;
    }
    colors = analysis.isColorful ? 6 : 4;
  }

  // Adjust based on brightness
  if (analysis.isDark) {
    brightness = 0.1;
    threshold = 0.45;
  } else if (analysis.isBright) {
    brightness = -0.1;
    threshold = 0.55;
  }

  // Adjust contrast
  if (analysis.isLowContrast) {
    contrast = 1.3;
  } else if (analysis.isHighContrast) {
    contrast = 0.9;
  }

  // Monochromatic images work well in grayscale mode
  if (analysis.isMonochromatic && colorMode === 0) {
    colorMode = 1;
    colors = Math.min(colors, 4);
  }

  return {
    algorithm: algorithm.id,
    algorithmName: algorithm.name,
    colors,
    colorMode,
    threshold,
    contrast,
    brightness,
    ditherStrength,
    serpentine,
    gammaCorrect,
    reason: algorithm.reason,
    confidence: analysis.confidence
  };
}
