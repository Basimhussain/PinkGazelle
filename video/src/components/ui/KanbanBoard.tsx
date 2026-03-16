import React from 'react';
import { colors, radius } from '../../design/tokens';
import { TicketCard } from './TicketCard';

interface Column {
  title:   string;
  status:  'todo' | 'in_progress' | 'done';
  tickets: string[];
  color:   string;
}

interface Props {
  columns: Column[];
  visibleTickets?: number;
}

export const KanbanBoard: React.FC<Props> = ({ columns, visibleTickets = 99 }) => {
  return (
    <div style={{
      display: 'flex',
      gap:     16,
      flex:    1,
      minHeight: 0,
    }}>
      {columns.map((col) => (
        <div key={col.status} style={{
          flex:         1,
          background:   colors.bgSubtle,
          borderRadius: radius.lg,
          padding:      12,
          display:      'flex',
          flexDirection:'column',
          gap:          0,
        }}>
          {/* Column header */}
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          8,
            marginBottom: 12,
          }}>
            <div style={{
              width:        10,
              height:       10,
              borderRadius: '50%',
              background:   col.color,
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {col.title}
            </span>
            <span style={{
              marginLeft:   'auto',
              fontSize:     11,
              fontWeight:   600,
              color:        colors.textTertiary,
              background:   colors.bgMuted,
              borderRadius: radius.full,
              padding:      '1px 6px',
            }}>
              {col.tickets.length}
            </span>
          </div>
          {/* Tickets */}
          {col.tickets.slice(0, visibleTickets).map((t, i) => (
            <TicketCard key={i} title={t} status={col.status} index={i} />
          ))}
        </div>
      ))}
    </div>
  );
};
