import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { Avatar } from '../../components/shared/Avatar'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { SlideOver } from '../../components/shared/SlideOver'
import { CommentThread } from '../../components/shared/CommentThread'
import { ActivityFeed } from '../../components/admin/ActivityFeed'
import { useAuthStore } from '../../store/useAuthStore'
import { useRealtimeActivity } from '../../hooks/useRealtimeActivity'
import { getClientProjects, getClientProject } from '../../lib/projects'
import { getTicketsByProject } from '../../lib/tickets'
import { getMilestonesByProject } from '../../lib/milestones'
import { getInvoicesByProject } from '../../lib/invoices'
import { computePercentage } from '../../lib/progress'
import { signOut } from '../../lib/auth'
import { formatDate, formatSAR } from '../../lib/utils'
import logo from '../../assets/logo-login.png'
import logoWhite from '../../assets/logo-footer.png'
import type { Ticket, Milestone, Invoice, ProjectWithProgress, ActivityLog } from '../../types'

type ActiveTab = 'tickets' | 'milestones' | 'invoices' | 'activity'

export function ClientDashboardPage() {
  useDocumentTitle('Pink Gazelle – Client Portal')
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectWithProgress[]>([])
  const [project, setProject] = useState<ProjectWithProgress | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>('tickets')

  // Slide-overs
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  const displayName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email
    : 'Client'

  useEffect(() => {
    getClientProjects().then(projs => {
      setProjects(projs)
      // If only one project, select it automatically for a smoother experience
      if (projs.length === 1) {
        handleSelectProject(projs[0].id)
      } else {
        setLoading(false)
      }
    })
  }, [])

  async function handleSelectProject(projectId: string) {
    setLoading(true)
    try {
      const proj = await getClientProject(projectId)
      if (!proj) {
        setLoading(false)
        return
      }
      setProject(proj)
      const [tix, ms, inv, pct] = await Promise.all([
        getTicketsByProject(proj.id),
        getMilestonesByProject(proj.id),
        getInvoicesByProject(proj.id),
        computePercentage(proj.id),
      ])
      setTickets(tix)
      setMilestones(ms)
      setInvoices(inv)
      setProgress(pct)
    } catch (err) {
      console.error('Error selecting project:', err)
    } finally {
      setLoading(false)
    }
  }

  useRealtimeActivity(
    project?.id ?? null,
    (a) => setActivities(prev => [a, ...prev]),
    (as) => setActivities(as)
  )

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
      <div className="sidebar-logo-mark" style={{ width: 48, height: 48, background: 'transparent' }}>
        <img src={logo} alt="PG" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
      </div>
      <div style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Loading your portal…</div>
    </div>
  )

  if (!project) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-subtle)', display: 'flex', flexDirection: 'column' }}>
        <div className="topbar" style={{ paddingLeft: 24, paddingRight: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="sidebar-logo-mark" style={{ background: 'var(--color-text-primary)', width: 36, height: 36 }}>
              <img src={logo} alt="PG" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 18 }}>Pink Gazelle – Client Portal</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={displayName} size="sm" />
            <button className="btn btn-ghost btn-sm" onClick={handleSignOut} aria-label="Sign out" style={{ fontSize: 16 }}>↩</button>
          </div>
        </div>

        <div className="page-content" style={{ maxWidth: 1000, margin: '0 auto', width: '100%', paddingTop: 40 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 className="page-title" style={{ marginBottom: 8 }}>Welcome, {profile?.first_name || 'Client'}</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 15 }}>Select a project to view its status and updates.</p>
          </div>

          {projects.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ marginBottom: 16, color: 'var(--color-text-tertiary)' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z"/>
                  <polyline points="15 9 18 12 15 15"/><line x1="2" x2="18" y1="12" y2="12"/>
                </svg>
              </div>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>No projects assigned yet</div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Your admin will invite you once a project is ready.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {projects.map(p => (
                <div
                  key={p.id}
                  className="card project-card"
                  style={{ cursor: 'pointer', transition: 'transform 0.2s', padding: 24 }}
                  onClick={() => handleSelectProject(p.id)}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{p.title}</h3>
                      <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                        Created {new Date(p.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  
                  <div className="progress-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className="progress-text" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Overall Progress</span>
                    <span className="progress-pct" style={{ fontSize: 12, fontWeight: 600 }}>{p.progress || 0}%</span>
                  </div>
                  <div className="progress-bar-wrap" style={{ height: 8, background: 'var(--color-border-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                    <div 
                      className="progress-bar-fill" 
                      style={{ 
                        width: `${p.progress || 0}%`, 
                        height: '100%', 
                        background: 'var(--color-primary)',
                        transition: 'width 0.3s ease'
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer style={{ 
          padding: '100px 0 80px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 20,
          marginTop: 'auto'
        }}>
          <img src={logoWhite} alt="Pink Gazelle" style={{ width: 80, height: 'auto' }} />
          <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', fontWeight: 500, letterSpacing: '0.02em' }}>
            © {new Date().getFullYear()} Pink Gazelle®. All rights reserved.
          </div>
        </footer>
      </div>
    )
  }

  // 2. Single Project Detailed View
  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'tickets',    label: 'Tickets' },
    { id: 'milestones', label: 'Milestones' },
    { id: 'invoices',   label: 'Invoices' },
    { id: 'activity',   label: 'Activity' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-subtle)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div className="topbar" style={{ paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="sidebar-logo-mark" style={{ background: 'var(--color-text-primary)', width: 36, height: 36 }}>
            <img src={logo} alt="PG" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
          </div>
          <div style={{ fontWeight: 600, fontSize: 18 }}>Pink Gazelle – Client Portal</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={displayName} size="sm" />
          <span style={{ fontSize: 13, fontWeight: 500 }}>{displayName}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleSignOut} aria-label="Sign out">↩</button>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: 1000, margin: '0 auto', width: '100%', paddingTop: 40 }}>
        {/* Back navigation */}
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={() => setProject(null)}
          style={{ marginBottom: 16, paddingLeft: 0, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          All Projects
        </button>

        {/* Project Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <h1 className="page-title" style={{ margin: 0, fontSize: 32 }}>{project.title}</h1>
            <StatusBadge status={project.status} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            {project.deadline && (
              <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
                Deadline: {formatDate(project.deadline)}
              </span>
            )}
            <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
              Assigned to {displayName}
            </span>
          </div>
          {project.description && (
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 20, maxWidth: 800 }}>{project.description}</p>
          )}

          {/* Progress bar */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="progress-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span className="progress-text" style={{ fontWeight: 500 }}>Project Progress</span>
              <span className="progress-pct" style={{ fontWeight: 600, fontSize: 18 }}>{progress}%</span>
            </div>
            <div className="progress-bar-wrap" style={{ height: 10, background: 'var(--color-border-subtle)', borderRadius: 5, overflow: 'hidden' }}>
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${progress}%`, 
                  height: '100%', 
                  background: 'var(--color-primary)',
                  transition: 'width 0.5s ease-out'
                }} 
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--color-border-subtle)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className="btn btn-ghost"
              style={{
                borderRadius: 0,
                borderBottom: activeTab === tab.id ? '2px solid var(--color-text-primary)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontWeight: activeTab === tab.id ? 600 : 400,
                paddingBottom: 12,
                paddingLeft: 16,
                paddingRight: 16,
              }}
              onClick={() => setActiveTab(tab.id)}
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div>
            {tickets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.69.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1"/>
                    <path d="M2 13h20"/><path d="m7 13 4 4 4-4"/>
                  </svg>
                </div>
                <div className="empty-state-title">No tickets yet</div>
                <div className="empty-state-sub">Your admin will add tickets as work begins.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tickets.map(ticket => (
                  <div
                    key={ticket.id}
                    className="card"
                    style={{ cursor: 'pointer', padding: '16px 20px' }}
                    onClick={() => setSelectedTicket(ticket)}
                    role="button"
                    tabIndex={0}
                    aria-label={`View ticket: ${ticket.title}`}
                    onKeyDown={e => e.key === 'Enter' && setSelectedTicket(ticket)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{ticket.title}</span>
                      <StatusBadge status={ticket.status} />
                    </div>
                    {ticket.description && (
                      <p style={{ marginTop: 6, fontSize: 13, color: 'var(--color-text-secondary)', maxWidth: '90%' }}>{ticket.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <div>
            {milestones.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>
                  </svg>
                </div>
                <div className="empty-state-title">No milestones yet</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {milestones.map(ms => (
                  <div
                    key={ms.id}
                    className="card"
                    style={{ cursor: 'pointer', padding: '16px 20px' }}
                    onClick={() => setSelectedMilestone(ms)}
                    role="button"
                    tabIndex={0}
                    aria-label={`View milestone: ${ms.title}`}
                    onKeyDown={e => e.key === 'Enter' && setSelectedMilestone(ms)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>
                        {ms.status === 'completed' ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}>
                            <path d="M20 6 9 17l-5-5"/>
                          </svg>
                        ) : ''}
                        {ms.title}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {ms.due_date && (
                          <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>Due {formatDate(ms.due_date)}</span>
                        )}
                        <StatusBadge status={ms.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div>
            {invoices.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <div className="empty-state-title">No invoices yet</div>
              </div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 20 }}>Amount</th>
                      <th>Status</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr
                        key={inv.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedInvoice(inv)}
                        tabIndex={0}
                        role="button"
                        aria-label={`View invoice ${formatSAR(inv.amount)}`}
                        onKeyDown={e => e.key === 'Enter' && setSelectedInvoice(inv)}
                      >
                        <td style={{ fontWeight: 600, paddingLeft: 20 }}>{formatSAR(inv.amount)}</td>
                        <td><StatusBadge status={inv.status} /></td>
                        <td>{formatDate(inv.due_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="card" style={{ padding: '24px' }}>
            <ActivityFeed activities={activities} />
          </div>
        )}
      </div>

      <footer style={{ 
        padding: '120px 0 100px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: 20,
        marginTop: 'auto'
      }}>
        <img src={logoWhite} alt="Pink Gazelle" style={{ width: 80, height: 'auto' }} />
        <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', fontWeight: 500, letterSpacing: '0.02em' }}>
          © {new Date().getFullYear()} Pink Gazelle®. All rights reserved.
        </div>
      </footer>

      {/* Ticket SlideOver */}
      {selectedTicket && (
        <SlideOver
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={selectedTicket.title}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div className="card-title" style={{ marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)' }}>Status</div>
              <StatusBadge status={selectedTicket.status} />
            </div>
            {selectedTicket.description && (
              <div>
                <div className="card-title" style={{ marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)' }}>Description</div>
                <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{selectedTicket.description}</p>
              </div>
            )}
            <div>
              <div className="card-title" style={{ marginBottom: 16, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)' }}>Comments & Updates</div>
              <CommentThread entityType="ticket" entityId={selectedTicket.id} canComment={true} />
            </div>
          </div>
        </SlideOver>
      )}

      {/* Milestone SlideOver */}
      {selectedMilestone && (
        <SlideOver
          isOpen={!!selectedMilestone}
          onClose={() => setSelectedMilestone(null)}
          title={selectedMilestone.title}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <div className="card-title" style={{ marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)' }}>Status</div>
                <StatusBadge status={selectedMilestone.status} />
              </div>
              {selectedMilestone.due_date && (
                <div>
                  <div className="card-title" style={{ marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)' }}>Due Date</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{formatDate(selectedMilestone.due_date)}</div>
                </div>
              )}
            </div>
            <div>
              <div className="card-title" style={{ marginBottom: 16, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)' }}>Comments & Updates</div>
              <CommentThread entityType="milestone" entityId={selectedMilestone.id} canComment={true} />
            </div>
          </div>
        </SlideOver>
      )}

      {/* Invoice SlideOver */}
      {selectedInvoice && (
        <SlideOver
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice — ${formatSAR(selectedInvoice.amount)}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <div className="card-title" style={{ marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)' }}>Status</div>
                <StatusBadge status={selectedInvoice.status} />
              </div>
              {selectedInvoice.due_date && (
                <div>
                  <div className="card-title" style={{ marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)' }}>Due Date</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{formatDate(selectedInvoice.due_date)}</div>
                </div>
              )}
            </div>
            <div>
              <div className="card-title" style={{ marginBottom: 16, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)' }}>Comments & Updates</div>
              <CommentThread entityType="invoice" entityId={selectedInvoice.id} canComment={true} />
            </div>
          </div>
        </SlideOver>
      )}
    </div>
  )
}
