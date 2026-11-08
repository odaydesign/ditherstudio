# DitherStudio — Effects & Animation Research

_How far we can push the app, and whether/how to build in the effects from
[`shader-effects-inc/shaders`](https://github.com/shader-effects-inc/shaders)._

Date: 2026-11-07

---

## TL;DR (the decisions)

1. **The linked repo is MIT-licensed — so we can legally use it** (engine, components,
   bindings are MIT; only the shaders.com *platform* presets/editor are separate terms).
2. **But it's WebGPU / WGSL**, while DitherStudio is **WebGL / GLSL via Three.js**. There
   is no drop-in path. Two real options:
   - **A — Port effects (recommended):** translate individual WGSL `paint` bodies → GLSL
     into our generator/post-FX. The math is the valuable part and WGSL→GLSL is near-
     mechanical. No new dependency, fits our pipeline, MIT just needs attribution.
   - **B — Embed their engine as a "Shaders" source (optional, prototype):** run their
     WebGPU `createShader()` into an offscreen canvas and feed it to our dither pre-pass
     as a `CanvasTexture` (same trick as our Text source). Instant access to 200+ effects,
     at the cost of a WebGPU dependency + a per-frame canvas→texture bridge.
3. **The real unlock isn't the repo — it's architecture.** Everything currently lives in
   one 1829-line fragment shader. To add *lots* more effects, we need a **multi-pass
   post-processing stack** (EffectComposer is already in the repo's `waves` demo and ships
   with Three). That one change makes most of the roadmap below cheap.
4. **Highest-impact new capability: audio-reactivity** (Web Audio FFT → any parameter).
   We already animate everything via loop-exact math; wiring an audio signal in is a small
   change with a huge payoff.

---

## 1. The repo: `shader-effects-inc/shaders`

| | |
|---|---|
| What | "WebGPU components for React, Vue, Svelte, Solid, JS & Framer" |
| Tech | **WebGPU + WGSL** (not WebGL/GLSL, not Three.js) |
| Scale | 200+ composable effects (gradients, noise, glass, metal, light, distortions, transitions, blurs, cursor); nest / blend / mask; ~5.9k★ |
| API | `createShader(el, { components: [...] })` (vanilla JS); `defineShader({ props, paint: wgsl\`…\` })` for custom |
| License | **MIT** for engine/components/bindings. Platform (editor, Pro presets, sections) separate. |

**Why the mismatch matters.** Their `paint` body returns `vec4f` per pixel from `uv`,
`aspect`, and typed props — conceptually *identical* to our GLSL fragment shaders. Example
(their `Halo`):

```wgsl
let d = length((uv - center) * vec2f(aspect, 1.0)) / radius;
return vec4f(color.rgb, 1.0 - smoothstep(0.8, 1.0, d));
```

In our GLSL that's almost a transliteration (`vec4f`→`vec4`, `vec2f`→`vec2`; `length`,
`smoothstep` identical). **So porting a chosen effect is an afternoon, not a rewrite.**

### Integration options

**A. Port effects to GLSL (recommended, primary).**
- Pick ~15–30 of their best effects (noise fields, distortions, glass/metal, transitions)
  and add them as new **generator patterns** (we have ~40; this is the exact slot) and new
  **post-FX passes**.
- Pros: zero runtime dependency; full control; fits WebGL2; works on every target today;
  deterministic for loop-exact export.
- Cons: manual per-effect work; must keep MIT attribution (add a `NOTICE`/header crediting
  the project).

**B. Embed their WebGPU engine as a new source (optional, behind a flag).**
- Mount `createShader()` into a hidden `<div>`; grab its canvas → `THREE.CanvasTexture` →
  our `generatorTarget` → dithered like any other source (identical to how `TextSource`
  works today).
