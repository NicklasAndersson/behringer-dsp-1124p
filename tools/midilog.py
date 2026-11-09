# Lyssnare: loggar allt från en MIDI-inport tills den stoppas (Ctrl-C).
#   python midilog.py [inport] [katalog]
# Allt -> <katalog>/midi.log med tidsstämpel. Varje SysEx -> <katalog>/dumps/dump-ÅÅÅÅMMDD-HHMMSS.syx
# Utan inport: första porten. Lista portar: python -c "import mido; print(mido.get_input_names())"
import mido, os, sys, datetime
port = sys.argv[1] if len(sys.argv) > 1 else mido.get_input_names()[0]
D = sys.argv[2] if len(sys.argv) > 2 else '.'
os.makedirs(D + '/dumps', exist_ok=True)
log = open(D + '/midi.log', 'a', buffering=1)
now = lambda f='%Y-%m-%d %H:%M:%S.%f': datetime.datetime.now().strftime(f)
log.write(f'{now()[:-3]} start, port {port}\n')
with mido.open_input(port) as i:
    for m in i:
        if m.type == 'sysex':
            fn = f'dumps/dump-{now("%Y%m%d-%H%M%S")}.syx'   # ponytail: två dumpar samma sekund skriver över
            open(f'{D}/{fn}', 'wb').write(bytes([0xF0, *m.data, 0xF7]))
            log.write(f'{now()[:-3]} SYSEX {len(m.data) + 2} B -> {fn}\n')
        else:
            log.write(f'{now()[:-3]} {m}\n')
