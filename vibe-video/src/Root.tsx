import React from 'react';
import { Composition } from 'remotion';
import { SmokeTest } from './SmokeTest';
import { BinaryGuess } from './binary/BinaryGuess';
import { WENKU_FRAMES, WenkuPromo } from './wenku/WenkuPromo';
import T from './timeline.json';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BinaryGuess"
        component={BinaryGuess}
        durationInFrames={T.end}
        fps={T.fps}
        width={1920}
        height={1080}
      />
      <Composition
        id="WenkuPromo"
        component={WenkuPromo}
        durationInFrames={WENKU_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="SmokeTest"
        component={SmokeTest}
        durationInFrames={60}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
