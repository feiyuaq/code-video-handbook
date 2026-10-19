import React from 'react';

// 手机外框：奶白面板 + 右侧/底部厚度 + 地面上的斜向软阴影（和原片的立体悬浮感一致）
// 屏幕内容按 390 宽的逻辑尺寸设计，再整体缩放到实际宽度
export const LOGICAL_W = 390;

export type PhoneBox = { x: number; y: number; w: number; h: number; opacity?: number; rot?: number };

export const Phone: React.FC<React.PropsWithChildren<PhoneBox & { screenBg?: string; shadow?: number }>> = ({
  x,
  y,
  w,
  h,
  opacity = 1,
  rot = 0,
  screenBg = '#f8f7f2',
  shadow = 1,
  children,
}) => {
  const k = w / LOGICAL_W;
  const lh = h / k;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, opacity }}>
      {/* 地面阴影：从机身底部向右下拉出的平行四边形 */}
      <div
        style={{
          position: 'absolute',
          left: w * 0.08,
          top: h * 0.86,
          width: w * 1.25,
          height: h * 0.13,
          background: 'linear-gradient(90deg, rgba(40,36,25,0.20), rgba(40,36,25,0.07) 70%, rgba(40,36,25,0))',
          transform: 'skewX(-52deg)',
          transformOrigin: 'left bottom',
          filter: `blur(${w * 0.035}px)`,
          opacity: shadow,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `perspective(2400px) rotateY(${rot}deg)`,
        }}
      >
        {/* 机身厚度 */}
        <div
          style={{
            position: 'absolute',
            left: 4,
            top: 5,
            width: w,
            height: h + 6,
            background: 'linear-gradient(180deg, #e7e6df, #d9d8d0)',
            borderRadius: 5,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 4,
            overflow: 'hidden',
            background: screenBg,
            boxShadow: '0 0 0 1px rgba(30,28,20,0.10), inset -2px 0 0 rgba(255,255,255,0.7), 0 20px 40px -26px rgba(30,25,10,0.35)',
          }}
        >
          <div style={{ position: 'absolute', left: 0, top: 0, width: LOGICAL_W, height: lh, transform: `scale(${k})`, transformOrigin: '0 0' }}>
            {children}
          </div>
          {/* 玻璃高光 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(115deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 35%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
};

// 版位（1080p 实测换算）
export const RIGHT: PhoneBox = { x: 1191, y: 111, w: 432, h: 854 };
export const LEFT: PhoneBox = { x: 300, y: 111, w: 432, h: 854 };
export const MODE_W = 311;
export const MODE_H = 615;
export const MODES: PhoneBox[] = [
  { x: 278, y: 286, w: MODE_W, h: MODE_H },
  { x: 805, y: 286, w: MODE_W, h: MODE_H },
  { x: 1332, y: 286, w: MODE_W, h: MODE_H },
];

export const lerpBox = (a: PhoneBox, b: PhoneBox, p: number): PhoneBox => ({
  x: a.x + (b.x - a.x) * p,
  y: a.y + (b.y - a.y) * p,
  w: a.w + (b.w - a.w) * p,
  h: a.h + (b.h - a.h) * p,
});
