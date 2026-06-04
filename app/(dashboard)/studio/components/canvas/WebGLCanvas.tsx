'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useDitherStore } from '@/store/ditherStore';
import { vertexShader } from '@/lib/three/shaders/vertexShader';
import { fragmentShader } from '@/lib/three/shaders/fragmentShader';
import { generatorShader } from '@/lib/three/shaders/generatorShader';
import { generatorExport } from '@/lib/three/generatorController';

// The fragment shader declares `uniform vec3 uPaletteColors[16]` — a fixed-size
// array. Three.js uploads all 16 slots and calls .toArray() on each element, so
// the uniform value must ALWAYS contain exactly 16 Colors. A shorter palette
// (e.g. autoTheme returns ≤8 colors) leaves trailing slots undefined and crashes
// render() with "Cannot read properties of undefined (reading 'toArray')". The
// shader only reads the first uPaletteSize entries, so padding the rest is safe.
const PALETTE_UNIFORM_SIZE = 16;

const toPaletteUniform = (palette: string[]): THREE.Color[] =>
  Array.from(
    { length: PALETTE_UNIFORM_SIZE },
    (_, i) => new THREE.Color(palette[i] ?? palette[palette.length - 1] ?? '#000000')
  );

// The generator shader declares `uniform vec3 uColors[8]`. We upload the stops as
// a flat Float32Array(24) so Three uses gl.uniform3fv directly (no per-element
// .toArray(), avoiding the same crash class as uPaletteColors). Colours are RAW
// sRGB (hex/255), NOT THREE.Color, so the generated gradient behaves exactly like
// dithering a real gradient image.
const GEN_COLOR_SLOTS = 8;

const hexToRgb01 = (hex: string): [number, number, number] => {
  const h = (hex || '').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(n)) return [0, 0, 0];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const buildGenColorsUniform = (colors: string[]): Float32Array => {
  const arr = new Float32Array(GEN_COLOR_SLOTS * 3);
  for (let i = 0; i < GEN_COLOR_SLOTS; i++) {
    const src = colors[i] ?? colors[colors.length - 1] ?? '#000000';
    const [r, g, b] = hexToRgb01(src);
    arr[i * 3] = r;
    arr[i * 3 + 1] = g;
    arr[i * 3 + 2] = b;
  }
  return arr;
};

const genColorCount = (colors: string[]): number =>
  Math.min(Math.max(colors.length, 2), GEN_COLOR_SLOTS);

