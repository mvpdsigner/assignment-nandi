import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Watermark} from './components';
import {SceneDevice} from './SceneDevice';
import {SceneLocation} from './SceneLocation';
import {C} from './theme';

// 10 s preview: Scene 1 (device intro) and Scene 2 (location), condensed.
export const Preview: React.FC<{watermark: string}> = ({watermark}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.cream}}>
      {f < 176 && <SceneDevice f={f} />}
      <SceneLocation f={f} />
      {watermark && <Watermark text={watermark} />}
    </AbsoluteFill>
  );
};
