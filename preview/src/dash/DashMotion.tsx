import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Watermark} from '../components';
import {C, fontFamily, tween} from '../theme';
import {countUp, pop} from '../full/shared';
import {EDGE, GlassDefs, GlassSheen, HAIR, INK, SOFT, Wall, glassStyle, innerStyle, mono} from '../full/glass';

// Dashboard + energy chart, rebuilt from scratch (no screenshots), in the approved smoked green glass.
// `f` is the local frame so the scene can drop into S7 later; ~210 frames.



// Bars traced from the client's chart image (kWh / year, ±~30).
// The "with shade" value of LONGi X10 485 bif is the client's exact 10,354.
const DATA: [string, number, number, number][] = [
  ['JA 550', 8930, 7190, 5740],
  ['LONGi 550', 8930, 7220, 5770],
  ['JA 540 bif', 9550, 7750, 6330],
  ['LONGi 540 bif', 9550, 7750, 6330],
  ['Jinko 440', 10200, 8310, 6630],
  ['Trina 440', 10200, 8310, 6630],
  ['JA 440 bif', 11200, 9250, 7570],
  ['Jinko 440 bif', 11200, 9250, 7570],
  ['LONGi 580', 9430, 7780, 6180],
  ['LONGi X10 485', 11260, 9430, 7540],
  ['LONGi X10 485 bif', 12240, 10354, 8460],
  ['Aiko 650 bif', 9850, 8310, 6800],
];
const PICK = 10;
const SERIES = [
  {label: 'Capacity (no losses)', fill: 'rgba(53,92,77,.13)', stroke: 'rgba(53,92,77,.5)', start: 44},
  {label: 'With shade (incl. heat)', fill: C.dark, stroke: C.dark, start: 62},
  {label: 'With shade + dust', fill: C.sage, stroke: C.sage, start: 80},
];

const LEFT = {x: 56, y: 110, w: 790, h: 860};
const RIGHT = {x: 876, y: 110, w: 988, h: 860};
const PLOT = {x: 96, y: 170, w: 856, h: 500, max: 14000};
const GW = PLOT.w / DATA.length;
const BW = 17;
const barX = (g: number, s: number) => PLOT.x + g * GW + (GW - 3 * BW - 4) / 2 + s * (BW + 2);
const yOf = (v: number) => PLOT.y + PLOT.h - (v / PLOT.max) * PLOT.h;

const rise = (f: number, at: number) => ({
  opacity: tween(f, [at, at + 12], [0, 1]),
  transform: `translateY(${tween(f, [at, at + 18], [40, 0], Easing.out(Easing.cubic))}px)`,
});

const Lab: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{fontFamily: mono, fontSize: 14, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: SOFT, ...style}}>{children}</div>
);

const Skeleton: React.FC<{f: number; w: number; h?: number}> = ({f, w, h = 18}) => {
  const x = ((f * 14) % (w + 200)) - 200;
  return (
    <div style={{width: w, height: h, borderRadius: 6, background: 'rgba(38,68,56,.08)', overflow: 'hidden', position: 'relative', marginTop: 10}}>
      <div style={{position: 'absolute', top: 0, bottom: 0, left: x, width: 160, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.8),transparent)'}} />
    </div>
  );
};

// A card that sits in "Pending assessment" until `at`, then resolves.
const Card: React.FC<{
  f: number;
  at: number;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  appear: number;
  glow?: number;
  children: React.ReactNode;
}> = ({f, at, x, y, w, h, label, appear, glow = 0, children}) => {
  const done = tween(f, [at, at + 10], [0, 1]);
  const tick = pop(f, at + 4, 30, 12);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        ...innerStyle(20, glow * 0.35),
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.28), inset 0 0 0 1px rgba(255,255,255,${0.12 + 0.45 * glow})${glow > 0 ? `, 0 0 ${40 * glow}px rgba(125,157,134,${0.55 * glow})` : ''}`,
        padding: '22px 26px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        ...rise(f, appear),
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
        <Lab>{label}</Lab>
        <div style={{marginLeft: 'auto', width: 26, height: 26, borderRadius: '50%', background: C.dark, color: '#fff', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${tick})`}}>✓</div>
      </div>
      <div style={{position: 'absolute', left: 26, right: 26, top: 58, opacity: 1 - done}}>
        <div style={{fontSize: 22, fontWeight: 700, color: SOFT}}>Pending assessment</div>
        <Skeleton f={f} w={Math.min(260, w - 60)} />
        <Skeleton f={f + 6} w={Math.min(170, w - 120)} h={14} />
      </div>
      <div style={{position: 'absolute', left: 26, right: 26, top: 56, opacity: done, transform: `translateY(${(1 - done) * 14}px)`}}>{children}</div>
    </div>
  );
};

