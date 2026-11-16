import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate} from 'remotion';
import {Crop, Cursor} from '../components';
import {Box, C, boxAt, fontFamily, tween} from '../theme';
import {IMG, Icon, Lbl, RENDER_FULL, RENDER_NAT, arcPoint, pop, whip} from './shared';

// Sections 1–2 (global 0–510): device tour, pan right to the phone, Get My Location, pin into the tray.

const STOPS: {box: Box; at: number; label: [number, number]; title: string; sub: string}[] = [
  {box: [395, 470, 425, 245], at: 60, label: [410, 735], title: 'Electronics enclosure', sub: 'LilyGo ESP32 + SIM · RTC'},
  {box: [835, 25, 250, 525], at: 92, label: [1110, 90], title: 'Solar tracker + sensor head', sub: '2-axis · ESP32-CAM · pyranometer'},
  {box: [845, 500, 285, 225], at: 124, label: [880, 745], title: 'Battery + fan', sub: '12 V DC power'},
  {box: [1070, 300, 400, 350], at: 156, label: [1120, 690], title: 'Solar panel', sub: 'on stand'},
  {box: [1440, 410, 215, 250], at: 188, label: [1370, 300], title: 'Wind sensor', sub: 'anemometer'},
];
const HOLD = 20;

// Website screenshot (1290×1361) inside the phone, in phone-panel coordinates.
const SHOT = {x: 534, y: 90, w: 853, h: 900};
const BUTTON = {x: 630, y: 482, w: 661, h: 102};
const LINES: [number, number][] = [
  [612, 720],
  [720, 805],
  [805, 860],
  [860, 957],
];
const COVER_X = 580;
const COVER_W = 761;
const PANEL_X = 1480; // where the phone panel sits in the world

