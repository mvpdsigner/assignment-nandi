import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Crop} from '../components';
import {C, fontFamily, tween} from '../theme';
import {Dots, GlassSheen, HAIR, INK, Lab, ORANGE, SOFT, TRACK, Wall, glassStyle, innerStyle, mono} from './glass';
import {IMG, Icon, Photo, SLOT_CENTERS, arcPoint, countUp, pop, whip} from './shared';

// Section 5 (local 0 = global 1050): the same photo is analysed in Python, stage by stage.

const VIEW = {x: 760, y: 240, w: 920, h: 690};
const STEPS = ['Load image', 'Detect roof floor', 'Detect shaded areas'];

const DETAIL = ['img_01.jpg · 800 × 600', '34% of image', 'Shaded Areas Detected'];
const Step: React.FC<{i: number; label: string; state: 'todo' | 'busy' | 'done'; f: number; doneAt: number}> = ({i, label, state, f, doneAt}) => {
  const tick = pop(f, doneAt, 30, 11);
  const warn = i === 2 && state === 'done';
  return (
    <div
      style={{
        position: 'relative',
        height: 118,
        marginBottom: 16,
        padding: '18px 22px',
        boxSizing: 'border-box',
        ...innerStyle(18, state === 'busy' ? 0.25 : 0),
        boxShadow: warn ? `inset 0 0 0 2px ${ORANGE}` : innerStyle(18, state === 'busy' ? 0.25 : 0).boxShadow,
        opacity: state === 'todo' ? 0.55 : 1,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 10, fontFamily: mono, fontSize: 15, fontWeight: 800, letterSpacing: '.12em', color: warn ? ORANGE : SOFT}}>
        {`0${i + 1} · ${state === 'done' ? 'DONE' : state === 'busy' ? 'RUNNING' : 'WAITING'}`}
        {state === 'busy' && <span style={{width: 16, height: 16, borderRadius: '50%', border: `3px solid ${C.dark}`, borderRightColor: 'transparent', transform: `rotate(${f * 12}deg)`, boxSizing: 'border-box'}} />}
        {state === 'done' && <Icon name="check" size={24} color={warn ? ORANGE : C.sage} style={{marginLeft: 'auto', transform: `scale(${tick})`}} />}
      </div>
      <div style={{fontSize: 27, fontWeight: 800, marginTop: 8, color: INK}}>{label}</div>
      <div style={{fontFamily: mono, fontSize: 16, color: SOFT, marginTop: 4, opacity: tick}}>{state === 'done' ? DETAIL[i] : ''}</div>
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
      <AbsoluteFill style={{opacity: tween(f, [-6, 4], [0, 1])}}>
        <Wall f={f} />
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: win.x,
          top: win.y,
          width: 1720,
          height: 860,
          transform: `scale(${win.s})`,
          transformOrigin: '0 0',
          ...glassStyle(30),
          fontFamily,
          opacity: tween(f, [-6, 0], [0, 1]),
        }}
      >
        <div style={{height: 64, display: 'flex', alignItems: 'center', gap: 18, padding: '0 26px', borderBottom: `1.5px solid ${HAIR}`, fontSize: 27, fontWeight: 800}}>
          <Dots />
          Python · Shading analysis
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: mono,
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: '.1em',
              padding: '8px 16px',
              borderRadius: 999,
              background: complete > 0.5 ? C.dark : 'rgba(255,255,255,.55)',
              color: complete > 0.5 ? '#fff' : INK,
            }}
          >
            {complete > 0.5 ? '✓ COMPLETE' : '● RUNNING'}
          </span>
        </div>
        <div style={{position: 'absolute', left: 36, top: 96, width: 560}}>
          <Lab style={{marginBottom: 16}}>Pipeline</Lab>
          {STEPS.map((label, i) => (
            <Step key={label} i={i} label={label} state={state(i)} f={f} doneAt={[36, 182, 248][i]} />
          ))}
          <Lab style={{marginTop: 26}}>Progress</Lab>
          <div style={{height: 12, borderRadius: 6, background: TRACK, marginTop: 14, overflow: 'hidden'}}>
            <div style={{width: `${tween(f, [0, 248], [0, 100], Easing.linear)}%`, height: '100%', background: C.dark, borderRadius: 6}} />
          </div>
        </div>

        {/* viewer: one photo, transformed in place */}
        <div style={{position: 'absolute', left: VIEW.x - 100, top: VIEW.y - 140, width: VIEW.w, height: VIEW.h, borderRadius: 18, overflow: 'hidden', background: 'rgba(40,51,45,.5)', opacity: imgIn}}>
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
          <div style={{position: 'absolute', inset: 0, borderRadius: 18, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.8)'}} />
        </div>
        {pill34 > 0.01 && (
          <div style={{position: 'absolute', left: VIEW.x - 76, top: VIEW.y - 116, ...glassStyle(999, 0.25), fontFamily: mono, fontSize: 24, fontWeight: 800, padding: '10px 20px', opacity: Math.min(1, pill34 * 1.5) * greenOut, transform: `scale(${0.8 + 0.2 * pill34})`, transformOrigin: 'left center'}}>
            Roof floor: {countUp(f, [150, 176], 34)}% of image
          </div>
        )}
        {shaded > 0.01 && (
          <div style={{position: 'absolute', left: VIEW.x - 76, top: VIEW.y - 116, background: ORANGE, color: '#fff', fontFamily: mono, fontSize: 24, fontWeight: 800, padding: '10px 20px', borderRadius: 999, boxShadow: '0 10px 26px rgba(40,51,45,.3)', opacity: Math.min(1, shaded * 1.5), transform: `scale(${0.8 + 0.2 * shaded})`, transformOrigin: 'left center'}}>
            Shaded Areas Detected
          </div>
        )}
        {/* legend */}
        <div style={{position: 'absolute', left: VIEW.x - 100, top: VIEW.y - 140 + VIEW.h + 16, display: 'flex', gap: 14, fontFamily: mono, fontSize: 15, fontWeight: 800, letterSpacing: '.1em'}}>
          {[
            ['ROOF FLOOR', '#3FA34D', 150],
            ['SHADED AREAS DETECTED', ORANGE, 238],
          ].map(([t, c, at]) => (
            <div key={t as string} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 999, ...innerStyle(999), boxShadow: `inset 0 0 0 1.5px ${c}`, opacity: tween(f, [at as number, (at as number) + 10], [0, 1])}}>
              <i style={{width: 14, height: 14, borderRadius: 3, background: c as string}} />
              {t}
            </div>
          ))}
        </div>
        <GlassSheen />
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
