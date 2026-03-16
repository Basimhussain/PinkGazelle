import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';
import { colors, radius, shadow } from '../design/tokens';

interface Feature {
  icon:     React.ReactNode;
  title:    string;
  subtitle: string;
  fromDir:  'left' | 'bottom' | 'right';
  delay:    number;
}

const DualPortalIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="10" height="14" rx="2"/>
    <rect x="16" y="10" width="10" height="14" rx="2"/>
    <path d="M12 8h4M12 12h4"/>
  </svg>
);

const RealtimeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2,18 7,10 11,14 16,6 21,12 26,8"/>
    <circle cx="26" cy="8" r="2" fill={colors.accent} stroke="none"/>
  </svg>
);

const KanbanIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="7" height="22" rx="2"/>
    <rect x="11" y="3" width="7" height="16" rx="2"/>
    <rect x="20" y="3" width="7" height="12" rx="2"/>
  </svg>
);

const features: Feature[] = [
  {
    icon:     <DualPortalIcon />,
    title:    'Dual Portal Access',
    subtitle: 'Separate admin and client views\nwith distinct permissions and layouts',
    fromDir:  'left',
    delay:    0,
  },
  {
    icon:     <RealtimeIcon />,
    title:    'Real-time Activity',
    subtitle: 'Live updates across all stakeholders\nwith instant change notifications',
    fromDir:  'bottom',
    delay:    36,
  },
  {
    icon:     <KanbanIcon />,
    title:    'Kanban + Milestones',
    subtitle: 'Track every ticket, deadline,\nand invoice in one place',
    fromDir:  'right',
    delay:    72,
  },
];

export const Scene5Callouts: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background fade in
  const bgOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Scene fade-out
  const sceneOut = interpolate(frame, [180, 218], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Heading entrance
  const headingSpring = spring({ frame: Math.max(0, frame - 10), fps, config: { stiffness: 100, damping: 15 } });

  return (
    <AbsoluteFill style={{
      background: colors.bgSubtle,
      opacity:    bgOpacity * sceneOut,
      display:    'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding:    60,
    }}>
      {/* Heading */}
      <div style={{
        textAlign:  'center',
        marginBottom: 56,
        opacity:    interpolate(headingSpring, [0, 1], [0, 1]),
        transform:  `translateY(${interpolate(headingSpring, [0, 1], [20, 0])}px)`,
      }}>
        <div style={{ fontSize: 36, fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.02em', marginBottom: 8 }}>
          Everything your team needs
        </div>
        <div style={{ fontSize: 17, color: colors.textSecondary, fontWeight: 400 }}>
          Built for agencies and service teams who need structure and clarity
        </div>
      </div>

      {/* Feature cards */}
      <div style={{ display: 'flex', gap: 28, width: '100%', maxWidth: 1300 }}>
        {features.map((feat) => {
          const s = spring({ frame: Math.max(0, frame - feat.delay), fps, config: { stiffness: 130, damping: 16, mass: 1.1 } });
          const opacity  = interpolate(s, [0, 1], [0, 1]);
          const translateX =
            feat.fromDir === 'left'  ? interpolate(s, [0, 1], [-60, 0]) :
            feat.fromDir === 'right' ? interpolate(s, [0, 1], [60, 0])  : 0;
          const translateY = feat.fromDir === 'bottom' ? interpolate(s, [0, 1], [50, 0]) : 0;

          return (
            <div key={feat.title} style={{
              flex:         1,
              background:   colors.bg,
              border:       `1px solid ${colors.borderSubtle}`,
              borderRadius: radius.lg,
              padding:      '36px 32px',
              boxShadow:    shadow.md,
              opacity,
              transform:    `translateX(${translateX}px) translateY(${translateY}px)`,
            }}>
              {/* Icon circle */}
              <div style={{
                width:          60,
                height:         60,
                borderRadius:   radius.lg,
                background:     colors.accentSubtle,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                marginBottom:   20,
              }}>
                {feat.icon}
              </div>

              <div style={{
                fontSize:     20,
                fontWeight:   700,
                color:        colors.textPrimary,
                marginBottom: 10,
                letterSpacing:'-0.01em',
              }}>
                {feat.title}
              </div>

              <div style={{
                fontSize:   14,
                fontWeight: 400,
                color:      colors.textSecondary,
                lineHeight: 1.65,
                whiteSpace: 'pre-line',
              }}>
                {feat.subtitle}
              </div>

              {/* Decorative accent line */}
              <div style={{
                width:        36,
                height:       3,
                background:   `linear-gradient(90deg, ${colors.accent}, #8b5cf6)`,
                borderRadius: 9999,
                marginTop:    20,
                opacity:      interpolate(s, [0.7, 1], [0, 1]),
              }} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
