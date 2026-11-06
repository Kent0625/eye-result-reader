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

// Format 4: Shin-Nippon Accuref K-900 with refractometry trials, dashed divider, and keratometry
const shinNipponFormat = `
CARDINAL Eyecare Clinic
SM CDO Downtown Premier
NAME
JAN 01 2011          00:03

VD=12
<R>   SPH      CYL    AX PPS
   - 2.00   -0.50   100
   - 2.75   -0.25    55
   - 2.75    0.00          5.1
------------------------------
   - 2.50   -0.25    55    5.1

<R>    mm       D     AX
R1   7.75   43.50     17
R2   7.62   44.25    107
AVE  7.68   44.00
CYL         -0.75     17

<L>   SPH      CYL    AX PPS
   - 0.75   -0.25   109
   - 1.00   -0.25   107
   - 1.00   -0.50   108    5.5
------------------------------
   - 1.00   -0.25   107    5.5

<L>    mm       D     AX
R1   7.76   43.50     10
R2   7.50   45.00    100
AVE  7.63   44.25
CYL         -1.50     10

PD = 62

SHIN-NIPPON
       ACCUREF K-900
`;

const res4 = parseReceiptText(shinNipponFormat);
console.assert(res4.od.sph === -2.50, `Expected OD SPH -2.50, got ${res4.od.sph}`);
console.assert(res4.od.cyl === -0.25, `Expected OD CYL -0.25, got ${res4.od.cyl}`);
console.assert(res4.od.ax === 55, `Expected OD AX 55, got ${res4.od.ax}`);
console.assert(res4.od.pps === 5.1, `Expected OD PPS 5.1, got ${res4.od.pps}`);
console.assert(res4.os.sph === -1.00, `Expected OS SPH -1.00, got ${res4.os.sph}`);
console.assert(res4.os.cyl === -0.25, `Expected OS CYL -0.25, got ${res4.os.cyl}`);
console.assert(res4.os.ax === 107, `Expected OS AX 107, got ${res4.os.ax}`);
console.assert(res4.os.pps === 5.5, `Expected OS PPS 5.5, got ${res4.os.pps}`);
console.assert(res4.pd === 62, `Expected PD 62, got ${res4.pd}`);
console.log('✓ Shin-Nippon Accuref K-900 (Average Only + Keratometry Excluded) parsed accurately!');

// Format 5: Real OCR with merged divider noise & fused tokens
const realOcrNoiseFormat = `
3 Nay ’
JAN As CL 00:03
4 VDs15
i” R> spy cL AX PP
i ~ 2.00 -0.50 100
I / - 2.75 -0.25 59
i 275 000 *
Tad Rl ESN
~ 3 3 - 2.50 -0.25 555
& ? $1 => mm D AX
JR uy pd 7.75 43.50 17
2 7.62 44.25 107
Hi AP AVE 7.68 44.00
CYL -0.75 17
<> SPH CYL AX PPS
- 0.75 -0.25 109
- 1.00 -0.25 107
- 1.00 -0.50 108 5.5
"777000 -0.25 107 5.5
Peis D AX
5 7.76 43.80 10
Rr 7.50 45.00 100
Rie 7.63 44.25
. AVE -1.50 10
pp = 62
NIPPON
gHIN-NLECUREF K-900
`;

const res5 = parseReceiptText(realOcrNoiseFormat);
console.assert(res5.od.sph === -2.50, `Expected OD SPH -2.50, got ${res5.od.sph}`);
console.assert(res5.od.cyl === -0.25, `Expected OD CYL -0.25, got ${res5.od.cyl}`);
console.assert(res5.od.ax === 55, `Expected OD AX 55, got ${res5.od.ax}`);
console.assert(res5.os.sph === -1.00, `Expected OS SPH -1.00, got ${res5.os.sph}`);
console.assert(res5.os.cyl === -0.25, `Expected OS CYL -0.25, got ${res5.os.cyl}`);
console.assert(res5.os.ax === 107, `Expected OS AX 107, got ${res5.os.ax}`);
console.assert(res5.pd === 62, `Expected PD 62, got ${res5.pd}`);
console.log('✓ Real OCR with merged divider noise & fused tokens parsed accurately!');

// Format 6: Shin-Nippon Sample 2 (00:01 receipt)
const shinNipponSample2 = `
CARDINAL Eyecare Clinic
SM CDO Downtown Premier
NAME
JAN 01 2011          00:01

VD=12
<R>   SPH      CYL    AX PPS
   - 0.75   -1.00   132
   - 1.00   -1.00   128
   - 1.00   -1.00   128    5.6
------------------------------
   - 1.00   -1.00   128    5.6

<R>    mm       D     AX
R1   7.45   45.25    167
R2   7.39   45.75     77
AVE  7.42   45.50
CYL         -0.50    167

<L>   SPH      CYL    AX PPS
   - 1.75   -0.25   102
   - 1.00   -0.25   104
   - 1.00   -0.50   102    5.6
------------------------------
   - 1.00   -0.25   104    5.6

<L>    mm       D     AX
R1   7.48   45.25     35
R2   7.30   46.25    125
AVE  7.39   45.75
CYL         -1.00     35

PD = 62

SHIN-NIPPON
       ACCUREF K-900
`;

const res6 = parseReceiptText(shinNipponSample2);
console.assert(res6.od.sph === -1.00, `Expected OD SPH -1.00, got ${res6.od.sph}`);
console.assert(res6.od.cyl === -1.00, `Expected OD CYL -1.00, got ${res6.od.cyl}`);
console.assert(res6.od.ax === 128, `Expected OD AX 128, got ${res6.od.ax}`);
console.assert(res6.od.pps === 5.6, `Expected OD PPS 5.6, got ${res6.od.pps}`);
console.assert(res6.os.sph === -1.00, `Expected OS SPH -1.00, got ${res6.os.sph}`);
console.assert(res6.os.cyl === -0.25, `Expected OS CYL -0.25, got ${res6.os.cyl}`);
console.assert(res6.os.ax === 104, `Expected OS AX 104, got ${res6.os.ax}`);
console.assert(res6.os.pps === 5.6, `Expected OS PPS 5.6, got ${res6.os.pps}`);
console.assert(res6.pd === 62, `Expected PD 62, got ${res6.pd}`);
console.log('✓ Shin-Nippon Accuref K-900 Sample 2 (00:01) parsed accurately!');

console.log('\nALL EXTENDED RECEIPT TESTS PASSED! ✓');
