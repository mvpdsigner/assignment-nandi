import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Crop} from '../components';
import {C, fontFamily, tween} from '../theme';
import {DashScene} from '../dash/DashMotion';
import {GlassSheen, INK, Lab, SOFT, glassStyle, mono} from './glass';
import {IMG, Icon, Pt, RENDER_FULL, RENDER_NAT, SLOT_CENTERS, arcPoint, pop} from './shared';

// Section 7 (local 0 = global T.s7): the collected data merges in the assessment software,
// opens into the glass dashboard (DashScene), then pulls back to the device beside the result.

const CORE: Pt = [960, 540];
const CARDS = [
  {x: 150, y: 170, w: 480, h: 220, icon: 'pin' as const},
  {x: 1330, y: 120, w: 440, h: 330, icon: 'grid' as const},
  {x: 150, y: 700, w: 480, h: 190, icon: 'sun' as const},
  {x: 1230, y: 700, w: 580, h: 190, icon: 'therm' as const},
];
// Curves from each card to the core (cubic Bézier control points).
const LINKS: [Pt, Pt, Pt, Pt][] = [
  [[620, 300], [760, 340], [820, 420], [860, 470]],
  [[1340, 300], [1180, 340], [1110, 420], [1060, 470]],
  [[620, 790], [760, 740], [820, 660], [860, 610]],
  [[1240, 790], [1150, 740], [1100, 660], [1060, 610]],
];
const bez = ([a, b, c, d]: [Pt, Pt, Pt, Pt], t: number): Pt => {
  const u = 1 - t;
  return [0, 1].map((i) => u * u * u * a[i] + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * d[i]) as Pt;
};


const CardBody: React.FC<{i: number}> = ({i}) => {
  const head = (t: string) => <Lab style={{fontSize: 15}}>{t}</Lab>;
  if (i === 0)
    return (
      <>
        <Icon name="pin" size={52} color={C.dark} />
        <div style={{marginTop: 6}}>{head('Location')}</div>
        <div style={{fontFamily: mono, fontSize: 34, fontWeight: 800, marginTop: 6, whiteSpace: 'nowrap'}}>25.23° N, 51.56° E</div>
      </>
    );
  if (i === 1)
    return (
      <>
        <div style={{width: 408, height: 240, borderRadius: 12, overflow: 'hidden', position: 'relative'}}>
          <Crop src={IMG.stage3} nat={[1486, 1113]} box={[10, 3, 1466, 1100]} w={408} h={240} />
        </div>
        <div style={{fontSize: 30, fontWeight: 800, marginTop: 12}}>Shaded areas detected</div>
      </>
    );
  return (
    <div style={{display: 'flex', gap: 22, alignItems: 'center', height: '100%'}}>
      <Icon name={i === 2 ? 'sun' : 'therm'} size={74} color={C.dark} />
      <div>
        <div style={{fontSize: 34, fontWeight: 800}}>{i === 2 ? 'Irradiance' : 'Environment'}</div>
        {i === 2 ? (
          <>
            <div style={{fontFamily: mono, fontSize: 30, fontWeight: 800}}>25.00 W/m²</div>
            <Lab>pyranometer</Lab>
          </>
        ) : (
          <div style={{fontFamily: mono, fontSize: 19, color: SOFT, fontWeight: 700, lineHeight: 1.5, whiteSpace: 'nowrap'}}>
            50.47 °C · 21.4 % · 1014.8 hPa
            <br />
            3.6 m/s wind · 27.41 / 30.48 °C thermal
          </div>
        )}
      </div>
    </div>
  );
};