const Big: React.FC<{v: string; unit: string; size?: number}> = ({v, unit, size = 54}) => (
  <div style={{fontFamily: mono, fontWeight: 800, fontSize: size, color: INK, letterSpacing: -1, whiteSpace: 'nowrap'}}>
    {v}
    <span style={{fontSize: size * 0.4, fontWeight: 500, color: SOFT, marginLeft: 10, letterSpacing: 0}}>{unit}</span>
  </div>
);
const Sub: React.FC<{children: React.ReactNode}> = ({children}) => <div style={{fontSize: 18, color: SOFT, marginTop: 8, whiteSpace: 'nowrap'}}>{children}</div>;

const TABS = ['Overview', 'Live Data', 'Shading', 'Solar Panels', 'Report'];

export const DashScene: React.FC<{f: number}> = ({f}) => {
  // Overview resolves card by card after a scan.
  const scan = tween(f, [26, 62], [0, 1], Easing.inOut(Easing.quad));
  const complete = tween(f, [108, 114], [0, 1]);
  const focus = tween(f, [124, 140], [0, 1]);
  const energyGlow = tween(f, [120, 132], [0, 1]) * tween(f, [176, 196], [1, 0.35]);

  // Value token flies from the energy card to the chart callout.
  const fly = tween(f, [126, 150], [0, 1], Easing.inOut(Easing.cubic));
  const from = [LEFT.x + 461 + 28, LEFT.y + 396 + 82];
  const callout = {x: RIGHT.x + barX(PICK, 0) - 330, y: RIGHT.y + yOf(12240) - 96};
  const to = [callout.x + 24, callout.y + 34];
  const tok = [interpolate(fly, [0, 1], [from[0], to[0]]), interpolate(fly, [0, 1], [from[1], to[1]]) - Math.sin(fly * Math.PI) * 120];

  const g0 = 28;
  const colW = (LEFT.w - 2 * g0 - 20) / 2;

  return (
    <AbsoluteFill style={{fontFamily}}>
      <Wall f={f} />
      {/* ---------- LEFT: overview app ---------- */}
      <div style={{position: 'absolute', left: LEFT.x, top: LEFT.y, width: LEFT.w, height: LEFT.h, ...glassStyle(30), overflow: 'hidden', ...rise(f, 0)}}>
        <div style={{height: 66, display: 'flex', alignItems: 'center', gap: 16, padding: '0 26px', borderBottom: `1.5px solid ${EDGE}`}}>
          <div style={{display: 'flex', gap: 9}}>
            {[C.dark, 'rgba(38,68,56,.2)', 'rgba(38,68,56,.2)'].map((c, i) => (
              <i key={i} style={{width: 14, height: 14, borderRadius: '50%', background: c}} />
            ))}
          </div>
          <div style={{fontSize: 25, fontWeight: 800, letterSpacing: -0.3}}>Solar Placement Assessment</div>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontFamily: mono,
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: '.1em',
              padding: '8px 14px',
              borderRadius: 999,
              background: complete > 0.5 ? C.dark : 'rgba(255,255,255,.55)',
              color: complete > 0.5 ? '#fff' : INK,
              opacity: tween(f, [10, 20], [0, 1]),
            }}
          >
            {complete > 0.5 ? (
              '✓ ASSESSMENT COMPLETE'
            ) : (
              <>
                <span style={{width: 14, height: 14, borderRadius: '50%', border: `3px solid ${C.dark}`, borderRightColor: 'transparent', transform: `rotate(${f * 14}deg)`, boxSizing: 'border-box'}} />
                {f < 26 ? 'PENDING' : 'ANALYSING'}
              </>
            )}
          </div>
        </div>
        {/* tabs */}
        <div style={{position: 'absolute', left: g0, right: g0, top: 82, display: 'flex', gap: 8}}>
          {TABS.map((t, i) => (
            <div
              key={t}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 17,
                fontWeight: 700,
                background: i === 0 ? C.dark : 'rgba(255,255,255,.5)',
                color: i === 0 ? '#fff' : SOFT,
                border: `1.5px solid ${i === 0 ? C.dark : 'rgba(255,255,255,.8)'}`,
                ...rise(f, 8 + i * 3),
              }}
            >
              {t}
            </div>
          ))}
        </div>
        <div style={{position: 'absolute', left: g0, top: 150, ...rise(f, 14)}}>
          <div style={{fontSize: 28, fontWeight: 800, letterSpacing: -0.4}}>Solar assessment overview</div>
          <div style={{fontSize: 17, color: SOFT, marginTop: 6}}>Summary of the rooftop solar assessment</div>
        </div>

        <Card f={f} at={40} appear={16} x={g0} y={226} w={LEFT.w - 2 * g0} h={150} label="Recommended installation location">
          <div style={{fontSize: 34, fontWeight: 800, letterSpacing: -0.5}}>South-facing roof · 25° tilt</div>
          <Sub>
            Portrait orientation · <span style={{fontFamily: mono, color: INK}}>25.23° N, 51.56° E</span>
          </Sub>
        </Card>
        <Card f={f} at={52} appear={19} x={g0} y={396} w={colW} h={200} label="Recommended solar panel">
          <div style={{fontSize: 32, fontWeight: 800, letterSpacing: -0.5, marginTop: 6}}>LONGi Hi-MO X10</div>
          <Sub>485 W bifacial</Sub>
          <Sub>
            <span style={{fontFamily: mono, color: INK}}>10</span> panels · <span style={{fontFamily: mono, color: INK}}>4.85</span> kWp
          </Sub>
        </Card>
        <Card f={f} at={62} appear={22} x={g0 + colW + 20} y={396} w={colW} h={200} label="Annual energy generation" glow={energyGlow}>
          <Big v={countUp(f, [62, 92], 10354)} unit="kWh / yr" />
          <Sub>Estimated</Sub>
        </Card>
        <Card f={f} at={72} appear={25} x={g0} y={616} w={colW} h={200} label="Installation cost">
          <Big v={countUp(f, [72, 100], 23747)} unit="QAR" />
          <Sub>Estimated</Sub>
        </Card>
        <Card f={f} at={82} appear={28} x={g0 + colW + 20} y={616} w={colW} h={200} label="Estimated payback period">
          <Big v={countUp(f, [82, 106], 15.1, 1)} unit="years" />
          <Sub>
            ROI <span style={{fontFamily: mono, color: INK}}>{countUp(f, [86, 108], 93)}%</span> over 30 years
          </Sub>
        </Card>

        {/* analysis scan */}
        {f > 24 && f < 66 && (
          <div style={{position: 'absolute', left: 0, right: 0, top: 210 + scan * 620, height: 4, background: C.sage, boxShadow: '0 0 30px 12px rgba(125,157,134,.35)', opacity: tween(f, [24, 28], [0, 1]) * tween(f, [58, 66], [1, 0])}} />
        )}
        <div style={{position: 'absolute', left: g0, bottom: 20, fontSize: 15, color: SOFT, opacity: complete}}>Estimated results from the Python analysis</div>
        <GlassSheen />
      </div>

      {/* ---------- RIGHT: chart card ---------- */}
      <div style={{position: 'absolute', left: RIGHT.x, top: RIGHT.y, width: RIGHT.w, height: RIGHT.h, ...glassStyle(30), overflow: 'hidden', ...rise(f, 6)}}>
        <div style={{position: 'absolute', left: 40, top: 34, ...rise(f, 12)}}>
          <div style={{fontSize: 30, fontWeight: 800, letterSpacing: -0.5}}>
            Estimated annual energy by panel <span style={{fontWeight: 500, color: SOFT}}>· kWh / year</span>
          </div>
          <div style={{fontSize: 17, color: SOFT, marginTop: 6}}>Capacity vs the energy the panels actually make</div>
        </div>
        {/* legend */}
        <div style={{position: 'absolute', left: 40, top: 118, display: 'flex', gap: 26}}>
          {SERIES.map((s) => {
            const p = pop(f, s.start - 4, 30, 14);
            return (
              <div key={s.label} style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 600, color: INK, opacity: Math.min(1, p * 1.4), transform: `scale(${0.85 + 0.15 * p})`, transformOrigin: 'left center'}}>
                <i style={{width: 18, height: 18, borderRadius: 5, background: s.fill, border: `2px solid ${s.stroke}`, boxSizing: 'border-box'}} />
                {s.label}
              </div>
            );
          })}
        </div>

        <svg width={RIGHT.w} height={RIGHT.h} style={{position: 'absolute', left: 0, top: 0}}>
          {/* grid */}
          {[0, 2000, 4000, 6000, 8000, 10000, 12000, 14000].map((v, i) => {
            const d = tween(f, [20 + i * 2, 40 + i * 2], [0, 1], Easing.out(Easing.cubic));
            return (
              <g key={v}>
                <line x1={PLOT.x} x2={PLOT.x + PLOT.w * d} y1={yOf(v)} y2={yOf(v)} stroke={v === 0 ? 'rgba(38,68,56,.45)' : HAIR} strokeWidth={v === 0 ? 2 : 1.5} />
                <text x={PLOT.x - 14} y={yOf(v) + 5} textAnchor="end" fontFamily={mono} fontSize={14} fill={SOFT} opacity={d}>
                  {v === 0 ? '0' : `${v / 1000}k`}
                </text>
              </g>
            );
          })}
          {/* bars */}
          {DATA.map(([name, ...vals], g) => {
            const dim = g === PICK ? 1 : interpolate(focus, [0, 1], [1, 0.26]);
            return (
              <g key={name} opacity={dim}>
                {vals.map((v, s) => {
                  const start = SERIES[s].start + g * 2;
                  const k = tween(f, [start, start + 18], [0, 1], Easing.out(Easing.cubic));
                  const h = (v / PLOT.max) * PLOT.h * k;
                  return <rect key={s} x={barX(g, s)} y={PLOT.y + PLOT.h - h} width={BW} height={Math.max(0, h)} rx={3} fill={SERIES[s].fill} stroke={SERIES[s].stroke} strokeWidth={s === 0 ? 1.5 : 0} />;
                })}
                <text
                  x={barX(g, 2) + BW}
                  y={PLOT.y + PLOT.h + 26}
                  textAnchor="end"
                  fontSize={15}
                  fontWeight={g === PICK ? 800 : 600}
                  fill={g === PICK && focus > 0.5 ? INK : SOFT}
                  transform={`rotate(-32 ${barX(g, 2) + BW} ${PLOT.y + PLOT.h + 26})`}
                  opacity={tween(f, [30 + g * 2, 42 + g * 2], [0, 1])}
                >
                  {name}
                </text>
              </g>
            );
          })}
          {/* highlight frame on the recommended panel */}
          {focus > 0 && (
            <rect
              x={barX(PICK, 0) - 9}
              y={yOf(12240) - 12}
              width={3 * BW + 4 + 18}
              height={PLOT.y + PLOT.h - yOf(12240) + 12}
              rx={10}
              fill="rgba(53,92,77,.06)"
              stroke={C.dark}
              strokeWidth={2.5}
              strokeDasharray={1400}
              strokeDashoffset={1400 * (1 - focus)}
            />
          )}
          {/* leader from callout to the "with shade" bar */}
          {fly >= 1 && (
            <path
              d={`M ${callout.x - RIGHT.x + 300} ${callout.y - RIGHT.y + 34} L ${barX(PICK, 1) + BW / 2} ${callout.y - RIGHT.y + 34} L ${barX(PICK, 1) + BW / 2} ${yOf(10354)}`}
              fill="none"
              stroke={C.dark}
              strokeWidth={2}
              strokeDasharray={600}
              strokeDashoffset={600 * (1 - tween(f, [150, 164], [0, 1]))}
            />
          )}
        </svg>
        <div style={{position: 'absolute', left: 40, bottom: 30, fontSize: 15, color: SOFT, opacity: tween(f, [120, 130], [0, 1])}}>
          Recommended panel highlighted · values are estimates
        </div>
        <GlassSheen />
      </div>

      {/* callout box (absolute so the token can land in it) */}
      {fly > 0 && (
        <div
          style={{
            position: 'absolute',
            left: callout.x,
            top: callout.y,
            width: 300,
            height: 68,
            ...glassStyle(16, 0.3),
            background: 'linear-gradient(140deg,rgba(255,255,255,.9),rgba(238,243,239,.82))',
            boxShadow: 'inset 0 1.5px 0 #fff, inset 0 0 0 1.5px rgba(53,92,77,.35), 0 10px 30px rgba(40,51,45,.2)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 18px',
            boxSizing: 'border-box',
            color: INK,
            opacity: tween(f, [140, 150], [0, 1]),
          }}
        >
          <div style={{fontFamily: mono, fontSize: 30, fontWeight: 800}}>10,354</div>
          <div style={{marginLeft: 12, fontSize: 14, lineHeight: 1.25, color: SOFT}}>
            kWh / yr
            <br />
            <b style={{color: C.dark}}>LONGi X10 485 bif</b>
          </div>
        </div>
      )}
      {fly > 0 && fly < 1 && (
        <div style={{position: 'absolute', left: tok[0], top: tok[1], transform: 'translate(-10%,-50%)', fontFamily: mono, fontSize: 30, fontWeight: 800, color: '#fff', background: C.dark, borderRadius: 12, padding: '6px 14px', boxShadow: '0 12px 30px rgba(40,51,45,.35)', opacity: tween(fly, [0.8, 1], [1, 0])}}>
          10,354
        </div>
      )}
    </AbsoluteFill>
  );
};

export const DashMotion: React.FC<{watermark: string}> = ({watermark}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <GlassDefs />
      <DashScene f={f} />
      {watermark ? <Watermark text={watermark} top /> : null}
    </AbsoluteFill>
  );
};
