import { interpolate, useCurrentFrame } from 'remotion';
import React from 'react';

interface Props {
  startFrame: number;
  endFrame: number;
  children: React.ReactNode;
  direction?: 'left-to-right' | 'right-to-left' | 'top-to-bottom';
}

export const WipeMask: React.FC<Props> = ({
  startFrame,
  endFrame,
  children,
  direction = 'left-to-right',
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [startFrame, endFrame], [0, 100], {
    extrapolateLeft:  'clamp',
    extrapolateRight: 'clamp',
  });

  const clipPath =
    direction === 'left-to-right'  ? `inset(0 ${100 - progress}% 0 0)` :
    direction === 'right-to-left'  ? `inset(0 0 0 ${100 - progress}%)` :
                                     `inset(0 0 ${100 - progress}% 0)`;

  return (
    <div style={{ position: 'absolute', inset: 0, clipPath }}>
      {children}
    </div>
  );
};
