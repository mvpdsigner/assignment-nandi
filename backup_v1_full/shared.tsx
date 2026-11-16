import React from 'react';
import {Easing, Img, interpolate, spring, staticFile} from 'remotion';
import {Box, C, fontFamily, tween} from '../theme';

export const W = 1920;
export const H = 1080;

export const IMG = {
  render: staticFile('device_render_clean.jpg'),
  site: staticFile('website_location.jpg'),
  photo: staticFile('rooftop_capture.jpg'),
  stage1: staticFile('stage1_original.jpg'),
  stage2: staticFile('stage2_roof_floor_green.jpg'),
  stage3: staticFile('stage3_assessment_orange.jpg'),
  dashboard: staticFile('frame_overview.jpg'),
  chart: staticFile('energy_by_panel_chart.jpg'),
};
export const RENDER_NAT: [number, number] = [1536, 1024];
// The clean render cover-fitted to the full frame (frame = (x * 1.25, (y - 70) * 1.25)).
export const RENDER_FULL: Box = [0, 70, 1536, 864];

export type Pt = [number, number];

// Where a source-pixel point of a cover-fitted crop lands on screen.
export const cropToScreen = (box: Box, [rx, ry]: Pt, w = W, h = H): Pt => {
  const [bx, by, bw, bh] = box;
  const s = Math.max(w / bw, h / bh);
  return [-bx * s - (bw * s - w) / 2 + rx * s, -by * s - (bh * s - h) / 2 + ry * s];
};

// Point at fraction t along a polyline, by length.
export const along = (pts: Pt[], t: number): Pt => {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let d = Math.max(0, Math.min(1, t)) * segs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const u = segs[i] ? Math.min(1, d / segs[i]) : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u];
    }
    d -= segs[i];
  }
  return pts[pts.length - 1];
};

export const ptsAttr = (pts: Pt[]) => pts.map((p) => p.join(',')).join(' ');

// Quadratic arc between two points, lifted by `lift` px; returns the point at t.
export const arcPoint = (a: Pt, b: Pt, lift: number, t: number): Pt => {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2 - lift;
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * mx + t * t * b[0], u * u * a[1] + 2 * u * t * my + t * t * b[1]];
};
export const arcPath = (a: Pt, b: Pt, lift: number) => `M${a[0]} ${a[1]} Q${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2 - lift} ${b[0]} ${b[1]}`;

// Whip-pan between two scenes: `dir` is the way the camera moves (1 = right, -1 = left).
export const whip = (f: number, at: number, dir: 1 | -1, role: 'in' | 'out'): React.CSSProperties => {
  const p = tween(f, [at - 9, at + 9], [0, 1], Easing.inOut(Easing.cubic));
  const x = role === 'out' ? -dir * p * W : dir * (1 - p) * W;
  const blur = Math.sin(Math.PI * p) * 18;
  return {transform: `translateX(${x}px)`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined};
};

export const pop = (f: number, at: number, fps = 30, damping = 13) => spring({frame: f - at, fps, config: {damping}});

