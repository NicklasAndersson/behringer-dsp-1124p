# Metod: utforska en MIDI-pryl tillsammans med Claude

Det här är arbetssättet som fungerat bäst när vi kartlagt DSP1124P. Det passar alla
prylar som tar emot eller sänder MIDI: CC, programbyte och SysEx.

Grundidén är att dela upp jobbet. **Claude skickar och läser loggen. Du trycker på
knapparna och läser av displayen.** En lyssnare loggar hela tiden allt prylen sänder,
så Claude ser själv vad som hände och du behöver inte kopiera loggar.

## Uppkoppling

1. Interfacets MIDI **OUT** → prylens MIDI **IN** (för att skicka).
2. Prylens MIDI **OUT** → interfacets MIDI **IN** (för att lyssna).
3. Ställ in prylens MIDI-meny så att den både tar emot och sänder CC, programbyte och SysEx.

Kontrollera kablar och interface med en loopback först: koppla interfacets OUT direkt
till dess IN och skicka något. Kommer det inte fram ligger felet i kablarna eller
interfacet, inte i prylen.

## Verktyg (`tools/`)

```sh
python3 -m venv venv && venv/bin/pip install mido python-rtmidi
venv/bin/python -c "import mido; print(mido.get_input_names(), mido.get_output_names())"
```

**Lyssnaren** körs i bakgrunden under hela sessionen:

```sh
venv/bin/python tools/midilog.py "AudioBox USB" session/
```

- `session/midi.log`: varje meddelande med datum och tid (millisekunder).
- `session/dumps/dump-ÅÅÅÅMMDD-HHMMSS.syx`: varje SysEx som egen fil.

**Sändaren** skickar en sekvens med paus emellan (300 ms som standard):

```sh
MIDI_PORT="AudioBox USB" venv/bin/python tools/midisend.py 12=1 10=0 16=42 pc=8
```

`N=V` är Control Change N med värdet V, `pc=P` är programbyte och `syx=fil.syx`
skickar en SysEx-fil. Kanalen sätts med `MIDI_CH` och pausen med `MIDI_DELAY`.

## Arbetsgången

Claude ger numrerade steg. Du gör dem och svarar kort, till exempel
**"steg 7 klar: 1.00, +5, 20, −6"**. Claude läser loggen, drar en slutsats och ger nästa steg.

Regler för stegen:
- **Ett steg är en handling och en observation.** Steget säger exakt vilken knapp som
  ska tryckas, vilken som ska hållas och hur många klick jog-hjulet ska vridas.
- **Säg vad som väntas.** "Det ska stå −6." Då syns en avvikelse direkt.
- **Läs av utan att ändra.** Skriv ut "vrid inte på jog-hjulet" när något bara ska läsas.
- **Vänta mellan handlingar** ("vänta 2 sekunder") så att varje handling hamnar på en egen tidsstämpel i loggen.
- **Små block.** Några steg i taget, sedan läser Claude loggen. Planen ändras efter vad som hände.
- **Lyssnaren får gärna vara tyst.** En tom logg efter ett knapptryck är också ett resultat
  ("enheten sänder inte när man trycker FREQUENCY").

## Testa så att svaret går att lita på

- **Skicka två olika värden.** Visar displayen −3 efter `CC 17 = 6` kan det vara det gamla
  värdet. Skicka `CC 17 = 0` och se att det blir −9. Först då vet du både att meddelandet
  tas emot och åt vilket håll skalan går.
- **Ett testprogram som får skrivas över.** Bestäm vilket i början och håll dig till det.
- **Säg till innan något skriver över** (spara, kopiera mellan kanaler, total bypass med PA på).
- **Skicka långsamt.** Börja med 300 ms mellan meddelanden. Snabbare kan tappa värden utan
  felmeddelande. Gå bara ned när det är bevisat att det fungerar.
- **Inställningar som nollställs vid start.** Kontrollera MIDI-menyn efter varje
  strömcykel (på DSP1124P nollställs `S`, Store Enable).
- **Manualen före gissningar.** Läs hela relevanta kapitlet. Det som inte står där är en hypotes tills den är provad.

## Avkoda SysEx med differensmetoden

1. Ta en dump som utgångsläge.
2. Ändra **en** parameter till ett känt värde, spara på prylen och dumpa igen.
3. Jämför dumparna byte för byte. Det som ändrats hör till parametern.
4. Upprepa med flera värden på samma parameter för att hitta kodningen.
5. Ta två dumpar utan ändring emellan för att se att dumpen är stabil.

Tips:
- **Sök på bitnivå, inte bara bytenivå.** MIDI-data är 7 bitar per byte, och fält kan
  ligga förskjutna. Gör om dumpen till en bitsträng (7 bitar per byte), bygg mönstret
  för de värden du skickade och sök på alla bitpositioner. På DSP1124P låg vänster motors
  filter 1 på byte 878, bit 1. Det syntes inte förrän vi sökte så.
- **Skilj på kanaler.** Om prylen har länkade lägen (Couple, stereo-link) ändras flera
  kopior samtidigt. Ändra en kanal i taget för att se vilken kopia som är vilken.
- **Spara dumparna i repot** med beskrivande namn (`b01-L-f1-1k-fine5-bw20-g-6.syx`) så
  att varje slutsats går att kontrollera igen.

## Dokumentera direkt

Skriv in varje fynd med datum i protokolldokumentet (här `docs/midi.md`) medan sessionen
pågår: vad som skickades, vad displayen visade, slutsats. Markera det som är overifierat,
och stryk det som visat sig fel i stället för att radera det.
