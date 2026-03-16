import React from 'react';
import { colors, radius, shadow } from '../../design/tokens';
import { StatusBadge } from './StatusBadge';

interface Props {
  title:   string;
  status:  'todo' | 'in_progress' | 'done';
  index?:  number;
}

export const TicketCard: React.FC<Props> = ({ title, status, index = 0 }) => {
  const accentColor =
    status === 'todo'        ? colors.todo :
    status === 'in_progress' ? colors.inProgress :
                               colors.done;

  return (
    <div style={{
      background:   colors.bg,
      border:       `1px solid ${colors.borderSubtle}`,
      borderLeft:   `3px solid ${accentColor}`,
      borderRadius: radius.md,
      padding:      '10px 12px',
      boxShadow:    shadow.xs,
      marginBottom: 8,
    }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: colors.textPrimary, marginBottom: 6, lineHeight: 1.4 }}>
        {title}
      </div>
      <StatusBadge status={status} />
    </div>
  );
};
