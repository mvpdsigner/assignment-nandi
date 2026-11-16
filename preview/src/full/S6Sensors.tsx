import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Crop} from '../components';
import {Box, C, boxAt, fontFamily, tween} from '../theme';
import {INK, Lab, SCREEN, SOFT, innerStyle, mono} from './glass';
import {DataPill, IMG, Icon, Lbl, Pt, RENDER_FULL, RENDER_NAT, Rings, SLOT_CENTERS, along, arcPoint, countUp, pop, ptsAttr, whip} from './shared';

// Section 6 (local 0 = global 1380): sensors light up, readings flow to the ESP32, then over cellular to Blynk.

const HOLES: {box: Box; at: number; label: Pt; title: string; sub: string; icon: 'sun' | 'wind' | 'therm' | 'grid' | 'clock'}[] = [
  {box: [860, 22, 200, 200], at: 12, label: [1090, 40], title: 'Pyranometer', sub: 'solar irradiance', icon: 'sun'},
  {box: [1440, 410, 210, 250], at: 32, label: [1420, 290], title: 'Wind sensor', sub: 'wind speed', icon: 'wind'},
  {box: [545, 560, 105, 110], at: 52, label: [230, 735], title: 'BME280', sub: 'temp · humidity · pressure', icon: 'therm'},
  {box: [655, 560, 105, 110], at: 72, label: [740, 735], title: 'MLX90640', sub: 'thermal camera', icon: 'grid'},
  {box: [440, 485, 330, 80], at: 92, label: [60, 330], title: 'RTC', sub: 'timestamp · inside', icon: 'clock'},
];

const ESP32: Pt = [600, 528];
const FLOWS: {pts: Pt[]; at: number; dur: number; text: string; icon: 'sun' | 'wind' | 'therm' | 'grid' | 'clock'}[] = [
  {pts: [[960, 110], [1010, 250], [990, 470], [800, 520], [660, 528]], at: 130, dur: 55, text: '25.00 W/m²', icon: 'sun'},
  {pts: [[1540, 560], [1400, 650], [1100, 615], [830, 560], [665, 535]], at: 145, dur: 65, text: '3.6 m/s', icon: 'wind'},
  {pts: [[594, 770], [596, 640], [600, 548]], at: 165, dur: 32, text: '50.47 °C · 21.4 % · 1014.8 hPa', icon: 'therm'},
  {pts: [[704, 790], [690, 640], [640, 545]], at: 185, dur: 32, text: '27.41 / 30.48 °C', icon: 'grid'},
  {pts: [[300, 430], [450, 480], [560, 520]], at: 205, dur: 26, text: 'RTC time-stamp', icon: 'clock'},
];

const TILES: [string, number, number, string][] = [
  ['Irradiance', 25.0, 2, 'W/m²'],
  ['Ambient', 50.47, 2, '°C'],
  ['Thermal avg', 27.41, 2, '°C'],
  ['Thermal max', 30.48, 2, '°C'],
  ['Humidity', 21.4, 1, '%'],
  ['Pressure', 1014.8, 1, 'hPa'],
  ['Wind', 3.6, 1, 'm/s'],
];

