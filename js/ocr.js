/**
 * Client-Side In-Browser OCR Module using Tesseract.js & HTML5 Canvas
 * 
 * Preprocesses thermal receipts (contrast enhancement, binarization, rotation)
 * and runs OCR fully client-side without network uploads.
 */

import { parseReceiptText } from './parser.js';

let tesseractWorker = null;

/**
 * Initializes or reuses Tesseract Worker
 */
export async function getTesseractWorker(onProgress) {
  if (tesseractWorker) return tesseractWorker;

  if (typeof Tesseract === 'undefined') {
    throw new Error('Tesseract.js library is not loaded.');
  }

  // Use fast reliable CDN mirror for language model to avoid slow github/naptha downloads
  const worker = await Tesseract.createWorker('eng', 1, {
    langPath: 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0',
    logger: m => {
      if (onProgress && m.status === 'recognizing text') {
        const pct = Math.round((m.progress || 0) * 100);
        onProgress(`Reading receipt text: ${pct}%`, pct);
      } else if (onProgress && m.status) {
        const cleanStatus = m.status.replace(/_/g, ' ');
        onProgress(`${cleanStatus}…`, 30);
      }
    }
  });

  // Optimize Tesseract parameters for receipts: numbers, signs, periods, table markers
  try {
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789+-.,*#<>[]():/RDLSPOXAVEMNDKFPPSrldsphcylaxavemm ',
      tessedit_pageseg_mode: (Tesseract.PSM && Tesseract.PSM.SPARSE_TEXT) ? Tesseract.PSM.SPARSE_TEXT : '11'
    });
  } catch (e) {
    console.warn('Parameter set warning:', e);
  }

  tesseractWorker = worker;
  return tesseractWorker;
}

/**
 * Preprocesses receipt image on canvas:
 * - Rotates image by given angle (0, 90, 180, 270)
 * - Enhances contrast
 * - Binarizes / thresholds thermal receipts for crisp OCR
 */
export function preprocessReceiptImage(imgElement, rotationAngle = 0, applyThreshold = true) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const angleRad = (rotationAngle * Math.PI) / 180;
  const isPerpendicular = rotationAngle % 180 !== 0;

  const origWidth = imgElement.naturalWidth || imgElement.width;
  const origHeight = imgElement.naturalHeight || imgElement.height;

  // Scale up small images for better OCR resolution (target at least 1200px width/height)
  const maxDim = Math.max(origWidth, origHeight);
  const scale = maxDim < 1200 ? 1200 / maxDim : 1.0;

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

  if (applyThreshold) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const len = data.length;

    // First pass: grayscale and calculate average luminance
    let totalLum = 0;
    for (let i = 0; i < len; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      totalLum += lum;
      data[i] = lum;
      data[i + 1] = lum;
      data[i + 2] = lum;
    }

    const avgLum = totalLum / (len / 4);
    // Threshold with bias towards preserving dark printed dots on thermal receipts
    const threshold = Math.max(100, Math.min(160, avgLum * 0.9));

    for (let i = 0; i < len; i += 4) {
      const lum = data[i];
      // Increase contrast
      const val = lum < threshold ? 0 : 255;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }

    ctx.putImageData(imgData, 0, 0);
  }

  return canvas;
}

/**
 * Runs OCR on an image element with optional rotation angle
 */
export async function runReceiptOCR(imgElement, rotationAngle = 0, onProgress) {
  try {
    if (onProgress) onProgress('Enhancing receipt image…', 15);

    // Create enhanced canvas
    const processedCanvas = preprocessReceiptImage(imgElement, rotationAngle, true);

    if (onProgress) onProgress('Loading OCR engine…', 30);
    const worker = await getTesseractWorker(onProgress);

    if (onProgress) onProgress('Reading text in browser…', 50);
    const { data: { text } } = await worker.recognize(processedCanvas);

    if (onProgress) onProgress('Parsing optical values…', 90);
    const parsed = parseReceiptText(text);

    return {
      success: true,
      parsed,
      rawText: text,
      processedCanvasUrl: processedCanvas.toDataURL('image/png')
    };
  } catch (err) {
    console.error('OCR Error:', err);
    return {
      success: false,
      error: err.message || 'Failed to read receipt image',
      parsed: parseReceiptText('')
    };
  }
}
