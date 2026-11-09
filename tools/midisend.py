# Sändare: skickar CC/PC/SysEx i ordning med paus emellan.
#   python midisend.py 12=1 10=0 16=42 pc=8 syx=fil.syx
#   MIDI_PORT=<utport> MIDI_CH=1 MIDI_DELAY=0.3 python midisend.py ...
# N=V = Control Change N med värde V, pc=P = Program Change, syx=fil = skicka SysEx-fil.
import mido, os, sys, time
port = os.environ.get('MIDI_PORT') or mido.get_output_names()[0]
ch = int(os.environ.get('MIDI_CH', 1)) - 1
delay = float(os.environ.get('MIDI_DELAY', 0.3))
with mido.open_output(port) as o:
    for a in sys.argv[1:]:
        k, v = a.split('=', 1)
        if k == 'syx': m = mido.Message('sysex', data=open(v, 'rb').read()[1:-1])
        elif k == 'pc': m = mido.Message('program_change', channel=ch, program=int(v))
        else: m = mido.Message('control_change', channel=ch, control=int(k), value=int(v))
        o.send(m); print('UT', m if k != 'syx' else f'sysex {v}', flush=True); time.sleep(delay)
