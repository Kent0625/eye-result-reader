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
 * Pre-warms the Tesseract worker in the background on page load
 */
export function warmupOCR() {
  if (tesseractWorker || isInitializing) return;
  getTesseractWorker().catch(err => {
    console.info('OCR background warmup notice:', err.message);
  });
}

/**
 * Initializes or reuses Tesseract Worker using local vendor files
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
  const corePath = `${origin}/vendor`;
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
      onProgress(`Loading receipt optical model: ${Math.round(prog * 100)}%`, Math.round(35 + prog * 25));
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
      // Primary: Local vendor files from same origin (fastest, 100% offline-ready)
      const worker = await Tesseract.createWorker('eng', 1, {
        workerPath,
        corePath,
        langPath,
        workerBlobURL: false,
        gzip: true,
        logger
      });

      try {
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789+-.,*#<>[]():/RDLSPOXAVEMNDKFPPSrldsphcylaxavemm ',
          tessedit_pageseg_mode: '11'
        });
      } catch (paramErr) {
        console.warn('Parameter whitelist notice:', paramErr);
      }

      tesseractWorker = worker;
      return tesseractWorker;
    } catch (localErr) {
      console.warn('Local worker initialization issue, trying CDN fallback mirror:', localErr);
      
      // Fallback: Public CDN mirror
      const worker = await Tesseract.createWorker('eng', 1, {
        workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0',
        langPath: 'https://cdn.jsdelivr.net/gh/naptha/tessdata@gh-pages/4.0.0',
        logger
      });

      try {
        await worker.setParameters({
          tessedit_char_whitelist: '0123456789+-.,*#<>[]():/RDLSPOXAVEMNDKFPPSrldsphcylaxavemm ',
          tessedit_pageseg_mode: '11'
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
 * - Contrast normalization via fast precomputed lookup table
 */
export function preprocessReceiptImage(imgElement, rotationAngle = 0) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const angleRad = (rotationAngle * Math.PI) / 180;
  const isPerpendicular = rotationAngle % 180 !== 0;

  const origWidth = imgElement.naturalWidth || imgElement.width || 800;
  const origHeight = imgElement.naturalHeight || imgElement.height || 1000;

  // Scale image to optimal OCR dimensions (700px - 1000px max for speed + mobile memory)
  const maxDim = Math.max(origWidth, origHeight);
  let scale = 1.0;
  if (maxDim < 700) scale = 700 / maxDim;
  else if (maxDim > 1000) scale = 1000 / maxDim;

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
  ctx.drawImage(imgElement, -width / 2, -height / 2, width, height);
  ctx.restore();

  // Fast Contrast Normalization using LUT
  try {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const len = data.length;

    let minLum = 255;
    let maxLum = 0;

    // First pass: find min and max luminance
    for (let i = 0; i < len; i += 4) {
      const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      data[i] = lum;
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
    }

    // Precompute 256-entry lookup table for contrast stretch & slight gamma
    const range = (maxLum - minLum) || 1;
    const lut = new Uint8Array(256);
    for (let v = 0; v < 256; v++) {
      let norm = (v - minLum) / range;
      if (norm < 0) norm = 0;
      else if (norm > 1) norm = 1;
      // Slight gamma to darken thermal print dots
      lut[v] = Math.max(0, Math.min(255, Math.round(Math.pow(norm, 1.25) * 255)));
    }

    // Second pass: apply LUT
    for (let i = 0; i < len; i += 4) {
      const val = lut[data[i]];
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    console.warn('Canvas pixel enhancement notice:', e);
  }

  return canvas;
}

/**
 * Runs OCR on an image element:
 * 1. Tries native browser TextDetector (Instant on Android Chrome)
 * 2. Falls back to local Tesseract.js Web Worker
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
              processedCanvasUrl: processedCanvas.toDataURL('image/png')
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
    // Convert to compressed JPEG data URL for fast transfer to Web Worker
    const jpegUrl = processedCanvas.toDataURL('image/jpeg', 0.85);

    const recognizePromise = worker.recognize(jpegUrl);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Recognition timed out')), 12000)
    );

    const { data: { text } } = await Promise.race([recognizePromise, timeoutPromise]);

    if (onProgress) onProgress('Parsing prescription numbers…', 95);
    const parsed = parseReceiptText(text);

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
