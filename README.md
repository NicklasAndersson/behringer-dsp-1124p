# Behringer DSP1124P – Web MIDI-panel

En webbsida som styr Behringer Feedback Destroyer Pro DSP1124P över MIDI: läge, frekvens,
fine, bandbredd och gain för alla 2 × 12 filter, plus programbyte. Den visar också en
beräknad EQ-kurva. Allt ligger i en enda HTML-fil, utan bygge och utan beroenden.

**English:** A single-file web page that controls and reads a Behringer Feedback Destroyer Pro DSP1124P over Web MIDI:
mode, frequency, fine, bandwidth and gain for all 2 × 12 filters, program change, store and reset, a calculated EQ curve,
a live L/R level meter, and a read-out of all ten stored programs via SysEx. Needs Chrome or Edge and a MIDI interface.

**Deutsch:** Eine einzelne Webseite, die einen Behringer Feedback Destroyer Pro DSP1124P über Web MIDI steuert und ausliest:
Modus, Frequenz, Fine, Bandbreite und Gain für alle 2 × 12 Filter, Programmwechsel, Speichern und Zurücksetzen, eine berechnete
EQ-Kurve, ein Live-Pegelmesser für L/R und das Auslesen aller zehn gespeicherten Programme per SysEx. Benötigt Chrome oder Edge und ein MIDI-Interface.

**Öppna:** https://nicklasandersson.github.io/behringer-dsp-1124p/

Kräver Chrome (eller Edge) och ett MIDI-interface. Läsningen från enheten (SysEx) fungerade inte i Firefox; Safari saknar Web MIDI.

## Koppla in

1. Interfacets MIDI **OUT** → enhetens MIDI **IN**. Det räcker för att skicka.
2. Vill du att panelen ska se när du vrider på enheten: enhetens MIDI **OUT** → interfacets MIDI **IN**.

## Ställ in enheten (en gång)

MIDI-menyn: håll **IN/OUT** och **STORE** intryckta samtidigt. Båda lamporna blinkar och
displayen visar `c`. **IN/OUT** går till nästa sida, **STORE** till föregående och
**jog-hjulet** ändrar värdet.

| Sida | Display | Sätt till | Så här |
|------|---------|-----------|--------|
| 1 | `c` | `1` | vrid jog-hjulet till 1 (MIDI-kanal) |
| 2 | `O` | låt vara | tryck **IN/OUT** |
| 3 | `C` | `3` | tryck **IN/OUT**, vrid till 3 (sänd och ta emot CC) |
| 4 | `P` | `3` | tryck **IN/OUT**, vrid till 3 (programbyte åt båda håll) |
| 5 | `S` | `1` om du vill spara via MIDI | tryck **IN/OUT**, vrid till 1 |
| 6 | `d` | `0` | tryck **IN/OUT** |

Tryck **IN/OUT** en gång till på sida 6 för att lämna menyn (alla andra knappar fungerar också).
Inställningarna sparas i enheten, utom `S`, som nollställs varje gång enheten startas.

## Använda panelen

1. Välj ut- och inport, kanal 1, och tryck **Anslut**.
2. Välj motor (Vänster / Höger).
3. Ändra ett värde i tabellen. Det skickas när du släpper reglaget. **Skicka filter**
   skickar alla värden för raden.
4. Ändringar hamnar i enhetens arbetsminne (STORE-lampan blinkar). Spara med knappen
   **Spara hit** (`CC 18`, verifierat 2026-11-09 på program 9 och 10), eller på enheten:
   tryck **STORE**, välj program med jog-hjulet och tryck **STORE** igen.

