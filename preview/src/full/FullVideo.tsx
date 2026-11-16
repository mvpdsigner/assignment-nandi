import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Watermark} from '../components';
import {C} from '../theme';
import {GlassDefs} from './glass';
import {S12Device} from './S12Device';
import {S34Transfer} from './S34Transfer';
import {S5Shading} from './S5Shading';
import {S6Sensors} from './S6Sensors';
import {S7Final} from './S7Final';
import {STracker} from './STracker';
import {SectionTag, T, Tray} from './shared';

// Full 75 s video (30 fps, 2250 frames). Sections overlap briefly so each hands off with camera motion.
// Second draft: faster component tour, new sun tracker cycle before the sensors, glass UI throughout.
export const FullVideo: React.FC<{watermark: string}> = ({watermark}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.cream, overflow: 'hidden'}}>
      <GlassDefs />
      {f < T.s34 + 12 && <S12Device f={f} />}
      {f >= T.s34 - 10 && f < T.s34 + 560 && <S34Transfer f={f - T.s34} />}
      {f >= T.s5 - 10 && f < T.trk + 12 && <S5Shading f={f - T.s5} />}
      {f >= T.trk - 10 && f < T.s6 + 10 && <STracker f={f - T.trk} />}
      {f >= T.s6 - 10 && f < T.s7 + 16 && <S6Sensors f={f - T.s6} />}
      {f >= T.s7 && <S7Final f={f - T.s7} />}
      <Tray f={f} />
      <SectionTag f={f} />
      {watermark && <Watermark text={watermark} top />}
    </AbsoluteFill>
  );
};
