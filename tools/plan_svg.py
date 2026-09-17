"""俯視平面圖產生器：讀 exhibition.json，輸出 plan.svg（不需任何套件）。用法：python3 tools/plan_svg.py exhibitions/jeju"""
import json, math, sys, os
d = sys.argv[1] if len(sys.argv) > 1 else 'exhibitions/jeju'
plan = json.load(open(os.path.join(d, 'exhibition.json')))
H = plan['hall']; x0, x1 = H['x']; z0, z1 = H['z']; S = 40; PAD = 60
Wpx, Hpx = int((x1 - x0) * S + PAD * 2), int((z1 - z0) * S + PAD * 2)
X = lambda x: PAD + (x - x0) * S
Y = lambda z: PAD + (z1 - z) * S            # z 向前 → 圖面往上
out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{Wpx}" height="{Hpx}" viewBox="0 0 {Wpx} {Hpx}" font-family="IBM Plex Mono, Menlo, monospace">',
       f'<rect width="100%" height="100%" fill="#f7f5f0"/>',
       f'<rect x="{X(x0)}" y="{Y(z1)}" width="{(x1-x0)*S}" height="{(z1-z0)*S}" fill="#ecebe6" stroke="#1a1916" stroke-width="3"/>']
MOOD = {'white': '#ffffff', 'dim': '#dedbd2', 'dark': '#3a3d3b', 'warm': '#fbe9d3', 'sky': '#f4f8ff'}
for z in plan['zones']:
    a, b, c, e = z['rect']
    out.append(f'<rect x="{X(a)}" y="{Y(e)}" width="{(c-a)*S}" height="{(e-b)*S}" fill="{MOOD.get(z["mood"], "#fff")}" stroke="#b9b5aa" stroke-dasharray="4 4"/>')
    out.append(f'<text x="{X(a)+8}" y="{Y(e)+18}" font-size="13" fill="#7a7468">{z["id"]} {z["name"]["zh"]} · 天花 {z["ceiling"]} m</text>')
for w in plan['walls']:
    (fx, fz), (tx, tz) = w['from'], w['to']; t = max(w.get('t', 0.2), 0.2) * S
    L = math.hypot(tx - fx, tz - fz); ux, uz = (tx - fx) / L, (tz - fz) / L
    segs, cur = [], 0.0
    for g in sorted(w.get('gaps', []), key=lambda g: g['at']):
        a, b = g['at'] - g['w'] / 2, g['at'] + g['w'] / 2
        segs.append((cur, a)); cur = b
    segs.append((cur, L))
    for a, b in segs:
        if b - a < 0.01: continue
        out.append(f'<line x1="{X(fx+ux*a)}" y1="{Y(fz+uz*a)}" x2="{X(fx+ux*b)}" y2="{Y(fz+uz*b)}" stroke="{"#4a4d4b" if w.get("color")=="#181D1B" else "#1a1916"}" stroke-width="{t}" stroke-linecap="butt"/>')
    for g in w.get('gaps', []):   # 開口：畫成淡橘色門楣
        a, b = g['at'] - g['w'] / 2, g['at'] + g['w'] / 2
        out.append(f'<line x1="{X(fx+ux*a)}" y1="{Y(fz+uz*a)}" x2="{X(fx+ux*b)}" y2="{Y(fz+uz*b)}" stroke="#E0701F" stroke-width="3" stroke-dasharray="3 3"/>')
    mx, mz = (fx + tx) / 2, (fz + tz) / 2
    out.append(f'<text x="{X(mx)+4}" y="{Y(mz)-4}" font-size="9" fill="#8a7f6a">{w["id"]}</text>')
def mount(on):
    w = next(x for x in plan['walls'] if x['id'] == on['wall']); (fx, fz), (tx, tz) = w['from'], w['to']
    L = math.hypot(tx - fx, tz - fz); ux, uz = (tx - fx) / L, (tz - fz) / L
    s = -1 if on.get('side') == 'R' else 1; nx, nz = -uz * s, ux * s
    off = w.get('t', 0.2) / 2 + 0.05
    return fx + ux * on['at'] + nx * off, fz + uz * on['at'] + nz * off, ux, uz
COL = {'work': '#0F4C50', 'text': '#E0701F', 'video': '#181D1B', 'audio': '#E0701F'}
for b in plan['boards']:
    px, pz, ux, uz = mount(b['on']); w = b['size'][0]
    out.append(f'<line x1="{X(px-ux*w/2)}" y1="{Y(pz-uz*w/2)}" x2="{X(px+ux*w/2)}" y2="{Y(pz+uz*w/2)}" stroke="{COL.get(b["kind"], "#333")}" stroke-width="5"/>')
    out.append(f'<text x="{X(px)}" y="{Y(pz)+ (12 if uz==0 else 4)}" font-size="8" fill="{COL.get(b["kind"], "#333")}" text-anchor="middle">{b["id"]}</text>')
for p in plan['props']:
    px, pz = p['pos']; r = p.get('obs') or p.get('r') or 0.3
    out.append(f'<circle cx="{X(px)}" cy="{Y(pz)}" r="{r*S}" fill="none" stroke="#0F4C50" stroke-width="1.5"/>')
    if not p['id'].startswith(('L', 'PKG')): out.append(f'<text x="{X(px)}" y="{Y(pz)+3}" font-size="8" fill="#0F4C50" text-anchor="middle">{p["id"]}</text>')
for l in plan['lights']:
    px, pz = l['pos']; ax, az = l['aim'][0], l['aim'][1]
    out.append(f'<line x1="{X(px)}" y1="{Y(pz)}" x2="{X(ax)}" y2="{Y(az)}" stroke="#E0701F" stroke-width="1" stroke-dasharray="2 3"/>')
    out.append(f'<circle cx="{X(px)}" cy="{Y(pz)}" r="4" fill="#E0701F"/>')
for s in plan.get('stops', []):
    px, pz = s['pos']; out.append(f'<circle cx="{X(px)}" cy="{Y(pz)}" r="6" fill="none" stroke="#8a6f45" stroke-width="1.5"/><text x="{X(px)}" y="{Y(pz)-9}" font-size="8" fill="#8a6f45" text-anchor="middle">{s["id"]}</text>')
sp = plan['spawn']; out.append(f'<circle cx="{X(sp["x"])}" cy="{Y(sp["z"])}" r="7" fill="#E0701F"/><text x="{X(sp["x"])+10}" y="{Y(sp["z"])+4}" font-size="11" fill="#E0701F">進場</text>')
out.append(f'<text x="{PAD}" y="{PAD-22}" font-size="16" fill="#1a1916" font-family="Noto Serif TC, serif">{plan["title"]["zh"]} — 階段一 俯視平面圖（x 向右、z 向上；單位 m）</text>')
out.append(f'<text x="{PAD}" y="{Hpx-22}" font-size="11" fill="#7a7468">黑線＝展牆　橘虛線＝開口　藍綠＝作品板　橘＝牆文／燈具　圓＝道具碰撞範圍　D＝停留點</text>')
out.append('</svg>')
open(os.path.join(d, 'plan.svg'), 'w').write('\n'.join(out)); print('plan.svg written', Wpx, Hpx)
