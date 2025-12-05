# Complete List of Dithering Algorithms (62 total)

## Status: Testing and implementing one-by-one

### None
- **ID**: none
- **Shader Value**: 0
- **Status**: ✅ Working (no parameters needed)

### Error Diffusion (Classic) - 6 algorithms
1. **Floyd-Steinberg** - ID: floyd, Shader: 3
2. **Ostromoukhov** - ID: ostromoukhov, Shader: 51
3. **Atkinson** - ID: atkinson, Shader: 4
4. **Jarvis-Judice-Ninke** - ID: jarvis, Shader: 5
5. **Stucki** - ID: stucki, Shader: 6
6. **Burkes** - ID: burkes, Shader: 7

### Error Diffusion (Sierra Family) - 3 algorithms
7. **Sierra Full** - ID: sierra, Shader: 8
8. **Two-Row Sierra** - ID: sierra2, Shader: 10
9. **Sierra Lite** - ID: sierralite, Shader: 9

### Error Diffusion (Variants) - 3 algorithms
10. **False Floyd-Steinberg** - ID: falsefloyd, Shader: 40
11. **Horizontal Stripe** - ID: horizontalstripe, Shader: 41
12. **Vertical Stripe** - ID: verticalstripe, Shader: 42

### Ordered Dithering (Bayer Matrix) - 6 algorithms
13. **Bayer 2×2** - ID: bayer2, Shader: 1
14. **Bayer 3×3** - ID: bayer3, Shader: 43
15. **Bayer 4×4** - ID: bayer4, Shader: 22
16. **Bayer 8×8** - ID: bayer8, Shader: 23
17. **Bayer 16×16** - ID: bayer16, Shader: 24
18. **Pattern 4×4** - ID: pattern4x4, Shader: 39

### Ordered Dithering (Special Patterns) - 10 algorithms
19. **Dispersed Dot 3×3** - ID: disperseddot, Shader: 44
20. **Square 5×5** - ID: square5x5, Shader: 45
21. **Corner 4×4** - ID: corner4x4, Shader: 46
22. **Block Vertical 4×4** - ID: blockvertical, Shader: 47
23. **Block Horizontal 4×4** - ID: blockhorizontal, Shader: 48
24. **Hatch 2×2** - ID: hatch2x2, Shader: 49
25. **Hatch 3×3** - ID: hatch3x3, Shader: 50
26. **Hatch 4×4** - ID: hatch4x4, Shader: 51
27. **Alternate 3×3** - ID: alternate3x3, Shader: 52
28. **Pattern 5×5** - ID: pattern5x5, Shader: 53

### Halftone Screening (Print) - 6 algorithms
29. **Classic Halftone** - ID: halftone, Shader: 27
30. **Halftone 45°** - ID: halftone45, Shader: 28
31. **Ellipse Halftone** - ID: ellipse, Shader: 29
32. **Diamond Halftone** - ID: diamond, Shader: 17
33. **Dispersed Dots** - ID: dispersed, Shader: 25
34. **Clustered Dots** - ID: cluster, Shader: 26

### Artistic Patterns - 6 algorithms
35. **Dot Pattern** - ID: dots, Shader: 30
36. **Line Pattern** - ID: lines, Shader: 31
37. **Crosshatch** - ID: crosshatch, Shader: 32
38. **Stippling** - ID: stipple, Shader: 37
39. **Spiral** - ID: spiral, Shader: 33
40. **Voronoi** - ID: voronoi, Shader: 36

### Noise-Based - 4 algorithms
41. **Random Noise** - ID: random, Shader: 2
42. **Blue Noise** - ID: blue, Shader: 34
43. **Void-and-Cluster** - ID: voidcluster, Shader: 50
44. **Perlin Noise** - ID: perlin, Shader: 35

### Geometric Effects - 8 algorithms
45. **Checkers Small** - ID: checkerssmall, Shader: 12
46. **Checkers Medium** - ID: checkersmedium, Shader: 13
47. **Checkers Large** - ID: checkerslarge, Shader: 14
48. **Wave Pattern** - ID: wave, Shader: 18
49. **Radial Burst** - ID: radialburst, Shader: 15
50. **Vortex** - ID: vortex, Shader: 16
51. **Mosaic** - ID: mosaic, Shader: 21
52. **Gridlock** - ID: gridlock, Shader: 20

### Special - 2 algorithms
53. **Bit Tone** - ID: bittone, Shader: 11
54. **Fan Pattern** - ID: fan, Shader: 38

### Quality Enhancement - 3 algorithms
55. **Adaptive Threshold** - ID: adaptivethreshold, Shader: 55
56. **Anisotropic** - ID: anisotropic, Shader: 56
57. **Sobel Edge-Weighted** - ID: sobeledge, Shader: 57

### Advanced Error Diffusion - 1 algorithm
58. **Riemersma** - ID: riemersma, Shader: 58

### Print/Professional - 2 algorithms
59. **Halftone CMYK** - ID: halftonecmyk, Shader: 59
60. **Hexagonal Grid** - ID: hexagonal, Shader: 60

### Creative/Artistic - 6 algorithms
61. **Threshold Map** - ID: thresholdmap, Shader: 61
62. **Kuwahara Filter** - ID: kuwahara, Shader: 62
63. **Dither Displacement** - ID: displacement, Shader: 63
64. **Reaction-Diffusion** - ID: reactiondiffusion, Shader: 64
65. **Dither Morphology** - ID: morphology, Shader: 65
66. **Multi-Scale** - ID: multiscale, Shader: 66

## Testing Plan
1. Test "None" algorithm ✅
2. Start with Floyd-Steinberg, verify it works visually
3. Add appropriate parameters only after visual verification
4. Move to next algorithm
5. Repeat until all 62 are tested and configured
