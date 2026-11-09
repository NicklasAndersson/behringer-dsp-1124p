// node test.js – kontrollerar mappningen mot värden vi verifierat på enheten.
const assert = require('assert');
const D = require('./map.js');
assert.strictEqual(D.ISO.length, 31);
assert.strictEqual(D.ISO[4], 50);                       // CC13=4 -> "50"
assert.strictEqual(D.enc.gain(-12), 36);                // CC16=36 -> -12 dB
assert.strictEqual(D.enc.gain(16), 64);                 // CC16=64 -> +16 dB
assert.strictEqual(D.enc.bw(12), 11);                   // CC15=11 -> 12
assert.strictEqual(D.enc.bw(1), 0);                     // CC15=0  -> 1
assert.strictEqual(D.enc.fine(0), 9);                   // 9 = 0 offset
assert.strictEqual(D.enc.fb(-3), 6); assert.strictEqual(D.enc.fb(-9), 0);   // CC 17 uppmätt 2026-11-09
for (const k in D.MAX)                                  // enc/dec är varandras invers
  for (let v = 0; v <= D.MAX[k]; v++) assert.strictEqual(D.enc[k](D.dec[k](v)), v, k + ' ' + v);
assert.strictEqual(D.toCC('bw', 0), 0);                  // klämning: aldrig utanför 0..MAX
assert.strictEqual(D.toCC('bw', 500), 119);
assert.strictEqual(D.toCC('fine', 1.4), 10);
assert(Number.isNaN(D.toCC('gain', NaN)));
const near = (a, b, tol) => assert(Math.abs(a - b) < tol, `${a} != ${b}`);
near(D.q(1), 86.54, 0.1); near(D.q(120), 0.667, 0.001);          // värden ur rapporten
const flt = { freq: 4, fine: 0, bw: 12, gain: -12 };            // 50 Hz, -12 dB
near(D.peakDb(flt, 50), -12, 0.05);                              // mitt i filtret = gain
near(D.peakDb(flt, 20000), 0, 0.5);                              // långt bort = 0 dB
const fs = require('fs'), dump = n => [...fs.readFileSync('docs/dumps/' + n)];
const c = D.parseDump(dump('c01-alla-filter-p10.syx'));        // 24 testfilter skickade via MIDI 2026-11-09
assert.strictEqual(c.active, 10);
for (let k = 0; k < 12; k++) {
  assert.deepStrictEqual(c.programs[9][0][k], { mode: 1, freq: 2 * k + 3, fine: k + 2 - 9, bw: 11 + 7 * k, gain: 20 + 3 * k - 48 });
  assert.deepStrictEqual(c.programs[9][1][k], { mode: 1, freq: 29 - 2 * k, fine: 19 - k - 9, bw: 101 - 7 * k, gain: 60 - 3 * k - 48 });
}
const e0 = D.parseDump(dump('e00-backup-fore-p1-8.syx'));
assert.deepStrictEqual([e0.active, e0.inout, e0.fbL, e0.fbR, e0.c, e0.omni, e0.C, e0.P], [10, 2, 3, 3, 1, 1, 3, 3]);
assert.strictEqual(D.parseDump(dump('f02-fb-cc17-0.syx')).fbR, 0); assert.strictEqual(D.parseDump(dump('f03-inout-cc19-0.syx')).inout, 0);
const f4 = D.parseDump(dump('f04-fbL1-fbR5.syx')); assert.deepStrictEqual([f4.fbL, f4.fbR], [1, 5]);
assert.strictEqual(D.parseDump(dump('d00-aktivt-program-1.syx')).active, 1);
assert.deepStrictEqual(D.parseDump(dump('b01-L-f1-1k-fine5-bw20-g-6.syx')).programs[8][0][0], { mode: 1, freq: 17, fine: 5, bw: 20, gain: -6 });
assert.deepStrictEqual(['g00-lage-OF-p10-L12', 'g01-lage-AU-p10-L12', 'g02-lage-SI-p10-L12'].map(n => D.parseDump(dump(n + '.syx')).programs[9][0][11].mode), [0, 2, 3]);
assert.strictEqual(D.parseDump([0xF0, 0xF7]), null);
const rs = D.resetProgram(8);                                     // program 9 (index 8)
assert.deepStrictEqual(rs[0], ['pc', 8]); assert.deepStrictEqual(rs[rs.length - 1], ['cc', 18, 8]);
assert.strictEqual(rs.filter(m => m[0] === 'cc' && m[1] === 10).length, 24);   // 12 filter x 2 motorer
assert(rs.every(m => m[0] !== 'cc' || (m[2] >= 0 && m[2] <= 127)));
assert.deepStrictEqual(rs.slice(3, 10), [['cc', 10, 0], ['cc', 11, 1], ['cc', 13, 14], ['cc', 14, 9], ['cc', 15, 59], ['cc', 16, 48], ['cc', 11, 0]]);
console.log('ok');
