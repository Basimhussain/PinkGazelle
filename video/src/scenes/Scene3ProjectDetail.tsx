import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';
import { colors, radius, sidebarWidth, shadow } from '../design/tokens';
import { AdminSidebar } from '../components/layout/AdminSidebar';
import { Topbar } from '../components/layout/Topbar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { TabBar } from '../components/ui/TabBar';
import { TicketCard } from '../components/ui/TicketCard';
import { MilestoneRow } from '../components/ui/MilestoneRow';
import { InvoiceTable } from '../components/ui/InvoiceTable';
import { BlurReveal } from '../components/motion/BlurReveal';

const kanbanColumns = [
  { status: 'todo'        as const, title: 'To Do',       color: colors.todo,       tickets: ['Define final scope', 'Stakeholder review session'] },
  { status: 'in_progress' as const, title: 'In Progress',  color: colors.inProgress, tickets: ['Wireframe designs', 'Component library', 'API specification'] },
  { status: 'done'        as const, title: 'Done',         color: colors.done,       tickets: ['Project kickoff meeting', 'Research & discovery phase'] },
];

const milestones = [
  { title: 'Discovery complete',  status: 'completed' as const, due: 'Jan 15, 2025' },
  { title: 'Design handoff',      status: 'pending'   as const, due: 'Feb 1, 2025'  },
  { title: 'Development complete',status: 'pending'   as const, due: 'Mar 10, 2025' },
];

const invoices = [
  { amount: 'SAR 12,500', status: 'paid' as const, due: 'Jan 30, 2025', title: 'Discovery Phase' },
  { amount: 'SAR 18,000', status: 'sent' as const, due: 'Feb 28, 2025', title: 'Design Phase'    },
];

export const Scene3ProjectDetail: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene slides in from right (local frame 0-18)
  const slideIn = spring({ frame, fps, config: { stiffness: 180, damping: 20 } });
  const slideX   = interpolate(slideIn, [0, 1], [120, 0]);
  const sceneOpacity = interpolate(slideIn, [0, 1], [0, 1]);

  // Determine active tab: 0=Kanban, 1=Milestones, 2=Invoices
  // Switch to Milestones at frame 190, Invoices at frame 260
  const activeTab =
    frame < 190 ? 0 :
    frame < 260 ? 1 : 2;

  // Tab switch blur transitions
  const milestonesReveal = frame >= 190 && frame < 260;
  const invoicesReveal   = frame >= 260;

  // Project header entrance
  const headerSpring = spring({ frame: Math.max(0, frame - 24), fps, config: { stiffness: 140, damping: 18 } });

  // Scene fade-out
  const sceneOut = interpolate(frame, [310, 358], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity: sceneOut }}>
      <div style={{
        display:   'flex',
        width:     '100%',
        height:    '100%',
        opacity:   sceneOpacity,
        transform: `translateX(${slideX}px)`,
      }}>
        <AdminSidebar />

        <div style={{
          flex:          1,
          display:       'flex',
          flexDirection: 'column',
          background:    colors.bgSubtle,
          overflow:      'hidden',
        }}>
          <Topbar title="Brand Refresh" subtitle="Active Project" />

          <div style={{ flex: 1, padding: '20px 28px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Project Header Card */}
            <div style={{
              background:   colors.bg,
              border:       `1px solid ${colors.borderSubtle}`,
              borderRadius: radius.lg,
              padding:      '16px 20px',
              marginBottom: 20,
              boxShadow:    shadow.xs,
              opacity:      interpolate(headerSpring, [0, 1], [0, 1]),
              transform:    `translateY(${interpolate(headerSpring, [0, 1], [16, 0])}px)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>Brand Refresh</div>
                <StatusBadge status="active" size="md" />
              </div>
              <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
                Full visual identity overhaul — logo, colors, typography, and brand guidelines.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <ProgressBar percent={68} height={8} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.accent }}>68%</div>
                <div style={{ fontSize: 12, color: colors.danger, fontWeight: 500 }}>5 days left</div>
              </div>
            </div>

            {/* Tab bar */}
            <TabBar
              tabs={['Kanban', 'Milestones', 'Invoices', 'Activity']}
              activeIndex={activeTab}
            />

            {/* Tab Content */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {/* Kanban view */}
              {frame < 190 && (
                <KanbanView frame={frame} fps={fps} />
              )}

              {/* Milestones view */}
              {frame >= 190 && frame < 260 && (
                <BlurReveal startFrame={0} endFrame={30} maxBlur={6}>
                  <div>
                    {milestones.map((m, i) => (
                      <MilestoneRow key={i} {...m} />
                    ))}
                  </div>
                </BlurReveal>
              )}

              {/* Invoices view */}
              {frame >= 260 && (
                <BlurReveal startFrame={0} endFrame={30} maxBlur={6}>
                  <InvoiceTable invoices={invoices} />
                </BlurReveal>
              )}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const KanbanView: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  return (
    <div style={{ display: 'flex', gap: 14, height: '100%' }}>
      {kanbanColumns.map((col, colIdx) => {
        const colDelay = 44 + colIdx * 20;
        const colSpring = spring({ frame: Math.max(0, frame - colDelay), fps, config: { stiffness: 130, damping: 17 } });
        const colOpacity = interpolate(colSpring, [0, 1], [0, 1]);
        const colY       = interpolate(colSpring, [0, 1], [28, 0]);

        return (
          <div key={col.status} style={{
            flex:         1,
            background:   colors.bgSubtle,
            borderRadius: radius.lg,
            padding:      12,
            display:      'flex',
            flexDirection:'column',
            opacity:      colOpacity,
            transform:    `translateY(${colY}px)`,
          }}>
            {/* Column header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {col.title}
              </span>
              <span style={{
                marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: colors.textTertiary,
                background: colors.bgMuted, borderRadius: 9999, padding: '1px 6px',
              }}>
                {col.tickets.length}
              </span>
            </div>
            {/* Tickets animate in */}
            {col.tickets.map((ticket, ticketIdx) => {
              const ticketDelay = colDelay + 24 + ticketIdx * 14;
              const ts = spring({ frame: Math.max(0, frame - ticketDelay), fps, config: { stiffness: 140, damping: 17 } });
              return (
                <div key={ticketIdx} style={{
                  opacity:   interpolate(ts, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(ts, [0, 1], [-16, 0])}px)`,
                }}>
                  <TicketCard title={ticket} status={col.status} />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
