"""找出配乐里的「换气 + 重拍」点，以及整体结构分句。
「换气」= 一小段接近静音的停顿；「重拍」= 紧跟其后的强起音。

输出候选点，按「静音深度 × 冲击强度」排序。
"""
import json
import sys

import librosa
import numpy as np


def analyze(path: str) -> dict:
    sr = 22050
    hop = 512
    y, _ = librosa.load(path, sr=sr, mono=True)
    duration = float(librosa.get_duration(y=y, sr=sr))

    # ---- 能量包络 ----
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=hop)[0]
    rms_db = librosa.amplitude_to_db(rms, ref=np.max)
    t_rms = librosa.times_like(rms, sr=sr, hop_length=hop)

    # ---- 起音强度 ----
    onset = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    t_onset = librosa.times_like(onset, sr=sr, hop_length=hop)

    # ---- 节拍 ----
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop)
    beat_times = librosa.frames_to_time(beat_frames, sr=sr, hop_length=hop)
    beat_times = np.atleast_1d(beat_times)
    tempo_val = float(np.atleast_1d(tempo)[0])

    # ---- 找「换气 + 重拍」候选 ----
    # 对每个强起音，往回看 1.6 秒，找该窗口内最深的一次静音
    onset_norm = onset / (onset.max() + 1e-9)
    peaks = librosa.util.peak_pick(
        onset_norm, pre_max=8, post_max=8, pre_avg=20, post_avg=20,
        delta=0.06, wait=10
    )

    candidates = []
    for p in peaks:
        t = float(t_onset[p])
        strength = float(onset_norm[p])
        if t < 2.5:
            continue
        # 往前 1.6s 窗口
        w0 = max(0, p - int(1.6 * sr / hop))
        win_db = rms_db[w0:p + 1]
        if len(win_db) == 0:
            continue
        quiet_idx = int(np.argmin(win_db))
        quiet_db = float(win_db[quiet_idx])
        quiet_t = float(t_rms[w0 + quiet_idx])

        # 静音前是否真的「掉下去」——对比静音点之后再往前一段的平均电平
        pre0 = max(0, w0 - int(0.8 * sr / hop))
        pre_avg_db = float(np.mean(rms_db[pre0:w0])) if w0 > pre0 else quiet_db
        drop = pre_avg_db - quiet_db  # 静音比前一段低多少 dB

        # 重拍之后 0.4s 的平均电平
        post1 = min(len(rms_db), p + int(0.4 * sr / hop))
        post_db = float(np.mean(rms_db[p:post1])) if post1 > p else quiet_db
        rise = post_db - quiet_db  # 冲上去多少 dB

        # 静音持续时长
        silence_len = t - quiet_t

        score = (drop * 0.5 + rise * 0.5) * min(strength, 1.0)

        candidates.append({
            "drop_time": round(t, 3),
            "frame30fps": int(round(t * 30)),
            "quiet_at": round(quiet_t, 3),
            "silence_len_sec": round(silence_len, 3),
            "quiet_db": round(quiet_db, 1),
            "drop_db": round(drop, 1),
            "rise_db": round(rise, 1),
            "onset_strength": round(strength, 3),
            "score": round(float(score), 2),
            "on_beat": bool(np.min(np.abs(beat_times - t)) < 0.08),
        })

    candidates.sort(key=lambda c: -c["score"])
    top = candidates[:12]

    # ---- 结构分段（novelty）----
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop)
    try:
        bounds = librosa.segment.agglomerative(chroma, k=8)
        bound_times = [round(float(t_rms[min(b, len(t_rms) - 1)]), 2) for b in bounds]
    except Exception:
        bound_times = []

    # ---- 每 10 秒的响度，看整体起伏 ----
    loudness_profile = []
    step = int(10 * sr / hop)
    for i in range(0, len(rms_db), step):
        seg = rms_db[i:i + step]
        if len(seg) == 0:
            continue
        loudness_profile.append({
            "t": round(float(t_rms[i]), 1),
            "db": round(float(np.mean(seg)), 1),
        })

    return {
        "file": path,
        "duration_sec": round(duration, 2),
        "bpm": round(tempo_val, 2),
        "beat_interval_sec": round(60.0 / tempo_val, 3),
        "beat_interval_frames30fps": round(60.0 / tempo_val * 30, 2),
        "first_beat_sec": round(float(beat_times[0]), 3) if len(beat_times) else None,
        "candidates": top,
        "section_bounds_sec": bound_times,
        "loudness_profile_10s": loudness_profile,
        "peak_db": round(float(np.max(rms_db)), 1),
        "mean_db": round(float(np.mean(rms_db)), 1),
    }


if __name__ == "__main__":
    res = analyze(sys.argv[1])
    out = sys.argv[2] if len(sys.argv) > 2 else None
    if out:
        with open(out, "w", encoding="utf-8") as f:
            json.dump(res, f, ensure_ascii=False, indent=2)
    print(f"duration={res['duration_sec']}s  bpm={res['bpm']}  "
          f"beat={res['beat_interval_sec']}s ({res['beat_interval_frames30fps']}f)")
    print("\n== 换气+重拍 候选 ==")
    for c in res["candidates"]:
        print(f"  {c['drop_time']:>7.2f}s (f{c['frame30fps']:>5})  "
              f"静音{c['silence_len_sec']:.2f}s 掉{c['drop_db']:+.1f}dB "
              f"冲{c['rise_db']:+.1f}dB  onset={c['onset_strength']:.2f} "
              f"beat={'Y' if c['on_beat'] else 'n'}  score={c['score']}")
    print("\n== 结构分段 ==")
    print("  " + ", ".join(f"{b}s" for b in res["section_bounds_sec"]))
    print("\n== 每10秒响度 ==")
    for p in res["loudness_profile_10s"]:
        bar = "#" * max(0, int((p["db"] - res["mean_db"] + 20) / 2))
        print(f"  {p['t']:>6.1f}s {p['db']:>7.1f}dB {bar}")
