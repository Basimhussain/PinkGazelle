import React from 'react';
import { colors, radius } from '../../design/tokens';
import { Avatar } from './Avatar';

interface Props {
  actor:  string;
  action: string;
  time:   string;
}

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

export const ActivityFeedItem: React.FC<Props> = ({ actor, action, time }) => {
  return (
    <div style={{
      display:      'flex',
      alignItems:   'flex-start',
      gap:          10,
      padding:      '10px 0',
      borderBottom: `1px solid ${colors.border}`,
    }}>
      <Avatar initials={initials(actor)} size={30} />
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{actor} </span>
        <span style={{ fontSize: 13, color: colors.textSecondary }}>{action}</span>
        <div style={{ fontSize: 11, color: colors.textTertiary, marginTop: 3 }}>{time}</div>
      </div>
    </div>
  );
};
