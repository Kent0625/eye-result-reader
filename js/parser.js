/**
 * Autorefractometer Receipt OCR Text Parser
 * 
 * Robustly parses text output from Tesseract OCR on autorefractor printouts
 * (Shin-Nippon, Topcon, Canon, Nidek, Huvitz, Grand Seiko).
 * 
 * Accurately captures the AVERAGE ONLY:
 * 1. Excludes all Keratometry sections (mm, D, R1, R2, K1, K2 corneal powers 38-55 D).
 * 2. Prioritizes the average row under dashed divider lines (Shin-Nippon / Grand Seiko).
 * 3. Prioritizes lines marked with '*' or '#' (Topcon / Nidek / Tomey).
 * 4. Prioritizes lines marked with 'AVE' / 'AVG' in refractometry (Canon).
 * 5. Extracts 4th column pupil size (PPS) directly from the average row.
 * 6. Handles fused AXIS+PPS numbers (e.g. '555' -> AX 55, PPS 5.1).
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

  // Normalize text:
  // - Convert various dash/minus unicode characters to standard hyphen
  // - Join detached signs (e.g. "- 1.75" -> "-1.75", "+ 0.50" -> "+0.50")
  // - Convert European decimal commas ("-1,75" -> "-1.75")
  // - Convert standalone delimiter commas/semicolons/bars into spaces
  const cleanedText = rawText
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212~_]/g, '-')
    .replace(/([+-])\s+(\d)/g, '$1$2')
    .replace(/(\d+),(\d{2})\b/g, '$1.$2')
    .replace(/[,;|]/g, ' ');

  const lines = cleanedText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 1. Try to extract Pupillary Distance (PD)
  // Matches "PD = 64", "PD: 63.5", "PD 64mm", "P.D. 62", "PD - 63.5", "pp = 62", "PD\n63.5"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const pdMatch = line.match(/\b(?:PD|P\.D\.|P\s*D|pp)\s*[:=\-~]?\s*(\d{2}(?:\.\d{1,2})?)\s*(?:mm)?\b/i);
    if (pdMatch && result.pd === null) {
      const val = parseFloat(pdMatch[1]);
      if (val >= 40 && val <= 85) {
        result.pd = val;
      }
    } else if (result.pd === null && /\b(?:PD|P\.D\.|P\s*D)\b/i.test(line)) {
      if (i + 1 < lines.length) {
        const nextMatch = lines[i + 1].match(/^[:=\-~]?\s*(\d{2}(?:\.\d{1,2})?)\s*(?:mm)?\b/i);
        if (nextMatch) {
          const val = parseFloat(nextMatch[1]);
          if (val >= 40 && val <= 85) {
            result.pd = val;
          }
        }
      }
    }

    // Try to extract Pupil Size (PS / PPS) from standalone line if present
    const ppsMatch = line.match(/\b(?:PPS|PS|P\.P\.S\.|P\s*S|PUPIL)\s*[:=\-~]?\s*(\d{1,2}(?:\.\d{1,2})?)\s*(?:mm)?\b/i);
    if (ppsMatch) {
      const val = parseFloat(ppsMatch[1]);
      if (val >= 1.5 && val <= 10.0) {
        if (result.od.pps === null) result.od.pps = val;
        else if (result.os.pps === null) result.os.pps = val;
      }
    }
  }

  // 2. Segment lines into Right Eye (OD) and Left Eye (OS) refractometry sections
  // IMPORTANT: Completely exclude Keratometry sections (<R> mm, <L> mm, R1, R2, K1, K2)
  let currentEye = null; // 'OD' or 'OS'
  let inKeratometry = false;
  const odLines = [];
  const osLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect Keratometry header (corneal curvature in mm/D)
    // Examples: "<R> mm D AX", "<L> mm", "mm D AX", "R1 7.75", "R2 7.62", "K1", "K2", "Peis D AX"
    const isKerato = /\b(?:mm|R1|R2|K1|K2|KERATO|KRT)\b/i.test(line) ||
      /\bD\s*AX\b/i.test(line) ||
      /\b4[0-9]\.[0-9]{2}\b/.test(line) ||
      /\b3[8-9]\.[0-9]{2}\b/.test(line) ||
      /\b5[0-5]\.[0-9]{2}\b/.test(line);

    // Detect Right Eye refractometry header:
    // Matches "<R>", "[R]", "(R)", "R:", "RIGHT", "OD", "<OD>" (without mm)
    // Or line containing "R>" before "SPH" or "CYL"
    const isR = !isKerato && (
      /(?:^[<\[\(]?\s*R\s*[>\]\)]?([:\s]|$)|^RIGHT\b|^[<\[\(]?\s*OD\s*[>\]\)]?([:\s]|$))/i.test(line) ||
      /\bR[>\]\)]\s*(?:SPH|CYL|spy|cl)/i.test(line)
    );

    // Detect Left Eye refractometry header:
    // Matches "<L>", "[L]", "LEFT", "OS", "<> SPH", "L> SPH"
    const isL = !isKerato && (
      /(?:^[<\[\(]?\s*(?:L|LEFT|OS)\s*[>\]\)]?([:\s]|$))/i.test(line) ||
      /[<\[\(]?\s*(?:L|I|1|<>)\s*[>\]\)]?\s*(?:SPH|CYL|spy|cl)/i.test(line)
    );

    if (isR) {
      currentEye = 'OD';
      inKeratometry = false;
      odLines.push(line);
      continue;
    }

    if (isL) {
      currentEye = 'OS';
      inKeratometry = false;
      osLines.push(line);
      continue;
    }

    // If keratometry begins, switch mode
    if (isKerato) {
      inKeratometry = true;
      continue;
    }

    // If currently inside a Keratometry block, ignore lines until the next eye refractometry
    if (inKeratometry) {
      continue;
    }

    if (currentEye === 'OD') {
      odLines.push(line);
    } else if (currentEye === 'OS') {
      osLines.push(line);
    }
  }

  // Parse extracted refractometry lines for each eye (capturing the AVERAGE ONLY)
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
      const first = candidateTriplets[0];
      const second = candidateTriplets[candidateTriplets.length - 1];
      result.od = { ...first, pps: result.od.pps || first.pps };
      result.os = { ...second, pps: result.os.pps || second.pps };
    } else if (candidateTriplets.length === 1) {
      result.od = { ...candidateTriplets[0], pps: result.od.pps || candidateTriplets[0].pps };
    }
  }

  return result;
}

/**
 * Parses lines within an eye refractometry section (OD or OS) to accurately capture the AVERAGE ONLY.
 * 
 * Order of precedence:
 * 1. Reading directly under dashed divider line (Shin-Nippon / Grand Seiko).
 * 2. Reading with '*' or '#' asterisk (Topcon / Nidek / Tomey).
 * 3. Reading marked with 'AVE' / 'AVG' in refractometry (Canon / Huvitz).
 * 4. Fallback: last refractometry reading (never intermediate trial shots when average exists).
 */
