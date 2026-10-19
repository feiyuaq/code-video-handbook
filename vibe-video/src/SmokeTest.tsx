import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export const SmokeTest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#11100e',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          fontSize: 120,
          color: '#e8dcc0',
          fontFamily: '"Microsoft YaHei", "SimSun", sans-serif',
          letterSpacing: 8,
        }}
      >
        环境就绪
      </div>
      <div
        style={{
          marginTop: 40,
          opacity,
          fontSize: 36,
          color: '#8a8272',
          fontFamily: '"Microsoft YaHei", sans-serif',
          letterSpacing: 4,
        }}
      >
        第 {frame} 帧 / 30fps
      </div>
    </AbsoluteFill>
  );
};
