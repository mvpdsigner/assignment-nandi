import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate} from 'remotion';
import {Crop} from '../components';
import {Box, C, boxAt, fontFamily, tween} from '../theme';
import {IMG, Icon, Lbl, LilyGo, Photo, Pt, RENDER_NAT, RouteBar, Rings, arcPath, arcPoint, cropToScreen, pop, whip} from './shared';

// Sections 3–4 (local 0 = global 510): capture, wireless hop to the LilyGo, cellular → ngrok → Flask → desktop.

const LENS: Pt = [728, 205];
const BESIDE_HEAD: Pt = [930, 150];
const BOARD: Pt = [480, 495];

const CAM_KEYS: {f: number; box: Box}[] = [
  {f: 0, box: [600, 80, 330, 186]},
  {f: 70, box: [615, 92, 300, 169]},
  {f: 96, box: [615, 92, 300, 169]},
  {f: 150, box: [560, 60, 560, 315]},
  {f: 178, box: [560, 60, 560, 315]},
  {f: 205, box: [280, 90, 960, 540]},
];

// Journey strip (section 4B), in world coordinates.
const ANTENNA: Pt = [445, 520];
const TOWER_TOP: Pt = [1000, 330];
const TUNNEL_IN: Pt = [1650, 520];
const TUNNEL_OUT: Pt = [1950, 520];
const FLASK: Pt = [2615, 470];
const HOPS: [number, number, Pt, Pt, number][] = [
  [292, 322, ANTENNA, TOWER_TOP, 120],
  [332, 356, TOWER_TOP, TUNNEL_IN, 80],
  [356, 372, TUNNEL_IN, TUNNEL_OUT, 0],
  [376, 402, TUNNEL_OUT, FLASK, 90],
];
const journeyAt = (f: number): Pt => {
  let last = ANTENNA;
  for (const [a, b, from, to, lift] of HOPS) {
    if (f < a) return last;
    if (f <= b) return arcPoint(from, to, lift, tween(f, [a, b], [0, 1], Easing.inOut(Easing.cubic)));
    last = to;
  }
  return last;
};

const Cloud: React.FC = () => (
  <svg width={600} height={400} viewBox="1500 300 600 400" style={{position: 'absolute', left: 1500, top: 300}}>
    <path d="M1600 640h330a95 95 0 0 0 0-190 150 150 0 0 0-290-30 120 120 0 0 0-40 220z" fill="#fff" stroke={C.dark} strokeWidth={8} />
    <ellipse cx={1650} cy={520} rx={34} ry={64} fill={C.char} />
    <ellipse cx={1950} cy={520} rx={34} ry={64} fill={C.char} />
    <rect x={1650} y={456} width={300} height={128} fill={C.char} opacity={0.12} />
    <text x={1800} y={420} fontSize={48} fontWeight={800} fill={C.dark} textAnchor="middle" fontFamily={fontFamily}>
      ngrok
    </text>
  </svg>
);

const Tower: React.FC<{x: number}> = ({x}) => (
  <svg width={200} height={600} viewBox="0 0 48 144" style={{position: 'absolute', left: x - 100, top: 300, color: C.dark}}>
    <g fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
      <path d="M24 20L8 140M24 20l16 120M14 100h20M18 60h12M12 120h24" />
      <circle cx={24} cy={17} r={4} />
    </g>
  </svg>
);

