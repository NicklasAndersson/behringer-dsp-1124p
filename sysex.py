# DSP1124P SysEx-hjälp: python3 -I sysex.py diff a.syx b.syx. Avkodning av dumpen: DSP.parseDump i map.js (testas av test.js).
# 7/8-kodning är från behringerctl (algo/), se docs/midi.md.
import sys

def dec78(b):  # 7 databyte + 1 högbitsbyte -> 7 riktiga bytes
    return bytes(b[i + j] | ((b[i + 7] << j << 1) & 0x80) for i in range(0, len(b), 8) for j in range(7))

def load(path):  # -> (header[7], dekodad payload)
    d = open(path, 'rb').read()
    assert d[0] == 0xF0 and d[-1] == 0xF7 and max(d[1:-1]) < 128, 'inte ett SysEx-meddelande'
    return d[:7], dec78(d[7:-1])

if __name__ == '__main__' and sys.argv[1:2] == ['diff']:  # python3 -I sysex.py diff a.syx b.syx
    a, b = load(sys.argv[2])[1], load(sys.argv[3])[1]
    for i in range(min(len(a), len(b))):
        if a[i] != b[i]: print(f'{i:4d} 0x{i:03x}  {a[i]:08b} -> {b[i]:08b}  (xor {a[i] ^ b[i]:08b})')
    print('lika' if a == b else '')