- Pros: instant 200+ effects + their composition/blend/mask; low code.
- Cons: adds `shaders` + a **WebGPU runtime** alongside our WebGL renderer; per-frame
  canvas→texture upload cost; depends on `navigator.gpu` (fine in our Electron/Chromium
  40 build and modern browsers in 2026, but a web-fallback story is needed); their lib owns
  its own render loop (we'd drive/read it). Good as a power-user "Shaders" source, not the
  foundation.

**Verdict:** do **A** for the core library (own the effects, no deps), and optionally ship
**B** as an experimental "Shaders (WebGPU)" source for users who want the full catalog.

---

## 2. Where DitherStudio stands today (accurate baseline)

- **7 sources** feeding one dither pipeline: Upload, Generate, 3D, Waves, Glass, Layers, Text.
- **Generate** alone has **~40 procedural patterns** (gradients, plasma, voronoi, gyroid,
  raymarched corridor/mandelbulb, starfield, mazes, …).
- **16 dither algorithms** + palette/colour modes + ASCII/shape renderer.
- **In-shader post-FX already present:** CRT, scanlines, phosphor, curvature, vignette,
  chromatic aberration, bloom, grain/noise, **glitch**; **temporal feedback** (`tPrevious`)
  is wired.
- **Architecture:** sources render into a `WebGLRenderTarget` (`tDiffuse`) → **one
  1829-line GLSL fragment shader** does pixelation → algorithm → palette → colour → post-FX.
  **No multi-pass composer in the studio path.** (A standalone `app/waves` demo *does* use
  `EffectComposer` + `UnrealBloomPass`, so the pattern is already proven in-repo.)
- **Inputs:** webcam only. **No audio.** Export is offline/deterministic (loop-exact).
- Renderer: `THREE.WebGLRenderer` (WebGL2 context under Three r0.181).

**Takeaway:** we're already rich on *sources* and *dithering*, thin on *post-processing
composition*, *realtime inputs (audio)*, and *animation authoring*.

---

## 3. The ceiling — how far can we actually push?

- **WebGL2 (what we run):** no compute shaders. Particles, fluids, reaction-diffusion are
  all possible via **ping-pong float render targets** or **transform feedback** — bounded
  but very capable (fluid sims, 1M-point particles, Gray-Scott all shipped on WebGL2
  elsewhere). We use almost none of this yet.
- **The mega-shader is near its complexity ceiling.** Adding more branches to a 1829-line
  shader costs compile time, uniform slots, and GPU instruction limits. **Multi-pass is the
  path**, not a bigger shader.
- **Performance:** fullscreen fragment passes at 1080p are cheap; heavy raymarching/fbm at
  4K drops live FPS. Mitigation we already have: **export is offline & deterministic**, so
  exports can be far heavier than live preview, and live can run at reduced internal res.
- **WebGPU (the real frontier):** unlocks compute → large-scale fluids/particles/physics
  and is what the linked lib uses. Three.js ships `WebGPURenderer` + TSL now. A full
  migration is a large, separate project; **not required** for the roadmap below, but it's
  the honest answer to "how far can we go" — basically unlimited, at the cost of a renderer
  swap.
- **Reach:** Electron = Chromium → WebGPU + WebCodecs available; web (Firebase) in 2026 has
  broad WebGPU support, but needs a graceful fallback.

---

## 4. The unlock: a multi-pass post-FX stack

Introduce a small **post-processing chain** that runs *after* the dither shader (or around
it): either Three's `EffectComposer` (already a dependency, already used in `app/waves`) or
our own ping-pong of 2 float targets. Each effect becomes a **self-contained pass** with its
own tiny shader + uniforms, toggled/ordered by the user.

This single change turns most of the roadmap below from "edit the 1829-line monster" into
"add a ~40-line pass file" — the same modular win we just got from splitting sources.

---

## 5. Roadmap — a menu of what's possible

Grouped and prioritised. **P1 = high impact / low effort**, down to **P3 = big/ambitious**.

### Realtime inputs & animation (authoring)
- **P1 — Audio reactivity.** Web Audio `AnalyserNode` (mic or file) → FFT bands/energy →
  drive *any* uniform (speed, glow, scale, palette). Headline feature; small code.
- **P1 — Parameter automation / LFOs.** Per-parameter modulators (sine/saw/perlin/random,
  tempo-synced) so anything can animate, not just source-specific motion.
- **P2 — Keyframe timeline** for exports (tween parameters over the loop).
- **P3 — MIDI / OSC** live-performance input; beat detection → triggers.

### Post-FX (needs §4 stack)
- **P1 — Feedback/trails, motion blur, echo** (ping-pong of previous frame; we already have
  `tPrevious`).
- **P1 — Kaleidoscope / mirror / polar warp**, lens/barrel distortion.
- **P2 — Pixel-sort / datamosh / databending**, RGB-split glitch suite (extend current glitch).
- **P2 — Proper bloom (UnrealBloom), god rays, halation, lens flare.**
- **P2 — LUT colour grading** (we already have a `lut-export`; add LUT *apply*), bleach
  bypass, duotone/tritone grades.
- **P2 — Displacement/warp** by a second texture or noise field (ports well from their lib).

### New sources (pre-pass)
- **P1 — Audio visualizer source** (bars/radial/waveform) — pairs with audio reactivity.
- **P2 — GPU particle field** (transform feedback / instanced points; flow-field, attractors).
- **P2 — Reaction-diffusion (Gray-Scott)** & **feedback/slit-scan** from webcam/any source.
- **P2 — Ported "Shaders" patterns** (noise, glass, metal, distortions from the MIT lib).
- **P3 — Stable-fluids sim**; **GLTF model import** for the 3D source; **SVG/logo** source.
- **P3 — "Shaders (WebGPU)" source** (option B) exposing their full 200+ catalog.

### Dithering & style
- **P2 — Blue-noise / void-and-cluster** ordered dithering (ship a blue-noise texture),
  dot-diffusion, Riemersma.
- **P2 — Edge-aware / per-region dithering**; weighted-Voronoi **stippling** (offline, for
  print/export).

---

## 6. Suggested first slice (if we proceed)

1. **Build the multi-pass stack** (§4) — the enabler. (~0.5–1 day)
2. **Audio reactivity** input + one **audio-visualizer source**. (P1, high wow)
3. **Port 6–10 effects** from the MIT lib into generator patterns + 2–3 post-FX passes
   (feedback/trails, kaleidoscope, displacement). Add `NOTICE` attribution. (Strategy A)
4. **Parameter LFOs** so every new effect animates and stays loop-exact for export.
5. *(Optional, timeboxed)* Prototype the **WebGPU "Shaders" source** (Strategy B) behind a
   flag to evaluate the full catalog.

---

## 7. Risks & constraints

- **Attribution:** porting MIT code requires keeping the copyright/permission notice — add a
  `NOTICE` / header crediting `shader-effects-inc/shaders` (MIT).
- **WebGPU option (B):** `navigator.gpu` availability + a WebGL fallback for the web target;
  per-frame canvas→texture cost; two GPU contexts coexisting.
- **Loop-exact export:** every new animated parameter must stay periodic in phase (our
  existing `sin(integer·phase)` discipline) or exports won't loop seamlessly.
- **Perf:** keep live preview at reduced internal resolution for heavy passes; lean on the
  offline export path for the expensive stuff.
- **Scope:** a WebGPU *renderer* migration is the only "unlimited" answer but is a separate,
  large project — not needed for §5.
