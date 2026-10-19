import React from 'react';
import { Img, interpolateColors, staticFile } from 'remotion';
import { MONO, SERIF } from './theme';
import {
  IArrowL,
  IArrowR,
  IBack,
  IBook,
  IBookmark,
  ICheck,
  IChevD,
  IChevR,
  ICloud,
  ICog,
  IFile,
  IFilter,
  IFolder,
  IGear,
  IHeadphone,
  IHome,
  IMore,
  IPlus,
  ISearch,
  IServer,
  IClose,
  ITrash,
} from './icons';

// ---------------- 阅读主题 ----------------
export type Theme = { bg: string; text: string; sub: string; line: string; hl: string; panel: string; panelText: string; chip: string };

export const PAPER: Theme = {
  bg: '#f8f7f2',
  text: '#2b2a26',
  sub: '#8f8d85',
  line: 'rgba(40,36,25,0.10)',
  hl: 'rgba(40,36,25,0.075)',
  panel: 'rgba(250,250,246,0.86)',
  panelText: '#22211d',
  chip: 'rgba(40,36,25,0.06)',
};
export const SEPIA: Theme = {
  bg: '#ebe1c9',
  text: '#3b3224',
  sub: '#8c7f66',
  line: 'rgba(60,45,20,0.14)',
  hl: 'rgba(60,45,20,0.10)',
  panel: 'rgba(240,231,210,0.88)',
  panelText: '#33291c',
  chip: 'rgba(60,45,20,0.08)',
};
export const NIGHT: Theme = {
  bg: '#2a2a27',
  text: '#d9d6cc',
  sub: '#8d8a80',
  line: 'rgba(255,255,255,0.10)',
  hl: 'rgba(255,255,255,0.08)',
  panel: 'rgba(48,48,45,0.88)',
  panelText: '#ebe8de',
  chip: 'rgba(255,255,255,0.08)',
};

export const mixTheme = (a: Theme, b: Theme, p: number): Theme => {
  if (p <= 0) return a;
  if (p >= 1) return b;
  const out = {} as Theme;
  (Object.keys(a) as (keyof Theme)[]).forEach((k) => {
    out[k] = interpolateColors(p, [0, 1], [a[k], b[k]]);
  });
  return out;
};

// ---------------- 正文（原创示例文本） ----------------
export const PARAS = [
  '放学的铃声响过第三遍，走廊才终于安静下来。',
  '我把书包往肩上一甩，照例绕到图书馆后面那条小路。樱树早就落完了花，只剩一地被踩碎的影子。',
  '说起来有点不好意思，我每天走这条路，只是为了在书店关门前，赶上新刊上架的那一刻。',
  '店主是个总戴着老花镜的爷爷。他从不推荐书，只会在我犹豫的时候，把台灯往我这边拧亮一点。',
  '“今天也是来看那一本？”',
  '“嗯……只是看看。”',
  '其实我已经看了三个星期。封面上的女孩站在天台边缘，风把她的围巾吹成一面小小的旗。',
  '我总觉得，只要翻开第一页，就会有什么东西被永远改变。所以我一直没有翻开。',
  '可那天，书架最上层只剩下最后一本。',
  '我踮起脚，指尖刚碰到书脊，另一只手也从旁边伸了过来。',
  '那是一只很白的手，袖口沾着一点蓝色的颜料。',
  '“啊，抱歉。”她说，“你先请。”',
  '后来我才知道，故事真正的第一页，从来不在书里。',
  '它在那天傍晚，在我们同时伸出手的那一瞬间，悄悄翻开了。',
  '书店的风铃响了一下。爷爷在柜台后面咳嗽了一声，像是在笑。',
  '“两位，”他说，“要不要一起看？”',
];

