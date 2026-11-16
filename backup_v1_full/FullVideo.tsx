import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Watermark} from '../components';
import {C} from '../theme';
import {S12Device} from './S12Device';
import {S34Transfer} from './S34Transfer';
import {S5Shading} from './S5Shading';
import {S6Sensors} from './S6Sensors';
import {S7Final} from './S7Final';
import {SectionTag, Tray} from './shared';

// Full 75 s video (30 fps, 2250 frames). Sections overlap briefly so each hands off with camera motion.
export const FullVideo: React.FC<{watermark: string}> = ({watermark}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.cream, overflow: 'hidden'}}>
      {f < 522 && <S12Device f={f} />}
      {f >= 500 && f < 1070 && <S34Transfer f={f - 510} />}
      {f >= 1040 && f < 1392 && <S5Shading f={f - 1050} />}
      {f >= 1370 && f < 1840 && <S6Sensors f={f - 1380} />}
      {f >= 1800 && <S7Final f={f - 1800} />}
      <Tray f={f} />
      <SectionTag f={f} />
      {watermark && <Watermark text={watermark} top />}
    </AbsoluteFill>
  );
};
