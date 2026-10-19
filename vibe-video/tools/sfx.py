"""根据 src/timeline.json 合成整条音效轨 → public/sfx.wav。

所有音色都是代码合成的（无外部素材），音高取自配乐调性 F# 小调。
冲击类音效的瞬态峰值对齐到目标帧的第一个采样。
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
RNG = np.random.default_rng(7)

NOTE_INDEX = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5,
              "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def note_hz(name: str) -> float:
    pitch, octave = name[:-1], int(name[-1])
    midi = 12 * (octave + 1) + NOTE_INDEX[pitch]
    return 440.0 * 2 ** ((midi - 69) / 12)


def t_axis(dur: float) -> np.ndarray:
    return np.arange(int(dur * SR)) / SR


def bandpass(x, lo, hi, order=2):
    sos = butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return sosfilt(sos, x)


def lowpass(x, hz, order=2):
    sos = butter(order, hz, btype="low", fs=SR, output="sos")
    return sosfilt(sos, x)


def highpass(x, hz, order=2):
    sos = butter(order, hz, btype="high", fs=SR, output="sos")
    return sosfilt(sos, x)


def fade_edges(x, fin=0.002, fout=0.01):
    n_in, n_out = int(fin * SR), int(fout * SR)
    if n_in:
        x[:n_in] *= np.linspace(0, 1, n_in)
    if n_out:
        x[-n_out:] *= np.linspace(1, 0, n_out)
    return x


# ---------------- 音色 ----------------

def marimba(freq, dur=1.6):
    """木琴/卡林巴质感：基音 + 3.9 倍、9.2 倍泛音，高泛音衰减快。"""
    t = t_axis(dur)
    x = (np.sin(2 * np.pi * freq * t) * np.exp(-t * 3.2)
         + 0.35 * np.sin(2 * np.pi * freq * 3.9 * t) * np.exp(-t * 14)
         + 0.12 * np.sin(2 * np.pi * freq * 9.2 * t) * np.exp(-t * 32))
    x += 0.25 * RNG.standard_normal(len(t)) * np.exp(-t * 400)  # 敲击瞬态
    return fade_edges(x)


def bell(freq, dur=3.0):
    """钟/铃：非谐泛音，长尾。"""
    t = t_axis(dur)
    partials = [(1.0, 1.0, 1.4), (2.76, 0.45, 2.6), (5.40, 0.25, 4.5), (8.93, 0.12, 7.0)]
    x = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t * d) for r, a, d in partials)
    return fade_edges(x, 0.004)


def tick(freq, dur=0.05):
    t = t_axis(dur)
    x = np.sin(2 * np.pi * freq * t) * np.exp(-t * 90)
    x += 0.3 * RNG.standard_normal(len(t)) * np.exp(-t * 600)
    return fade_edges(x, 0.0005, 0.005)


def sweep_noise(n, f_from, f_to, blocks=28):
    """分块带通，中心频率按指数从 f_from 扫到 f_to。"""
    noise = RNG.standard_normal(n)
    out = np.zeros_like(noise)
    edges = np.linspace(0, n, blocks + 1, dtype=int)
    for i in range(blocks):
        c = f_from * (f_to / f_from) ** (i / blocks)
        seg = noise[max(0, edges[i] - 2000):edges[i + 1]]
        f = bandpass(seg, c * 0.7, min(c * 1.4, SR / 2 - 100))
        out[edges[i]:edges[i + 1]] = f[-(edges[i + 1] - edges[i]):]
    return out


def line_draw():
    """一道光被拉开：上扫的气声 + 低沉的 F# 五度垫底。"""
    dur = 1.4
    t = t_axis(dur)
    out = sweep_noise(len(t), 500, 5000)
    env = np.minimum(t / 0.08, 1.0) * np.exp(-t * 2.8)
    air = out * env * 0.7
    pad_env = np.minimum(t / 0.05, 1.0) * np.exp(-t * 1.6)
    pad = (np.sin(2 * np.pi * note_hz("F#3") * t)
           + 0.6 * np.sin(2 * np.pi * note_hz("C#4") * t)) * pad_env * 0.45
    return fade_edges(air + pad)


def whoosh():
    """被排除的一半掉走：下行的气声，短。"""
    dur = 0.45
    t = t_axis(dur)
    out = sweep_noise(len(t), 4200, 600, blocks=18)
    env = np.minimum(t / 0.04, 1.0) * np.exp(-t * 7.5)
    return fade_edges(out * env * 1.2)


