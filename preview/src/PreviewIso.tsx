import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Watermark} from './components';
import {C, ease, fontFamily, tween} from './theme';

// 10 s preview of style C (Isometric World): device → capture → photo travels to the desktop.

const PHOTO = staticFile('rooftop_capture.jpg');
const RENDER = staticFile('device_render_clean.jpg');

type V3 = [number, number, number];
type Cam = {fx: number; fy: number; fz: number; k: number};
type Proj = (x: number, y: number, z?: number) => [number, number];

const project =
  ({fx, fy, fz, k}: Cam): Proj =>
  (x, y, z = 0) => [960 + (x - fx - (y - fy)) * 0.866 * k, 540 + (x - fx + (y - fy)) * 0.5 * k - (z - fz) * k];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

const SHADE = {
  cream: [C.cream, C.light, '#C9D6CC'],
  sage: [C.light, C.sage, C.dark],
  dark: ['#5E6E64', C.char, '#1E2722'],
  grey: ['#C9D6CC', '#B5C4B9', '#9FB0A4'],
  phone: [C.char, '#1E2722', '#1E2722'],
};

// Stations the photo visits, in world units.
const HEAD: V3 = [5.1, 3.8, 4.0];
const ABOVE_HEAD: V3 = [5.1, 3.8, 5.2];
const ENCLOSURE: V3 = [3.3, 4.2, 2.1];
const TOWER: V3 = [11, 4, 5.6];
const CLOUD: V3 = [14, 5.5, 4.7];
const FLASK: V3 = [16.7, 8.7, 2.6];
const DESK: V3 = [19.5, 4.72, 1.72];

// Hops: [start frame, end frame, from, to, arc height].
const HOPS: [number, number, V3, V3, number][] = [
  [82, 96, HEAD, ABOVE_HEAD, 0],
  [102, 118, ABOVE_HEAD, ENCLOSURE, 0.7],
  [124, 148, ENCLOSURE, TOWER, 1.4],
  [156, 182, TOWER, CLOUD, 1.0],
  [190, 214, CLOUD, FLASK, 1.0],
  [222, 248, FLASK, DESK, 0.8],
];

// Photo position (with arc lift) and its base position (without lift) for the camera to follow.
const photoAt = (f: number): {pos: V3; base: V3} => {
  let last = HOPS[0][2];
  for (const [a, b, from, to, h] of HOPS) {
    if (f < a) return {pos: last, base: last};
    if (f <= b) {
      const t = tween(f, [a, b], [0, 1], Easing.inOut(Easing.cubic));
      const base = lerp3(from, to, t);
      return {pos: [base[0], base[1], base[2] + Math.sin(Math.PI * t) * h], base};
    }
    last = to;
  }
  return {pos: last, base: last};
};

const camAt = (f: number): Cam => {
  const overview: Cam = {fx: 11, fy: 7, fz: 1.4, k: interpolate(f, [0, 40], [44, 48], {extrapolateRight: 'clamp'})};
  const device: Cam = {fx: 5.1, fy: 3.8, fz: 3.4, k: interpolate(f, [78, 100], [105, 118], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})};
  if (f < 40) return overview;
  if (f < 100) {
    const t = tween(f, [40, 78], [0, 1]);
    return {fx: lerp(overview.fx, device.fx, t), fy: lerp(overview.fy, device.fy, t), fz: lerp(overview.fz, device.fz, t), k: f < 78 ? lerp(overview.k, 105, t) : device.k};
  }
  const {base, pos} = photoAt(f);
  const follow = tween(f, [100, 116], [0, 1]);
  const k = interpolate(f, [100, 120, 236, 252], [118, 82, 82, 115], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const cam: Cam = {
    fx: lerp(device.fx, base[0], follow),
    fy: lerp(device.fy, base[1], follow),
    fz: lerp(device.fz, (base[2] + pos[2]) / 2 + 1.0, follow),
    k,
  };
  // Dive into the desktop screen.
  const dive = tween(f, [252, 280], [0, 1], Easing.in(Easing.cubic));
  return {fx: lerp(cam.fx, DESK[0], dive), fy: lerp(cam.fy, DESK[1], dive), fz: lerp(cam.fz, DESK[2], dive), k: cam.k * Math.pow(9, dive)};
};

