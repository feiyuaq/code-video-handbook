import React from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import T from '../timeline.json';

// ---------------- 版式常量 ----------------
export const CX = 960;
export const CY = 540;
export const X0 = 160;
export const X1 = 1760;
export const W = X1 - X0;
export const HALF = W / 2;

export const NUM_FONT = '"Bahnschrift", "Segoe UI", sans-serif';
export const CN_FONT = '"Microsoft YaHei Light", "Microsoft YaHei", sans-serif';
export const INK = '#F2F2F2';
export const GOLD = '#F5C26B';

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);

// 1–100 铺满整条数轴时的横坐标
export const xOf = (n: number) => X0 + ((n - 1) / 99) * W;

// 光随拍子呼吸：每拍开头最亮，然后衰减
export const beatPulse = (f: number) => {
  const phase = (((f - T.beatAnchor) % T.beatFrames) + T.beatFrames) % T.beatFrames;
  return Math.exp(-phase / 5);
};

// ---------------- 字幕 ----------------
export const Subtitle: React.FC<{ from: number; to: number; text: string }> = ({ from, to, text }) => {
  const f = useCurrentFrame();
  if (f < from || f > to + 8) return null;
  const inP = interpolate(f, [from, from + 9], [0, 1], { ...clamp, easing: easeOut });
  const outP = interpolate(f, [to, to + 8], [1, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 828,
        textAlign: 'center',
        fontFamily: CN_FONT,
        fontSize: 46,
        letterSpacing: 6,
        color: INK,
        opacity: inP * outP,
        transform: `translateY(${(1 - inP) * 14}px)`,
        filter: `blur(${(1 - inP) * 6}px)`,
        textShadow: '0 0 18px rgba(255,255,255,0.25)',
      }}
    >
      {text}
    </div>
  );
};

export const Dot: React.FC<{ opacity: number; r: number; x?: number; y?: number; color?: string }> = ({
  opacity,
  r,
  x = CX,
  y = CY,
  color = '#fff',
}) => (
  <div
    style={{
      position: 'absolute',
      left: x - r,
      top: y - r,
      width: r * 2,
      height: r * 2,
      borderRadius: '50%',
      background: color,
      opacity,
      boxShadow: `0 0 ${r * 4}px ${r}px ${color === '#fff' ? 'rgba(255,255,255,0.55)' : 'rgba(245,194,107,0.55)'}`,
    }}
  />
);

// 向外扩散的光环
export const Ring: React.FC<{ t: number; delay: number; maxR: number; w: number; x?: number; y?: number; rgb?: string; alpha?: number }> = ({
  t,
  delay,
  maxR,
  w,
  x = CX,
  y = CY,
  rgb = '255,255,255',
  alpha = 0.7,
}) => {
  const p = interpolate(t, [delay, delay + 34], [0, 1], { ...clamp, easing: easeOut });
  if (p <= 0 || p >= 1) return null;
  const r = 40 + p * maxR;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        border: `${w}px solid rgba(${rgb},${alpha * (1 - p)})`,
        boxShadow: `0 0 30px rgba(${rgb},${0.35 * (1 - p)})`,
      }}
    />
  );
};
