/**
 * Clinical Calculations & Refraction Rules for Eye Result Reader
 * 
 * Precise diopter rounding, Spherical Equivalent (SE = SPH + CYL / 2),
 * condition classification, anisometropia check, and referral rules.
 */

export function roundDiopter(val) {
  if (val === null || val === undefined || isNaN(val)) return null;
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return null;
  // Standard arithmetic half-up rounding to 2 decimal places
  const sign = num < 0 ? -1 : 1;
  const abs = Math.abs(num);
  const rounded = Math.round((abs + Number.EPSILON) * 100) / 100;
  return sign * rounded;
}

export function formatDiopter(val, showPlus = true) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const rounded = roundDiopter(val);
  const fixed = rounded.toFixed(2);
  if (rounded > 0 && showPlus) {
    return `+${fixed} D`;
  }
  return `${fixed} D`;
}

export function computeSE(sph, cyl) {
  const s = roundDiopter(sph);
  const c = roundDiopter(cyl);
  if (s === null && c === null) return null;
  const validSph = s !== null ? s : 0;
  const validCyl = c !== null ? c : 0;
  const seRaw = validSph + (validCyl / 2);
  return roundDiopter(seRaw);
}

/**
 * Condition classifications based on Spherical Equivalent (SE) cutoffs:
 * - Emmetropia (Clear / Normal): -0.50 D to +0.50 D
 * - Myopia (Nearsighted):
 *     Mild: -0.50 D > SE >= -3.00 D
 *     Moderate: -3.00 D > SE >= -6.00 D
 *     Strong / High: SE < -6.00 D
 * - Hyperopia (Farsighted):
 *     Mild: +0.50 D < SE <= +2.00 D
 *     Moderate / Strong: SE > +2.00 D
 */
export function classifyEye(sph, cyl) {
  const se = computeSE(sph, cyl);
  if (se === null) {
    return {
      conditionKey: 'unknown',
      colorStatus: 'gray',
      severity: 'none',
      se: null,
      hasAstigmatism: false
    };
  }

  const c = roundDiopter(cyl);
  const hasAstigmatism = c !== null && Math.abs(c) >= 0.75;

  let conditionKey = 'emmetropia';
  let colorStatus = 'green'; // 'green', 'amber', 'orange'
  let severity = 'normal';

  if (se >= -0.50 && se <= 0.50) {
    conditionKey = 'emmetropia';
    colorStatus = hasAstigmatism ? 'amber' : 'green';
    severity = 'normal';
  } else if (se < -0.50) {
    if (se >= -3.00) {
      conditionKey = 'myopia_mild';
      colorStatus = 'amber';
      severity = 'mild';
    } else if (se >= -6.00) {
      conditionKey = 'myopia_moderate';
      colorStatus = 'orange';
      severity = 'moderate';
    } else {
      conditionKey = 'myopia_strong';
      colorStatus = 'orange';
      severity = 'strong';
    }
  } else {
    // Hyperopia
    if (se <= 2.00) {
      conditionKey = 'hyperopia_mild';
      colorStatus = 'amber';
      severity = 'mild';
    } else {
      conditionKey = 'hyperopia_strong';
      colorStatus = 'orange';
      severity = 'moderate';
    }
  }

  return {
    se,
    conditionKey,
    colorStatus,
    severity,
    hasAstigmatism,
    cylMagnitude: c !== null ? Math.abs(c) : 0
  };
}

/**
 * Evaluates two-eye relationship:
 * - Anisometropia: Diff between eyes >= 1.00 D (by SE or SPH)
 * - Referral recommendation
 */
export function evaluatePair(odSph, odCyl, osSph, osCyl) {
  const odSE = computeSE(odSph, odCyl);
  const osSE = computeSE(osSph, osCyl);

  let diff = null;
  let isAnisometropia = false;

  if (odSE !== null && osSE !== null) {
    diff = roundDiopter(Math.abs(odSE - osSE));
    isAnisometropia = diff >= 1.00;
  }

  const odClass = classifyEye(odSph, odCyl);
  const osClass = classifyEye(osSph, osCyl);

  // Referral rule: Any eye outside normal [-0.50, +0.50], or significant astigmatism, or anisometropia
  const referralEyes = [];
  if (odSE !== null && (odSE < -0.50 || odSE > 0.50 || odClass.hasAstigmatism)) {
    referralEyes.push('OD');
  }
  if (osSE !== null && (osSE < -0.50 || osSE > 0.50 || osClass.hasAstigmatism)) {
    referralEyes.push('OS');
  }

  const referralRecommended = referralEyes.length > 0 || isAnisometropia;

  return {
    odSE,
    osSE,
    diff,
    isAnisometropia,
    referralRecommended,
    referralEyes,
    odClass,
    osClass
  };
}

/**
 * Map SE to a 0-100% position on the visual scale:
 * Scale runs from -8.00 D (0%) to +6.00 D (100%).
 * 0 D is at approximately 57.14%.
 */
export function scalePercentageFromSE(se) {
  if (se === null || se === undefined || isNaN(se)) return 57.14;
  const minD = -8.0;
  const maxD = +6.0;
  const clamped = Math.max(minD, Math.min(maxD, se));
  const pct = ((clamped - minD) / (maxD - minD)) * 100;
  return Math.round(pct * 10) / 10;
}
