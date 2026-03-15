import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { AdminSidebar } from '../../components/admin/AdminSidebar'
import { KanbanColumn } from '../../components/admin/KanbanColumn'
import { ActivityFeed } from '../../components/admin/ActivityFeed'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { SlideOver } from '../../components/shared/SlideOver'
import { useToast } from '../../components/shared/Toast'
import { getProjectById, updateProject, deleteProject } from '../../lib/projects'
import { getTicketsByProject, createTicket, deleteTickets } from '../../lib/tickets'
import { getMilestonesByProject, createMilestone, updateMilestone, deleteMilestone, deleteMilestones, updateMilestoneStatus } from '../../lib/milestones'
import { getInvoicesByProject, createInvoice, updateInvoice, deleteInvoice, deleteInvoices, updateInvoiceStatus } from '../../lib/invoices'
import { deleteActivities } from '../../lib/activity'
import { computePercentage } from '../../lib/progress'
import { generateInvite, getInvitesByProject, rescindInvite, removeClientFromProject, deleteInvite, deleteInvites } from '../../lib/invites'
import { useRealtimeActivity } from '../../hooks/useRealtimeActivity'
import { formatDate, formatSAR } from '../../lib/utils'
import { ConfirmModal } from '../../components/shared/ConfirmModal'
import type { Ticket, TicketStatus, Milestone, Invoice, ProjectWithProgress, ActivityLog, ProjectInvite } from '../../types'

