import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { Chrome, Paper, TitleBlock, exitLeft } from './layout';
import { LEFT, MODES, Phone, PhoneBox, RIGHT, lerpBox } from './Phone';
import {
  BookDetail,
  ImportDone,
  LocalHome,
  NIGHT,
  PAPER,
  PARAS,
  Reader,
  SEPIA,
  SettingsPanel,
  Tap,
  VerticalReader,
  mixTheme,
} from './screens';
import { ACCENT, Abs, INK, INK2, MONO, MUTED, RULE, SANS, SERIF, easeIn, easeInOut, easeOut, keys, lerp, ramp } from './theme';

export const WENKU_FRAMES = 2250;

// ======================= 时间轴（帧，30fps；取自原片实测） =======================
const T = {
  open: { title: 3, sub: 4, line: 64, wk: 68, out: 163 },
  footOut: [172, 186] as const,
  phoneIn: [166, 180] as const,
  discover: { start: 168, in: 196, out: 636, fade: [626, 638] as const },
  toLeft1: [636, 664] as const,
  read1: { in: 670, turns: [692, 738], out: 780 },
  modes: { shrink: [780, 800] as const, split: [800, 822] as const, label: 796, head: 826, merge: [918, 938] as const, toLeft: [938, 960] as const },
  settings: { in: 962, out: 1389 },
  toRight: [1392, 1418] as const,
  listen: { in: 1422, out: 1596 },
  toLeft2: [1598, 1624] as const,
  collect: { in: 1630, out: 1905 },
  phoneOut: [1905, 1926] as const,
  overview: { in: 1928, out: 2052 },
  ending: { title: 2075, icon: 2082, sub: 2092, repo: 2104, qr: 2112 },
};

// ======================= 手机位置 =======================
const phoneBox = (f: number): PhoneBox | null => {
  if (f < T.phoneIn[0]) return null;
  const mv = (a: PhoneBox, b: PhoneBox, r: readonly [number, number]) => lerpBox(a, b, ramp(f, r[0], r[1], easeInOut));
  if (f < T.toLeft1[1]) return { ...mv(RIGHT, LEFT, T.toLeft1), opacity: ramp(f, T.phoneIn[0], T.phoneIn[1]) };
  if (f < T.modes.shrink[0]) return LEFT;
  if (f < T.modes.toLeft[0]) return mv(LEFT, MODES[1], T.modes.shrink);
  if (f < T.toRight[0]) return mv(MODES[1], LEFT, T.modes.toLeft);
  if (f < T.toLeft2[0]) return mv(LEFT, RIGHT, T.toRight);
  if (f < T.phoneOut[0]) return mv(RIGHT, LEFT, T.toLeft2);
  const p = ramp(f, T.phoneOut[0], T.phoneOut[1], easeIn);
  if (p >= 1) return null;
  return { ...LEFT, y: LEFT.y + 70 * p, opacity: 1 - p };
};

// ======================= 排版辅助：估算每段的高度 =======================
const paraTops = (paras: string[], fontSize: number, lh: number, gap: number, margin = 26) => {
  const perLine = Math.floor((390 - margin * 2) / fontSize);
  const tops: number[] = [];
  let y = 0;
  paras.forEach((t) => {
    tops.push(y);
    y += Math.ceil(t.length / perLine) * fontSize * lh + gap;
  });
  return tops;
};