export default function WebGLCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const renderTargetRef = useRef<THREE.WebGLRenderTarget | null>(null);
  const customShapeTexRef = useRef<THREE.Texture | null>(null);
  // Generative source (render-to-texture pre-pass)
  const generatorSceneRef = useRef<THREE.Scene | null>(null);
  const generatorMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const generatorMeshRef = useRef<THREE.Mesh | null>(null);
  const generatorTargetRef = useRef<THREE.WebGLRenderTarget | null>(null);
  const generatorDirtyRef = useRef(true);
  // Text / logo overlay (composited into the same canvas so it exports)
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const overlayMeshRef = useRef<THREE.Mesh | null>(null);
  const overlayLogoImgRef = useRef<HTMLImageElement | null>(null);
  const exportPrevSizeRef = useRef<{ w: number; h: number } | null>(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number | null>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [hasImage, setHasImage] = useState(false);
  const [resolution, setResolution] = useState({ width: 0, height: 0 });

  // Select specific values from store to avoid re-renders
  const currentFile = useDitherStore((state) => state.currentFile);
  const isVideo = useDitherStore((state) => state.isVideo);
  const ditherState = useDitherStore();

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      preserveDrawingBuffer: true, // For export
      antialias: false,
    });
    renderer.setSize(800, 600);
    rendererRef.current = renderer;

    const renderTarget = new THREE.WebGLRenderTarget(800, 600);
    renderTargetRef.current = renderTarget;

    return () => {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      scene.clear();
      renderer.dispose();
      renderTarget.dispose();
      generatorTargetRef.current?.dispose();
      generatorMaterialRef.current?.dispose();
      generatorMeshRef.current?.geometry.dispose();
    };
  }, []);

  // Load custom shape texture
  useEffect(() => {
    const textureUrl = useDitherStore.getState().customShapeTexture;
    if (textureUrl) {
      new THREE.TextureLoader().load(
        textureUrl,
        (tex) => {
          tex.minFilter = THREE.LinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.wrapS = THREE.ClampToEdgeWrapping;
          tex.wrapT = THREE.ClampToEdgeWrapping;

          customShapeTexRef.current = tex;

          if (materialRef.current) {
            materialRef.current.uniforms.tAsciiCustomShape.value = tex;
            materialRef.current.needsUpdate = true;
          }
        },
        undefined,
        (err) => {
          console.error("Error loading custom shape texture", err);
        }
      );
    } else {
      customShapeTexRef.current = null;
      if (materialRef.current) {
        materialRef.current.uniforms.tAsciiCustomShape.value = null;
      }
    }
  }, [ditherState.customShapeTexture]);

  // Create shader material
  const createMaterial = useCallback((texture: THREE.Texture, width: number, height: number) => {
    if (materialRef.current) {
      materialRef.current.dispose();
    }

    const state = useDitherStore.getState();

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        tDiffuse: { value: texture },
        tPrevious: { value: renderTargetRef.current?.texture || null },
        uAlgorithm: { value: state.currentAlgorithm },
        uAlgorithm2: { value: state.secondAlgorithm },
        uAlgo2Enabled: { value: state.multiAlgoEnabled },
        uAlgo2BlendMode: { value: state.algoBlendMode },
        uAlgo2BlendAmount: { value: state.algoBlendAmount },
        uThreshold: { value: state.threshold },
        uTemporalWeight: { value: state.temporalWeight },
        uContrast: { value: state.contrast },
        uBrightness: { value: state.brightness },
        uSaturation: { value: state.saturation },
        uHueShift: { value: state.hueShift },
        uColors: { value: state.colors },
        uInvert: { value: state.invert },
        uGrayscale: { value: state.grayscale },
        uResolution: { value: new THREE.Vector2(width, height) },
        uTime: { value: 0 },
        uParam1: { value: state.param1 },
        uParam2: { value: state.param2 },
        uParam3: { value: state.param3 },
        uParam4: { value: state.param4 },
        uScale: { value: state.scale },
        uMidtones: { value: state.midtones },
        uHighlights: { value: state.highlights },
        uLumThreshold: { value: state.lumThreshold },
        uBlur: { value: state.blur },
        uPointSize: { value: state.pointSize },
        uPixelation: { value: state.pixelation },
        uColorMode: { value: state.colorMode },
        uDuotoneDark: { value: new THREE.Color(state.duotoneDark) },
        uDuotoneLight: { value: new THREE.Color(state.duotoneLight) },
        uTritoneShadow: { value: new THREE.Color(state.tritoneShadow) },
        uTritoneMid: { value: new THREE.Color(state.tritoneMid) },
        uTritoneHighlight: { value: new THREE.Color(state.tritoneHighlight) },
        uPaletteColors: { value: toPaletteUniform(state.customPalette) },
        uPaletteSize: { value: Math.min(state.customPalette.length, PALETTE_UNIFORM_SIZE) },
        uSerpentine: { value: state.serpentine },
        uGammaCorrect: { value: state.gammaCorrect },
        uDitherStrength: { value: state.ditherStrength },
        uPatternRandomization: { value: state.patternRandomization },
        uTemporalDither: { value: state.temporalDither },
        uTemporalSpeed: { value: state.temporalSpeed },
        uColorSpace: { value: state.colorSpace },
        uAdaptiveThreshold: { value: state.adaptiveThreshold },
        uAdaptiveWindow: { value: state.adaptiveWindow },
        uEdgePreservation: { value: state.edgePreservation },
        uBandingReduction: { value: state.bandingReduction },
        uPixelAspectRatio: { value: state.pixelAspectRatio },
        uCRTEffect: { value: state.crtEffect },
        // CRT Display Effects
        uScanlines: { value: state.scanlines },
        uPhosphor: { value: state.phosphor },
        uCurvature: { value: state.curvature },
        uVignette: { value: state.vignette },
        uChromatic: { value: state.chromatic },
        uBloom: { value: state.bloom },
        // Video/Animation
        uFrameBlending: { value: state.frameBlending },
        uFrameBlendStrength: { value: state.frameBlendStrength },
        uMotionAdaptive: { value: state.motionAdaptive },
        uMotionSensitivity: { value: state.motionSensitivity },
        uTemporalStability: { value: state.temporalStability },
        // ASCII / Shape Effects
        uAsciiCellSizeNew: { value: state.asciiCellSize },
        uAsciiGap: { value: state.asciiGap },
        uAsciiBaseScale: { value: state.asciiBaseScale },
        uAsciiIntensityNew: { value: state.asciiIntensity },
        uAsciiModeNew: { value: state.asciiMode },
        uAsciiShape: { value: state.asciiShape },
        uAsciiBgColor: { value: new THREE.Color(state.asciiBgColor) },
        uAsciiFgColor: { value: new THREE.Color(state.asciiFgColor) },
        uAsciiUseColor: { value: state.asciiUseColor },
        uAsciiInvertNew: { value: state.asciiInvert },
        tAsciiCustomShape: { value: customShapeTexRef.current },

        // Geometric Halftones
        uHalftoneShape: { value: state.halftoneShape },
        uHalftoneRotation: { value: state.halftoneRotation },
        uHalftoneSpread: { value: state.halftoneSpread },

        // Post-Processing
        uVhsEffect: { value: state.vhsEffect },
        uEdgeGlow: { value: state.edgeGlow },
        uEmboss: { value: state.emboss },
        uSharpen: { value: state.sharpen },
        uPosterize: { value: state.posterize },
        uGlitchIntensity: { value: state.glitchIntensity },
        uGlitchSpeed: { value: state.glitchSpeed },

        // Comparison
        uComparison: { value: state.comparisonMode },
        uComparisonPos: { value: state.comparisonPosition },
        uGridMode: { value: state.gridMode },
        uGridAlgorithms: { value: state.gridAlgorithms },
      },
    });

    materialRef.current = material;
    return material;
  }, []);

  // Create the generator material (renders the abstract pattern into a target)
  const createGeneratorMaterial = useCallback(() => {
    if (generatorMaterialRef.current) {
      generatorMaterialRef.current.dispose();
    }
    const s = useDitherStore.getState();
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: generatorShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(s.outputWidth, s.outputHeight) },
        uSeed: { value: s.generativeSeed },
        uPattern: { value: s.generativePattern },
        uColors: { value: buildGenColorsUniform(s.generativeColors) },
        uColorCount: { value: genColorCount(s.generativeColors) },
        uAngle: { value: s.generativeAngle },
        uScale: { value: s.generativeScale },
        uWarp: { value: s.generativeWarp },
        uWarpFreq: { value: s.generativeWarpFreq },
        uGrain: { value: s.generativeGrain },
        uContrast: { value: s.generativeContrast },
        uBlend: { value: s.generativeBlend },
        uMotion: { value: s.generativeMotion },
        uSpeed: { value: s.generativeSpeed },
        uAnimate: { value: s.generativeAnimate ? 1 : 0 },
        uGridCols: { value: s.generativeGridCols },
        uGridRows: { value: s.generativeGridRows },
        uSteps: { value: s.generativeSteps },
        uBPM: { value: s.generativeBPM },
        uMirror: { value: s.generativeMirror },
        uKaleido: { value: s.generativeKaleido },
        uTileX: { value: s.generativeTileX },
        uTileY: { value: s.generativeTileY },
        uGenVignette: { value: s.generativeVignette },
        uBorder: { value: s.generativeBorder },
        uBorderColor: { value: new THREE.Vector3(...hexToRgb01(s.generativeBorderColor)) },
      },
    });
    generatorMaterialRef.current = material;
    return material;
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !materialRef.current) {
      return;
    }

    // While the exporter is driving deterministic frames, pause our own rendering
    // (keep the RAF alive so we resume cleanly once capture finishes).
    if (generatorExport.capturing) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    // Update time uniform
    materialRef.current.uniforms.uTime.value = performance.now() * 0.001;

    // Update video texture
    if (videoTextureRef.current && videoElementRef.current) {
      videoTextureRef.current.needsUpdate = true;
    }

    // Generative pre-pass: render the abstract pattern into the target, which the
    // main material samples as tDiffuse. Skipped when paused and nothing changed.
    const genState = useDitherStore.getState();
    if (
      genState.isGenerative &&
      generatorSceneRef.current &&
      generatorMaterialRef.current &&
      generatorTargetRef.current &&
      (genState.generativeAnimate || generatorDirtyRef.current)
    ) {
      generatorMaterialRef.current.uniforms.uTime.value = performance.now() * 0.001;
      generatorMaterialRef.current.uniforms.uAnimate.value = genState.generativeAnimate ? 1 : 0;
      rendererRef.current.setRenderTarget(generatorTargetRef.current);
      rendererRef.current.render(generatorSceneRef.current, cameraRef.current);
      rendererRef.current.setRenderTarget(null);
      generatorDirtyRef.current = false;
    }

    // Render scene
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    // Update FPS
    frameCountRef.current++;
    const now = performance.now();
    if (now - lastTimeRef.current >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
      useDitherStore.getState().setFps(fps);
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // Render ONE deterministic frame with time forced to `uTimeSeconds`. Used by the
  // exporter to produce seamless loops (frame i at phase 2π·i/N) at any FPS.
  const renderExportFrame = useCallback((uTimeSeconds: number) => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const cam = cameraRef.current;
    if (!renderer || !scene || !cam) return;

    const genMat = generatorMaterialRef.current;
    if (genMat && generatorSceneRef.current && generatorTargetRef.current) {
      genMat.uniforms.uTime.value = uTimeSeconds;
      genMat.uniforms.uAnimate.value = 1;
      renderer.setRenderTarget(generatorTargetRef.current);
      renderer.render(generatorSceneRef.current, cam);
      renderer.setRenderTarget(null);
    }
    if (materialRef.current) materialRef.current.uniforms.uTime.value = uTimeSeconds;
    renderer.render(scene, cam);
  }, []);

  const startAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animate();
  }, [animate]);

  // Initialize / resize the generative source (no uploaded file required)
  const initGenerative = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    const s = useDitherStore.getState();
    const w = s.outputWidth;
    const h = s.outputHeight;

    // Size renderer + render target to the chosen output resolution
    rendererRef.current.setSize(w, h);
    if (!generatorTargetRef.current) {
      generatorTargetRef.current = new THREE.WebGLRenderTarget(w, h, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
      });
    } else {
      generatorTargetRef.current.setSize(w, h);
    }

    // Generator scene = fullscreen quad with the generator material
    const genMaterial = createGeneratorMaterial();
    genMaterial.uniforms.uResolution.value = new THREE.Vector2(w, h);
    if (!generatorSceneRef.current) {
      generatorSceneRef.current = new THREE.Scene();
      const genMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), genMaterial);
      generatorMeshRef.current = genMesh;
      generatorSceneRef.current.add(genMesh);
    } else if (generatorMeshRef.current) {
      generatorMeshRef.current.material = genMaterial;
    }

    // Main material samples the generator target as tDiffuse
    const mainMaterial = createMaterial(generatorTargetRef.current.texture, w, h);
    const geometry = new THREE.PlaneGeometry(2, 2);
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      meshRef.current.geometry.dispose();
    }
    const mesh = new THREE.Mesh(geometry, mainMaterial);
    meshRef.current = mesh;
    sceneRef.current.add(mesh);

    setResolution({ width: w, height: h });
    setHasImage(true);
    generatorDirtyRef.current = true;
    startAnimation();
  }, [createGeneratorMaterial, createMaterial, startAnimation]);

  // Load image file
  const loadImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

        const texture = new THREE.Texture(img);
        texture.needsUpdate = true;
        textureRef.current = texture;

        setResolution({ width: img.width, height: img.height });

        // Update renderer size
        rendererRef.current.setSize(img.width, img.height);

        // Create material and mesh
        const material = createMaterial(texture, img.width, img.height);
        const geometry = new THREE.PlaneGeometry(2, 2);

        if (meshRef.current) {
          sceneRef.current.remove(meshRef.current);
          meshRef.current.geometry.dispose();
        }

        const mesh = new THREE.Mesh(geometry, material);
        meshRef.current = mesh;
        sceneRef.current.add(mesh);

        setHasImage(true);
        startAnimation();

        // Run autoTheme when a new image is loaded
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(img, 0, 0);
          useDitherStore.getState().autoTheme(tempCanvas);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [createMaterial, startAnimation]);

  // Handle Webcam
  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

        const width = video.videoWidth;
        const height = video.videoHeight;

        const texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;
        videoTextureRef.current = texture;
        videoElementRef.current = video;

        setResolution({ width, height });
        rendererRef.current.setSize(width, height);

        const material = createMaterial(texture, width, height);
        const geometry = new THREE.PlaneGeometry(2, 2);

        if (meshRef.current) {
          sceneRef.current.remove(meshRef.current);
          meshRef.current.geometry.dispose();
        }

        const mesh = new THREE.Mesh(geometry, material);
        meshRef.current = mesh;
        sceneRef.current.add(mesh);

        setHasImage(true);
        startAnimation();
      }
      return { stream, video };
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("Could not access webcam. Please check permissions.");
      return null;
    }
  }, [createMaterial, startAnimation]);

  // Effect to trigger webcam
  useEffect(() => {
    let currentStream: MediaStream | null = null;
    let video: HTMLVideoElement | null = null;

    if (ditherState.isWebcam) {
      startWebcam().then((res) => {
        if (res) {
          currentStream = res.stream;
          video = res.video;
        }
      });
    }

    return () => {
      // Cleanup when component unmounts or isWebcam becomes false
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      if (video) {
        video.pause();
        video.srcObject = null;
      }
    };
  }, [ditherState.isWebcam, startWebcam]);

  // Load video file
  const loadVideo = useCallback((file: File) => {
    // Create video element
    const video = document.createElement('video');
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = false;
    video.preload = 'auto';

    // These attributes help with mobile compatibility
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    // Create blob URL
    const videoUrl = URL.createObjectURL(file);
    let isLoaded = false;

    // Error handler
    video.onerror = () => {
      // Only log error if we haven't successfully loaded
      if (!isLoaded) {
        const error = video.error;
        console.warn('Video loading issue:', {
          file: file.name,
          type: file.type,
          size: file.size,
          errorCode: error?.code,
          errorMessage: error?.message
        });
      }
    };

    // Metadata loaded handler
    video.onloadedmetadata = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current) {
        console.warn('Scene not ready for video');
        return;
      }

      // Validate video dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn('Invalid video dimensions');
        return;
      }

      isLoaded = true;
      console.log('Video loaded:', video.videoWidth, 'x', video.videoHeight);

      // Clean up previous video texture
      if (videoTextureRef.current) {
        videoTextureRef.current.dispose();
      }
      if (videoElementRef.current) {
        videoElementRef.current.pause();
        if (videoElementRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(videoElementRef.current.src);
        }
      }

      // Create new video texture
      const videoTexture = new THREE.VideoTexture(video);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.format = THREE.RGBAFormat;
      videoTextureRef.current = videoTexture;
      videoElementRef.current = video;

      setResolution({ width: video.videoWidth, height: video.videoHeight });

      // Set video duration in store for export
      useDitherStore.getState().setVideoDuration(video.duration);

      // Update renderer size
      rendererRef.current.setSize(video.videoWidth, video.videoHeight);

      // Create material and mesh
      const material = createMaterial(videoTexture, video.videoWidth, video.videoHeight);
      const geometry = new THREE.PlaneGeometry(2, 2);

      if (meshRef.current) {
        sceneRef.current.remove(meshRef.current);
        meshRef.current.geometry.dispose();
      }

      const mesh = new THREE.Mesh(geometry, material);
      meshRef.current = mesh;
      sceneRef.current.add(mesh);

      setHasImage(true);

      // Start video playback
      video.play()
        .then(() => {
          startAnimation();
        })
        .catch((err) => {
          console.warn('Autoplay blocked, starting animation anyway:', err.message);
          startAnimation();
        });
    };

    // Set source and start loading
    video.src = videoUrl;
    video.load();
  }, [createMaterial, startAnimation]);

  // Handle file upload
  useEffect(() => {
    if (!currentFile) return;

    // Load the file
    if (isVideo) {
      loadVideo(currentFile);
    } else {
      loadImage(currentFile);
    }
  }, [currentFile, isVideo, loadImage, loadVideo]);

  // Enable / resize / tear down the generative source
  useEffect(() => {
    if (ditherState.isGenerative) {
      initGenerative();
    } else if (!useDitherStore.getState().currentFile) {
      // Left generative mode with no file loaded → stop the loop, show the prompt
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setHasImage(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ditherState.isGenerative, ditherState.outputWidth, ditherState.outputHeight, initGenerative]);

  // Live-update generator uniforms as generative settings change (independent of
  // the dither palette, which is driven by the main uniform-update effect below)
  useEffect(() => {
    const mat = generatorMaterialRef.current;
    if (!mat || !ditherState.isGenerative) return;
    mat.uniforms.uSeed.value = ditherState.generativeSeed;
    mat.uniforms.uPattern.value = ditherState.generativePattern;
    mat.uniforms.uColors.value = buildGenColorsUniform(ditherState.generativeColors);
    mat.uniforms.uColorCount.value = genColorCount(ditherState.generativeColors);
    mat.uniforms.uAngle.value = ditherState.generativeAngle;
    mat.uniforms.uScale.value = ditherState.generativeScale;
    mat.uniforms.uWarp.value = ditherState.generativeWarp;
    mat.uniforms.uWarpFreq.value = ditherState.generativeWarpFreq;
    mat.uniforms.uGrain.value = ditherState.generativeGrain;
    mat.uniforms.uContrast.value = ditherState.generativeContrast;
    mat.uniforms.uBlend.value = ditherState.generativeBlend;
    mat.uniforms.uMotion.value = ditherState.generativeMotion;
    mat.uniforms.uSpeed.value = ditherState.generativeSpeed;
    mat.uniforms.uAnimate.value = ditherState.generativeAnimate ? 1 : 0;
    mat.uniforms.uGridCols.value = ditherState.generativeGridCols;
    mat.uniforms.uGridRows.value = ditherState.generativeGridRows;
    mat.uniforms.uSteps.value = ditherState.generativeSteps;
    mat.uniforms.uBPM.value = ditherState.generativeBPM;
    mat.uniforms.uMirror.value = ditherState.generativeMirror;
    mat.uniforms.uKaleido.value = ditherState.generativeKaleido;
    mat.uniforms.uTileX.value = ditherState.generativeTileX;
    mat.uniforms.uTileY.value = ditherState.generativeTileY;
    mat.uniforms.uGenVignette.value = ditherState.generativeVignette;
    mat.uniforms.uBorder.value = ditherState.generativeBorder;
    mat.uniforms.uBorderColor.value = new THREE.Vector3(...hexToRgb01(ditherState.generativeBorderColor));
    generatorDirtyRef.current = true; // re-render even while paused
  }, [
    ditherState.isGenerative,
    ditherState.generativePattern,
    ditherState.generativeColors,
    ditherState.generativeAngle,
    ditherState.generativeScale,
    ditherState.generativeWarp,
    ditherState.generativeWarpFreq,
    ditherState.generativeGrain,
    ditherState.generativeContrast,
    ditherState.generativeBlend,
    ditherState.generativeMotion,
    ditherState.generativeSpeed,
    ditherState.generativeSeed,
    ditherState.generativeAnimate,
    ditherState.generativeGridCols,
    ditherState.generativeGridRows,
    ditherState.generativeSteps,
    ditherState.generativeBPM,
    ditherState.generativeMirror,
    ditherState.generativeKaleido,
    ditherState.generativeTileX,
    ditherState.generativeTileY,
    ditherState.generativeVignette,
    ditherState.generativeBorder,
    ditherState.generativeBorderColor,
  ]);

  // ---- Text / logo overlay (drawn on a 2D canvas -> CanvasTexture -> quad on top
  //      of the main scene, so it is captured by every export path) ----
  const drawOverlay = useCallback(() => {
    if (!overlayCanvasRef.current) overlayCanvasRef.current = document.createElement('canvas');
    const cnv = overlayCanvasRef.current;
    const renderer = rendererRef.current;
    const w = renderer ? renderer.domElement.width : 1920;
    const h = renderer ? renderer.domElement.height : 1080;
    if (cnv.width !== w || cnv.height !== h) { cnv.width = w; cnv.height = h; }
    const ctx = cnv.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    const s = useDitherStore.getState();
    if (s.overlayEnabled) {
      const cx = s.overlayX * w;
      let cy = s.overlayY * h;
      const img = overlayLogoImgRef.current;
      const textH = s.overlayText ? (s.overlaySize / 100) * h * 1.3 : 0;
      if (img && s.overlayLogo) {
        const lh = s.overlayLogoScale * h;
        const lw = lh * (img.width / Math.max(img.height, 1));
        const top = cy - (lh + textH) / 2;
        ctx.drawImage(img, cx - lw / 2, top, lw, lh);
        cy = top + lh + textH / 2;
      }
      if (s.overlayText) {
        const fs = (s.overlaySize / 100) * h;
        ctx.fillStyle = s.overlayTextColor;
        ctx.font = '600 ' + fs + 'px Georgia, "Times New Roman", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const lines = s.overlayText.split('\n');
        lines.forEach((line, i) => {
          ctx.fillText(line, cx, cy + (i - (lines.length - 1) / 2) * fs * 1.2);
        });
      }
    }
    if (overlayTextureRef.current) overlayTextureRef.current.needsUpdate = true;
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;
    if (!overlayCanvasRef.current) overlayCanvasRef.current = document.createElement('canvas');
    if (!overlayTextureRef.current) {
      const tex = new THREE.CanvasTexture(overlayCanvasRef.current);
      tex.colorSpace = THREE.SRGBColorSpace;
      overlayTextureRef.current = tex;
    }
    if (!overlayMeshRef.current) {
      const mat = new THREE.MeshBasicMaterial({
        map: overlayTextureRef.current, transparent: true, depthTest: false, depthWrite: false,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
      mesh.renderOrder = 10;
      overlayMeshRef.current = mesh;
      sceneRef.current.add(mesh);
    }
    overlayMeshRef.current.visible = ditherState.overlayEnabled;

    if (ditherState.overlayLogo) {
      if (!overlayLogoImgRef.current || overlayLogoImgRef.current.src !== ditherState.overlayLogo) {
        const img = new Image();
        img.onload = () => { overlayLogoImgRef.current = img; drawOverlay(); };
        img.src = ditherState.overlayLogo;
      } else {
        drawOverlay();
      }
    } else {
      overlayLogoImgRef.current = null;
      drawOverlay();
    }
  }, [
    ditherState.overlayEnabled, ditherState.overlayText, ditherState.overlayTextColor,
    ditherState.overlaySize, ditherState.overlayX, ditherState.overlayY,
    ditherState.overlayLogo, ditherState.overlayLogoScale,
    resolution.width, resolution.height, drawOverlay,
  ]);

  // ---- High-resolution export: temporarily resize the renderer above the preview
  //      size so stills/video are exported at >= 4K without lagging the editor. ----
  const beginExport = useCallback((w: number, h: number) => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    exportPrevSizeRef.current = { w: renderer.domElement.width, h: renderer.domElement.height };
    generatorExport.capturing = true;
    renderer.setSize(w, h, false); // keep CSS size; only the drawing buffer goes hi-res
    generatorTargetRef.current?.setSize(w, h);
    generatorMaterialRef.current?.uniforms.uResolution.value.set(w, h);
    materialRef.current?.uniforms.uResolution.value.set(w, h);
    drawOverlay(); // re-rasterise text/logo crisply at the export resolution
  }, [drawOverlay]);

  const endExport = useCallback(() => {
    const renderer = rendererRef.current;
    const prev = exportPrevSizeRef.current;
    generatorExport.capturing = false;
    if (!renderer || !prev) return;
    renderer.setSize(prev.w, prev.h, false);
    generatorTargetRef.current?.setSize(prev.w, prev.h);
    generatorMaterialRef.current?.uniforms.uResolution.value.set(prev.w, prev.h);
    materialRef.current?.uniforms.uResolution.value.set(prev.w, prev.h);
    drawOverlay();
    generatorDirtyRef.current = true;
  }, [drawOverlay]);

  // Render one frame at the CURRENT (live) time — for still-image export.
  const renderStillFrame = useCallback(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const cam = cameraRef.current;
    if (!renderer || !scene || !cam) return;
    const s = useDitherStore.getState();
    const genMat = generatorMaterialRef.current;
    if (genMat && generatorSceneRef.current && generatorTargetRef.current) {
      genMat.uniforms.uTime.value = performance.now() * 0.001;
      genMat.uniforms.uAnimate.value = s.generativeAnimate ? 1 : 0;
      renderer.setRenderTarget(generatorTargetRef.current);
      renderer.render(generatorSceneRef.current, cam);
      renderer.setRenderTarget(null);
    }
    if (materialRef.current) materialRef.current.uniforms.uTime.value = performance.now() * 0.001;
    renderer.render(scene, cam);
  }, []);

  useEffect(() => {
    generatorExport.renderExportFrame = renderExportFrame;
    generatorExport.renderStillFrame = renderStillFrame;
    generatorExport.beginExport = beginExport;
    generatorExport.endExport = endExport;
    return () => {
      generatorExport.renderExportFrame = null;
      generatorExport.renderStillFrame = null;
      generatorExport.beginExport = null;
      generatorExport.endExport = null;
    };
  }, [renderExportFrame, renderStillFrame, beginExport, endExport]);

  // Update uniforms when state changes
  useEffect(() => {
    if (!materialRef.current) return;

    const material = materialRef.current;
    material.uniforms.uAlgorithm.value = ditherState.currentAlgorithm;
    material.uniforms.uAlgorithm2.value = ditherState.secondAlgorithm;
    material.uniforms.uAlgo2Enabled.value = ditherState.multiAlgoEnabled;
    material.uniforms.uAlgo2BlendMode.value = ditherState.algoBlendMode;
    material.uniforms.uAlgo2BlendAmount.value = ditherState.algoBlendAmount;
    material.uniforms.uThreshold.value = ditherState.threshold;
    material.uniforms.uContrast.value = ditherState.contrast;
    material.uniforms.uBrightness.value = ditherState.brightness;
    material.uniforms.uSaturation.value = ditherState.saturation;
    material.uniforms.uHueShift.value = ditherState.hueShift;
    material.uniforms.uColors.value = ditherState.colors;
    material.uniforms.uInvert.value = ditherState.invert;
    material.uniforms.uGrayscale.value = ditherState.grayscale;
    material.uniforms.uParam1.value = ditherState.param1;
    material.uniforms.uParam2.value = ditherState.param2;
    material.uniforms.uParam3.value = ditherState.param3;
    material.uniforms.uParam4.value = ditherState.param4;
    material.uniforms.uScale.value = ditherState.scale;
    material.uniforms.uMidtones.value = ditherState.midtones;
    material.uniforms.uHighlights.value = ditherState.highlights;
    material.uniforms.uLumThreshold.value = ditherState.lumThreshold;
    material.uniforms.uBlur.value = ditherState.blur;
    material.uniforms.uPointSize.value = ditherState.pointSize;
    material.uniforms.uPixelation.value = ditherState.pixelation;
    material.uniforms.uColorMode.value = ditherState.colorMode;
    material.uniforms.uDuotoneDark.value = new THREE.Color(ditherState.duotoneDark);
    material.uniforms.uDuotoneLight.value = new THREE.Color(ditherState.duotoneLight);
    material.uniforms.uTritoneShadow.value = new THREE.Color(ditherState.tritoneShadow);
    material.uniforms.uTritoneMid.value = new THREE.Color(ditherState.tritoneMid);
    material.uniforms.uTritoneHighlight.value = new THREE.Color(ditherState.tritoneHighlight);
    material.uniforms.uPaletteColors.value = toPaletteUniform(ditherState.customPalette);
    material.uniforms.uPaletteSize.value = Math.min(ditherState.customPalette.length, PALETTE_UNIFORM_SIZE);
    material.uniforms.uSerpentine.value = ditherState.serpentine;
    material.uniforms.uGammaCorrect.value = ditherState.gammaCorrect;
    material.uniforms.uDitherStrength.value = ditherState.ditherStrength;
    material.uniforms.uPatternRandomization.value = ditherState.patternRandomization;
    material.uniforms.uTemporalDither.value = ditherState.temporalDither;
    material.uniforms.uTemporalSpeed.value = ditherState.temporalSpeed;
    material.uniforms.uColorSpace.value = ditherState.colorSpace;
    material.uniforms.uAdaptiveThreshold.value = ditherState.adaptiveThreshold;
    material.uniforms.uAdaptiveWindow.value = ditherState.adaptiveWindow;
    material.uniforms.uEdgePreservation.value = ditherState.edgePreservation;
    material.uniforms.uBandingReduction.value = ditherState.bandingReduction;
    material.uniforms.uPixelAspectRatio.value = ditherState.pixelAspectRatio;
    material.uniforms.uCRTEffect.value = ditherState.crtEffect;
    // CRT Display Effects
    material.uniforms.uScanlines.value = ditherState.scanlines;
    material.uniforms.uPhosphor.value = ditherState.phosphor;
    material.uniforms.uCurvature.value = ditherState.curvature;
    material.uniforms.uVignette.value = ditherState.vignette;
    material.uniforms.uChromatic.value = ditherState.chromatic;
    material.uniforms.uBloom.value = ditherState.bloom;

    // Post-Processing
    if (material.uniforms.uVhsEffect) material.uniforms.uVhsEffect.value = ditherState.vhsEffect;
    if (material.uniforms.uEdgeGlow) material.uniforms.uEdgeGlow.value = ditherState.edgeGlow;
    if (material.uniforms.uEmboss) material.uniforms.uEmboss.value = ditherState.emboss;
    if (material.uniforms.uSharpen) material.uniforms.uSharpen.value = ditherState.sharpen;
    if (material.uniforms.uPosterize) material.uniforms.uPosterize.value = ditherState.posterize;
    if (material.uniforms.uGlitchIntensity) material.uniforms.uGlitchIntensity.value = ditherState.glitchIntensity;
    if (material.uniforms.uGlitchSpeed) material.uniforms.uGlitchSpeed.value = ditherState.glitchSpeed;

    // Video/Animation
    material.uniforms.uFrameBlending.value = ditherState.frameBlending;
    material.uniforms.uFrameBlendStrength.value = ditherState.frameBlendStrength;
    material.uniforms.uMotionAdaptive.value = ditherState.motionAdaptive;
    material.uniforms.uMotionSensitivity.value = ditherState.motionSensitivity;
    material.uniforms.uTemporalStability.value = ditherState.temporalStability;

    // ASCII / Shape Effects
    if (material.uniforms.uAsciiCellSizeNew) material.uniforms.uAsciiCellSizeNew.value = ditherState.asciiCellSize;
    if (material.uniforms.uAsciiGap) material.uniforms.uAsciiGap.value = ditherState.asciiGap;
    if (material.uniforms.uAsciiBaseScale) material.uniforms.uAsciiBaseScale.value = ditherState.asciiBaseScale;
    if (material.uniforms.uAsciiIntensityNew) material.uniforms.uAsciiIntensityNew.value = ditherState.asciiIntensity;
    if (material.uniforms.uAsciiModeNew) material.uniforms.uAsciiModeNew.value = ditherState.asciiMode;
    if (material.uniforms.uAsciiShape) material.uniforms.uAsciiShape.value = ditherState.asciiShape;
    if (material.uniforms.uAsciiBgColor) material.uniforms.uAsciiBgColor.value = new THREE.Color(ditherState.asciiBgColor);
    if (material.uniforms.uAsciiFgColor) material.uniforms.uAsciiFgColor.value = new THREE.Color(ditherState.asciiFgColor);
    if (material.uniforms.uAsciiUseColor) material.uniforms.uAsciiUseColor.value = ditherState.asciiUseColor;
    if (material.uniforms.uAsciiInvertNew) material.uniforms.uAsciiInvertNew.value = ditherState.asciiInvert;

    // Comparison
    if (material.uniforms.uComparison) material.uniforms.uComparison.value = ditherState.comparisonMode;
    if (material.uniforms.uComparisonPos) material.uniforms.uComparisonPos.value = ditherState.comparisonPosition;
    if (material.uniforms.uGridMode) material.uniforms.uGridMode.value = ditherState.gridMode;
    if (material.uniforms.uGridAlgorithms) material.uniforms.uGridAlgorithms.value = ditherState.gridAlgorithms;

  }, [ditherState]);

  // Handle mouse wheel for zooming
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!hasImage) return;
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    setZoom((prevZoom) => Math.min(Math.max(0.1, prevZoom + scaleAmount), 10));
  }, [hasImage]);

  // Handle mouse down for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!hasImage) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [hasImage, pan]);

  // Handle mouse move for panning
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !hasImage) return;
    e.preventDefault();
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, hasImage, dragStart]);

  // Handle mouse up/leave to stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle Drops
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const isVideoFile = file.type.startsWith('video/');
      useDitherStore.getState().setFile(file, isVideoFile);
    }
  }, []);

  return (
    <div
      className="relative flex items-center justify-center w-full h-full bg-[#e8e5dd] overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {!hasImage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center text-[#999] text-sm">
            Upload an image or video to get started
          </div>
        </div>
      )}

      <div
        className="w-full h-full absolute inset-0 flex items-center justify-center cursor-move"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
            transformOrigin: 'center',
            imageRendering: 'pixelated',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          className={`shadow-lg transition-transform duration-75 ease-out ${!hasImage ? 'opacity-0' : 'opacity-100'}`}
        />
      </div>

      {hasImage && (
        <>
          {/* Stats Overlay */}
          <div className="absolute top-10 right-10 bg-[rgba(232,229,221,0.9)] border border-[#d0cdc4] px-4 py-3 text-xs text-[#666] pointer-events-none z-20">
            <div className="text-[#2a2a2a] font-medium mb-1">
              <span className="fps">{ditherState.fps} FPS</span>
            </div>
            <div>{resolution.width} × {resolution.height}</div>
            <div className="mt-1">Zoom: {Math.round(zoom * 100)}%</div>
          </div>

          {/* Canvas Controls */}
          <div className="absolute bottom-10 right-10 flex gap-2 z-30">
            <button
              onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}
              className="w-8 h-8 flex items-center justify-center bg-white border border-[#d0cdc4] text-[#2a2a2a] hover:bg-[#f5f3ee]"
              title="Zoom Out"
            >-</button>
            <button
              onClick={() => setZoom(1)}
              className="px-3 h-8 flex items-center justify-center bg-white border border-[#d0cdc4] text-[#2a2a2a] hover:bg-[#f5f3ee] text-xs font-medium"
              title="Reset Zoom to 100%"
            >100%</button>
            <button
              onClick={() => setZoom(z => Math.min(10, z + 0.1))}
              className="w-8 h-8 flex items-center justify-center bg-white border border-[#d0cdc4] text-[#2a2a2a] hover:bg-[#f5f3ee]"
              title="Zoom In"
            >+</button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="px-3 h-8 flex items-center justify-center bg-[#2a2a2a] text-white border border-[#2a2a2a] hover:opacity-90 text-xs"
              title="Reset View"
            >FIT</button>
          </div>

          {/* Comparison Slider */}
          {ditherState.comparisonMode && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 bg-white/90 p-3 border border-[#d0cdc4] z-30 flex flex-col items-center gap-2">
              <div className="text-[10px] font-medium text-[#666] w-full flex justify-between">
                <span>ORIGINAL</span>
                <span>DITHERED</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={ditherState.comparisonPosition}
                onChange={(e) => useDitherStore.getState().setComparisonPosition(parseFloat(e.target.value))}
                className="w-full h-1 bg-[#d0cdc4] rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