export const S7Final: React.FC<{f: number}> = ({f}) => {
  // ---- 7A: tokens → cards → core (first-draft motion, played 25% faster)
  const a = (f * 148) / 118;
  const core = pop(a, 30, 30, 12) * tween(a, [126, 132], [1, 0]);
  const links = pop(a, 56, 30, 16) * tween(a, [112, 122], [1, 0]);
  const burst = tween(a, [124, 148], [0, 1], Easing.in(Easing.cubic));
  const arrive = Math.max(...[0, 1, 2, 3].map((i) => interpolate(a, [84 + i * 5, 88 + i * 5, 100 + i * 5], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})));

  // ---- 7B: the glass dashboard + chart
  const D0 = 112;

  // ---- 7C: pull back
  const back = tween(f, [298, 330], [0, 1], Easing.inOut(Easing.cubic));
  const sc = 1 - (1 - 770 / 1920) * back;
  const deviceCard = tween(f, [313, 340], [0, 1], Easing.out(Easing.cubic));
  const link = tween(f, [336, 350], [0, 1]);
  const title = tween(f, [348, 368], [0, 1]);

  return (
    <AbsoluteFill style={{background: C.cream, opacity: tween(f, [0, 10], [0, 1])}}>
      <AbsoluteFill style={{background: 'linear-gradient(160deg, #EEF3EF, #D5E2D8)', opacity: back}} />

      {/* everything up to 7B lives in this layer, which shrinks into the report card for 7C */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          transformOrigin: '0 0',
          transform: `translate(${1030 * back}px, ${250 * back}px) scale(${sc})`,
          borderRadius: 50 * back,
          overflow: 'hidden',
          boxShadow: back > 0 ? '0 30px 80px rgba(40,51,45,.28)' : undefined,
          background: `radial-gradient(1200px 800px at 50% 45%, ${C.cream}, ${C.light})`,
          fontFamily,
        }}
      >
        {/* 7A */}
        {a < 150 && (
          <>
            <svg width={1920} height={1080} style={{position: 'absolute'}}>
              {links > 0 &&
                LINKS.map((l, i) => (
                  <path key={i} d={`M${l[0][0]} ${l[0][1]} C${l[1][0]} ${l[1][1]} ${l[2][0]} ${l[2][1]} ${l[3][0]} ${l[3][1]}`} fill="none" stroke={C.sage} strokeWidth={7} strokeDasharray="4 18" strokeLinecap="round" opacity={links} />
                ))}
              {a > 60 &&
                a < 112 &&
                LINKS.flatMap((l, i) =>
                  [0, 1, 2].map((k) => {
                    const t = (a - 60 - i * 5 - k * 8) / 24;
                    if (t < 0 || t > 1) return null;
                    const [x, y] = bez(l, t);
                    return <circle key={`${i}-${k}`} cx={x} cy={y} r={11} fill={C.dark} />;
                  }),
                )}
              {core > 0.01 && (
                <g transform={`translate(${CORE[0]} ${CORE[1]}) scale(${core * (1 + arrive * 0.08)})`}>
                  <circle r={190} fill={C.light} opacity={0.7} />
                  <circle r={140} fill={C.dark} />
                  <circle r={230} fill="none" stroke={C.sage} strokeWidth={5} strokeDasharray="10 16" transform={`rotate(${a * 1.5})`} />
                </g>
              )}
            </svg>
            {core > 0.01 && <Icon name="sun" size={120} color={C.cream} style={{position: 'absolute', left: CORE[0] - 60, top: CORE[1] - 60, transform: `scale(${core}) rotate(${a * 2}deg)`}} />}
            {core > 0.01 && (
              <div style={{position: 'absolute', left: 780, top: 800, ...glassStyle(16, 0.22), fontSize: 30, fontWeight: 700, padding: '12px 24px', opacity: pop(a, 50) * core}}>
                Assessment software
                <GlassSheen />
              </div>
            )}
            {CARDS.map((c, i) => {
              const fly = tween(a, [4 + i * 5, 40 + i * 5], [0, 1], Easing.inOut(Easing.cubic));
              const open = pop(a, 38 + i * 5, 30, 14);
              const into = tween(a, [110 + i * 3, 126], [0, 1], Easing.in(Easing.cubic));
              const center: Pt = [c.x + c.w / 2, c.y + c.h / 2];
              const p0 = arcPoint(SLOT_CENTERS[i], center, 180, fly);
              const at: Pt = [p0[0] + (CORE[0] - p0[0]) * into, p0[1] + (CORE[1] - p0[1]) * into];
              if (open < 0.05)
                return (
                  <div key={i} style={{position: 'absolute', left: at[0] - 50, top: at[1] - 50, width: 100, height: 100, borderRadius: 22, background: C.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px rgba(40,51,45,.3), inset 0 1.5px 0 rgba(255,255,255,.45)'}}>
                    <Icon name={c.icon} size={56} color="#fff" />
                  </div>
                );
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: at[0] - c.w / 2,
                    top: at[1] - c.h / 2,
                    width: c.w,
                    height: c.h,
                    padding: i === 1 ? 16 : 30,
                    boxSizing: 'border-box',
                    ...glassStyle(28, 0.25),
                    transform: `scale(${(0.3 + 0.7 * open) * (1 - into)})`,
                    opacity: Math.min(1, open * 2) * (1 - into),
                  }}
                >
                  <CardBody i={i} />
                  <GlassSheen />
                </div>
              );
            })}
            {burst > 0 && (
              <svg width={1920} height={1080} style={{position: 'absolute'}}>
                <circle cx={CORE[0]} cy={CORE[1]} r={140 + burst * 2200} fill="#EEF3EF" />
              </svg>
            )}
          </>
        )}

        {/* 7B */}
        {f >= D0 - 14 && (
          <AbsoluteFill style={{opacity: tween(f, [D0 - 14, D0], [0, 1])}}>
            <DashScene f={f - D0} />
          </AbsoluteFill>
        )}
      </div>

      {/* 7C */}
      {deviceCard > 0 && (
        <div style={{position: 'absolute', left: 120 - (1 - deviceCard) * 900, top: 250, width: 760, height: 428, borderRadius: 22, overflow: 'hidden', boxShadow: '0 30px 80px rgba(40,51,45,.28)'}}>
          <Crop src={IMG.render} nat={RENDER_NAT} box={RENDER_FULL} w={760} h={428} />
        </div>
      )}
      {link > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <path d={`M900 464 H${900 + 110 * link}`} stroke={C.dark} strokeWidth={7} strokeDasharray="4 16" strokeLinecap="round" />
        </svg>
      )}
      {title > 0 && (
        <div style={{position: 'absolute', left: 120, right: 120, top: 770, textAlign: 'center', color: INK, fontFamily, opacity: title, transform: `translateY(${(1 - title) * 30}px)`}}>
          <div style={{fontFamily: mono, fontSize: 22, fontWeight: 700, letterSpacing: '.2em', color: C.sage}}>IOT-BASED RESIDENTIAL</div>
          <div style={{fontSize: 46, fontWeight: 800, letterSpacing: -0.5, marginTop: 10}}>Rooftop Solar Panel Placement Assessment</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
