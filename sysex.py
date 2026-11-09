# DSP1124P SysEx-hjälp. python3 -I sysex.py kör självtesten mot docs/dumps.
# 7/8-kodning och checksumTZ är från behringerctl (algo/), se docs/midi.md.
import os, sys

def dec78(b):  # 7 databyte + 1 högbitsbyte -> 7 riktiga bytes
    return bytes(b[i + j] | ((b[i + 7] << j << 1) & 0x80) for i in range(0, len(b), 8) for j in range(7))

def enc78(d):
    out = bytearray()
    for i in range(0, len(d), 7):
        g = d[i:i + 7].ljust(7, b'\0'); hi = 0
        for x in g: out.append(x & 0x7F); hi = (hi << 1) | (x >> 7)
        out.append(hi)
    return bytes(out)

def tz(data):  # Behringers firmware-checksumma (INTE funnen i dumpen)
    crc = 0
    for b in data:
        for _ in range(8):
            if not ((b ^ crc) & 1): crc ^= 0x19
            b >>= 1; crc = ((crc & 1) << 7) | (crc >> 1)
    return crc ^ 0xbf

def load(path):  # -> (header[7], dekodad payload)
    d = open(path, 'rb').read()
    assert d[0] == 0xF0 and d[-1] == 0xF7 and max(d[1:-1]) < 128, 'inte ett SysEx-meddelande'
    return d[:7], dec78(d[7:-1])

def active(path):  # aktivt program 1-10: 4 bitar på payloadbit 8068 (mätt 2026-11-09 med PC 0-9 + begäran 4F)
    d = open(path, 'rb').read(); return int(''.join(f'{b:07b}' for b in d[7:-1])[8068:8072], 2)

def filters(path):  # -> {(program 1-10, motor 0=V/1=H, filter 1-12): (läge PA?, ISO-index, fine, bw, gain dB)}
    # Råa 7-bitsbyte, 32 bitar per filter: frekvens 14 (bit 13 = PA, LSB oanvänd), bw-1 7, gain+48 7, 4 bitar noll.
    # ponytail: program 1-10 antas ligga på samma avstånd (768 bitar), bara 9 och 10 kontrollerade.
    d = open(path, 'rb').read(); bits = ''.join(f'{b:07b}' for b in d[7:-1]); out = {}
    for p in range(10):
        for e in range(2):
            for k in range(12):
                s = 3 + 768 * p + 384 * e + 32 * k
                u = int(bits[s:s + 14], 2); u2 = (u & 8191) >> 1; r = u2 % 20
                idx, fine = (u2 // 20 + 1, r - 20) if r > 10 else (u2 // 20, r)
                out[p + 1, e, k + 1] = (bool(u >> 13), idx, fine, int(bits[s + 14:s + 21], 2) + 1, int(bits[s + 21:s + 28], 2) - 48)
    return out

if __name__ == '__main__' and sys.argv[1:2] == ['diff']:  # python3 -I sysex.py diff a.syx b.syx
    a, b = load(sys.argv[2])[1], load(sys.argv[3])[1]
    for i in range(min(len(a), len(b))):
        if a[i] != b[i]: print(f'{i:4d} 0x{i:03x}  {a[i]:08b} -> {b[i]:08b}  (xor {a[i] ^ b[i]:08b})')
    print('lika' if a == b else '')
elif __name__ == '__main__':
    D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'docs', 'dumps')
    p = lambda n: load(os.path.join(D, n))
    hdr, m0 = p('m00-base.syx')
    assert hdr.hex() == 'f0002032000 80f'.replace(' ', ''), hdr.hex()
    assert len(m0) == 1029
    assert enc78(m0) == open(os.path.join(D, 'm00-base.syx'), 'rb').read()[7:-1], 'enc78/dec78 ej varandras invers'
    assert all(p(n)[1] == m0 for n in ('m01-gain37.syx', 'm02-gain64.syx', 'm03-freq5.syx'))
    q = p('q01-after-gain40.syx')[1]
    assert [i for i in range(1029) if q[i] != m0[i]] == [1010] and (m0[1010], q[1010]) == (0x20, 0)
    assert tz(b'') == 0xbf
    c = filters(os.path.join(D, 'c01-alla-filter-p10.syx'))  # testvärden från 2026-11-09, se docs/midi.md
    for k in range(12):
        assert c[10, 0, k + 1] == (True, 2 * k + 3, k + 2 - 9, 11 + 7 * k, 20 + 3 * k - 48), k
        assert c[10, 1, k + 1] == (True, 29 - 2 * k, 19 - k - 9, 101 - 7 * k, 60 - 3 * k - 48), k
    assert (active(os.path.join(D, 'd00-aktivt-program-1.syx')), active(os.path.join(D, 'd09-aktivt-program-10.syx'))) == (1, 10)
    assert filters(os.path.join(D, 'b01-L-f1-1k-fine5-bw20-g-6.syx'))[9, 0, 1] == (True, 17, 5, 20, -6)
    print('ok')
