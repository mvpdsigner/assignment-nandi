import React from 'react';
import {AbsoluteFill, Easing, spring, staticFile, useVideoConfig} from 'remotion';
import {Chip, Crop} from './components';
import {Box, C, boxAt, fontFamily, tween} from './theme';

const RENDER = staticFile('device_render.jpg');
const RENDER_NAT: [number, number] = [1672, 941];

// Spotlight stops on the device render, in 1920×1080 frame coordinates.
const HEAD: Box = [775, 14, 600, 300];
const PANEL: Box = [1257, 356, 615, 368];
const ENCLOSURE: Box = [63, 608, 770, 362];

// Device icon focal point on the illustrated roof.
const FOCUS = {x: 963, y: 320};

const Rooftop: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const bgRise = tween(f, [0, 24], [320, 0], Easing.out(Easing.cubic));
  const houseRise = tween(f, [6, 30], [560, 0], Easing.out(Easing.cubic));
  const sun = spring({frame: f - 4, fps, config: {damping: 14}});
  const drop = spring({frame: f - 28, fps, config: {damping: 10, stiffness: 140}});
  const dropY = (1 - drop) * -420;
  const shadow = Math.min(1, drop);

  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.cream} />
          <stop offset="1" stopColor={C.light} />
        </linearGradient>
      </defs>
      <rect width={1920} height={1080} fill="url(#sky)" />
      <g transform={`translate(1720 200) scale(${sun}) rotate(${f * 0.6})`}>
        <g stroke={C.sage} strokeWidth={7} strokeLinecap="round" opacity={0.7}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <path key={a} d="M0 -130v-40" transform={`rotate(${a})`} />
          ))}
        </g>
        <circle r={88} fill={C.cream} stroke={C.sage} strokeWidth={8} />
      </g>
      <g fill={C.mid} transform={`translate(0 ${bgRise})`}>
        <rect x={40} y={610} width={300} height={430} />
        <rect x={250} y={680} width={200} height={360} />
        <rect x={1560} y={640} width={320} height={400} />
        <rect x={1470} y={720} width={160} height={320} />
      </g>
      <g transform={`translate(0 ${houseRise})`}>
        <rect x={430} y={560} width={1060} height={480} fill={C.cream} stroke={C.sage} strokeWidth={6} />
        <g fill={C.dark} opacity={0.85}>
          <rect x={520} y={640} width={150} height={120} rx={6} />
          <rect x={760} y={640} width={150} height={120} rx={6} />
          <rect x={1010} y={640} width={150} height={120} rx={6} />
          <rect x={1250} y={640} width={150} height={120} rx={6} />
          <rect x={520} y={850} width={150} height={120} rx={6} />
          <rect x={1250} y={850} width={150} height={120} rx={6} />
        </g>
        <rect x={860} y={860} width={200} height={180} rx={6} fill={C.sage} />
        <rect x={400} y={520} width={1120} height={44} fill={C.sage} />
        <rect x={400} y={478} width={1120} height={42} fill={C.light} stroke={C.sage} strokeWidth={5} />
        <rect x={1260} y={390} width={180} height={88} fill={C.light} stroke={C.sage} strokeWidth={5} />
        <ellipse cx={1010} cy={478} rx={130 * shadow} ry={10 * shadow} fill={C.char} opacity={0.18} />
      </g>
      <rect x={0} y={1040} width={1920} height={40} fill="#B9CDBF" />
      <g transform={`translate(0 ${dropY})`} opacity={f < 28 ? 0 : 1}>
        <rect x={950} y={345} width={26} height={133} fill={C.char} />
        <rect x={905} y={292} width={116} height={60} rx={8} fill={C.cream} stroke={C.char} strokeWidth={5} />
        <ellipse cx={963} cy={290} rx={28} ry={22} fill={C.light} stroke={C.char} strokeWidth={5} />
        <circle cx={1000} cy={322} r={11} fill={C.char} />
        <path d="M1060 478l40-80h110l-30 80z" fill={C.dark} stroke={C.char} strokeWidth={4} />
      </g>
    </svg>
  );
};

