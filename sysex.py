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

def globals_(path):  # svansen: 8-bitarsgrupper från payloadbit 8067, värdet = de fem översta bitarna (2026-11-09)
    d = open(path, 'rb').read(); b = ''.join(f'{x:07b}' for x in d[7:-1])[8067:]
    v = [int(b[8 * j:8 * j + 5], 2) for j in range(8)]
    return dict(active=v[0], inout=(v[1] + 1) % 4, fb=v[3], c=v[4], omni=v[5], C=v[6], P=v[7], okand=v[2])  # inout/fb = CC 19/CC 17-värden

def filters(path):  # -> {(program 1-10, motor 0=V/1=H, filter 1-12): (läge 0=OF 1=PA 2=AU 3=SI, ISO-index, fine, bw, gain dB)}
    # Råa 7-bitsbyte, 32 bitar per post från s-1: läge 2 (bit s-1 och bit 13 i frekvensfältet), frekvens 13, bw-1 7, gain+48 7, 3 bitar noll (LSB i frekvensfältet oförklarad).
    # Program 1-10 ligger 768 bitar isär (verifierat 2026-11-09, dumps/e01).
    d = open(path, 'rb').read(); bits = ''.join(f'{b:07b}' for b in d[7:-1]); out = {}
    for p in range(10):
        for e in range(2):
            for k in range(12):
                s = 3 + 768 * p + 384 * e + 32 * k
                u = int(bits[s:s + 14], 2); u2 = (u & 8191) >> 1; r = u2 % 20
                idx, fine = (u2 // 20 + 1, r - 20) if r > 10 else (u2 // 20, r)
                out[p + 1, e, k + 1] = (int(bits[s - 1]) * 2 + (u >> 13), idx, fine, int(bits[s + 14:s + 21], 2) + 1, int(bits[s + 21:s + 28], 2) - 48)
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
    g = lambda n: globals_(os.path.join(D, n))
    assert g('e00-backup-fore-p1-8.syx') == dict(active=10, inout=2, fb=3, c=1, omni=1, C=3, P=3, okand=3)
    assert (g('f01-meny-c2-O1-C4-P2.syx')['c'], g('f01-meny-c2-O1-C4-P2.syx')['C'], g('f01-meny-c2-O1-C4-P2.syx')['P']) == (2, 4, 2)
    assert (g('f02-fb-cc17-0.syx')['fb'], g('f03-inout-cc19-0.syx')['inout']) == (0, 0)
    assert [filters(os.path.join(D, n))[10, 0, 12][0] for n in ('g00-lage-OF-p10-L12.syx', 'g01-lage-AU-p10-L12.syx', 'g02-lage-SI-p10-L12.syx')] == [0, 2, 3]
    e = filters(os.path.join(D, 'e01-program1-8-testvarden.syx'))  # 31 av 32 testfilter; p7 H f12 klämdes av enheten
    for pr in range(1, 9):
        for m in (1, 2):
            for k in (1, 12):
                s = pr + (3 if m == 2 else 0) + (5 if k == 12 else 0)
                want = (True, (s * 2 + 1) % 31, (s + pr) % 20 - 9, 11 + s * 5, 16 + s * 3 - 48)
                if (pr, m, k) == (7, 2, 12): want = want[:2] + (0,) + want[3:]   # 20 Hz, fine -7 klämdes till 0
                assert e[pr, m - 1, k] == want, (pr, m, k)
    assert filters(os.path.join(D, 'b01-L-f1-1k-fine5-bw20-g-6.syx'))[9, 0, 1] == (True, 17, 5, 20, -6)
    print('ok')
