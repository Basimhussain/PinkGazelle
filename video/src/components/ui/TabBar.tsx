import React from 'react';
import { colors, radius } from '../../design/tokens';

interface Props {
  tabs:        string[];
  activeIndex: number;
}

export const TabBar: React.FC<Props> = ({ tabs, activeIndex }) => {
  return (
    <div style={{
      display:      'flex',
      gap:          4,
      borderBottom: `1px solid ${colors.border}`,
      marginBottom: 20,
    }}>
      {tabs.map((tab, i) => {
        const isActive = i === activeIndex;
        return (
          <div key={tab} style={{
            padding:      '10px 16px',
            fontSize:     14,
            fontWeight:   isActive ? 600 : 400,
            color:        isActive ? colors.accent : colors.textSecondary,
            borderBottom: isActive ? `2px solid ${colors.accent}` : '2px solid transparent',
            marginBottom: -1,
            cursor:       'default',
            whiteSpace:   'nowrap',
          }}>
            {tab}
          </div>
        );
      })}
    </div>
  );
};
