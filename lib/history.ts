import { create } from 'zustand';
import { useDitherStore } from '@/store/ditherStore';

/**
 * Lightweight undo/redo for the dither settings.
 *
 * We snapshot the serialisable *adjustment* state (dither / colour / FX / source
 * parameters) and group rapid changes (slider drags) into one history entry via a
 * short debounce. Source identity (which source is active, the loaded file/webcam)
 * and large/binary fields are excluded — undo/redo reverts tweaks, it doesn't
 * teleport between sources or restore uploaded images.
 */

// Fields kept out of history: source identity, persisted, and large/binary blobs.
const EXCLUDE = new Set<string>([
  'currentFile', 'isWebcam', 'isVideo',
  'isGenerative', 'is3D', 'isWaveField', 'isGlass', 'isLayers', 'isText',
  'savedColors',
  'glassBgImage', 'glassBgW', 'glassBgH',
  'generativeImageSrc', 'generativeImageW', 'generativeImageH',
]);

type Snap = Record<string, unknown>;

function snapshot(): Snap {
  const s = useDitherStore.getState() as unknown as Record<string, unknown>;
  const o: Snap = {};
  for (const k in s) {
    if (typeof s[k] === 'function') continue;
    if (EXCLUDE.has(k)) continue;
    o[k] = s[k];
  }
  return o;
}

function differs(a: Snap, b: Snap): boolean {
  for (const k in a) if (a[k] !== b[k]) return true;
  return false;
}

let past: Snap[] = [];
let future: Snap[] = [];
let last: Snap = {};
let restoring = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let inited = false;

const MAX = 100;

/** Reactive flags for the toolbar buttons. */
export const useHistoryMeta = create<{ canUndo: boolean; canRedo: boolean }>(() => ({
  canUndo: false,
  canRedo: false,
}));
const syncMeta = () => useHistoryMeta.setState({ canUndo: past.length > 0, canRedo: future.length > 0 });

export function initHistory() {
  if (inited) return;
  inited = true;
  last = snapshot();
  useDitherStore.subscribe(() => {
    if (restoring) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const cur = snapshot();
      if (!differs(cur, last)) return;
      past.push(last);
      if (past.length > MAX) past.shift();
      future = [];
      last = cur;
      syncMeta();
    }, 450);
  });
}

function apply(snap: Snap) {
  restoring = true;
  useDitherStore.setState(snap as Partial<ReturnType<typeof useDitherStore.getState>>);
  last = snap;
  restoring = false;
  syncMeta();
}

export function undo() {
  if (timer) { clearTimeout(timer); timer = null; }
  if (!past.length) return;
  future.push(snapshot());
  apply(past.pop()!);
}

export function redo() {
  if (timer) { clearTimeout(timer); timer = null; }
  if (!future.length) return;
  past.push(snapshot());
  apply(future.pop()!);
}
