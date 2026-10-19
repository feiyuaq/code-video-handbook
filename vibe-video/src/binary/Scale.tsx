import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import T from '../timeline.json';
import { CN_FONT, CX, CY, Dot, GOLD, INK, NUM_FONT, Ring, W, X0, clamp, easeIn, easeOut } from './shared';

const S = T.scale;

// 与 tools/sfx.py 中滚动音效使用完全相同的公式
export const kAt = (f: number) => {
  let prev = S.startK;
  for (const key of S.keys) {
    const r0 = key.f - S.roll;
    if (f >= key.f) {
      prev = key.k;
      continue;
    }
    if (f >= r0) return prev + Math.floor(((key.k - prev) * (f - r0)) / S.roll);
    return prev;
  }
  return prev;
};

const approx = (v: number) => {
  if (v >= 1e8) return `约 ${Math.round(v / 1e8)} 亿`;
  if (v >= 1e4) return `约 ${Math.round(v / 1e4)} 万`;
  return '';
};

// 背景刻度：能管住的数越多，刻度越密，最后连成一条发光的线
const Ruler: React.FC<{ k: number; op: number; flash: number }> = ({ k, op, flash }) => {
  const count = Math.min(2 ** k, 512);
  const tickOp = 0.06 + 0.4 * Math.min(1, 40 / count);
  const y = 742;
  const ticks: React.ReactNode[] = [];
  for (let i = 0; i <= count; i++) {
    ticks.push(
      <div
        key={i}
        style={{ position: 'absolute', left: X0 + (i / count) * W - 0.5, top: y - 5, width: 1, height: 10, background: INK, opacity: tickOp }}
      />,
    );
  }
  const glow = Math.min(1, Math.log2(count) / 9);
  return (
    <AbsoluteFill style={{ opacity: op }}>
      <div
        style={{
          position: 'absolute',
          left: X0,
          top: y - 1,
          width: W,
          height: 2,
          background: `rgba(242,242,242,${0.35 + 0.35 * glow + 0.3 * flash})`,
          boxShadow: `0 0 ${8 + 18 * glow + 30 * flash}px rgba(255,255,255,${0.2 + 0.3 * glow + 0.4 * flash})`,
        }}
      />
      {ticks}
    </AbsoluteFill>
  );
};

const Counting: React.FC<{ f: number }> = ({ f }) => {
  const op = interpolate(f, S.in, [0, 1], clamp) * interpolate(f, S.dim, [1, 0], clamp);
  if (op <= 0) return null;
  const k = kAt(f);
  const v = 2 ** k;

  // 每次落定时轻轻一跳
  const landed = [...S.keys].reverse().find((key) => f >= key.f);
  const pulse = landed ? Math.exp(-(f - landed.f) / 6) : 0;
  const pickup = interpolate(f, [S.pickup, S.pickup + 6], [1, 0], clamp) * (f >= S.pickup ? 1 : 0);

  return (
    <AbsoluteFill>
      <Ruler k={k} op={op * 0.9} flash={pickup} />
      <AbsoluteFill style={{ opacity: op }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 230,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'baseline',
            color: INK,
            transform: `scale(${1 + 0.05 * pulse})`,
          }}
        >
          <span style={{ fontFamily: CN_FONT, fontSize: 64, letterSpacing: 6, opacity: 0.8, marginRight: 26 }}>猜</span>
          <span
            style={{
              fontFamily: NUM_FONT,
              fontWeight: 300,
              fontSize: 230,
              lineHeight: 1,
              display: 'inline-block',
              minWidth: 260,
              textAlign: 'center',
              textShadow: `0 0 ${30 + 30 * pulse}px rgba(255,255,255,${0.3 + 0.3 * pulse})`,
            }}
          >
            {k}
          </span>
          <span style={{ fontFamily: CN_FONT, fontSize: 64, opacity: 0.8, marginLeft: 20 }}>次</span>
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 520,
            textAlign: 'center',
            color: INK,
            fontFamily: CN_FONT,
            fontSize: 42,
            letterSpacing: 4,
          }}
        >
          就能从{' '}
          <span style={{ fontFamily: NUM_FONT, fontWeight: 300, fontSize: 64, letterSpacing: 2, margin: '0 8px' }}>
            {v.toLocaleString('en-US')}
          </span>{' '}
          个数里，找出 1 个
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 618,
            textAlign: 'center',
            fontFamily: CN_FONT,
            fontSize: 34,
            letterSpacing: 6,
            color: '#8A8A8A',
          }}
        >
          {approx(v)}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 第二个爆点（比第一个小一号）：80 亿人，33 次