export const S12Device: React.FC<{f: number}> = ({f}) => {
  const camX = tween(f, [205, 258], [0, -PANEL_X], Easing.inOut(Easing.cubic));
  const push = 1 + tween(f, [40, 205], [0, 0.03]);

  // Title over the dimmed render.
  const dim = interpolate(f, [0, 34, 56], [0.68, 0.68, 0], {extrapolateRight: 'clamp'});
  const title = pop(f, 4, 30, 16) * tween(f, [36, 48], [1, 0]);

  // Spotlight tour.
  const keys = STOPS.flatMap((s) => [
    {f: s.at, box: s.box},
    {f: s.at + HOLD, box: s.box},
  ]);
  const [sx, sy, sw, sh] = boxAt(f, keys);
  const spot = tween(f, [52, 62], [0, 1]) * tween(f, [206, 218], [1, 0]);

  // Phone sequence.
  const press = interpolate(f, [300, 303, 310], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ripple = tween(f, [302, 322], [0, 1], Easing.out(Easing.cubic));
  const spinner = tween(f, [306, 310], [0, 1]) * tween(f, [332, 336], [1, 0]);
  const cursorP = tween(f, [265, 300], [0, 1]);
  const cx = 1600 + (1000 - 1600) * cursorP;
  const cy = 880 + (540 - 880) * cursorP;
  const cursorO = tween(f, [258, 264], [0, 1]) * tween(f, [340, 350], [1, 0]);
  const phoneX = tween(f, [395, 420], [0, -260]);
  const card = pop(f, 405) * tween(f, [446, 454], [1, 0]);
  const tick = pop(f, 425, 30, 11);

  // Pin token from the card into the tray (screen coordinates).
  const tokT = tween(f, [448, 476], [0, 1], Easing.inOut(Easing.cubic));
  const tok = arcPoint([1510, 335], [1279, 973], 220, tokT);
  const tokOn = f >= 448 && f < 480;

  const out = f >= 500 ? whip(f, 510, -1, 'out') : {};

  return (
    <AbsoluteFill style={{background: C.light, ...out}}>
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${camX}px)`}}>
        {/* phone panel background */}
        <div style={{position: 'absolute', left: 1920, top: 0, width: PANEL_X + 400, height: 1080, background: C.light}} />
        {/* device panel */}
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, overflow: 'hidden', opacity: tween(f, [228, 262], [1, 0.55])}}>
          <div style={{position: 'absolute', inset: 0, transform: `scale(${push})`}}>
            <Crop src={IMG.render} nat={RENDER_NAT} box={RENDER_FULL} w={1920} h={1080} />
            {spot > 0 && (
              <svg width={1920} height={1080} style={{position: 'absolute', opacity: spot}}>
                <defs>
                  <mask id="s1spot">
                    <rect width={1920} height={1080} fill="#fff" />
                    <rect x={sx} y={sy} width={sw} height={sh} rx={30} fill="#000" />
                  </mask>
                </defs>
                <rect width={1920} height={1080} fill={C.char} opacity={0.6} mask="url(#s1spot)" />
                <rect x={sx} y={sy} width={sw} height={sh} rx={30} fill="none" stroke={C.light} strokeWidth={8} />
              </svg>
            )}
            {STOPS.map((s, i) => (
              <Lbl
                key={i}
                x={s.label[0]}
                y={s.label[1]}
                p={pop(f, s.at + 4) * tween(f, [s.at + HOLD + 6, s.at + HOLD + 12], [1, 0])}
                title={s.title}
                sub={s.sub}
              />
            ))}
          </div>
          <AbsoluteFill style={{background: C.char, opacity: dim}} />
          {title > 0.01 && (
            <div style={{position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', color: C.cream, fontFamily, opacity: title, transform: `translateY(${(1 - title) * 30}px)`}}>
              <div style={{fontSize: 30, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.light}}>IoT-Based Residential</div>
              <div style={{fontSize: 76, fontWeight: 800, letterSpacing: -1.5, marginTop: 12}}>Rooftop Solar Panel Placement Assessment</div>
              <div style={{width: 180 * title, height: 8, background: C.sage, borderRadius: 4, margin: '34px auto 0'}} />
            </div>
          )}
        </div>

        {/* phone panel (coordinates match the storyboard once the pan settles) */}
        <div style={{position: 'absolute', left: PANEL_X, top: 0, width: 1920, height: 1080}}>
          <div style={{position: 'absolute', inset: 0, transform: `translateX(${phoneX}px)`}}>
            <div style={{position: 'absolute', left: SHOT.x - 22, top: SHOT.y - 22, width: SHOT.w + 44, height: SHOT.h + 44, background: C.char, borderRadius: 56, boxShadow: '0 30px 70px rgba(40,51,45,.3)'}} />
            <Img src={IMG.site} style={{position: 'absolute', left: SHOT.x, top: SHOT.y, width: SHOT.w, height: SHOT.h, borderRadius: 36}} />
            <div style={{position: 'absolute', left: BUTTON.x, top: BUTTON.y, width: BUTTON.w, height: BUTTON.h, borderRadius: 15, background: C.char, opacity: press * 0.3}} />
            {LINES.map(([top, bottom], i) => {
              const p = tween(f, [336 + i * 9, 348 + i * 9], [0, 1]);
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
            {cursorO > 0 && <Cursor x={cx} y={cy} scale={1 - press * 0.15} opacity={cursorO} />}
          </div>
          {card > 0.01 && (
            <div
              style={{
                position: 'absolute',
                left: 1230,
                top: 170,
                width: 560,
                height: 330,
                padding: 38,
                borderRadius: 28,
                background: '#fff',
                boxShadow: '0 14px 40px rgba(40,51,45,.16)',
                fontFamily,
                color: C.dark,
                opacity: Math.min(1, card * 1.4),
                transform: `translateX(${(1 - card) * -120}px) scale(${0.85 + 0.15 * card})`,
              }}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
                <Icon name="pin" size={66} />
                <div style={{fontSize: 30, fontWeight: 600, color: '#5E6E64'}}>Site location</div>
                <Icon name="check" size={52} color={C.sage} style={{marginLeft: 'auto', opacity: tick, transform: `scale(${tick})`}} />
              </div>
              <div style={{fontSize: 46, fontWeight: 700, marginTop: 18}}>25.23° N, 51.56° E</div>
              <div style={{fontSize: 28, color: '#5E6E64', marginTop: 8, opacity: tick}}>± 10.3 m · saved</div>
            </div>
          )}
        </div>
      </div>

      {tokOn && (
        <div
          style={{
            position: 'absolute',
            left: tok[0] - 44,
            top: tok[1] - 44,
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: C.dark,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 24px rgba(40,51,45,.3)',
            transform: `scale(${1 - tokT * 0.4})`,
          }}
        >
          <Icon name="pin" size={54} color={C.cream} />
        </div>
      )}
    </AbsoluteFill>
  );
};
