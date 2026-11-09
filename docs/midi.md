# DSP1124P – MIDI

Status: tabellen nedan är ur manualen (kap. 11.3, sida 22, "Tab. 11.4/11.5"). Kolumnen
"Verifierat" visar vad som provats mot enheten; resten är manualens uppgift. Källa: manualshelf.com-spegeln av
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
| 12 | Engine (Couple / Left / Right) | – | 0,1,2 | 1 → L, 2 → R (2026-11-08); 0 → Couple, kopierar aktiv motor till den andra (2026-11-09). Enheten sänder 1/2 vid tryck på ENGINE L/R |
| 13 | Frequency | 20 Hz..20 kHz | 0..30 (31 steg, troligen 1/3-oktav) | 4 → "50" i displayen (2026-11-08); ISO-index 20,25,31.5,40,50 |
| 14 | Fine (1/60 okt) | −9..+10 | 0..19 | Sänds vid vridning (2026-11-08); 14 → +5 (2026-11-09) |
| 15 | Bandwidth | 1..120 | 0..119 | 0 → 1, 11 → 12 (2026-11-08) |
| 16 | Gain (dB) | −48..+16 | 0..64 | 64 → +16, 36 → −12 (2026-11-08) |
| 17 | Feedback Sensitivity | −3..−9 | 0..6 | **Omvänd ordning:** 6 → −3, 0 → −9, alltså `värde = dB + 9` (2026-11-09) |
| 18 | Store | 1..10 | 0..9 | 8 → program 9 sparat, STORE slutar blinka, syns i dumpen (2026-11-09, `S`=1) |
| 19 | In/Out | – | 0..2 | 2 → lyser, 1 → släckt, 0 → blinkar (2026-11-09) |

LED-kolumnen i manualen: Engine 0/1/2 ↔ Couple/Left/Right; In/Out 2 = IN on,
1 = IN off, 0 = IN flashing. Enligt manualen kap. 4 (punkt 14) betyder släckt LED att
de parametriska filtren är bypassade, och blinkande LED Total Bypass (alla filter av).
Alltså 2 = aktiv, 1 = PA-bypass, 0 = total bypass. Lamporna provade 2026-11-09, ljudet inte.

Couple: manualen (kap. 4, punkt 9) säger att när man byter till Couple kopieras den aktiva
motorns parametrar till den andra. Att skicka `CC 12 = 0` kan alltså skriva över den andra
motorn helt. **Provat 2026-11-09:** höger filter 1 var OF; efter `CC 12 = 0`, `CC 12 = 2` visade
den 1.00 kHz och −6 dB som vänster. Ur Couple kom enheten inte med en ENGINE-knapp, men
väl med `CC 12 = 1`.

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
  svämma över. **Stämmer inte med våra försök:** 40 ms och 150 ms gav felaktiga
  avläsningar, 300 ms fungerade, och REW tar ca 1 s per filter. Panelen använder 300 ms.
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
> **Föråldrat:** punkterna om 7/8-kodning, checksumma och 28-byteperiod nedan bygger på
> uppackningen som visade sig vara fel väg (se "Avkodat" längre ned). Fälten ligger som
> 7-bitsbyte i råströmmen. Texten står kvar som historik.

