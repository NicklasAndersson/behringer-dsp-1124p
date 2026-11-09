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
assert.strictEqual(D.parseDump(dump('d00-aktivt-program-1.syx')).active, 1);
assert.deepStrictEqual(D.parseDump(dump('b01-L-f1-1k-fine5-bw20-g-6.syx')).programs[8][0][0], { mode: 1, freq: 17, fine: 5, bw: 20, gain: -6 });
assert.strictEqual(D.parseDump([0xF0, 0xF7]), null);
console.log('ok');
