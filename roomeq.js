// RoomEQ --export-format rew: en kanal, endast parametriska peak-filter.
(function () {
  function parse(text) {
    const rows = [], ids = new Set(); let channel = '', preamp = 0, seenPreamp = false;
    const num = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?';
    const filter = new RegExp(`^Filter\\s+(\\d+):\\s+(ON|OFF)\\s+PK\\s+Fc\\s+(${num})\\s+Hz\\s+Gain\\s+(${num})\\s+dB\\s+Q\\s+(${num})$`);
    for (const raw of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#') || line === 'Filter Settings file' || line === 'Equaliser: Generic') continue;
      if (line.startsWith('Channel:')) {
        if (channel || rows.length) throw Error('Importera en kanal per fil.');
        channel = line.slice(8).trim(); if (!channel) throw Error('Kanalnamn saknas.'); continue;
      }
      if (line.startsWith('Preamp:')) {
        const m = line.match(new RegExp(`^Preamp:\\s*(${num})\\s+dB$`));
        if (!m || seenPreamp || !Number.isFinite(+m[1])) throw Error('Ogiltig preampnivå.');
        preamp = +m[1]; seenPreamp = true; continue;
      }
      const m = line.match(filter);
      if (!m) throw Error('Raden stöds inte: ' + line);
      if (ids.has(m[1])) throw Error('Dubbelt filternummer: ' + m[1]); ids.add(m[1]);
      const hz = +m[3], gain = +m[4], q = +m[5];
      if (![hz, gain, q].every(Number.isFinite) || hz < 20 || hz > 20000 || gain < -48 || gain > 16 || q <= 0) throw Error('Filtervärde utanför DSP1124P:s område.');
      const bw = 120 * Math.asinh(1 / (2 * q)) / Math.LN2;
      if (bw < 0.5 || bw >= 120.5) throw Error('Q ger en bandbredd utanför 1–120/60 oktav.');
      let best, error = Infinity;
      DSP.ISO.forEach((iso, freq) => { for (let fine = -9; fine <= 10; fine++) {
        const delta = Math.abs(Math.log(DSP.centerHz(iso, fine) / hz));
        if (delta < error) { error = delta; best = { freq, fine }; }
      } });
      rows.push({ source: { id: +m[1], hz, gain, q }, filter: { mode: m[2] === 'ON' ? 1 : 0, ...best, bw: Math.round(bw), gain: Math.round(gain) } });
    }
    if (!rows.length || rows.length > 12) throw Error('Filen måste innehålla 1–12 peak-filter.');
    return { channel, preamp, rows };
  }
  // Ersätter alla 12 filter på EN motor, utan PC, Couple eller STORE.
  function ops(result, engine) {
    if (![1, 2].includes(engine)) throw Error('Välj Vänster eller Höger.');
    const filters = DSP.defaultProgram()[0]; result.rows.forEach((r, i) => filters[i] = { ...r.filter });
    return [['cc', DSP.CC.engine, engine], ...filters.flatMap((f, i) => DSP.filterOps(i, f))];
  }
  const api = { parse, ops };
  if (typeof module !== 'undefined') module.exports = api;
  else window.RoomEQ = api;
})();
