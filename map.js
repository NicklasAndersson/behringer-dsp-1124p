// Värdemappning DSP1124P (docs/midi.md). Delas av index.html och test.js.
const DSP = {
  ISO: [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800,
        1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000],
  CC: { engine: 12, filter: 10, mode: 11, freq: 13, fine: 14, bw: 15, gain: 16, fb: 17, store: 18, inout: 19 },
  MODES: ['OF', 'PA', 'AU', 'SI'],
  // användarvärde -> CC-värde (verifierat mot enheten utom fb/inout)
  enc: { mode: m => m, freq: i => i, fine: f => f + 9, bw: b => b - 1, gain: db => db + 48, fb: s => -3 - s },
  dec: { mode: v => v, freq: v => v, fine: v => v - 9, bw: v => v + 1, gain: v => v - 48, fb: v => -3 - v },
  MAX: { mode: 3, freq: 30, fine: 19, bw: 119, gain: 64, fb: 6 },
  fmtHz: hz => hz >= 1000 ? hz / 1000 + ' kHz' : hz + ' Hz',
};
// användarvärde -> giltigt CC-värde (avrundat, klämt till 0..MAX), NaN om ogiltigt.
// Web MIDI kastar på databyte > 127 och låser då sändkön.
DSP.toCC = (p, u) => { const v = Math.round(DSP.enc[p](u)); return Number.isFinite(v) ? Math.max(0, Math.min(DSP.MAX[p], v)) : NaN; };
// EQ-kurva (OVERIFIERAD mot enheten): RBJ peaking-biquad, Q ur bandbredd i 1/60-oktav (b).
DSP.FS = 46875;
DSP.q = b => { const n = Math.pow(2, b / 60); return Math.sqrt(n) / (n - 1); };
DSP.centerHz = (iso, fine) => iso * Math.pow(2, fine / 60);
// |H| i dB vid frekvens f för ett filter {freq: ISO-index, fine, bw, gain}
DSP.peakDb = (flt, f) => {
  const f0 = DSP.centerHz(DSP.ISO[flt.freq], flt.fine), A = Math.pow(10, flt.gain / 40);
  const w0 = 2 * Math.PI * f0 / DSP.FS, al = Math.sin(w0) / (2 * DSP.q(flt.bw)), c = Math.cos(w0);
  const w = 2 * Math.PI * f / DSP.FS, c1 = Math.cos(w), s1 = Math.sin(w), c2 = Math.cos(2 * w), s2 = Math.sin(2 * w);
  const mag = (x0, x1, x2) => Math.hypot(x0 + x1 * c1 + x2 * c2, x1 * s1 + x2 * s2);
  return 20 * Math.log10(mag(1 + al * A, -2 * c, 1 - al * A) / mag(1 + al / A, -2 * c, 1 - al / A));
};
if (typeof module !== 'undefined') module.exports = DSP;
