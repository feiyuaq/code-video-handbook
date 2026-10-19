import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { ACCENT, Abs, INK, INK2, MONO, MUTED, RULE, SANS, SERIF, clamp, easeIn, easeOut, ramp } from './theme';

// ---------------- 背景：顶部偏亮、四周渐暗的奶白纸面 ----------------
export const Paper: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        'radial-gradient(ellipse 75% 65% at 55% 8%, #fafaf5 0%, #f6f6f0 40%, #f1f1ea 75%, #ececE5 100%)',
    }}
  >
    <svg width="1920" height="1080" style={{ position: 'absolute', opacity: 0.05, mixBlendMode: 'multiply' }}>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix values="0 0 0 0 0.4  0 0 0 0 0.38  0 0 0 0 0.3  0 0 0 0.9 0" />
      </filter>
      <rect width="1920" height="1080" filter="url(#grain)" />
    </svg>
  </AbsoluteFill>
);

// ---------------- 顶栏 + 角标（全片常驻） ----------------
export const Chrome: React.FC<{ f: number }> = ({ f }) => {
  const a = ramp(f, 0, 8);
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <Abs style={{ left: 76, top: 47, fontFamily: SANS, fontSize: 21, letterSpacing: 0.4, color: INK }}>PAPERNOTE</Abs>
      <Abs style={{ left: 197, top: 61, width: 33, height: 1, background: 'rgba(30,28,20,0.3)' }} />
      <Abs style={{ left: 247, top: 54, fontFamily: MONO, fontSize: 12.5, letterSpacing: 1.2, color: INK2 }}>READING ARCHIVE</Abs>
      <Abs style={{ right: 76, top: 49, fontFamily: SERIF, fontSize: 18, letterSpacing: 1.5, color: INK2 }}>纸面阅读器</Abs>
      {[75, 1845].map((x) => (
        <Abs key={x} style={{ left: x - 3, top: 1005, width: 6, height: 6, borderRadius: 3, background: 'rgba(30,28,20,0.12)' }} />
      ))}
    </AbsoluteFill>
  );
};

// ---------------- 文字区：眉标 + 细线 + 两行大标题 + 切换的小字说明 ----------------
export type Sub = { at: number; a: string; b: string };

const TITLE_SIZE = 86;
const TITLE_LH = 106;

export const TitleBlock: React.FC<{
  f: number;
  x: number;
  inAt: number;
  outAt: number;
  eyebrow: string;
  lines: string[];
  subs?: Sub[];
  width?: number;
  top?: number;
}> = ({ f, x, inAt, outAt, eyebrow, lines, subs = [], width = 648, top = 0 }) => {
  if (f < inAt - 2 || f > outAt + 18) return null;
  // 退场：整体向左滑出，被左边界裁掉
  const outP = ramp(f, outAt, outAt + 14, easeIn);
  const shift = -760 * outP;

  const brow = ramp(f, inAt - 2, inAt + 8);
  const rule1 = ramp(f, inAt, inAt + 18);
  const rule2 = ramp(f, inAt + 6, inAt + 24);

  let cur = -1;
  subs.forEach((s, i) => {
    if (f >= s.at) cur = i;
  });

  return (
    <Abs style={{ left: x, top, width: width + 200, height: 1080, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: width + 200, height: 1080, transform: `translateX(${shift}px)` }}>
        <Abs style={{ left: 0, top: 326, fontFamily: SANS, fontSize: 17, letterSpacing: 0.3, color: INK2, opacity: brow }}>{eyebrow}</Abs>
        <Abs style={{ left: 0, top: 367, width: width * rule1, height: 1, background: RULE }} />

        {lines.map((t, i) => {
          const p = ramp(f, inAt + i * 3, inAt + i * 3 + 17);
          return (
            <Abs
              key={i}
              style={{
                left: 0,
                top: 390 + i * TITLE_LH,
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: TITLE_SIZE,
                lineHeight: `${TITLE_LH}px`,
                color: INK,
                whiteSpace: 'nowrap',
                opacity: p,
                transform: `translateX(${(1 - p) * (150 + i * 70)}px)`,
              }}
            >
              {t}
            </Abs>
          );
        })}

        {subs.length > 0 && (
          <>
            <Abs style={{ left: 0, top: 678, width: width * rule2, height: 1, background: RULE }} />
            <Abs style={{ left: width - 5, top: 675, width: 6, height: 6, background: ACCENT, opacity: rule2 }} />
          </>
        )}

        {subs.map((s, i) => {
          if (i < cur - 1 || i > cur) return null;
          const next = subs[i + 1];
          const inP = ramp(f, Math.max(s.at, inAt + 8), Math.max(s.at, inAt + 8) + 10);
          const outP2 = next ? ramp(f, next.at - 1, next.at + 6, easeIn) : 0;
          const op = inP * (1 - outP2);
          if (op <= 0.001) return null;
          const dy = (1 - inP) * 14 - outP2 * 10;
          return (
            <React.Fragment key={i}>
              <Abs
                style={{
                  left: 0,
                  top: 704 + dy,
                  fontFamily: SERIF,
                  fontWeight: 700,
                  fontSize: 28,
                  letterSpacing: 0.5,
                  color: INK,
                  opacity: op,
                  whiteSpace: 'nowrap',
                }}
              >
                {s.a}
              </Abs>
              <Abs
                style={{
                  left: 0,
                  top: 752 + dy * 1.3,
                  fontFamily: SERIF,
                  fontSize: 24,
                  letterSpacing: 0.5,
                  color: MUTED,
                  opacity: op,
                  whiteSpace: 'nowrap',
                }}
              >
                {s.b}
              </Abs>
            </React.Fragment>
          );
        })}
      </div>
    </Abs>
  );
};

// 小标题标签（无大标题时使用）
export const Eyebrow: React.FC<{ text: string; style?: React.CSSProperties; mono?: boolean }> = ({ text, style, mono }) => (
  <Abs style={{ fontFamily: mono ? MONO : SANS, fontSize: mono ? 14 : 17, letterSpacing: mono ? 1.2 : 0.3, color: INK2, ...style }}>{text}</Abs>
);

export const fadeSlide = (f: number, at: number, dist = 120, dur = 16) => {
  const p = ramp(f, at, at + dur);
  return { opacity: p, transform: `translateX(${(1 - p) * dist}px)` };
};

export const exitLeft = (f: number, at: number) => interpolate(f, [at, at + 14], [0, -760], { ...clamp, easing: easeIn });
