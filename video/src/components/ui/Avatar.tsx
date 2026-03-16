import React from 'react';
import { colors, radius } from '../../design/tokens';

interface Props {
  initials: string;
  size?: number;
  color?: string;
}

export const Avatar: React.FC<Props> = ({ initials, size = 32, color = colors.accent }) => {
  return (
    <div style={{
      width:          size,
      height:         size,
      borderRadius:   radius.full,
      background:     colors.accentSubtle,
      color:          color,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      fontSize:       size * 0.38,
      fontWeight:     600,
      flexShrink:     0,
    }}>
      {initials}
    </div>
  );
};
