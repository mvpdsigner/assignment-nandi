import React from 'react';
import {Composition} from 'remotion';
import {Preview} from './Preview';
import {PreviewIso} from './PreviewIso';
import {FullVideo} from './full/FullVideo';
import {DashMotion} from './dash/DashMotion';

export const Root: React.FC = () => (
  <>
    <Composition
      id="Preview"
      component={Preview}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{watermark: 'TutorBin'}}
    />
    <Composition
      id="PreviewIso"
      component={PreviewIso}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{watermark: 'TutorBin'}}
    />
    <Composition
      id="FullVideo"
      component={FullVideo}
      durationInFrames={2250}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{watermark: 'TutorBin'}}
    />
    <Composition
      id="DashMotion"
      component={DashMotion}
      durationInFrames={210}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{watermark: 'TutorBin'}}
    />
  </>
);
