import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';

interface Props {
  children: React.ReactNode[];
  startFrame?: number;
  staggerFrames?: number;
  direction?: 'up' | 'left' | 'right';
  distance?: number;
  stiffness?: number;
  damping?: number;
}

export const StaggerList: React.FC<Props> = ({
  children,
  startFrame = 0,
  staggerFrames = 8,
  direction = 'up',
  distance = 30,
  stiffness = 120,
  damping = 16,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <>
      {React.Children.map(children, (child, i) => {
        const delay = startFrame + i * staggerFrames;
        const s = spring({ frame: Math.max(0, frame - delay), fps, config: { stiffness, damping } });
        const opacity = interpolate(s, [0, 1], [0, 1]);
        const translate = interpolate(s, [0, 1], [distance, 0]);
        const transform =
          direction === 'up'    ? `translateY(${translate}px)`  :
          direction === 'left'  ? `translateX(${-translate}px)` :
                                  `translateX(${translate}px)`;
        return (
          <div key={i} style={{ opacity, transform }}>
            {child}
          </div>
        );
      })}
    </>
  );
};
