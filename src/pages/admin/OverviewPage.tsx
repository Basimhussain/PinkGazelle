import { useState, useEffect } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { AdminSidebar } from '../../components/admin/AdminSidebar'
import { getAllProjects, getArchivedProjects, deleteProject } from '../../lib/projects'
import { computePercentage } from '../../lib/progress'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { formatDate } from '../../lib/utils'
import { useRealtimeProjects } from '../../hooks/useRealtimeProjects'
import type { ProjectWithProgress } from '../../types'
import logoFooter from '../../assets/logo-admin-footer.png'

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
          <div className="empty-state-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
              <path d="m3.3 7 8.7 5 8.7-5"/>
              <path d="M12 22V12"/>
            </svg>
          </div>
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

// ── Projects List View ────────────────────────────────────────────────────────
function ProjectsListView({ projects, loading, onDeleted }: { projects: ProjectWithProgress[]; loading: boolean; onDeleted: (ids: string[]) => void }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === projects.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(projects.map(p => p.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (!selectedIds.size || isDeleting) return
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} project(s)? This cannot be undone.`)) return

    setIsDeleting(true)
    try {
      await Promise.all(Array.from(selectedIds).map(id => deleteProject(id)))
      onDeleted(Array.from(selectedIds))
      setSelectedIds(new Set())
    } catch (err) {
      alert('Failed to delete some projects')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteOne = async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm(`Delete "${title}"?`)) return
    try {
      await deleteProject(id)
      onDeleted([id])
    } catch (err) {
      alert('Failed to delete project')
    }
  }

  if (loading) return <div className="page-content"><div className="empty-state"><p>Loading…</p></div></div>
  if (projects.length === 0) return (
    <div className="page-content">
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
          </svg>
        </div>
        <div className="empty-state-title">No projects yet</div>
        <div className="empty-state-sub">Create your first project to get started</div>
        <Link to="/admin/projects/new" className="btn btn-primary">Create Project</Link>
      </div>
    </div>
  )

  return (
    <div className="page-content">
      <div className="section">
        <div className="section-header" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={selectedIds.size === projects.length} onChange={toggleAll} />
              Select All ({projects.length})
            </label>
            {selectedIds.size > 0 && (
              <button className="btn btn-danger btn-sm" onClick={handleBulkDelete} disabled={isDeleting}>
                Delete Selected ({selectedIds.size})
              </button>
            )}
          </div>
        </div>

        <div className="projects-grid">
          {projects.map(p => (
            <div key={p.id} style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
                <input 
                  type="checkbox" 
                  checked={selectedIds.has(p.id)} 
                  onChange={() => toggleSelect(p.id)} 
                  style={{ width: 16, height: 16 }}
                />
              </div>
              <Link to={`/admin/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                <div className={`project-card ${selectedIds.has(p.id) ? 'selected' : ''}`} style={{ paddingLeft: 40 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div className="project-card-title">{p.title}</div>
                    <StatusBadge status={p.status} />
                  </div>
                  {p.description && <div className="project-card-desc" style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{p.description}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                    <div className="project-card-meta">
                      <span>{p.client ? p.client.email : 'No client'}</span>
                    </div>
                    <button 
                      className="btn btn-ghost btn-sm text-danger" 
                      onClick={(e) => handleDeleteOne(e, p.id, p.title)}
                      style={{ padding: 4 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main dashboard ─────────────────────────────────────────────────────────────
export function AdminOverviewPage() {
  useDocumentTitle('Pink Gazelle – Admin Portal')
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const showArchived = searchParams.get('archived') === 'true'
  const isAllProjectsPage = location.pathname === '/admin/projects' && !showArchived

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
      setProjects((prev: ProjectWithProgress[]) => [{ ...project, progress }, ...prev])
    },
    onUpdate: async (project) => {
      const isArchived = project.status === 'archived'
      if (isArchived !== showArchived) {
        // project moved in/out of this view — remove it
        setProjects((prev: ProjectWithProgress[]) => prev.filter(p => p.id !== project.id))
        return
      }
      const progress = await computePercentage(project.id)
      setProjects((prev: ProjectWithProgress[]) =>
        prev.map(p => p.id === project.id ? { ...project, progress, client: p.client } : p)
      )
    },
    onDelete: (id) => {
      setProjects((prev: ProjectWithProgress[]) => prev.filter(p => p.id !== id))
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
            <Link to="/admin/projects/new" className="btn btn-primary">+ New Project</Link>
          </div>
          <ArchivedView projects={projects} loading={loading} />
          <footer style={{ 
            padding: '80px 0 60px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 20,
            marginTop: 'auto'
          }}>
            <img src={logoFooter} alt="Pink Gazelle" style={{ width: 80, height: 'auto', borderRadius: '8px' }} />
            <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', fontWeight: 500, letterSpacing: '0.02em' }}>
              © {new Date().getFullYear()} Pink Gazelle®. All rights reserved.
            </div>
          </footer>
        </div>
      </div>
    )
  }

  if (isAllProjectsPage) {
    return (
      <div className="app-shell">
        <AdminSidebar />
        <div className="app-main">
          <div className="topbar">
            <div>
              <div className="topbar-title">All Projects</div>
              <div className="topbar-subtitle">Manage and organize your project list</div>
            </div>
            <Link to="/admin/projects/new" className="btn btn-primary">+ New Project</Link>
          </div>
          <ProjectsListView 
            projects={projects} 
            loading={loading} 
            onDeleted={(ids: string[]) => setProjects((prev: ProjectWithProgress[]) => prev.filter(p => !ids.includes(p.id)))} 
          />
          <footer style={{ 
            padding: '80px 0 60px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 20,
            marginTop: 'auto'
          }}>
            <img src={logoFooter} alt="Pink Gazelle" style={{ width: 80, height: 'auto', borderRadius: '8px' }} />
            <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', fontWeight: 500, letterSpacing: '0.02em' }}>
              © {new Date().getFullYear()} Pink Gazelle®. All rights reserved.
            </div>
          </footer>
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
                  <div className="empty-state-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
                    </svg>
                  </div>
                  <div className="empty-state-title">No projects yet</div>
                  <div className="empty-state-sub">Create your first project to see analytics here</div>
                  <Link to="/admin/projects/new" className="btn btn-primary">Create Project</Link>
                </div>
              )}
            </>
          )}
        </div>
        <footer style={{ 
          padding: '80px 0 60px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 20,
          marginTop: 'auto'
        }}>
          <img src={logoFooter} alt="Pink Gazelle" style={{ width: 80, height: 'auto', borderRadius: '8px' }} />
          <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', fontWeight: 500, letterSpacing: '0.02em' }}>
            © {new Date().getFullYear()} Pink Gazelle®. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  )
}
