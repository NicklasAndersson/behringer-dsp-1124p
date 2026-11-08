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
console.log('ok');