const Drop2: React.FC<{ f: number }> = ({ f }) => {
  const t = f - S.drop;
  if (t < 0 || f > S.shrink[1]) return null;

  const settle = interpolate(t, [0, 7], [1.14, 1], { ...clamp, easing: easeOut });
  const unblur = interpolate(t, [0, 5], [8, 0], clamp);
  const breathe = 1 + Math.sin((t / T.beatFrames) * Math.PI) * 0.006;
  const shrink = interpolate(f, S.shrink, [1, 0.012], { ...clamp, easing: easeIn });
  const sideFade = interpolate(f, [S.shrink[0], S.shrink[0] + 10], [1, 0], clamp);
  const numOp = interpolate(f, [S.shrink[1] - 8, S.shrink[1] - 2], [1, 0], clamp);
  const flash = interpolate(t, [0, 14], [0.26, 0], { ...clamp, easing: easeOut });
  const topP = interpolate(t, [3, 12], [0, 1], { ...clamp, easing: easeOut });
  const botP = interpolate(t, [9, 20], [0, 1], { ...clamp, easing: easeOut });

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{ background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,${flash}) 0%, rgba(255,255,255,0) 55%)` }}
      />
      <Ring t={t} delay={0} maxR={900} w={2.5} />
      <Ring t={t} delay={5} maxR={640} w={1.2} alpha={0.5} />

      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          transform: `scale(${settle * breathe * shrink})`,
          filter: `blur(${unblur}px)`,
          opacity: numOp,
        }}
      >
        <div
          style={{
            fontFamily: CN_FONT,
            fontSize: 52,
            letterSpacing: 10,
            color: INK,
            opacity: topP * sideFade * 0.9,
            transform: `translateY(${(1 - topP) * 12}px)`,
            marginBottom: 6,
          }}
        >
          全世界 <span style={{ fontFamily: NUM_FONT, fontSize: 60 }}>80</span> 亿人
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', color: INK }}>
          <span
            style={{
              fontFamily: NUM_FONT,
              fontWeight: 400,
              fontSize: 400,
              lineHeight: 1,
              color: '#fff',
              textShadow: '0 0 60px rgba(255,255,255,0.45), 0 0 140px rgba(245,194,107,0.22)',
            }}
          >
            33
          </span>
          <span style={{ fontFamily: CN_FONT, fontSize: 84, opacity: 0.8 * sideFade, marginLeft: 24 }}>次</span>
        </div>
        <div
          style={{
            fontFamily: NUM_FONT,
            fontWeight: 300,
            fontSize: 32,
            letterSpacing: 4,
            color: '#8A8A8A',
            opacity: botP * sideFade,
            marginTop: 18,
          }}
        >
          2<sup style={{ fontSize: 20 }}>33</sup> = 8,589,934,592
          <span style={{ fontFamily: CN_FONT, margin: '0 14px', color: GOLD, opacity: 0.8 }}>＞</span>
          <span style={{ fontFamily: CN_FONT }}>80 亿</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Scale: React.FC<{ f: number }> = ({ f }) => {
  if (f < S.in[0] || f > T.outro.line + 24) return null;
  const dotOp =
    interpolate(f, [S.shrink[1] - 6, S.shrink[1]], [0, 1], clamp) *
    interpolate(f, [T.outro.line + 8, T.outro.line + 20], [1, 0], clamp);
  return (
    <AbsoluteFill>
      <Counting f={f} />
      <Drop2 f={f} />
      {dotOp > 0 && <Dot opacity={dotOp} r={6} x={CX} y={CY} />}
    </AbsoluteFill>
  );
};
