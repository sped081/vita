# « Nuit sur la 40 » : beat drill style 514, 140 BPM, fa mineur.
# Écrit les fichiers MIDI (à glisser dans FL Studio) et un aperçu audio (apercu.mp3).
# Usage : python3 generer.py   (demande numpy et ffmpeg)
import os, struct, subprocess, wave
import numpy as np

ICI = os.path.dirname(os.path.abspath(__file__))
BPM, PPQ, STEP = 140, 480, 120            # une double croche = 120 ticks
SR = 44100
SEC_STEP = 60 / BPM / 4

# ---------- la composition (pas de 1 à 16 dans chaque mesure) ----------
ACCORDS = [[65, 68, 72], [61, 65, 68], [58, 61, 65], [60, 64, 67]]     # Fm, Db, Bbm, C : 2 mesures chacun
B808 = [  # (mesure, pas, durée en pas, note)
    (1, 1, 8, 41), (1, 11, 4, 41), (1, 15, 3, 44),
    (2, 1, 6, 41), (2, 8, 4, 48), (2, 13, 4, 41),
    (3, 1, 8, 37), (3, 11, 4, 37), (3, 15, 3, 41),
    (4, 1, 6, 37), (4, 8, 4, 44), (4, 13, 4, 49),
    (5, 1, 8, 34), (5, 11, 4, 34), (5, 15, 3, 37),
    (6, 1, 6, 34), (6, 8, 4, 41), (6, 13, 4, 34),
    (7, 1, 8, 36), (7, 11, 4, 36), (7, 15, 3, 40),
    (8, 1, 6, 36), (8, 8, 4, 43), (8, 13, 4, 48),
]
MELODIE = []
for m0, phrase in [(1, [(1, 84), (4, 80), (7, 79), (9, 77), (12, 79), (13, 80), (15, 79)] + [(17, 77, 4), (23, 75), (25, 77), (27, 72, 6)]),
                   (3, [(1, 85), (4, 84), (7, 80), (9, 77), (12, 80), (13, 84), (15, 80)] + [(17, 77, 4), (23, 75), (25, 73), (27, 72, 6)]),
                   (5, [(1, 85), (4, 84), (7, 82), (9, 77), (12, 82), (13, 85), (15, 84)] + [(17, 82, 4), (23, 80), (25, 77), (27, 73, 6)]),
                   (7, [(1, 84), (4, 79), (7, 76), (9, 72), (12, 76), (13, 79), (15, 82)] + [(17, 80, 4), (23, 79), (25, 76), (27, 72, 6)])]:
    for n in phrase:
        pas, note = n[0], n[1]
        MELODIE.append((m0 + (pas - 1) // 16, (pas - 1) % 16 + 1, n[2] if len(n) > 2 else 2, note))
HATS = [1, 4, 7, 9, 12, 15]
def batterie(mesure):
    ev = []  # (pas fractionnaire, durée, note, vélocité)
    kick = {1: [1, 11], 2: [1, 8, 13], 3: [1, 11], 4: [1, 8, 13]}[(mesure - 1) % 4 + 1]
    ev += [(k, 1, 36, 120) for k in kick]
    ev += [(9, 1, 38, 118), (9, 1, 39, 90)]
    if mesure % 2 == 0: ev.append((16, 1, 38, 96))
    if mesure % 4 == 3: ev.append((12, 1, 38, 70))
    ev.append((7, 1, 38, 45))
    if mesure % 4 == 0:  # roulement de charleys en triolets de double croches sur la fin
        ev += [(h, 1, 42, 92) for h in [1, 4, 7, 9]]
        ev += [(12 + i * 2 / 3, 0.5, 42, 70 + i * 6) for i in range(7)]
    else:
        ev += [(h, 1, 42, 100 if h in (1, 9) else 82) for h in HATS]
    if mesure % 2 == 1: ev.append((6, 1, 37, 80))
    return ev

# ---------- MIDI ----------
def vlq(n):
    out = [n & 0x7F]; n >>= 7
    while n: out.insert(0, (n & 0x7F) | 0x80); n >>= 7
    return bytes(out)
def piste(nom, notes, canal, tempo=False):
    ev = []
    if tempo:
        ev.append((0, b'\xff\x51\x03' + struct.pack('>I', int(60e6 / BPM))[1:]))
        ev.append((0, b'\xff\x58\x04\x04\x02\x18\x08'))
    ev.append((0, b'\xff\x03' + vlq(len(nom.encode())) + nom.encode()))
    for t, d, n, v in notes:
        ev.append((t, bytes([0x90 | canal, n, v]))); ev.append((t + d, bytes([0x80 | canal, n, 0])))
    ev.sort(key=lambda e: (e[0], e[1][0] & 0xF0 == 0x90))
    data, last = b'', 0
    for t, m in ev: data += vlq(t - last) + m; last = t
    data += vlq(0) + b'\xff\x2f\x00'
    return b'MTrk' + struct.pack('>I', len(data)) + data
def fichier(nom, pistes):
    with open(os.path.join(ICI, nom), 'wb') as f:
        f.write(b'MThd' + struct.pack('>IHHH', 6, 1, len(pistes), PPQ) + b''.join(pistes))
tick = lambda mesure, pas: int(((mesure - 1) * 16 + (pas - 1)) * STEP)
N_BAT = [(tick(m, p), int(d * STEP * 0.9), n, v) for m in range(1, 9) for p, d, n, v in batterie(m)]
N_808 = [(tick(m, p), d * STEP, n, 110) for m, p, d, n in B808]
N_ACC = [(tick(1 + 2 * i, 1), 32 * STEP - 10, n, 72) for i, a in enumerate(ACCORDS) for n in a]
N_MEL = [(tick(m, p), d * STEP - 10, n, 96) for m, p, d, n in MELODIE]
fichier('01-batterie.mid', [piste('Batterie', N_BAT, 9, True)])
fichier('02-808.mid', [piste('808', N_808, 1, True)])
fichier('03-accords.mid', [piste('Accords', N_ACC, 2, True)])
fichier('04-melodie.mid', [piste('Melodie', N_MEL, 3, True)])
fichier('00-beat-complet.mid', [piste('Nuit sur la 40', [], 0, True), piste('Batterie', N_BAT, 9), piste('808', N_808, 1), piste('Accords', N_ACC, 2), piste('Melodie', N_MEL, 3)])

# ---------- aperçu audio : 8 mesures d'intro (mélodie + accords), puis 8 mesures complètes ----------
BARS = 16
L = int(SR * SEC_STEP * 16 * BARS) + SR * 2
mix = {k: np.zeros(L) for k in ('bat', '808', 'acc', 'mel')}
rng = np.random.default_rng(7)
hz = lambda n: 440 * 2 ** ((n - 69) / 12)
def put(buf, t, sig):
    i = int(t * SR); j = min(L, i + len(sig)); buf[i:j] += sig[:j - i]
def lp(x, a):
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s += a * (x[i] - s); y[i] = s
    return y
tt = lambda d: np.arange(int(d * SR)) / SR
def kick():
    t = tt(0.42); f = 45 + 95 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) + 0.3 * rng.standard_normal(len(t)) * np.exp(-t * 300)
def snare():
    t = tt(0.22); n = rng.standard_normal(len(t)); n = n - lp(n, 0.15)
    return 0.7 * n * np.exp(-t * 18) + 0.4 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
def hat(d=0.05):
    t = tt(d); n = rng.standard_normal(len(t)); n = n - lp(n, 0.6)
    return n * np.exp(-t * 90)
def rim():
    t = tt(0.08); return np.sin(2 * np.pi * 820 * t) * np.exp(-t * 60)
SND = {36: kick(), 38: snare(), 39: snare() * 0.6, 42: hat(), 37: rim()}
for rep in (1,):  # la batterie ne joue que dans la 2e moitié
    for t, d, n, v in N_BAT:
        put(mix['bat'], (t / STEP + 128) * SEC_STEP, SND[n] * (v / 127) * (0.35 if n == 42 else 0.9))
# 808 monophonique avec glissé quand une note en chevauche une autre
notes = sorted(N_808)
for k, (t, d, n, v) in enumerate(notes):
    t0 = (t / STEP + 128) * SEC_STEP; dur = d * SEC_STEP
    nxt = notes[k + 1] if k + 1 < len(notes) else None
    seg = tt(dur + 0.03); f = np.full(len(seg), hz(n))
    if k > 0:
        pn = notes[k - 1][2]
        if notes[k - 1][0] + notes[k - 1][1] > t - 1:  # glissé depuis la note d'avant
            g = np.exp(-seg / 0.045); f = hz(n) + (hz(pn) - hz(n)) * g
    env = np.minimum(1, seg / 0.004) * np.exp(-seg * 0.9) * np.clip((dur + 0.03 - seg) / 0.03, 0, 1)
    put(mix['808'], t0, np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * env * 0.55)
def pad(n, dur):
    t = tt(dur); s = sum(np.sin(2 * np.pi * hz(n) * h * t + h) / h for h in (1, 2, 3, 4)) * 0.5
    s += sum(np.sin(2 * np.pi * hz(n) * 1.004 * h * t) / h for h in (1, 2)) * 0.3
    return lp(s, 0.08) * np.minimum(1, t / 0.6) * np.clip((dur - t) / 0.5, 0, 1)
def bell(n, dur):
    t = tt(max(dur, 0.9)); f = hz(n)
    return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 6) + 0.15 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t * 9)) * np.exp(-t * 3.2) * np.minimum(1, t / 0.003)
