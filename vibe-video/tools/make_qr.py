import sys

import qrcode

url, out = sys.argv[1], sys.argv[2]
q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=0)
q.add_data(url)
q.make(fit=True)
m = q.get_matrix()
n = len(m)
rects = "".join(
    f'<rect x="{x}" y="{y}" width="1.02" height="1.02"/>'
    for y, row in enumerate(m)
    for x, v in enumerate(row)
    if v
)
with open(out, "w", encoding="utf-8") as f:
    f.write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n} {n}" shape-rendering="crispEdges">'
        f'<g fill="#141412">{rects}</g></svg>'
    )
print("qr modules", n)
