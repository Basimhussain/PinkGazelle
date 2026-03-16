import { interpolate, useCurrentFrame } from 'remotion';
import React from 'react';
import { colors } from '../../design/tokens';

interface Segment {
  targetWidth: number;
  color: string;
}

interface Props {
  startFrame: number;
  endFrame: number;
  /** Single bar */
  targetWidth?: number;
  color?: string;
  /** Multi-segment bar (overrides targetWidth/color) */
  segments?: Segment[];
  height?: number;
  borderRadius?: number;
}

export const AnimatedBar: React.FC<Props> = ({
  startFrame,
  endFrame,
  targetWidth,
  color = colors.accent,
  segments,
  height = 6,
  borderRadius = 9999,
}) => {
  const frame = useCurrentFrame();

  if (segments) {
    return (
      <div style={{ display: 'flex', height, borderRadius, overflow: 'hidden', background: colors.bgMuted }}>
        {segments.map((seg, i) => {
          const w = interpolate(frame, [startFrame + i * 4, endFrame], [0, seg.targetWidth], {
            extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          });
          return (
            <div key={i} style={{ width: `${w}%`, background: seg.color, height: '100%' }} />
          );
        })}
      </div>
    );
  }

  const width = interpolate(frame, [startFrame, endFrame], [0, targetWidth ?? 0], {
    extrapolateLeft:  'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ background: colors.bgMuted, borderRadius, height, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${width}%`,
        background: color === colors.accent
          ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
          : color,
        borderRadius,
      }} />
    </div>
  );
};
