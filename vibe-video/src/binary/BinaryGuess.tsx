import React from 'react';
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from 'remotion';
import T from '../timeline.json';
import { Game } from './Game';
import { Outro } from './Outro';
import { Scale } from './Scale';
import { Why } from './Why';
import { CN_FONT, CX, CY, Dot, GOLD, HALF, INK, NUM_FONT, Subtitle, beatPulse, clamp, easeIn, easeOut, xOf } from './shared';

// 与 tools/sfx.py 中 march_ticks() 完全相同的公式
const marchN = (f: number) => {
  const m = T.march;
  const p = (f - m.start) / (m.end - m.start);
  return Math.floor(m.from + (m.to - m.from) * Math.pow(p, m.power));
};

// ---------------- 数轴 ----------------
const NumberLine: React.FC<{ f: number; drawFrom: number; litN: number; litFade: number; centerGlow: number }> = ({
  f,
  drawFrom,
  litN,
  litFade,
  centerGlow,
}) => {
  const half = interpolate(f, [drawFrom, drawFrom + 16], [0, HALF], { ...clamp, easing: easeOut });
  const lineGlow = 0.35 + centerGlow * 0.5;

  const ticks = [];
  for (let n = 1; n <= 100; n++) {
    const x = xOf(n);
    const dist = Math.abs(x - CX) / HALF;
    const appear = drawFrom + 4 + dist * 14;
    const a = interpolate(f, [appear, appear + 6], [0, 1], clamp);
    if (a <= 0) continue;
    const major = n === 1 || n % 10 === 0;
    const lit = n <= litN;
    const baseOp = major ? 0.5 : 0.26;
    const op = lit ? baseOp + (0.95 - baseOp) * litFade : baseOp;
    const h = major ? 20 : 9;
    ticks.push(
      <div
        key={n}
        style={{
          position: 'absolute',
          left: x - 1,
          top: CY - h / 2,
          width: 2,
          height: h,
          background: INK,
          opacity: a * op,
          boxShadow: lit && litFade > 0.5 ? '0 0 8px rgba(255,255,255,0.8)' : undefined,
        }}
      />,
    );
  }

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: CX - half,
          top: CY - 1,
          width: half * 2,
          height: 2,
          background: `rgba(242,242,242,${0.55 + centerGlow * 0.4})`,
          boxShadow: `0 0 ${10 + centerGlow * 18}px rgba(255,255,255,${lineGlow})`,
        }}
      />
      {ticks}
    </>
  );
};

const EndLabel: React.FC<{ f: number; at: number; n: number }> = ({ f, at, n }) => {
  const p = interpolate(f, [at, at + 10], [0, 1], { ...clamp, easing: easeOut });
  return (
    <div
      style={{
        position: 'absolute',
        left: xOf(n) - 100,
        width: 200,
        top: CY + 30,
        textAlign: 'center',
        fontFamily: NUM_FONT,
        fontWeight: 300,
        fontSize: 40,
        color: INK,
        opacity: p * 0.85,
        transform: `translateY(${(1 - p) * 10}px)`,
      }}
    >
      {n}
    </div>
  );
};

