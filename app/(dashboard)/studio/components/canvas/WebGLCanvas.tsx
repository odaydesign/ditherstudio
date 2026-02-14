'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useDitherStore } from '@/store/ditherStore';
import { vertexShader } from '@/lib/three/shaders/vertexShader';
import { fragmentShader } from '@/lib/three/shaders/fragmentShader';

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
        uPaletteColors: { value: state.customPalette.map((c) => new THREE.Color(c)) },
        uPaletteSize: { value: 16 },
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

        // Comparison
        uComparison: { value: state.comparisonMode },
        uComparisonPos: { value: state.comparisonPosition },
      },
    });

    materialRef.current = material;
    return material;
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !materialRef.current) {
      return;
    }

    // Update time uniform
    materialRef.current.uniforms.uTime.value = performance.now() * 0.001;

    // Update video texture
    if (videoTextureRef.current && videoElementRef.current) {
      videoTextureRef.current.needsUpdate = true;
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

  const startAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animate();
  }, [animate]);

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
    material.uniforms.uPaletteColors.value = ditherState.customPalette.map((c) => new THREE.Color(c));
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
