import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate} from 'remotion';
import {Crop} from '../components';
import {C, fontFamily, tween} from '../theme';
import {IMG, Icon, Pt, RENDER_FULL, RENDER_NAT, SLOT_CENTERS, arcPoint, countUp, pop} from './shared';

// Section 7 (local 0 = global 1800): the collected data merges in the assessment software,
// opens into the dashboard and report, then pulls back to the device beside the result.

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

// LONGi X10 485 bifacial bars in the chart image, in screen coordinates.
const PICK = {x: 1644, y: 275, w: 84, h: 222};

const CardBody: React.FC<{i: number}> = ({i}) => {
  const head = (t: string) => <div style={{fontSize: 26, color: '#5E6E64', fontWeight: 600}}>{t}</div>;
  if (i === 0)
    return (
      <>
        <Icon name="pin" size={56} />
        <div style={{marginTop: 6}}>{head('Location')}</div>
        <div style={{fontSize: 36, fontWeight: 800}}>25.23° N, 51.56° E</div>
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
      <Icon name={i === 2 ? 'sun' : 'therm'} size={80} color={C.sage} />
      <div>
        <div style={{fontSize: 34, fontWeight: 800}}>{i === 2 ? 'Irradiance' : 'Environment'}</div>
        {i === 2 ? (
          <>
            <div style={{fontSize: 30, fontWeight: 800, color: C.dark}}>25.00 W/m²</div>
            <div style={{fontSize: 22, color: '#5E6E64', fontWeight: 600}}>pyranometer</div>
          </>
        ) : (
          <div style={{fontSize: 22, color: '#5E6E64', fontWeight: 600, lineHeight: 1.4, whiteSpace: 'nowrap'}}>
            50.47 °C · 21.4 % · 1014.8 hPa
            <br />
            3.6 m/s wind · 27.41 / 30.48 °C thermal
          </div>
        )}
      </div>
    </div>
  );
};

const ReportCard: React.FC<{x: number; w: number; p: number; title: string; children: React.ReactNode}> = ({x, w, p, title, children}) =>
  p <= 0.01 ? null : (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: 730,
        width: w,
        height: 250,
        padding: '24px 28px',
        background: '#fff',
        borderRadius: 28,
        boxShadow: '0 14px 40px rgba(40,51,45,.16)',
        color: C.dark,
        opacity: Math.min(1, p * 1.4),
        transform: `translateY(${(1 - p) * 90}px)`,
      }}
    >
      <div style={{fontSize: 26, fontWeight: 600, color: '#5E6E64'}}>{title}</div>
      {children}
    </div>
  );