const PATHS: Record<string, React.ReactNode> = {
  cam: (
    <g fill="none" stroke="currentColor" strokeWidth={3} strokeLinejoin="round">
      <rect x={5} y={12} width={38} height={28} rx={6} />
      <circle cx={24} cy={26} r={8} />
      <path d="M17 12l3-5h8l3 5" />
    </g>
  ),
  tower: (
    <g fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
      <path d="M24 20L15 44M24 20l9 24M18 36h12M20 29h8" />
      <circle cx={24} cy={17} r={3} />
      <path d="M15 10a12 12 0 0 0 0 14M33 10a12 12 0 0 1 0 14M10 6a18 18 0 0 0 0 22M38 6a18 18 0 0 1 0 22" />
    </g>
  ),
  server: (
    <>
      <g fill="none" stroke="currentColor" strokeWidth={3}>
        <rect x={8} y={7} width={32} height={10} rx={3} />
        <rect x={8} y={19} width={32} height={10} rx={3} />
        <rect x={8} y={31} width={32} height={10} rx={3} />
      </g>
      <g fill="currentColor">
        <circle cx={14} cy={12} r={2} />
        <circle cx={14} cy={24} r={2} />
        <circle cx={14} cy={36} r={2} />
      </g>
    </>
  ),
  pin: (
    <g fill="none" stroke="currentColor" strokeWidth={3}>
      <path d="M24 44s14-13 14-24a14 14 0 0 0-28 0c0 11 14 24 14 24z" />
      <circle cx={24} cy={20} r={5} />
    </g>
  ),
  sun: (
    <g fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
      <circle cx={24} cy={24} r={8} />
      <path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M14 34l-4 4" />
    </g>
  ),
  therm: (
    <g fill="none" stroke="currentColor" strokeWidth={3}>
      <path d="M20 28V9a4 4 0 0 1 8 0v19a8 8 0 1 1-8 0z" />
      <path d="M24 16v15" />
    </g>
  ),
  grid: (
    <g fill="none" stroke="currentColor" strokeWidth={3}>
      <rect x={6} y={6} width={36} height={36} rx={4} />
      <path d="M18 6v36M30 6v36M6 18h36M6 30h36" />
    </g>
  ),
  wind: (
    <g fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
      <path d="M6 18h24a6 6 0 1 0-6-6M6 26h32a6 6 0 1 1-6 6M6 34h14" />
    </g>
  ),
  clock: (
    <g fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
      <circle cx={24} cy={24} r={17} />
      <path d="M24 14v10l7 5" />
    </g>
  ),
  folder: <path d="M5 12a3 3 0 0 1 3-3h11l4 5h17a3 3 0 0 1 3 3v20a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" fill="currentColor" />,
  code: (
    <g fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 14L7 24l10 10M31 14l10 10-10 10M27 10l-6 28" />
    </g>
  ),
  check: (
    <>
      <circle cx={24} cy={24} r={20} fill="currentColor" />
      <path d="M15 24l6 6 12-13" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
};

export const Icon: React.FC<{name: keyof typeof PATHS; size: number; color?: string; style?: React.CSSProperties}> = ({name, size, color = C.dark, style}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={{color, flex: 'none', ...style}}>
    {PATHS[name]}
  </svg>
);

// LilyGo board (ESP32 + SIM) in the palette; `glow` lights the SIM.
export const LilyGo: React.FC<{w: number; glow?: number; style?: React.CSSProperties}> = ({w, glow = 0, style}) => (
  <svg width={w} height={(w * 150) / 240} viewBox="0 0 240 150" style={style}>
    <rect x={205} y={0} width={14} height={62} rx={7} fill={C.char} />
    <rect x={4} y={44} width={232} height={102} rx={10} fill={C.dark} stroke={C.char} strokeWidth={4} />
    <g fill={C.light}>
      {[20, 36, 52, 68, 84].map((x) => (
        <React.Fragment key={x}>
          <circle cx={x} cy={56} r={4} />
          <circle cx={x} cy={134} r={4} />
        </React.Fragment>
      ))}
    </g>
    <rect x={18} y={70} width={70} height={52} rx={4} fill="#C9D6CC" />
    <text x={53} y={102} fontSize={15} fontWeight={700} fill={C.dark} textAnchor="middle" fontFamily={fontFamily}>
      ESP32
    </text>
    <rect x={104} y={64} width={78} height={64} rx={6} fill={C.cream} stroke={C.sage} strokeWidth={3} />
    <rect x={104} y={64} width={78} height={64} rx={6} fill={C.sage} opacity={glow} />
    <text x={143} y={102} fontSize={15} fontWeight={700} fill={glow > 0.5 ? '#fff' : C.dark} textAnchor="middle" fontFamily={fontFamily}>
      SIM
    </text>
    <rect x={194} y={76} width={30} height={40} rx={3} fill={C.sage} />
  </svg>
);

export const Lbl: React.FC<{x: number; y: number; p: number; title: string; sub?: string; icon?: keyof typeof PATHS; size?: number}> = ({
  x,
  y,
  p,
  title,
  sub,
  icon,
  size = 30,
}) =>
  p <= 0.01 ? null : (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        background: '#fff',
        color: C.dark,
        fontFamily,
        fontSize: size,
        fontWeight: 700,
        padding: '12px 22px',
        borderRadius: 16,
        boxShadow: '0 8px 24px rgba(40,51,45,.22)',
        whiteSpace: 'nowrap',
        lineHeight: 1.2,
        opacity: Math.min(1, p * 1.5),
        transform: `translateY(${(1 - p) * 24}px) scale(${0.9 + 0.1 * p})`,
        transformOrigin: 'left center',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {icon && <Icon name={icon} size={size * 1.15} color={C.sage} />}
      <div>
        {title}
        {sub && <div style={{fontSize: size * 0.8, fontWeight: 500, color: '#5E6E64'}}>{sub}</div>}
      </div>
    </div>
  );

export const DataPill: React.FC<{at: Pt; children: React.ReactNode; dark?: boolean; opacity?: number; icon?: keyof typeof PATHS}> = ({at, children, dark, opacity = 1, icon}) => (
  <div
    style={{
      position: 'absolute',
      left: at[0],
      top: at[1],
      transform: 'translate(-50%, -50%)',
      background: dark ? C.dark : C.sage,
      color: '#fff',
      fontFamily,
      fontSize: 28,
      fontWeight: 700,
      padding: '10px 20px',
      borderRadius: 999,
      whiteSpace: 'nowrap',
      boxShadow: '0 6px 18px rgba(40,51,45,.25)',
      opacity,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}
  >
    {icon && <Icon name={icon} size={30} color="#fff" />}
    {children}
  </div>
);

export const Photo: React.FC<{at: Pt; w: number; rot?: number; opacity?: number; caption?: string; glow?: number}> = ({at, w, rot = 0, opacity = 1, caption, glow = 0}) =>
  w <= 1 ? null : (
    <div
      style={{
        position: 'absolute',
        left: at[0],
        top: at[1],
        width: w,
        padding: `${w * 0.035}px ${w * 0.035}px ${caption ? w * 0.11 : w * 0.035}px`,
        background: '#fff',
        borderRadius: Math.max(4, w * 0.02),
        boxShadow: `0 ${w * 0.05}px ${w * 0.12}px rgba(40,51,45,.3), 0 0 0 ${glow * 10}px rgba(125,157,134,.45)`,
        transform: `translate(-50%, -50%) rotate(${rot}deg)`,
        opacity,
        fontFamily,
      }}
    >
      <Img src={IMG.photo} style={{display: 'block', width: '100%'}} />
      {caption && (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: w * 0.025, textAlign: 'center', fontSize: w * 0.055, fontWeight: 600, color: C.dark}}>{caption}</div>
      )}
    </div>
  );