// ======================= 开场：书堆 =======================
const Opening: React.FC<{ f: number }> = ({ f }) => {
  if (f > T.open.out + 20) return null;
  const sh = exitLeft(f, T.open.out);
  const t1 = ramp(f, T.open.title - 3, T.open.title + 14);
  const t2 = ramp(f, T.open.title, T.open.title + 17);
  const sub = ramp(f, T.open.sub, T.open.sub + 14);
  const wk = ramp(f, T.open.wk, T.open.wk + 12);
  const lineP = ramp(f, T.open.line, T.open.line + 20, easeInOut);
  // 引导线：水平段 + 斜线指向书堆（原片实测坐标 ×1.5）
  const pts = [
    [100, 776],
    [668, 776],
    [1052, 456],
  ];
  const seg1 = 568;
  const seg2 = Math.hypot(384, 320);
  const len = (seg1 + seg2) * lineP;
  return (
    <Abs style={{ left: 0, top: 0, width: 1920, height: 1080, overflow: 'hidden' }}>
      <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, transform: `translateX(${sh}px)`, opacity: 1 - ramp(f, T.open.out, T.open.out + 8) }}>
        <polyline
          points={pts.map((p) => p.join(',')).join(' ')}
          fill="none"
          stroke="rgba(30,28,20,0.2)"
          strokeWidth={1.4}
          strokeDasharray={`${len} 4000`}
        />
      </svg>
      <Abs style={{ left: 100, top: 0, width: 900, height: 1080, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, transform: `translateX(${sh}px)` }}>
          <Abs style={{ left: 0, top: 287, fontFamily: SANS, fontSize: 17, letterSpacing: 0.4, color: INK2 }}>LIGHT NOVEL READER</Abs>
          {['把故事，', '珍藏起来。'].map((t, i) => {
            const p = i === 0 ? t1 : t2;
            return (
              <Abs
                key={t}
                style={{
                  left: 0,
                  top: 348 + i * 108,
                  fontFamily: SERIF,
                  fontWeight: 700,
                  fontSize: 88,
                  lineHeight: '108px',
                  color: INK,
                  opacity: p,
                  transform: `translateX(${(1 - p) * (120 + 60 * i)}px)`,
                }}
              >
                {t}
              </Abs>
            );
          })}
          <Abs style={{ left: 0, top: 656, fontFamily: SERIF, fontSize: 30, color: MUTED, letterSpacing: 1, opacity: sub }}>纸面阅读器</Abs>
          <Abs style={{ left: 6, top: 790, fontFamily: SERIF, fontSize: 19, color: MUTED, opacity: wk, transform: `translateY(${(1 - wk) * 8}px)` }}>
            WK-03332 / 我们没有故事
          </Abs>
        </div>
      </Abs>
    </Abs>
  );
};

// 原片书堆动画：截取右侧区域，边缘羽化融进纸面
const OpeningFootage: React.FC<{ f: number }> = ({ f }) => {
  if (f > T.footOut[1]) return null;
  const op = 1 - ramp(f, T.footOut[0], T.footOut[1]);
  const mask =
    'linear-gradient(90deg, transparent 0px, #000 150px, #000 900px, transparent 1020px), linear-gradient(180deg, transparent 0px, #000 70px)';
  return (
    <Abs style={{ left: 780, top: 75, width: 1020, height: 1006, opacity: op, WebkitMaskImage: mask, maskImage: mask, WebkitMaskComposite: 'source-in', maskComposite: 'intersect' }}>
      <Sequence from={0} durationInFrames={T.footOut[1] + 1} layout="none">
        <OffthreadVideo src={staticFile('wenku/opening.mp4')} muted style={{ width: 1020, height: 1006 }} />
      </Sequence>
    </Abs>
  );
};

// ======================= 阅读：逐段翻页 =======================
const PAGES = [PARAS.slice(0, 6), PARAS.slice(6, 11), PARAS.slice(11, 16)];

const PageTurn: React.FC<{ f: number; H: number; turns: number[]; chrome?: number }> = ({ f, H, turns, chrome = 1 }) => {
  let page = 0;
  turns.forEach((t) => {
    if (f >= t + 34) page++;
  });
  const active = turns.findIndex((t) => f >= t && f < t + 34);
  const label = `本章 ${Math.min(page + (active >= 0 ? 1 : 0), 2) + 1} / 5 页`;
  const body = (paras: string[], style: (i: number) => React.CSSProperties) => (
    <Reader H={H} headless paras={paras} paraStyle={style} chTitle={undefined} />
  );
  return (
    <>
      <Reader H={H} paras={[]} chrome={chrome} page={label} />
      {active < 0 && body(PAGES[page], () => ({}))}
      {active >= 0 &&
        (() => {
          const t0 = turns[active];
          const out = (i: number): React.CSSProperties => {
            const p = ramp(f, t0 + i * 3, t0 + i * 3 + 12, easeIn);
            return { transform: `translateX(${-70 * p}px)`, opacity: 1 - p };
          };
          const inn = (i: number): React.CSSProperties => {
            const p = ramp(f, t0 + 10 + i * 3, t0 + 10 + i * 3 + 14, easeOut);
            return { transform: `translateX(${70 * (1 - p)}px)`, opacity: p };
          };
          return (
            <>
              {body(PAGES[active], out)}
              {body(PAGES[active + 1], inn)}
            </>
          );
        })()}
    </>
  );
};

// ======================= 三种阅读方式 =======================
const HorizontalPager: React.FC<{ f: number; H: number; flips: number[]; dir: 1 | -1; vertical?: boolean }> = ({ f, H, flips, dir, vertical }) => {
  let page = 0;
  flips.forEach((t) => {
    if (f >= t + 16) page++;
  });
  const active = flips.findIndex((t) => f >= t && f < t + 16);
  const pageEl = (k: number, x: number) => (
    <div key={k} style={{ position: 'absolute', inset: 0, transform: `translateX(${x}px)` }}>
      {vertical ? <VerticalReader H={H} headless paras={PAGES[k % 3]} /> : <Reader H={H} headless paras={PAGES[k % 3]} />}
    </div>
  );
  return (
    <>
      <Reader H={H} paras={[]} page={`本章 ${page + 1} / 5 页`} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 96, bottom: 92, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: -96, height: H }}>
          {active < 0
            ? pageEl(page, 0)
            : (() => {
                const p = ramp(f, flips[active], flips[active] + 16, easeInOut);
                return [pageEl(page, -dir * 390 * p), pageEl(page + 1, dir * 390 * (1 - p))];
              })()}
        </div>
      </div>
    </>
  );
};

