import React from 'react';
import { colors, radius, shadow } from '../../design/tokens';

interface Props {
  label: string;
  value: number | string;
  accent?: string;
}

export const StatCard: React.FC<Props> = ({ label, value, accent }) => {
  return (
    <div style={{
      background:   colors.bg,
      border:       `1px solid ${colors.borderSubtle}`,
      borderRadius: radius.lg,
      padding:      '18px 20px',
      boxShadow:    shadow.xs,
      flex:         1,
    }}>
      <div style={{
        fontSize:     12,
        fontWeight:   500,
        color:        colors.textTertiary,
        marginBottom: 6,
        textTransform:'uppercase',
        letterSpacing:'0.05em',
      }}>
        {label}
      </div>
      <div style={{
        fontSize:   28,
        fontWeight: 700,
        color:      accent ?? colors.textPrimary,
        lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  );
};