export const S6Sensors: React.FC<{f: number}> = ({f: local}) => {
  // Second draft: the sensor reveal (first 118 frames) plays in 88, everything after runs 30 frames earlier.
  const f = local < 88 ? (local * 118) / 88 : local + 30;
  // 6A/6B on the full render; 6C zooms into the enclosure, which shrinks into a card.
  const box = boxAt(f, [
    {f: 268, box: RENDER_FULL},
    {f: 296, box: [300, 440, 360, 203]},
  ]);
  const shrink = tween(f, [296, 322], [0, 1], Easing.inOut(Easing.cubic));
  const frame = {x: 50 * shrink, y: 330 * shrink, w: 1920 + (620 - 1920) * shrink, h: 1080 + (349 - 1080) * shrink};

  const dim = tween(f, [4, 14], [0, 0.68]) * tween(f, [262, 280], [1, 0]);
  const holeP = (at: number) => (f < 118 ? pop(f, at, 30, 15) : 1) * tween(f, [118, 128], [1, 0]);
  const bus = tween(f, [122, 132], [0, 1]) * tween(f, [258, 268], [1, 0]);

  // Arrival pulses on the ESP32.
  const pulse = Math.max(0, ...FLOWS.map((fl) => interpolate(f, [fl.at + fl.dur, fl.at + fl.dur + 4, fl.at + fl.dur + 16], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})));

  // 6C network + Blynk.
  const phoneIn = tween(f, [318, 342], [0, 1], Easing.out(Easing.cubic));
  const tower = pop(f, 316);
  const sendPills: [string, 'sun' | 'therm' | 'wind'][] = [
    ['25.00 W/m²', 'sun'],
    ['50.47 °C', 'therm'],
    ['3.6 m/s', 'wind'],
  ];

  const inStyle = f < 10 ? whip(f, 0, -1, 'in') : {};
  const outP = tween(f, [420, 436], [0, 1]);

  return (
    <AbsoluteFill style={{...inStyle, opacity: 1 - outP, transform: `${inStyle.transform ?? ''} scale(${1 - 0.06 * outP})`, filter: outP > 0 ? `blur(${outP * 10}px)` : inStyle.filter}}>
      <AbsoluteFill style={{background: `linear-gradient(${C.cream}, ${C.light})`}} />
      <div style={{position: 'absolute', left: frame.x, top: frame.y, width: frame.w, height: frame.h, overflow: 'hidden', borderRadius: 24 * shrink, boxShadow: shrink > 0 ? '0 14px 40px rgba(40,51,45,.2)' : undefined}}>
        <Crop src={IMG.render} nat={RENDER_NAT} box={box} w={frame.w} h={frame.h} />
        {f < 280 && (
          <svg width={1920} height={1080} style={{position: 'absolute'}}>
            <defs>
              <mask id="s6holes">
                <rect width={1920} height={1080} fill="#fff" />
                {HOLES.map((h, i) => {
                  const p = holeP(h.at);
                  const [x, y, w, hh] = h.box;
                  return <rect key={i} x={x + (w * (1 - p)) / 2} y={y + (hh * (1 - p)) / 2} width={w * p} height={hh * p} rx={24} fill="#000" />;
                })}
              </mask>
            </defs>
            <rect width={1920} height={1080} fill={C.char} opacity={dim} mask="url(#s6holes)" />
            {HOLES.map((h, i) => {
              const p = holeP(h.at);
              const [x, y, w, hh] = h.box;
              return p > 0.01 ? <rect key={i} x={x + (w * (1 - p)) / 2} y={y + (hh * (1 - p)) / 2} width={w * p} height={hh * p} rx={24} fill="none" stroke={C.light} strokeWidth={6} opacity={dim / 0.68} /> : null;
            })}
            {bus > 0 &&
              FLOWS.map((fl, i) => (
                <polyline key={i} points={ptsAttr(fl.pts)} fill="none" stroke={C.light} strokeWidth={7} strokeDasharray="4 18" strokeLinecap="round" opacity={bus * tween(f, [fl.at - 8, fl.at], [0, 1])} />
              ))}
            {bus > 0 && (
              <g opacity={bus}>
                <circle cx={ESP32[0]} cy={ESP32[1]} r={115 + pulse * 30} fill={C.sage} opacity={0.35} />
                <circle cx={ESP32[0]} cy={ESP32[1]} r={72} fill="none" stroke={C.cream} strokeWidth={8 + pulse * 6} />
              </g>
            )}
          </svg>
        )}
        {f < 280 &&
          HOLES.map((h, i) => (
            <Lbl key={i} x={h.label[0]} y={h.label[1]} p={pop(f, h.at + 4) * tween(f, [116, 124], [1, 0])} title={h.title} sub={h.sub} icon={h.icon} />
          ))}
        {f < 280 && <Lbl x={250} y={230} p={pop(f, 128) * tween(f, [256, 266], [1, 0])} title="LilyGo collects every reading" size={34} />}
        {bus > 0 && <svg width={1920} height={1080} style={{position: 'absolute'}}><path d="M520 330 C540 380 560 420 585 470" fill="none" stroke={C.cream} strokeWidth={5} opacity={pop(f, 128) * bus} /></svg>}
        {FLOWS.map((fl, i) => {
          if (f < fl.at || f > fl.at + fl.dur + 8) return null;
          const t = tween(f, [fl.at, fl.at + fl.dur], [0, 1], Easing.inOut(Easing.cubic));
          return (
            <div key={i} style={{transform: `scale(${1 - tween(f, [fl.at + fl.dur, fl.at + fl.dur + 8], [0, 0.7])})`}}>
              <DataPill at={along(fl.pts, t)} icon={fl.icon} opacity={tween(f, [fl.at, fl.at + 6], [0, 1]) * tween(f, [fl.at + fl.dur, fl.at + fl.dur + 8], [1, 0])}>
                {fl.text}
              </DataPill>
            </div>
          );
        })}
      </div>

      {/* 6C */}
      {f >= 300 && (
        <>
          <svg width={1920} height={1080} style={{position: 'absolute'}}>
            <Rings at={[640, 350]} f={f} from={322} to={372} dir={-60} />
            <path d="M690 280 C760 215 820 205 880 215" fill="none" stroke={C.dark} strokeWidth={6} strokeDasharray="4 16" strokeLinecap="round" opacity={tower} />
            <path d="M980 250 C1040 230 1110 250 1170 300" fill="none" stroke={C.dark} strokeWidth={6} strokeDasharray="4 16" strokeLinecap="round" opacity={phoneIn} />
          </svg>
          <svg width={160} height={480} viewBox="0 0 48 144" style={{position: 'absolute', left: 820, top: 200, color: C.dark, opacity: tower, transform: `translateY(${(1 - tower) * 60}px)`}}>
            <g fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
              <path d="M24 20L8 140M24 20l16 120M14 100h20M18 60h12M12 120h24" />
              <circle cx={24} cy={17} r={4} />
              <path d="M15 8a12 12 0 0 0 0 18M33 8a12 12 0 0 1 0 18" />
            </g>
          </svg>
          <Lbl x={90} y={710} p={pop(f, 322)} title="LilyGo SIM" />
          <Lbl x={760} y={710} p={pop(f, 330)} title="Cellular network" />
          {sendPills.map(([text, icon], i) => {
            const a = 332 + i * 8;
            if (f < a || f > a + 40) return null;
            const t = tween(f, [a, a + 36], [0, 1], Easing.inOut(Easing.cubic));
            const at = t < 0.5 ? arcPoint([640, 340], [900, 230], 80, t * 2) : arcPoint([900, 230], [1300, 330], 60, t * 2 - 1);
            return (
              <DataPill key={i} at={at} icon={icon} dark={i === 1} opacity={tween(f, [a + 34, a + 40], [1, 0])}>
                {text}
              </DataPill>
            );
          })}
          <div style={{position: 'absolute', left: 1180 + (1 - phoneIn) * 600, top: 104, width: 520, height: 796, background: C.char, borderRadius: 64, opacity: phoneIn, boxShadow: '0 34px 80px rgba(40,51,45,.35)'}}>
            <div style={{position: 'absolute', left: 16, top: 16, width: 488, height: 764, background: SCREEN, borderRadius: 50, padding: '62px 22px 0', boxSizing: 'border-box', fontFamily, color: INK, overflow: 'hidden'}}>
              <div style={{position: 'absolute', left: '50%', top: 12, width: 120, height: 32, borderRadius: 16, background: C.char, transform: 'translateX(-50%)'}} />
              <div style={{display: 'flex', alignItems: 'flex-end'}}>
                <div>
                  <Lab>Blynk · device</Lab>
                  <div style={{fontSize: 32, fontWeight: 800, letterSpacing: -0.5, marginTop: 6}}>Solar Tracker</div>
                </div>
                <div style={{marginLeft: 'auto', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, fontFamily: mono, fontSize: 14, fontWeight: 800, letterSpacing: '.1em', padding: '6px 12px', borderRadius: 999, ...innerStyle(999)}}>
                  <i style={{width: 9, height: 9, borderRadius: '50%', background: C.sage, boxShadow: '0 0 0 3px rgba(125,157,134,.35)'}} />
                  ONLINE
                </div>
              </div>
              {(() => {
                const tile = (i: number, big = false) => {
                  const [label, value, dec, unit] = TILES[i];
                  const a = 352 + i * 5;
                  const on = tween(f, [a, a + 6], [0, 1]);
                  // Short roll-up so the agreed reading is on screen almost at once; no thousands comma (1014.8 hPa).
                  const shown = f < a ? '—' : countUp(f, [a, a + 8], value, dec).replace(/,/g, '');
                  const ring = interpolate(f, [a + 6, a + 10, a + 22], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
                  return (
                    <div key={label} style={{height: big ? 132 : 108, padding: big ? '18px 20px' : '14px 18px', boxSizing: 'border-box', ...innerStyle(18, ring * 0.6), whiteSpace: 'nowrap', overflow: 'hidden'}}>
                      <Lab style={{fontSize: 13}}>{big ? `${label} · pyranometer` : label}</Lab>
                      <div style={{fontFamily: mono, fontSize: big ? 52 : 32, fontWeight: 800, letterSpacing: -1, marginTop: big ? 12 : 10, opacity: 0.3 + 0.7 * on}}>
                        {shown}
                        <span style={{fontSize: big ? 22 : 15, fontWeight: 500, color: SOFT, marginLeft: 6, letterSpacing: 0}}>{unit}</span>
                      </div>
                    </div>
                  );
                };
                return (
                  <div style={{marginTop: 20, display: 'grid', gap: 12}}>
                    {tile(0, true)}
                    <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12}}>
                      {[1, 4, 5, 6, 2, 3].map((i) => tile(i))}
                    </div>
                    <div style={{height: 64, display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px', ...innerStyle(18), fontSize: 20, fontWeight: 700}}>
                      <Icon name="clock" size={32} color={C.dark} />
                      Time-stamped by RTC
                      <span style={{marginLeft: 'auto', fontFamily: mono, fontSize: 14, color: SOFT, letterSpacing: '.08em'}}>LIVE</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          {[2, 3].map((slot, i) => {
            const a = 370 + i * 6;
            if (f < a || f > a + 20) return null;
            const t = tween(f, [a, a + 18], [0, 1], Easing.inOut(Easing.cubic));
            const at = arcPoint([1440, 560], SLOT_CENTERS[slot], 160, t);
            return (
              <div key={slot} style={{position: 'absolute', left: at[0] - 36, top: at[1] - 36, width: 72, height: 72, borderRadius: 18, background: C.dark, boxShadow: '0 10px 24px rgba(40,51,45,.3), inset 0 1.5px 0 rgba(255,255,255,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Icon name={slot === 2 ? 'sun' : 'therm'} size={44} color="#fff" />
              </div>
            );
          })}
        </>
      )}
    </AbsoluteFill>
  );
};