// ---------------- 阅读器 ----------------
export type ReaderProps = {
  H: number;
  th?: Theme;
  title?: string;
  code?: string;
  chapter?: string;
  chTitle?: string;
  lead?: string; // 章首的灰底标题行
  paras?: string[];
  fontSize?: number;
  lh?: number;
  margin?: number;
  gap?: number;
  scrollY?: number;
  chrome?: number;
  hlIndex?: number;
  hlAlpha?: number;
  hlBar?: boolean;
  page?: string;
  paraStyle?: (i: number) => React.CSSProperties;
  bookmarked?: number;
  headless?: boolean; // 只画正文（翻页动画用）
  bodyTop?: number;
};

export const Reader: React.FC<ReaderProps> = ({
  H,
  th = PAPER,
  title = '我们没有故事',
  code = 'READ / WK-03332',
  chapter = '第 2 章',
  chTitle,
  lead,
  paras = PARAS,
  fontSize = 19,
  lh = 1.93,
  margin = 26,
  gap = 12,
  scrollY = 0,
  chrome = 1,
  hlIndex = -1,
  hlAlpha = 0,
  hlBar = false,
  page = '本章 3 / 5 页',
  paraStyle,
  bookmarked = 0,
  headless = false,
  bodyTop = 96,
}) => {
  const lineH = fontSize * lh;
  return (
    <div style={{ position: 'absolute', inset: 0, background: headless ? 'transparent' : th.bg, color: th.text, fontFamily: SERIF }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: bodyTop, bottom: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: margin, right: margin, top: 18 - scrollY }}>
          {/* 翻页动画里叠加的正文层只占位、不重复绘制章节信息 */}
          <div style={{ visibility: headless ? 'hidden' : 'visible' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: th.sub, marginBottom: 10 }}>
              <span>{chapter}</span>
              <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: 1.2 }}>CH.002 / TEXT</span>
            </div>
            {chTitle && <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>{chTitle}</div>}
            {lead && (
              <div style={{ background: th.hl, margin: '0 -8px 14px', padding: '4px 8px', fontSize: fontSize * 0.92, lineHeight: `${lineH * 0.9}px` }}>{lead}</div>
            )}
          </div>
          {paras.map((t, i) => {
            const hl = i === hlIndex ? hlAlpha : 0;
            return (
              <div
                key={i}
                style={{
                  position: 'relative',
                  fontSize,
                  lineHeight: `${lineH}px`,
                  marginBottom: gap,
                  textAlign: 'justify',
                  ...(paraStyle ? paraStyle(i) : {}),
                }}
              >
                {hl > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: -8,
                      right: -8,
                      top: -3,
                      bottom: -3,
                      background: th.hl,
                      opacity: hl,
                      borderLeft: hlBar ? `2px solid ${th.text}` : undefined,
                    }}
                  />
                )}
                <span style={{ position: 'relative' }}>{t}</span>
              </div>
            );
          })}
        </div>
      </div>

      {!headless && (
        <>
          {/* 顶部工具栏 */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: 96,
              opacity: chrome,
              background: `linear-gradient(180deg, ${th.bg} 70%, rgba(0,0,0,0))`,
            }}
          >
            <div style={{ position: 'absolute', left: 22, top: 40 }}>
              <IBack size={20} color={th.text} />
            </div>
            <div style={{ position: 'absolute', left: 58, top: 40 }}>
              <IBookmark size={19} color={th.text} filled={bookmarked > 0.5} />
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 36, textAlign: 'center' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{title}</div>
              <div style={{ fontFamily: MONO, fontSize: 7.5, letterSpacing: 1.6, color: th.sub, marginTop: 3 }}>{code}</div>
            </div>
            <div style={{ position: 'absolute', left: 290, top: 40 }}>
              <IHeadphone size={19} color={th.text} />
            </div>
            <div style={{ position: 'absolute', left: 332, top: 39, fontSize: 15, fontFamily: 'Arial' }}>
              <span style={{ fontSize: 11 }}>A</span>A
            </div>
          </div>
          {/* 底部翻章栏 */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 92, opacity: chrome }}>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(0deg, ${th.bg} 55%, rgba(0,0,0,0))` }} />
            {[
              { x: 108, icon: <IArrowL size={17} color={th.sub} />, t: '上一章' },
              { x: 195, icon: <IBook size={18} color={th.text} />, t: '2 / 42', strong: true },
              { x: 282, icon: <IArrowR size={17} color={th.sub} />, t: '下一章' },
            ].map((b) => (
              <div key={b.x} style={{ position: 'absolute', left: b.x - 30, width: 60, top: 26, textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>{b.icon}</div>
                <div style={{ fontSize: 8, marginTop: 2, color: b.strong ? th.text : th.sub, fontWeight: b.strong ? 700 : 400 }}>{b.t}</div>
              </div>
            ))}
            <div style={{ position: 'absolute', right: 20, bottom: 16, fontSize: 8, color: th.sub }}>{page}</div>
          </div>
        </>
      )}
    </div>
  );
};

// 竖排阅读（从右往左排）
export const VerticalReader: React.FC<{ H: number; paras?: string[]; offset?: number; headless?: boolean }> = ({
  H,
  paras = PARAS,
  offset = 0,
  headless,
}) => (
  <div style={{ position: 'absolute', inset: 0, background: headless ? 'transparent' : PAPER.bg, fontFamily: SERIF, color: PAPER.text }}>
    <div
      style={{
        position: 'absolute',
        right: 26 - offset,
        top: 110,
        height: H - 220,
        writingMode: 'vertical-rl',
        fontSize: 18,
        lineHeight: '34px',
        letterSpacing: 1,
      }}
    >
      {paras.map((t, i) => (
        <p key={i} style={{ margin: '0 0 0 10px' }}>
          {t}
        </p>
      ))}
    </div>
  </div>
);

// ---------------- 设置面板 ----------------
const Slider: React.FC<{ label: string; value: string; v: number; th: Theme; card?: number }> = ({ label, value, v, th, card = 0 }) => (
  <div style={{ position: 'relative', height: 68, padding: '10px 18px 0' }}>
    {card > 0 && (
      <div
        style={{
          position: 'absolute',
          inset: '0 4px',
          borderRadius: 16,
          background: th.panel,
          opacity: card,
          boxShadow: `0 10px 24px -14px rgba(0,0,0,${0.35 * card})`,
          backdropFilter: 'blur(10px)',
        }}
      />
    )}
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: th.panelText }}>
      <span>{label}</span>
      <span style={{ color: th.sub, fontSize: 10 }}>{value}</span>
    </div>
    <div style={{ position: 'relative', height: 24, marginTop: 12 }}>
      <div style={{ position: 'absolute', left: 6, right: 6, top: 11, height: 1.5, background: th.line }} />
      <div style={{ position: 'absolute', left: 6, width: `calc(${v * 100}% - ${12 * v}px)`, top: 10, height: 3, borderRadius: 2, background: th.panelText, opacity: 0.75 }} />
      <div
        style={{
          position: 'absolute',
          left: `calc(${v * 100}% - ${12 * v}px - 5px)`,
          top: 1,
          width: 22,
          height: 22,
          borderRadius: 11,
          background: '#fbfbf8',
          boxShadow: '0 2px 6px rgba(0,0,0,0.22), 0 0 0 0.5px rgba(0,0,0,0.12)',
        }}
      />
    </div>
  </div>
);

const Chip: React.FC<{ t: string; on?: boolean; th: Theme; dot?: string }> = ({ t, on, th, dot }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 32,
      padding: '0 14px',
      borderRadius: 16,
      background: on ? th.chip : 'transparent',
      boxShadow: on ? `inset 0 0 0 1px ${th.line}` : undefined,
      fontSize: 10.5,
      color: th.panelText,
      fontWeight: on ? 700 : 400,
      marginRight: 6,
      marginBottom: 8,
    }}
  >
    {dot && <span style={{ width: 11, height: 11, borderRadius: 6, background: dot, boxShadow: `0 0 0 1px ${th.line}` }} />}
    {t}
    {on && <ICheck size={11} color={th.panelText} sw={2} />}
  </div>
);

export type PanelProps = {
  H: number;
  th: Theme;
  open: number; // 0..1 面板从底部升起
  base?: number; // 面板底板与其他行的可见度（拖动时隐去）
  active?: number; // 正在拖动的行
  tab?: number;
  font?: number;
  lh?: number;
  scroll?: number;
  scheme?: number; // 选中的配色
  bookmark?: number; // 0..1 书签已添加
};

const SCHEMES = [
  { t: '跟随外观', c: '#f8f7f2' },
  { t: '奶白', c: '#f5f1e6' },
  { t: '羊皮纸', c: '#e5d7b7' },
  { t: '浅苔', c: '#dfe5d2' },
  { t: '夜读', c: '#2a2a27' },
];

export const SettingsPanel: React.FC<PanelProps> = ({ H, th, open, base = 1, active = -1, tab = 0, font = 19, lh = 1.93, scroll = 0, scheme = 1, bookmark = 0 }) => {
  if (open <= 0.001) return null;
  const top = 250;
  const rows = [
    { label: '字体大小', value: `${Math.round(font)} pt`, v: (font - 14) / 14 },
    { label: '行距', value: `${lh.toFixed(2)} 倍`, v: (lh - 1.3) / 1.2 },
    { label: '页边距', value: '26 px', v: 0.45 },
    { label: '段落间距', value: '12 px', v: 0.3 },
  ];
  const rowOp = (i: number) => (i === active ? 1 : base);
  return (
    <div style={{ position: 'absolute', left: 12, right: 12, top: top + (1 - open) * (H - top), bottom: 12 - (1 - open) * (H - top), opacity: Math.min(1, open * 1.4) }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 24,
          background: th.panel,
          backdropFilter: 'blur(16px)',
          boxShadow: `0 -1px 0 rgba(255,255,255,0.5) inset, 0 18px 40px -20px rgba(0,0,0,0.35), 0 0 0 1px ${th.line}`,
          opacity: base,
        }}
      />
      <div style={{ position: 'absolute', inset: 0, color: th.panelText, fontFamily: SERIF }}>
        <div style={{ opacity: base }}>
          <div style={{ position: 'absolute', left: 22, top: 18, fontFamily: MONO, fontSize: 7.5, letterSpacing: 1.5, color: th.sub }}>READER / CONTROL PANEL</div>
          <div style={{ position: 'absolute', left: 22, top: 32, fontSize: 15, fontWeight: 700 }}>阅读设置</div>
          <div style={{ position: 'absolute', right: 20, top: 30 }}>
            <IClose size={18} color={th.panelText} />
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 68, display: 'flex', justifyContent: 'center', gap: 10 }}>
            {['排版', '操作', '书签'].map((t, i) => (
              <div
                key={t}
                style={{
                  width: 66,
                  height: 30,
                  lineHeight: '30px',
                  textAlign: 'center',
                  borderRadius: 15,
                  fontSize: 10.5,
                  fontWeight: i === tab ? 700 : 400,
                  background: i === tab ? th.chip : 'transparent',
                  boxShadow: i === tab ? `inset 0 0 0 1px ${th.line}` : undefined,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 112, bottom: 0, overflow: active >= 0 ? 'visible' : 'hidden' }}>
          {tab === 0 && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: -scroll }}>
              {rows.map((r, i) => (
                <div key={r.label} style={{ opacity: rowOp(i) }}>
                  <Slider {...r} th={th} card={i === active ? 1 - base : 0} />
                </div>
              ))}
              <div style={{ opacity: base, padding: '16px 18px 0' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, marginBottom: 10 }}>阅读方式</div>
                <Chip t="上下滚动" on th={th} />
                <Chip t="横排翻页" th={th} />
                <Chip t="竖排翻页" th={th} />
                <div style={{ height: 1, background: th.line, margin: '10px 0 16px' }} />
                <div style={{ fontSize: 10.5, fontWeight: 700, marginBottom: 10 }}>阅读配色</div>
                {SCHEMES.map((s, i) => (
                  <Chip key={s.t} t={s.t} dot={s.c} on={i === scheme} th={th} />
                ))}
              </div>
            </div>
          )}
          {tab === 2 && (
            <div style={{ position: 'absolute', left: 18, right: 18, top: 6 }}>
              <div
                style={{
                  height: 42,
                  lineHeight: '42px',
                  textAlign: 'center',
                  borderRadius: 21,
                  background: th.chip,
                  boxShadow: `inset 0 0 0 1px ${th.line}`,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {bookmark > 0.5 ? '已添加书签' : '添加当前位置'}
              </div>
              <div style={{ fontSize: 9, color: th.sub, marginTop: 14, lineHeight: '15px' }}>先添加当前位置，再点按下方书签，就能回到这里。</div>
              <div style={{ fontSize: 9, color: th.sub, marginTop: 4 }}>本书 {bookmark > 0.5 ? 1 : 0} 个书签</div>
              <div
                style={{
                  marginTop: 16,
                  padding: '12px 4px',
                  borderTop: `1px solid ${th.line}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: bookmark,
                  transform: `translateY(${(1 - bookmark) * 10}px)`,
                }}
              >
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700 }}>序言 开始部</div>
                  <div style={{ fontSize: 9, color: th.sub, marginTop: 3 }}>第 2 章 · 35%</div>
                </div>
                <ITrash size={16} color={th.sub} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------- 书库页面 ----------------
