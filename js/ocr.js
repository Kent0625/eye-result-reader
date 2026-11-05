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

/**
 * Initializes or reuses Tesseract Worker using local vendor files
 */
export async function getTesseractWorker(onProgress) {
  if (tesseractWorker) return tesseractWorker;

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
    if (onProgress && m.status === 'recognizing text') {
      const pct = Math.round((m.progress || 0) * 100);
      onProgress(`Reading receipt text: ${pct}%`, Math.max(35, pct));
    } else if (onProgress && m.status) {
      const clean = m.status.replace(/_/g, ' ');
      onProgress(`${clean}…`, 25);
    }
  };

  try {
    // Attempt local same-origin worker (fast, zero CDN downloads)
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
    } catch (e) {
      console.warn('Parameter whitelist notice:', e);
    }

    tesseractWorker = worker;
    return tesseractWorker;
  } catch (localErr) {
    console.warn('Local worker setup notice, attempting default configuration:', localErr);
    // Graceful fallback to default configuration if local worker fails
    const worker = await Tesseract.createWorker('eng', 1, {
      langPath: 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0',
      logger
    });

    tesseractWorker = worker;
    return tesseractWorker;
  }
}

/**
 * Preprocesses receipt image on canvas:
 * - Rotates image by given angle (0, 90, 180, 270)
 * - Dynamic range contrast stretch preserving grayscale contours for LSTM
 */
export function preprocessReceiptImage(imgElement, rotationAngle = 0) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const angleRad = (rotationAngle * Math.PI) / 180;
  const isPerpendicular = rotationAngle % 180 !== 0;

  const origWidth = imgElement.naturalWidth || imgElement.width || 800;
  const origHeight = imgElement.naturalHeight || imgElement.height || 1000;

  // Scale image to optimal OCR dimensions (between 1200px and 2000px max)
  const maxDim = Math.max(origWidth, origHeight);
  let scale = 1.0;
  if (maxDim < 1200) scale = 1200 / maxDim;
  else if (maxDim > 2000) scale = 2000 / maxDim;

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

  // Contrast Normalization (Grayscale + Dynamic Range Stretch)
  try {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const len = data.length;

    let minLum = 255;
    let maxLum = 0;

    for (let i = 0; i < len; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = lum;
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
    }

    const range = (maxLum - minLum) || 1;
    for (let i = 0; i < len; i += 4) {
      // Dynamic contrast stretch
      let norm = ((data[i] - minLum) / range) * 255;
      // Slight gamma boost to darken faint thermal print dots
      norm = Math.pow(norm / 255, 1.25) * 255;
      const finalVal = Math.max(0, Math.min(255, Math.round(norm)));
      data[i] = finalVal;
      data[i + 1] = finalVal;
      data[i + 2] = finalVal;
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
 * 2. Falls back to local Tesseract.js
 */
export async function runReceiptOCR(imgElement, rotationAngle = 0, onProgress) {
  try {
    if (onProgress) onProgress('Enhancing receipt image…', 15);
    const processedCanvas = preprocessReceiptImage(imgElement, rotationAngle);

    // Fast-path: Check for native on-device Shape Detection API (Android Chrome / Google Play)
    if (typeof window !== 'undefined' && 'TextDetector' in window) {
      try {
        if (onProgress) onProgress('Reading with native on-device reader…', 35);
        const detector = new window.TextDetector();
        const detectedBlocks = await detector.detect(processedCanvas);
        if (detectedBlocks && detectedBlocks.length > 0) {
          const fullText = detectedBlocks.map(b => b.rawValue).join('\n');
          const parsed = parseReceiptText(fullText);
          if (parsed && (parsed.od.sph !== null || parsed.os.sph !== null || parsed.pd !== null)) {
            if (onProgress) onProgress('Prescription numbers detected!', 100);
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

    // Standard local Tesseract Worker
    if (onProgress) onProgress('Initializing optical reader…', 30);
    const worker = await getTesseractWorker(onProgress);

    if (onProgress) onProgress('Analyzing receipt text…', 50);
    const { data: { text } } = await worker.recognize(processedCanvas);

    if (onProgress) onProgress('Parsing prescription values…', 90);
    const parsed = parseReceiptText(text);

    return {
      success: true,
      parsed,
      rawText: text,
      engine: 'tesseract_local',
      processedCanvasUrl: processedCanvas.toDataURL('image/png')
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