export const S34Transfer: React.FC<{f: number}> = ({f}) => {
  const box = boxAt(f, CAM_KEYS);
  const s = Math.max(1920 / box[2], 1080 / box[3]);
  const lens = cropToScreen(box, LENS);
  const rawBeside = cropToScreen(box, BESIDE_HEAD);
  const beside: Pt = [Math.min(rawBeside[0], 1380), Math.max(rawBeside[1], 330)];
  const board = cropToScreen(box, BOARD);

  // ---- section 3: capture
  const brackets = pop(f, 18, 30, 16) * tween(f, [72, 80], [1, 0]);
  const bh = 26 * s * (1.3 - 0.3 * brackets);
  const recOn = f > 24 && f < 72 && Math.floor(f / 8) % 2 === 0;
  const flash = interpolate(f, [74, 77, 94], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // Photo: out of the lens (80–100), beside the head, then wirelessly to the board (205–245).
  const popP = pop(f, 80, 30, 11);
  const outT = tween(f, [80, 100], [0, 1], Easing.out(Easing.cubic));
  const flyT = tween(f, [205, 245], [0, 1], Easing.inOut(Easing.cubic));
  const photoPos: Pt = f < 205 ? arcPoint(lens, beside, 80, outT) : arcPoint(beside, board, 160, flyT);
  const photoW = (f < 205 ? Math.min(480, 140 * s) * popP : interpolate(flyT, [0, 1], [Math.min(480, 140 * s), 120])) * tween(f, [244, 250], [1, 0]);
  const photoRot = f < 205 ? -3 * popP : -3 + flyT * 10;

  // ---- 4A: wireless + x-ray inset
  const dimA = tween(f, [185, 205], [0, 0.35]);
  const wifiLbl = pop(f, 200) * tween(f, [262, 270], [1, 0]);
  const inset = pop(f, 222);
  const insetPhoto = pop(f, 248, 30, 12);
  const sim = tween(f, [250, 262], [0, 1]);
  const zoomThrough = tween(f, [268, 292], [0, 1], Easing.in(Easing.cubic));

  // ---- 4B: journey strip
  const journeyIn = tween(f, [276, 292], [0, 1]);
  const jp = journeyAt(f);
  const pan = tween(f, [432, 460], [0, 1920], Easing.inOut(Easing.cubic));
  const camX = Math.max(960, jp[0]);
  const worldX = 960 - camX - pan;
  const moving = HOPS.some(([a, b]) => f > a && f < b);
  const inTunnel = f > 356 && f < 374;
  const ghosts = moving && !inTunnel ? [4, 8].map((d) => journeyAt(f - d)) : [];

  // ---- 4C: desktop
  const deskX = 1920 - pan;
  const landT = tween(f, [434, 466], [0, 1], Easing.inOut(Easing.cubic));
  const flyFrom: Pt = [960 - (pan > 0 ? 0 : 0), 470];
  const deskPhoto = arcPoint(flyFrom, [890, 420], 160, landT);
  const landed = f >= 466;
  const bounce = interpolate(f, [466, 472, 480], [1, 1.12, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const saved = pop(f, 474);
  const pyIn = tween(f, [488, 506], [0, 1], Easing.out(Easing.cubic));
  const dragT = tween(f, [506, 526], [0, 1], Easing.inOut(Easing.cubic));
  const zoomPy = tween(f, [522, 556], [0, 1], Easing.in(Easing.cubic));

  const route = f < 246 ? 0 : f < 292 ? 1 : f < 340 ? 2 : f < 378 ? 3 : f < 440 ? 4 : 5;
  const routeShow = tween(f, [190, 202], [0, 1]) * tween(f, [512, 524], [1, 0]);

  const inStyle = f < 12 ? whip(f, 0, -1, 'in') : {};

  return (
    <AbsoluteFill style={{background: C.cream, ...inStyle}}>
      {/* ---- sections 3 + 4A on the device render */}
      {f < 292 && (
        <AbsoluteFill style={{opacity: 1 - journeyIn}}>
          <Crop src={IMG.render} nat={RENDER_NAT} box={box} w={1920} h={1080} />
          <AbsoluteFill style={{background: C.char, opacity: dimA}} />
          <svg width={1920} height={1080} style={{position: 'absolute'}}>
            {brackets > 0.01 && (
              <g fill="none" stroke={C.cream} strokeWidth={10} strokeLinecap="round" opacity={brackets}>
                <path d={`M${lens[0] - bh + 50} ${lens[1] - bh}h-50v50M${lens[0] + bh - 50} ${lens[1] - bh}h50v50M${lens[0] - bh + 50} ${lens[1] + bh}h-50v-50M${lens[0] + bh - 50} ${lens[1] + bh}h50v-50`} />
              </g>
            )}
            {recOn && <circle cx={lens[0] + 30 * s} cy={lens[1] - 28 * s} r={12} fill="#C0392B" />}
            {f > 196 && f < 262 && <path d={arcPath(beside, board, 160)} fill="none" stroke={C.light} strokeWidth={8} strokeDasharray="2 22" strokeLinecap="round" opacity={tween(f, [196, 206], [0, 1]) * tween(f, [250, 262], [1, 0])} />}
            <Rings at={lens} f={f} from={186} to={244} dir={130} color={C.cream} />
            <Rings at={board} f={f} from={226} to={262} dir={-50} color={C.cream} />
            {inset > 0.01 && (
              <g opacity={inset * (1 - zoomThrough)}>
                <circle cx={board[0]} cy={board[1]} r={110 * inset} fill="none" stroke={C.light} strokeWidth={6} />
                <path d={`M${board[0] + 110} ${board[1] - 20} C900 ${board[1] - 30} 1000 700 1150 640`} fill="none" stroke={C.light} strokeWidth={5} strokeDasharray="14 12" />
              </g>
            )}
          </svg>
          {flash > 0 && <AbsoluteFill style={{background: `radial-gradient(circle at ${lens[0]}px ${lens[1]}px, #fff 0, #fff 140px, rgba(255,255,255,.85) 260px, rgba(255,255,255,.4) 640px, rgba(255,255,255,.2) 1100px)`, opacity: flash}} />}
          <Lbl x={1250} y={170} p={pop(f, 22) * tween(f, [74, 80], [1, 0])} title="ESP32-CAM" sub="tracker sensor head" icon="cam" />
          <Lbl x={1150} y={190} p={wifiLbl} title="Wireless link" sub="ESP32-CAM → LilyGo" />
          {inset > 0.01 && (
            <div
              style={{
                position: 'absolute',
                left: 1150,
                top: 390,
                width: 700,
                height: 420,
                padding: '26px 30px',
                background: '#fff',
                borderRadius: 28,
                boxShadow: '0 14px 40px rgba(40,51,45,.2)',
                fontFamily,
                color: C.dark,
                opacity: Math.min(1, inset * 1.4) * (1 - tween(f, [280, 292], [0, 1])),
                transform: `scale(${(0.85 + 0.15 * inset) * (1 + zoomThrough * 1.6)})`,
                transformOrigin: '200px 230px',
              }}
            >
              <div style={{fontSize: 26, fontWeight: 700, color: '#5E6E64'}}>Inside the electronics enclosure: main board</div>
              <LilyGo w={420} glow={sim} style={{position: 'absolute', left: 40, top: 80}} />
              <div style={{position: 'absolute', left: 30, top: 360, fontSize: 28, fontWeight: 700}}>LilyGo (ESP32 + SIM)</div>
              <Photo at={[560, 240]} w={170 * insetPhoto} rot={3} />
            </div>
          )}
          {f >= 80 && <Photo at={photoPos} w={photoW} rot={photoRot} />}
        </AbsoluteFill>
      )}

      {/* ---- 4B journey + 4C desktop */}
      {f >= 270 && (
        <AbsoluteFill style={{opacity: journeyIn, transform: `scale(${1.15 - 0.15 * journeyIn})`, background: `linear-gradient(${C.cream}, ${C.light})`}}>
          <div style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, transform: `translateX(${worldX}px)`}}>
            <div style={{position: 'absolute', left: -2000, top: 900, width: 9000, height: 180, background: '#CAD9CE'}} />
            <LilyGo w={300} glow={tween(f, [286, 292], [1, 0.3])} style={{position: 'absolute', left: 180, top: 560}} />
            <Tower x={1000} />
            <Cloud />
            <div style={{position: 'absolute', left: 2500, top: 360, width: 230, height: 250, background: '#fff', border: `6px solid ${C.dark}`, borderRadius: 26}}>
              <Icon name="server" size={130} style={{position: 'absolute', left: 45, top: 30}} />
              <div style={{position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center', fontFamily, fontSize: 36, fontWeight: 800, color: C.dark}}>Flask</div>
              {f > 402 && f < 432 && Math.floor(f / 4) % 2 === 0 && <div style={{position: 'absolute', left: 62, top: 50, width: 16, height: 16, borderRadius: 8, background: C.sage}} />}
            </div>
            <svg width={3200} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
              <Rings at={ANTENNA} f={f} from={284} to={300} dir={-60} />
              <Rings at={TOWER_TOP} f={f} from={316} to={338} dir={-90} r={160} />
              {[HOPS[0], HOPS[1], HOPS[3]].map(([a, , from, to, lift], i) => (
                <path key={i} d={arcPath(from, to, lift)} fill="none" stroke={C.dark} strokeWidth={6} strokeDasharray="4 16" strokeLinecap="round" opacity={f > a ? 0.5 : 0} />
              ))}
              {f > 402 && <ellipse cx={FLASK[0]} cy={600} rx={150 * tween(f, [402, 420], [0.3, 1])} ry={40 * tween(f, [402, 420], [0.3, 1])} fill="none" stroke={C.sage} strokeWidth={6} opacity={tween(f, [402, 420], [1, 0])} />}
            </svg>
            <Lbl x={160} y={780} p={pop(f, 284)} title="LilyGo" sub="ESP32 + SIM · cellular" />
            <Lbl x={880} y={790} p={pop(f, 300)} title="Cellular network" />
            <Lbl x={1680} y={690} p={pop(f, 336)} title="ngrok" sub="public tunnel" />
            <Lbl x={2490} y={640} p={pop(f, 380)} title="Flask server" sub="receives & saves" />
            {f < 434 &&
              ghosts.map((g, i) => <Photo key={i} at={g} w={150} opacity={0.3 - i * 0.15} />)}
            {f < 434 && <Photo at={jp} w={150 * pop(f, 286)} opacity={inTunnel ? 0 : 1} rot={moving ? -4 : 0} />}
          </div>

          {/* desktop scene enters from the right as the world keeps panning */}
          <div style={{position: 'absolute', inset: 0, transform: `translateX(${deskX}px) scale(${1 + zoomPy * 2.2})`, transformOrigin: '1800px 460px', opacity: 1 - tween(f, [546, 558], [0, 1])}}>
            <div style={{position: 'absolute', left: 400, top: 120, width: 1120, height: 700, background: C.char, borderRadius: 28}} />
            <div style={{position: 'absolute', left: 860, top: 820, width: 200, height: 90, background: '#5E6E64'}} />
            <div style={{position: 'absolute', left: 760, top: 900, width: 400, height: 26, borderRadius: 13, background: '#5E6E64'}} />
            <div style={{position: 'absolute', left: 440, top: 160, width: 1040, height: 620, background: '#fff', borderRadius: 12, overflow: 'hidden', fontFamily}}>
              <div style={{height: 60, background: C.light, display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px', fontSize: 28, fontWeight: 600, color: C.dark}}>
                <i style={{width: 18, height: 18, borderRadius: '50%', background: C.sage}} />
                <i style={{width: 18, height: 18, borderRadius: '50%', background: '#C9D6CC'}} />
                <i style={{width: 18, height: 18, borderRadius: '50%', background: '#C9D6CC'}} />
                <span style={{marginLeft: 20}}>Received_Images</span>
              </div>
              <Icon name="folder" size={150} color={C.sage} style={{position: 'absolute', left: 60, top: 110, transform: `scale(${bounce})`}} />
              <div style={{position: 'absolute', left: 660, top: 170, display: 'flex', alignItems: 'center', gap: 14, fontSize: 34, fontWeight: 700, color: C.dark, opacity: saved, transform: `scale(${0.8 + 0.2 * saved})`, transformOrigin: 'left center'}}>
                <Icon name="check" size={54} color={C.sage} />
                Saved to desktop
              </div>
            </div>
            <div style={{position: 'absolute', left: 1640 + (1 - pyIn) * 400, top: 240, width: 520, height: 440, background: '#fff', borderRadius: 22, boxShadow: '0 18px 50px rgba(40,51,45,.22)', overflow: 'hidden', opacity: pyIn, fontFamily}}>
              <div style={{height: 60, background: C.light, display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px', fontSize: 28, fontWeight: 600, color: C.dark}}>
                <Icon name="code" size={34} />
                Python
              </div>
            </div>
            {landed && <Photo at={[890, 420]} w={320} caption="img_01.jpg" glow={saved} />}
            {f >= 506 && <Photo at={[890 + (1800 - 890) * dragT, 420 + (470 - 420) * dragT - Math.sin(Math.PI * dragT) * 80]} w={320 - 140 * dragT} rot={dragT * 4} />}
          </div>
          {f >= 434 && !landed && <Photo at={deskPhoto} w={150 + 170 * landT} rot={-4 + 4 * landT} />}
        </AbsoluteFill>
      )}

      <RouteBar active={route} show={routeShow} />
    </AbsoluteFill>
  );
};