// ---- section tag (top left), driven by global frame
const SECTIONS: [number, number, string][] = [
  [50, 1, 'The device'],
  [240, 2, 'Get location'],
  [510, 3, 'Capture rooftop image'],
  [690, 4, 'Sending the image'],
  [1050, 5, 'Shading analysis'],
  [1380, 6, 'Sensors & live monitoring'],
  [1800, 7, 'Final assessment'],
];
export const SectionTag: React.FC<{f: number}> = ({f}) => {
  const show = tween(f, [50, 64], [0, 1]) * tween(f, [2130, 2145], [1, 0]);
  if (show <= 0) return null;
  let cur = 0;
  SECTIONS.forEach(([at], i) => {
    if (f >= at) cur = i;
  });
  const [at, n, text] = SECTIONS[cur];
  const flip = cur === 0 ? 1 : tween(f, [at, at + 10], [0, 1]);
  return (
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
        opacity: show,
        transform: `translateY(${(1 - show) * -30}px)`,
      }}
    >
      <b style={{background: C.cream, color: C.dark, borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, transform: `rotateY(${(1 - flip) * 90}deg)`}}>
        {n}
      </b>
      <span style={{opacity: flip, transform: `translateX(${(1 - flip) * -14}px)`, display: 'inline-block'}}>{text}</span>
    </div>
  );
};