for rep in (0, 128):
    for t, d, n, v in N_ACC: put(mix['acc'], (t / STEP + rep) * SEC_STEP, pad(n, d / STEP * SEC_STEP) * 0.12)
    for t, d, n, v in N_MEL: put(mix['mel'], (t / STEP + rep) * SEC_STEP, bell(n, d / STEP * SEC_STEP) * 0.22)
# réverbération : convolution avec une queue de bruit qui décroît
ir_t = tt(1.8); ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 3.2); ir /= np.sqrt((ir ** 2).sum())
def verb(x, w):
    n = 1 << int(np.ceil(np.log2(len(x) + len(ir))))
    y = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[:len(x)]
    return x + w * y
out = mix['bat'] + mix['808'] + verb(mix['acc'], 0.6) + verb(mix['mel'], 0.45)
out = np.tanh(out * 1.1); out /= np.abs(out).max() * 1.12
fade = np.clip((L - np.arange(L)) / (SR * 1.5), 0, 1); out *= fade
st = np.stack([out, out], 1)
pcm = (st * 32767).astype('<i2').tobytes()
w = os.path.join(ICI, '.apercu.wav')
with wave.open(w, 'wb') as f: f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(pcm)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', w, '-b:a', '192k', os.path.join(ICI, 'apercu.mp3')], check=True)
os.remove(w)
print('écrit : 00-beat-complet.mid, 01-batterie.mid, 02-808.mid, 03-accords.mid, 04-melodie.mid, apercu.mp3')
