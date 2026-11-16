import React from 'react';
import {loadFont} from '@remotion/google-fonts/JetBrainsMono';
import {staticFile} from 'remotion';
import {Crop} from '../components';
import {C} from '../theme';

// Approved UI (client, draft 2 feedback): light "frosted sage" glass (Liquid_Glass_Options.pdf, option B).
// Option C (smoked green) is kept in backup_v1_full/glass_smoked_C.tsx.

export const {fontFamily: mono} = loadFont('normal', {weights: ['500', '700', '800'], subsets: ['latin']});

export const INK = '#264438';
export const SOFT = 'rgba(38,68,56,.66)';
export const EDGE = 'rgba(38,68,56,.16)';
export const ORANGE = '#D9822B';
export const ACC = C.dark; // accent fill (active tab, check, filled slot), white text on it
export const TRACK = 'rgba(38,68,56,.16)'; // empty bars, rings, tracks
export const HAIR = 'rgba(38,68,56,.13)'; // hairlines, grid
// Light app screen (phones, desktop windows) behind inner tiles.
export const SCREEN = 'linear-gradient(170deg, #F4F8F5, #E3ECE5 55%, #D5E2D8)';

const FILTER = 'blur(30px) saturate(150%)';

// Lens refraction: the edges of each glass shape bend what is behind it. Render once per composition.
const MAP_X =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' preserveAspectRatio='none'%3E%3ClinearGradient id='g'%3E%3Cstop offset='0' stop-color='%23000'/%3E%3Cstop offset='.1' stop-color='%23800000'/%3E%3Cstop offset='.9' stop-color='%23800000'/%3E%3Cstop offset='1' stop-color='%23ff0000'/%3E%3C/linearGradient%3E%3Crect width='100' height='100' fill='url(%23g)'/%3E%3C/svg%3E";
const MAP_Y =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' preserveAspectRatio='none'%3E%3ClinearGradient id='g' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23000'/%3E%3Cstop offset='.12' stop-color='%23008000'/%3E%3Cstop offset='.88' stop-color='%23008000'/%3E%3Cstop offset='1' stop-color='%2300ff00'/%3E%3C/linearGradient%3E%3Crect width='100' height='100' fill='url(%23g)'/%3E%3C/svg%3E";

export const GlassDefs: React.FC = () => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <filter id="lens" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB" primitiveUnits="objectBoundingBox">
      <feImage x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="mx" href={MAP_X} />
      <feImage x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="my" href={MAP_Y} />
      <feComposite in="mx" in2="my" operator="arithmetic" k2={1} k3={1} result="map" />
      <feDisplacementMap in="SourceGraphic" in2="map" scale={-0.11} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </svg>
);

export const glassStyle = (r = 34, drop = 0.18): React.CSSProperties => ({
  background: 'linear-gradient(140deg,rgba(244,248,245,.74),rgba(221,232,223,.52))',
  backdropFilter: FILTER,
  WebkitBackdropFilter: FILTER,
  borderRadius: r,
  boxShadow: `inset 0 1.5px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(255,255,255,.14), 0 28px 70px rgba(40,51,45,${drop})`,
  color: INK,
});

// Specular highlight + gradient rim (the board's ::before / ::after).
export const GlassSheen: React.FC = () => (
  <>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        pointerEvents: 'none',
        background: 'radial-gradient(90% 55% at 18% 0%,rgba(255,255,255,.6),transparent 60%)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        padding: 1.6,
        pointerEvents: 'none',
        background: 'linear-gradient(135deg,rgba(255,255,255,1) 0%,rgba(255,255,255,0) 32%,rgba(255,255,255,0) 62%,rgba(255,255,255,.7) 100%)',
        WebkitMask: 'linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
      }}
    />
  </>
);

export const Glass: React.FC<{r?: number; drop?: number; style?: React.CSSProperties; children?: React.ReactNode}> = ({r = 34, drop, style, children}) => (
  <div style={{position: 'absolute', ...glassStyle(r, drop), ...style}}>
    {children}
    <GlassSheen />
  </div>
);

// Inner tile inside a glass panel.
export const innerStyle = (r = 22, lit = 0): React.CSSProperties => ({
  background: lit > 0 ? `rgba(125,157,134,${0.12 + 0.4 * lit})` : 'rgba(255,255,255,.5)',
  borderRadius: r,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,1), inset 0 0 0 ${1 + lit}px rgba(${lit > 0 ? '53,92,77' : '255,255,255'},${lit > 0 ? 0.25 + 0.35 * lit : 0.6})`,
});

export const Lab: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{fontFamily: mono, fontSize: 14, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: SOFT, whiteSpace: 'nowrap', ...style}}>{children}</div>
);

export const Val: React.FC<{v: React.ReactNode; unit?: string; size?: number; style?: React.CSSProperties}> = ({v, unit, size = 40, style}) => (
  <div style={{fontFamily: mono, fontWeight: 800, fontSize: size, color: INK, letterSpacing: -1, whiteSpace: 'nowrap', ...style}}>
    {v}
    {unit && <span style={{fontSize: size * 0.42, fontWeight: 500, color: SOFT, marginLeft: 8, letterSpacing: 0}}>{unit}</span>}
  </div>
);

// Window title-bar dots.
export const Dots: React.FC = () => (
  <div style={{display: 'flex', gap: 9}}>
    {[0, 1, 2].map((i) => (
      <i key={i} style={{width: 14, height: 14, borderRadius: '50%', background: i === 0 ? C.dark : 'rgba(38,68,56,.2)'}} />
    ))}
  </div>
);

// Backdrop for app screens: the device render, desaturated under a light sage wash, drifting slowly so the lens edges visibly bend it.
export const Wall: React.FC<{f: number}> = ({f}) => (
  <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
    <div style={{position: 'absolute', inset: -60, transform: `translate(${Math.sin(f / 90) * 30}px, ${Math.cos(f / 110) * 16}px) scale(1.04)`}}>
      <Crop src={staticFile('device_render_clean.jpg')} nat={[1536, 1024]} box={[0, 70, 1536, 864]} w={2040} h={1200} style={{filter: 'saturate(.25) contrast(1.05)'}} />
    </div>
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(160deg,rgba(221,232,223,.55),rgba(125,157,134,.28))', mixBlendMode: 'multiply'}} />
  </div>
);
