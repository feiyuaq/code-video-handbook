import React from 'react';
import { continueRender, delayRender, Easing, interpolate, staticFile } from 'remotion';

// ---------------- 字体：App 内置的思源宋体 ----------------
export const SERIF = '"WenkuSerif", "Source Han Serif CN", "SimSun", serif';
export const SANS = '"Helvetica Neue", Arial, "Microsoft YaHei", sans-serif';
export const MONO = 'Consolas, "Courier New", monospace';

const fontHandle = delayRender('load Source Han Serif');
Promise.all(
  [
    ['SourceHanSerifCN-Regular.otf', '400'],
    ['SourceHanSerifCN-Bold.otf', '700'],
  ].map(([file, weight]) => {
    const face = new FontFace('WenkuSerif', `url(${staticFile(`wenku/${file}`)})`, { weight });
    return face.load().then((f) => (document.fonts as unknown as { add: (x: FontFace) => void }).add(f));
  }),
).then(() => continueRender(fontHandle));

// ---------------- 颜色（取自原片实测） ----------------
export const INK = '#1d1c19';
export const INK2 = '#55534d';
export const MUTED = '#8a8880';
export const RULE = 'rgba(30,28,20,0.13)';
export const ACCENT = '#a2825f';

// ---------------- 动画工具 ----------------
export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const sec = (s: number) => Math.round(s * 30);

export const ramp = (f: number, a: number, b: number, e = easeOut) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: e });
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

// 两个区间之间的值：在 [a,b] 从 v0 过渡到 v1，此前保持 v0
export const tween = (f: number, a: number, b: number, v0: number, v1: number, e = easeInOut) =>
  interpolate(f, [a, b], [v0, v1], { ...clamp, easing: e });

// 分段关键帧：[[frame, value], ...]
export const keys = (f: number, ks: [number, number][], e = easeInOut) => {
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (f <= ks[i][0]) return tween(f, ks[i - 1][0], ks[i][0], ks[i - 1][1], ks[i][1], e);
  }
  return ks[ks.length - 1][1];
};

export const Abs: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ style, children }) => (
  <div style={{ position: 'absolute', ...style }}>{children}</div>
);
