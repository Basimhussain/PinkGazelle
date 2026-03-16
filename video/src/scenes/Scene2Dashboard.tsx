import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';
import { colors, radius, sidebarWidth, shadow } from '../design/tokens';
import { AdminSidebar } from '../components/layout/AdminSidebar';
import { Topbar } from '../components/layout/Topbar';
import { StatCard } from '../components/ui/StatCard';
import { ProjectCard } from '../components/ui/ProjectCard';
import { AnimatedBar } from '../components/motion/AnimatedBar';

const stats = [
  { label: 'Total Projects', value: 12 },
  { label: 'Active',         value:  8, accent: colors.success },
  { label: 'Completed',      value:  3, accent: colors.accent  },
  { label: 'Paused',         value:  1, accent: colors.warning },
];

const projects = [
  { title: 'Brand Refresh',  status: 'active'    as const, progress: 68,  daysLeft: 5,    client: 'lana@acme.com',  description: 'Full visual identity overhaul including logo, colors, and brand guidelines.' },
  { title: 'App Redesign',   status: 'active'    as const, progress: 41,  daysLeft: 14,   client: 'omar@nova.io',   description: 'UI/UX redesign for the mobile and web application experience.' },
  { title: 'Q1 Campaign',    status: 'completed' as const, progress: 100, daysLeft: null, client: 'sara@hub.co',    description: 'Q1 marketing campaign creative assets and social media content.' },
];

const healthSegments = [
  { targetWidth: 12, color: colors.danger  },
  { targetWidth: 13, color: colors.warning },
  { targetWidth: 75, color: colors.success },
];

export const Scene2Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Shell slides in from left (local frame 0-15)
  const shellSpring = spring({ frame, fps, config: { stiffness: 200, damping: 22 } });
  const shellX = interpolate(shellSpring, [0, 1], [-80, 0]);
  const shellOpacity = interpolate(shellSpring, [0, 1], [0, 1]);

  // Scene fade-out (local frame 120-149)
  const sceneOut = interpolate(frame, [240, 298], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity: sceneOut }}>
      <div style={{
        display:   'flex',
        width:     '100%',
        height:    '100%',
        opacity:   shellOpacity,
        transform: `translateX(${shellX}px)`,
      }}>
        <AdminSidebar />

        {/* Main content */}
        <div style={{
          flex:      1,
          display:   'flex',
          flexDirection: 'column',
          background: colors.bgSubtle,
          overflow:  'hidden',
        }}>
          <Topbar title="Dashboard" subtitle="Welcome back, Basim" action="+ New Project" />

          <div style={{ flex: 1, padding: '28px 32px', overflow: 'hidden' }}>
            {/* Stats row */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              {stats.map((s, i) => {
                const delay = 20 + i * 14;
                const ss = spring({ frame: Math.max(0, frame - delay), fps, config: { stiffness: 120, damping: 16 } });
                return (
                  <div key={s.label} style={{
                    flex:      1,
                    opacity:   interpolate(ss, [0, 1], [0, 1]),
                    transform: `translateY(${interpolate(ss, [0, 1], [24, 0])}px)`,
                  }}>
                    <StatCard label={s.label} value={s.value} accent={s.accent} />
                  </div>
                );
              })}
            </div>

            {/* Deadline Health */}
            <div style={{
              background:   colors.bg,
              border:       `1px solid ${colors.borderSubtle}`,
              borderRadius: radius.lg,
              padding:      '20px 24px',
              marginBottom: 24,
              boxShadow:    shadow.xs,
              opacity:      interpolate(frame, [50, 80], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
              transform:    `translateY(${interpolate(
                spring({ frame: Math.max(0, frame - 50), fps, config: { stiffness: 120, damping: 16 } }),
                [0, 1], [20, 0]
              )}px)`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Deadline Health
              </div>
              <AnimatedBar
                startFrame={70}
                endFrame={150}
                segments={healthSegments}
                height={10}
              />
              <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
                {[
                  { label: 'Overdue',  color: colors.danger  },
                  { label: 'Due Soon', color: colors.warning },
                  { label: 'On Track', color: colors.success },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: colors.textTertiary }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Project cards — staggered */}
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.textSecondary, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Active Projects
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {projects.map((p, i) => {
                const delay = 130 + i * 28;
                const s = spring({ frame: Math.max(0, frame - delay), fps, config: { stiffness: 120, damping: 16 } });
                return (
                  <div key={p.title} style={{
                    opacity:   interpolate(s, [0, 1], [0, 1]),
                    transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
                  }}>
                    <ProjectCard {...p} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
