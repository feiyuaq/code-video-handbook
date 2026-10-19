import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import T from '../timeline.json';
import { CN_FONT, CX, CY, GOLD, HALF, INK, NUM_FONT, Ring, W, clamp, easeInOut, easeOut } from './shared';

type Range = [number, number];
type View = { c: number; w: number };

const G = T.game.guesses;
const LAST = G.length - 1;
const FULL: Range = [1, 100];
const TARGET = G[LAST].n;

// 视窗：range 的两端贴住数轴两端；只剩 1–2 个数时保持最小宽度 2
const viewOf = ([lo, hi]: Range): View => ({ c: (lo + hi) / 2, w: Math.max(hi - lo, 2) });

// 宽度按对数插值（推镜头的速度感均匀），中心随宽度同步移动，保证被保留的那一端不动
const lerpView = (a: View, b: View, p: number): View => {
  if (p <= 0) return a;
  if (p >= 1) return b;
  const w = Math.exp(Math.log(a.w) + (Math.log(b.w) - Math.log(a.w)) * p);
  const q = Math.abs(a.w - b.w) < 1e-6 ? p : (a.w - w) / (a.w - b.w);
  return { c: a.c + (b.c - a.c) * q, w };
};

const xIn = (v: View, n: number) => CX + ((n - v.c) / v.w) * W;
const inside = (n: number, [lo, hi]: Range) => n >= lo && n <= hi;
const rangeBefore = (i: number): Range => (i === 0 ? FULL : [G[i - 1].lo, G[i - 1].hi]);

type State = {
  idx: number;
  view: View;
  outer: Range; // 这一次猜之前的范围
  kept: Range; // 这一次猜之后的范围
  dimP: number; // 被排除的一半暗下去的进度
  restoreP: number; // 猜中后拉远时，所有刻度重新亮起
  zoomOutP: number;
};

const stateAt = (f: number): State => {
  let idx = -1;
  G.forEach((g, i) => {
    if (f >= g.f) idx = i;
  });
  if (idx < 0) return { idx, view: viewOf(FULL), outer: FULL, kept: FULL, dimP: 0, restoreP: 0, zoomOutP: 0 };

  const g = G[idx];
  const before = rangeBefore(idx);
  if (idx === LAST) {
    const [z0, z1] = T.game.zoomOut;
    const zoomOutP = interpolate(f, [z0, z1], [0, 1], { ...clamp, easing: easeInOut });
    return {
      idx,
      view: lerpView(viewOf(before), viewOf(FULL), zoomOutP),
      outer: before,
      kept: before,
      dimP: 1,
      restoreP: interpolate(f, T.game.restore, [0, 1], clamp),
      zoomOutP,
    };
  }
  const after: Range = [g.lo, g.hi];
  const p = interpolate(f, [g.z0, g.z1], [0, 1], { ...clamp, easing: easeInOut });
  return {
    idx,
    view: lerpView(viewOf(before), viewOf(after), p),
    outer: before,
    kept: after,
    dimP: interpolate(f, [g.cut, g.cut + 8], [0, 1], clamp),
    restoreP: 0,
    zoomOutP: 0,
  };
};

