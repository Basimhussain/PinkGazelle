import React from 'react';
import { colors, radius, sidebarWidth } from '../../design/tokens';
import { Avatar } from '../ui/Avatar';
import logoAdmin from '../../assets/logo-admin.png';

interface NavItem {
  label:   string;
  active?: boolean;
  indent?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', active: true },
  { label: 'All Projects' },
  { label: '└ Brand Refresh', indent: true },
  { label: '└ App Redesign',  indent: true },
  { label: 'Archived' },
  { label: 'New Project' },
];

export const AdminSidebar: React.FC = () => {
  return (
    <div style={{
      width:          sidebarWidth,
      minWidth:       sidebarWidth,
      background:     colors.bg,
      borderRight:    `1px solid ${colors.borderSubtle}`,
      display:        'flex',
      flexDirection:  'column',
      padding:        '20px 12px',
      height:         '100%',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, paddingLeft: 4 }}>
        <img src={logoAdmin} alt="Pink Gazelle" style={{ width: 36, height: 36, borderRadius: radius.md, objectFit: 'cover' }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.2 }}>Pink Gazelle</div>
          <div style={{ fontSize: 10, color: colors.textTertiary, fontWeight: 500 }}>Admin Portal</div>
        </div>
      </div>

      {/* Nav sections */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px 6px' }}>
          Overview
        </div>
        <NavLink label="Dashboard" active />
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 8px 6px' }}>
          Projects
        </div>
        <NavLink label="All Projects" />
        <NavLink label="└ Brand Refresh" indent />
        <NavLink label="└ App Redesign"  indent />
        <NavLink label="Archived" />
        <NavLink label="+ New Project" accent />
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', borderTop: `1px solid ${colors.borderSubtle}`, paddingTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar initials="BH" size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Basim H.</div>
          <div style={{ fontSize: 11, color: colors.textTertiary }}>Admin</div>
        </div>
      </div>
    </div>
  );
};

const NavLink: React.FC<{ label: string; active?: boolean; indent?: boolean; accent?: boolean }> = ({
  label, active, indent, accent,
}) => (
  <div style={{
    padding:      '7px 8px',
    borderRadius: radius.md,
    fontSize:     indent ? 12 : 13,
    fontWeight:   active ? 600 : 400,
    color:        active ? colors.textPrimary : accent ? colors.accent : indent ? colors.textTertiary : colors.textSecondary,
    background:   active ? colors.bgMuted : 'transparent',
    marginLeft:   indent ? 12 : 0,
    cursor:       'default',
    marginBottom: 2,
  }}>
    {label}
  </div>
);
