import sys
import librosa
import numpy as np

path = sys.argv[1]
sr = 22050
y, _ = librosa.load(path, sr=sr, mono=True)
hop = sr // 30
rms = librosa.feature.rms(y=y, frame_length=hop * 2, hop_length=hop)[0]
rms_db = librosa.amplitude_to_db(rms, ref=np.max)
on_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)[: len(rms_db)]

lo = int(float(sys.argv[2]) * 30) if len(sys.argv) > 2 else 15 * 30
hi = int(float(sys.argv[3]) * 30) if len(sys.argv) > 3 else 19 * 30
print("t(s)  frame  rms_dB  onset")
for f in range(lo, min(hi, len(rms_db))):
    print("%6.2f %5d %7.1f %6.2f" % (f / 30.0, f, rms_db[f], on_env[f]))
