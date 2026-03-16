import React from 'react';
import { colors, radius, shadow } from '../../design/tokens';
import { Avatar } from '../ui/Avatar';
import logoClient from '../../assets/logo-client-topbar.png';

interface Props {
  projectName?: string;
}

export const ClientTopbar: React.FC<Props> = ({ projectName }) => {
  return (
    <div style={{
      height:         56,
      background:     colors.bg,
      borderBottom:   `1px solid ${colors.borderSubtle}`,
      display:        'flex',
      alignItems:     'center',
      padding:        '0 24px',
      gap:            16,
      boxShadow:      shadow.xs,
      flexShrink:     0,
    }}>
      {/* Logo */}
      <img src={logoClient} alt="Pink Gazelle" style={{ height: 28, objectFit: 'contain' }} />

      {/* Title */}
      <div style={{
        width:     1,
        height:    20,
        background: colors.border,
        margin:    '0 4px',
      }} />
      <div style={{ fontSize: 13, fontWeight: 500, color: colors.textSecondary }}>
        Client Portal
      </div>

      {projectName && (
        <>
          <div style={{ color: colors.textTertiary, fontSize: 13 }}>›</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{projectName}</div>
        </>
      )}

      {/* Right side */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 13, color: colors.textSecondary }}>Lana K.</div>
        <Avatar initials="LK" size={30} />
      </div>
    </div>
  );
};
