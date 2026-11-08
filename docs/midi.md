# DSP1124P – MIDI

Status: **tabellen nedan är ur manualen (kap. 11.3, sida 22, "Tab. 11.4/11.5") och
ännu inte verifierad mot enheten.** Källa: manualshelf.com-spegeln av
manual Rev. A (`DATA-MANFULL_DSP1124P_ENG_Rev. A`). Ingen PDF hämtad – speglarna
(manualslib, manualowl, manuallib) blockerar nedladdning.

## Hårdvara
- MIDI: 5-pol DIN, IN / OUT / THRU
- 2 × 12 filter (Engine/"Couple": vänster, höger), 24-bit, 10 presets

## Implementeringstabell (Tab. 11.4)

| Funktion | Skickar | Tar emot |
|----------|---------|----------|
| Basic channel | OFF, 1–16 (minns) | OFF, 1–16 (minns) |
| Mode | X | X |
| Note/Velocity/Aftertouch/Pitch bend | X | X |
| Control Change | **O, 10–19** | **O, 10–19** (se nedan) |
| Program Change | O (0–9) = program 1–10 | O (0–9) = program 1–10 |
| System Exclusive | **O** | **O** |
| System common/realtime/aux | X | X |

SysEx finns alltså på enheten, men manualen säger inget om formatet → måste
sniffas (se testlogg).

## Control Change (Tab. 11.5)

| CC | Parameter | Visat område | CC-värde | Verifierat |
|----|-----------|--------------|----------|------------|
| 10 | Filter Select | 1..12 | 0..11 | 0 → filter 1 (2026-11-08) |
| 11 | Filter Mode | OF, PA, AU, SI | 0..3 | 1 = PA (2026-11-08) |
| 12 | Engine (Couple / Left / Right) | – | 0,1,2 | – |
| 13 | Frequency | 20 Hz..20 kHz | 0..30 (31 steg, troligen 1/3-oktav) | 4 → "50" i displayen (2026-11-08); ISO-index 20,25,31.5,40,50 |
| 14 | Fine (1/60 okt) | −9..+10 | 0..19 | – |
| 15 | Bandwidth | 1..120 | 0..119 | 0 → 1, 11 → 12 (2026-11-08) |
| 16 | Gain (dB) | −48..+16 | 0..64 | 64 → +16, 36 → −12 (2026-11-08) |
| 17 | Feedback Sensitivity | −3..−9 | 0..6 | – |
| 18 | Store | 1..10 | 0..9 | – |
| 19 | In/Out | – | 0..2 | – |

LED-kolumnen i manualen: Engine 0/1/2 ↔ Couple/Left/Right; In/Out 2 = IN on,
1 = IN off, 0 = IN flashing (att verifiera).

Antaganden att testa:
- Gain: `värde = dB + 48` (65 steg, 1 dB/steg).
- Bandwidth: `värde = bw − 1`. Enhet okänd (manualen skriver bara 1..120).
- Fine: `värde = fine + 9`.
- Frequency: index 0..30 → 20, 25, 31.5 … 20k Hz (sidan 21 listar banden).
- Modellen är **valj filter (CC10) → ändra parameter**: CC 11–17 gäller sannolikt
  det filter som senast valts med CC 10 och motorn från CC 12. Verifiera.

## MIDI-menyn på enheten (manual kap. 9, sida 17–18)

Öppna: håll **IN/OUT + STORE** samtidigt. IN/OUT = nästa sida, STORE = föregående,
JOG WHEEL ändrar värdet. Sjätte sidan lämnar menyn (eller valfri annan knapp).

| Sida | Display | Inställning | Värden |
|------|---------|-------------|--------|
| 1 | `c` | MIDI-kanal | 1–16, `-` (=0) = MIDI av |
| 2 | `O` | Omni (tar emot/sänder på alla kanaler) | 0/1 |
| 3 | `C` | Controller-läge | 0 ingen, 1 bara mottag, 2 bara sänd, **3 båda**, 4 som 3 + automatiska filtervärden |
| 4 | `P` | Program Change-läge | 0 ingen, 1 mottag, 2 sänd, 3 båda |
| 5 | `S` | Store Enable | 0/1; 1 = CC 18 sparar direkt |
| 6 | `d` | SysEx (dump) | 0 av, 1 kan ta emot, 2 dumpar hela minnet |

För sonden: kanal ≠ `-`, **C = 3** (eller 4), och för minnesdump **d = 2**.

## Uppgifter ur en pastead rapport (overifierat, ej manualen)

Källa: AI-genererad rapport som Nicklas klistrade in 2026-11-08. Manualen är facit;
detta är hypoteser att testa med `probe.html`.

- **Pekararkitektur:** CC 11–17 gäller det filter/den motor som senast valts med
  CC 12 / CC 10. Sekvens: `CC12 → CC10 → CC11 → CC13 → CC14 → CC15 → CC16 → (CC18)`.
