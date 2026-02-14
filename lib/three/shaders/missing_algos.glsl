
                    // ============================================================
                    // MISSING SPECIAL PATTERNS (IMPLEMENTED)
                    // ============================================================

                    // Bayer 3x3
                    float bayer3(vec2 coord) {
                        // 3x3 Bayer Matrix
                        // 0 7 3
                        // 6 5 2
                        // 4 1 8
                        vec2 p = floor(mod(coord / uParam1, 3.0));
                        int x = int(p.x);
                        int y = int(p.y);
                        
                        float val = 0.0;
                        if (y == 0) {
                            if (x == 0) val = 0.0; else if (x == 1) val = 7.0; else val = 3.0;
                        } else if (y == 1) {
                            if (x == 0) val = 6.0; else if (x == 1) val = 5.0; else val = 2.0;
                        } else {
                            if (x == 0) val = 4.0; else if (x == 1) val = 1.0; else val = 8.0;
                        }
                        return val / 9.0;
                    }

                    // Dispersed Dot (using Blue Noise approximation)
                    float dispersedDot(vec2 coord) {
                        // Use improved blue noise with scaling
                        return blueNoiseImproved(coord * uParam1) * uParam2;
                    }

                    // Square 5x5 (Digital Halftone)
                    float square5x5(vec2 coord) {
                        vec2 p = floor(mod(coord / uParam1, 5.0));
                        // Center-weighted square pattern
                        vec2 center = vec2(2.0, 2.0);
                        float dist = max(abs(p.x - center.x), abs(p.y - center.y));
                        // 0 (center) to 2 (edge)
                        // Invert so center is high threshold?
                        // Standard halftone usually grows from center
                        return dist / 2.5; 
                    }

                    // Corner 4x4
                    float corner4x4(vec2 coord) {
                        vec2 p = floor(mod(coord / uParam1, 4.0));
                        // Gradient from top-left to bottom-right
                        return (p.x + p.y) / 7.0;
                    }

                    // Block Vertical 4x4
                    float blockVertical(vec2 coord) {
                        float p = floor(mod(coord.x / uParam1, 4.0));
                        return p / 4.0;
                    }

                    // Block Horizontal 4x4
                    float blockHorizontal(vec2 coord) {
                        float p = floor(mod(coord.y / uParam1, 4.0));
                        return p / 4.0;
                    }

                    // Hatch 2x2
                    float hatch2x2(vec2 coord) {
                        // Diagonal lines
                        // 0 1
                        // 1 0
                        vec2 p = floor(mod(coord / uParam1, 2.0));
                        return abs(p.x - p.y); 
                    }
                    
                    // Hatch 3x3
                    float hatch3x3(vec2 coord) {
                        vec2 p = floor(mod(coord / uParam1, 3.0));
                        return mod(p.x + p.y, 3.0) / 3.0;
                    }

                    // Hatch 4x4
                    float hatch4x4(vec2 coord) {
                        vec2 p = floor(mod(coord / uParam1, 4.0));
                        return mod(p.x + p.y, 4.0) / 4.0;
                    }

                    // Alternate 3x3 (Checkerboard)
                    float alternate3x3(vec2 coord) {
                        vec2 p = floor(mod(coord / uParam1, 3.0));
                        return mod(p.x + p.y, 2.0);
                    }

                    // Pattern 5x5 (Concentric)
                    float pattern5x5(vec2 coord) {
                         vec2 p = floor(mod(coord / uParam1, 5.0));
                         // Distance from center (Euclidean)
                         vec2 d = abs(p - 2.0);
                         return length(d) / 3.0;
                    }
