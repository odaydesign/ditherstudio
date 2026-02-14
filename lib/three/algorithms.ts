/**
 * Dithering Algorithms Configuration
 * 
 * This file defines the available dithering algorithms and their parameters.
 */

export interface AlgorithmParameter {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  description?: string;
  type?: 'slider' | 'discrete' | 'discrete_labeled';
  options?: number[] | Array<{ value: number; label: string }>;
  uniformIndex?: 1 | 2 | 3 | 4; // Maps to uParam1, uParam2, uParam3, uParam4
}

export interface AlgorithmParams {
  [key: string]: AlgorithmParameter;
}

export interface Algorithm {
  id: string;
  name: string;
  category: string;
  shaderValue: number;
  description?: string;
  params?: AlgorithmParams;
}

/**
 * Map of algorithm IDs to their shader index values
 */
export const algoMap: Record<string, number> = {
  none: 0,
  'floyd-steinberg': 1,
  'ostromoukhov': 3,
  'atkinson': 4,
  'stucki': 5,
  'bayer': 6,
  'sierra-lite': 7,
  'sierra-2': 8,
  'sierra-3': 9,
  'burkes': 10,
  'jjn': 11,
  'halftone': 12,
  'halftone-line': 13,
  'crosshatch': 14,
};

/**
 * Algorithm parameters
 */
export const algorithmParams: Record<string, AlgorithmParams> = {
  none: {},
  'floyd-steinberg': {
    diffusionStrength: {
      value: 1.0,
      min: 0.0,
      max: 1.5,
      step: 0.01,
      label: 'Diffusion Strength',
      description: 'How strongly error diffuses to neighbors',
      uniformIndex: 1,
    },
    feedback: {
      value: 0.3,
      min: 0.0,
      max: 0.5,
      step: 0.01,
      label: 'Feedback',
      description: 'Simulates error accumulation (GPU only)',
      uniformIndex: 2,
    },
    errorClamping: {
      value: 0.3,
      min: 0.0,
      max: 0.5,
      step: 0.01,
      label: 'Error Clamping',
      description: 'Limits extreme error to reduce artifacts',
      uniformIndex: 3,
    },
  },
  'ascii-shapes': {}, // Params handled by dedicated UI section
};

/**
 * Full algorithm definitions with metadata
 */
