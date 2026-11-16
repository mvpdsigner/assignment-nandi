import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useVideoConfig} from 'remotion';
import {Chip, Cursor, PinIcon} from './components';
import {C, fontFamily, tween} from './theme';

const SITE = staticFile('website_location.jpg');

// Screenshot (1290×1361) shown at 853×900 inside the phone; positions below are in frame px.
const SHOT = {x: 534, y: 90, w: 853, h: 900};
const BUTTON = {x: 630, y: 482, w: 661, h: 102};
// Result lines, revealed top to bottom: confirmation, latitude, longitude, accuracy.
const LINES: [number, number][] = [
  [612, 720],
  [720, 805],
  [805, 860],
  [860, 957],
];
const COVER_X = 580;
const COVER_W = 761;

const CURSOR_FROM = {x: 1560, y: 900};
const CURSOR_TO = {x: 1000, y: 540};

export const SceneLocation: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();

  const wipe = tween(f, [154, 174], [0, 2300], Easing.in(Easing.quad));
  const phoneY = tween(f, [160, 186], [1100, 0], Easing.out(Easing.cubic));
  const phoneX = tween(f, [262, 282], [0, -260]);

  const press = interpolate(f, [206, 209, 216], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ripple = tween(f, [208, 228], [0, 1], Easing.out(Easing.cubic));
  const spinner = tween(f, [212, 216], [0, 1]) * tween(f, [236, 240], [1, 0]);

  const cursorP = tween(f, [180, 206], [0, 1]);
  const cx = CURSOR_FROM.x + (CURSOR_TO.x - CURSOR_FROM.x) * cursorP;
  const cy = CURSOR_FROM.y + (CURSOR_TO.y - CURSOR_FROM.y) * cursorP;
  const cursorOpacity = tween(f, [178, 184], [0, 1]) * tween(f, [248, 256], [1, 0]);
  const cursorScale = 1 - press * 0.15;

  const card = spring({frame: f - 266, fps, config: {damping: 13}});

  if (f < 154) return null;

  return (
    <AbsoluteFill style={{clipPath: `circle(${wipe}px at 950px 240px)`, background: C.light}}>
      <svg width={1920} height={1080} style={{position: 'absolute', opacity: 0.5}}>
        <defs>
          <pattern id="grid" width={60} height={60} patternUnits="userSpaceOnUse">
            <path d="M60 0H0V60" fill="none" stroke="#CAD9CE" strokeWidth={2} />
          </pattern>
        </defs>
        <rect width={1920} height={1080} fill="url(#grid)" />
      </svg>

      <div style={{position: 'absolute', inset: 0, transform: `translate(${phoneX}px, ${phoneY}px)`}}>
        <div
          style={{
            position: 'absolute',
            left: SHOT.x - 22,
            top: SHOT.y - 22,
            width: SHOT.w + 44,
            height: SHOT.h + 44,
            background: C.char,
            borderRadius: 56,
            boxShadow: '0 30px 70px rgba(40,51,45,.3)',
          }}
        />
        <Img src={SITE} style={{position: 'absolute', left: SHOT.x, top: SHOT.y, width: SHOT.w, height: SHOT.h, borderRadius: 36}} />
        <div
          style={{
            position: 'absolute',
            left: BUTTON.x,
            top: BUTTON.y,
            width: BUTTON.w,
            height: BUTTON.h,
            borderRadius: 15,
            background: C.char,
            opacity: press * 0.3,
          }}
        />
        {LINES.map(([top, bottom], i) => {
          const p = tween(f, [240 + i * 6, 249 + i * 6], [0, 1]);
          if (p >= 1) return null;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: COVER_X + COVER_W * p,
                top,
                width: COVER_W * (1 - p),
                height: bottom - top,
                background: '#fff',
                borderRadius: i === LINES.length - 1 ? '0 0 24px 24px' : 0,
              }}
            />
          );
        })}
        {spinner > 0 && (
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, opacity: spinner}}>
            <circle cx={960} cy={760} r={46} fill="none" stroke={C.light} strokeWidth={12} />
            <path d="M960 714 a46 46 0 0 1 46 46" fill="none" stroke={C.dark} strokeWidth={12} strokeLinecap="round" transform={`rotate(${f * 14} 960 760)`} />
          </svg>
        )}
        {ripple > 0 && ripple < 1 && (
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
            <circle cx={1000} cy={540} r={20 + ripple * 130} fill="none" stroke={C.cream} strokeWidth={6} opacity={(1 - ripple) * 0.9} />
          </svg>
        )}
        {cursorOpacity > 0 && <Cursor x={cx} y={cy} scale={cursorScale} opacity={cursorOpacity} />}
      </div>

      {card > 0.01 && (
        <div
          style={{
            position: 'absolute',
            left: 1230,
            top: 300,
            width: 540,
            height: 300,
            padding: 40,
            borderRadius: 28,
            background: '#fff',
            boxShadow: '0 14px 40px rgba(40,51,45,.16)',
            fontFamily,
            color: C.dark,
            opacity: Math.min(1, card),
            transform: `translateX(${(1 - card) * -120}px) scale(${0.85 + 0.15 * card})`,
          }}
        >
          <PinIcon size={70} color={C.dark} />
          <div style={{fontSize: 30, fontWeight: 600, color: '#5E6E64', marginTop: 10}}>Site location</div>
          <div style={{fontSize: 40, fontWeight: 700, marginTop: 6}}>25.2324° N, 51.5643° E</div>
          <div style={{fontSize: 28, color: '#5E6E64', marginTop: 6}}>± 10.3 m</div>
        </div>
      )}

      <Chip f={f} inAt={272} pos={{left: 1230, top: 650}}>
        Site Location Acquired
      </Chip>
    </AbsoluteFill>
  );
};
