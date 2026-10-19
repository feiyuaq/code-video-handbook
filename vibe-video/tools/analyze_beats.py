"""分析配乐：BPM、重拍时间点、节拍间隔。输出 JSON 供 Remotion 使用。"""
import json
import sys

import librosa
import numpy as np


def analyze(path: str) -> dict:
    y, sr = librosa.load(path, sr=22050, mono=True)

    # 节拍追踪
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, units="frames")
    beat_times = librosa.frames_to_time(beat_frames, sr=sr)

    # 起音强度（用于区分重拍/轻拍）
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    onset_times = librosa.times_like(onset_env, sr=sr)
    strengths = []
    for t in beat_times:
        idx = int(np.argmin(np.abs(onset_times - t)))
        strengths.append(float(onset_env[idx]))

    strengths_arr = np.array(strengths)
    # 以中位数为界判定重拍
    thresh = float(np.median(strengths_arr)) if len(strengths_arr) else 0.0
    labels = ["down" if s >= thresh else "up" for s in strengths_arr]

    # 转成 Python 原生类型
    tempo_val = float(np.atleast_1d(tempo)[0])
    dur = float(librosa.get_duration(y=y, sr=sr))

    return {
        "file": path,
        "duration_sec": round(dur, 3),
        "bpm": round(tempo_val, 2),
        "beat_interval_sec": round(60.0 / tempo_val, 4) if tempo_val else None,
        "beat_count": len(beat_times),
        "beats": [
            {
                "index": i,
                "time": round(float(t), 3),
                "frame30fps": int(round(float(t) * 30)),
                "strength": round(float(s), 3),
                "type": lab,
            }
            for i, (t, s, lab) in enumerate(zip(beat_times, strengths, labels))
        ],
        "strong_beats": [
            round(float(t), 3) for t, lab in zip(beat_times, labels) if lab == "down"
        ],
        "strong_beats_frame30fps": [
            int(round(float(t) * 30)) for t, lab in zip(beat_times, labels) if lab == "down"
        ],
    }


if __name__ == "__main__":
    result = analyze(sys.argv[1])
    out_path = sys.argv[2] if len(sys.argv) > 2 else None
    if out_path:
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"wrote {out_path}")
        print(f"duration={result['duration_sec']}s bpm={result['bpm']} "
              f"beats={result['beat_count']} strong={len(result['strong_beats'])}")
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))
