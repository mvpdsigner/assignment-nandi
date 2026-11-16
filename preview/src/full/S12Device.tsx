import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Crop} from '../components';
import {Box, C, boxAt, fontFamily, tween} from '../theme';
import {EDGE, Glass, INK, Lab, SCREEN, SOFT, innerStyle, mono} from './glass';
import {IMG, Icon, Lbl, RENDER_FULL, RENDER_NAT, arcPoint, pop, whip} from './shared';

// Sections 1–2 (global 0–444): quick device tour, pan right to the phone, Get My Location, pin into the tray.

// Client feedback: the component tour is not important, so it runs about twice as fast as the first draft.
const STOPS: {box: Box; at: number; label: [number, number]; title: string; sub: string}[] = [
  {box: [395, 470, 425, 245], at: 58, label: [410, 735], title: 'Electronics enclosure', sub: 'LilyGo ESP32 + SIM · RTC'},
  {box: [835, 25, 250, 525], at: 74, label: [1110, 90], title: 'Solar tracker + sensor head', sub: '2-axis · ESP32-CAM · pyranometer'},
  {box: [845, 500, 285, 225], at: 90, label: [880, 745], title: 'Battery + fan', sub: '12 V DC power'},
  {box: [1070, 300, 400, 350], at: 106, label: [1120, 690], title: 'Solar panel', sub: 'on stand'},
  {box: [1440, 410, 215, 250], at: 122, label: [1370, 300], title: 'Wind sensor', sub: 'anemometer'},
];
const HOLD = 8;
// Everything after the tour keeps its first-draft timing, shifted earlier by the time saved.
export const S12_SHIFT = 78;

const PANEL_X = 1480; // where the phone panel sits in the world
const PH = {x: 725, y: 64, w: 470, h: 952};
const BTN: [number, number] = [PH.w / 2, 452]; // button centre, in phone coordinates
const BTN_SCREEN: [number, number] = [PH.x + BTN[0], PH.y + BTN[1]];

const typed = (text: string, f: number, a: number, b: number) => text.slice(0, Math.round(tween(f, [a, b], [0, text.length], Easing.linear)));

