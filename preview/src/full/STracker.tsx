import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Crop} from '../components';
import {Box, C, fontFamily, tween} from '../theme';
import {Glass, GlassSheen, INK, Lab, SOFT, glassStyle, innerStyle, mono} from './glass';
import {IMG, Icon, Lbl, Pt, RENDER_NAT, Rings, pop, whip} from './shared';

// Sun tracker cycle (client feedback, second draft). Local 0 = global T.trk, ~160 frames.
// Steps are word for word from the client's "Tracker cycle" screenshot:
// Sun tracking → Every 15 min: tilt to 25° → Measure irradiance → Return to sun tracking.

// Zoom on the real tracker head: source box → screen = ((x - 553) * 3, y * 3).
const BOX: Box = [553, 0, 640, 360];
const DOME: Pt = [636, 360];
const SUN_R = 520;

const STEPS: {text: React.ReactNode; from: number; to: number}[] = [
  {text: 'Sun tracking', from: 14, to: 58},
  {
    text: (
      <>
        Every 15 min:
        <br />
        tilt to 25°
      </>
    ),
    from: 58,
    to: 88,
  },
  {text: 'Measure irradiance', from: 88, to: 118},
  {
    text: (
      <>
        Return to
        <br />
        sun tracking
      </>
    ),
    from: 118,
    to: 144,
  },
];

