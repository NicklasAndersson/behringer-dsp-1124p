# Behringer DSP1124P – Web MIDI-panel

En webbsida som styr Behringer Feedback Destroyer Pro DSP1124P över MIDI: läge, frekvens,
fine, bandbredd och gain för alla 2 × 12 filter, plus programbyte. Den visar också en
beräknad EQ-kurva. Allt ligger i en enda HTML-fil, utan bygge och utan beroenden.

**Öppna:** https://nicklasandersson.github.io/behringer-dsp-1124p/

Kräver Chrome eller Edge (Web MIDI) och ett MIDI-interface.

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
4. Ändringar hamnar i enhetens arbetsminne (STORE-lampan blinkar). Spara på enheten:
   tryck **STORE**, välj program med jog-hjulet och tryck **STORE** igen.

Panelen kan inte läsa av enheten. Den visar det du senast skickat, inte vad som finns i programmet.

## Begränsningar

- **Couple** kopierar hela den aktiva motorn till den andra (provat). Använd Vänster/Höger om du inte vill det.
- **Spara hit (CC 18)** fungerar bara med `S` = 1, och `S` nollställs varje gång enheten startas.
- In/Out provat mot lamporna, inte mot ljudet.
- EQ-kurvan är beräknad med en vanlig peak-EQ, inte mätt på enheten.
- Panelen väntar 300 ms mellan meddelanden. Snabbare än så tappade enheten värden.

## Filer

| Fil | Innehåll |
|-----|----------|
| `index.html` | panelen |
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
