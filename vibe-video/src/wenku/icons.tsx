import React from 'react';

// 线性图标，统一 1.6 描边，跟 App 的图标风格一致
type P = { size?: number; color?: string; sw?: number };
const S: React.FC<React.PropsWithChildren<P>> = ({ size = 20, color = 'currentColor', sw = 1.6, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const IBack: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M15 5l-7 7 7 7" />
  </S>
);
export const IChevR: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M9 5l7 7-7 7" />
  </S>
);
export const IChevD: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M6 9l6 6 6-6" />
  </S>
);
export const IBookmark: React.FC<P & { filled?: boolean }> = ({ filled, ...p }) => (
  <S {...p}>
    <path d="M7 4h10v16l-5-4-5 4z" fill={filled ? p.color ?? 'currentColor' : 'none'} />
  </S>
);
export const IHeadphone: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M4 15v-3a8 8 0 0116 0v3" />
    <rect x="3.5" y="14" width="4" height="6" rx="1.5" />
    <rect x="16.5" y="14" width="4" height="6" rx="1.5" />
  </S>
);
export const IArrowL: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </S>
);
export const IArrowR: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </S>
);
export const IBook: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M3 5.5c3-1 6-1 9 1 3-2 6-2 9-1V19c-3-1-6-1-9 1-3-2-6-2-9-1z" />
    <path d="M12 6.5V20" />
  </S>
);
export const IClose: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </S>
);
export const ITrash: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6" />
  </S>
);
export const IPlus: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" />
  </S>
);
export const ISearch: React.FC<P> = (p) => (
  <S {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </S>
);
export const IFilter: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M4 7h10M18 7h2M4 12h4M12 12h8M4 17h12M20 17h0" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="18" cy="17" r="2" />
  </S>
);
export const IHome: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />
  </S>
);
export const IFolder: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M3.5 6.5h6l2 2h9v10.5h-17z" />
    <path d="M3.5 10.5h17" />
  </S>
);
export const IGear: React.FC<P> = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M10 8.5l5 3.5-5 3.5z" />
  </S>
);
export const ICog: React.FC<P> = (p) => (
  <S {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.5l1.6 2.4 2.8-.6.6 2.8 2.4 1.6-1.4 2.3 1.4 2.3-2.4 1.6-.6 2.8-2.8-.6L12 20.5l-1.6-2.4-2.8.6-.6-2.8-2.4-1.6 1.4-2.3-1.4-2.3 2.4-1.6.6-2.8 2.8.6z" />
  </S>
);
export const IMore: React.FC<P> = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <circle cx="5" cy="12" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="19" cy="12" r="1.7" />
  </svg>
);
export const ICheck: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </S>
);
export const IGrid: React.FC<P> = (p) => (
  <S {...p}>
    <rect x="5" y="5" width="5.5" height="5.5" />
    <rect x="13.5" y="5" width="5.5" height="5.5" />
    <rect x="5" y="13.5" width="5.5" height="5.5" />
    <rect x="13.5" y="13.5" width="5.5" height="5.5" />
  </S>
);
export const IFile: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M6 3.5h8l4 4V20.5H6z" />
    <path d="M14 3.5V8h4" />
  </S>
);
export const ICloud: React.FC<P> = (p) => (
  <S {...p}>
    <path d="M7 18.5a4.5 4.5 0 01-.6-9 6 6 0 0111.4 1.6A3.8 3.8 0 0117.5 18.5z" />
  </S>
);
export const IServer: React.FC<P> = (p) => (
  <S {...p}>
    <rect x="4" y="4.5" width="16" height="6" rx="1.5" />
    <rect x="4" y="13.5" width="16" height="6" rx="1.5" />
    <path d="M8 7.5h0M8 16.5h0" />
  </S>
);
