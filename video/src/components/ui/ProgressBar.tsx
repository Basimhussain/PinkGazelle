import React from 'react';
import { colors, radius } from '../../design/tokens';

interface Props {
  percent: number;
  height?: number;
  color?: string;
}

export const ProgressBar: React.FC<Props> = ({
  percent,
  height = 6,
  color = colors.accent,
}) => {
  return (
    <div style={{
      background:   colors.bgMuted,
      borderRadius: radius.full,
      height,
      overflow:     'hidden',
    }}>
      <div style={{
        height:       '100%',
        width:        `${Math.min(100, percent)}%`,
        background:   'linear-gradient(90deg, #6366f1, #8b5cf6)',
        borderRadius: radius.full,
      }} />
    </div>
  );
};