def thud():
    """「卡住」：短促的低频闷击 + 咔哒。"""
    dur = 0.6
    t = t_axis(dur)
    f = 130 * np.exp(-t * 9) + 52
    phase = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(phase) * np.exp(-t * 7)
    x += 0.5 * lowpass(RNG.standard_normal(len(t)), 2500) * np.exp(-t * 160)
    return fade_edges(np.tanh(x * 1.6), 0.0005)


def zip_sweep():
    """一口气把剩下的刻度全部点亮：0.2 秒急速上行的密集咔哒。"""
    dur = 0.24
    x = np.zeros(int(dur * SR))
    n = 60
    for i in range(n):
        pos = int((i / n) ** 0.8 * (dur - 0.03) * SR)
        tk = tick(1400 * 2 ** (i / n), 0.025)
        x[pos:pos + len(tk)] += tk * 0.6
    return x


def riser(dur):
    """蓄力：指数上扫的正弦 + 高通噪声渐强，末尾一刀切断。"""
    t = t_axis(dur)
    f = 180 * (1600 / 180) ** (t / dur) ** 1.4
    phase = 2 * np.pi * np.cumsum(f) / SR
    trem = 0.75 + 0.25 * np.sin(2 * np.pi * (3 + 9 * t / dur) * t)
    tone = np.sin(phase) * trem
    noise = highpass(RNG.standard_normal(len(t)), 3000) * 0.6
    env = (t / dur) ** 2.2
    x = (tone * 0.7 + noise) * env
    return fade_edges(x, 0.01, 0.004)  # 4ms 切断，制造「换气」


def impact():
    """主爆点：次低频下滑 + 噪声瞬态 + F#1 长尾。瞬态在第 0 个采样。"""
    dur = 3.2
    t = t_axis(dur)
    f = 78 * np.exp(-t * 5) + 36
    phase = 2 * np.pi * np.cumsum(f) / SR
    sub = np.sin(phase) * np.exp(-t * 1.25)
    body = np.sin(2 * np.pi * note_hz("F#1") * t) * np.exp(-t * 0.9) * 0.5
    crack = lowpass(RNG.standard_normal(len(t)), 5000) * np.exp(-t * 45) * 0.9
    air = highpass(RNG.standard_normal(len(t)), 6000) * np.exp(-t * 3.5) * 0.12
    x = np.tanh((sub + body) * 2.2) * 0.9 + crack + air
    return fade_edges(x, 0.0003, 0.2)


def shimmer():
    """术语名浮现：F# 小三和弦的铃音，错开 45ms 依次响起。"""
    notes = ["F#5", "A5", "C#6"]
    dur = 3.4
    x = np.zeros(int(dur * SR))
    for i, n in enumerate(notes):
        b = bell(note_hz(n), 3.0)
        pos = int(i * 0.045 * SR)
        x[pos:pos + len(b)] += b * (0.8 - 0.15 * i)
    return x


def suck(dur):
    """收拢：反向的气声（越来越响、越来越高），被吸进一个点里。"""
    t = t_axis(dur)
    noise = RNG.standard_normal(len(t))
    x = bandpass(noise, 800, 6000) * (t / dur) ** 2.5
    tone_f = 300 * (2400 / 300) ** (t / dur)
    tone = np.sin(2 * np.pi * np.cumsum(tone_f) / SR) * (t / dur) ** 3 * 0.35
    return fade_edges(x + tone, 0.01, 0.006)


# ---------------- 空间感 ----------------

def make_ir(seconds=2.2, seed=11):
    r = np.random.default_rng(seed)
    t = t_axis(seconds)
    ir = r.standard_normal(len(t)) * np.exp(-t * 3.0)
    ir = lowpass(ir, 7000)
    ir[0] = 0
    return ir / np.sqrt(np.sum(ir ** 2))


IR_L, IR_R = make_ir(seed=11), make_ir(seed=23)


