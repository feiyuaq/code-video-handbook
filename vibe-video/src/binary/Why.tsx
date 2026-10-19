import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import T from '../timeline.json';
import { CN_FONT, CY, GOLD, INK, NUM_FONT, clamp, easeInOut, easeOut, xOf } from './shared';

const Y = T.why;
const G = T.game.guesses;
const TARGET = G[G.length - 1].n;

// 每一行 = 猜完第 k 次后还剩的范围（第 0 行是一开始的 1–100）
const ROWS: [number, number][] = [[1, 100], ...G.slice(0, -1).map((g) => [g.lo, g.hi] as [number, number])];
const rowY = (k: number) => 210 + 90 * k;

const Funnel: React.FC<{ f: number }> = ({ f }) => {
  const riseP = interpolate(f, Y.rise, [0, 1], { ...clamp, easing: easeInOut });
  const op = interpolate(f, Y.fadeOut, [1, 0], clamp);
  if (op <= 0) return null;

  const placed: { y: number; lo: number; hi: number; p: number }[] = [];
  ROWS.forEach(([lo, hi], k) => {
    const at = k === 0 ? Y.rise[0] : Y.rows[k - 1];
    if (f < at) return;
    const p = k === 0 ? 1 : interpolate(f, [at, at + 9], [0, 1], { ...clamp, easing: easeOut });
    const y = k === 0 ? CY + (rowY(0) - CY) * riseP : rowY(k - 1) + (rowY(k) - rowY(k - 1)) * p;
    placed.push({ y, lo, hi, p });
  });

  // 最后一行只剩一个数：金点，再从它往上拉一条金线，穿过每一行的 83
  const lastAt = Y.rows[Y.rows.length - 1];
  const dotY = rowY(ROWS.length - 1);
  const guideP = interpolate(f, [lastAt + 4, lastAt + 16], [0, 1], { ...clamp, easing: easeOut });

  return (
    <AbsoluteFill style={{ opacity: op, transform: `scale(${1 - 0.04 * (1 - op)})` }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0 }}>
        {placed.slice(1).map((r, i) => {
          const prev = placed[i];
          return (
            <g key={i} stroke="rgba(255,255,255,0.16)" strokeWidth={1}>
              <line x1={xOf(prev.lo)} y1={prev.y} x2={xOf(r.lo)} y2={r.y} />
              <line x1={xOf(prev.hi)} y1={prev.y} x2={xOf(r.hi)} y2={r.y} />
            </g>
          );
        })}
        {guideP > 0 && (
          <line
            x1={xOf(TARGET)}
            y1={dotY}
            x2={xOf(TARGET)}
            y2={dotY - (dotY - rowY(0)) * guideP}
            stroke="rgba(245,194,107,0.45)"
            strokeWidth={1.5}
          />
        )}
      </svg>

      {placed.map(({ y, lo, hi, p }, k) => {
        if (lo === hi) {
          return (
            <React.Fragment key={k}>
              <div
                style={{
                  position: 'absolute',
                  left: xOf(lo) - 8,
                  top: y - 8,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: GOLD,
                  opacity: p,
                  transform: `scale(${1 + 0.8 * (1 - p)})`,
                  boxShadow: '0 0 30px 8px rgba(245,194,107,0.55)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: xOf(lo) + 28,
                  top: y - 20,
                  fontFamily: NUM_FONT,
                  fontSize: 32,
                  color: GOLD,
                  opacity: p,
                  whiteSpace: 'nowrap',
                }}
              >
                1
              </div>
            </React.Fragment>
          );
        }
        const ticks: React.ReactNode[] = [];
        for (let n = lo; n <= hi; n++) {
          const major = n === 1 || n % 10 === 0;
          const gold = n === TARGET;
          const h = gold ? 18 : major ? 16 : 8;
          ticks.push(
            <div
              key={n}
              style={{
                position: 'absolute',
                left: xOf(n) - 1,
                top: y - h / 2,
                width: 2,
                height: h,
                background: gold ? GOLD : INK,
                opacity: gold ? 0.95 : major ? 0.45 : 0.24,
                boxShadow: gold ? '0 0 10px rgba(245,194,107,0.8)' : undefined,
              }}
            />,
          );
        }
        const count = hi - lo + 1;
        return (
          <React.Fragment key={k}>
            <div
              style={{
                position: 'absolute',
                left: xOf(lo),
                top: y - 1,
                width: Math.max(xOf(hi) - xOf(lo), 2),
                height: 2,
                background: 'rgba(242,242,242,0.7)',
                boxShadow: '0 0 10px rgba(255,255,255,0.35)',
              }}
            />
            {ticks}
            <div
              style={{
                position: 'absolute',
                left: xOf(hi) + 26,
                top: y - 20,
                fontFamily: NUM_FONT,
                fontWeight: 300,
                fontSize: 32,
                color: '#A8A8A8',
                opacity: (k === 0 ? riseP : p) * 0.9,
                whiteSpace: 'nowrap',
              }}
            >
              {count}
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// 2 × 2 × 2 × 2 × 2 × 2 × 2 = 128：每一项踩一拍
const Formula: React.FC<{ f: number }> = ({ f }) => {
  if (f < Y.terms[0] - 2) return null;
  const out = interpolate(f, Y.out, [1, 0], clamp);
  if (out <= 0) return null;

  const item = (at: number) => {
    const p = interpolate(f, [at, at + 7], [0, 1], { ...clamp, easing: easeOut });
    const flash = interpolate(f, [at, at + 12], [1, 0], clamp);
    return { p, flash };
  };

  const eq = item(Y.eq);
  return (
    <AbsoluteFill style={{ opacity: out, transform: `scale(${1 - 0.06 * (1 - out)}) translateY(${-30 * (1 - out)}px)` }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 340,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          color: INK,
        }}
      >
        {Y.terms.map((at, i) => {
          const { p, flash } = item(at);
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                opacity: p,
                transform: `translateY(${(1 - p) * -18}px)`,
                filter: `blur(${(1 - p) * 6}px)`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', height: 140 }}>
                {i > 0 && (
                  <span style={{ fontFamily: NUM_FONT, fontWeight: 300, fontSize: 64, color: '#8A8A8A', margin: '0 14px' }}>×</span>
                )}
                <span
                  style={{
                    fontFamily: NUM_FONT,
                    fontWeight: 300,
                    fontSize: 120,
                    lineHeight: 1,
                    textShadow: `0 0 ${20 + 30 * flash}px rgba(255,255,255,${0.25 + 0.45 * flash})`,
                  }}
                >
                  2
                </span>
              </div>
              <div
                style={{
                  fontFamily: NUM_FONT,
                  fontWeight: 300,
                  fontSize: 34,
                  color: '#8A8A8A',
                  marginTop: 18,
                  marginLeft: i > 0 ? 64 : 0,
                }}
              >
                {2 ** (i + 1)}
              </div>
            </div>
          );
        })}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: eq.p,
            transform: `scale(${1 + 0.12 * (1 - eq.p)})`,
            filter: `blur(${(1 - eq.p) * 6}px)`,
            marginLeft: 30,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', height: 140 }}>
            <span style={{ fontFamily: NUM_FONT, fontWeight: 300, fontSize: 80, color: '#8A8A8A', marginRight: 26 }}>=</span>
            <span
              style={{
                fontFamily: NUM_FONT,
                fontWeight: 400,
                fontSize: 132,
                lineHeight: 1,
                color: GOLD,
                textShadow: `0 0 ${30 + 40 * eq.flash}px rgba(245,194,107,${0.45 + 0.4 * eq.flash})`,
              }}
            >
              128
            </span>
          </div>
          <div style={{ fontFamily: NUM_FONT, fontWeight: 300, fontSize: 34, color: '#A8A8A8', marginTop: 18, marginLeft: 100 }}>
            ≥ 100
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 640,
          textAlign: 'center',
          fontFamily: CN_FONT,
          fontSize: 34,
          letterSpacing: 10,
          color: '#8A8A8A',
          opacity: interpolate(f, [Y.terms[1], Y.terms[1] + 10], [0, 1], clamp),
        }}
      >
        猜 <span style={{ fontFamily: NUM_FONT }}>{Y.terms.filter((t) => f >= t).length}</span> 次 · 能管住{' '}
        <span style={{ fontFamily: NUM_FONT, color: f >= Y.eq ? GOLD : '#BDBDBD' }}>
          {2 ** Y.terms.filter((t) => f >= t).length}
        </span>{' '}
        个数
      </div>
    </AbsoluteFill>
  );
};

export const Why: React.FC<{ f: number }> = ({ f }) => {
  if (f < Y.rise[0] || f > Y.out[1]) return null;
  return (
    <AbsoluteFill>
      <Funnel f={f} />
      <Formula f={f} />
    </AbsoluteFill>
  );
};
