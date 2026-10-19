import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import T from '../timeline.json';
import { CN_FONT, CX, CY, Dot, HALF, INK, W, X0, X1, clamp, easeIn, easeInOut, easeOut } from './shared';

const O = T.outro;
const STEP = W / 40; // 半格间距：一半展开成整条时，原来的刻度间距翻倍，新刻度从中间长出来

type Tick = { x: number; op: number; h: number };

// 第 i 次对半：一半淡出飘走，另一半以外端为锚点展开回整条；结束时和开始时一模一样，可以无缝循环
const cycle = (t: number, keepLeft: boolean) => {
  const exclFade = interpolate(t, [3, 14], [1, 0], clamp);
  const drift = interpolate(t, [3, 16], [0, 60], { ...clamp, easing: easeOut });
  const e = interpolate(t, [8, 26], [0, 1], { ...clamp, easing: easeInOut });
  const flip = (x: number) => (keepLeft ? x : 2 * CX - x);

  const ticks: Tick[] = [];
  for (let j = 0; j <= 20; j++) {
    const x = X0 + j * STEP * (1 + e);
    const isNew = j % 2 === 1;
    const wasCenter = j === 20;
    const willCenter = j === 10;
    const h = 10 + (wasCenter ? 20 * (1 - e) : 0) + (willCenter ? 20 * e : 0);
    ticks.push({ x: flip(x), op: isNew ? e * 0.3 : 0.3 + (wasCenter ? 0.5 * (1 - e) : 0) + (willCenter ? 0.5 * e : 0), h });
  }
  const excluded: Tick[] = [];
  for (let j = 22; j <= 40; j += 2) {
    excluded.push({ x: flip(X0 + j * STEP + drift), op: 0.3 * exclFade, h: 10 });
  }
  const keptLine = [flip(X0), flip(X0 + HALF * (1 + e))].sort((a, b) => a - b);
  const exclLine = [flip(CX + drift), flip(X1 + drift)].sort((a, b) => a - b);
  return { ticks, excluded, keptLine, exclLine, exclFade, flash: Math.exp(-t / 6) };
};

const steady = () => {
  const ticks: Tick[] = [];
  for (let j = 0; j <= 20; j++) ticks.push({ x: X0 + j * 2 * STEP, op: j === 10 ? 0.8 : 0.3, h: j === 10 ? 30 : 10 });
  return ticks;
};

export const Outro: React.FC<{ f: number }> = ({ f }) => {
  if (f < O.line) return null;

  const reveal = interpolate(f, [O.line, O.line + 16], [0, 1], { ...clamp, easing: easeOut });
  const collapse = interpolate(f, O.collapse, [1, 0.004], { ...clamp, easing: easeIn });
  const lineOp = interpolate(f, [O.collapse[1] - 6, O.collapse[1]], [1, 0], clamp);

  let i = -1;
  O.cuts.forEach((c, k) => {
    if (f >= c) i = k;
  });
  const t = i >= 0 ? f - O.cuts[i] : 999;
  const active = i >= 0 && t <= 26;

  let ticks: Tick[] = steady();
  let excluded: Tick[] = [];
  let keptLine = [X0, X1];
  let exclLine = [0, 0];
  let exclFade = 0;
  let flash = 0;
  if (active) {
    const c = cycle(t, i % 2 === 1);
    ticks = c.ticks;
    excluded = c.excluded;
    keptLine = c.keptLine;
    exclLine = c.exclLine;
    exclFade = c.exclFade;
    flash = c.flash;
  }

  // 开场拉开 + 结尾收拢，都以画面中心为锚
  const sx = (x: number) => CX + (x - CX) * collapse;
  const visible = (x: number) => Math.abs(x - CX) <= reveal * HALF + 1;

  const qP = interpolate(f, [O.question, O.question + 14], [0, 1], { ...clamp, easing: easeOut });
  const qOut = interpolate(f, O.questionOut, [1, 0], clamp);
  const dotOp =
    interpolate(f, [O.collapse[1] - 6, O.collapse[1]], [0, 1], clamp) * interpolate(f, O.dotOut, [1, 0], clamp);

  const line = (x0: number, x1: number, alpha: number, key: string) => {
    const a = Math.max(sx(Math.max(x0, CX - reveal * HALF)), -10);
    const b = Math.min(sx(Math.min(x1, CX + reveal * HALF)), 1930);
    if (b <= a || alpha <= 0.005) return null;
    return (
      <div
        key={key}
        style={{
          position: 'absolute',
          left: a,
          top: CY - 1,
          width: b - a,
          height: 2,
          background: `rgba(242,242,242,${alpha})`,
          boxShadow: `0 0 12px rgba(255,255,255,${0.35 * alpha})`,
        }}
      />
    );
  };

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: lineOp }}>
        {line(keptLine[0], keptLine[1], 0.72, 'k')}
        {active && line(exclLine[0], exclLine[1], 0.72 * exclFade, 'e')}
        {[...ticks, ...excluded].map((tk, k) =>
          visible(tk.x) && tk.op > 0.005 ? (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: sx(tk.x) - 1,
                top: CY - tk.h / 2,
                width: 2,
                height: tk.h,
                background: INK,
                opacity: tk.op,
              }}
            />
          ) : null,
        )}
        {flash > 0.02 && (
          <div
            style={{
              position: 'absolute',
              left: CX - 1,
              top: CY - 120,
              width: 2,
              height: 240,
              background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1), rgba(255,255,255,0))',
              opacity: flash * 0.8,
              boxShadow: `0 0 ${20 * flash}px rgba(255,255,255,${0.6 * flash})`,
            }}
          />
        )}
      </AbsoluteFill>

      {qP > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 320,
            textAlign: 'center',
            fontFamily: CN_FONT,
            fontSize: 64,
            letterSpacing: 8,
            color: INK,
            opacity: qP * qOut,
            transform: `translateY(${(1 - qP) * 16}px)`,
            filter: `blur(${(1 - qP) * 8}px)`,
            textShadow: '0 0 24px rgba(255,255,255,0.3)',
          }}
        >
          如果是你，第一次会猜几？
        </div>
      )}

      {dotOp > 0 && <Dot opacity={dotOp} r={6} />}
    </AbsoluteFill>
  );
};
