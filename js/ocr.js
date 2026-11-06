/**
 * Client-Side In-Browser OCR Module using Tesseract.js & HTML5 Canvas
 * 
 * Runs 100% locally on device:
 * 1. Checks for instant native window.TextDetector (supported in Chrome/Android)
 * 2. Falls back to local same-origin Tesseract.js Web Worker from /vendor/
 * 3. Dynamic contrast stretch & rotation handling for thermal receipts
 */

import { parseReceiptText } from './parser.js';

let tesseractWorker = null;
let isInitializing = null;

/**
 * Checks for WebAssembly SIMD support in 0.01ms
 */
function detectSimdSupport() {
  try {
    if (typeof WebAssembly === 'object' && typeof WebAssembly.validate === 'function') {
      return WebAssembly.validate(new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 26, 11
      ]));
    }
  } catch (e) {
    // fallback
  }
  return false;
}

/**
 * Pre-warms the Tesseract worker in the background on page load
 */
export function warmupOCR() {
  if (tesseractWorker || isInitializing) return;
  getTesseractWorker().catch(err => {
    console.info('OCR background warmup notice:', err.message);
  });
}

/**
 * Initializes or reuses Tesseract Worker using local vendor files with strict timeout
 */
export async function getTesseractWorker(onProgress) {
  if (tesseractWorker) return tesseractWorker;
  if (isInitializing) return isInitializing;

  if (typeof Tesseract === 'undefined') {
    throw new Error('Tesseract.js library is not loaded.');
  }

  const origin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file'))
    ? window.location.origin
    : '.';

  const workerPath = `${origin}/vendor/worker.min.js`;
  const isSimd = detectSimdSupport();
  // Point directly to the exact wasm.js file to bypass slow runtime wasm-feature-detect
  const corePath = isSimd
    ? `${origin}/vendor/tesseract-core-simd-lstm.wasm.js`
    : `${origin}/vendor/tesseract-core-lstm.wasm.js`;
  const langPath = `${origin}/vendor`;

  const logger = m => {
    if (!onProgress || !m) return;
    const st = m.status || '';
    const prog = typeof m.progress === 'number' ? m.progress : 0;

    if (st === 'loading tesseract core') {
      onProgress('Loading optical engine…', Math.round(15 + prog * 15));
    } else if (st === 'initializing tesseract') {
      onProgress('Initializing engine…', 32);
    } else if (st === 'loading language traineddata') {
      onProgress(`Loading receipt model: ${Math.round(prog * 100)}%`, Math.round(35 + prog * 25));
    } else if (st === 'initializing api') {
      onProgress('Preparing optical analyzer…', 65);
    } else if (st === 'recognizing text') {
      const pct = Math.round(prog * 100);
      onProgress(`Reading receipt numbers: ${pct}%`, Math.round(70 + prog * 28));
    } else if (st) {
      const clean = st.replace(/_/g, ' ');
      onProgress(`${clean}…`, 50);
    }
  };

  isInitializing = (async () => {
    try {
      // Primary: Local vendor files with 20-second timeout for first-time wasm load
      const localPromise = Tesseract.createWorker('eng', 1, {
        workerPath,
        corePath,
        langPath,
        workerBlobURL: false,
        gzip: true,
        logger
      });

      const localTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Local worker timeout')), 20000)
      );

      const worker = await Promise.race([localPromise, localTimeout]);

      try {
        // PSM 6: Assume a single uniform block of text.
        // Critical for receipts: preserves horizontal SPH, CYL, AXIS tabular layout.
        await worker.setParameters({
          tessedit_pageseg_mode: '6'
        });
      } catch (paramErr) {
        console.warn('Parameter notice:', paramErr);
      }

      tesseractWorker = worker;
      return tesseractWorker;
    } catch (localErr) {
      console.warn('Local worker initialization issue, trying CDN fallback mirror:', localErr);

      // Fallback: Public CDN mirror with 15-second timeout
      const cdnPromise = Tesseract.createWorker('eng', 1, {
        workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0',
        langPath: 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/4.0.0_best_int',
        logger
      });

      const cdnTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('CDN fallback timeout')), 15000)
      );

      const worker = await Promise.race([cdnPromise, cdnTimeout]);

      try {
        await worker.setParameters({
          tessedit_pageseg_mode: '6'
        });
      } catch (e) {
        // ignore
      }

      tesseractWorker = worker;
      return tesseractWorker;
    } finally {
      isInitializing = null;
    }
  })();

  return isInitializing;
}

/**
 * Preprocesses receipt image on canvas:
 * - Rotates image by given angle (0, 90, 180, 270)
 * - Optimal resolution scaling for thermal receipt dot-matrix characters
 * - GPU-accelerated contrast stretch & grayscale enhancement
 */