def place(buf, sig, frame, fps, gain, pan=0.0, wet=0.25):
    start = int(round(frame / fps * SR))
    l_gain = gain * math.cos((pan + 1) * math.pi / 4)
    r_gain = gain * math.sin((pan + 1) * math.pi / 4)
    end = min(len(buf), start + len(sig))
    seg = sig[: end - start]
    buf[start:end, 0] += seg * l_gain * (1 - wet)
    buf[start:end, 1] += seg * r_gain * (1 - wet)
    if wet > 0:
        wl = fftconvolve(seg, IR_L)[: len(buf) - start]
        wr = fftconvolve(seg, IR_R)[: len(buf) - start]
        buf[start:start + len(wl), 0] += wl * l_gain * wet
        buf[start:start + len(wr), 1] += wr * r_gain * wet


def march_ticks(m):
    """与 BinaryGuess.tsx 中 marchN() 完全相同的公式。"""
    frames, last = [], None
    for f in range(m["start"], m["end"]):
        p = (f - m["start"]) / (m["end"] - m["start"])
        n = math.floor(m["from"] + (m["to"] - m["from"]) * p ** m["power"])
        if n != last:
            frames.append((f, n))
            last = n
    return frames


def roll_ticks(sc):
    """与 Scale.tsx 中 kAt() 完全相同的公式：次数滚动时，每变一个数响一下。"""
    frames, prev = [], sc["startK"]
    for key in sc["keys"]:
        r0, last = key["f"] - sc["roll"], prev
        for f in range(r0, key["f"]):
            v = prev + math.floor((key["k"] - prev) * (f - r0) / sc["roll"])
            if v != last:
                frames.append((f, v))
                last = v
        prev = key["k"]
    return frames


def main(timeline_path, out_path, end_frame=None):
    tl = json.loads(Path(timeline_path).read_text(encoding="utf-8"))
    fps = tl["fps"]
    end = end_frame or tl.get("end", tl["previewEnd"])
    total = int((end / fps + 3.5) * SR)
    buf = np.zeros((total, 2))

    for cue in tl["sfx"]:
        kind, f, g = cue["type"], cue["frame"], cue["gain"]
        if f > end:
            continue
        if kind == "bell":
            place(buf, bell(note_hz(cue["note"])), f, fps, g, pan=cue.get("pan", 0.0), wet=0.45)
        elif kind == "marimba":
            pan = cue.get("pan", -0.35 if cue["note"].startswith("C#") else 0.35)
            place(buf, marimba(note_hz(cue["note"])), f, fps, g, pan=pan, wet=0.35)
        elif kind == "whoosh":
            place(buf, whoosh(), f, fps, g, pan=cue.get("pan", 0.0), wet=0.25)
        elif kind == "lineDraw":
            place(buf, line_draw(), f, fps, g, wet=0.3)
        elif kind == "thud":
            place(buf, thud(), f, fps, g, wet=0.15)
        elif kind == "zip":
            place(buf, zip_sweep(), f, fps, g, pan=0.3, wet=0.2)
        elif kind == "riser":
            place(buf, riser((cue["until"] - f) / fps), f, fps, g, wet=0.1)
        elif kind == "impact":
            place(buf, impact(), f, fps, g, wet=0.3)
        elif kind == "shimmer":
            place(buf, shimmer(), f, fps, g, wet=0.5)
        elif kind == "suck":
            place(buf, suck((cue["until"] - f) / fps), f, fps, g, wet=0.15)
        else:
            raise ValueError(f"unknown sfx type: {kind}")

    # 一个一个试：咔哒声，音高随数字升高，左右声道跟着光点移动
    m = tl["march"]
    if m["start"] <= end:
        for f, n in march_ticks(m):
            pan = -0.8 + 1.6 * (n - 1) / 99
            freq = 1100 * 2 ** ((n - 1) / 40)
            place(buf, tick(freq), f, fps, 0.13, pan=pan, wet=0.15)

    # 次数滚动：棘轮一样的咔哒声，音高随次数升高
    rolls = roll_ticks(tl["scale"]) if "scale" in tl else []
    for f, v in rolls:
        if f <= end:
            place(buf, tick(900 * 2 ** ((v - 7) / 18)), f, fps, 0.12, wet=0.15)

    peak = float(np.max(np.abs(buf)))
    if peak > 0.89:
        buf *= 0.89 / peak
    sf.write(out_path, buf.astype(np.float32), SR, subtype="PCM_16")
    print(f"wrote {out_path}  {total / SR:.2f}s  peak={min(peak, 0.89):.3f}  "
          f"march_ticks={len(march_ticks(m))}  roll_ticks={len(rolls)}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else None)