// ---------------- 第一幕：钩子（0 – 16.2s） ----------------
const Hook: React.FC<{ f: number }> = ({ f }) => {
  const m = T.march;

  // 点亮进度：逐个试 → 一口气补满到 100 → 复位
  let litN = 0;
  if (f >= m.start && f < T.worst) litN = marchN(f);
  else if (f >= T.worst) litN = Math.round(interpolate(f, [T.worst, T.worst + 6], [m.to, 100], clamp));
  const litFade = f < T.worst + 20 ? 1 : interpolate(f, [T.worst + 20, T.worst + 50], [1, 0], clamp);

  // 中点 50 的光：从蓄力开始，随拍子呼吸，越来越亮
  const build = interpolate(f, [T.buildStart, T.black], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const centerGlow = build * (0.45 + 0.55 * beatPulse(f));

  // 镜头缓慢推近；高潮前整体收暗
  const push = interpolate(f, [T.buildStart, T.black], [1, 1.07], { ...clamp, easing: Easing.in(Easing.quad) });
  const dim = interpolate(f, [T.dimStart, T.black], [1, 0], { ...clamp, easing: easeIn });

  // 开场光点：出现 → 呼吸 → 被拉成一条线
  const dotOp =
    interpolate(f, [T.dotIn, T.dotIn + 10], [0, 1], clamp) *
    interpolate(f, [T.lineDraw + 6, T.lineDraw + 18], [1, 0], clamp);
  const dotR = 5 + Math.sin(f / 6) * 0.8;

  // 光标：沿着数轴一格一格往前走
  const cursorN = litN;
  const cursorOp =
    f >= m.start
      ? interpolate(f, [m.start, m.start + 4], [0, 1], clamp) *
        interpolate(f, [T.worst + 8, T.worst + 22], [1, 0], clamp)
      : 0;

  // 计数器
  const counterOp =
    interpolate(f, [m.start, m.start + 8], [0, 1], clamp) * interpolate(f, [T.worst + 45, T.worst + 62], [1, 0], clamp);
  const worstT = f - T.worst;
  const shake = worstT >= 0 ? Math.sin(worstT * 2.6) * 14 * Math.exp(-worstT / 4) : 0;
  const isWorst = f >= T.worst;

  return (
    <AbsoluteFill style={{ opacity: dim, transform: `scale(${push})` }}>
      <Dot opacity={dotOp} r={dotR} />
      {f >= T.lineDraw && <NumberLine f={f} drawFrom={T.lineDraw} litN={litN} litFade={litFade} centerGlow={centerGlow} />}
      <EndLabel f={f} at={T.label1} n={1} />
      <EndLabel f={f} at={T.label100} n={100} />

      {/* 中点之光：竖直的一道细光柱，预示「猜中间」 */}
      {build > 0 && (
        <div
          style={{
            position: 'absolute',
            left: xOf(50) - 1,
            top: CY - 150,
            width: 2,
            height: 300,
            background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.9), rgba(255,255,255,0))',
            opacity: centerGlow,
            boxShadow: `0 0 ${24 * centerGlow}px rgba(255,255,255,${0.6 * centerGlow})`,
          }}
        />
      )}

      {cursorOp > 0 && cursorN >= 1 && (
        <div
          style={{
            position: 'absolute',
            left: xOf(Math.min(cursorN, 100)) - 7,
            top: CY - 7,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#fff',
            opacity: cursorOp,
            boxShadow: '0 0 22px 6px rgba(255,255,255,0.6)',
          }}
        />
      )}

      {counterOp > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: isWorst ? 190 : 250,
            textAlign: 'center',
            fontFamily: NUM_FONT,
            color: INK,
            opacity: counterOp,
            transform: `translateX(${shake}px)`,
          }}
        >
          {isWorst ? (
            <span style={{ fontSize: 150, fontWeight: 300, letterSpacing: 4 }}>
              100
              <span style={{ fontFamily: CN_FONT, fontSize: 52, marginLeft: 16 }}>次</span>
            </span>
          ) : (
            <span style={{ fontSize: 44, letterSpacing: 6, opacity: 0.75 }}>
              <span style={{ fontFamily: CN_FONT }}>第 </span>
              <span style={{ display: 'inline-block', minWidth: 60 }}>{Math.max(litN, 1)}</span>
              <span style={{ fontFamily: CN_FONT }}> 次</span>
            </span>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------------- 第二幕：高潮（16.30s 重拍） ----------------
const Drop: React.FC<{ f: number }> = ({ f }) => {
  const t = f - T.drop;
  if (t < 0) return null;

  // 「7」落定：缩放 + 去模糊，峰值正好在重拍帧
  const settle = interpolate(t, [0, 7], [1.16, 1], { ...clamp, easing: easeOut });
  const unblur = interpolate(t, [0, 5], [10, 0], clamp);
  const breathe = 1 + Math.sin((t / T.beatFrames) * Math.PI) * 0.008;

  // 收拢成一个点（转场到下一幕）
  const shrink = interpolate(f, [T.dropOut, T.redraw - 4], [1, 0.012], { ...clamp, easing: easeIn });
  const sideFade = interpolate(f, [T.dropOut, T.dropOut + 10], [1, 0], clamp);
  const sevenOp = interpolate(f, [T.redraw - 8, T.redraw - 2], [1, 0], clamp);

  const flash = interpolate(t, [0, 14], [0.42, 0], { ...clamp, easing: easeOut });
  const ring = (delay: number, maxR: number, w: number) => {
    const p = interpolate(t, [delay, delay + 34], [0, 1], { ...clamp, easing: easeOut });
    if (p <= 0 || p >= 1) return null;
    const r = 60 + p * maxR;
    return (
      <div
        style={{
          position: 'absolute',
          left: CX - r,
          top: CY - r,
          width: r * 2,
          height: r * 2,
          borderRadius: '50%',
          border: `${w}px solid rgba(255,255,255,${0.7 * (1 - p)})`,
          boxShadow: `0 0 30px rgba(255,255,255,${0.35 * (1 - p)})`,
        }}
      />
    );
  };

  const termP = interpolate(f, [T.term, T.term + 14], [0, 1], { ...clamp, easing: easeOut });

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,${flash}) 0%, rgba(255,255,255,0) 60%)`,
        }}
      />
      {ring(0, 1100, 3)}
      {ring(5, 820, 1.5)}

      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          transform: `scale(${settle * breathe * shrink})`,
          filter: `blur(${unblur}px)`,
          opacity: sevenOp,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', color: INK, marginTop: -40 }}>
          <span style={{ fontFamily: CN_FONT, fontSize: 84, letterSpacing: 6, opacity: 0.8 * sideFade, marginRight: 28 }}>
            最多
          </span>
          <span
            style={{
              fontFamily: NUM_FONT,
              fontWeight: 400,
              fontSize: 560,
              lineHeight: 1,
              color: '#fff',
              textShadow: '0 0 60px rgba(255,255,255,0.45), 0 0 140px rgba(245,194,107,0.25)',
            }}
          >
            7
          </span>
          <span style={{ fontFamily: CN_FONT, fontSize: 84, opacity: 0.8 * sideFade, marginLeft: 24 }}>次</span>
        </div>
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 836,
          textAlign: 'center',
          fontFamily: CN_FONT,
          fontSize: 34,
          letterSpacing: 14,
          color: '#A8A8A8',
          opacity: termP * sideFade,
          transform: `translateY(${(1 - termP) * 12}px)`,
        }}
      >
        二分查找
        <span style={{ fontFamily: NUM_FONT, fontSize: 28, letterSpacing: 10, margin: '0 22px', color: GOLD }}>·</span>
        <span style={{ fontFamily: NUM_FONT, fontSize: 28, letterSpacing: 10 }}>BINARY SEARCH</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- 第三幕开头：「7」收成一个点，点再拉回数轴（数轴由 Game 接手） ----------------
const Rebirth: React.FC<{ f: number }> = ({ f }) => {
  if (f < T.redraw - 6 || f > T.redraw + 20) return null;
  const dotOp =
    interpolate(f, [T.redraw - 6, T.redraw], [0, 1], clamp) * interpolate(f, [T.redraw + 8, T.redraw + 20], [1, 0], clamp);
  return <Dot opacity={dotOp} r={6} />;
};

export const BinaryGuess: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Audio src={staticFile('bgm.mp3')} volume={(fr) => interpolate(fr, T.outro.bgmFade, [0.85, 0], clamp)} />
      <Audio src={staticFile('sfx.wav')} volume={1} />

      {f < T.drop && <Hook f={f} />}
      {f >= T.drop && f < T.redraw && <Drop f={f} />}
      <Rebirth f={f} />
      <Game f={f} />
      <Why f={f} />
      <Scale f={f} />
      <Outro f={f} />

      {T.subs.map((s) => (
        <Subtitle key={s.from} from={s.from} to={s.to} text={s.text} />
      ))}
    </AbsoluteFill>
  );
};
