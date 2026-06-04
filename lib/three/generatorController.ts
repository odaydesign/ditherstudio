// Bridge between the export code (DitherStudio) and the live WebGL renderer
// (WebGLCanvas). Seamless looping needs deterministic, frame-accurate frames
// (not a recording of the live wall-clock animation), and high-quality exports
// need the canvas rendered at a higher resolution than the on-screen preview.
//
// So the exporter can: resize the renderer up to export resolution (beginExport),
// render a specific time value per frame (renderExportFrame) or the current frame
// (renderStillFrame), then restore the preview size (endExport). While `capturing`
// is true the live RAF loop pauses its own rendering.
export interface GeneratorExportBridge {
  capturing: boolean;
  /** Resize the renderer + targets to (w,h) for a high-res export. Pauses the live loop. */
  beginExport: ((w: number, h: number) => void) | null;
  /** Restore the preview size and resume the live loop. */
  endExport: (() => void) | null;
  /** Render one frame with generator + main time forced to `uTimeSeconds`. */
  renderExportFrame: ((uTimeSeconds: number) => void) | null;
  /** Render one frame at the current (live) time — for still-image export. */
  renderStillFrame: (() => void) | null;
}

export const generatorExport: GeneratorExportBridge = {
  capturing: false,
  beginExport: null,
  endExport: null,
  renderExportFrame: null,
  renderStillFrame: null,
};
