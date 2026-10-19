"""上：原片同一时刻；下：复刻版。每张对比图放 4 组。"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

frames = [int(x) for x in sys.argv[1].split(",")]
out_prefix = sys.argv[2]
W, H = 960, 540
pairs = []
for fr in frames:
    mine = Path(f"out/wk/f{fr}.png")
    src = Path(f"ref/cmp/s{fr}.png")
    if not mine.exists():
        continue
    a = Image.open(src).convert("RGB").resize((W, H))
    b = Image.open(mine).convert("RGB").resize((W, H))
    pairs.append((fr, a, b))

for k in range(0, len(pairs), 4):
    group = pairs[k:k + 4]
    sheet = Image.new("RGB", (W * 2 + 10, (H * 2 + 40) * ((len(group) + 1) // 2)), "white")
    d = ImageDraw.Draw(sheet)
    for j, (fr, a, b) in enumerate(group):
        x = (j % 2) * (W + 10)
        y = (j // 2) * (H * 2 + 40)
        d.text((x + 6, y + 4), f"t={fr / 30:.2f}s  上=原片  下=复刻", fill=(200, 0, 0))
        sheet.paste(a, (x, y + 18))
        sheet.paste(b, (x, y + 18 + H + 4))
    sheet.save(f"{out_prefix}{k // 4 + 1}.png")
    print("saved", f"{out_prefix}{k // 4 + 1}.png")
