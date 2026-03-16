import React from 'react';
import { colors, radius } from '../../design/tokens';

type Status =
  | 'todo' | 'in_progress' | 'done'
  | 'active' | 'paused' | 'completed' | 'archived'
  | 'pending' | 'paid' | 'sent' | 'draft';

const statusMap: Record<Status, { bg: string; color: string; label: string }> = {
  todo:        { bg: colors.todoBg,        color: colors.todo,       label: 'To Do'       },
  in_progress: { bg: colors.inProgressBg,  color: colors.inProgress, label: 'In Progress' },
  done:        { bg: colors.doneBg,        color: colors.done,       label: 'Done'        },
  active:      { bg: colors.successSubtle, color: colors.success,    label: 'Active'      },
  paused:      { bg: colors.warningSubtle, color: colors.warning,    label: 'Paused'      },
  completed:   { bg: colors.successSubtle, color: colors.success,    label: 'Completed'   },
  archived:    { bg: colors.bgMuted,       color: colors.textTertiary,label: 'Archived'   },
  pending:     { bg: colors.warningSubtle, color: colors.warning,    label: 'Pending'     },
  paid:        { bg: colors.successSubtle, color: colors.success,    label: 'Paid'        },
  sent:        { bg: colors.inProgressBg,  color: colors.inProgress, label: 'Sent'        },
  draft:       { bg: colors.bgMuted,       color: colors.textSecondary,label: 'Draft'     },
};

interface Props {
  status: Status;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'sm' }) => {
  const config = statusMap[status] ?? statusMap['draft'];
  const fontSize = size === 'md' ? 13 : 11;
  const padding = size === 'md' ? '4px 10px' : '3px 8px';

  return (
    <span style={{
      display:      'inline-block',
      background:   config.bg,
      color:        config.color,
      fontSize,
      fontWeight:   500,
      padding,
      borderRadius: radius.full,
      lineHeight:   1.4,
    }}>
      {config.label}
    </span>
  );
};