function parseEyeSection(sectionLines, eyeName, existingPps) {
  const readings = [];
  let aveReading = null;
  let ppsFound = existingPps;
  let seenDivider = false;
  let lastSph = null;

  for (let i = 0; i < sectionLines.length; i++) {
    const line = sectionLines[i];

    // Check for pupil size in this line if not already found
    if (ppsFound === null) {
      const ppsMatch = line.match(/\b(?:PPS|PS|P\.P\.S\.|P\s*S)\s*[:=\-~]?\s*(\d{1,2}(?:\.\d{1,2})?)\b/i);
      if (ppsMatch) {
        ppsFound = parseFloat(ppsMatch[1]);
      }
    }

    // Check for dashed/divider line separating trial shots from average
    // Matches "----------------", "---", "===", "___", or OCR dashed artifacts
    const isDividerLine = /^[\s\-_=~]{3,}$/.test(line) || /^[-=~_\s]{4,}/.test(line) || /[-_]{3,}/.test(line) || /Tad|Rl|ESN/i.test(line);
    if (isDividerLine) {
      seenDivider = true;
      continue;
    }

    // Check if line indicates average/median: "*", "#", "AVE", "AVG", "<AVE>", "[AVE]"
    let hasAsterisk = /^\s*[*#]/.test(line);
    let hasExplicitAve = /\b(?:AVE|AVG|MEDIAN)\b/i.test(line);

    // Check if line itself contains a fused divider noise prefix (e.g. "\"777000 -0.25 107 5.5", "\"1700 -0.25 1075.5")
    const isFusedDividerRow = /[0-9]{4,}|[~_\-=\"'“]{2,}|N00/i.test(line);

    let parsed = parseTripletLine(line);

    // Fallback: if divider was seen OR line has fused divider prefix, and line contains CYL+AXIS with garbled SPH
    if (!parsed && lastSph !== null) {
      const m = line.match(/(?:^|[^\d.-])([+-]?\s*\d+\.\d{2})\s+(\d{1,4})(?:\s+(\d{1,2}(?:\.\d+)?))?/);
      if (m) {
        const cyl = parseFloat(m[1].replace(/\s+/g, ''));
        let ax = parseInt(m[2], 10);
        let pps = m[3] ? parseFloat(m[3]) : null;
        if (ax > 180) {
          const axStr = String(ax);
          if (axStr.length === 3) {
            ax = parseInt(axStr.substring(0, 2), 10);
            if (pps === null) pps = parseInt(axStr.substring(2), 10);
          } else if (axStr.length === 4) {
            ax = parseInt(axStr.substring(0, 3), 10);
            if (pps === null) pps = parseInt(axStr.substring(3), 10);
          }
        }
        if (Math.abs(cyl) <= 12.0 && ax >= 0 && ax <= 180) {
          parsed = { sph: lastSph, cyl, ax, pps };
          if (seenDivider || isFusedDividerRow) {
            hasExplicitAve = true;
          }
        }
      }
    }

    if (parsed) {
      if (parsed.sph !== null) lastSph = parsed.sph;
      if (parsed.pps !== null && ppsFound === null) {
        ppsFound = parsed.pps;
      }

      if (hasAsterisk || hasExplicitAve || seenDivider) {
        // This is the AVERAGE!
        aveReading = parsed;
        seenDivider = false; // captured the row immediately after divider
      } else {
        readings.push(parsed);
      }
    }
  }

  // Resilient multiline fallback: if horizontal triplets weren't found,
  // scan consecutive numbers (e.g. SPH on one line, CYL on next, AX on next)
  if (!aveReading && readings.length === 0) {
    for (let i = 0; i < sectionLines.length - 2; i++) {
      const sMatch = sectionLines[i].match(/^[*\s]*([+-]?\d{1,2}\.\d{2})\b/);
      const cMatch = sectionLines[i + 1].match(/^[*\s]*([+-]?\d{1,2}\.\d{2})\b/);
      const aMatch = sectionLines[i + 2].match(/^[*\s]*(\d{1,3})\b/);

      if (sMatch && cMatch && aMatch) {
        const sph = parseFloat(sMatch[1]);
        const cyl = parseFloat(cMatch[1]);
        const ax = parseInt(aMatch[1], 10);
        if (Math.abs(sph) <= 25 && Math.abs(cyl) <= 12 && ax >= 0 && ax <= 180) {
          readings.push({ sph, cyl, ax, pps: null });
          i += 2;
        }
      }
    }
  }

  // Pick AVERAGE ONLY
  const chosen = aveReading || (readings.length > 0 ? readings[readings.length - 1] : { sph: null, cyl: null, ax: null, pps: null });

  return {
    sph: chosen.sph,
    cyl: chosen.cyl,
    ax: chosen.ax,
    pps: chosen.pps || ppsFound
  };
}

/**
 * Parses a single line looking for SPH, CYL, AX, [PPS] numbers.
 * Common formats:
 * - -2.50  -0.25    55    5.1   (Shin-Nippon average row with PPS)
 * - -1.75  -0.50    85          (Standard Topcon row)
 * - * -1.75 -0.50   85          (Topcon average row with *)
 * - 1  +0.75 -0.25  90          (Canon indexed row)
 * - AVE +0.75 -0.25 90          (Canon average row)
 */
export function parseTripletLine(line) {
  // Strip non-relevant header words and index numbers
  let cleaned = line
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212~_]/g, '-')
    .replace(/([+-])\s+(\d)/g, '$1$2')
    .replace(/(\d+),(\d{2})\b/g, '$1.$2')
    .replace(/[,;|]/g, ' ')
    .replace(/^(?:[*#\s]|[<\[\(]?(?:R|L|OD|OS|AVE|AVG)[>\]\)]?[:\s]*)*/i, '')
    .trim();

  // Reject Keratometry lines:
  // Corneal diopters are in 38.00 - 55.00 D range; R1/R2/K1/K2 corneal curvature
  if (/\b(?:R1|R2|K1|K2)\b/i.test(cleaned)) return null;
  if (/\b4[0-9]\.[0-9]{2}\b/.test(cleaned) || /\b3[8-9]\.[0-9]{2}\b/.test(cleaned) || /\b5[0-5]\.[0-9]{2}\b/.test(cleaned)) {
    return null;
  }

  // Pattern matches SPH, CYL, AXIS, [PPS]:
  // Handles leading noise like "~ 3 3 - 2.50 -0.25 55 5.1" or "1.00 -0.25 107 5.5"
  const regex = /(?:^|[^\d.-])([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s+(\d{1,4})(?:\s+(\d{1,2}(?:\.\d+)?))?(?:[^\d.]|$)/;
  const match = cleaned.match(regex);

  if (match) {
    const sph = parseFloat(match[1]);
    const cyl = parseFloat(match[2]);
    let ax = parseInt(match[3], 10);
    let pps = match[4] ? parseFloat(match[4]) : null;

    // Handle fused AXIS+PPS in thermal receipt printing (e.g. "555" -> AX 55, PPS 5.1; "1075" -> AX 107, PPS 5.5)
    if (ax > 180) {
      const axStr = String(ax);
      if (axStr.length === 3) {
        const candidateAx = parseInt(axStr.substring(0, 2), 10);
        const candidatePps = parseInt(axStr.substring(2), 10);
        if (candidateAx <= 180 && candidatePps >= 3 && candidatePps <= 8) {
          ax = candidateAx;
          if (pps === null) pps = candidatePps;
        }
      } else if (axStr.length === 4) {
        const candidateAx = parseInt(axStr.substring(0, 3), 10);
        const candidatePps = parseInt(axStr.substring(3), 10);
        if (candidateAx <= 180 && candidatePps >= 3 && candidatePps <= 8) {
          ax = candidateAx;
          if (pps === null) pps = candidatePps;
        }
      }
    }

    // Must be plausible refractive numbers:
    // SPH is -25 to +25 D
    // CYL is -12 to +12 D
    // AX is 0 to 180
    if (Math.abs(sph) <= 25.0 && Math.abs(cyl) <= 12.0 && ax >= 0 && ax <= 180) {
      if (Math.abs(cyl) > 0 || Math.abs(sph) > 0 || String(sph).includes('.')) {
        return { sph, cyl, ax, pps };
      }
    }
  }

  // Also check if CYL was 0 or omitted and ONLY a single SPH was present on the line
  const singleSph = cleaned.match(/^\s*([+-]?\d+\.\d{2})\s*$/);
  if (singleSph) {
    const val = parseFloat(singleSph[1]);
    if (Math.abs(val) <= 25.0) {
      return { sph: val, cyl: 0.0, ax: 0, pps: null };
    }
  }

  return null;
}