export const S7Final: React.FC<{f: number}> = ({f}) => {
  // ---- 7A: tokens → cards → core
  const core = pop(f, 30, 30, 12) * tween(f, [126, 132], [1, 0]);
  const links = pop(f, 56, 30, 16) * tween(f, [112, 122], [1, 0]);
  const burst = tween(f, [124, 148], [0, 1], Easing.in(Easing.cubic));
  const arrive = Math.max(...[0, 1, 2, 3].map((i) => interpolate(f, [84 + i * 5, 88 + i * 5, 100 + i * 5], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})));

  // ---- 7B: dashboard + report
  const dash = tween(f, [140, 164], [0, 1], Easing.out(Easing.cubic));
  const chartIn = tween(f, [158, 178], [0, 1], Easing.out(Easing.cubic));
  const bars = tween(f, [178, 232], [0, 1], Easing.inOut(Easing.quad));
  const pick = pop(f, 236);
  const pickPulse = f > 236 ? 0.5 + 0.5 * Math.sin((f - 236) / 5) : 0;

  // ---- 7C: pull back
  const back = tween(f, [330, 362], [0, 1], Easing.inOut(Easing.cubic));
  const sc = 1 - (1 - 770 / 1920) * back;
  const deviceCard = tween(f, [345, 372], [0, 1], Easing.out(Easing.cubic));
  const link = tween(f, [368, 382], [0, 1]);
  const title = tween(f, [380, 400], [0, 1]);

  return (
    <AbsoluteFill style={{background: C.cream, opacity: tween(f, [0, 10], [0, 1])}}>
      <AbsoluteFill style={{background: C.dark, opacity: back}} />

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
          boxShadow: back > 0 ? '0 30px 80px rgba(0,0,0,.35)' : undefined,
          background: C.cream,
          fontFamily,
        }}
      >
        {/* 7A */}
        {f < 150 && (
          <>
            <svg width={1920} height={1080} style={{position: 'absolute'}}>
              {links > 0 &&
                LINKS.map((l, i) => (
                  <path key={i} d={`M${l[0][0]} ${l[0][1]} C${l[1][0]} ${l[1][1]} ${l[2][0]} ${l[2][1]} ${l[3][0]} ${l[3][1]}`} fill="none" stroke={C.sage} strokeWidth={7} strokeDasharray="4 18" strokeLinecap="round" opacity={links} />
                ))}
              {f > 60 &&
                f < 112 &&
                LINKS.flatMap((l, i) =>
                  [0, 1, 2].map((k) => {
                    const t = (f - 60 - i * 5 - k * 8) / 24;
                    if (t < 0 || t > 1) return null;
                    const [x, y] = bez(l, t);
                    return <circle key={`${i}-${k}`} cx={x} cy={y} r={11} fill={C.dark} />;
                  }),
                )}
              {burst > 0 && <circle cx={CORE[0]} cy={CORE[1]} r={140 + burst * 2200} fill={C.light} />}
              {core > 0.01 && (
                <g transform={`translate(${CORE[0]} ${CORE[1]}) scale(${core * (1 + arrive * 0.08)})`}>
                  <circle r={190} fill={C.light} opacity={0.7} />
                  <circle r={140} fill={C.dark} />
                  <circle r={230} fill="none" stroke={C.sage} strokeWidth={5} strokeDasharray="10 16" transform={`rotate(${f * 1.5})`} />
                </g>
              )}
            </svg>
            {core > 0.01 && <Icon name="sun" size={120} color={C.cream} style={{position: 'absolute', left: CORE[0] - 60, top: CORE[1] - 60, transform: `scale(${core}) rotate(${f * 2}deg)`}} />}
            {core > 0.01 && (
              <div style={{position: 'absolute', left: 780, top: 800, background: '#fff', color: C.dark, fontSize: 32, fontWeight: 700, padding: '12px 22px', borderRadius: 16, boxShadow: '0 8px 24px rgba(40,51,45,.22)', opacity: pop(f, 50) * core}}>
                Assessment software
              </div>
            )}
            {CARDS.map((c, i) => {
              const fly = tween(f, [4 + i * 5, 40 + i * 5], [0, 1], Easing.inOut(Easing.cubic));
              const open = pop(f, 38 + i * 5, 30, 14);
              const into = tween(f, [110 + i * 3, 126], [0, 1], Easing.in(Easing.cubic));
              const center: Pt = [c.x + c.w / 2, c.y + c.h / 2];
              const p0 = arcPoint(SLOT_CENTERS[i], center, 180, fly);
              const at: Pt = [p0[0] + (CORE[0] - p0[0]) * into, p0[1] + (CORE[1] - p0[1]) * into];
              if (open < 0.05)
                return (
                  <div key={i} style={{position: 'absolute', left: at[0] - 50, top: at[1] - 50, width: 100, height: 100, borderRadius: 22, background: C.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px rgba(40,51,45,.3)'}}>
                    <Icon name={c.icon} size={56} color={C.cream} />
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
                    background: '#fff',
                    borderRadius: 28,
                    boxShadow: '0 14px 40px rgba(40,51,45,.16)',
                    color: C.dark,
                    transform: `scale(${(0.3 + 0.7 * open) * (1 - into)})`,
                    opacity: Math.min(1, open * 2) * (1 - into),
                  }}
                >
                  <CardBody i={i} />
                </div>
              );
            })}
          </>
        )}

        {/* 7B */}
        {f >= 124 && (
          <AbsoluteFill style={{background: C.light, opacity: f < 148 ? burst : 1}}>
            <div style={{position: 'absolute', left: 60, top: 150, width: 780, height: 540, background: '#fff', borderRadius: 22, overflow: 'hidden', boxShadow: '0 18px 50px rgba(40,51,45,.22)', transform: `scale(${0.2 + 0.8 * dash})`, transformOrigin: '900px 390px', opacity: dash}}>
              <div style={{height: 60, background: C.light, display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px', fontSize: 28, fontWeight: 600, color: C.dark}}>
                <i style={{width: 18, height: 18, borderRadius: '50%', background: C.sage}} />
                <i style={{width: 18, height: 18, borderRadius: '50%', background: '#C9D6CC'}} />
                <i style={{width: 18, height: 18, borderRadius: '50%', background: '#C9D6CC'}} />
                <span style={{marginLeft: 20}}>Solar Placement Assessment</span>
              </div>
              <div style={{position: 'absolute', left: 0, top: 60, width: 780, height: 480, overflow: 'hidden'}}>
                <Crop src={IMG.dashboard} nat={[800, 480]} box={[40, 30, 760, 440]} w={780} h={480} />
              </div>
            </div>
            <div style={{position: 'absolute', left: 880, top: 150, width: 980, height: 540, padding: '26px 30px', background: '#fff', borderRadius: 28, boxShadow: '0 14px 40px rgba(40,51,45,.16)', color: C.dark, opacity: chartIn, transform: `translateX(${(1 - chartIn) * 300}px)`}}>
              <div style={{fontSize: 30, fontWeight: 800}}>
                Estimated annual energy by panel <span style={{fontWeight: 500, color: '#5E6E64'}}>· kWh / year</span>
              </div>
              <Img src={IMG.chart} style={{position: 'absolute', left: 20, top: 90, width: 940, clipPath: `inset(${(1 - bars) * 100}% 0 0 0)`}} />
              <div style={{position: 'absolute', left: 30, top: 415, right: 30, fontSize: 28, fontWeight: 600, color: '#5E6E64', lineHeight: 1.35, opacity: pick}}>
                Recommended: <b style={{color: C.dark}}>LONGi X10 485 bifacial · {countUp(f, [240, 272], 10354)} kWh / year</b>
              </div>
            </div>
            {pick > 0.01 && (
              <div style={{position: 'absolute', left: PICK.x, top: PICK.y, width: PICK.w, height: PICK.h, border: `5px solid ${C.dark}`, borderRadius: 12, boxShadow: `0 0 0 ${6 + pickPulse * 8}px rgba(125,157,134,.45)`, opacity: Math.min(1, pick * 1.5), transform: `translateX(${(1 - chartIn) * 300}px) scale(${0.8 + 0.2 * pick})`}} />
            )}
            <ReportCard x={60} w={560} p={pop(f, 252)} title="Recommended panel & placement">
              <div style={{fontSize: 30, fontWeight: 800, marginTop: 10}}>LONGi Hi-MO X10 · 485 W bifacial</div>
              <div style={{fontSize: 25, color: '#5E6E64', marginTop: 8, lineHeight: 1.35}}>
                10 panels · 4.85 kWp
                <br />
                South-facing · 25° tilt · portrait
              </div>
            </ReportCard>
            <ReportCard x={650} w={580} p={pop(f, 262)} title="Shading & dust losses">
              <svg width={500} height={150} style={{position: 'absolute', left: 40, top: 86}}>
                {[
                  [0, 10, '#C6DBEF'],
                  [100, 38, '#6BAED6'],
                  [200, 62, '#08519C'],
                ].map(([x, y, fill], i) => {
                  const g = tween(f, [270 + i * 6, 286 + i * 6], [0, 1], Easing.out(Easing.cubic));
                  const top = 140 - (140 - (y as number)) * g;
                  return <rect key={i} x={x as number} y={top} width={80} height={140 - top} fill={fill as string} />;
                })}
                <g opacity={tween(f, [290, 300], [0, 1])}>
                  <path d="M300 10v28M300 38v24" stroke="#C0392B" strokeWidth={5} />
                  <text x={318} y={34} fontSize={24} fontWeight={700} fill={C.dark} fontFamily={fontFamily}>
                    − shade
                  </text>
                  <text x={318} y={66} fontSize={24} fontWeight={700} fill={C.dark} fontFamily={fontFamily}>
                    − dust
                  </text>
                </g>
              </svg>
            </ReportCard>
            <ReportCard x={1260} w={600} p={pop(f, 272)} title="Cost · payback · ROI">
              <div style={{display: 'flex', gap: 30, marginTop: 16}}>
                {[
                  [countUp(f, [280, 312], 23747), 'QAR installed'],
                  [countUp(f, [286, 312], 15.1, 1), 'years payback'],
                  [`${countUp(f, [292, 312], 93)} %`, 'ROI · 30 years'],
                ].map(([v, l]) => (
                  <div key={l}>
                    <div style={{fontSize: 42, fontWeight: 800}}>{v}</div>
                    <div style={{fontSize: 22, color: '#5E6E64'}}>{l}</div>
                  </div>
                ))}
              </div>
            </ReportCard>
            <div style={{position: 'absolute', left: 60, top: 1000, fontSize: 22, fontWeight: 600, color: '#5E6E64', opacity: tween(f, [300, 312], [0, 1])}}>Estimated results from your Python analysis</div>
          </AbsoluteFill>
        )}
      </div>

      {/* 7C */}
      {deviceCard > 0 && (
        <div style={{position: 'absolute', left: 120 - (1 - deviceCard) * 900, top: 250, width: 760, height: 428, borderRadius: 22, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.35)'}}>
          <Crop src={IMG.render} nat={RENDER_NAT} box={RENDER_FULL} w={760} h={428} />
        </div>
      )}
      {link > 0 && (
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <path d={`M900 464 H${900 + 110 * link}`} stroke={C.light} strokeWidth={7} strokeDasharray="4 16" strokeLinecap="round" />
        </svg>
      )}
      {title > 0 && (
        <div style={{position: 'absolute', left: 120, right: 120, top: 770, textAlign: 'center', color: C.cream, fontFamily, opacity: title, transform: `translateY(${(1 - title) * 30}px)`}}>
          <div style={{fontSize: 46, fontWeight: 800, letterSpacing: -0.5}}>IoT-Based Residential Rooftop Solar Panel Placement Assessment</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
