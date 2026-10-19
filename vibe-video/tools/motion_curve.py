"""逐帧画面变化曲线：找出参考视频中每一次动作/切换的起止帧。

把视频缩成 192x108 灰度逐帧读入，分别计算左半屏（文字区）和右半屏（展示区）
相邻帧差，输出运动段落。
"""
import subprocess
import sys

import numpy as np

ff, src = sys.argv[1], sys.argv[2]
W, H = 192, 108
raw = subprocess.run(
    [ff, "-v", "error", "-i", src, "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
    capture_output=True, check=True,
).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
# 去掉右上角水印区域，避免干扰
frames[:, :12, 150:] = 0
n = len(frames)
d = np.abs(np.diff(frames, axis=0))
left = d[:, :, : W // 2].mean(axis=(1, 2))
right = d[:, :, W // 2:].mean(axis=(1, 2))
total = d.mean(axis=(1, 2))

print(f"frames={n}")


def segments(sig, thr, gap=4, minlen=2):
    on = sig > thr
    segs, s, last = [], None, -99
    for i, v in enumerate(on):
        if v:
            if s is None:
                s = i
            last = i
        elif s is not None and i - last > gap:
            if last - s + 1 >= minlen:
                segs.append((s, last))
            s = None
    if s is not None:
        segs.append((s, last))
    return segs


for name, sig in (("LEFT(文字区)", left), ("RIGHT(展示区)", right)):
    thr = max(0.08, float(np.percentile(sig, 60)) * 1.5)
    print(f"\n== {name} thr={thr:.3f} ==")
    for a, b in segments(sig, thr):
        pk = a + int(np.argmax(sig[a:b + 1]))
        print(f"  f{a + 1:>5}-f{b + 1:<5} {(a + 1) / 30:6.2f}s-{(b + 1) / 30:6.2f}s  "
              f"len={(b - a + 1) / 30:4.2f}s peak={sig[pk]:.2f}@{(pk + 1) / 30:.2f}s")

np.save(sys.argv[3], np.stack([left, right, total]))