// ---- data tray (bottom right), driven by global frame
export const SLOT_CENTERS: Pt[] = [1279, 1445, 1611, 1777].map((x) => [x, 973] as Pt);
const SLOTS: {icon: keyof typeof PATHS; label: string; fill: number}[] = [
  {icon: 'pin', label: 'Location', fill: 478},
  {icon: 'grid', label: 'Shading', fill: 1352},
  {icon: 'sun', label: 'Irradiance', fill: 1768},
  {icon: 'therm', label: 'Environment', fill: 1774},
];
export const Tray: React.FC<{f: number}> = ({f}) => {
  const vis =
    tween(f, [440, 458], [0, 1]) * tween(f, [680, 696], [1, 0]) + tween(f, [1300, 1316], [0, 1]) * tween(f, [1800, 1806], [1, 0]);
  if (vis <= 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute',
        right: 50,
        bottom: 40,
        display: 'flex',
        gap: 14,
        padding: 14,
        background: 'rgba(248,247,242,.95)',
        border: '3px solid #C9D6CC',
        borderRadius: 26,
        boxShadow: '0 10px 30px rgba(40,51,45,.18)',
        transform: `translateY(${(1 - vis) * 180}px)`,
        fontFamily,
      }}
    >
      {SLOTS.map((s) => {
        const on = tween(f, [s.fill, s.fill + 6], [0, 1]);
        const ring = interpolate(f, [s.fill, s.fill + 6, s.fill + 26], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <div
            key={s.label}
            style={{
              width: 152,
              height: 100,
              border: `3px ${on > 0.5 ? 'solid' : 'dashed'} ${on > 0.5 ? C.dark : '#C9D6CC'}`,
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              fontSize: 20,
              fontWeight: 600,
              color: on > 0.5 ? C.cream : '#5E6E64',
              background: on > 0.5 ? C.dark : 'transparent',
              boxShadow: `0 0 0 ${ring * 9}px rgba(125,157,134,.55)`,
              transform: `scale(${1 + ring * 0.06})`,
            }}
          >
            <Icon name={s.icon} size={40} color={on > 0.5 ? C.cream : '#5E6E64'} />
            {s.label}
          </div>
        );
      })}
    </div>
  );
};

// ---- route bar for the image transfer
const STEPS = ['Camera', 'LilyGo', 'Cellular', 'ngrok', 'Flask', 'Desktop'];
export const RouteBar: React.FC<{active: number; show: number}> = ({active, show}) =>
  show <= 0.01 ? null : (
    <div
      style={{
        position: 'absolute',
        left: 56,
        bottom: 46,
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
        opacity: show,
        transform: `translateY(${(1 - show) * 60}px)`,
      }}
    >
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          {i > 0 && <span style={{color: '#C9D6CC'}}>›</span>}
          <span style={{display: 'flex', alignItems: 'center', gap: 10, color: i < active ? C.sage : i === active ? C.dark : undefined, fontWeight: i === active ? 800 : 600}}>
            <i
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: i < active ? C.sage : i === active ? C.dark : '#C9D6CC',
                boxShadow: i === active ? '0 0 0 6px rgba(53,92,77,.25)' : undefined,
              }}
            />
            {s}
          </span>
        </React.Fragment>
      ))}
    </div>
  );

// Radio rings radiating from a point (wireless / antenna), animated by frame.
export const Rings: React.FC<{at: Pt; f: number; from: number; to: number; r?: number; color?: string; dir?: number}> = ({at, f, from, to, r = 120, color = C.sage, dir = -90}) => {
  if (f < from || f > to + 20) return null;
  const fade = tween(f, [from, from + 6], [0, 1]) * tween(f, [to, to + 20], [1, 0]);
  return (
    <g opacity={fade}>
      {[0, 1, 2].map((i) => {
        const t = (((f - from) / 24 + i / 3) % 1 + 1) % 1;
        const rr = 20 + t * r;
        const a0 = ((dir - 50) * Math.PI) / 180;
        const a1 = ((dir + 50) * Math.PI) / 180;
        return (
          <path
            key={i}
            d={`M${at[0] + rr * Math.cos(a0)} ${at[1] + rr * Math.sin(a0)} A${rr} ${rr} 0 0 1 ${at[0] + rr * Math.cos(a1)} ${at[1] + rr * Math.sin(a1)}`}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            opacity={1 - t}
          />
        );
      })}
    </g>
  );
};

export const countUp = (f: number, [a, b]: [number, number], value: number, decimals = 0) =>
  tween(f, [a, b], [0, value], Easing.out(Easing.cubic)).toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