const ModeLabels: React.FC<{ f: number }> = ({ f }) => {
  const a = ramp(f, T.modes.label, T.modes.label + 14) * (1 - ramp(f, T.modes.merge[0], T.modes.merge[0] + 10));
  if (a <= 0) return null;
  return (
    <>
      {['向下滚动', '横排翻页', '竖排翻页'].map((t, i) => (
        <Abs
          key={t}
          style={{
            left: MODES[i].x - 40,
            width: MODES[i].w + 80,
            top: 938,
            textAlign: 'center',
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: 24,
            color: INK,
            opacity: a,
            transform: `translateY(${(1 - a) * 10}px)`,
          }}
        >
          {t}
        </Abs>
      ))}
    </>
  );
};

const ModesHeading: React.FC<{ f: number }> = ({ f }) => {
  const a = ramp(f, T.modes.head, T.modes.head + 16);
  if (f < T.modes.head - 2 || f > T.modes.merge[1] + 16) return null;
  const sh = exitLeft(f, T.modes.merge[0]);
  return (
    <Abs style={{ left: 100, top: 0, width: 1500, height: 300, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${sh}px)` }}>
        <Abs style={{ left: 0, top: 158, fontFamily: SANS, fontSize: 17, color: INK2, opacity: a }}>READING / 三种阅读方式</Abs>
        <Abs
          style={{
            left: 0,
            top: 190,
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: 62,
            color: INK,
            whiteSpace: 'nowrap',
            opacity: a,
            transform: `translateX(${(1 - a) * 140}px)`,
          }}
        >
          一本书，按自己的方式打开。
        </Abs>
      </div>
    </Abs>
  );
};

const SidePhones: React.FC<{ f: number }> = ({ f }) => {
  if (f < T.modes.split[0] || f > T.modes.merge[1]) return null;
  const p = ramp(f, T.modes.split[0], T.modes.split[1], easeOut) * (1 - ramp(f, T.modes.merge[0], T.modes.merge[1], easeInOut));
  const H = MODES[0].h / (MODES[0].w / 390);
  const scroll = keys(f, [
    [832, 0],
    [912, 360],
  ]);
  return (
    <>
      {[0, 2].map((i) => {
        const b = lerpBox(MODES[1], MODES[i], p);
        return (
          <Phone key={i} {...b} opacity={Math.min(1, p * 2)} shadow={p}>
            {i === 0 ? (
              <Reader H={H} scrollY={scroll} chTitle="序言 开始部" />
            ) : (
              <HorizontalPager f={f} H={H} flips={[862, 898]} dir={-1} vertical />
            )}
          </Phone>
        );
      })}
    </>
  );
};

// ======================= 设置面板 =======================
const S = {
  open: [968, 982] as const,
  fontDrag: [990, 1058] as const,
  lhDrag: [1078, 1143] as const,
  scroll: [1146, 1162] as const,
  sepia: 1152,
  night: 1190,
  paper: 1228,
  tabBm: 1258,
  addBm: 1272,
  close: [1296, 1308] as const,
  jump: [1300, 1318] as const,
};

const settingsState = (f: number) => {
  const open = ramp(f, S.open[0], S.open[1]) * (1 - ramp(f, S.close[0], S.close[1], easeIn));
  const fontBase = 1 - ramp(f, S.fontDrag[0], S.fontDrag[0] + 8) + ramp(f, S.fontDrag[1] - 8, S.fontDrag[1]);
  const lhBase = 1 - ramp(f, S.lhDrag[0], S.lhDrag[0] + 8) + ramp(f, S.lhDrag[1] - 8, S.lhDrag[1]);
  const font = keys(f, [
    [995, 19],
    [1030, 24],
    [1046, 21],
  ]);
  const lh = keys(f, [
    [1082, 1.93],
    [1105, 2.35],
    [1122, 1.8],
    [1132, 2.0],
  ]);
  const inFont = f >= S.fontDrag[0] && f < S.fontDrag[1];
  const inLh = f >= S.lhDrag[0] && f < S.lhDrag[1];
  const th = mixTheme(
    mixTheme(mixTheme(PAPER, SEPIA, ramp(f, S.sepia, S.sepia + 12, easeInOut)), NIGHT, ramp(f, S.night, S.night + 12, easeInOut)),
    PAPER,
    ramp(f, S.paper, S.paper + 12, easeInOut),
  );
  const scheme = f >= S.paper ? 1 : f >= S.night ? 4 : f >= S.sepia ? 2 : 1;
  return {
    open,
    base: inFont ? Math.min(1, fontBase) : inLh ? Math.min(1, lhBase) : 1,
    active: inFont ? 0 : inLh ? 1 : -1,
    font,
    lh,
    th,
    scheme,
    tab: f >= S.tabBm ? 2 : 0,
    panelScroll: f >= S.tabBm ? 0 : keys(f, [
      [S.scroll[0], 0],
      [S.scroll[1], 300],
    ]),
    bookmark: ramp(f, S.addBm + 2, S.addBm + 14),
  };
};

const SettingsScreen: React.FC<{ f: number; H: number }> = ({ f, H }) => {
  const s = settingsState(f);
  const tops = paraTops(PARAS, s.font, s.lh, 12);
  const target = 6;
  const jumpTo = tops[target] + 18 + 10.5 + 10 - (H - 96) / 2 + 40;
  const scrollY = keys(f, [
    [S.jump[0], 0],
    [S.jump[1], jumpTo],
  ]);
  const hl = ramp(f, S.jump[1] - 2, S.jump[1] + 4) * (1 - ramp(f, 1352, 1378));
  // 拖动时手指落点
  const knob = s.active >= 0 ? { x: 42 + (s.active === 0 ? (s.font - 14) / 14 : (s.lh - 1.3) / 1.2) * 318, y: 406 + s.active * 68 } : null;
  const dragA = s.active >= 0 ? 1 - s.base : 0;
  // 配色点按位置（面板内滚动后的芯片）
  const taps: [number, number, number][] = [
    [S.sepia - 2, 200, 640],
    [S.night - 2, 120, 680],
    [S.paper - 2, 140, 640],
    [S.tabBm - 2, 268, 334],
    [S.addBm - 2, 195, 384],
  ];
  return (
    <>
      <Reader H={H} th={s.th} fontSize={s.font} lh={s.lh} scrollY={scrollY} hlIndex={target} hlAlpha={hl} hlBar bookmarked={s.bookmark} chTitle="序言 开始部" />
      <SettingsPanel H={H} th={s.th} open={s.open} base={s.base} active={s.active} tab={s.tab} font={s.font} lh={s.lh} scroll={s.panelScroll} scheme={s.scheme} bookmark={s.bookmark} />
      {knob && dragA > 0 && (
        <div
          style={{
            position: 'absolute',
            left: knob.x - 20,
            top: knob.y - 20,
            width: 40,
            height: 40,
            borderRadius: 20,
            background: 'rgba(40,36,25,0.12)',
            opacity: dragA,
          }}
        />
      )}
      {taps.map(([t, x, y]) => (f >= t && f < t + 16 ? <Tap key={t} x={x} y={y} t={f - t} /> : null))}
      {hl > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: H - 136,
            textAlign: 'center',
            opacity: hl,
          }}
        >
          <span
            style={{
              fontFamily: SERIF,
              fontSize: 10.5,
              padding: '7px 16px',
              borderRadius: 16,
              background: 'rgba(252,252,248,0.92)',
              boxShadow: '0 0 0 1px rgba(40,36,25,0.08), 0 8px 18px -10px rgba(0,0,0,0.35)',
            }}
          >
            已回到书签位置 · 返回原位
          </span>
        </div>
      )}
    </>
  );
};

// ======================= 听书 =======================
const L = { steps: [[1422, 0], [1446, 1], [1482, 2], [1508, 3], [1553, 7], [1582, 8]] as [number, number][], dtap: 1545 };

const ListenScreen: React.FC<{ f: number; H: number }> = ({ f, H }) => {
  let idx = 0;
  let at = L.steps[0][0];
  L.steps.forEach(([t, i]) => {
    if (f >= t) {
      idx = i;
      at = t;
    }
  });
  const tops = paraTops(PARAS, 19, 1.93, 12);
  const center = (i: number) => Math.max(0, tops[i] + 18 + 10.5 + 10 + 22 + 20 - (H - 96) / 2 + 30);
  const scrollY = keys(f, [
    [1553, 0],
    [1575, center(7)],
    [1584, center(7)],
    [1600, center(8)],
  ]);
  const hlA = ramp(f, at, at + 6);
  const tapY = 96 + 18 + 10.5 + 10 + 22 + 20 + tops[7] + 30 - 0;
  const wave = (i: number) => 4 + 8 * Math.abs(Math.sin(f / 4 + i * 1.3));
  return (
    <>
      <Reader H={H} scrollY={scrollY} chTitle="序言 开始部" hlIndex={idx} hlAlpha={hlA} />
      {f >= L.dtap && f < L.dtap + 24 && <Tap x={200} y={tapY} t={f - L.dtap} double />}
      {/* 迷你播放条 */}
      <div
        style={{
          position: 'absolute',
          left: 70,
          right: 70,
          top: H - 140,
          height: 40,
          borderRadius: 20,
          background: 'rgba(252,252,248,0.92)',
          boxShadow: '0 0 0 1px rgba(40,36,25,0.08), 0 10px 20px -12px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          fontFamily: SERIF,
          fontSize: 10.5,
          opacity: ramp(f, 1428, 1440),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 14 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ width: 2, height: wave(i), background: '#2b2a26', borderRadius: 1 }} />
          ))}
        </div>
        正在朗读 · 第 {idx + 1} 段
        <span style={{ fontFamily: MONO, fontSize: 8.5, color: '#8f8d85' }}>1.0×</span>
      </div>
    </>
  );
};

// ======================= 本地书库 =======================
const C = {
  plus: 1636,
  menu: [1640, 1652] as const,
  tapFile: 1656,
  push1: [1662, 1678] as const,
  vols: [1666, 1684] as const,
  toggle: 1690,
  confirm: 1738,
  pop: [1748, 1764] as const,
  books: [1756, 1770] as const,
  card: 1772,
  push2: [1778, 1794] as const,
  scroll: [1826, 1852] as const,
  read: 1860,
  push3: [1866, 1880] as const,
  calm: 1884,
};

const Push: React.FC<{ p: number; a: React.ReactNode; b: React.ReactNode; back?: boolean }> = ({ p, a, b, back }) => {
  if (p <= 0) return <>{a}</>;
  if (p >= 1) return <>{b}</>;
  // 前进：新页从右侧推入；返回：当前页向右退出
  return back ? (
    <>
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-100 * (1 - p)}px)`, opacity: 0.6 + 0.4 * p }}>{b}</div>
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${390 * p}px)`, boxShadow: '-10px 0 30px rgba(0,0,0,0.12)' }}>{a}</div>
    </>
  ) : (
    <>
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-100 * p}px)`, opacity: 1 - 0.4 * p }}>{a}</div>
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${390 * (1 - p)}px)`, boxShadow: '-10px 0 30px rgba(0,0,0,0.12)' }}>{b}</div>
    </>
  );
};

const CollectScreen: React.FC<{ f: number; H: number }> = ({ f, H }) => {
  const menu = ramp(f, C.menu[0], C.menu[1]) * (1 - ramp(f, C.tapFile + 4, C.tapFile + 10));
  const plusPress = f >= C.plus && f < C.plus + 10 ? 1 - Math.abs(f - C.plus - 5) / 5 : 0;
  const home0 = <LocalHome H={H} books={0} menu={menu} plusPress={plusPress} />;
  const vols = ramp(f, C.vols[0], C.vols[1]);
  const toggle = ramp(f, C.toggle, C.toggle + 6);
  const confirmPress = f >= C.confirm && f < C.confirm + 10 ? 1 - Math.abs(f - C.confirm - 5) / 5 : 0;
  const imp = <ImportDone H={H} toggle={toggle} press={confirmPress} vols={vols} />;
  const books = ramp(f, C.books[0], C.books[1]);
  const cardPress = f >= C.card && f < C.card + 8 ? 1 - Math.abs(f - C.card - 4) / 4 : 0;
  const home1 = <LocalHome H={H} books={books} cardPress={cardPress} />;
  const detScroll = keys(f, [
    [C.scroll[0], 0],
    [C.scroll[1], 330],
  ]);
  const readPress = f >= C.read && f < C.read + 8 ? 1 - Math.abs(f - C.read - 4) / 4 : 0;
  const det = <BookDetail H={H} scroll={detScroll} pressRead={readPress} />;
  const chrome = 1 - ramp(f, C.calm, C.calm + 12);
  const reader = (
    <Reader
      H={H}
      title="无职转生"
      code="READ / WK-1863495889"
      chTitle="序言 开始部"
      lead="第一卷 序言 开始部"
      paras={PARAS.slice(0, 10)}
      chrome={chrome}
      paraStyle={(i) => {
        const p = ramp(f, C.calm + 2 + i * 1.5, C.calm + 14 + i * 1.5, easeInOut);
        return { transform: `translateY(${-44 * p}px)` };
      }}
    />
  );

  let screen: React.ReactNode;
  if (f < C.push1[0]) screen = home0;
  else if (f < C.pop[0]) screen = <Push p={ramp(f, C.push1[0], C.push1[1], easeInOut)} a={home0} b={imp} />;
  else if (f < C.push2[0]) screen = <Push p={ramp(f, C.pop[0], C.pop[1], easeInOut)} a={imp} b={home1} back />;
  else if (f < C.push3[0]) screen = <Push p={ramp(f, C.push2[0], C.push2[1], easeInOut)} a={home1} b={det} />;
  else screen = <Push p={ramp(f, C.push3[0], C.push3[1], easeInOut)} a={det} b={reader} />;

  const taps: [number, number, number][] = [
    [C.plus, 307, 53],
    [C.tapFile, 280, 145],
    [C.toggle - 2, 330, 264],
    [C.confirm, 195, H - 61],
    [C.card, 190, 310],
    [C.read, 195, H - 56],
  ];
  return (
    <>
      {screen}
      {taps.map(([t, x, y]) => (f >= t && f < t + 16 ? <Tap key={t} x={x} y={y} t={f - t} /> : null))}
    </>
  );
};

// ======================= 手机里的内容调度 =======================
const PhoneContent: React.FC<{ f: number; H: number }> = ({ f, H }) => {
  if (f < T.discover.fade[1]) {
    const readerA = ramp(f, T.discover.fade[0], T.discover.fade[1]);
    return (
      <>
        <Sequence from={T.discover.start} durationInFrames={T.discover.fade[1] - T.discover.start + 1} layout="none">
          <OffthreadVideo src={staticFile('wenku/discover.mp4')} muted style={{ position: 'absolute', left: 0, top: 0, width: 390, height: H, objectFit: 'cover' }} />
        </Sequence>
        {readerA > 0 && (
          <div style={{ position: 'absolute', inset: 0, opacity: readerA }}>
            <PageTurn f={f} H={H} turns={T.read1.turns} />
          </div>
        )}
      </>
    );
  }
  if (f < T.modes.shrink[0]) return <PageTurn f={f} H={H} turns={T.read1.turns} />;
  if (f < T.modes.toLeft[0]) return <HorizontalPager f={f} H={H} flips={[846, 884]} dir={1} />;
  if (f < T.toRight[0] + 10) {
    const fade = ramp(f, T.toRight[0], T.toRight[0] + 10);
    return (
      <>
        <SettingsScreen f={f} H={H} />
        {fade > 0 && (
          <div style={{ position: 'absolute', inset: 0, opacity: fade }}>
            <ListenScreen f={f} H={H} />
          </div>
        )}
      </>
    );
  }
  if (f < T.toLeft2[0] + 10) {
    const fade = ramp(f, T.toLeft2[0], T.toLeft2[0] + 10);
    return (
      <>
        <ListenScreen f={f} H={H} />
        {fade > 0 && (
          <div style={{ position: 'absolute', inset: 0, opacity: fade }}>
            <CollectScreen f={f} H={H} />
          </div>
        )}
      </>
    );
  }
  return <CollectScreen f={f} H={H} />;
};

// ======================= 功能总览 =======================
const FEATURES = [
  ['发现与书架', '分类排行 · 作者作品 · 循环书架'],
  ['三种阅读方式', '滚动 · 横排 · 竖排 · 宽屏对页'],
  ['排版与阅读工具', '字体配色 · 实时排版 · 段落书签'],
  ['本地与网盘导入', 'TXT / EPUB · 批量导入 · 分卷合并'],
  ['自然在线听书', '段落跟随 · 双击控制 · 自定义接口'],
  ['离线与社区', '章节缓存 · 云书架 · 书评回复'],
];

const Overview: React.FC<{ f: number }> = ({ f }) => {
  const { in: a, out } = T.overview;
  if (f < a - 2 || f > out + 18) return null;
  const sh = exitLeft(f, out);
  const head = ramp(f, a, a + 16);
  return (
    <Abs style={{ left: 104, top: 0, width: 1800, height: 1080, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${sh}px)` }}>
        <Abs style={{ left: 0, top: 176, fontFamily: MONO, fontSize: 15, letterSpacing: 1.2, color: INK2, opacity: head }}>ONE READER / MANY WAYS TO READ</Abs>
        <Abs
          style={{
            left: 0,
            top: 214,
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: 62,
            color: INK,
            whiteSpace: 'nowrap',
            opacity: head,
            transform: `translateX(${(1 - head) * 140}px)`,
          }}
        >
          喜欢的阅读方式，都在这里。
        </Abs>
        {FEATURES.map(([t, s], i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const p = ramp(f, a + 8 + row * 5 + col * 3, a + 24 + row * 5 + col * 3);
          const x = col * 883;
          const y = 396 + row * 182;
          return (
            <React.Fragment key={t}>
              <Abs style={{ left: x, top: y + 16, fontFamily: MONO, fontSize: 14, color: ACCENT, opacity: p }}>{String(i + 1).padStart(2, '0')}</Abs>
              <Abs
                style={{
                  left: x + 46,
                  top: y,
                  fontFamily: SERIF,
                  fontWeight: 700,
                  fontSize: 34,
                  color: INK,
                  opacity: p,
                  transform: `translateX(${(1 - p) * 60}px)`,
                }}
              >
                {t}
              </Abs>
              <Abs style={{ left: x + 46, top: y + 58, fontFamily: SERIF, fontSize: 24, color: MUTED, opacity: p, transform: `translateX(${(1 - p) * 60}px)` }}>{s}</Abs>
              <Abs style={{ left: x, top: y + 118, width: 785 * p, height: 1, background: RULE }} />
            </React.Fragment>
          );
        })}
      </div>
    </Abs>
  );
};

