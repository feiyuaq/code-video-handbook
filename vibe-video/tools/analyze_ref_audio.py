"""参考视频音频分析：响度轮廓、BPM、强起音、近静音段。"""
import sys

import librosa
import numpy as np

path = sys.argv[1]
sr = 22050
y, _ = librosa.load(path, sr=sr, mono=True)
hop = sr // 30
dur = len(y) / sr

rms = librosa.feature.rms(y=y, frame_length=hop * 2, hop_length=hop)[0]
db = librosa.amplitude_to_db(rms, ref=np.max)
onset = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop, units="time")

# 频谱特征粗判是否有人声：人声在 300–3400Hz 能量占比高且有频谱通量起伏
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=512))
freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
band = S[(freqs > 300) & (freqs < 3400)].sum(axis=0) / (S.sum(axis=0) + 1e-9)
flat = librosa.feature.spectral_flatness(S=S)[0]

print(f"duration={dur:.2f}s  bpm={float(np.atleast_1d(tempo)[0]):.2f}  beats={len(beats)}")
print(f"voice-band ratio mean={band.mean():.2f}  flatness mean={flat.mean():.3f}")
print("\n== 每秒响度(dB) / 最强起音 ==")
for s in range(int(dur) + 1):
    a, b = s * 30, min((s + 1) * 30, len(db))
    if a >= len(db):
        break
    seg = db[a:b]
    o = onset[a:b]
    k = int(np.argmax(o))
    bar = "#" * max(0, int((seg.mean() + 40) / 2))
    print(f"{s:>3}s {seg.mean():6.1f}  peak_onset={o[k]:5.1f}@{(a + k) / 30:6.2f}s  {bar}")

print("\n== 最强 25 个起音 ==")
idx = np.argsort(onset)[-25:][::-1]
print(", ".join(f"{i / 30:.2f}s({onset[i]:.1f})" for i in sorted(idx)))

print("\n== 节拍 ==")
print(" ".join(f"{t:.2f}" for t in beats))

print("\n== 近静音段 (< -35 dB, >=0.15s) ==")
quiet = db < -35
start = None
for i, q in enumerate(np.append(quiet, False)):
    if q and start is None:
        start = i
    elif not q and start is not None:
        if i - start >= 5:
            print(f"  {start / 30:.2f}s – {i / 30:.2f}s")
        start = None