// Sun elevation (deg) over the scene: it keeps moving the whole time.
const sunAt = (f: number) => interpolate(f, [0, 160], [35, 22], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// Direction the sensor head faces (elevation of its normal, deg): follows the sun, holds 65° (= 25° tilt), then returns.
const headAt = (f: number) => {
  const sun = sunAt(f);
  const toFixed = tween(f, [60, 78], [0, 1], Easing.inOut(Easing.cubic));
  const back = tween(f, [120, 138], [0, 1], Easing.inOut(Easing.cubic));
  const fixed = 65;
  return sun + (fixed - sun) * toFixed * (1 - back);
};

const polar = (o: Pt, deg: number, r: number): Pt => [o[0] + r * Math.cos((deg * Math.PI) / 180), o[1] - r * Math.sin((deg * Math.PI) / 180)];

export const STracker: React.FC<{f: number}> = ({f}) => {
  const sunDeg = sunAt(f);
  const head = headAt(f);
  const tilt = 90 - head;
  const sun = polar(DOME, sunDeg, SUN_R);
  const aimEnd = polar(DOME, head, SUN_R - 70);
  const onSun = Math.abs(head - sunDeg) < 1.5;

  const step = STEPS.findIndex((s) => f >= s.from && f < s.to);
  const loopBack = tween(f, [132, 146], [0, 1], Easing.inOut(Easing.cubic));
  const relight = f >= 144 ? pop(f, 144, 30, 14) : 0;

  const stripIn = tween(f, [4, 18], [0, 1], Easing.out(Easing.cubic));
  const gaugeIn = tween(f, [8, 24], [0, 1], Easing.out(Easing.cubic));
  const sunIn = pop(f, 8, 30, 14);
  const clock = tween(f, [16, 56], [0, 1], Easing.linear) * tween(f, [120, 128], [1, 0]);
  const fixedTag = pop(f, 74, 30, 12) * tween(f, [120, 128], [1, 0]);
  const measuring = tween(f, [88, 94], [0, 1]) * tween(f, [116, 122], [1, 0]);

  const status = f < 58 || f >= 138 ? 'Tracking sun' : f < 88 ? 'Tilting to 25°' : f < 118 ? 'Measuring' : 'Returning';

  const inStyle = f < 10 ? whip(f, 0, -1, 'in') : {};
  const outStyle = f >= 140 ? whip(f, 150, -1, 'out') : {};

  // Side-view schematic in the gauge card.
  const P: Pt = [210, 215];
  const half = 120;
  const plateDir = head - 90; // the plate is perpendicular to the direction it faces
  const pA = polar(P, plateDir, half);
  const pB = polar(P, plateDir + 180, half);
  const domeAt = polar(P, head, 20);
  const miniSun = polar(P, sunDeg, 190);
  const arcEnd = polar(P, -tilt, 92);

  return (
    <AbsoluteFill style={{background: C.light, ...inStyle, ...outStyle}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${1 + tween(f, [0, 160], [0, 0.03], Easing.linear)})`, transformOrigin: '636px 420px'}}>
        <Crop src={IMG.render} nat={RENDER_NAT} box={BOX} w={1920} h={1080} />
      </div>
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(40,51,45,0) 40%, rgba(40,51,45,.18))'}} />

      {/* sun, the facing direction of the head, and the reading pulse */}
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <line x1={DOME[0]} y1={DOME[1]} x2={aimEnd[0]} y2={aimEnd[1]} stroke={C.dark} strokeWidth={6} strokeDasharray="3 15" strokeLinecap="round" opacity={0.85 * sunIn} />
        <circle cx={DOME[0]} cy={DOME[1]} r={12} fill={C.sage} stroke={C.cream} strokeWidth={4} opacity={sunIn} />
        {f >= 62 && f < 136 && (
          <g opacity={tween(f, [62, 72], [0, 1]) * tween(f, [124, 134], [1, 0])}>
            <path d={`M${DOME[0]} ${DOME[1]} L${polar(DOME, sunDeg, 200)[0]} ${polar(DOME, sunDeg, 200)[1]}`} stroke={C.dark} strokeWidth={3} strokeDasharray="2 10" opacity={0.5} />
          </g>
        )}
        <Rings at={DOME} f={f} from={90} to={116} dir={-90} r={170} color={C.dark} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: sun[0] - 52,
          top: sun[1] - 52,
          width: 104,
          height: 104,
          ...glassStyle(999, 0.25),
          background: 'linear-gradient(140deg,rgba(125,157,134,.9),rgba(53,92,77,.82))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${sunIn})`,
          boxShadow: `0 0 0 ${10 + 6 * Math.sin(f / 6)}px rgba(248,247,242,.35), 0 18px 40px rgba(40,51,45,.3)`,
        }}
      >
        <Icon name="sun" size={66} color={C.cream} style={{transform: `rotate(${f * 1.5}deg)`}} />
      </div>
      {onSun && f > 20 && (
        <div style={{position: 'absolute', left: sun[0] + 64, top: sun[1] - 18, fontFamily: mono, fontSize: 18, fontWeight: 800, letterSpacing: '.1em', color: C.dark, opacity: tween(f, [20, 30], [0, 1]) * (f < 58 ? tween(f, [52, 58], [1, 0]) : tween(f, [138, 144], [0, 1]))}}>
          LOCKED ON SUN
        </div>
      )}

      <Lbl x={110} y={232} p={pop(f, 10, 30, 14) * tween(f, [80, 88], [1, 0])} title="Sun tracker" sub="sensor head · pyranometer" />
      <Lbl x={110} y={232} p={pop(f, 90, 30, 14) * tween(f, [118, 126], [1, 0])} title="Pyranometer" sub="measuring irradiance" icon="sun" />

      {/* gauge: side view of the head */}
      <Glass r={30} style={{left: 1250, top: 150, width: 620, height: 560, opacity: gaugeIn, transform: `translateX(${(1 - gaugeIn) * 120}px)`, fontFamily}}>
        <div style={{position: 'absolute', left: 30, right: 30, top: 26, display: 'flex', alignItems: 'center'}}>
          <Lab style={{fontSize: 15}}>Tracker head · side view</Lab>
          <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontFamily: mono, fontSize: 14, fontWeight: 800, letterSpacing: '.1em', padding: '7px 13px', borderRadius: 999, background: status === 'Measuring' ? C.dark : 'rgba(255,255,255,.55)', color: status === 'Measuring' ? '#fff' : INK, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.7)'}}>
            <i style={{width: 9, height: 9, borderRadius: '50%', background: status === 'Measuring' ? '#fff' : C.sage}} />
            {status.toUpperCase()}
          </div>
        </div>
        <svg width={620} height={310} style={{position: 'absolute', left: 0, top: 64}}>
          <line x1={40} x2={580} y1={P[1]} y2={P[1]} stroke="rgba(38,68,56,.25)" strokeWidth={2} strokeDasharray="6 8" />
          <text x={575} y={P[1] + 26} textAnchor="end" fontFamily={mono} fontSize={13} fontWeight={700} fill={SOFT} letterSpacing="1.5">
            HORIZONTAL
          </text>
          <path d={`M${P[0] - 16} ${P[1] + 80} L${P[0]} ${P[1]} L${P[0] + 16} ${P[1] + 80}`} fill="none" stroke="rgba(38,68,56,.45)" strokeWidth={4} strokeLinejoin="round" />
          {/* sun in the schematic + its ray to the head */}
          <line x1={P[0]} y1={P[1]} x2={miniSun[0]} y2={miniSun[1]} stroke="rgba(38,68,56,.3)" strokeWidth={2} strokeDasharray="3 7" />
          <circle cx={miniSun[0]} cy={miniSun[1]} r={16} fill={C.sage} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
            const r0 = polar(miniSun, a + f, 22);
            const r1 = polar(miniSun, a + f, 30);
            return <line key={a} x1={r0[0]} y1={r0[1]} x2={r1[0]} y2={r1[1]} stroke={C.sage} strokeWidth={3} strokeLinecap="round" />;
          })}
          {/* tilt arc + 25° */}
          <g opacity={fixedTag}>
            <path d={`M${P[0] + 92} ${P[1]} A92 92 0 0 1 ${arcEnd[0]} ${arcEnd[1]}`} fill="none" stroke={C.sage} strokeWidth={5} />
            <text x={P[0] + 112} y={P[1] + 74} fontFamily={mono} fontSize={30} fontWeight={800} fill={INK}>
              25°
            </text>
          </g>
          {/* plate + pyranometer dome */}
          <line x1={pA[0]} y1={pA[1]} x2={pB[0]} y2={pB[1]} stroke={C.dark} strokeWidth={12} strokeLinecap="round" />
          <circle cx={domeAt[0]} cy={domeAt[1]} r={13} fill={C.sage} stroke="#fff" strokeWidth={3} />
          <circle cx={P[0]} cy={P[1]} r={7} fill="#fff" stroke={C.dark} strokeWidth={3} />
          {measuring > 0 &&
            [0, 1, 2].map((i) => {
              const t = ((f - 88) / 18 + i / 3) % 1;
              const c = polar(P, head, 20 + t * 110);
              return <circle key={i} cx={c[0]} cy={c[1]} r={6 + t * 10} fill="none" stroke={C.sage} strokeWidth={3} opacity={(1 - t) * measuring} />;
            })}
        </svg>
        {/* readouts */}
        <div style={{position: 'absolute', left: 30, top: 392, width: 270, height: 138, padding: '18px 22px', boxSizing: 'border-box', ...innerStyle(20, f >= 74 && f < 124 ? 0.4 : 0)}}>
          <Lab>Tilt</Lab>
          {f >= 74 && f < 124 ? (
            <div style={{fontFamily: mono, fontSize: 52, fontWeight: 800, marginTop: 10, transform: `scale(${0.8 + 0.2 * fixedTag})`, transformOrigin: 'left center'}}>25°</div>
          ) : (
            <div style={{fontSize: 26, fontWeight: 700, marginTop: 18, color: INK}}>follows the sun</div>
          )}
        </div>
        <div style={{position: 'absolute', left: 320, top: 392, width: 270, height: 138, padding: '18px 22px', boxSizing: 'border-box', ...innerStyle(20, f >= 54 && f < 62 ? 0.6 : 0)}}>
          <Lab>Every 15 min</Lab>
          <svg width={80} height={80} style={{position: 'absolute', right: 20, top: 40}}>
            <circle cx={40} cy={40} r={32} fill="none" stroke="rgba(38,68,56,.14)" strokeWidth={7} />
            <circle cx={40} cy={40} r={32} fill="none" stroke={C.dark} strokeWidth={7} strokeLinecap="round" strokeDasharray={`${clock * 201} 201`} transform="rotate(-90 40 40)" />
          </svg>
          <Icon name="clock" size={40} color={C.dark} style={{position: 'absolute', right: 40, top: 60}} />
          <div style={{fontSize: 22, fontWeight: 700, marginTop: 18, color: INK, width: 140, lineHeight: 1.25}}>tilt + reading</div>
        </div>
      </Glass>

      {/* the cycle strip */}
      <div style={{position: 'absolute', left: 56, top: 912, width: 1090, height: 126, ...glassStyle(28, 0.25), opacity: stripIn, transform: `translateY(${(1 - stripIn) * 80}px)`, fontFamily}}>
        <div style={{position: 'absolute', left: 28, top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontSize: 27, fontWeight: 800, color: C.dark, letterSpacing: -0.3}}>Tracker cycle</div>
        {STEPS.map((s, i) => {
          const x = 222 + i * (196 + 12);
          const lit = (step === i ? tween(f, [s.from, s.from + 6], [0, 1]) : 0) + (i === 0 ? relight : 0);
          return (
            <React.Fragment key={i}>
              {i > 0 && (
                <svg width={24} height={20} style={{position: 'absolute', left: x - 18, top: 53}}>
                  <path d="M0 10h14M9 4l7 6-7 6" fill="none" stroke={f >= s.from ? C.dark : 'rgba(38,68,56,.3)'} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <div
                style={{
                  position: 'absolute',
                  left: x,
                  top: 20,
                  width: 182,
                  height: 86,
                  ...innerStyle(16),
                  ...(lit > 0 ? {background: `rgba(53,92,77,${0.2 + 0.75 * Math.min(1, lit)})`} : {}),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  lineHeight: 1.25,
                  color: lit > 0.5 ? '#fff' : INK,
                  transform: `scale(${1 + 0.05 * Math.min(1, lit)})`,
                }}
              >
                {s.text}
              </div>
            </React.Fragment>
          );
        })}
        <GlassSheen />
      </div>
      {/* loop back from step 4 to step 1 */}
      {loopBack > 0 && (
        <svg width={1200} height={120} style={{position: 'absolute', left: 56, top: 800}}>
          <path
            d={`M${222 + 3 * 208 + 91} 112 C${222 + 3 * 208 + 91} 40, ${222 + 91} 40, ${222 + 91} 108`}
            fill="none"
            stroke={C.dark}
            strokeWidth={5}
            strokeDasharray="3 13"
            strokeLinecap="round"
            pathLength={1}
            style={{strokeDasharray: `${loopBack} 1`}}
          />
          {loopBack > 0.95 && <path d={`M${222 + 91 - 9} 98 l9 12 9-12`} fill="none" stroke={C.dark} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />}
          <text x={(222 + 91 + 222 + 3 * 208 + 91) / 2} y={44} textAnchor="middle" fontFamily={mono} fontSize={16} fontWeight={800} letterSpacing="2" fill={C.dark} opacity={loopBack}>
            REPEATS
          </text>
        </svg>
      )}
    </AbsoluteFill>
  );
};
