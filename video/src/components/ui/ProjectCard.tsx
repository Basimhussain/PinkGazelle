import React from 'react';
import { colors, radius, shadow } from '../../design/tokens';
import { StatusBadge } from './StatusBadge';
import { ProgressBar } from './ProgressBar';

interface Props {
  title:       string;
  status:      'active' | 'paused' | 'completed' | 'archived';
  progress:    number;
  client:      string;
  daysLeft?:   number | null;
  description?: string;
}

export const ProjectCard: React.FC<Props> = ({
  title,
  status,
  progress,
  client,
  daysLeft,
  description,
}) => {
  return (
    <div style={{
      background:   colors.bg,
      border:       `1px solid ${colors.borderSubtle}`,
      borderRadius: radius.lg,
      padding:      20,
      boxShadow:    shadow.xs,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary }}>{title}</div>
        <StatusBadge status={status} />
      </div>
      {description && (
        <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12, lineHeight: 1.5 }}>
          {description}
        </div>
      )}
      <ProgressBar percent={progress} />
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        marginTop:      10,
        fontSize:       12,
        color:          colors.textTertiary,
      }}>
        <span>{client}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            fontWeight: 600,
            color: progress === 100 ? colors.success : colors.textPrimary,
          }}>
            {progress}%
          </span>
          {daysLeft != null && (
            <span style={{ color: daysLeft <= 5 ? colors.danger : colors.textTertiary }}>
              · {daysLeft}d left
            </span>
          )}
        </span>
      </div>
    </div>
  );
};