- **7/8-kodning (2026-11-08):** payloaden är Behringers 7/8-kodning: varje grupp om 8 byte
  = 7 databyte (låga 7 bitar) + en åttonde byte med deras högsta bitar (bit 6 → första
  byten, bit 0 → sjunde). 1176 byte = 147 grupper → **1029 dekodade byte**. Algoritmen är
  hämtad från [behringerctl](https://github.com/Malvineous/behringerctl)
  (`algo/sevenEightCoder.js`, skriven för DEQ2496/FBQ1000, samma kodning passar här).
- ~~Sista byten = XOR-checksum~~ **Motbevisat:** sista payloadbyten (`4b`) är högbitsbyten
  i sista gruppen, inte en checksumma. Den är därför oförändrad när ett program ändras.
- **Ingen checksumma hittad.** `q01` och `m00` skiljer sig i exakt *en* dekodad byte
  (index 1010, `20`→`00`); en checksumma över den skulle ha ändrat en till. Testat som
  "prefix → nästa byte": behringerctl:s `checksumTZ` (firmwareblock), XOR, sum8, sum7 och
  negerad summa. Träffantalet (22) är på slumpnivå (~20 väntat). Dumpen verkar sakna
  skydd, men det är inte bekräftat mot ett meddelande som skickas *till* enheten.
  XOR-nyckeln `TZ'04` från behringerctl gäller firmwareskrivning och är inte testad vidare.
- Dekodad data har period **28 byte** (58 % lika byte på avstånd 28; 3–4 % på 16 och 32).
  De 32 som stod här tidigare var perioden i den kodade 7-bitsströmmen (32 = 28 × 8/7).
  Filterposter syns ca `0x350`–`0x3b0` (dekodade offset), nollfyllnad `0x3c0`–`0x3ef`,
  svans från `0x3f0` (där index 1010 = `0x3f2` ligger).
- Ännu **inte avkodat** vilka bitar som är frekvens/fine/bandbredd/gain/läge.

Nästa steg för att avkoda (differensmetoden): ändra *en* parameter åt gången på ett
sparat program, dumpa igen, och se vilka byte som ändras. Kom ihåg att dumpen troligen
visar sparade program, inte osparat arbetsminne – tryck STORE efter ändringen.

**Dumpen återspeglar sparade program, inte arbetsminnet.** Kräver Store Enable (`S`=1) för att
CC 18 ska spara. Med `S`=0 gav CC-ändringar + `CC 18=9` identiska dumpar (m00, m01).
Med `S`=1: program 10, filter 1 vänster, gain 36 → 40 (`CC 16`) + `CC 18=9` gav (`q01`).
**Rättat 2026-11-08:** de 8 ändrade råbytena nedan (filoffset) skiljer `dump-143801` från
`q01`/`m00`, *inte* `q01` från `m00-base` (de två skiljer i en enda byte, se ovan).
`dump-143801` är alltså ett äldre sparat tillstånd med andra filter; åtta-byte-skillnaden
säger inget om vad en gain-ändring gör. Offsets (filoffset, 7-bitsström):
@994 0b→01, @998 60→50, @1012 02→00, @1031 50→10,
@1049 16→06, @1067 05→01, @1085 41→40, @1159 01→05. Byte 1031/1049/1067/1085 ligger 18
byte isär. ~~Slutsatsen att gain-ändringen ger flera ändrade byte (koefficienter)~~ är
**inte belagd**: skillnaden gäller `dump-143801`, inte en kontrollerad gain-ändring.

**Läget efter mätserier (2026-11-08, inte löst):** sex dumpar (`dumps/`). Ändrar vi gain 36→37→64
eller frekvens index 4→5 på program 10 (filter 1, vänster) och skickar `CC 18=9` (med `S`=1 på enheten)
blir dumpen **byte för byte identisk**. Bara en tidigare lagring (`q01`, gain 40) ändrade 8 byte mot
första dumpen, och `m00` skilde sig från `q01` i ett byte (@1161). Alltså: antingen sparar `CC 18`
inte som tänkt vid upprepade försök, eller så ligger gain/frekvens för det filtret inte i de byte vi
jämfört. Praktiskt: `d` återställs till 0 efter varje dump och måste sättas till 2 före nästa STORE;
`S` verkade stanna på 1. Avkodning kräver fler kontrollerade mätningar med manuell lagring.

Slutsats i efterhand (2026-11-08): a-serien, sparad med STORE-*knappen*, ändrade dumpen
varje gång. m-serien, sparad med `CC 18`, ändrade den aldrig. Det tyder på att `CC 18` inte
sparade, inte på att fälten ligger någon annanstans. Orsaken är okänd (kanske `S`, kanske
programnumret). Panelens spara-knapp (CC 18) är därför overifierad.

### Avkodat: gain och frekvens (2026-11-08, `dumps/a00..a13`)

**Rättelse:** 7/8-uppackningen ovan är sannolikt fel väg. Fälten ligger som egna **7-bitsbyte
i råströmmen** (payload efter `F0 00 20 32 00 08 0F`, index räknat i råbyte). Posterna är
**32 råbyte** (det som såg ut som 28 uppackade). Att gain tidigare hamnade på "uppackat
index 819" var en slump i gruppindelningen.

Mätserie: program 9 (STORE skickar `CC 18 = 8`), filter 1, en ändring i taget, sparat med
STORE-knappen:

| Fält | Råbyte (payload) | Kodning | Verifierat |
|------|------------------|---------|------------|
| Gain | 936 | `dB + 48` (samma som CC 16) | −7→41, −6→42, −4→44 |
| Frekvens + fine (+ läge) | 933:934 (14 bitar, hög byte först) | `40 × ISO-index + 2 × fine`, **+ 8192 (bit 13) i läge PA** | PA, fine −9, idx 4–7 = 8334, 8374, 8414, 8454; fine −9→−8 = 8334→8336; PA→OF: 8336→144 |
| Bandbredd | 935 | `bw − 1` (samma som CC 15) | 21→20, 22→21, 30→29 |
| Kopia av fälten ovan | 878–882 | samma 28 bitar (frekv 14 + bw 7 + gain 7), **förskjutna 1 bit** | alla 19 dumpar i `dumps/` |

- Enhet 1/120 oktav: 40 = 1/3 oktav (ISO-steg), 2 = 1/60 oktav (fine). Bit 13 (= bit 6 i råbyte 933) är en lägesbit (satt i PA, noll i OF). Lägesfältet kan vara två bitar; SI/AU ej mätta.
- PA→OF (a12→a13) ändrade även gain-byten 44→48 (= 0 dB): troligen tvingas gain till 0 i OF, en mätning.
- Dumpen är en ren funktion av inställningarna: a09 (tillbaka till 50 Hz/fine −9) = a05.
- Poster ligger på `32 × k`; filter 1 (i det här programmet) har frekvens på +5/+6 och gain på
  +8 från postens start (båda utgår från 928 = 29 × 32, antagande).
- Två dumpar utan ändring emellan (`a01`, `a02`) är identiska → dumpen är stabil.
- `a00` (före första sparning i program 9) skiljer sig från `a01` i 92 uppackade byte: det är
  platsens gamla innehåll mot första sparningen, inte en gain-ändring.
- **Bekräftat 2026-11-09 (`b01`):** bara vänster filter 1 ändrades (1 kHz, fine +5, bw 20, −6 dB).
  Värdena hittades på råbyte 878 bit 1 (8882, 19, 42), medan 933–936 var oförändrade.
  **878 bit 1 = vänster motor filter 1, 933 = höger motor filter 1.** I a-serien var programmet i
  Couple, därför ändrades båda. Samtidigt ändrades enskilda bitar i 877, 896, 914, 932, 950, 969
  (≈18 byte isär) och byte 1155 (0 → 48); okänt vad de är.
- **Rättat 2026-11-08:** 878–882 är *inte* beräknade koefficienter. Läser man råbyte 933–936
  som en 28-bitars bitström (frekvens 14, bw 7, gain 7 bitar) och förskjuter den en bit, får
  man exakt råbyte 878–882 (bit 6 i 878 och de låga 6 bitarna i 882 hör till grannfälten).
  T.ex. `881 = ((bw & 1) << 6) | (gain >> 1)`: bw-byte 21 → bit 6 = 1, gain 42 → 21. Det
  tidigare "motbevisandet" av bit 6 blandade ihop paritet (antal ettor) med minst signifikant bit.
  Kontrollerat med ett skript mot alla 19 dumpar: inga avvikelser.
- Vänster ligger 384 bitar (= 12 × 32) före höger: troligen 12 filter × 32 bitar per motor. Det betyder också att
  poster kanske inte ligger på jämna råbyte utan är bitpackade, så "poster på 32 × k" ovan
  gäller bara den här platsen.

## Saknas
- SysEx-format: gain, frekvens, fine, bandbredd och en lägesbit hittade för ett filter (se ovan); resten är oavkodat
- Vad de övriga bitarna i dumpen är (läge SI/AU, känslighet, In/Out, de andra filtren)
- Om enheten tar emot en dump (`d` = 1) och om den kräver något utöver fälten
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

### Testserie 2026-11-09 (lyssnare + numrerade steg, se `docs/metod.md`)

| Skickat | Avläst på enheten / i loggen | Slutsats |
|---------|------------------------------|----------|
| – (ENGINE L/R, FILTER SELECT + jog) | loggen: `CC 12 = 1/2`, `CC 10 = 1, 0` | Enheten sänder motor- och filterbyte |
| – (FREQUENCY, GAIN-knapp) | inget i loggen | Bara knapptryck sänder inget |
| `CC 12 = 1` (enheten i Couple) | bara L lyser | CC 12 tar enheten ur Couple, det gjorde inte ENGINE-knapparna |
| `12=1 10=0 11=1 13=17 14=14 15=19 16=42` | filter 1, 1.00, +5, 20, −6 | Hela filtersekvensen tas emot rätt |
| `CC 19 = 1 / 0 / 2` | IN/OUT släckt / blinkar / lyser | Som manualen |
| `CC 17 = 6`, sedan `0` | −3, sedan −9 | Skalan är omvänd mot antagandet |
| `CC 18 = 8` (`S` = 1) | STORE slutar blinka; dump `b01` visar värdena | CC 18 sparar |
| `CC 12 = 0`, `CC 12 = 2` | höger filter 1: 1.00, −6 (var OF) | Couple kopierar aktiv motor till den andra |
