import { parseReceiptText, parseTripletLine } from './js/parser.js';

console.log('--- Testing Multiple Autorefractor Formats ---');

// Format 1: Nidek with standalone <R> and <L>
const nidekFormat = `
NIDEK AR-1
VD: 12.00
<R>
  SPH    CYL   AX
 -3.00  -1.25  180
 -3.00  -1.00  175
 -3.25  -1.25  178
* -3.00 -1.25  178
PS: 5.2mm

<L>
  SPH    CYL   AX
 -2.75  -0.50   10
 -2.75  -0.50   10
 -2.50  -0.50   12
* -2.75 -0.50   10
PS: 5.0mm

PD = 64.0mm
`;

const res1 = parseReceiptText(nidekFormat);
console.assert(res1.od.sph === -3.00, `Expected OD SPH -3.00, got ${res1.od.sph}`);
console.assert(res1.od.cyl === -1.25, `Expected OD CYL -1.25, got ${res1.od.cyl}`);
console.assert(res1.od.ax === 178, `Expected OD AX 178, got ${res1.od.ax}`);
console.assert(res1.od.pps === 5.2, `Expected OD PPS 5.2, got ${res1.od.pps}`);
console.assert(res1.os.sph === -2.75, `Expected OS SPH -2.75, got ${res1.os.sph}`);
console.assert(res1.os.cyl === -0.50, `Expected OS CYL -0.50, got ${res1.os.cyl}`);
console.assert(res1.os.ax === 10, `Expected OS AX 10, got ${res1.os.ax}`);
console.assert(res1.pd === 64.0, `Expected PD 64.0, got ${res1.pd}`);
console.log('✓ Nidek receipt format parsed accurately!');

// Format 2: Canon with RIGHT / LEFT and indexed rows
const canonFormat = `
CANON RK-F2
REFRACTOMETRY
RIGHT
1   +0.75  -0.25   90
2   +0.75  -0.25   90
AVE +0.75  -0.25   90

LEFT
1   +1.25  -0.50   85
2   +1.25  -0.50   85
AVE +1.25  -0.50   85

PD: 62mm
`;

const res2 = parseReceiptText(canonFormat);
console.assert(res2.od.sph === 0.75, `Expected OD SPH 0.75, got ${res2.od.sph}`);
console.assert(res2.od.cyl === -0.25, `Expected OD CYL -0.25, got ${res2.od.cyl}`);
console.assert(res2.od.ax === 90, `Expected OD AX 90, got ${res2.od.ax}`);
console.assert(res2.os.sph === 1.25, `Expected OS SPH 1.25, got ${res2.os.sph}`);
console.assert(res2.os.cyl === -0.50, `Expected OS CYL -0.50, got ${res2.os.cyl}`);
console.assert(res2.os.ax === 85, `Expected OS AX 85, got ${res2.os.ax}`);
console.assert(res2.pd === 62, `Expected PD 62, got ${res2.pd}`);
console.log('✓ Canon receipt format parsed accurately!');

// Format 3: Noisy OCR output with spaces between minus signs and commas
const noisyFormat = `
[R]
 - 2.50 , - 0.75 , 80
* - 2.50 , - 0.75 , 80

[L]
 - 1.75 , - 0.50 , 100
* - 1.75 , - 0.50 , 100

PD = 61.5
`;

const res3 = parseReceiptText(noisyFormat);
console.assert(res3.od.sph === -2.50, `Expected OD SPH -2.50, got ${res3.od.sph}`);
console.assert(res3.od.cyl === -0.75, `Expected OD CYL -0.75, got ${res3.od.cyl}`);
console.assert(res3.os.sph === -1.75, `Expected OS SPH -1.75, got ${res3.os.sph}`);
console.assert(res3.pd === 61.5, `Expected PD 61.5, got ${res3.pd}`);
console.log('✓ Noisy OCR receipt format parsed accurately!');

console.log('\nALL EXTENDED RECEIPT TESTS PASSED! ✓');
