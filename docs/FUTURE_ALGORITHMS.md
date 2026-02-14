# Future Dithering Algorithms Research

This document outlines high-value dithering algorithms and techniques to enhance Dither Studio, categorized by their primary value proposition.

## 1. High-Fidelity & Quality (The "Pro" Choice)
These algorithms focus on preserving image detail and minimizing visual artifacts (like "worms" or specific patterns).

### **Blue Noise Dithering (Void-and-Cluster)**
-   **Value**: Produces the most pleasing, unstructured, "film-grain" like dither. Superior to white noise (random) and often better than Floyd-Steinberg for animation as it's more stable.
-   **How it works**: Uses a pre-computed "blue noise" texture as a threshold map.
-   **Implementation**: Medium. Requires loading a blue noise texture into the shader.
-   **Reference**: [Moments in Graphics: Blue Noise](http://momentsingraphics.de/BlueNoise.html)

### **Riemersma Dithering**
-   **Value**: An error diffusion algorithm that follows a **space-filling curve** (Hilbert curve) instead of a scanline (left-to-right).
-   **Benefit**: Eliminates the "checkerboard" and directional artifacts common in Floyd-Steinberg.
-   **Implementation**: High. Requires traversing the pixels in a complex order, which is hard to do efficiently in a parallel shader. Might need a Compute Shader or a multi-pass approach.

### **Ostromoukhov Diffusion**
-   **Value**: An improvement on Floyd-Steinberg where diffusion coefficients change based on input intensity.
-   **Benefit**: Breaks up distinct patterns in highlights and shadows.
-   **Implementation**: Medium. Logic similar to FS but with a lookup table for coefficients.

---

## 2. Retro & Stylized (The "Aesthetic" Choice)
These algorithms appeal to users looking for a specific vintage look (Macintosh, Gameboy, Newspaper).

### **Ordered Dithering Variants**
-   **Patterns**: Crosshatch, Lines, Circles, Diamonds.
-   **Value**: Mimics old print media and early computer displays.
-   **Implementation**: Low. Math-based threshold generation in the shader.
-   **Key Candidates**:
    -   **Halftone**: Simulates newspaper dots (rotated 45°).
    -   **Vertical/Horizontal Lines**: Like old CGA/EGA monitors.

### **False Floyd-Steinberg**
-   **Value**: A simplified version often used on early hardware. Produces more artifacts, which is desirable for "glitch art".
-   **Implementation**: Low.

---

## 3. Artistic & Experimental (The "Creative" Choice)
Algorithms that transform the image into something entirely new.

### **Reaction-Diffusion (Gray-Scott Model)**
-   **Value**: Creates organic, biological patterns (spots, stripes) that grow from the image.
-   **Implementation**: High. Requires multi-pass simulation (framebuffer feedback).
-   **Outcome**: Extremely unique, "living" texture.

### **Voronoi Stippling**
-   **Value**: Reconstructs the image using non-overlapping cellular zones.
-   **Implementation**: Medium/High. Can be approximated in a shader using a grid search.

### **Kuwahara Filter (Pre-process)**
-   **Value**: A "painterly" effect that flattens colors while preserving edges.
-   **Usage**: Great to run *before* dithering to create a stylized, illustration-like output.
-   **Implementation**: Medium.

---

## Recommended Roadmap

1.  **Phase 1: Ordered Patterns (Low Effort, High Visual Variety)**
    -   Add Halftone (Dot, Line) and Crosshatch.
    -   These are mathematically simple and look great on the web.

2.  **Phase 2: Blue Noise (High Quality Win)**
    -   Add a Blue Noise texture loader.
    -   Implementation is simple (texture lookup) but result is pro-tier.

3.  **Phase 3: Artistic Filters**
    -   Implement Kuwahara (Painterly) as an optional "Pre-filter".
    -   This adds a whole new dimension to existing dithers.
