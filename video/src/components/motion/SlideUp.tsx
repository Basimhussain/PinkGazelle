import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';

interface Props {
  delay?: number;
  distance?: number;
  stiffness?: number;
  damping?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const SlideUp: React.FC<Props> = ({
  delay = 0,
  distance = 30,
  stiffness = 120,
  damping = 16,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: Math.max(0, frame - delay), fps, config: { stiffness, damping } });
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const translateY = interpolate(s, [0, 1], [distance, 0]);

  return (
    <div style={{ opacity, transform: `translateY(${translateY}px)`, ...style }}>
      {children}
    </div>
  );
};
