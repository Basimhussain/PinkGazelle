import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';

interface Props {
  delay?: number;
  stiffness?: number;
  damping?: number;
  fromScale?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const FadeScale: React.FC<Props> = ({
  delay = 0,
  stiffness = 100,
  damping = 15,
  fromScale = 0.85,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: Math.max(0, frame - delay), fps, config: { stiffness, damping } });
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const scale = interpolate(s, [0, 1], [fromScale, 1]);

  return (
    <div style={{ opacity, transform: `scale(${scale})`, ...style }}>
      {children}
    </div>
  );
};
