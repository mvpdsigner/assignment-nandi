import React from 'react';
import {Img} from 'remotion';
import {Box, C, fontFamily, tween} from './theme';

// Shows the region `box` (source-pixel coords) of an image, cover-fitted to w × h.
export const Crop: React.FC<{
  src: string;
  nat: [number, number];
  box: Box;
  w: number;
  h: number;
  style?: React.CSSProperties;
}> = ({src, nat, box, w, h, style}) => {
  const [x, y, bw, bh] = box;
  const s = Math.max(w / bw, h / bh);
  return (
    <div style={{position: 'absolute', overflow: 'hidden', width: w, height: h, ...style}}>
      <Img
        src={src}
        style={{
          position: 'absolute',
          maxWidth: 'none',
          width: nat[0] * s,
          height: nat[1] * s,
          left: -x * s - (bw * s - w) / 2,
          top: -y * s - (bh * s - h) / 2,
        }}
      />
    </div>
  );
};

// Lower-left on-screen title pill.
export const Chip: React.FC<{
  f: number;
  inAt: number;
  outAt?: number;
  pos?: React.CSSProperties;
  children: React.ReactNode;
}> = ({f, inAt, outAt = 1e9, pos = {left: 90, bottom: 70}, children}) => {
  const p = tween(f, [inAt, inAt + 14], [0, 1]) * tween(f, [outAt, outAt + 10], [1, 0]);
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        ...pos,
        opacity: p,
        transform: `translateY(${(1 - p) * 40}px)`,
        background: C.dark,
        color: C.cream,
        fontFamily,
        fontSize: 46,
        fontWeight: 600,
        padding: '20px 40px',
        borderRadius: 999,
        boxShadow: '0 10px 30px rgba(40,51,45,.25)',
      }}
    >
      {children}
    </div>
  );
};

// `top` moves the corner badge to the top right (the full video keeps the bottom right for the data tray).
export const Watermark: React.FC<{text: string; top?: boolean}> = ({text, top}) => (
  <>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize: 260,
          fontWeight: 800,
          letterSpacing: -6,
          transform: 'rotate(-20deg)',
          color: 'rgba(255,255,255,0.13)',
          WebkitTextStroke: '3px rgba(40,51,45,0.13)',
        }}
      >
        {text}
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        right: 48,
        ...(top ? {top: 40} : {bottom: 40}),
        fontFamily,
        fontSize: 30,
        fontWeight: 700,
        color: C.cream,
        background: 'rgba(40,51,45,0.55)',
        padding: '10px 22px',
        borderRadius: 12,
        letterSpacing: 0.5,
      }}
    >
      {text} · Preview
    </div>
  </>
);

export const Cursor: React.FC<{x: number; y: number; scale?: number; opacity?: number}> = ({
  x,
  y,
  scale = 1,
  opacity = 1,
}) => (
  <svg
    width={90}
    height={90}
    viewBox="0 0 48 48"
    style={{position: 'absolute', left: x, top: y, opacity, transform: `scale(${scale})`, transformOrigin: '0 0'}}
  >
    <path d="M8 4l30 18-13 3-6 13z" fill={C.char} stroke="#fff" strokeWidth={2.5} strokeLinejoin="round" />
  </svg>
);

export const PinIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <g fill="none" stroke={color} strokeWidth={3}>
      <path d="M24 44s14-13 14-24a14 14 0 0 0-28 0c0 11 14 24 14 24z" />
      <circle cx={24} cy={20} r={5} />
    </g>
  </svg>
);
