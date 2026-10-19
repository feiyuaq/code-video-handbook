"""测量成片里音效轨、配乐轨各自相对时间轴的偏移（毫秒/帧）。"""
import sys

import librosa
import numpy as np
from scipy.signal import correlate

mix_path, sfx_path, bgm_path = sys.argv[1:4]
sr = 22050
mix, _ = librosa.load(mix_path, sr=sr, mono=True)
sfx, _ = librosa.load(sfx_path, sr=sr, mono=True)
bgm, _ = librosa.load(bgm_path, sr=sr, mono=True, duration=len(mix) / sr)


def lag_ms(ref, sig, lo_s, hi_s):
    a = ref[int(lo_s * sr):int(hi_s * sr)]
    b = sig[int(lo_s * sr):int(hi_s * sr)]
    n = min(len(a), len(b))
    a, b = a[:n], b[:n]
    c = correlate(b, a, mode="full", method="fft")
    lags = np.arange(-n + 1, n)
    win = np.abs(lags) < int(0.3 * sr)
    k = lags[win][np.argmax(c[win])]
    return k / sr * 1000


# 音效：用高潮附近窗口（音效最响）
s = lag_ms(sfx, mix, 15.5, 19.0)
b = lag_ms(bgm, mix, 2.0, 15.0)
print(f"音效轨偏移: {s:+.1f} ms = {s / 33.333:+.2f} 帧")
print(f"配乐轨偏移: {b:+.1f} ms = {b / 33.333:+.2f} 帧")
print(f"音效相对配乐: {s - b:+.1f} ms = {(s - b) / 33.333:+.2f} 帧")
