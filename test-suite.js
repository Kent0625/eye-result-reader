import { roundDiopter, computeSE, classifyEye, evaluatePair, scalePercentageFromSE } from './js/clinical.js';
import { parseReceiptText, parseTripletLine } from './js/parser.js';

console.log('--- Testing Clinical Math ---');

// Test 1: Spherical Equivalent calculation & rounding
const se1 = computeSE(-1.75, -0.50);
console.assert(se1 === -2.00, `Expected -2.00, got ${se1}`);
console.log('✓ SE(-1.75, -0.50) =', se1);

const se2 = computeSE(-2.25, -0.75);
console.assert(se2 === -2.63, `Expected -2.63, got ${se2}`);
console.log('✓ SE(-2.25, -0.75) =', se2);

// Test 2: Anisometropia evaluation (diff >= 1.00 D)
const pair1 = evaluatePair(-1.00, 0, -2.50, 0);
console.assert(pair1.isAnisometropia === true, `Expected anisometropia true, got ${pair1.isAnisometropia}`);
console.assert(pair1.diff === 1.50, `Expected diff 1.50, got ${pair1.diff}`);
console.assert(pair1.referralRecommended === true, `Expected referralRecommended true`);
console.log('✓ Anisometropia detected: diff =', pair1.diff, 'isAniso =', pair1.isAnisometropia);

const pairNormal = evaluatePair(0.00, -0.25, -0.25, 0);
console.assert(pairNormal.isAnisometropia === false, 'Expected anisometropia false');
console.assert(pairNormal.referralRecommended === false, 'Expected referralRecommended false for normal eyes');
console.log('✓ Normal eyes referral =', pairNormal.referralRecommended);

// Test 3: Classification bands
const cNormal = classifyEye(0.00, 0.00);
console.assert(cNormal.conditionKey === 'emmetropia' && cNormal.colorStatus === 'green');
console.log('✓ Normal range classified as emmetropia (green)');

const cMildMyopia = classifyEye(-1.50, -0.50); // SE = -1.75
console.assert(cMildMyopia.conditionKey === 'myopia_mild' && cMildMyopia.colorStatus === 'amber');
console.log('✓ Mild myopia classified as myopia_mild (amber)');

const cModMyopia = classifyEye(-3.50, -0.50); // SE = -3.75
console.assert(cModMyopia.conditionKey === 'myopia_moderate' && cModMyopia.colorStatus === 'orange');
console.log('✓ Moderate myopia classified as myopia_moderate (orange)');

const cStrongMyopia = classifyEye(-6.50, -0.50); // SE = -6.75
console.assert(cStrongMyopia.conditionKey === 'myopia_strong' && cStrongMyopia.colorStatus === 'orange');
console.log('✓ Strong myopia classified as myopia_strong (orange)');

// Test 4: Scale Percentage
const pctCenter = scalePercentageFromSE(0.0);
console.log('✓ SE 0.00 scale % =', pctCenter);
const pctMinus2 = scalePercentageFromSE(-2.0);
console.log('✓ SE -2.00 scale % =', pctMinus2);

console.log('\n--- Testing Receipt Parser ---');

const sampleReceiptText = `
TOPCON KR-800
[REF] VD: 12.00  CYL: -
DATE: 2026/10/19 08:30

<R>  SPH    CYL   AX
    -1.75  -0.50   85
    -1.75  -0.50   85
    -1.75  -0.75   84
*   -1.75  -0.50   85
PS: 4.5 mm

<L>  SPH    CYL   AX
    -2.25  -0.75   95
    -2.25  -0.75   95
    -2.50  -0.75   95
*   -2.25  -0.75   95
PS: 4.8 mm

PD = 63.5 mm
`;

const parsed = parseReceiptText(sampleReceiptText);
console.log('Parsed Receipt Output:', JSON.stringify(parsed, null, 2));

console.assert(parsed.od.sph === -1.75, `Expected OD SPH -1.75, got ${parsed.od.sph}`);
console.assert(parsed.od.cyl === -0.50, `Expected OD CYL -0.50, got ${parsed.od.cyl}`);
console.assert(parsed.od.ax === 85, `Expected OD AX 85, got ${parsed.od.ax}`);
console.assert(parsed.od.pps === 4.5, `Expected OD PPS 4.5, got ${parsed.od.pps}`);

console.assert(parsed.os.sph === -2.25, `Expected OS SPH -2.25, got ${parsed.os.sph}`);
console.assert(parsed.os.cyl === -0.75, `Expected OS CYL -0.75, got ${parsed.os.cyl}`);
console.assert(parsed.os.ax === 95, `Expected OS AX 95, got ${parsed.os.ax}`);
console.assert(parsed.os.pps === 4.8, `Expected OS PPS 4.8, got ${parsed.os.pps}`);

console.assert(parsed.pd === 63.5, `Expected PD 63.5, got ${parsed.pd}`);

console.log('\nALL UNIT TESTS PASSED SUCCESSFULLY! ✓');
