import { saveAs } from 'file-saver';
import { AsciiExportSettings, getAsciiFromImageData } from './ascii-export';
import { VideoExportSettings, VideoExportProgress } from './index';

/**
 * Export ASCII Animation to HTML file
 * Captures frames from WebGL canvas or Video element and generates a standalone HTML player
 */
export async function exportAsciiAnimation(
    canvas: HTMLCanvasElement,
    videoElement: HTMLVideoElement | null,
    settings: VideoExportSettings,
    asciiSettings: AsciiExportSettings,
    onProgress?: VideoExportProgress
): Promise<void> {
    onProgress?.(0, 'Preparing ASCII animation...');

    const videoDuration = videoElement ? videoElement.duration : 5;
    const duration = settings.duration || Math.min(videoDuration, 10); // Max 10 seconds default
    const fps = settings.fps || 15; // Default 15fps for ASCII is usually enough
    const frameCount = Math.round(duration * fps);
    const frameDelay = 1000 / fps;

    // Create temporary canvas to read pixels from WebGL
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d');

    if (!ctx) throw new Error('Could not create temp canvas context');
    ctx.imageSmoothingEnabled = false;

    const frames: string[] = [];

    // Warn if using original colors for animation - it's heavy
    const isHeavyMode = asciiSettings.colorMode === 0;

    // Capture loop
    if (videoElement) {
        // SOURCE VIDEO MODE
        for (let i = 0; i < frameCount; i++) {
            const time = (i / frameCount) * duration;
            videoElement.currentTime = time;

            // Wait for seek
            await new Promise<void>((resolve) => {
                const onSeeked = () => {
                    videoElement.removeEventListener('seeked', onSeeked);
                    resolve();
                };
                videoElement.addEventListener('seeked', onSeeked);
            });

            // Small delay for render
            await new Promise(resolve => setTimeout(resolve, 50));

            // Draw and capture
            ctx.drawImage(canvas, 0, 0);
            const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

            // Convert to ASCII string
            // For animation, we generally want just the text content if possible to save space
            // unless color is required. 
            // If colorMode is 0 (original), we MUST use HTML, which is huge.
            // If colorMode is 1 (monochrome) or 2 (tinted), we can use raw text and style the container.

            // However, to keep it simple, let's use the helper.
            // But for reduced size in Monochrome (1) or Tinted (2), we can just grab raw text.
            const useRawText = asciiSettings.colorMode !== 0;
            const frameAscii = getAsciiFromImageData(imageData, asciiSettings, useRawText);

            // Simple compression (escape backticks/newlines if needed for JS string)
            frames.push(frameAscii);

            const progress = 5 + ((i + 1) / frameCount) * 85;
            onProgress?.(Math.round(progress), `Capturing frame ${i + 1}/${frameCount}`);
        }
    } else {
        // ANIMATION MODE
        for (let i = 0; i < frameCount; i++) {
            await new Promise(resolve => setTimeout(resolve, frameDelay));

            ctx.drawImage(canvas, 0, 0);
            const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

            const useRawText = asciiSettings.colorMode !== 0;
            const frameAscii = getAsciiFromImageData(imageData, asciiSettings, useRawText);
            frames.push(frameAscii);

            const progress = 5 + ((i + 1) / frameCount) * 85;
            onProgress?.(Math.round(progress), `Capturing frame ${i + 1}/${frameCount}`);
        }
    }

    onProgress?.(95, 'Generating HTML...');

    // Generate HTML Player
    const htmlKey = Date.now();
    const useRawText = asciiSettings.colorMode !== 0;

    // For raw text, we simply put text in a <pre>.
    // For HTML mode (colors), we put HTML in a <div>.
    const containerTag = useRawText ? 'pre' : 'div';

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>ASCII Animation</title>
<style>
  body {
    background-color: ${asciiSettings.background};
    color: ${asciiSettings.foreground};
    font-family: monospace;
    font-size: ${asciiSettings.cellSize}px;
    line-height: ${asciiSettings.cellSize}px;
    white-space: pre;
    overflow: hidden;
    margin: 0;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
  }
  #screen {
    display: block;
    ${useRawText ? '' : `height: ${Math.floor(canvas.height / asciiSettings.cellSize) * asciiSettings.cellSize}px;`}
  }
  /* For HTML mode spans */
  .row { display: block; height: ${asciiSettings.cellSize}px; }
  span { display: inline-block; width: ${asciiSettings.cellSize}px; text-align: center; }
  
  #controls {
    margin-top: 20px;
    font-size: 12px;
    font-family: sans-serif;
    color: #888;
    cursor: pointer;
    user-select: none;
  }
</style>
</head>
<body>
    <${containerTag} id="screen"></${containerTag}>
    <div id="controls">
        <span id="play-btn">⏸ PAUSE</span>
        <span style="margin-left:10px" id="info">${Math.round(duration)}s @ ${fps}fps</span>
    </div>

    <script>
        const frames = ${JSON.stringify(frames)};
        const fps = ${fps};
        const screen = document.getElementById('screen');
        const playBtn = document.getElementById('play-btn');
        
        let frameIndex = 0;
        let isPlaying = true;
        let interval;

        function renderFrame() {
            if (${useRawText}) {
                screen.innerText = frames[frameIndex];
            } else {
                screen.innerHTML = frames[frameIndex];
            }
            frameIndex = (frameIndex + 1) % frames.length;
        }

        function togglePlay() {
            isPlaying = !isPlaying;
            playBtn.innerText = isPlaying ? "⏸ PAUSE" : "▶ PLAY";
            if (isPlaying) {
                interval = setInterval(renderFrame, 1000 / fps);
            } else {
                clearInterval(interval);
            }
        }

        playBtn.addEventListener('click', togglePlay);
        
        // Start
        renderFrame();
        interval = setInterval(renderFrame, 1000 / fps);
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const filename = `${settings.filename}-ascii.html`;
    saveAs(blob, filename);

    onProgress?.(100, 'Export complete!');
}