**Hämta allt från enheten** (kräver In-port, frågar efter SysEx-tillstånd) körs också automatiskt vid **Anslut**. Den hämtar
alla tio sparade program, aktivt program, In/Out och feedback. Osparade ändringar (STORE-lampan blinkar) syns inte i läsningen.
**Visa program** bläddrar bland de tio programmen utan att röra enheten; redigering går bara på det program som är aktivt på enheten.
**Byt program på enheten (PC)** byter program på enheten. **Nollställ program** sätter alla 24 filter i valt program
till OF, 500 Hz, fine 0, bandbredd 60, 0 dB och sparar (`CC 18`, kräver `S` = 1; tar ca 1 minut).
**Kopiera** kopierar hela motorn (Vänster ↔ Höger, via Couple på enheten), ett enskilt filter (aktivt program, sparas inte) eller ett helt program till ett annat
programnummer (skriver bara de filter som skiljer sig, sparar med `CC 18`, kräver `S` = 1, enheten byter program).
**Säkerhetskopia** sparar enhetens minne från senaste hämtningen som en `.syx`-fil. **Återställ från fil** skriver tillbaka filtren
via CC, bara i de program och filter som skiljer sig från enheten, och sparar (`CC 18`, kräver `S` = 1; några minuter). In/Out och feedback återställs inte.
**Nivå** (kryssrutan *Live-mätare*, kräver In-port) visar två staplar L och R med åtta segment som på displayen,
efter filtren. Frågar enheten fem gånger i sekunden och bara när sändkön är tom.
Efter läsningen följer panelen det du skickar och det enheten sänder.

## RoomEQ-import (stereo)

Exportera från [pierreaubert/autoeq](https://github.com/pierreaubert/autoeq) med
`roomeq --export-format rew` (övriga argument enligt din RoomEQ-konfiguration).
REW-exporten stöder en kanal per fil: gör en export för vänster och en för höger.

1. Välj filerna i **Importera RoomEQ**, Vänster respektive Höger. En ensam fil ändrar endast den sidan.
2. Granska båda tabellerna: källans Hz/dB/Q och apparatens avrundade Hz/dB/bandbredd.
3. Ställ in eventuell preampnivå före apparaten och kryssa i bekräftelsen. Olika nivåer kräver separat gain per kanal.
4. Anslut MIDI, visa aktivt program och tryck **Skicka förhandsvisade filter**. Alla 12 filter på de valda sidorna ersätts; oanvända platser stängs av.
5. Vänta tills sändningen är klar. Använd **Spara hit** om du vill behålla programmet.

Endast 1–12 peak-filter (PK, ON/OFF) per fil godtas, inom 20–20000 Hz,
−48 till +16 dB och bandbredd 1–120/60 oktav. Frekvens väljs från panelens
ISO/fine-tabell, gain avrundas till hela dB och Q omvandlas till bandbredd.
Andra filtertyper, fördröjning och okända rader stoppas; en felaktig fil blockerar båda sidorna.
Importen använder den befintliga sändkön, utan Couple, programbyte eller automatisk lagring.
Format, omvandlingsmodell och kontrollresultat finns i [docs/roomeq.md](docs/roomeq.md).

## Begränsningar

- **Couple** kopierar hela den aktiva motorn till den andra. Panelen gör samma kopia i sin tabell när du ändrar något i Couple. Vrider du Couple på enheten själv, hämta från enheten efteråt.
- **Spara hit (CC 18)** fungerar bara med `S` = 1, och `S` nollställs varje gång enheten startas.
- In/Out provat mot lamporna, inte mot ljudet.
- EQ-kurvan är beräknad med en vanlig peak-EQ, inte mätt på enheten.
- Panelen väntar 300 ms mellan meddelanden. Snabbare än så tappade enheten värden.

## Nästa steg

- Osparat arbetsminne kan inte läsas via MIDI; STORE-lampan är den enda indikationen.

Protokollet och avkodningen av SysEx-dumpen står i `docs/midi.md`.

## Filer

| Fil | Innehåll |
|-----|----------|
| `index.html` | panelen |
| `roomeq.js` | läser RoomEQ:s REW-textexport och bygger filterkommandon |
| `map.js` | CC-nummer, värdeomvandling och EQ-beräkning |
| `probe.html` | MIDI-sond: skicka råa CC/PC/SysEx och logga det som kommer in |
| `test.js` | `node test.js` kontrollerar mappningen mot värden uppmätta på enheten |
| `docs/midi.md` | protokollet: manualens tabell, vad som är verifierat, SysEx-avkodning |
| `docs/dumps/` | fångade SysEx-dumpar (`.syx`) som avkodningen bygger på |
| `docs/metod.md` | arbetssättet för att utforska en MIDI-pryl steg för steg, fungerar för andra prylar |
| `tools/` | `midilog.py` (lyssnare som loggar allt och sparar SysEx) och `midisend.py` (sändare) |

## Lokalt

```sh
python3 -m http.server 8000   # öppna http://127.0.0.1:8000
node test.js                  # ska skriva "ok"
```

Inspirerad av [behringer-dsp-8000](https://github.com/NicklasAndersson/behringer-dsp-8000).
