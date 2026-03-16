import React from 'react';
import { colors, radius, shadow } from '../../design/tokens';

interface Props {
  title:    string;
  subtitle?: string;
  action?:  string;
}

export const Topbar: React.FC<Props> = ({ title, subtitle, action }) => {
  return (
    <div style={{
      height:         56,
      background:     colors.bg,
      borderBottom:   `1px solid ${colors.borderSubtle}`,
      display:        'flex',
      alignItems:     'center',
      padding:        '0 24px',
      flexShrink:     0,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 12, color: colors.textTertiary, marginTop: 1 }}>{subtitle}</div>
        )}
      </div>
      {action && (
        <div style={{
          fontSize:     13,
          fontWeight:   600,
          color:        '#fff',
          background:   colors.accent,
          padding:      '7px 14px',
          borderRadius: radius.md,
          cursor:       'default',
        }}>
          {action}
        </div>
      )}
    </div>
  );
};