export const SceneDevice: React.FC<{f: number}> = ({f}) => {
  // Rooftop: zoom into the device icon, moving it to frame centre.
  const zp = tween(f, [54, 80], [0, 1], Easing.in(Easing.cubic));
  const sc = 1 + zp * 7;
  const tx = FOCUS.x + zp * (960 - FOCUS.x) - sc * FOCUS.x;
  const ty = FOCUS.y + zp * (540 - FOCUS.y) - sc * FOCUS.y;
  const roofOpacity = tween(f, [68, 80], [1, 0]);

  const titleP = tween(f, [10, 30], [0, 1]) * tween(f, [50, 60], [1, 0]);

  // Real render: pull back from the sensor head, tour, then push in to the tracker.
  const renderOpacity = tween(f, [66, 80], [0, 1]);
  const box = boxAt(f, [
    {f: 66, box: [620, 125, 320, 180]},
    {f: 96, box: [0, 0, 1672, 941]},
    {f: 134, box: [0, 0, 1672, 941]},
    {f: 164, box: [430, 120, 700, 394]},
  ]);

  const spotOpacity = tween(f, [92, 100], [0, 1]) * tween(f, [134, 142], [1, 0]);
  const [sx, sy, sw, sh] = boxAt(f, [
    {f: 100, box: HEAD},
    {f: 110, box: HEAD},
    {f: 117, box: PANEL},
    {f: 124, box: PANEL},
    {f: 131, box: ENCLOSURE},
    {f: 142, box: ENCLOSURE},
  ]);

  const ringP = tween(f, [142, 150], [0, 1]);
  const pulse = ((f - 142) % 18) / 18;

  return (
    <AbsoluteFill style={{background: C.cream}}>
      {roofOpacity > 0 && (
        <AbsoluteFill style={{opacity: roofOpacity}}>
          <div style={{position: 'absolute', width: 1920, height: 1080, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${sc})`}}>
            <Rooftop f={f} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 44,
              textAlign: 'center',
              fontFamily,
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: -1,
              color: C.dark,
              opacity: titleP,
              transform: `translateY(${(1 - titleP) * 30}px)`,
            }}
          >
            Smart Rooftop Solar Assessment
          </div>
        </AbsoluteFill>
      )}
      {renderOpacity > 0 && (
        <AbsoluteFill style={{opacity: renderOpacity}}>
          <Crop src={RENDER} nat={RENDER_NAT} box={box} w={1920} h={1080} />
          {spotOpacity > 0 && (
            <svg width={1920} height={1080} style={{position: 'absolute', opacity: spotOpacity}}>
              <defs>
                <mask id="spot">
                  <rect width={1920} height={1080} fill="#fff" />
                  <rect x={sx} y={sy} width={sw} height={sh} rx={28} fill="#000" />
                </mask>
              </defs>
              <rect width={1920} height={1080} fill={C.char} opacity={0.62} mask="url(#spot)" />
              <rect x={sx} y={sy} width={sw} height={sh} rx={28} fill="none" stroke={C.light} strokeWidth={8} />
            </svg>
          )}
          {ringP > 0 && (
            <svg width={1920} height={1080} style={{position: 'absolute', opacity: ringP}}>
              <circle cx={950} cy={240} r={190} fill="none" stroke={C.sage} strokeWidth={10} />
              <circle cx={950} cy={240} r={190 + pulse * 110} fill="none" stroke={C.sage} strokeWidth={6} opacity={1 - pulse} />
            </svg>
          )}
        </AbsoluteFill>
      )}
      <Chip f={f} inAt={138} outAt={164}>
        Smart Rooftop Solar Assessment
      </Chip>
    </AbsoluteFill>
  );
};