const TabBar: React.FC<{ H: number; active: number }> = ({ H, active }) => (
  <div
    style={{
      position: 'absolute',
      left: 60,
      right: 60,
      top: H - 74,
      height: 56,
      borderRadius: 28,
      background: 'rgba(250,250,246,0.85)',
      boxShadow: '0 0 0 1px rgba(40,36,25,0.06), 0 10px 24px -16px rgba(0,0,0,0.3)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      fontFamily: SERIF,
    }}
  >
    {[
      ['发现', <IHome key="h" size={18} />],
      ['书架', <IBook key="b" size={18} />],
      ['本地', <IFolder key="f" size={18} />],
      ['设置', <IGear key="g" size={18} />],
    ].map(([t, ic], i) => (
      <div key={t as string} style={{ textAlign: 'center', color: i === active ? '#1d1c19' : '#77756e', fontSize: 9, fontWeight: i === active ? 700 : 400 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>{ic}</div>
        <div style={{ marginTop: 2 }}>{t}</div>
        <div style={{ width: 12, height: 1.5, margin: '3px auto 0', background: i === active ? '#1d1c19' : 'transparent' }} />
      </div>
    ))}
  </div>
);

const SectionLabel: React.FC<{ t: string; y: number }> = ({ t, y }) => (
  <>
    <div style={{ position: 'absolute', left: 24, top: y, fontFamily: MONO, fontSize: 7.5, letterSpacing: 1.5, color: '#8f8d85' }}>{t}</div>
    <div style={{ position: 'absolute', left: 24 + t.length * 6.2 + 10, right: 34, top: y + 5, height: 1, background: 'rgba(40,36,25,0.12)' }} />
    <div style={{ position: 'absolute', right: 30, top: y + 3, width: 4, height: 4, background: '#1d1c19' }} />
  </>
);

export const BOOK = '无职转生 ～到了异世界就拿出真本事～';

export const LocalHome: React.FC<{ H: number; books: number; menu?: number; plusPress?: number; cardPress?: number }> = ({ H, books, menu = 0, plusPress = 0, cardPress = 0 }) => (
  <div style={{ position: 'absolute', inset: 0, background: PAPER.bg, fontFamily: SERIF, color: PAPER.text }}>
    <div style={{ position: 'absolute', left: 24, top: 34, fontSize: 24, fontWeight: 700 }}>本地</div>
    <div style={{ position: 'absolute', left: 24, top: 70, fontFamily: MONO, fontSize: 7.5, letterSpacing: 1.6, color: PAPER.sub }}>03 / LOCAL ARCHIVE</div>
    <div style={{ position: 'absolute', left: 296, top: 42, transform: `scale(${1 - 0.15 * plusPress})` }}>
      {plusPress > 0 && <div style={{ position: 'absolute', left: -9, top: -9, width: 40, height: 40, borderRadius: 20, background: 'rgba(40,36,25,0.08)', opacity: plusPress }} />}
      <IPlus size={22} />
    </div>
    <div style={{ position: 'absolute', left: 340, top: 42 }}>
      <ISearch size={20} />
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 132, textAlign: 'center', fontSize: 11.5 }}>全部书籍</div>
    <div style={{ position: 'absolute', left: 340, top: 128 }}>
      <IFilter size={18} />
    </div>
    <SectionLabel t="TXT / EPUB" y={190} />
    <div style={{ position: 'absolute', left: 24, top: 208, fontSize: 16, fontWeight: 700 }}>{books > 0.5 ? '1 本书，随时阅读' : '还没有自己的书'}</div>
    {books <= 0.5 && (
      <div style={{ position: 'absolute', left: 24, top: 240, fontSize: 10.5, color: PAPER.sub }}>点按右上角 +，把自己的藏书带进来</div>
    )}
    {books > 0 && (
      <div
        style={{
          position: 'absolute',
          left: 24,
          right: 24,
          top: 262,
          height: 100,
          borderBottom: `1px solid ${PAPER.line}`,
          opacity: books,
          transform: `translateY(${(1 - books) * 16}px) scale(${1 - 0.03 * cardPress})`,
          background: cardPress > 0 ? `rgba(40,36,25,${0.05 * cardPress})` : undefined,
        }}
      >
        <Img src={staticFile('wenku/cover-mushoku.png')} style={{ position: 'absolute', left: 0, top: 4, width: 58, height: 82, borderRadius: 2, boxShadow: '0 4px 10px -4px rgba(0,0,0,0.4)' }} />
        <div style={{ position: 'absolute', left: 72, top: 6, fontFamily: MONO, fontSize: 7, letterSpacing: 1.2, color: PAPER.sub }}>WK-1863495889</div>
        <div style={{ position: 'absolute', left: 72, top: 20, width: 210, fontSize: 13, fontWeight: 700, lineHeight: '19px' }}>{BOOK}</div>
        <div style={{ position: 'absolute', left: 72, top: 64, fontSize: 9.5, color: PAPER.sub }}>理不尽な孫の手 · 4 卷合订</div>
        <div style={{ position: 'absolute', right: 0, top: 32 }}>
          <IMore size={20} />
        </div>
      </div>
    )}
    <TabBar H={H} active={2} />
    {menu > 0 && (
      <div
        style={{
          position: 'absolute',
          right: 30,
          top: 76,
          width: 200,
          borderRadius: 20,
          padding: '10px 0',
          background: 'rgba(252,252,248,0.9)',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 0 0 1px rgba(40,36,25,0.08), 0 20px 40px -18px rgba(0,0,0,0.35)',
          transformOrigin: '85% 0',
          transform: `scale(${0.6 + 0.4 * menu}, ${0.3 + 0.7 * menu})`,
          opacity: Math.min(1, menu * 1.5),
        }}
      >
        <div style={{ padding: '4px 18px 8px', fontFamily: MONO, fontSize: 7.5, letterSpacing: 1.5, color: PAPER.sub }}>IMPORT / 导入书籍</div>
        {[
          ['本机文件', 'TXT · EPUB · PDF', <IFile key="a" size={18} />],
          ['OpenList', '网盘目录', <IServer key="b" size={18} />],
          ['WebDAV', '自建同步', <ICloud key="c" size={18} />],
        ].map(([t, s, ic], i) => (
          <div key={t as string} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 18px', opacity: Math.min(1, Math.max(0, menu * 3 - i * 0.6)) }}>
            {ic}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{t}</div>
              <div style={{ fontSize: 8.5, color: PAPER.sub, marginTop: 2 }}>{s}</div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export const ImportDone: React.FC<{ H: number; toggle: number; press?: number; vols?: number }> = ({ H, toggle, press = 0, vols = 1 }) => (
  <div style={{ position: 'absolute', inset: 0, background: PAPER.bg, fontFamily: SERIF, color: PAPER.text }}>
    <div style={{ position: 'absolute', left: 22, top: 40 }}>
      <IBack size={20} />
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 36, textAlign: 'center' }}>
      <div style={{ fontSize: 13.5, fontWeight: 700 }}>导入完成</div>
      <div style={{ fontFamily: MONO, fontSize: 7.5, letterSpacing: 1.6, color: PAPER.sub, marginTop: 3 }}>LOCAL / IMPORT</div>
    </div>
    <div style={{ position: 'absolute', left: 24, top: 104, fontSize: 13 }}>已导入 4 本</div>
    <SectionLabel t="REVIEW / MERGE" y={146} />
    <div style={{ position: 'absolute', left: 24, top: 162, fontSize: 15, fontWeight: 700 }}>同系列分卷</div>
    <div style={{ position: 'absolute', left: 24, right: 30, top: 190, fontSize: 9.5, color: PAPER.sub, lineHeight: '15px' }}>
      确认后合并为一本书，也可以保留各卷独立显示。
    </div>
    <div style={{ position: 'absolute', left: 20, right: 20, top: 230, height: 296, borderRadius: 16, background: 'rgba(40,36,25,0.03)', boxShadow: `inset 0 0 0 1px ${PAPER.line}` }}>
      <div style={{ position: 'absolute', left: 18, top: 16, width: 220, fontSize: 12.5, fontWeight: 700, lineHeight: '19px' }}>{BOOK}</div>
      <div style={{ position: 'absolute', right: 18, top: 22, width: 42, height: 24, borderRadius: 12, background: toggle > 0.5 ? '#2b2a26' : 'rgba(40,36,25,0.14)' }}>
        <div style={{ position: 'absolute', top: 2, left: 2 + 18 * toggle, width: 20, height: 20, borderRadius: 10, background: '#fbfbf8', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
      </div>
      <div style={{ position: 'absolute', left: 18, top: 70, fontSize: 9.5, color: PAPER.sub }}>4 卷</div>
      {[1, 2, 3, 4].map((v, i) => (
        <div
          key={v}
          style={{
            position: 'absolute',
            left: 18,
            right: 18,
            top: 92 + i * 38,
            fontSize: 9.5,
            lineHeight: '14px',
            opacity: Math.min(1, Math.max(0, vols * 4 - i)),
            borderBottom: `1px solid ${PAPER.line}`,
            paddingBottom: 8,
          }}
        >
          第 {v} 卷 · {BOOK} {v}
        </div>
      ))}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 256, textAlign: 'center', fontSize: 10, fontWeight: 700 }}>调整书名与分卷顺序</div>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        top: H - 84,
        height: 46,
        borderRadius: 23,
        background: '#24231f',
        color: '#f6f5ef',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        fontSize: 11.5,
        fontWeight: 700,
        transform: `scale(${1 - 0.05 * press})`,
        boxShadow: '0 12px 24px -14px rgba(0,0,0,0.5)',
      }}
    >
      <ICheck size={14} color="#f6f5ef" sw={2} /> 确认合并 1 个系列
    </div>
  </div>
);

const TOC = ['封面', '第 2 章', '制作信息', '简介', '彩页', '第 6 章', '第 7 章', '目录', '第 9 章', '第 10 章', '第 11 章', '第 12 章', '第 13 章', '第 14 章'];

export const BookDetail: React.FC<{ H: number; scroll: number; pressRead?: number }> = ({ H, scroll, pressRead = 0 }) => (
  <div style={{ position: 'absolute', inset: 0, background: PAPER.bg, fontFamily: SERIF, color: PAPER.text }}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 96, bottom: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: -scroll }}>
        <Img src={staticFile('wenku/cover-mushoku.png')} style={{ position: 'absolute', left: 24, top: 6, width: 130, height: 185, borderRadius: 3, boxShadow: '0 14px 26px -14px rgba(0,0,0,0.55)' }} />
        <div style={{ position: 'absolute', left: 172, right: 22, top: 10, fontSize: 16, fontWeight: 700, lineHeight: '24px' }}>{BOOK}</div>
        <div style={{ position: 'absolute', left: 172, top: 92, fontSize: 10, color: PAPER.sub }}>理不尽な孫の手</div>
        <div style={{ position: 'absolute', left: 172, top: 118, display: 'flex', gap: 6 }}>
          {['EPUB', '合订本'].map((t) => (
            <span key={t} style={{ fontSize: 8.5, padding: '3px 8px', borderRadius: 10, boxShadow: `inset 0 0 0 1px ${PAPER.line}` }}>
              {t}
            </span>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 172, top: 150, fontSize: 9, color: PAPER.sub }}>共 110 章 · 已读 2%</div>
        <div style={{ position: 'absolute', left: 24, top: 222, fontSize: 13, fontWeight: 700 }}>简介</div>
        <div style={{ position: 'absolute', left: 24, right: 24, top: 246, fontSize: 10, color: '#6b6963', lineHeight: '17px' }}>
          一事无成的人生戛然而止，醒来时，他成了剑与魔法世界里的一个婴儿。这一次，他决定不再后悔——认真地，把每一天都活一遍。
        </div>
        <div style={{ position: 'absolute', left: 24, top: 334, fontSize: 15, fontWeight: 700 }}>目录</div>
        <div style={{ position: 'absolute', left: 24, right: 22, top: 368, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, fontWeight: 700 }}>第 1 卷</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, color: PAPER.sub }}>
            34 章 <IChevD size={14} color={PAPER.sub} />
          </span>
        </div>
        {TOC.map((t, i) => (
          <div key={t} style={{ position: 'absolute', left: 24, right: 22, top: 404 + i * 46, height: 46, borderBottom: `1px solid ${PAPER.line}`, display: 'flex', alignItems: 'center' }}>
            <span style={{ width: 34, fontFamily: MONO, fontSize: 8.5, color: PAPER.sub }}>{String(i + 1).padStart(2, '0')}</span>
            <span style={{ flex: 1, fontSize: 11.5 }}>{t}</span>
            <IChevR size={14} color={PAPER.sub} />
          </div>
        ))}
      </div>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 96, background: `linear-gradient(180deg, ${PAPER.bg} 75%, rgba(0,0,0,0))` }}>
      <div style={{ position: 'absolute', left: 22, top: 40 }}>
        <IBack size={20} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 36, textAlign: 'center' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>图书详情</div>
        <div style={{ fontFamily: MONO, fontSize: 7.5, letterSpacing: 1.6, color: PAPER.sub, marginTop: 3 }}>WK-1863495889</div>
      </div>
      <div style={{ position: 'absolute', right: 22, top: 40 }}>
        <ICog size={19} />
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 80,
        right: 80,
        top: H - 78,
        height: 44,
        borderRadius: 22,
        background: 'rgba(252,252,248,0.92)',
        boxShadow: '0 0 0 1px rgba(40,36,25,0.08), 0 12px 24px -14px rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontSize: 11.5,
        fontWeight: 700,
        transform: `scale(${1 - 0.05 * pressRead})`,
      }}
    >
      <IBook size={16} /> 开始阅读 · 第 1 章
    </div>
  </div>
);

// 点按反馈：一圈扩散的涟漪
export const Tap: React.FC<{ x: number; y: number; t: number; double?: boolean }> = ({ x, y, t, double }) => {
  const ring = (d: number) => {
    const p = (t - d) / 14;
    if (p < 0 || p > 1) return null;
    const r = 10 + 26 * p;
    return (
      <div
        key={d}
        style={{
          position: 'absolute',
          left: x - r,
          top: y - r,
          width: r * 2,
          height: r * 2,
          borderRadius: r,
          background: `rgba(40,36,25,${0.16 * (1 - p)})`,
          boxShadow: `0 0 0 1.5px rgba(40,36,25,${0.25 * (1 - p)})`,
        }}
      />
    );
  };
  return (
    <>
      {ring(0)}
      {double && ring(7)}
    </>
  );
};