export function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [project, setProject] = useState<ProjectWithProgress | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)

  // New ticket slide-over
  const [addingTicket, setAddingTicket] = useState(false)
  const [ticketTitle, setTicketTitle] = useState('')
  const [ticketDesc, setTicketDesc] = useState('')

  // Invite slide-over
  const [inviting, setInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [invites, setInvites] = useState<ProjectInvite[]>([])

  // Invoice slide-over
  const [addingInvoice, setAddingInvoice] = useState(false)
  const [invoiceAmount, setInvoiceAmount] = useState('')

  // Milestone slide-over
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [milestoneDue, setMilestoneDue] = useState('')

  // Ticket selection
  const [ticketSelectMode, setTicketSelectMode] = useState(false)
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set())

  // Milestone selection + inline edit
  const [milestoneSelectMode, setMilestoneSelectMode] = useState(false)
  const [selectedMilestoneIds, setSelectedMilestoneIds] = useState<Set<string>>(new Set())
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [editMilestoneTitle, setEditMilestoneTitle] = useState('')
  const [editMilestoneDue, setEditMilestoneDue] = useState('')

  // Invoice selection + inline edit
  const [invoiceSelectMode, setInvoiceSelectMode] = useState(false)
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set())
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [editInvoiceAmount, setEditInvoiceAmount] = useState('')
  const [editInvoiceDue, setEditInvoiceDue] = useState('')

  // Activity selection
  const [activitySelectMode, setActivitySelectMode] = useState(false)
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(new Set())

  // Invite selection
  const [inviteSelectMode, setInviteSelectMode] = useState(false)
  const [selectedInviteIds, setSelectedInviteIds] = useState<Set<string>>(new Set())

  // Deadline inline edit
  const [editingDeadline, setEditingDeadline] = useState(false)
  const [deadlineInput, setDeadlineInput] = useState('')

  // Confirmation modal
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    isDanger?: boolean
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      getProjectById(id),
      getTicketsByProject(id),
      getMilestonesByProject(id),
      getInvoicesByProject(id),
      computePercentage(id),
      getInvitesByProject(id),
    ]).then(([proj, tix, ms, inv, pct, invs]) => {
      setProject(proj)
      setTickets(tix)
      setMilestones(ms)
      setInvoices(inv)
      setProgress(pct)
      setInvites(invs)
    }).catch(err => {
      console.error('Failed to load project data:', err)
      showToast('Failed to load project data', 'error')
    }).finally(() => {
      setLoading(false)
    })
  }, [id])

  useRealtimeActivity(
    id ?? null,
    (a) => setActivities(prev => [a, ...prev]),
    (as) => setActivities(as)
  )

  // ── Ticket handlers ──────────────────────────────────────────────────
  function handleTicketStatusChange(ticketId: string, newStatus: TicketStatus) {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t))
    if (id) computePercentage(id).then(setProgress)
  }

  function toggleTicket(ticketId: string) {
    setSelectedTicketIds(prev => {
      const next = new Set(prev)
      next.has(ticketId) ? next.delete(ticketId) : next.add(ticketId)
      return next
    })
  }

  async function handleBulkDeleteTickets() {
    if (!window.confirm(`Delete ${selectedTicketIds.size} ticket(s)?`)) return
    try {
      await deleteTickets([...selectedTicketIds])
      setTickets(prev => prev.filter(t => !selectedTicketIds.has(t.id)))
      setSelectedTicketIds(new Set())
      setTicketSelectMode(false)
      if (id) computePercentage(id).then(setProgress)
      showToast('Tickets deleted', 'success')
    } catch { showToast('Failed to delete tickets', 'error') }
  }

  async function handleAddTicket(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    try {
      const ticket = await createTicket(id, ticketTitle, ticketDesc || undefined)
      setTickets(prev => [ticket, ...prev])
      setTicketTitle(''); setTicketDesc(''); setAddingTicket(false)
      showToast('Ticket created', 'success')
    } catch { showToast('Failed to create ticket', 'error') }
  }

  // ── Milestone handlers ───────────────────────────────────────────────
  function toggleMilestone(msId: string) {
    setSelectedMilestoneIds(prev => {
      const next = new Set(prev)
      next.has(msId) ? next.delete(msId) : next.add(msId)
      return next
    })
  }

  function toggleAllMilestones() {
    if (selectedMilestoneIds.size === milestones.length) {
      setSelectedMilestoneIds(new Set())
    } else {
      setSelectedMilestoneIds(new Set(milestones.map(m => m.id)))
    }
  }

  async function handleBulkDeleteMilestones() {
    if (!window.confirm(`Delete ${selectedMilestoneIds.size} milestone(s)?`)) return
    try {
      await deleteMilestones([...selectedMilestoneIds])
      setMilestones(prev => prev.filter(m => !selectedMilestoneIds.has(m.id)))
      setSelectedMilestoneIds(new Set())
      setMilestoneSelectMode(false)
      showToast('Milestones deleted', 'success')
    } catch { showToast('Failed to delete milestones', 'error') }
  }

  async function handleDeleteMilestone(ms: Milestone) {
    if (!window.confirm(`Delete "${ms.title}"?`)) return
    try {
      await deleteMilestone(ms.id)
      setMilestones(prev => prev.filter(m => m.id !== ms.id))
      showToast('Milestone deleted', 'success')
    } catch { showToast('Failed to delete milestone', 'error') }
  }

  function startEditMilestone(ms: Milestone) {
    setEditingMilestone(ms)
    setEditMilestoneTitle(ms.title)
    setEditMilestoneDue(ms.due_date ?? '')
  }

  async function handleSaveMilestone(e: React.FormEvent) {
    e.preventDefault()
    if (!editingMilestone) return
    try {
      const updated = await updateMilestone(editingMilestone.id, {
        title: editMilestoneTitle,
        due_date: editMilestoneDue || null,
      })
      setMilestones(prev => prev.map(m => m.id === updated.id ? updated : m))
      setEditingMilestone(null)
      showToast('Milestone updated', 'success')
    } catch { showToast('Failed to update milestone', 'error') }
  }

  async function handleAddMilestone(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    try {
      const ms = await createMilestone(id, milestoneTitle, milestoneDue || undefined)
      setMilestones(prev => [...prev, ms].sort((a, b) => {
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return a.due_date.localeCompare(b.due_date)
      }))
      setMilestoneTitle(''); setMilestoneDue(''); setAddingMilestone(false)
      showToast('Milestone added', 'success')
    } catch { showToast('Failed to add milestone', 'error') }
  }

  async function handleMilestoneToggle(ms: Milestone) {
    const newStatus = ms.status === 'pending' ? 'completed' : 'pending'
    const updated = await updateMilestoneStatus(ms.id, newStatus)
    setMilestones(prev => prev.map(m => m.id === ms.id ? updated : m))
  }

  // ── Invoice handlers ─────────────────────────────────────────────────
  function toggleInvoice(invId: string) {
    setSelectedInvoiceIds(prev => {
      const next = new Set(prev)
      next.has(invId) ? next.delete(invId) : next.add(invId)
      return next
    })
  }

  function toggleAllInvoices() {
    if (selectedInvoiceIds.size === invoices.length) {
      setSelectedInvoiceIds(new Set())
    } else {
      setSelectedInvoiceIds(new Set(invoices.map(i => i.id)))
    }
  }

  async function handleBulkDeleteInvoices() {
    if (!window.confirm(`Delete ${selectedInvoiceIds.size} invoice(s)?`)) return
    try {
      await deleteInvoices([...selectedInvoiceIds])
      setInvoices(prev => prev.filter(i => !selectedInvoiceIds.has(i.id)))
      setSelectedInvoiceIds(new Set())
      setInvoiceSelectMode(false)
      showToast('Invoices deleted', 'success')
    } catch { showToast('Failed to delete invoices', 'error') }
  }

  async function handleDeleteInvoice(inv: Invoice) {
    if (!window.confirm('Delete this invoice?')) return
    try {
      await deleteInvoice(inv.id)
      setInvoices(prev => prev.filter(i => i.id !== inv.id))
      showToast('Invoice deleted', 'success')
    } catch { showToast('Failed to delete invoice', 'error') }
  }

  function startEditInvoice(inv: Invoice) {
    setEditingInvoice(inv)
    setEditInvoiceAmount(String(inv.amount))
    setEditInvoiceDue(inv.due_date ?? '')
  }

  async function handleSaveInvoice(e: React.FormEvent) {
    e.preventDefault()
    if (!editingInvoice) return
    try {
      const updated = await updateInvoice(editingInvoice.id, {
        amount: parseFloat(editInvoiceAmount),
        due_date: editInvoiceDue || null,
      })
      setInvoices(prev => prev.map(i => i.id === updated.id ? updated : i))
      setEditingInvoice(null)
      showToast('Invoice updated', 'success')
    } catch { showToast('Failed to update invoice', 'error') }
  }

  async function handleAddInvoice(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    try {
      const inv = await createInvoice(id, parseFloat(invoiceAmount))
      setInvoices(prev => [inv, ...prev])
      setInvoiceAmount(''); setAddingInvoice(false)
      showToast('Invoice created', 'success')
    } catch { showToast('Failed to create invoice', 'error') }
  }

  // ── Activity handlers ────────────────────────────────────────────────
  function toggleActivity(actId: string) {
    setSelectedActivityIds(prev => {
      const next = new Set(prev)
      next.has(actId) ? next.delete(actId) : next.add(actId)
      return next
    })
  }

  function toggleAllActivities() {
    if (selectedActivityIds.size === activities.length) {
      setSelectedActivityIds(new Set())
    } else {
      setSelectedActivityIds(new Set(activities.map(a => a.id)))
    }
  }

  async function handleBulkDeleteActivities() {
    if (!window.confirm(`Delete ${selectedActivityIds.size} activity log(s)?`)) return
    try {
      await deleteActivities([...selectedActivityIds])
      setActivities(prev => prev.filter(a => !selectedActivityIds.has(a.id)))
      setSelectedActivityIds(new Set())
      setActivitySelectMode(false)
      showToast('Activity logs deleted', 'success')
    } catch { showToast('Failed to delete activities', 'error') }
  }

  // ── Deadline handler ─────────────────────────────────────────────────
  async function handleSaveDeadline() {
    if (!id || !project) return
    try {
      const updated = await updateProject(id, { deadline: deadlineInput || null })
      setProject(prev => prev ? { ...prev, deadline: updated.deadline } : prev)
      setEditingDeadline(false)
      showToast('Deadline updated', 'success')
    } catch { showToast('Failed to update deadline', 'error') }
  }

  // ── Project handlers ─────────────────────────────────────────────────
  async function handleSetStatus(newStatus: 'active' | 'paused' | 'completed' | 'archived') {
    if (!id || !project) return
    try {
      const updated = await updateProject(id, { status: newStatus })
      setProject(prev => prev ? { ...prev, status: updated.status } : prev)
      showToast(`Project marked as ${newStatus}`, 'success')
    } catch { showToast('Failed to update project status', 'error') }
  }

  async function handleMarkComplete() {
    await handleSetStatus('completed')
  }

  async function handleArchive() {
    if (!id || !project) return
    setConfirmConfig({
      isOpen: true,
      title: 'Archive Project',
      message: `Are you sure you want to archive "${project.title}"? It will be moved to the Archived section.`,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        try {
          await updateProject(id, { status: 'archived' })
          showToast('Project archived', 'success')
          navigate('/admin/projects')
        } catch { showToast('Failed to archive project', 'error') }
      }
    })
  }

  async function handleDelete() {
    if (!id || !project) return
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Project',
      message: `Delete "${project.title}"? This cannot be undone and will delete all associated tickets, milestones, and invoices.`,
      isDanger: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        try {
          await deleteProject(id)
          showToast('Project deleted', 'success')
          navigate('/admin/projects')
        } catch { showToast('Failed to delete project', 'error') }
      }
    })
  }

  async function handleRescindInvite(e: React.MouseEvent, inviteId: string, email: string) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    setConfirmConfig({
      isOpen: true,
      title: 'Rescind Invite',
      message: `Are you sure you want to rescind the invite for ${email}?`,
      isDanger: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        try {
          await rescindInvite(inviteId)
          setInvites(prev => prev.map(i => i.id === inviteId ? { ...i, status: 'rescinded' as const } : i))
          showToast('Invite rescinded', 'success')
        } catch { showToast('Failed to rescind invite', 'error') }
      }
    })
  }

  async function handleRemoveClient(inviteId: string, email: string) {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Client',
      message: `Remove ${email} from this project? They will lose access immediately.`,
      isDanger: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        try {
          await removeClientFromProject(id!, inviteId)
          setProject(prev => prev ? { ...prev, client: undefined, client_id: null } : prev)
          setInvites(prev => prev.map(i => i.id === inviteId ? { ...i, status: 'rescinded' as const } : i))
          showToast('Client removed from project', 'success')
        } catch { showToast('Failed to remove client', 'error') }
      }
    })
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    try {
      await generateInvite(id, inviteEmail, project?.title ?? '')
      showToast(`Invite sent to ${inviteEmail}`, 'success')
      setInviteEmail('')
      setInviting(false)
      getInvitesByProject(id).then(setInvites)
    } catch (err: unknown) { showToast((err as Error).message || 'Failed to send invite', 'error') }
  }

  // ── Invite handlers ──────────────────────────────────────────────────
  function toggleInvite(inviteId: string) {
    setSelectedInviteIds(prev => {
      const next = new Set(prev)
      next.has(inviteId) ? next.delete(inviteId) : next.add(inviteId)
      return next
    })
  }

  function toggleAllInvites() {
    if (selectedInviteIds.size === invites.length) {
      setSelectedInviteIds(new Set())
    } else {
      setSelectedInviteIds(new Set(invites.map(i => i.id)))
    }
  }

  async function handleBulkDeleteInvites() {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Invites',
      message: `Are you sure you want to delete ${selectedInviteIds.size} invite(s)? This action cannot be undone.`,
      isDanger: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        try {
          await deleteInvites([...selectedInviteIds])
          setInvites(prev => prev.filter(i => !selectedInviteIds.has(i.id)))
          setSelectedInviteIds(new Set())
          setInviteSelectMode(false)
          showToast('Invites deleted', 'success')
        } catch { showToast('Failed to delete invites', 'error') }
      }
    })
  }

  async function handleDeleteInvite(invite: ProjectInvite) {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Invite',
      message: `Are you sure you want to delete the invite for ${invite.email}? This action cannot be undone.`,
      isDanger: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        try {
          await deleteInvite(invite.id)
          setInvites(prev => prev.filter(i => i.id !== invite.id))
          showToast('Invite deleted', 'success')
        } catch { showToast('Failed to delete invite', 'error') }
      }
    })
  }

  if (loading) return <div className="app-shell"><AdminSidebar /><div className="app-main"><div className="page-content">Loading…</div></div></div>
  if (!project) return <div className="app-shell"><AdminSidebar /><div className="app-main"><div className="page-content">Project not found</div></div></div>

  const byStatus = (s: TicketStatus) => tickets.filter(t => t.status === s)

  return (
    <div className="app-shell">
      <AdminSidebar />
      <div className="app-main">
        <div className="topbar">
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>
              <Link to="/admin">Dashboard</Link> / Projects
            </div>
            <div className="topbar-title">{project.title}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setInviting(true)}>
              ✉ Invite Client
            </button>
            {project.status !== 'completed' && project.status !== 'archived' && (
              <button className="btn btn-secondary btn-sm" onClick={handleMarkComplete}>
                ✓ Mark Complete
              </button>
            )}
            {project.status === 'completed' && (
              <button className="btn btn-secondary btn-sm" onClick={() => handleSetStatus('active')}>
                Reopen
              </button>
            )}
            {project.status !== 'archived' && (
              <button className="btn btn-secondary btn-sm" onClick={handleArchive}>
                Archive
              </button>
            )}
            {project.status === 'archived' && (
              <button className="btn btn-secondary btn-sm" onClick={() => handleSetStatus('active')}>
                Unarchive
              </button>
            )}
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>
              Delete
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setAddingTicket(true)}>
              + Ticket
            </button>
          </div>
        </div>

        <div className="page-content">
          {/* Progress */}
          <div className="section">
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
              <StatusBadge status={project.status} />
              {project.client && <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Client: {project.client.email}
              </span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <span style={{ color: 'var(--color-text-tertiary)' }}>Deadline:</span>
                {editingDeadline ? (
                  <>
                    <input
                      type="date"
                      value={deadlineInput}
                      onChange={e => setDeadlineInput(e.target.value)}
                      style={{ fontSize: 13 }}
                      autoFocus
                    />
                    <button className="btn btn-primary btn-sm" onClick={handleSaveDeadline}>Save</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingDeadline(false)}>Cancel</button>
                  </>
                ) : (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '2px 6px', fontSize: 13 }}
                    onClick={() => { setDeadlineInput(project.deadline ?? ''); setEditingDeadline(true) }}
                  >
                    {project.deadline ? formatDate(project.deadline) : 'Set deadline'}
                  </button>
                )}
              </div>
            </div>
            <div className="progress-label">
              <span className="progress-text">Overall Progress</span>
              <span className="progress-pct">{progress}%</span>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Tickets */}
          <div className="section">
            <div className="section-header">
              <div className="section-title">Tickets</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {ticketSelectMode && selectedTicketIds.size > 0 && (
                  <button className="btn btn-danger btn-sm" onClick={handleBulkDeleteTickets}>
                    Delete ({selectedTicketIds.size})
                  </button>
                )}
                <button
                  className={`btn btn-sm ${ticketSelectMode ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setTicketSelectMode(m => !m); setSelectedTicketIds(new Set()) }}
                >
                  {ticketSelectMode ? 'Done' : 'Select'}
                </button>
              </div>
            </div>
            <div className="kanban-board">
              {(['todo', 'in_progress', 'done'] as TicketStatus[]).map(s => (
                <KanbanColumn
                  key={s}
                  status={s}
                  title={s}
                  tickets={byStatus(s)}
                  onStatusChange={handleTicketStatusChange}
                  onTicketUpdated={updated => setTickets(prev => prev.map(t => t.id === updated.id ? updated : t))}
                  onTicketDeleted={ticketId => {
                    setTickets(prev => prev.filter(t => t.id !== ticketId))
                    if (id) computePercentage(id).then(setProgress)
                  }}
                  selectionMode={ticketSelectMode}
                  selectedIds={selectedTicketIds}
                  onToggleSelect={toggleTicket}
                  isAdmin
                />
              ))}
            </div>
            {ticketSelectMode && tickets.length > 0 && (
              <label style={{ marginTop: 8, fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedTicketIds.size === tickets.length && tickets.length > 0}
                  onChange={() => selectedTicketIds.size === tickets.length
                    ? setSelectedTicketIds(new Set())
                    : setSelectedTicketIds(new Set(tickets.map(t => t.id)))
                  }
                />
                Select all ({tickets.length})
              </label>
            )}
          </div>

          {/* Milestones */}
          <div className="section">
            <div className="section-header">
              <div>
                <div className="section-title">Milestones</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                  Client-facing phase checkpoints — mark complete when a deliverable is handed off
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {milestoneSelectMode && selectedMilestoneIds.size > 0 && (
                  <button className="btn btn-danger btn-sm" onClick={handleBulkDeleteMilestones}>
                    Delete ({selectedMilestoneIds.size})
                  </button>
                )}
                <button
                  className={`btn btn-sm ${milestoneSelectMode ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setMilestoneSelectMode(m => !m); setSelectedMilestoneIds(new Set()); setEditingMilestone(null) }}
                >
                  {milestoneSelectMode ? 'Done' : 'Select'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setAddingMilestone(true)}>+ Milestone</button>
              </div>
            </div>
            {milestones.length === 0 ? (
              <div style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>No milestones yet</div>
            ) : (
              <>
                {milestoneSelectMode && (
                  <label style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedMilestoneIds.size === milestones.length}
                      onChange={toggleAllMilestones}
                    />
                    Select all
                  </label>
                )}
                <div className="milestone-list">
                  {milestones.map(ms => {
                    const isOverdue = ms.status === 'pending' && ms.due_date && new Date(ms.due_date) < new Date()
                    const isEditingThis = editingMilestone?.id === ms.id
                    return (
                      <div key={ms.id} className={`milestone-item ${ms.status} ${milestoneSelectMode && selectedMilestoneIds.has(ms.id) ? 'selected' : ''}`}>
                        {milestoneSelectMode ? (
                          <input
                            type="checkbox"
                            className="item-checkbox"
                            checked={selectedMilestoneIds.has(ms.id)}
                            onChange={() => toggleMilestone(ms.id)}
                          />
                        ) : (
                          <button
                            className={`milestone-toggle ${ms.status === 'completed' ? 'completed' : ''}`}
                            onClick={() => handleMilestoneToggle(ms)}
                            aria-label={`Toggle ${ms.title}`}
                          >
                            {ms.status === 'completed' ? '✓' : ''}
                          </button>
                        )}
                        {isEditingThis ? (
                          <form onSubmit={handleSaveMilestone} style={{ display: 'flex', flex: 1, gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              value={editMilestoneTitle}
                              onChange={e => setEditMilestoneTitle(e.target.value)}
                              style={{ flex: 1, minWidth: 120, fontSize: 13 }}
                              required
                            />
                            <input
                              type="date"
                              value={editMilestoneDue}
                              onChange={e => setEditMilestoneDue(e.target.value)}
                              style={{ fontSize: 13 }}
                            />
                            <button type="submit" className="btn btn-primary btn-sm">Save</button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingMilestone(null)}>Cancel</button>
                          </form>
                        ) : (
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="milestone-title" style={{ textDecoration: ms.status === 'completed' ? 'line-through' : '' }}>
                              {ms.title}
                            </div>
                            {ms.due_date && (
                              <div className="milestone-due" style={{ color: isOverdue ? 'var(--color-danger, #ef4444)' : undefined }}>
                                {isOverdue ? '⚠ Overdue · ' : ''}{formatDate(ms.due_date)}
                              </div>
                            )}
                          </div>
                        )}
                        {!milestoneSelectMode && !isEditingThis && (
                          <div className="row-actions">
                            <button className="btn btn-ghost btn-sm" onClick={() => startEditMilestone(ms)}>Edit</button>
                            <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDeleteMilestone(ms)}>Delete</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Invoices */}
          <div className="section">
            <div className="section-header">
              <div className="section-title">Invoices</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {invoiceSelectMode && selectedInvoiceIds.size > 0 && (
                  <button className="btn btn-danger btn-sm" onClick={handleBulkDeleteInvoices}>
                    Delete ({selectedInvoiceIds.size})
                  </button>
                )}
                <button
                  className={`btn btn-sm ${invoiceSelectMode ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setInvoiceSelectMode(m => !m); setSelectedInvoiceIds(new Set()); setEditingInvoice(null) }}
                >
                  {invoiceSelectMode ? 'Done' : 'Select'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setAddingInvoice(true)}>+ Invoice</button>
              </div>
            </div>
            {invoices.length === 0 ? (
              <div style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>No invoices yet</div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="invoice-table">
                  <thead>
                    <tr>
                      {invoiceSelectMode && (
                        <th style={{ width: 36 }}>
                          <input
                            type="checkbox"
                            checked={selectedInvoiceIds.size === invoices.length && invoices.length > 0}
                            onChange={toggleAllInvoices}
                          />
                        </th>
                      )}
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Due</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => {
                      const isEditingThis = editingInvoice?.id === inv.id
                      return (
                        <tr key={inv.id} className={invoiceSelectMode && selectedInvoiceIds.has(inv.id) ? 'selected-row' : ''}>
                          {invoiceSelectMode && (
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedInvoiceIds.has(inv.id)}
                                onChange={() => toggleInvoice(inv.id)}
                              />
                            </td>
                          )}
                          {isEditingThis ? (
                            <td colSpan={invoiceSelectMode ? 3 : 4}>
                              <form onSubmit={handleSaveInvoice} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <input
                                  type="number"
                                  value={editInvoiceAmount}
                                  onChange={e => setEditInvoiceAmount(e.target.value)}
                                  style={{ width: 100, fontSize: 13 }}
                                  min="1" step="0.01" required
                                />
                                <input
                                  type="date"
                                  value={editInvoiceDue}
                                  onChange={e => setEditInvoiceDue(e.target.value)}
                                  style={{ fontSize: 13 }}
                                />
                                <button type="submit" className="btn btn-primary btn-sm">Save</button>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingInvoice(null)}>Cancel</button>
                              </form>
                            </td>
                          ) : (
                            <>
                              <td style={{ fontWeight: 500 }}>{formatSAR(inv.amount)}</td>
                              <td><StatusBadge status={inv.status} /></td>
                              <td>{formatDate(inv.due_date)}</td>
                              <td>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  {inv.status === 'draft' && (
                                    <button className="btn btn-ghost btn-sm" onClick={() => updateInvoiceStatus(inv.id, 'sent').then(u => setInvoices(p => p.map(i => i.id === inv.id ? u : i)))}>
                                      Mark Sent
                                    </button>
                                  )}
                                  {inv.status === 'sent' && (
                                    <button className="btn btn-ghost btn-sm" onClick={() => updateInvoiceStatus(inv.id, 'paid').then(u => setInvoices(p => p.map(i => i.id === inv.id ? u : i)))}>
                                      Mark Paid
                                    </button>
                                  )}
                                  <button className="btn btn-ghost btn-sm" onClick={() => startEditInvoice(inv)}>Edit</button>
                                  <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDeleteInvoice(inv)}>Delete</button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="section">
            <div className="section-header">
              <div className="section-title">Activity</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {activitySelectMode && selectedActivityIds.size > 0 && (
                  <button className="btn btn-danger btn-sm" onClick={handleBulkDeleteActivities}>
                    Delete ({selectedActivityIds.size})
                  </button>
                )}
                <button
                  className={`btn btn-sm ${activitySelectMode ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setActivitySelectMode(m => !m); setSelectedActivityIds(new Set()) }}
                >
                  {activitySelectMode ? 'Done' : 'Select'}
                </button>
              </div>
            </div>
            {activitySelectMode && activities.length > 0 && (
              <label style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedActivityIds.size === activities.length}
                  onChange={toggleAllActivities}
                />
                Select all
              </label>
            )}
            <div className="card">
              <ActivityFeed
                activities={activities}
                selectionMode={activitySelectMode}
                selectedIds={selectedActivityIds}
                onToggleSelect={toggleActivity}
              />
            </div>
          </div>

          {/* Client Invites */}
          <div className="section">
            <div className="section-header">
              <div>
                <div className="section-title">Client Invites</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                  You can send multiple invites — each appears here with its status
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {inviteSelectMode && selectedInviteIds.size > 0 && (
                  <button className="btn btn-danger btn-sm" onClick={handleBulkDeleteInvites}>
                    Delete ({selectedInviteIds.size})
                  </button>
                )}
                <button
                  className={`btn btn-sm ${inviteSelectMode ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setInviteSelectMode(m => !m); setSelectedInviteIds(new Set()) }}
                >
                  {inviteSelectMode ? 'Done' : 'Select'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setInviting(true)}>✉ Invite Client</button>
              </div>
            </div>
            {invites.length === 0 ? (
              <div style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>No invites sent yet</div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="invoice-table">
                  <thead>
                    <tr>
                      {inviteSelectMode && (
                        <th style={{ width: 36 }}>
                          <input
                            type="checkbox"
                            checked={selectedInviteIds.size === invites.length && invites.length > 0}
                            onChange={toggleAllInvites}
                          />
                        </th>
                      )}
                      <th>Email</th>
                      <th>Sent</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map(inv => (
                      <tr key={inv.id} className={inviteSelectMode && selectedInviteIds.has(inv.id) ? 'selected-row' : ''}>
                        {inviteSelectMode && (
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedInviteIds.has(inv.id)}
                              onChange={() => toggleInvite(inv.id)}
                            />
                          </td>
                        )}
                        <td style={{ fontWeight: 500 }}>{inv.email}</td>
                        <td style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>
                          {new Date(inv.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 10px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            background: inv.status === 'accepted'
                              ? 'var(--color-success-bg, #dcfce7)'
                              : inv.status === 'rescinded'
                                ? 'var(--color-danger-bg, #fee2e2)'
                                : 'var(--color-bg-muted)',
                            color: inv.status === 'accepted'
                              ? 'var(--color-success, #16a34a)'
                              : inv.status === 'rescinded'
                                ? 'var(--color-danger, #dc2626)'
                                : 'var(--color-text-tertiary)',
                          }}>
                            {inv.status === 'accepted' ? '✓ Accepted' : inv.status === 'rescinded' ? '✕ Rescinded' : '⏳ Pending'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {inv.status === 'pending' && (
                              <>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={async () => {
                                    try {
                                      await generateInvite(id!, inv.email, project?.title ?? '')
                                      showToast(`Invite resent to ${inv.email}`, 'success')
                                      if (id) getInvitesByProject(id).then(setInvites)
                                    } catch { showToast('Failed to resend invite', 'error') }
                                  }}
                                >
                                  Resend
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm text-danger"
                                  onClick={(e) => handleRescindInvite(e, inv.id, inv.email)}
                                >
                                  Rescind
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm text-danger"
                                  onClick={() => handleDeleteInvite(inv)}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                            {inv.status === 'rescinded' && (
                              <button
                                className="btn btn-ghost btn-sm text-danger"
                                onClick={() => handleDeleteInvite(inv)}
                              >
                                Delete
                              </button>
                            )}
                            {inv.status === 'accepted' && (
                              <>
                                <button
                                  className="btn btn-ghost btn-sm text-danger"
                                  onClick={() => handleRemoveClient(inv.id, inv.email)}
                                >
                                  Remove from project
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm text-danger"
                                  onClick={() => handleDeleteInvite(inv)}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticket SlideOver */}
      <SlideOver isOpen={addingTicket} onClose={() => setAddingTicket(false)} title="New Ticket">
        <form onSubmit={handleAddTicket} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label htmlFor="ticket-title">Title</label>
            <input id="ticket-title" type="text" value={ticketTitle} onChange={e => setTicketTitle(e.target.value)} placeholder="Ticket title" required />
          </div>
          <div className="form-group">
            <label htmlFor="ticket-desc">Description (optional)</label>
            <textarea id="ticket-desc" value={ticketDesc} onChange={e => setTicketDesc(e.target.value)} placeholder="What needs to be done?" />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setAddingTicket(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Ticket</button>
          </div>
        </form>
      </SlideOver>

      {/* Invite SlideOver */}
      <SlideOver isOpen={inviting} onClose={() => setInviting(false)} title="Invite Client">
        <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label htmlFor="invite-email">Client email</label>
            <input id="invite-email" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="client@example.com" required />
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            They will receive an email invitation with a link to set up their account and access their client portal.
          </p>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setInviting(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Send Invite</button>
          </div>
        </form>
      </SlideOver>

      {/* Invoice SlideOver */}
      <SlideOver isOpen={addingInvoice} onClose={() => setAddingInvoice(false)} title="New Invoice">
        <form onSubmit={handleAddInvoice} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label htmlFor="invoice-amount">Amount (SAR)</label>
            <input id="invoice-amount" type="number" min="1" step="0.01" value={invoiceAmount} onChange={e => setInvoiceAmount(e.target.value)} placeholder="5000" required />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setAddingInvoice(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Invoice</button>
          </div>
        </form>
      </SlideOver>

      {/* Milestone SlideOver */}
      <SlideOver isOpen={addingMilestone} onClose={() => setAddingMilestone(false)} title="New Milestone">
        <form onSubmit={handleAddMilestone} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label htmlFor="milestone-title">Deliverable</label>
            <input id="milestone-title" type="text" value={milestoneTitle} onChange={e => setMilestoneTitle(e.target.value)} placeholder="e.g. Design approved, Beta launch" required />
          </div>
          <div className="form-group">
            <label htmlFor="milestone-due">Due date (optional)</label>
            <input id="milestone-due" type="date" value={milestoneDue} onChange={e => setMilestoneDue(e.target.value)} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setAddingMilestone(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Milestone</button>
          </div>
        </form>
      </SlideOver>
      {/* Milestone SlideOver ... */}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        isDanger={confirmConfig.isDanger}
      />
    </div>
  )
}