const Phone: React.FC<{g: number}> = ({g}) => {
  const press = interpolate(g, [300, 303, 310], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const locating = g >= 304 && g < 336;
  const saved = tween(g, [336, 344], [0, 1]);
  const savedPop = pop(g, 336, 30, 12);
  const sweep = (g * 9) % 360;
  const rows: [string, string, number][] = [
    ['LAT', '25.23° N', 344],
    ['LONG', '51.56° E', 352],
    ['ACC', '± 10.3 m', 360],
  ];
  return (
    <div style={{position: 'absolute', left: PH.x, top: PH.y, width: PH.w, height: PH.h, borderRadius: 70, background: C.char, padding: 16, boxSizing: 'border-box', boxShadow: '0 34px 80px rgba(40,51,45,.35)'}}>
      <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 56, overflow: 'hidden', background: SCREEN, color: INK, fontFamily}}>
        <div style={{position: 'absolute', left: '50%', top: 13, width: 130, height: 34, borderRadius: 18, background: C.char, transform: 'translateX(-50%)'}} />
        <div style={{height: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 34px 4px', fontSize: 18, fontWeight: 700}}>
          <span>9:41</span>
          <span style={{letterSpacing: 2}}>•••</span>
        </div>
        <div style={{padding: '22px 30px 0'}}>
          <Lab>Solar tracker</Lab>
          <div style={{fontSize: 34, fontWeight: 800, letterSpacing: -0.6, marginTop: 8}}>Solar Tracker Setup</div>
          <div style={{fontSize: 18, lineHeight: 1.45, color: SOFT, marginTop: 10}}>Place your phone near the solar tracker and press the button below.</div>
        </div>
        {/* radar + button */}
        <svg width={PH.w - 32} height={PH.h - 32} style={{position: 'absolute', left: 0, top: 0}}>
          {[100, 145, 190].map((r) => (
            <circle key={r} cx={BTN[0] - 16} cy={BTN[1] - 16} r={r} fill="none" stroke="rgba(38,68,56,.14)" strokeWidth={2} />
          ))}
          {locating && (
            <path
              d={`M${BTN[0] - 16} ${BTN[1] - 16} L${BTN[0] - 16} ${BTN[1] - 16 - 190} A190 190 0 0 1 ${BTN[0] - 16 + 190 * Math.sin(Math.PI / 3)} ${BTN[1] - 16 - 190 * Math.cos(Math.PI / 3)} Z`}
              fill="rgba(53,92,77,.12)"
              transform={`rotate(${sweep} ${BTN[0] - 16} ${BTN[1] - 16})`}
            />
          )}
          {saved > 0 && <circle cx={BTN[0] - 16} cy={BTN[1] - 16} r={100 + 90 * tween(g, [336, 356], [0, 1])} fill="none" stroke={C.sage} strokeWidth={4} opacity={1 - tween(g, [336, 356], [0, 1])} />}
        </svg>
        <div
          style={{
            position: 'absolute',
            left: BTN[0] - 16 - 82,
            top: BTN[1] - 16 - 82,
            width: 164,
            height: 164,
            borderRadius: '50%',
            background: saved > 0.5 ? C.sage : locating ? '#4A7262' : C.dark,
            color: '#fff',
            boxShadow: `0 0 0 ${14 + press * 10}px rgba(53,92,77,.12), 0 14px 30px rgba(40,51,45,.25)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: 18,
            fontWeight: 800,
            textAlign: 'center',
            lineHeight: 1.2,
            transform: `scale(${(1 - press * 0.08) * (saved > 0 ? 0.9 + 0.1 * savedPop : 1)})`,
          }}
        >
          {saved > 0.5 ? (
            <>
              <svg width={40} height={40} viewBox="0 0 48 48">
                <path d="M12 25l8 8 16-17" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Saved
            </>
          ) : (
            <>
              <Icon name="pin" size={40} color="#fff" />
              {locating ? 'Locating…' : (
                <span>
                  Get My
                  <br />
                  Location
                </span>
              )}
            </>
          )}
        </div>
        {/* readout */}
        <div style={{position: 'absolute', left: 22, right: 22, bottom: 30, height: 236, padding: '22px 24px', boxSizing: 'border-box', ...innerStyle(26)}}>
          {saved > 0.5 ? (
            <div style={{display: 'inline-flex', alignItems: 'center', gap: 8, background: C.dark, color: '#fff', fontSize: 17, fontWeight: 700, padding: '7px 14px', borderRadius: 999, transform: `scale(${savedPop})`, transformOrigin: 'left center'}}>
              ✓ Location successfully saved
            </div>
          ) : (
            <Lab style={{display: 'flex', alignItems: 'center', gap: 10, height: 34}}>
              {locating && <i style={{width: 11, height: 11, borderRadius: '50%', background: C.sage, boxShadow: '0 0 0 4px rgba(125,157,134,.35)'}} />}
              {locating ? 'Locating' : 'Waiting for location'}
            </Lab>
          )}
          <div style={{marginTop: 20, display: 'grid', gridTemplateColumns: '84px 1fr', rowGap: 12, alignItems: 'baseline'}}>
            {rows.map(([k, v, a]) => (
              <React.Fragment key={k}>
                <Lab>{k}</Lab>
                <div style={{fontFamily: mono, fontSize: 28, fontWeight: 800, color: g >= a ? INK : SOFT, whiteSpace: 'nowrap'}}>
                  {g >= a ? typed(v, g, a, a + 8) : '— — —'}
                  {g >= a && g < a + 9 && Math.floor(g / 3) % 2 === 0 && <span style={{color: C.sage}}>▌</span>}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div style={{position: 'absolute', left: '50%', bottom: 10, width: 150, height: 6, borderRadius: 3, background: 'rgba(38,68,56,.35)', transform: 'translateX(-50%)'}} />
      </div>
    </div>
  );
};

export const S12Device: React.FC<{f: number}> = ({f}) => {
  const g = f + S12_SHIFT; // first-draft timeline for everything after the tour
  const camX = tween(g, [205, 258], [0, -PANEL_X], Easing.inOut(Easing.cubic));
  const push = 1 + tween(f, [40, 130], [0, 0.03]);

  // Title over the dimmed render.
  const dim = interpolate(f, [0, 34, 56], [0.68, 0.68, 0], {extrapolateRight: 'clamp'});
  const title = pop(f, 4, 30, 16) * tween(f, [36, 48], [1, 0]);

  // Spotlight tour.
  const keys = STOPS.flatMap((s) => [
    {f: s.at, box: s.box},
    {f: s.at + HOLD, box: s.box},
  ]);
  const [sx, sy, sw, sh] = boxAt(f, keys);
  const spot = tween(f, [50, 58], [0, 1]) * tween(g, [206, 218], [1, 0]);

  // Phone sequence (touch, not a mouse cursor).
  const press = interpolate(g, [300, 303, 310], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ripple = tween(g, [302, 322], [0, 1], Easing.out(Easing.cubic));
  const touchP = tween(g, [265, 298], [0, 1], Easing.inOut(Easing.cubic));
  const tx = 1500 + (BTN_SCREEN[0] - 1500) * touchP;
  const ty = 980 + (BTN_SCREEN[1] - 980) * touchP;
  const touchO = tween(g, [258, 266], [0, 1]) * tween(g, [312, 322], [1, 0]);
  const phoneX = tween(g, [395, 420], [0, -260]);
  const card = pop(g, 405) * tween(g, [446, 454], [1, 0]);
  const tick = pop(g, 425, 30, 11);

  // Pin token from the card into the tray (screen coordinates).
  const tokT = tween(g, [448, 476], [0, 1], Easing.inOut(Easing.cubic));
  const tok = arcPoint([1390, 335], [1279, 973], 220, tokT);
  const tokOn = g >= 448 && g < 480;

  const out = g >= 500 ? whip(g, 510, -1, 'out') : {};

  return (
    <AbsoluteFill style={{background: C.light, ...out}}>
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${camX}px)`}}>
        {/* phone panel background */}
        <div style={{position: 'absolute', left: 1920, top: 0, width: PANEL_X + 400, height: 1080, background: `radial-gradient(900px 700px at ${PANEL_X + 960 - 1920}px 540px, ${C.cream}, ${C.light})`}} />
        {/* device panel */}
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, overflow: 'hidden', opacity: tween(g, [228, 262], [1, 0.55])}}>
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
              <Lbl key={i} x={s.label[0]} y={s.label[1]} p={pop(f, s.at + 2, 30, 14) * tween(f, [s.at + HOLD + 6, s.at + HOLD + 12], [1, 0])} title={s.title} sub={s.sub} />
            ))}
          </div>
          <AbsoluteFill style={{background: C.char, opacity: dim}} />
          {title > 0.01 && (
            <div style={{position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', color: C.cream, fontFamily, opacity: title, transform: `translateY(${(1 - title) * 30}px)`}}>
              <div style={{fontFamily: mono, fontSize: 28, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.light}}>IoT-Based Residential</div>
              <div style={{fontSize: 76, fontWeight: 800, letterSpacing: -1.5, marginTop: 12}}>Rooftop Solar Panel Placement Assessment</div>
              <div style={{width: 180 * title, height: 8, background: C.sage, borderRadius: 4, margin: '34px auto 0'}} />
            </div>
          )}
        </div>

        {/* phone panel */}
        <div style={{position: 'absolute', left: PANEL_X, top: 0, width: 1920, height: 1080}}>
          <div style={{position: 'absolute', inset: 0, transform: `translateX(${phoneX}px)`}}>
            <Phone g={g} />
            {ripple > 0 && ripple < 1 && (
              <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
                <circle cx={BTN_SCREEN[0]} cy={BTN_SCREEN[1]} r={30 + ripple * 150} fill="none" stroke={C.dark} strokeWidth={6} opacity={(1 - ripple) * 0.9} />
              </svg>
            )}
            {touchO > 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: tx - 34,
                  top: ty - 34,
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  background: 'rgba(53,92,77,.35)',
                  border: '3px solid rgba(255,255,255,.95)',
                  boxShadow: '0 8px 22px rgba(40,51,45,.35)',
                  opacity: touchO,
                  transform: `scale(${1 - press * 0.25})`,
                }}
              />
            )}
          </div>
          {card > 0.01 && (
            <Glass
              r={30}
              style={{
                left: 1110,
                top: 170,
                width: 560,
                height: 330,
                padding: '34px 36px',
                boxSizing: 'border-box',
                fontFamily,
                opacity: Math.min(1, card * 1.4),
                transform: `translateX(${(1 - card) * -120}px) scale(${0.85 + 0.15 * card})`,
              }}
            >
              <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                <Icon name="pin" size={54} color={C.dark} />
                <Lab style={{fontSize: 17}}>Site location</Lab>
                <div style={{marginLeft: 'auto', width: 46, height: 46, borderRadius: '50%', background: C.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${tick})`}}>
                  <svg width={30} height={30} viewBox="0 0 48 48">
                    <path d="M12 25l8 8 16-17" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <div style={{fontFamily: mono, fontSize: 46, fontWeight: 800, marginTop: 26, letterSpacing: -1, whiteSpace: 'nowrap'}}>25.23° N, 51.56° E</div>
              <div style={{fontFamily: mono, fontSize: 22, color: SOFT, marginTop: 14, opacity: tick, borderTop: `1.5px solid ${EDGE}`, paddingTop: 14}}>± 10.3 m · saved</div>
            </Glass>
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
            boxShadow: '0 10px 24px rgba(40,51,45,.3), inset 0 1.5px 0 rgba(255,255,255,.5)',
            transform: `scale(${1 - tokT * 0.4})`,
          }}
        >
          <Icon name="pin" size={54} color="#fff" />
        </div>
      )}
    </AbsoluteFill>
  );
};