- **Skalor (stämmer med manualens områden):** Gain `värde = dB + 48`; Fine
  `värde = fine + 9`; Bandwidth `värde = b − 1` (b i 1/60 oktav, 1..120);
  Frequency = index i de 31 ISO-tersbanden 20 Hz..20 kHz.
- **Motsägelse – Engine (CC 12):** rapporten säger 0 = Left, 1 = Right, 2 = Couple.
  Manualens kolumnordning "Couple, Left, Right" ger istället 0 = Couple, 1 = Left,
  2 = Right. **Testa:** skicka CC 12 = 0/1/2 och se vilken motor som ändras.
- **Store Enable (`S`-sidan):** rapporten påstår att den nollställs vid varje
  omstart. Manualen säger bara att CC 18 då sparar direkt. Kolla efter strömcykel.
- **SysEx:** rapporten anger `F0 00 20 32 <device id> <model id> … F7`, bulk-dump av
  alla 10 program, startas på `d`-sidan genom läge 2 + STORE, med 8→2×4-bitars
  packning och att ljudet tystnar under dumpen. Device/Model-ID anges inte –
  **sniffa dumpen** (sätt `d` = 2, tryck STORE, spara loggen i sonden).
- **Fördröjning:** 20–50 ms mellan CC-meddelanden, annars kan enhetens buffert
  svämma över. Sonden använder 50 ms i svepet.
- **Q-formel:** `Q = √(2^N)/(2^N − 1)`, `N = b/60`. Ger Q ≈ 86,5 vid b=1 och
  ≈ 0,667 vid b=120. Verifiera mot enhetens kurva innan vi ritar EQ-kurvan med den.
- **Samplingsfrekvens 46,875 kHz:** stämmer med manualens tekniska data.
- **IN/OUT-lampan** ska blinka kort vid varje giltigt mottaget MIDI-meddelande
  (bra första test att kommunikationen når enheten).

## Frontpanelen (manual kap. 4 och 7) – för att läsa av vad MIDI gjort

Knappar: FILTER SELECT, FILTER MODE, ENGINE L, ENGINE R, FREQUENCY, FINE,
BANDWIDTH, GAIN, IN/OUT, STORE + jog-hjul. Två motorer (L/R), 12 filter var.

- Motor: ENGINE L / ENGINE R (båda samtidigt = Couple, båda LED tända). Aktiv
  motor visas med ENGINE-LED. Couple kopierar aktiv motors parametrar till den andra.
- Välj filter: tryck FILTER SELECT, vrid jog-hjulet (1–12).
- Läs av: tryck FREQUENCY / FINE / BANDWIDTH / GAIN. Enhetsindikatorer: Hz, kHz, 1/60, dB.
  Gain visas med +/−. Vrid *inte* jog-hjulet efteråt – det ändrar värdet.
- Redigera kräver läge PA (håll FILTER MODE ca 1 s). SI/AU går bara att läsa.
- STORE-LED blinkar när något är ändrat och osparat. IN/OUT-LED blinkar vid mottagen MIDI.
- Standardprogram (display `--`): alla filter PA, bandbredd 1 oktav, 500 Hz, 0 dB.

## Befintliga program (sökning 2026-11-08)