export const algorithms: Algorithm[] = [
  {
    id: 'none',
    name: 'None (No Dithering)',
    category: 'Basic',
    shaderValue: 0,
    params: {}
  },
  {
    id: 'floyd-steinberg',
    name: 'Floyd-Steinberg',
    category: 'Error Diffusion',
    shaderValue: 1,
    description: 'Classic error diffusion algorithm that produces smooth, organic dithering by distributing quantization errors to neighboring pixels.',
    params: algorithmParams['floyd-steinberg'],
  },
  {
    id: 'ascii-shapes',
    name: 'ASCII / Shapes Pro',
    category: 'Artistic',
    shaderValue: 2,
    description: 'Advanced shape-based dithering with support for various geometric shapes, patterns, and dynamic effects.',
    params: {},
  },
  {
    id: 'ostromoukhov',
    name: 'Ostromoukhov Diffusion',
    category: 'Error Diffusion',
    shaderValue: 3,
    description: 'Variable-coefficient error diffusion that produces pleasing blue-noise patterns, reducing directional artifacts.',
    params: {
      diffusionStrength: {
        value: 1.0,
        min: 0.0,
        max: 1.5,
        step: 0.01,
        label: 'Diffusion Strength',
        description: 'Intensity of error distribution',
        uniformIndex: 1,
      },
      contrast: {
        value: 1.0,
        min: 0.0,
        max: 2.0,
        step: 0.05,
        label: 'Local Contrast',
        uniformIndex: 2
      }
    },
  },
  {
    id: 'atkinson',
    name: 'Atkinson Dithering',
    category: 'Error Diffusion',
    shaderValue: 4,
    description: 'Developed by Bill Atkinson for HyperCard. Distributes only 75% of error, resulting in high-contrast images with preserved detail.',
    params: {
      diffusionStrength: {
        value: 1.0,
        min: 0.0,
        max: 1.5,
        step: 0.01,
        label: 'Diffusion Strength',
        uniformIndex: 1,
      },
    },
  },
  {
    id: 'stucki',
    name: 'Stucki Dithering',
    category: 'Error Diffusion',
    shaderValue: 5,
    description: 'Clean, sharp error diffusion that improves on Jarvis-Judice-Ninke. Excellent detail preservation.',
    params: {
      diffusionStrength: {
        value: 1.0,
        min: 0.0,
        max: 1.5,
        step: 0.01,
        label: 'Diffusion Strength',
        uniformIndex: 1,
      },
    },
  },
  {
    id: 'bayer',
    name: 'Bayer (Ordered)',
    category: 'Ordered',
    shaderValue: 6,
    description: 'Classic ordered dithering using a fixed threshold matrix. Creates structured, crosshatch patterns.',
    params: {
      matrixSize: {
        value: 4,
        min: 2,
        max: 8,
        step: 2,
        label: 'Matrix Size',
        description: 'Size of the pattern (2x2, 4x4, 8x8)',
        options: [
          { value: 0, label: '2x2' },
          { value: 1, label: '4x4' },
          { value: 2, label: '8x8' }
        ],
        type: 'discrete_labeled',
        uniformIndex: 1,
      },
    },
  },
  {
    id: 'sierra-lite',
    name: 'Sierra Lite',
    category: 'Advanced Error Diffusion',
    shaderValue: 7,
    description: 'A simpler, faster variant of Sierra dithering. Less computation, but still good quality.',
    params: {
      diffusionStrength: {
        value: 1.0,
        min: 0.0,
        max: 1.5,
        step: 0.01,
        label: 'Diffusion Strength',
        uniformIndex: 1,
      },
    },
  },
  {
    id: 'sierra-2',
    name: 'Sierra 2-Row',
    category: 'Advanced Error Diffusion',
    shaderValue: 8,
    description: 'A balanced Sierra variant using a 2-row kernel. Good compromise between speed and quality.',
    params: {
      diffusionStrength: {
        value: 1.0,
        min: 0.0,
        max: 1.5,
        step: 0.01,
        label: 'Diffusion Strength',
        uniformIndex: 1,
      },
    },
  },
  {
    id: 'sierra-3',
    name: 'Sierra 3-Row',
    category: 'Advanced Error Diffusion',
    shaderValue: 9,
    description: 'The most complex Sierra variant. Very smooth gradients, similar to Jarvis-Judice-Ninke.',
    params: {
      diffusionStrength: {
        value: 1.0,
        min: 0.0,
        max: 1.5,
        step: 0.01,
        label: 'Diffusion Strength',
        uniformIndex: 1,
      },
    },
  },
  {
    id: 'burkes',
    name: 'Burkes Dithering',
    category: 'Advanced Error Diffusion',
    shaderValue: 10,
    description: 'Developed by Daniel Burkes. Minimizes texture artifacts while maintaining sharpness.',
    params: {
      diffusionStrength: {
        value: 1.0,
        min: 0.0,
        max: 1.5,
        step: 0.01,
        label: 'Diffusion Strength',
        uniformIndex: 1,
      },
    },
  },
  {
    id: 'jjn',
    name: 'Jarvis-Judice-Ninke',
    category: 'Advanced Error Diffusion',
    shaderValue: 11,
    description: 'An advanced error diffusion algorithm with a large kernel. Produces very sharp, high-contrast images.',
    params: {
      diffusionStrength: {
        value: 1.0,
        min: 0.0,
        max: 1.5,
        step: 0.01,
        label: 'Diffusion Strength',
        uniformIndex: 1,
      },
    },
  },
  {
    id: 'halftone',
    name: 'Halftone Dot',
    category: 'Ordered',
    shaderValue: 12,
    description: 'Simulates newspaper printing using a grid of dots. Best with higher "Scale" values.',
    params: {
      angle: {
        value: 45.0,
        min: 0.0,
        max: 90.0,
        step: 1.0,
        label: 'Angle',
        uniformIndex: 1,
      },
    },
  },
  {
    id: 'halftone-line',
    name: 'Halftone Line',
    category: 'Ordered',
    shaderValue: 13,
    description: 'Simulates woodcut or engraving textures using lines.',
    params: {
      angle: {
        value: 45.0,
        min: 0.0,
        max: 90.0,
        step: 1.0,
        label: 'Angle',
        uniformIndex: 1,
      },
    },
  },
  {
    id: 'crosshatch',
    name: 'Crosshatch',
    category: 'Ordered',
    shaderValue: 14,
    description: 'Uses overlapping diagonal lines to create shading.',
    params: {},
  },
];
