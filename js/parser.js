/**
 * Autorefractometer Receipt OCR Text Parser
 * 
 * Robustly parses text output from Tesseract OCR on autorefractor printouts.
 * Extracts OD (Right) and OS (Left) SPH, CYL, AX, PPS, plus overall PD.
 */

export function parseReceiptText(rawText) {
  const result = {
    od: { sph: null, cyl: null, ax: null, pps: null },
    os: { sph: null, cyl: null, ax: null, pps: null },
    pd: null,
    confidence: 'medium',
    rawText: rawText || '',
    detectedLines: []
  };

  if (!rawText || typeof rawText !== 'string') {
    return result;
  }

  // Normalize text: replace em-dash/en-dash with minus, standardize commas as periods in numbers
  const cleanedText = rawText
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-')
    .replace(/(\d+),(\d{2})/g, '$1.$2');

  const lines = cleanedText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 1. Try to extract Pupillary Distance (PD)
  // Matches "PD = 64", "PD: 63.5", "PD 64mm", "P.D. 62"
  for (const line of lines) {
    const pdMatch = line.match(/\b(?:PD|P\.D\.|P\s*D)\s*[:=]?\s*(\d{2}(?:\.\d{1,2})?)\s*(?:mm)?\b/i);
    if (pdMatch && result.pd === null) {
      const val = parseFloat(pdMatch[1]);
      if (val >= 40 && val <= 85) {
        result.pd = val;
      }
    }

    // Try to extract Pupil Size (PS / PPS) from standalone line if present
    const ppsMatch = line.match(/\b(?:PPS|PS|P\.P\.S\.|P\s*S|PUPIL)\s*[:=]?\s*(\d{1,2}(?:\.\d{1,2})?)\s*(?:mm)?\b/i);
    if (ppsMatch) {
      const val = parseFloat(ppsMatch[1]);
      if (val >= 1.5 && val <= 10.0) {
        if (result.od.pps === null) result.od.pps = val;
        else if (result.os.pps === null) result.os.pps = val;
      }
    }
  }

  // 2. Segment lines into Right Eye (OD) and Left Eye (OS) sections
  let currentEye = null; // 'OD' or 'OS'
  const odLines = [];
  const osLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect Right Eye headers: <R>, [R], (R), R:, RIGHT, OD, <OD>, [OD]
    if (/(?:^[<\[\(]?\s*R\s*[>\]\)]?[:\s]|^RIGHT\b|^[<\[\(]?\s*OD\s*[>\]\)]?)/i.test(line)) {
      currentEye = 'OD';
      odLines.push(line);
      continue;
    }

    // Detect Left Eye headers: <L>, [L], (L), L:, LEFT, OS, <OS>, [OS]
    if (/(?:^[<\[\(]?\s*L\s*[>\]\)]?[:\s]|^LEFT\b|^[<\[\(]?\s*OS\s*[>\]\)]?)/i.test(line)) {
      currentEye = 'OS';
      osLines.push(line);
      continue;
    }

    if (currentEye === 'OD') {
      odLines.push(line);
    } else if (currentEye === 'OS') {
      osLines.push(line);
    }
  }

  // Parse extracted lines for each eye
  if (odLines.length > 0) {
    result.od = parseEyeSection(odLines, 'OD', result.od.pps);
  }
  if (osLines.length > 0) {
    result.os = parseEyeSection(osLines, 'OS', result.os.pps);
  }

  // Fallback: If sections were not explicitly demarcated by R / L headers,
  // scan all lines for refractive triplets (SPH CYL AX)
  if (result.od.sph === null && result.os.sph === null) {
    const candidateTriplets = [];
    for (const line of lines) {
      const parsed = parseTripletLine(line);
      if (parsed) {
        candidateTriplets.push(parsed);
      }
    }

    if (candidateTriplets.length >= 2) {
      // First half candidate for OD, second for OS
      const first = candidateTriplets[0];
      const second = candidateTriplets[candidateTriplets.length - 1];
      result.od = { ...first, pps: result.od.pps };
      result.os = { ...second, pps: result.os.pps };
    } else if (candidateTriplets.length === 1) {
      result.od = { ...candidateTriplets[0], pps: result.od.pps };
    }
  }

  return result;
}

/**
 * Parses lines within an eye section (OD or OS) to find the best SPH, CYL, AX reading.
 * Prioritizes lines marked with '*', 'AVE', 'AVG', or takes the median/last reading.
 */
function parseEyeSection(sectionLines, eyeName, existingPps) {
  const readings = [];
  let aveReading = null;
  let ppsFound = existingPps;

  for (const line of sectionLines) {
    // Check for pupil size in this line if not already found
    if (ppsFound === null) {
      const ppsMatch = line.match(/\b(?:PPS|PS|P\.P\.S\.|P\s*S)\s*[:=]?\s*(\d{1,2}(?:\.\d{1,2})?)\b/i);
      if (ppsMatch) {
        ppsFound = parseFloat(ppsMatch[1]);
      }
    }

    // Check if line indicates average/median: "*", "AVE", "AVG", "<AVE>", "[AVE]"
    const isAverage = /^\s*[*#]\s*|\b(?:AVE|AVG|MEDIAN)\b/i.test(line);

    const parsed = parseTripletLine(line);
    if (parsed) {
      if (isAverage) {
        aveReading = parsed;
      } else {
        readings.push(parsed);
      }
    }
  }

  const chosen = aveReading || (readings.length > 0 ? readings[readings.length - 1] : { sph: null, cyl: null, ax: null });

  return {
    sph: chosen.sph,
    cyl: chosen.cyl,
    ax: chosen.ax,
    pps: ppsFound
  };
}

/**
 * Parses a single line looking for SPH, CYL, AX numbers.
 * Common formats:
 * - -1.75  -0.50   85
 * - +0.25  -0.75  175
 * - -2.00   0.00    0
 * - * -1.75 -0.50 85 4.5
 */
export function parseTripletLine(line) {
  // Strip non-relevant header words
  const cleaned = line
    .replace(/^(?:[*#\s]|[<\[\(]?(?:R|L|OD|OS|AVE|AVG)[>\]\)]?[:\s]*)*/i, '')
    .trim();

  // Pattern matches 3 numbers:
  // 1: Signed float for SPH: [+-]?\d+(?:\.\d+)?
  // 2: Signed float for CYL: [+-]?\d+(?:\.\d+)?
  // 3: Integer or float for AXIS: \d{1,3}(?:\.\d+)?
  const regex = /([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s+(\d{1,3}(?:\.\d+)?)/;
  const match = cleaned.match(regex);

  if (match) {
    const sph = parseFloat(match[1]);
    const cyl = parseFloat(match[2]);
    const ax = Math.round(parseFloat(match[3]));

    // Plausibility bounds
    if (sph >= -25.0 && sph <= 25.0 && cyl >= -15.0 && cyl <= 15.0 && ax >= 0 && ax <= 180) {
      return { sph, cyl, ax };
    }
  }

  // Also check if CYL was 0 or omitted and only SPH was present
  const singleSph = cleaned.match(/^([+-]?\d+\.\d{2})\b/);
  if (singleSph) {
    const val = parseFloat(singleSph[1]);
    if (val >= -25.0 && val <= 25.0) {
      return { sph: val, cyl: 0.0, ax: 0 };
    }
  }

  return null;
}
