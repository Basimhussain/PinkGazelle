import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AdminSidebar } from '../../components/admin/AdminSidebar'
import { getAllProjects, getArchivedProjects } from '../../lib/projects'
import { computePercentage } from '../../lib/progress'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { formatDate } from '../../lib/utils'
import { useRealtimeProjects } from '../../hooks/useRealtimeProjects'
import type { ProjectWithProgress } from '../../types'

// ── Deadline categorisation ───────────────────────────────────────────────────
type DeadlineBucket = 'overdue' | 'due_soon' | 'on_track' | 'completed' | 'no_deadline'

function getDeadlineBucket(p: ProjectWithProgress): DeadlineBucket {
  if (p.status === 'completed') return 'completed'
  if (!p.deadline) return 'no_deadline'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dl = new Date(p.deadline)
  dl.setHours(0, 0, 0, 0)
  const daysLeft = Math.ceil((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (daysLeft < 0) return 'overdue'
  if (daysLeft <= 7) return 'due_soon'
  return 'on_track'
}

const BUCKET_COLORS: Record<DeadlineBucket, string> = {
  overdue:    '#ef4444',
  due_soon:   '#f59e0b',
  on_track:   '#22c55e',
  completed:  '#6366f1',
  no_deadline:'#94a3b8',
}

const BUCKET_LABELS: Record<DeadlineBucket, string> = {
  overdue:    'Overdue',
  due_soon:   'Due Soon',
  on_track:   'On Track',
  completed:  'Completed',
  no_deadline:'No Deadline',
}

// ── Archived view ─────────────────────────────────────────────────────────────
function ArchivedView({ projects, loading }: { projects: ProjectWithProgress[]; loading: boolean }) {
  return (
    <div className="page-content">
      {loading ? (
        <div className="empty-state"><p>Loading…</p></div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-title">No archived projects</div>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <Link key={p.id} to={`/admin/projects/${p.id}`} style={{ textDecoration: 'none' }}>
              <div className="project-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div className="project-card-title">{p.title}</div>
                  <StatusBadge status={p.status} />
                </div>
                {p.description && <div className="project-card-desc">{p.description}</div>}
                <div className="project-card-meta">
                  <span>{formatDate(p.created_at)}</span>
                  <span>{p.client ? p.client.email : 'No client'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main dashboard ─────────────────────────────────────────────────────────────
export function AdminOverviewPage() {
  const [searchParams] = useSearchParams()
  const showArchived = searchParams.get('archived') === 'true'

  const [projects, setProjects] = useState<ProjectWithProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const fetch = showArchived ? getArchivedProjects : getAllProjects
    fetch().then(async (ps) => {
      const withProgress = await Promise.all(
        ps.map(async p => ({ ...p, progress: await computePercentage(p.id) }))
      )
      setProjects(withProgress)
      setLoading(false)
    })
  }, [showArchived])

  useRealtimeProjects({
    onInsert: async (project) => {
      const isArchived = project.status === 'archived'
      if (isArchived !== showArchived) return
      const progress = await computePercentage(project.id)
      setProjects(prev => [{ ...project, progress }, ...prev])
    },
    onUpdate: async (project) => {
      const isArchived = project.status === 'archived'
      if (isArchived !== showArchived) {
        // project moved in/out of this view — remove it
        setProjects(prev => prev.filter(p => p.id !== project.id))
        return
      }
      const progress = await computePercentage(project.id)
      setProjects(prev =>
        prev.map(p => p.id === project.id ? { ...project, progress, client: p.client } : p)
      )
    },
    onDelete: (id) => {
      setProjects(prev => prev.filter(p => p.id !== id))
    },
  })

  if (showArchived) {
    return (
      <div className="app-shell">
        <AdminSidebar />
        <div className="app-main">
          <div className="topbar">
            <div>
              <div className="topbar-title">Archived Projects</div>
              <div className="topbar-subtitle">Projects moved to archive</div>
            </div>
          </div>
          <ArchivedView projects={projects} loading={loading} />
        </div>
      </div>
    )
  }

  // ── Analytics ──────────────────────────────────────────────────────────────
  const active    = projects.filter(p => p.status === 'active')
  const paused    = projects.filter(p => p.status === 'paused')
  const completed = projects.filter(p => p.status === 'completed')
  const inProgress = [...active, ...paused]

  // Deadline buckets across ALL non-archived projects
  const buckets: Record<DeadlineBucket, ProjectWithProgress[]> = {
    overdue:    [],
    due_soon:   [],
    on_track:   [],
    completed:  [],
    no_deadline:[],
  }
  for (const p of projects) buckets[getDeadlineBucket(p)].push(p)

  const totalWithDeadline = projects.filter(p => p.deadline).length
  const bucketOrder: DeadlineBucket[] = ['overdue', 'due_soon', 'on_track', 'completed', 'no_deadline']

  // Text insights
  const insights: string[] = []
  if (buckets.overdue.length > 0) {
    insights.push(`${buckets.overdue.length} project${buckets.overdue.length > 1 ? 's are' : ' is'} past deadline — immediate attention needed`)
    for (const p of buckets.overdue) {
      const days = Math.abs(Math.ceil((new Date(p.deadline!).getTime() - Date.now()) / 86400000))
      insights.push(`"${p.title}" was due ${days} day${days !== 1 ? 's' : ''} ago`)
    }
  }
  if (buckets.due_soon.length > 0) {
    for (const p of buckets.due_soon) {
      const days = Math.ceil((new Date(p.deadline!).getTime() - Date.now()) / 86400000)
      insights.push(`"${p.title}" is due in ${days === 0 ? 'today' : `${days} day${days !== 1 ? 's' : ''}`}`)
    }
  }
  if (buckets.on_track.length > 0 && buckets.overdue.length === 0 && buckets.due_soon.length === 0) {
    insights.push(`All ${buckets.on_track.length} tracked project${buckets.on_track.length > 1 ? 's are' : ' is'} on track`)
  }
  if (buckets.no_deadline.length > 0) {
    insights.push(`${buckets.no_deadline.length} project${buckets.no_deadline.length > 1 ? 's have' : ' has'} no deadline set`)
  }
  if (completed.length > 0) {
    insights.push(`${completed.length} project${completed.length > 1 ? 's' : ''} completed`)
  }
  if (projects.length === 0) {
    insights.push('No projects yet — create your first project to see analytics here')
  }

  return (
    <div className="app-shell">
      <AdminSidebar />
      <div className="app-main">
        <div className="topbar">
          <div>
            <div className="topbar-title">Dashboard</div>
            <div className="topbar-subtitle">Project analytics overview</div>
          </div>
          <Link to="/admin/projects/new" className="btn btn-primary">+ New Project</Link>
        </div>

        <div className="page-content">
          {loading ? (
            <div className="empty-state"><p>Loading…</p></div>
          ) : (
            <>
              {/* ── Stats row ── */}
              <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="stat-card">
                  <div className="stat-label">Total Projects</div>
                  <div className="stat-value">{projects.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Active</div>
                  <div className="stat-value">{active.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Completed</div>
                  <div className="stat-value">{completed.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Paused</div>
                  <div className="stat-value">{paused.length}</div>
                </div>
              </div>

              {/* ── Deadline health ── */}
              {projects.length > 0 && (
                <div className="section">
                  <div className="section-header">
                    <div className="section-title">Deadline Health</div>
                    <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                      {totalWithDeadline} of {projects.length} project{projects.length !== 1 ? 's' : ''} have a deadline
                    </span>
                  </div>

                  {/* Segmented bar */}
                  {projects.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', height: 20, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
                        {bucketOrder.map(bucket => {
                          const count = buckets[bucket].length
                          if (count === 0) return null
                          const pct = (count / projects.length) * 100
                          return (
                            <div
                              key={bucket}
                              style={{
                                width: `${pct}%`,
                                background: BUCKET_COLORS[bucket],
                                borderRadius: 3,
                                transition: 'width 0.3s',
                              }}
                              title={`${BUCKET_LABELS[bucket]}: ${count}`}
                            />
                          )
                        })}
                      </div>
                      {/* Legend */}
                      <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                        {bucketOrder.map(bucket => {
                          const count = buckets[bucket].length
                          if (count === 0) return null
                          return (
                            <div key={bucket} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                              <div style={{ width: 10, height: 10, borderRadius: 2, background: BUCKET_COLORS[bucket], flexShrink: 0 }} />
                              <span style={{ color: 'var(--color-text-secondary)' }}>
                                {BUCKET_LABELS[bucket]} <strong style={{ color: 'var(--color-text-primary)' }}>{count}</strong>
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Text insights */}
                  {insights.length > 0 && (
                    <div className="card" style={{ padding: '12px 16px' }}>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {insights.map((text, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                            <span style={{
                              flexShrink: 0,
                              width: 6, height: 6, borderRadius: '50%', marginTop: 5,
                              background: text.includes('past deadline') || text.includes('ago')
                                ? BUCKET_COLORS.overdue
                                : text.includes('due in') || text.includes('today')
                                  ? BUCKET_COLORS.due_soon
                                  : text.includes('on track') || text.includes('completed')
                                    ? BUCKET_COLORS.on_track
                                    : 'var(--color-text-tertiary)',
                            }} />
                            {text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* ── Active / In-progress projects ── */}
              {inProgress.length > 0 && (
                <div className="section">
                  <div className="section-header">
                    <div className="section-title">In Progress <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-text-tertiary)' }}>({inProgress.length})</span></div>
                  </div>
                  <div className="projects-grid">
                    {inProgress.map(p => {
                      const bucket = getDeadlineBucket(p)
                      const today = new Date(); today.setHours(0, 0, 0, 0)
                      const daysLeft = p.deadline
                        ? Math.ceil((new Date(p.deadline).setHours(0,0,0,0) - today.getTime()) / 86400000)
                        : null
                      return (
                        <Link key={p.id} to={`/admin/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                          <div className="project-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                              <div className="project-card-title">{p.title}</div>
                              <StatusBadge status={p.status} />
                            </div>
                            {p.description && <div className="project-card-desc">{p.description}</div>}
                            <div style={{ marginBottom: 10 }}>
                              <div className="progress-label">
                                <span className="progress-text">Progress</span>
                                <span className="progress-pct">{p.progress}%</span>
                              </div>
                              <div className="progress-bar-wrap">
                                <div className="progress-bar-fill" style={{ width: `${p.progress}%` }} />
                              </div>
                            </div>
                            <div className="project-card-meta">
                              {p.deadline ? (
                                <span style={{ color: BUCKET_COLORS[bucket], fontWeight: 500 }}>
                                  {bucket === 'overdue'
                                    ? `Overdue by ${Math.abs(daysLeft!)}d`
                                    : bucket === 'due_soon'
                                      ? daysLeft === 0 ? 'Due today' : `Due in ${daysLeft}d`
                                      : `Due ${formatDate(p.deadline)}`}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--color-text-tertiary)' }}>No deadline</span>
                              )}
                              <span>{p.client ? p.client.email : 'No client'}</span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── Completed projects ── */}
              {completed.length > 0 && (
                <div className="section">
                  <div className="section-header">
                    <div className="section-title">Completed <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-text-tertiary)' }}>({completed.length})</span></div>
                  </div>
                  <div className="projects-grid">
                    {completed.map(p => (
                      <Link key={p.id} to={`/admin/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                        <div className="project-card" style={{ opacity: 0.85 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <div className="project-card-title">{p.title}</div>
                            <StatusBadge status={p.status} />
                          </div>
                          {p.description && <div className="project-card-desc">{p.description}</div>}
                          <div style={{ marginBottom: 10 }}>
                            <div className="progress-bar-wrap">
                              <div className="progress-bar-fill" style={{ width: `${p.progress}%` }} />
                            </div>
                          </div>
                          <div className="project-card-meta">
                            {p.deadline && <span>Deadline was {formatDate(p.deadline)}</span>}
                            <span>{p.client ? p.client.email : 'No client'}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {projects.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">📁</div>
                  <div className="empty-state-title">No projects yet</div>
                  <div className="empty-state-sub">Create your first project to see analytics here</div>
                  <Link to="/admin/projects/new" className="btn btn-primary">Create Project</Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