const World: React.FC<{P: Proj; k: number; f: number}> = ({P, k, f}) => {
  const {fps} = useVideoConfig();
  const pts = (a: V3[]) => a.map((p) => P(...p).join(',')).join(' ');
  let n = 0;
  const box = (x: number, y: number, z: number, w: number, d: number, h: number, c: string[]) => (
    <g key={n++}>
      <polygon points={pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={c[1]} />
      <polygon points={pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])} fill={c[2]} />
      <polygon points={pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={c[0]} />
    </g>
  );
  const line = (a: V3[], props: React.SVGProps<SVGPolylineElement>) => <polyline key={n++} points={pts(a)} fill="none" {...props} />;
  const poly = (a: V3[], props: React.SVGProps<SVGPolygonElement>) => <polygon key={n++} points={pts(a)} {...props} />;
  const dot = (x: number, y: number, z: number, r: number, props: React.SVGProps<SVGCircleElement>) => {
    const [cx, cy] = P(x, y, z);
    return <circle key={n++} cx={cx} cy={cy} r={r} {...props} />;
  };

  // Each station drops in from above with a spring.
  const drop = (delay: number, children: React.ReactNode) => {
    const s = spring({frame: f - delay, fps, config: {damping: 14, stiffness: 120}});
    return (
      <g key={n++} transform={`translate(0 ${(1 - s) * -160})`} opacity={Math.min(1, s * 1.6)}>
        {children}
      </g>
    );
  };

  const dash = {stroke: C.sage, strokeWidth: Math.max(3, k * 0.09), strokeDasharray: `${k * 0.25} ${k * 0.2}`, strokeLinecap: 'round' as const};
  const ground = tween(f, [-10, 12], [0, 1]);

  const legs = [[2.1, 2.6], [7.4, 2.6], [2.1, 4.7], [7.4, 4.7]].map(([x, y]) => box(x, y, 0, 0.2, 0.2, 0.9, SHADE.grey));
  const flash = interpolate(f, [86, 88, 96], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const [lx, ly] = P(4.95, 3.85, 3.76);
  const device = (
    <>
      {legs}
      {box(2, 2.5, 0.9, 5.7, 2.5, 0.18, [C.cream, '#C9D6CC', '#B5C4B9'])}
      {box(2.3, 2.7, 1.08, 1.6, 0.55, 1.0, ['#EEF2EF', '#C9D6CC', '#B5C4B9'])}
      {box(2.4, 3.6, 1.08, 1.9, 1.1, 0.7, SHADE.cream)}
      {poly([[2.9, 4.7, 1.3], [3.25, 4.7, 1.3], [3.25, 4.7, 1.6], [2.9, 4.7, 1.6]], {fill: '#3B6FB6'})}
      {poly([[3.6, 4.7, 1.3], [3.9, 4.7, 1.3], [3.9, 4.7, 1.6], [3.6, 4.7, 1.6]], {fill: C.char})}
      {box(4.95, 3.35, 1.08, 0.36, 0.36, 2.4, SHADE.dark)}
      {box(4.65, 3.1, 3.48, 0.95, 0.75, 0.6, SHADE.cream)}
      {dot(4.95, 3.85, 3.76, k * 0.12, {fill: C.char})}
      {dot(5.12, 3.47, 4.2, k * 0.22, {fill: C.light, stroke: C.char, strokeWidth: k * 0.04})}
      {box(4.6, 4.0, 1.08, 1.2, 0.8, 0.7, SHADE.cream)}
      {dot(4.95, 4.8, 1.42, k * 0.2, {fill: 'none', stroke: C.char, strokeWidth: k * 0.06})}
      {poly([[6.0, 4.4, 1.25], [7.5, 4.4, 1.25], [7.5, 3.2, 2.4], [6.0, 3.2, 2.4]], {fill: C.dark, stroke: C.cream, strokeWidth: k * 0.03})}
      {box(7.75, 4.55, 1.08, 0.12, 0.12, 1.3, SHADE.dark)}
      {[[-0.25, 0], [0.2, -0.18], [0.15, 0.22]].map(([dx, dy]) => dot(7.8 + dx, 4.6 + dy, 2.45, k * 0.1, {fill: C.char}))}
      {flash > 0 && <circle cx={lx} cy={ly} r={k * (0.3 + flash * 1.2)} fill="#fff" opacity={flash} />}
    </>
  );

  const T: V3 = [11, 4, 0];
  const apex: V3 = [11, 4, 5.2];
  const base = [[10.5, 3.5], [11.5, 3.5], [11.5, 4.5], [10.5, 4.5]];
  const [ax, ay] = P(...apex);
  const wavePulse = interpolate(f, [118, 128, 150, 160], [0.45, 1, 1, 0.45], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tower = (
    <>
      {base.map(([x, y]) => line([[x, y, 0], apex], {stroke: C.dark, strokeWidth: k * 0.07}))}
      {[1.6, 3.2].map((z) => {
        const s = 1 - z / 5.2;
        const ring = [...base, base[0]].map(([x, y]) => [T[0] + (x - T[0]) * s, T[1] + (y - T[1]) * s, z] as V3);
        return line(ring, {stroke: C.dark, strokeWidth: k * 0.05});
      })}
      {[0.6, 1.0, 1.4].map((r, i) => (
        <path
          key={n++}
          d={`M${ax - r * k} ${ay - r * k * 0.3} A${r * k} ${r * k} 0 0 1 ${ax + r * k} ${ay - r * k * 0.3}`}
          fill="none"
          stroke={C.sage}
          strokeWidth={k * 0.07}
          strokeLinecap="round"
          opacity={wavePulse * (1 - i * 0.25) * (0.75 + 0.25 * Math.sin(f / 3 - i))}
        />
      ))}
    </>
  );

  const [cx, cy] = P(CLOUD[0], CLOUD[1], 4.4);
  const puffs = [[-0.9, 0.15, 0.62], [0, -0.25, 0.85], [0.9, 0.15, 0.62]];
  const [sx, sy] = P(CLOUD[0], CLOUD[1], 0);
  const cloud = (
    <>
      <ellipse cx={sx} cy={sy} rx={k * 1.4} ry={k * 0.55} fill="rgba(40,51,45,.12)" />
      {puffs.map(([dx, dy, r]) => <circle key={n++} cx={cx + dx * k} cy={cy + dy * k} r={r * k} fill="#fff" stroke={C.dark} strokeWidth={k * 0.08} />)}
      <rect x={cx - 1.5 * k} y={cy} width={3 * k} height={0.75 * k} fill="#fff" />
      <path d={`M${cx - 1.5 * k} ${cy + 0.75 * k}H${cx + 1.5 * k}`} stroke={C.dark} strokeWidth={k * 0.08} />
      {puffs.map(([dx, dy, r]) => <circle key={n++} cx={cx + dx * k} cy={cy + dy * k} r={r * k - k * 0.04} fill="#fff" />)}
      <text x={cx} y={cy + 0.35 * k} textAnchor="middle" fontFamily={fontFamily} fontWeight={800} fontSize={0.6 * k} fill={C.dark}>
        ngrok
      </text>
    </>
  );

  const flask = (
    <>
      {[0, 0.7, 1.4].map((z) => (
        <g key={n++}>
          {box(16, 8, z, 1.4, 1.4, 0.6, SHADE.sage)}
          {dot(16.25, 9.4, z + 0.3, k * 0.07, {fill: f > 214 && f < 230 && Math.floor(f / 3) % 2 ? '#fff' : C.cream})}
        </g>
      ))}
    </>
  );

  const desktop = (
    <>
      {box(19.2, 4.3, 0, 0.5, 0.35, 0.95, SHADE.dark)}
      {box(18.3, 4.55, 0.95, 2.4, 0.15, 1.55, [C.char, C.char, '#1E2722'])}
      {poly([[18.42, 4.71, 1.07], [20.58, 4.71, 1.07], [20.58, 4.71, 2.38], [18.42, 4.71, 2.38]], {fill: C.sage})}
    </>
  );

  const phone = (x: number, y: number, screen: string) => (
    <>
      {box(x, y, 0, 1.0, 1.7, 0.14, SHADE.phone)}
      {poly([[x + 0.08, y + 0.1, 0.15], [x + 0.92, y + 0.1, 0.15], [x + 0.92, y + 1.6, 0.15], [x + 0.08, y + 1.6, 0.15]], {fill: screen})}
    </>
  );

  return (
    <svg width={1920} height={1080} style={{position: 'absolute'}}>
      <g opacity={ground} transform={`translate(0 ${(1 - ground) * 60})`}>
        {box(0, 0, -0.5, 22, 14, 0.5, [C.light, '#B9CDBF', '#9FB8A6'])}
        {Array.from({length: 21}, (_, i) => line([[i + 1, 0, 0], [i + 1, 14, 0]], {stroke: 'rgba(125,157,134,.22)', strokeWidth: 1.5}))}
        {Array.from({length: 13}, (_, j) => line([[0, j + 1, 0], [22, j + 1, 0]], {stroke: 'rgba(125,157,134,.22)', strokeWidth: 1.5}))}
        {line([[7.9, 4.4, 0], [9.4, 4.4, 0], [10.6, 4.2, 0]], dash)}
        {line([[17.4, 8.7, 0], [19.4, 8.7, 0], [19.4, 4.9, 0]], dash)}
        {line([[6.2, 5.4, 0], [6.2, 7.6, 0], [11.4, 7.6, 0], [11.4, 9.8, 0]], {...dash, stroke: C.dark, opacity: 0.35})}
      </g>
      {drop(4, device)}
      {drop(8, phone(3.2, 7.2, C.light))}
      {drop(11, tower)}
      {drop(14, cloud)}
      {drop(17, flask)}
      {drop(20, desktop)}
      {drop(23, phone(11.0, 10.0, C.sage))}
    </svg>
  );
};

// Dotted trail behind the photo for every hop it has started.
const Trails: React.FC<{P: Proj; k: number; f: number}> = ({P, k, f}) => (
  <svg width={1920} height={1080} style={{position: 'absolute'}}>
    {HOPS.slice(1).map(([a, b, from, to, h], i) => {
      if (f < a) return null;
      const end = tween(f, [a, b], [0, 1], Easing.inOut(Easing.cubic));
      const samples = Array.from({length: 24}, (_, j) => {
        const t = (end * j) / 23;
        const p = lerp3(from, to, t);
        return P(p[0], p[1], p[2] + Math.sin(Math.PI * t) * h).join(',');
      });
      return (
        <polyline
          key={i}
          points={samples.join(' ')}
          fill="none"
          stroke={C.dark}
          strokeWidth={Math.max(4, k * 0.06)}
          strokeDasharray={`2 ${Math.max(12, k * 0.2)}`}
          strokeLinecap="round"
          opacity={0.7}
        />
      );
    })}
  </svg>
);

// Ground ring that pulses when the photo reaches a station.
const Pulses: React.FC<{P: Proj; k: number; f: number}> = ({P, k, f}) => (
  <svg width={1920} height={1080} style={{position: 'absolute'}}>
    {HOPS.slice(1).map(([, b, , to], i) => {
      const t = tween(f, [b, b + 18], [0, 1], Easing.out(Easing.cubic));
      if (t <= 0 || t >= 1) return null;
      const [x, y] = P(to[0], to[1], to[2] - 0.6);
      return <ellipse key={i} cx={x} cy={y} rx={k * (0.4 + t * 1.4)} ry={k * (0.2 + t * 0.7)} fill="none" stroke={C.sage} strokeWidth={6} opacity={1 - t} />;
    })}
  </svg>
);

const Pill: React.FC<{at: [number, number]; dark?: boolean; opacity?: number; children: React.ReactNode}> = ({at, dark, opacity = 1, children}) => (
  <div
    style={{
      position: 'absolute',
      left: at[0],
      top: at[1],
      transform: 'translate(-50%, -100%)',
      background: dark ? C.dark : '#fff',
      color: dark ? C.cream : C.dark,
      fontFamily,
      fontWeight: 700,
      fontSize: 30,
      padding: '8px 20px',
      borderRadius: 14,
      whiteSpace: 'nowrap',
      boxShadow: '0 6px 16px rgba(40,51,45,.2)',
      opacity,
    }}
  >
    {children}
  </div>
);

const Tag: React.FC<{n: number; text: string}> = ({n, text}) => (
  <div
    style={{
      position: 'absolute',
      left: 56,
      top: 46,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      background: C.dark,
      color: C.cream,
      fontFamily,
      fontSize: 34,
      fontWeight: 700,
      padding: '10px 30px 10px 10px',
      borderRadius: 999,
      boxShadow: '0 8px 24px rgba(40,51,45,.25)',
    }}
  >
    <b style={{background: C.cream, color: C.dark, borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26}}>{n}</b>
    {text}
  </div>
);

const STEPS = ['Camera', 'LilyGo', 'Cellular', 'ngrok', 'Flask', 'Desktop'];
const RouteBar: React.FC<{f: number}> = ({f}) => {
  const active = f < 102 ? 0 : f < 124 ? 1 : f < 156 ? 2 : f < 190 ? 3 : f < 222 ? 4 : 5;
  const show = tween(f, [96, 108], [0, 1]) * tween(f, [252, 262], [1, 0]);
  if (show <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 46,
        transform: `translate(-50%, ${(1 - show) * 40}px)`,
        opacity: show,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: 'rgba(255,255,255,.96)',
        borderRadius: 999,
        padding: '16px 34px',
        fontFamily,
        fontSize: 28,
        fontWeight: 600,
        color: '#9AAAA0',
        boxShadow: '0 8px 24px rgba(40,51,45,.15)',
      }}
    >
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          {i > 0 && <span style={{color: '#C9D6CC'}}>›</span>}
          <span style={{display: 'flex', alignItems: 'center', gap: 10, color: i < active ? C.sage : i === active ? C.dark : undefined, fontWeight: i === active ? 800 : 600}}>
            <i style={{width: 16, height: 16, borderRadius: '50%', background: i <= active ? (i === active ? C.dark : C.sage) : '#C9D6CC', boxShadow: i === active ? '0 0 0 6px rgba(53,92,77,.25)' : undefined}} />
            {s}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

// Flat close-up the camera lands in after diving into the desktop screen.
const DesktopCloseUp: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  const t = tween(f, [264, 276], [0, 1]);
  if (t <= 0) return null;
  const scale = interpolate(f, [264, 290], [1.25, 1], {extrapolateRight: 'clamp', easing: ease});
  const land = spring({frame: f - 268, fps, config: {damping: 12}});
  const tick = spring({frame: f - 280, fps, config: {damping: 12}});
  return (
    <AbsoluteFill style={{opacity: t, background: `linear-gradient(${C.cream}, ${C.light})`}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${scale})`}}>
        <div style={{position: 'absolute', left: 300, top: 110, width: 1320, height: 800, background: C.char, borderRadius: 30}} />
        <div style={{position: 'absolute', left: 860, top: 910, width: 200, height: 70, background: '#5E6E64'}} />
        <div style={{position: 'absolute', left: 740, top: 975, width: 440, height: 26, borderRadius: 13, background: '#5E6E64'}} />
        <div style={{position: 'absolute', left: 340, top: 150, width: 1240, height: 720, background: '#fff', borderRadius: 14, overflow: 'hidden', fontFamily}}>
          <div style={{height: 64, background: C.light, display: 'flex', alignItems: 'center', gap: 12, padding: '0 26px', fontSize: 30, fontWeight: 600, color: C.dark}}>
            <i style={{width: 18, height: 18, borderRadius: '50%', background: C.sage}} />
            <i style={{width: 18, height: 18, borderRadius: '50%', background: '#C9D6CC'}} />
            <i style={{width: 18, height: 18, borderRadius: '50%', background: '#C9D6CC'}} />
            <span style={{marginLeft: 20}}>Received_Images</span>
          </div>
          <svg width={170} height={170} viewBox="0 0 48 48" style={{position: 'absolute', left: 70, top: 130}}>
            <path d="M5 12a3 3 0 0 1 3-3h11l4 5h17a3 3 0 0 1 3 3v20a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" fill={C.sage} />
          </svg>
          <div
            style={{
              position: 'absolute',
              left: 320,
              top: 130,
              width: 400,
              background: '#fff',
              padding: '12px 12px 52px',
              borderRadius: 10,
              boxShadow: `0 0 0 8px rgba(125,157,134,${0.45 * tick}), 0 16px 40px rgba(40,51,45,.25)`,
              transform: `translateY(${(1 - land) * -260}px) rotate(${(1 - land) * -8}deg)`,
              opacity: Math.min(1, land * 2),
            }}
          >
            <Img src={PHOTO} style={{display: 'block', width: '100%'}} />
            <div style={{position: 'absolute', left: 0, right: 0, bottom: 12, textAlign: 'center', fontSize: 26, fontWeight: 600, color: C.dark}}>img_01.jpg</div>
          </div>
          <div style={{position: 'absolute', left: 780, top: 250, display: 'flex', alignItems: 'center', gap: 18, fontSize: 42, fontWeight: 800, color: C.dark, opacity: tick, transform: `scale(${0.8 + 0.2 * tick})`, transformOrigin: 'left center'}}>
            <svg width={64} height={64} viewBox="0 0 48 48">
              <circle cx={24} cy={24} r={20} fill={C.sage} />
              <path d="M15 24l6 6 12-13" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Saved to desktop
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const PreviewIso: React.FC<{watermark: string}> = ({watermark}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cam = camAt(f);
  const P = project(cam);
  const {k} = cam;
  const {pos} = photoAt(f);

  // Photo card: pops out of the lens, then rides along with the camera.
  const pop = spring({frame: f - 82, fps, config: {damping: 11}});
  const [px, py] = P(...pos);
  const [gx, gy] = P(pos[0], pos[1], 0);
  const photoW = Math.min(300, Math.max(170, k * 2.4)) * pop;
  const photoOn = f >= 82 && f < 262;
  const tilt = Math.sin(f / 9) * 4;

  // Real render card while the camera arrives at the device.
  const realIn = spring({frame: f - 50, fps, config: {damping: 14}});
  const realOut = tween(f, [80, 88], [1, 0]);
  const real = realIn * realOut;

  const label = (x: number, y: number, z: number, text: string, from: number, dark = false) => (
    <Pill at={P(x, y, z)} dark={dark} opacity={tween(f, [from, from + 10], [0, 1]) * tween(f, [252, 260], [1, 0])}>
      {text}
    </Pill>
  );

  const flashAll = interpolate(f, [86, 88, 94], [0, 0.55, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tag: [number, string] = f < 80 ? [1, 'The device'] : f < 100 ? [3, 'Capture rooftop image'] : f < 268 ? [4, 'Sending the image'] : [4, 'Saved to desktop'];

  return (
    <AbsoluteFill style={{background: C.cream}}>
      <World P={P} k={k} f={f} />
      <Trails P={P} k={k} f={f} />
      <Pulses P={P} k={k} f={f} />

      <Pill at={P(5.1, 3.5, 5.0)} dark opacity={tween(f, [18, 28], [0, 1]) * tween(f, [96, 104], [1, 0])}>
        Device
      </Pill>
      {label(3.7, 8.0, 0.9, 'Website', 22)}
      {label(11.9, 4.9, 0, 'Cellular', 24)}
      {label(17.9, 9.9, 0, 'Flask', 26)}
      {label(20.6, 5.5, 0, 'Desktop', 28)}
      {label(11.5, 10.8, 1.0, 'Blynk', 30)}

      {photoOn && (
        <>
          <svg width={1920} height={1080} style={{position: 'absolute'}}>
            <ellipse cx={gx} cy={gy} rx={k * 0.7 * pop} ry={k * 0.3 * pop} fill="rgba(40,51,45,.18)" />
          </svg>
          <div
            style={{
              position: 'absolute',
              left: px,
              top: py,
              width: photoW,
              padding: photoW * 0.04,
              background: '#fff',
              borderRadius: 8,
              boxShadow: '0 20px 40px rgba(40,51,45,.3)',
              transform: `translate(-50%, -100%) rotate(${tilt}deg)`,
              opacity: Math.min(1, pop * 2),
            }}
          >
            <Img src={PHOTO} style={{display: 'block', width: '100%'}} />
          </div>
        </>
      )}

      {real > 0.01 && (
        <div
          style={{
            position: 'absolute',
            left: 90,
            top: 230,
            width: 560,
            padding: 16,
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 20px 50px rgba(40,51,45,.25)',
            opacity: Math.min(1, real * 1.5),
            transform: `translateX(${(1 - real) * -80}px) rotate(-2deg)`,
            fontFamily,
          }}
        >
          <Img src={RENDER} style={{display: 'block', width: '100%', borderRadius: 10}} />
          <div style={{marginTop: 12, fontSize: 28, fontWeight: 700, color: C.dark}}>Your device</div>
        </div>
      )}

      <AbsoluteFill style={{background: '#fff', opacity: flashAll}} />
      <RouteBar f={f} />
      <DesktopCloseUp f={f} />
      <Tag n={tag[0]} text={tag[1]} />
      {watermark && <Watermark text={watermark} />}
    </AbsoluteFill>
  );
};
