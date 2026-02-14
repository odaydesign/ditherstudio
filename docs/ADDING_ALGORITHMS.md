# How to Add New Dithering Algorithms

This guide explains how to add new dithering algorithms to Dither Studio.

## Overview

Adding a new algorithm requires touching two files:
1.  **Registry**: `lib/three/algorithms.ts` - Defines the algorithm's metadata (name, ID, parameters).
2.  **Implementation**: `lib/three/shaders/fragmentShader.ts` - Contains the actual GLSL code.

The UI (`SimplifiedSettings.tsx`) is now dynamic and will *automatically* pick up any algorithm registered in step 1.

---

## Step 1: Register the Algorithm

Open `lib/three/algorithms.ts`.

1.  **Add a unique ID** to `algoMap` with a new integer value.
    ```typescript
    export const algoMap: Record<string, number> = {
      // ... existing
      'my-new-algo': 12, // Use the next available number
    };
    ```

2.  **Add the definition** to the `algorithms` array at the bottom of the file.
    ```typescript
    {
      id: 'my-new-algo',
      name: 'My New Algorithm',
      category: 'Error Diffusion', // Or 'Ordered', 'Artistic', 'Advanced Error Diffusion'
      shaderValue: 12, // Must match the number from algoMap
      description: 'Optional description for tooltips.',
      params: {
        // Optional parameters
        strength: {
          value: 1.0,
          min: 0.0,
          max: 1.0,
          step: 0.1,
          label: 'Strength',
          uniformIndex: 1, // Maps to uParam1 in shader
        },
      },
    },
    ```

---

## Step 2: Implement the Shader

Open `lib/three/shaders/fragmentShader.ts`.

1.  **Add your GLSL function** before the `main()` function.
    ```glsl
    // Algorithm 12: My New Algorithm
    float myNewAlgo(vec2 coord, vec2 uv) {
        // ... your dithering logic ...
        // Return 0.0 (black) or 1.0 (white), or varying levels for grayscale
        return result;
    }
    ```

2.  **Route the algorithm** in `getDitherThreshold()` or `main()`.
    *   Find the `if (uAlgorithm == ...)` block.
    *   Add your case:
        ```glsl
        // Algorithm 12: My New Algorithm
        if (uAlgorithm == 12) return myNewAlgo(coord, uv);
        ```

---

## Step 3: Verify

1.  Reload the application (or dev server).
2.  Open the "Algorithm" dropdown.
3.  Your new algorithm should appear automatically under its specified Category.

## Troubleshooting

-   **Algorithm not showing?** Check if you added it to the `algorithms` array in `algorithms.ts`.
-   **Black screen?** Check your GLSL code for syntax errors. The dev console usually logs shader compilation errors.
-   **Parameters not working?** Ensure `uniformIndex` (1-4) matches `uParamX` usage in your shader.
