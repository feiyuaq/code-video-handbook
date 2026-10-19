"""为「二分猜数字」视频准备数据：音乐调性、0-25s 的节拍、需要猜满 7 次的目标数。"""
import sys

import librosa
import numpy as np

path = sys.argv[1]
y, sr = librosa.load(path, sr=22050, mono=True, duration=70)

# ---- 调性估计（Krumhansl 模板）----
chroma = librosa.feature.chroma_cqt(y=y, sr=sr).mean(axis=1)
major = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
minor = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
scores = []
for i in range(12):
    scores.append((np.corrcoef(np.roll(major, i), chroma)[0, 1], names[i] + " major"))
    scores.append((np.corrcoef(np.roll(minor, i), chroma)[0, 1], names[i] + " minor"))
scores.sort(reverse=True)
print("key candidates:", [(n, round(float(s), 3)) for s, n in scores[:4]])

# ---- 节拍 0-62s ----
_, beats = librosa.beat.beat_track(y=y, sr=sr, units="time")
print("beats 0-62s:")
print(" ".join(f"{t:.2f}" for t in beats if t < 62))

# ---- 二分：哪些数恰好第 7 次猜中 ----
def steps(target, lo=1, hi=100):
    seq = []
    while True:
        mid = (lo + hi) // 2
        seq.append(mid)
        if mid == target:
            return seq
        if mid < target:
            lo = mid + 1
        else:
            hi = mid - 1

seven = [n for n in range(1, 101) if len(steps(n)) == 7]
print("7-step targets:", seven)
for n in (37, 63, 64, 67, 83, 88, 23):
    if n in seven:
        print(n, steps(n))
