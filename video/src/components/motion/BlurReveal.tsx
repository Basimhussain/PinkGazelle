import { interpolate, useCurrentFrame } from 'remotion';
import React from 'react';

interface Props {
  startFrame: number;
  endFrame: number;
  children: React.ReactNode;
  maxBlur?: number;
  style?: React.CSSProperties;
}

export const BlurReveal: React.FC<Props> = ({
  startFrame,
  endFrame,
  children,
  maxBlur = 8,
  style,
}) => {
  const frame = useCurrentFrame();
  const blur = interpolate(frame, [startFrame, endFrame], [maxBlur, 0], {
    extrapolateLeft:  'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(frame, [startFrame, endFrame], [0, 1], {
    extrapolateLeft:  'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ filter: `blur(${blur}px)`, opacity, ...style }}>
      {children}
    </div>
  );
};