// ======================= 结尾卡 =======================
const Ending: React.FC<{ f: number }> = ({ f }) => {
  const E = T.ending;
  if (f < E.title - 2) return null;
  const t1 = ramp(f, E.title, E.title + 16);
  const t2 = ramp(f, E.title + 3, E.title + 19);
  const icon = ramp(f, E.icon, E.icon + 26, easeOut);
  const sub = ramp(f, E.sub, E.sub + 14);
  const repo = ramp(f, E.repo, E.repo + 14);
  const repo2 = ramp(f, E.repo + 4, E.repo + 18);
  const rule = ramp(f, E.repo - 4, E.repo + 18);
  const qr = ramp(f, E.qr, E.qr + 16);
  const qrl = ramp(f, E.qr + 8, E.qr + 20);
  const float = Math.sin((f - E.icon) / 40) * 4;
  return (
    <>
      {/* 图标：从左侧带着转角飞入的立体卡片 */}
      <Abs
        style={{
          left: 230,
          top: 318,
          width: 445,
          height: 445,
          opacity: Math.min(1, icon * 1.6),
          transform: `translateX(${-520 * (1 - icon)}px) translateY(${float}px) perspective(1400px) rotateY(${lerp(55, 12, icon)}deg) rotateX(4deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 14,
            background: '#f6f5f0',
            boxShadow: '8px 8px 0 #d6d5cd, 9px 9px 0 #cfcec5, 0 40px 60px -30px rgba(30,25,10,0.45)',
          }}
        />
        <Img src={staticFile('wenku/app-icon.png')} style={{ position: 'absolute', left: 12, top: 12, width: 421, height: 421, borderRadius: 6 }} />
        <div style={{ position: 'absolute', inset: 12, borderRadius: 6, background: 'linear-gradient(120deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 40%)' }} />
      </Abs>
      <Abs
        style={{
          left: 330,
          top: 850,
          width: 560,
          height: 70,
          background: 'radial-gradient(ellipse, rgba(40,36,25,0.18), rgba(40,36,25,0) 70%)',
          filter: 'blur(8px)',
          opacity: icon,
          transform: 'skewX(-30deg)',
        }}
      />

      {['下一章，', '从这里开始。'].map((t, i) => {
        const p = i === 0 ? t1 : t2;
        return (
          <Abs
            key={t}
            style={{
              left: 757,
              top: 285 + i * 96,
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: 76,
              lineHeight: '96px',
              color: INK,
              opacity: p,
              transform: `translateX(${(1 - p) * (120 + 60 * i)}px)`,
            }}
          >
            {t}
          </Abs>
        );
      })}
      <Abs style={{ left: 760, top: 534, fontFamily: SERIF, fontSize: 30, color: MUTED, opacity: sub, transform: `translateY(${(1 - sub) * 10}px)` }}>
        纸面阅读器 · Wenku8 Flutter
      </Abs>
      <Abs style={{ left: 760, top: 619, width: 1040 * rule, height: 1, background: RULE }} />
      <Abs style={{ left: 760, top: 668, fontFamily: MONO, fontSize: 14, letterSpacing: 1.4, color: INK2, opacity: repo }}>GITHUB REPOSITORY</Abs>
      <Abs style={{ left: 756, top: 708, fontFamily: SANS, fontSize: 31, color: INK, opacity: repo, transform: `translateX(${(1 - repo) * 40}px)` }}>
        github.com/mikufoxxx/Wenku8_Flutter
      </Abs>
      <Abs style={{ left: 760, top: 776, fontFamily: SERIF, fontSize: 24, color: MUTED, opacity: repo2 }}>源码 · APK 下载 · 完整功能说明</Abs>
      <Abs
        style={{
          left: 1540,
          top: 664,
          width: 246,
          height: 246,
          background: '#fdfdfb',
          borderRadius: 6,
          boxShadow: '0 0 0 1px rgba(30,28,20,0.06), 0 16px 30px -18px rgba(30,25,10,0.35)',
          opacity: qr,
          transform: `scale(${0.92 + 0.08 * qr})`,
        }}
      >
        <Img src={staticFile('wenku/qr.svg')} style={{ position: 'absolute', left: 23, top: 23, width: 200, height: 200 }} />
      </Abs>
      <Abs style={{ left: 1540, width: 246, top: 928, textAlign: 'center', fontFamily: SERIF, fontSize: 20, color: MUTED, opacity: qrl }}>扫码打开仓库</Abs>
    </>
  );
};

// ======================= 主合成 =======================
export const WenkuPromo: React.FC = () => {
  const f = useCurrentFrame();
  const box = phoneBox(f);
  const H = 854 / (432 / 390);
  return (
    <AbsoluteFill>
      <Paper />
      <Audio src={staticFile('wenku/audio.wav')} />
      <OpeningFootage f={f} />
      <Opening f={f} />

      <TitleBlock
        f={f}
        x={105}
        inAt={T.discover.in}
        outAt={T.discover.out}
        eyebrow="DISCOVER / 发现"
        lines={['找到，', '下一个故事。']}
        subs={[
          { at: 198, a: '循环书架，居中前抽', b: '惯性滑动 · 封面归位' },
          { at: 323, a: '轻轻翻开一部作品', b: '封面从左下向右上贴合' },
          { at: 389, a: '返回，也沿来时的方向', b: '封面准确回到原来的书位' },
          { at: 443, a: '从喜欢的作者继续发现', b: '水泽梦 · 8 部真实作品' },
          { at: 512, a: '分卷目录，清楚展开', b: '章节直达 · 缓存阅读' },
          { at: 590, a: '玻璃菜单，从锚点延展', b: '形状有弹性，内容保持清晰' },
        ]}
      />
      <TitleBlock
        f={f}
        x={1015}
        inAt={T.read1.in}
        outAt={T.read1.out}
        eyebrow="READ / 阅读"
        lines={['按你的节奏，', '慢慢读。']}
        subs={[{ at: 676, a: '一段离开，一段跟进', b: '翻页保留连贯的阅读节奏' }]}
      />
      <ModesHeading f={f} />
      <ModeLabels f={f} />
      <TitleBlock
        f={f}
        x={1015}
        inAt={T.settings.in}
        outAt={T.settings.out}
        eyebrow="READ / 阅读"
        lines={['按你的节奏，', '慢慢读。']}
        subs={[
          { at: 968, a: '拖动字号，正文实时变化', b: '调整时隐去设置底板，直接预览' },
          { at: 1072, a: '把行距调到刚刚好', b: '字体 · 行距 · 页边距 · 段落间距' },
          { at: 1146, a: '换一张纸，也换一种心情', b: '阅读背景与控件配色一同适配' },
          { at: 1256, a: '记下读到这里', b: '为当前段落添加书签' },
          { at: 1296, a: '再次回来，就在眼前', b: '段落居中定位，短暂高亮' },
        ]}
      />
      <TitleBlock
        f={f}
        x={105}
        inAt={T.listen.in}
        outAt={T.listen.out}
        eyebrow="LISTEN / 听书"
        lines={['放下屏幕，', '故事继续。']}
        subs={[
          { at: 1424, a: '故事，接着读给你听', b: '自然在线朗读 · 段落高亮与跟随' },
          { at: 1520, a: '双击，暂停或继续', b: '双击其他段落，从那里重新开始' },
        ]}
      />
      <TitleBlock
        f={f}
        x={1015}
        inAt={T.collect.in}
        outAt={T.collect.out}
        eyebrow="COLLECT / 本地书库"
        lines={['自己的藏书，', '也有归处。']}
        subs={[
          { at: 1632, a: '把自己的藏书带进来', b: '本机文件 · OpenList · WebDAV' },
          { at: 1662, a: '四卷原书，合成一个系列', b: '多选导入 · 识别同系列 · 确认合并' },
          { at: 1772, a: '目录和进度，接着保留', b: '真实 EPUB 合订本 · 共 110 章' },
          { at: 1868, a: '收起控件，只留下故事', b: '文字渐次舒展，阅读保持连贯' },
        ]}
      />

      <SidePhones f={f} />
      {box && (
        <Phone {...box}>
          <PhoneContent f={f} H={H} />
        </Phone>
      )}

      <Overview f={f} />
      <Ending f={f} />
      <Chrome f={f} />
    </AbsoluteFill>
  );
};
