// Värdemappning DSP1124P (docs/midi.md). Delas av index.html och test.js.
const DSP = {
  ISO: [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800,
        1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000],
  CC: { engine: 12, filter: 10, mode: 11, freq: 13, fine: 14, bw: 15, gain: 16, fb: 17, store: 18, inout: 19 },
  MODES: ['OF', 'PA', 'AU', 'SI'],
  // användarvärde -> CC-värde (verifierat mot enheten; fb: CC 17=6 → −3, 0 → −9, 2026-11-09)
  enc: { mode: m => m, freq: i => i, fine: f => f + 9, bw: b => b - 1, gain: db => db + 48, fb: s => s + 9 },
  dec: { mode: v => v, freq: v => v, fine: v => v - 9, bw: v => v + 1, gain: v => v - 48, fb: v => v - 9 },
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
// SysEx: begäran om hela minnet (docs/midi.md, 2026-11-09) och avkodning av svaret (samma som filters()/active() i sysex.py).
DSP.REQ_DUMP = [0xF0, 0x00, 0x20, 0x32, 0x00, 0x08, 0x4F, 0xF7];
// d = hela SysEx-meddelandet (F0..F7). -> { active: 1..10, programs[0..9][motor 0=V,1=H][filter 0..11] = {mode, freq, fine, bw, gain} } eller null.
// mode: 0 = OF, 1 = PA, 2 = AU, 3 = SI (bit s-1 och översta frekvensbiten, samma tal som CC 11; AU/SI-etiketterna ur manualen, ej kontrollerade mot displayen).
DSP.parseDump = d => {
  if (d.length !== 1184 || [0xF0, 0, 0x20, 0x32, 0, 8, 0x0F].some((x, i) => d[i] !== x)) return null;
  let bits = ''; for (let i = 7; i < d.length - 1; i++) bits += (d[i] & 127).toString(2).padStart(7, '0');
  const programs = [];
  for (let p = 0; p < 10; p++) programs.push([0, 1].map(e => Array.from({ length: 12 }, (_, k) => {
    const s = 3 + 768 * p + 384 * e + 32 * k, u = parseInt(bits.substr(s, 14), 2), u2 = (u & 8191) >> 1, r = u2 % 20;
    const lo = r > 10 ? 1 : 0;
    return { mode: parseInt(bits[s - 1], 2) * 2 + (u >> 13), freq: Math.floor(u2 / 20) + lo, fine: r - 20 * lo, bw: parseInt(bits.substr(s + 14, 7), 2) + 1, gain: parseInt(bits.substr(s + 21, 7), 2) - 48 };
  })));
  const g = j => parseInt(bits.substr(8067 + 8 * j, 5), 2);   // svansen: 8-bitarsgrupper, värdet = fem översta bitarna
  // inout/fbL/fbR är CC 19/CC 17-värden (fbL = vänster motor, fbR = höger). c, omni, C, P = MIDI-menyn.
  return { active: g(0), inout: (g(1) + 1) % 4, fbL: g(2), fbR: g(3), c: g(4), omni: g(5), C: g(6), P: g(7), programs };
};
// Nollställ ett helt program (0..9): alla 24 filter OF, 500 Hz, fine 0, bw 60, 0 dB, sedan spara (CC 18, kräver S=1).
// Värdena sätts i PA och läget OF sist (OF kan spärra redigering). -> lista av ['pc', p] | ['cc', n, v] | ['delay', ms].
DSP.defaultProgram = () => [0, 1].map(() => Array.from({ length: 12 }, () => ({ mode: 0, freq: 14, fine: 0, bw: 60, gain: 0 })));
// Skriver program p (prog = [vänster[12], höger[12]]) via CC och sparar det (CC 18). cur = nuvarande innehåll: bara filter som skiljer sig skrivs; null = alla.
// Inget som ska skrivas -> []. Värdena sätts i PA och målläget sist (OF kan spärra redigering).
DSP.writeProgram = (p, prog, cur) => {
  const C = DSP.CC, m = [], same = (a, b) => ['mode', 'freq', 'fine', 'bw', 'gain'].every(k => a[k] === b[k]);
  for (const e of [0, 1]) {
    const todo = prog[e].map((f, k) => k).filter(k => !cur || !same(prog[e][k], cur[e][k]));
    if (!todo.length) continue;
    m.push(['cc', C.engine, e + 1]);
    for (const k of todo) {
      const f = prog[e][k];
      m.push(['cc', C.filter, k], ['cc', C.mode, 1], ['cc', C.freq, DSP.toCC('freq', f.freq)], ['cc', C.fine, DSP.toCC('fine', f.fine)],
             ['cc', C.bw, DSP.toCC('bw', f.bw)], ['cc', C.gain, DSP.toCC('gain', f.gain)]);
      if (f.mode !== 1) m.push(['cc', C.mode, f.mode]);
    }
  }
  return m.length ? [['pc', p], ['delay', 1500], ...m, ['cc', C.engine, 1], ['cc', C.store, p]] : [];
};
DSP.resetProgram = p => DSP.writeProgram(p, DSP.defaultProgram(), null);
// Nivåmätare (begäran 44, docs/midi.md): svaret är F0 00 20 32 00 08 04 + 8 byte + F7.
// L = byte0·128 + byte1 (13 bit, 8191 = 0 dB, mätt mot displayen). R = ((byte2 & 0x1f)·128 + byte3)·4 (R-fältet är 11 bit, 2047 = 0 dB; se docs/midi.md).
DSP.REQ_METER = [0xF0, 0x00, 0x20, 0x32, 0x00, 0x08, 0x44, 0xF7];
DSP.METER_DB = [-40, -30, -20, -15, -10, -6, -3, 0];            // åtta segment som på displayen; sista = clip
DSP.parseMeter = d => (d.length === 16 && [0xF0, 0, 0x20, 0x32, 0, 8, 0x04].every((x, i) => d[i] === x))
  ? { L: d[7] * 128 + d[8], R: ((d[9] & 0x1f) * 128 + d[10]) * 4 } : null;
DSP.meterDb = v => v > 0 ? 20 * Math.log10(v / 8191) : -Infinity;
DSP.meterSegments = v => { const db = DSP.meterDb(v); return DSP.METER_DB.map(t => db >= t - 1e-9); };   // clip tänds först vid 8191
if (typeof module !== 'undefined') module.exports = DSP;