export const Game: React.FC<{ f: number }> = ({ f }) => {
  const start = T.redraw;
  if (f < start || f >= T.why.rise[0]) return null;

  const s = stateAt(f);
  const v = s.view;
  const spacing = W / v.w;
  const hit = f >= G[LAST].f;

  // 开场：线从中心向两边拉开，刻度由内向外依次出现
  const reveal = interpolate(f, [start, start + 16], [0, 1], { ...clamp, easing: easeOut });
  const tickAppear = (x: number) => {
    const at = start + 4 + (Math.abs(x - CX) / HALF) * 14;
    return interpolate(f, [at, at + 6], [0, 1], clamp);
  };

  // 刻度明暗：在保留范围内 → 亮；刚被排除 → 渐暗；早就排除 → 暗
  const factor = (n: number) => {
    const k = inside(n, s.kept) ? 1 : inside(n, s.outer) ? 1 - 0.85 * s.dimP : 0.15;
    return k + (1 - k) * s.restoreP;
  };

  const hScale = Math.min(Math.max(spacing / 16, 1), 2.4);
  const labelAll = interpolate(spacing, [45, 75], [0, 1], clamp);
  const labelFade = 1 - s.zoomOutP;

  const nLo = Math.max(1, Math.floor(v.c - v.w / 2) - 1);
  const nHi = Math.min(100, Math.ceil(v.c + v.w / 2) + 1);

  const ticks: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];
  for (let n = nLo; n <= nHi; n++) {
    const x = xIn(v, n);
    if (x < -60 || x > 1980) continue;
    const a = tickAppear(xIn(viewOf(FULL), n));
    if (a <= 0) continue;
    const major = n === 1 || n % 10 === 0;
    const gold = hit && n === TARGET;
    const baseOp = Math.min((major ? 0.5 : 0.26) + (0.3 * (hScale - 1)) / 1.4, 0.85);
    const h = (major ? 20 : 9) * hScale;
    ticks.push(
      <div
        key={n}
        style={{
          position: 'absolute',
          left: x - 1,
          top: CY - h / 2,
          width: 2,
          height: h,
          background: gold ? GOLD : INK,
          opacity: gold ? 1 : a * baseOp * factor(n),
          boxShadow: gold ? '0 0 14px rgba(245,194,107,0.9)' : undefined,
        }}
      />,
    );

    // 数字标签：当前范围的两端一直显示；放大到刻度够宽时，每个刻度都标出来
    const keptEnd = n === s.kept[0] || n === s.kept[1];
    const outerEnd = n === s.outer[0] || n === s.outer[1];
    const endOp = keptEnd ? (outerEnd ? 1 : s.dimP) : outerEnd ? 1 - s.dimP : 0;
    const revealLbl = n === 1 ? interpolate(f, [start + 10, start + 20], [0, 1], clamp) : n === 100 ? interpolate(f, [start + 14, start + 24], [0, 1], clamp) : 1;
    const lblOp = Math.max(endOp * 0.85, labelAll * 0.6 * factor(n)) * revealLbl * labelFade;
    if (lblOp > 0.01) {
      labels.push(
        <div
          key={`l${n}`}
          style={{
            position: 'absolute',
            left: x - 100,
            width: 200,
            top: CY + 30 + (hScale - 1) * 12,
            textAlign: 'center',
            fontFamily: NUM_FONT,
            fontWeight: 300,
            fontSize: 40 + (hScale - 1) * 6,
            color: gold ? GOLD : INK,
            opacity: lblOp,
          }}
        >
          {n}
        </div>,
      );
    }
  }

  // 数轴本体：整条暗线 + 当前范围亮线（只在开场拉线时按 reveal 截断）
  const clipL = reveal < 1 ? CX - reveal * HALF : -10;
  const clipR = reveal < 1 ? CX + reveal * HALF : 1930;
  const seg = ([lo, hi]: Range) => {
    const pad = hi - lo < 2 ? 0.5 : 0;
    return [Math.max(xIn(v, lo - pad), clipL), Math.min(xIn(v, hi + pad), clipR)];
  };
  const [bx0, bx1] = seg(FULL);
  const [ox0, ox1] = seg(s.outer);
  const [kx0, kx1] = seg(s.kept);
  const lineDiv = (x0: number, x1: number, alpha: number, glow: number, key: string) =>
    x1 > x0 && alpha > 0.005 ? (
      <div
        key={key}
        style={{
          position: 'absolute',
          left: x0,
          top: CY - 1,
          width: x1 - x0,
          height: 2,
          background: `rgba(242,242,242,${alpha})`,
          boxShadow: glow > 0 ? `0 0 ${12 * glow}px rgba(255,255,255,${0.4 * glow})` : undefined,
        }}
      />
    ) : null;

  // 每一次「猜」：一道光柱落下，上方出现数字和「大了 / 小了」
  const markers: React.ReactNode[] = [];
  G.forEach((g, i) => {
    const isHit = i === LAST;
    if (f < g.f - 6) return;
    if (!isHit && f > g.cut + 12) return;
    const grow = interpolate(f, [g.f - 6, g.f], [0, 1], { ...clamp, easing: easeOut });
    const flash = interpolate(f, [g.f, g.f + 12], [1, 0], clamp);
    const fade = isHit
      ? interpolate(f, [T.game.zoomOut[0], T.game.zoomOut[0] + 16], [1, 0], clamp)
      : interpolate(f, [g.cut, g.cut + 10], [1, 0], clamp);
    if (fade <= 0) return;
    const x = xIn(v, g.n);
    const color = isHit ? GOLD : '#fff';
    const rgb = isHit ? '245,194,107' : '255,255,255';
    const ph = 340 * grow;
    const numSize = isHit ? 150 : 84;
    const pop = interpolate(f, [g.f, g.f + 7], [isHit ? 1.35 : 1.25, 1], { ...clamp, easing: easeOut });
    const numOp = interpolate(f, [g.f - 2, g.f + 3], [0, 1], clamp) * fade;
    const fbOp = isHit ? 0 : interpolate(f, [g.fbAt, g.fbAt + 6], [0, 1], clamp) * fade;
    const fbText = g.fb === '小了' ? '小了  →' : '←  大了';

    markers.push(
      <React.Fragment key={`g${i}`}>
        <div
          style={{
            position: 'absolute',
            left: x - 1,
            top: CY - ph / 2,
            width: 2,
            height: ph,
            background: `linear-gradient(to bottom, rgba(${rgb},0), rgba(${rgb},1), rgba(${rgb},0))`,
            opacity: (0.5 + 0.5 * flash) * fade,
            boxShadow: `0 0 ${10 + 20 * flash}px rgba(${rgb},${0.5 + 0.4 * flash})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: x - 300,
            width: 600,
            top: CY - 190 - numSize,
            textAlign: 'center',
            fontFamily: NUM_FONT,
            fontWeight: isHit ? 400 : 300,
            fontSize: numSize,
            lineHeight: 1,
            color,
            opacity: numOp,
            transform: `scale(${pop})`,
            textShadow: isHit ? '0 0 40px rgba(245,194,107,0.6)' : '0 0 24px rgba(255,255,255,0.35)',
          }}
        >
          {g.n}
        </div>
        {!isHit && (
          <div
            style={{
              position: 'absolute',
              left: x - 300,
              width: 600,
              top: CY - 190 - numSize - 70,
              textAlign: 'center',
              fontFamily: CN_FONT,
              fontSize: 40,
              letterSpacing: 4,
              color: '#BDBDBD',
              opacity: fbOp,
              transform: `translateY(${(1 - fbOp) * 8}px)`,
            }}
          >
            {fbText}
          </div>
        )}
      </React.Fragment>,
    );
  });

  // 顶部计数：第几次 · 还剩几个
  const counterOp =
    interpolate(f, [G[0].f - 4, G[0].f + 6], [0, 1], clamp) *
    interpolate(f, [T.game.zoomOut[0], T.game.zoomOut[0] + 14], [1, 0], clamp);
  const remain = s.dimP >= 0.5 ? s.kept[1] - s.kept[0] + 1 : s.outer[1] - s.outer[0] + 1;

  const ht = f - G[LAST].f;
  const hitX = xIn(v, TARGET);

  return (
    <AbsoluteFill>
      {lineDiv(bx0, bx1, 0.16 + 0.54 * s.restoreP, 0, 'base')}
      {lineDiv(ox0, ox1, 0.7 * (1 - s.dimP), 1 - s.dimP, 'outer')}
      {lineDiv(kx0, kx1, 0.75, 1, 'kept')}
      {ticks}
      {labels}
      {markers}

      {hit && ht < 40 && (
        <>
          <div
            style={{
              position: 'absolute',
              left: hitX - 500,
              top: CY - 500,
              width: 1000,
              height: 1000,
              background: `radial-gradient(circle, rgba(245,194,107,${interpolate(ht, [0, 16], [0.3, 0], clamp)}) 0%, rgba(245,194,107,0) 60%)`,
            }}
          />
          <Ring t={ht} delay={0} maxR={520} w={2.5} x={hitX} rgb="245,194,107" />
          <Ring t={ht} delay={5} maxR={360} w={1.2} x={hitX} rgb="245,194,107" alpha={0.5} />
        </>
      )}

      {counterOp > 0 && s.idx >= 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 120,
            textAlign: 'center',
            fontFamily: CN_FONT,
            fontSize: 36,
            letterSpacing: 6,
            color: hit ? GOLD : '#A8A8A8',
            opacity: counterOp,
          }}
        >
          第 <span style={{ fontFamily: NUM_FONT, fontSize: 40 }}>{s.idx + 1}</span> 次
          <span style={{ margin: '0 22px', opacity: 0.6 }}>·</span>
          {hit ? (
            '猜中'
          ) : (
            <>
              还剩 <span style={{ fontFamily: NUM_FONT, fontSize: 40, display: 'inline-block', minWidth: 50 }}>{remain}</span> 个
            </>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};
