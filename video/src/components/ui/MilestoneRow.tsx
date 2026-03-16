import React from 'react';
import { colors, radius } from '../../design/tokens';

interface Props {
  title:  string;
  status: 'completed' | 'pending';
  due?:   string;
}

export const MilestoneRow: React.FC<Props> = ({ title, status, due }) => {
  const isDone = status === 'completed';
  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          12,
      padding:      '12px 0',
      borderBottom: `1px solid ${colors.border}`,
    }}>
      {/* Checkbox */}
      <div style={{
        width:        20,
        height:       20,
        borderRadius: radius.sm,
        border:       isDone ? 'none' : `2px solid ${colors.border}`,
        background:   isDone ? colors.success : 'transparent',
        flexShrink:   0,
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
      }}>
        {isDone && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize:        14,
          fontWeight:      500,
          color:           isDone ? colors.textTertiary : colors.textPrimary,
          textDecoration:  isDone ? 'line-through' : 'none',
        }}>
          {title}
        </div>
        {due && (
          <div style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2 }}>
            Due {due}
          </div>
        )}
      </div>
      <span style={{
        fontSize:     11,
        fontWeight:   500,
        color:        isDone ? colors.success : colors.warning,
        background:   isDone ? colors.successSubtle : colors.warningSubtle,
        padding:      '2px 8px',
        borderRadius: radius.full,
      }}>
        {isDone ? 'Completed' : 'Pending'}
      </span>
    </div>
  );
};