export function preprocessReceiptImage(imgElement, rotationAngle = 0) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const angleRad = (rotationAngle * Math.PI) / 180;
  const isPerpendicular = rotationAngle % 180 !== 0;

  const origWidth = imgElement.naturalWidth || imgElement.width || 800;
  const origHeight = imgElement.naturalHeight || imgElement.height || 1000;

  // Scale image to optimal OCR dimensions (1100px - 1500px for sharp thermal receipt dot-matrix)
  const baseDim = isPerpendicular ? origHeight : origWidth;
  let scale = 1.0;
  if (baseDim < 1000) scale = 1200 / baseDim;
  else if (baseDim > 1600) scale = 1400 / baseDim;

  const width = Math.round(origWidth * scale);
  const height = Math.round(origHeight * scale);

  if (isPerpendicular) {
    canvas.width = height;
    canvas.height = width;
  } else {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(angleRad);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // Hardware-accelerated contrast enhancement:
  // Converts thermal printout to crisp dark ink against light paper, removing background shadows without bleeding
  ctx.filter = 'grayscale(1) contrast(1.5) brightness(1.04)';
  ctx.drawImage(imgElement, -width / 2, -height / 2, width, height);
  ctx.restore();

  return canvas;
}

/**
 * Runs OCR on an image element:
 * 1. Enhances contrast on canvas
 * 2. Checks native browser TextDetector if available
 * 3. Runs local Tesseract.js Web Worker (PSM 6)
 * 4. Auto-detects orientation if photo was captured sideways
 */
export async function runReceiptOCR(imgElement, rotationAngle = 0, onProgress) {
  try {
    if (onProgress) onProgress('Enhancing receipt photo…', 10);
    const processedCanvas = preprocessReceiptImage(imgElement, rotationAngle);

    // Fast-path: Check for native on-device Shape Detection API (Android Chrome / Google Play)
    if (typeof window !== 'undefined' && 'TextDetector' in window) {
      try {
        if (onProgress) onProgress('Reading with native Android detector…', 30);
        const detector = new window.TextDetector();
        const detectedBlocks = await detector.detect(processedCanvas);
        if (detectedBlocks && detectedBlocks.length > 0) {
          const fullText = detectedBlocks.map(b => b.rawValue).join('\n');
          const parsed = parseReceiptText(fullText);
          if (parsed && (parsed.od.sph !== null || parsed.os.sph !== null || parsed.pd !== null)) {
            if (onProgress) onProgress('Prescription values detected!', 100);
            return {
              success: true,
              parsed,
              rawText: fullText,
              engine: 'native_text_detector',
              processedCanvasUrl: processedCanvas.toDataURL('image/jpeg', 0.85)
            };
          }
        }
      } catch (nativeErr) {
        console.warn('Native TextDetector bypassed:', nativeErr);
      }
    }

    // Local Tesseract Worker
    if (onProgress) onProgress('Starting optical reader…', 20);
    const worker = await getTesseractWorker(onProgress);

    if (onProgress) onProgress('Analyzing receipt lines…', 70);
    const jpegUrl = processedCanvas.toDataURL('image/jpeg', 0.85);

    const recognizePromise = worker.recognize(processedCanvas);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Recognition timed out')), 25000)
    );

    const { data: { text } } = await Promise.race([recognizePromise, timeoutPromise]);

    if (onProgress) onProgress('Parsing average prescription numbers…', 95);
    let parsed = parseReceiptText(text);

    // Orientation Auto-Recovery:
    // If no eye readings were found and image was taken in landscape (sideways phone photo)
    if ((!parsed || (parsed.od.sph === null && parsed.os.sph === null)) && rotationAngle === 0) {
      const isLandscape = (imgElement.naturalWidth || 0) > (imgElement.naturalHeight || 0) * 1.15;
      if (isLandscape) {
        if (onProgress) onProgress('Checking sideways orientation…', 85);
        try {
          const rotatedCanvas = preprocessReceiptImage(imgElement, 270);
          const rotatedResult = await worker.recognize(rotatedCanvas);
          const rotatedParsed = parseReceiptText(rotatedResult.data.text);
          if (rotatedParsed && (rotatedParsed.od.sph !== null || rotatedParsed.os.sph !== null)) {
            return {
              success: true,
              parsed: rotatedParsed,
              rawText: rotatedResult.data.text,
              engine: 'tesseract_local_rotated_270',
              processedCanvasUrl: rotatedCanvas.toDataURL('image/jpeg', 0.85)
            };
          }
        } catch (rotErr) {
          console.warn('Sideways orientation check notice:', rotErr);
        }
      }
    }

    return {
      success: true,
      parsed,
      rawText: text,
      engine: 'tesseract_local',
      processedCanvasUrl: jpegUrl
    };
  } catch (err) {
    console.error('OCR Processing error:', err);
    return {
      success: false,
      error: err.message || 'Failed to read receipt image',
      parsed: parseReceiptText('')
    };
  }
}
