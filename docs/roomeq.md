# RoomEQ-import: format och validering

Formatet kontrollerat mot upstream `crates/roomeq-export/src/tests/make/formats.rs`
(`rew_export_is_single_channel_generic_eq_text_and_fails_closed`), 2026-11-10.
Exporten använder `Filter Settings file`, `Equaliser: Generic`, `Channel:`,
`Preamp:` och `Filter  1: ON PK Fc … Hz Gain … dB Q …`.

Ingen direktimport av result.json: REW-exporten är upstreams kontroll av att
kedjan går att uttrycka som en enda kanals parametriska filter. Importören
stoppar ytterligare behandling som DSP1124P inte kan representera.

Q -> bandbredd: 120*asinh(1/(2Q))/ln(2), avrundat till heltal.
Frekvensen väljs genom sökning i befintliga DSP.centerHz, ISO × 2^(fine/60).
Det återanvänder panelens modell, inte en ny kalibrering av apparaten.
Panelens biquadkurva och Q/bandbreddsmodell är ännu inte verifierade genom
akustisk/elektrisk mätning. Importerade filter behöver verifieras med en ny
mätning; test av MIDI-byte visar inte att frekvensgången matchar RoomEQ exakt.

`node test.js` omfattar upstream-format, omvandling, områdeskontroller,
felaktiga/okända rader, dubbla nummer, filterantal och stereokommandon utan
STORE/Couple. Webbläsartest använder simulerad Web MIDI-utport; ingen fysisk
DSP1124P är ansluten till denna miljö.

## Kontrollresultat 2026-11-10

- `node test.js`: `ok`.
- Chromium med Playwright och simulerad Web MIDI: godkänt. Två filer ger
  två förhandsvisningstabeller utan MIDI-trafik. Sändning adresserar motor 1
  och 2 utan Couple eller STORE. Felaktig högerfil blockerar hela importen.
- `git diff --check`: utan anmärkning.
- Fysisk överföring och uppmätt frekvensgång återstår att kontrollera.
