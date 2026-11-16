import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Crop} from '../components';
import {C, fontFamily, tween} from '../theme';
import {IMG, Icon, Photo, SLOT_CENTERS, arcPoint, countUp, pop, whip} from './shared';

// Section 5 (local 0 = global 1050): the same photo is analysed in Python, stage by stage.

const VIEW = {x: 760, y: 240, w: 920, h: 690};
const STEPS = ['Load image', 'Detect roof floor', 'Detect shaded areas'];

const Step: React.FC<{label: string; state: 'todo' | 'busy' | 'done'; f: number; doneAt: number}> = ({label, state, f, doneAt}) => {
  const tick = pop(f, doneAt, 30, 11);
  return (
    <div style={{display: 'flex', gap: 18, alignItems: 'center', marginBottom: 34, color: state === 'todo' ? '#9AAAA0' : C.dark, fontWeight: state === 'todo' ? 600 : 800}}>
      {state === 'done' ? (
        <Icon name="check" size={46} color={C.sage} style={{transform: `scale(${tick})`}} />
      ) : (
        <span
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            flex: 'none',
            border: state === 'busy' ? `6px solid ${C.dark}` : '4px solid #C9D6CC',
            borderRightColor: state === 'busy' ? '#C9D6CC' : undefined,
            transform: state === 'busy' ? `rotate(${f * 12}deg)` : undefined,
            boxSizing: 'border-box',
          }}
        />
      )}
      {label}
    </div>
  );
};

