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
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number | null>(null);

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

    // Create render target for temporal coherence
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

  // Create shader material
  const createMaterial = (texture: THREE.Texture, width: number, height: number) => {
    if (materialRef.current) {
      materialRef.current.dispose();
    }

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        tDiffuse: { value: texture },
        tPrevious: { value: renderTargetRef.current?.texture || null },
        uAlgorithm: { value: ditherState.currentAlgorithm },
        uAlgorithm2: { value: ditherState.secondAlgorithm },
        uAlgo2Enabled: { value: ditherState.multiAlgoEnabled },
        uAlgo2BlendMode: { value: ditherState.algoBlendMode },
        uAlgo2BlendAmount: { value: ditherState.algoBlendAmount },
        uThreshold: { value: ditherState.threshold },
        uTemporalWeight: { value: ditherState.temporalWeight },
        uContrast: { value: ditherState.contrast },
        uBrightness: { value: ditherState.brightness },
        uColors: { value: ditherState.colors },
        uInvert: { value: ditherState.invert },
        uGrayscale: { value: ditherState.grayscale },
        uResolution: { value: new THREE.Vector2(width, height) },
        uTime: { value: 0 },
        uParam1: { value: ditherState.param1 },
        uParam2: { value: ditherState.param2 },
        uParam3: { value: ditherState.param3 },
        uParam4: { value: ditherState.param4 },
        uScale: { value: ditherState.scale },
        uMidtones: { value: ditherState.midtones },
        uHighlights: { value: ditherState.highlights },
        uLumThreshold: { value: ditherState.lumThreshold },
        uBlur: { value: ditherState.blur },
        uPixelation: { value: ditherState.pixelation },
        uColorMode: { value: ditherState.colorMode },
        uDuotoneDark: { value: new THREE.Color(ditherState.duotoneDark) },
        uDuotoneLight: { value: new THREE.Color(ditherState.duotoneLight) },
        uTritoneShadow: { value: new THREE.Color(ditherState.tritoneShadow) },
        uTritoneMid: { value: new THREE.Color(ditherState.tritoneMid) },
        uTritoneHighlight: { value: new THREE.Color(ditherState.tritoneHighlight) },
        uPaletteColors: { value: [] },
        uPaletteSize: { value: 0 },
        uSerpentine: { value: ditherState.serpentine },
        uGammaCorrect: { value: ditherState.gammaCorrect },
        uDitherStrength: { value: ditherState.ditherStrength },
        uPatternRandomization: { value: ditherState.patternRandomization },
        uTemporalDither: { value: ditherState.temporalDither },
        uTemporalSpeed: { value: ditherState.temporalSpeed },
        uColorSpace: { value: ditherState.colorSpace },
        uAdaptiveThreshold: { value: ditherState.adaptiveThreshold },
        uAdaptiveWindow: { value: ditherState.adaptiveWindow },
        uEdgePreservation: { value: ditherState.edgePreservation },
        uBandingReduction: { value: ditherState.bandingReduction },
        uPixelAspectRatio: { value: ditherState.pixelAspectRatio },
        uCRTEffect: { value: ditherState.crtEffect },
      },
    });

    materialRef.current = material;
    return material;
  };

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
      ditherState.setFps(fps);
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [ditherState]);

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
  }, [ditherState, startAnimation]);

  // Load video file
  const loadVideo = useCallback((file: File) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.load();
    video.loop = true;
    video.muted = true;

    video.onloadedmetadata = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;

      const videoTexture = new THREE.VideoTexture(video);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTextureRef.current = videoTexture;
      videoElementRef.current = video;

      setResolution({ width: video.videoWidth, height: video.videoHeight });

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
      video.play();
      startAnimation();
    };
  }, [ditherState, startAnimation]);

  // Handle file upload
  useEffect(() => {
    if (currentFile) {
      if (isVideo) {
        loadVideo(currentFile);
      } else {
        loadImage(currentFile);
      }
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
    material.uniforms.uPixelation.value = ditherState.pixelation;
    material.uniforms.uColorMode.value = ditherState.colorMode;
    material.uniforms.uDuotoneDark.value = new THREE.Color(ditherState.duotoneDark);
    material.uniforms.uDuotoneLight.value = new THREE.Color(ditherState.duotoneLight);
    material.uniforms.uTritoneShadow.value = new THREE.Color(ditherState.tritoneShadow);
    material.uniforms.uTritoneMid.value = new THREE.Color(ditherState.tritoneMid);
    material.uniforms.uTritoneHighlight.value = new THREE.Color(ditherState.tritoneHighlight);
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
  }, [ditherState]);

  return (
    <div className="flex items-center justify-center w-full h-full bg-[#e8e5dd] p-10">
      {!hasImage ? (
        <div className="text-center text-[#999] text-sm">
          Upload an image or video to get started
        </div>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full w-auto h-auto shadow-lg"
          />
          <div className="absolute top-10 right-10 bg-[rgba(232,229,221,0.9)] border border-[#d0cdc4] px-4 py-3 text-xs text-[#666]">
            <div className="text-[#2a2a2a] font-medium mb-1">
              <span className="fps">{ditherState.fps} FPS</span>
            </div>
            <div>{resolution.width} × {resolution.height}</div>
          </div>
        </>
      )}
    </div>
  );
}