Ingen öppen kod hittad (GitHub-sökning gav inget). Vad som finns:
- **Room EQ Wizard** (stängd källkod): skriver filter till DSP1124P via enbart CC,
  bara MIDI OUT behövs. Dokumenterad setup: kanal 1, `C` = 3, `P` = 3, `S` = 1
  ([bfdcomms](https://www.roomeqwizard.com/help/help_en-GB/html/bfdcomms.html)). Skriver
  **ca 1 sekund per filter**, vilket stämmer med att vi tappade meddelanden vid 40 ms.
  Store Enable (`S`) nollställs vid uppstart, så den måste sättas till 1 efter varje start.
- **Behringers "Feedback Destroyer Design Editor"** (Windows, officiell, gratis på
  behringer.com enligt manualen) och **NU9N:s DSP1100/1124P-program** (Windows .exe,
  okänd härkomst, ej nedladdat). De kan läsa/skriva hela enheten, alltså finns det
  ett SysEx-format. Det går att fånga med en MIDI-monitor under Windows om vi behöver.

## SysEx-dump (fångad 2026-11-08, `dumps/dump-143801.syx`)

`d` = 2 på MIDI-menyns sida 6, tryck STORE → enheten sänder **ett** SysEx-meddelande.

- Längd: **1184 byte** totalt (F0 … F7). Alla databyte < 128.
- Huvud: `F0 00 20 32 00 08 0F` = Behringer-ID `00 20 32`, device `00`, model `08`
  (antaget), kommando `0F` (antaget: dump). Därefter 1176 byte payload, sedan `F7`.
- ~~Sista byten = XOR-checksum~~ **Motbevisat 2026-11-08:** efter att ett sparat program
  ändrats (8 byte skiljer, se nedan) är sista byten oförändrad, trots att XOR av
  ändringarna inte är noll. Att den matchade första gången var en slump (1/128).
  Checksumman, om det finns någon, är okänd.
- Payloaden har tydlig periodicitet på **32 byte** (62 % lika byte på avstånd 32).
  Standardfilter upprepas identiskt, så strukturen är bitpackad per filter.
- Ännu **inte avkodat** vilka bitar som är frekvens/fine/bandbredd/gain/läge.

Nästa steg för att avkoda (differensmetoden): ändra *en* parameter åt gången på ett
sparat program, dumpa igen, och se vilka byte som ändras. Kom ihåg att dumpen troligen
visar sparade program, inte osparat arbetsminne – tryck STORE efter ändringen.

**Dumpen återspeglar sparade program, inte arbetsminnet.** Kräver Store Enable (`S`=1) för att
CC 18 ska spara. Med `S`=0 gav CC-ändringar + `CC 18=9` identiska dumpar (m00, m01).
Med `S`=1: program 10, filter 1 vänster, gain 36 → 40 (`CC 16`) + `CC 18=9` gav (`q01`)
8 ändrade byte mot `m00-base`: @994 0b→01, @998 60→50, @1012 02→00, @1031 50→10,
@1049 16→06, @1067 05→01, @1085 41→40, @1159 01→05. Byte 1031/1049/1067/1085 ligger 18
byte isär. Att en gain-ändring ger flera ändrade byte tyder på att dumpen även
innehåller beräknade filterkoefficienter, inte bara parametervärden. Obekräftat –
användaren kan också ha vridit på enheten under fångsten (enheten sände 4 CC).

**Läget efter mätserier (2026-11-08, inte löst):** sex dumpar (`dumps/`). Ändrar vi gain 36→37→64
eller frekvens index 4→5 på program 10 (filter 1, vänster) och skickar `CC 18=9` (med `S`=1 på enheten)
blir dumpen **byte för byte identisk**. Bara en tidigare lagring (`q01`, gain 40) ändrade 8 byte mot
första dumpen, och `m00` skilde sig från `q01` i ett byte (@1161). Alltså: antingen sparar `CC 18`
inte som tänkt vid upprepade försök, eller så ligger gain/frekvens för det filtret inte i de byte vi
jämfört. Praktiskt: `d` återställs till 0 efter varje dump och måste sättas till 2 före nästa STORE;
`S` verkade stanna på 1. Avkodning kräver fler kontrollerade mätningar med manuell lagring.

## Saknas
- SysEx-format (finns, men odokumenterat; `d`-läge 2 dumpar hela minnet)
- Om enheten sänder CC vid vridning/tryck (C = 2/3/4 ska göra det)
- Exakt bandwidth-enhet

## Testlogg
Kör `probe.html`, ändra en parameter på enheten och anteckna vad som loggas:

| Datum | Åtgärd på enheten | Mottaget | Slutsats |
|-------|-------------------|----------|----------|
| 2026-11-08 | Vred på jog-hjulet, Fine-parametern | `B0 0E 0A`, `B0 0E 0B`, `B0 0E 0C` (CC 14 = 10, 11, 12) | **Sändning verifierad:** CC 14 = Fine, kanal 1, värde 9 = 0 offset enligt manualen |
| 2026-11-08 | Vred, Frequency-parametern | `B0 0D 05`, `B0 0D 06` (CC 13 = 5, 6) | CC 13 = Frequency (ISO-index) verifierad |
| 2026-11-08 | Skickade CC 12,10,11,13,14,15,16 (0,0,1,4,9,11,36), 40 ms mellanrum | STORE- och IN/OUT-lamporna blinkade | **Mottagning fungerar** (osparad ändring i arbetsminnet). Värdena på filter 1 ännu ej avlästa |
| 2026-11-08 | CC 10=0, 11=1, 15=0, 16=64 (300 ms) | Display: bandbredd 1, gain +16 | CC 15/16 verifierade |
| 2026-11-08 | CC 10=0, 11=1, 15=11, 16=36 (300 ms) | Display: bandbredd 12, gain −12 | Skalorna `b−1` och `dB+48` verifierade |

Felsökningsnotering: tidigare 0 mottaget berodde på interfacet (AudioBox USB), inte
koden. Loopback OUT→IN på interfacet gav 7/7 först efter omkoppling; i första
körningen efteråt försvann de två första meddelandena.

Oförklarat: den första sekvensen (40 ms) och en omkörning av CC 15/16 (150 ms) gav
bandbredd 60 / gain 0 på avläsningen, trots att CC 13 kom fram. Misstänkt orsak:
tappade meddelanden vid snabb sändning, eller att ENGINE L+R trycktes ihop
(Couple kopierar aktiv motors värden till den andra). Använd ≥300 ms mellan CC
tills det är utrett.