export const S5Shading: React.FC<{f: number}> = ({f}) => {
  // Window grows out of the Python window on the desktop.
  const grow = tween(f, [-6, 14], [0, 1], Easing.out(Easing.cubic));
  const win = {
    x: interpolate(grow, [0, 1], [1640, 100]),
    y: interpolate(grow, [0, 1], [240, 140]),
    s: interpolate(grow, [0, 1], [520 / 1720, 1]),
  };

  const drop = tween(f, [12, 32], [0, 1], Easing.out(Easing.cubic));
  const imgIn = tween(f, [26, 34], [0, 1]);
  const scanX = tween(f, [56, 150], [0, VIEW.w], Easing.inOut(Easing.quad));
  const scanning = f > 52 && f < 156;
  const pill34 = pop(f, 150);
  const greenOut = tween(f, [192, 222], [1, 0]);
  const orange = tween(f, [196, 244], [0, 1], Easing.inOut(Easing.cubic));
  const shaded = pop(f, 238);
  const state = (i: number): 'todo' | 'busy' | 'done' => {
    const [start, done] = [[0, 36], [46, 182], [186, 248]][i];
    return f >= done ? 'done' : f >= start ? 'busy' : 'todo';
  };
  const complete = tween(f, [250, 258], [0, 1]);

  // Result copy shrinks into the tray's Shading slot.
  const toTray = tween(f, [268, 300], [0, 1], Easing.inOut(Easing.cubic));
  const thumb = arcPoint([VIEW.x + VIEW.w / 2, VIEW.y + VIEW.h / 2], SLOT_CENTERS[1], 200, toTray);

  const out = f >= 320 ? whip(f, 330, -1, 'out') : {};

  return (
    <AbsoluteFill style={{...out}}>
      <AbsoluteFill style={{background: C.light, opacity: tween(f, [-6, 4], [0, 1])}} />
      <div
        style={{
          position: 'absolute',
          left: win.x,
          top: win.y,
          width: 1720,
          height: 860,
          transform: `scale(${win.s})`,
          transformOrigin: '0 0',
          background: '#fff',
          borderRadius: 22,
          overflow: 'hidden',
          boxShadow: '0 18px 50px rgba(40,51,45,.22)',
          fontFamily,
          opacity: tween(f, [-6, 0], [0, 1]),
        }}
      >
        <div style={{height: 60, background: C.light, display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px', fontSize: 28, fontWeight: 600, color: C.dark}}>
          <Icon name="code" size={36} />
          Python · shading analysis
          <span style={{marginLeft: 'auto', fontSize: 24, color: complete > 0.5 ? C.dark : C.sage}}>{complete > 0.5 ? '✓ complete' : '● running'}</span>
        </div>
        <div style={{position: 'absolute', left: 50, top: 120, width: 560, fontSize: 34, lineHeight: 1.35}}>
          {STEPS.map((label, i) => (
            <Step key={label} label={label} state={state(i)} f={f} doneAt={[36, 182, 248][i]} />
          ))}
        </div>

        {/* viewer: one photo, transformed in place */}
        <div style={{position: 'absolute', left: VIEW.x - 100, top: VIEW.y - 140, width: VIEW.w, height: VIEW.h, borderRadius: 10, overflow: 'hidden', background: '#EEF2EF', opacity: imgIn}}>
          <Crop src={IMG.stage1} nat={[800, 600]} box={[0, 0, 800, 600]} w={VIEW.w} h={VIEW.h} />
          <div style={{position: 'absolute', left: 0, top: 0, width: scanX, height: VIEW.h, overflow: 'hidden', opacity: greenOut}}>
            <Crop src={IMG.stage2} nat={[511, 399]} box={[25, 36, 465, 349]} w={VIEW.w} h={VIEW.h} />
          </div>
          <div style={{position: 'absolute', inset: 0, clipPath: `inset(${(1 - orange) * 100}% 0 0 0)`}}>
            <Crop src={IMG.stage3} nat={[1486, 1113]} box={[10, 3, 1466, 1100]} w={VIEW.w} h={VIEW.h} />
          </div>
          {orange > 0 && orange < 1 && <div style={{position: 'absolute', left: 0, right: 0, top: (1 - orange) * VIEW.h - 8, height: 16, background: '#F8F7F2', boxShadow: '0 0 30px 10px rgba(248,247,242,.8)', borderRadius: 8}} />}
          {scanning && (
            <>
              <div style={{position: 'absolute', left: scanX - 8, top: -10, width: 16, height: VIEW.h + 20, background: C.cream, boxShadow: '0 0 30px 10px rgba(248,247,242,.8)', borderRadius: 8}} />
              {[80, 180, 300, 420, 560].map((y, i) => (
                <div key={y} style={{position: 'absolute', left: scanX + 10 + ((f * 7 + i * 13) % 50), top: y, width: 16 + (i % 3) * 4, height: 16 + (i % 3) * 4, background: C.cream, opacity: 0.7}} />
              ))}
            </>
          )}
          <div style={{position: 'absolute', inset: 0, border: `6px solid ${C.sage}`, borderRadius: 10}} />
        </div>
        {pill34 > 0.01 && (
          <div style={{position: 'absolute', left: VIEW.x - 70, top: VIEW.y - 110, background: C.dark, color: '#fff', fontSize: 30, fontWeight: 700, padding: '10px 22px', borderRadius: 999, opacity: Math.min(1, pill34 * 1.5) * greenOut, transform: `scale(${0.8 + 0.2 * pill34})`, transformOrigin: 'left center'}}>
            Roof floor: {countUp(f, [150, 176], 34)}% of image
          </div>
        )}
        {shaded > 0.01 && (
          <div style={{position: 'absolute', left: VIEW.x - 70, top: VIEW.y - 110, background: '#D9822B', color: '#fff', fontSize: 30, fontWeight: 700, padding: '10px 22px', borderRadius: 999, opacity: Math.min(1, shaded * 1.5), transform: `scale(${0.8 + 0.2 * shaded})`, transformOrigin: 'left center'}}>
            Shaded Areas Detected
          </div>
        )}
      </div>

      {/* the photo drops into the viewer */}
      {f >= 10 && f < 36 && <Photo at={[1800 - (1800 - (VIEW.x + VIEW.w / 2)) * drop, 470 + (VIEW.y + VIEW.h / 2 - 470) * drop]} w={180 + (VIEW.w - 180) * drop} opacity={1 - imgIn} />}

      {/* copy of the result to the tray */}
      {f >= 268 && f < 302 && (
        <div style={{position: 'absolute', left: thumb[0], top: thumb[1], width: 920 - 800 * toTray, transform: 'translate(-50%,-50%)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 16px 40px rgba(40,51,45,.3)', opacity: tween(f, [294, 302], [1, 0])}}>
          <Crop src={IMG.stage3} nat={[1486, 1113]} box={[10, 3, 1466, 1100]} w={920 - 800 * toTray} h={(920 - 800 * toTray) * 0.75} style={{position: 'relative'}} />
        </div>
      )}
    </AbsoluteFill>
  );
};
