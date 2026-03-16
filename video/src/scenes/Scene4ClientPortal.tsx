import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';
import { colors, radius, shadow } from '../design/tokens';
import { ClientTopbar } from '../components/layout/ClientTopbar';
import { TabBar } from '../components/ui/TabBar';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ActivityFeedItem } from '../components/ui/ActivityFeedItem';
import { WipeMask } from '../components/motion/WipeMask';
import { StaggerList } from '../components/motion/StaggerList';

const activityItems = [
  { actor: 'Basim H.',  action: 'moved "Wireframe designs" to In Progress', time: '2 min ago'   },
  { actor: 'System',    action: 'created invoice SAR 18,000 (Design Phase)', time: '1 hour ago'  },
  { actor: 'Lana K.',   action: 'commented on "Design handoff" milestone',   time: '3 hours ago' },
  { actor: 'Basim H.',  action: 'completed milestone "Discovery complete"',   time: 'Yesterday'   },
  { actor: 'System',    action: 'project status updated to Active',           time: '2 days ago'  },
];

const tickets = [
  { title: 'Define final scope',      status: 'todo'        as const },
  { title: 'Wireframe designs',       status: 'in_progress' as const },
  { title: 'Project kickoff meeting', status: 'done'        as const },
];

export const Scene4ClientPortal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Wipe transition: client portal wipes in over 0-22 frames
  const topbarSpring = spring({ frame: Math.max(0, frame - 40), fps, config: { stiffness: 140, damping: 18 } });
  const topbarOpacity = interpolate(topbarSpring, [0, 1], [0, 1]);
  const topbarY       = interpolate(topbarSpring, [0, 1], [-20, 0]);

  // Scene fade-out
  const sceneOut = interpolate(frame, [240, 298], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Active tab: 0=Tickets, 1=Activity at frame 160
  const activeTab = frame < 160 ? 0 : 3;

  return (
    <AbsoluteFill style={{ opacity: sceneOut }}>
      <WipeMask startFrame={0} endFrame={44} direction="left-to-right">
        <div style={{
          width:         '100%',
          height:        '100%',
          display:       'flex',
          flexDirection: 'column',
          background:    colors.bgSubtle,
        }}>
          {/* Client topbar */}
          <div style={{
            opacity:   topbarOpacity,
            transform: `translateY(${topbarY}px)`,
          }}>
            <ClientTopbar projectName="Brand Refresh" />
          </div>

          <div style={{ flex: 1, padding: '24px 40px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Project summary card */}
            <div style={{
              background:   colors.bg,
              border:       `1px solid ${colors.borderSubtle}`,
              borderRadius: radius.lg,
              padding:      '20px 24px',
              marginBottom: 24,
              boxShadow:    shadow.xs,
              opacity:      interpolate(spring({ frame: Math.max(0, frame - 50), fps, config: { stiffness: 130, damping: 16 } }), [0, 1], [0, 1]),
              transform:    `translateY(${interpolate(spring({ frame: Math.max(0, frame - 50), fps, config: { stiffness: 130, damping: 16 } }), [0, 1], [20, 0])}px)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>Brand Refresh</div>
                <StatusBadge status="active" size="md" />
                <div style={{ marginLeft: 'auto', fontSize: 13, color: colors.danger, fontWeight: 600 }}>5 days left</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <ProgressBar percent={68} height={10} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: colors.accent }}>68%</div>
              </div>
              <div style={{ fontSize: 12, color: colors.textTertiary, marginTop: 8 }}>
                Client: lana@acme.com · Last updated 2 min ago
              </div>
            </div>

            {/* Tab bar */}
            <TabBar
              tabs={['Tickets', 'Milestones', 'Invoices', 'Activity']}
              activeIndex={activeTab}
            />

            {/* Tab content */}
            {frame < 160 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <StaggerList startFrame={90} staggerFrames={20} direction="up" distance={20}>
                  {tickets.map((t, i) => (
                    <div key={i} style={{
                      background:   colors.bg,
                      border:       `1px solid ${colors.borderSubtle}`,
                      borderLeft:   `3px solid ${t.status === 'todo' ? colors.todo : t.status === 'in_progress' ? colors.inProgress : colors.done}`,
                      borderRadius: radius.md,
                      padding:      '12px 16px',
                      marginBottom: 10,
                      display:      'flex',
                      alignItems:   'center',
                      gap:          12,
                    }}>
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: colors.textPrimary }}>{t.title}</div>
                      <StatusBadge status={t.status} />
                    </div>
                  ))}
                </StaggerList>
              </div>
            )}

            {frame >= 160 && (
              <StaggerList startFrame={0} staggerFrames={18} direction="up" distance={18}>
                {activityItems.map((item, i) => (
                  <ActivityFeedItem key={i} {...item} />
                ))}
              </StaggerList>
            )}
          </div>
        </div>
      </WipeMask>
    </AbsoluteFill>
  );
};
