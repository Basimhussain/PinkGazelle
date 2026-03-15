import { useState } from 'react'
import { StatusBadge } from '../shared/StatusBadge'
import { SlideOver } from '../shared/SlideOver'
import { CommentThread } from '../shared/CommentThread'
import { updateTicketStatus, updateTicket, deleteTicket } from '../../lib/tickets'
import { useToast } from '../shared/Toast'
import type { Ticket, TicketStatus } from '../../types'

interface KanbanColumnProps {
  status: TicketStatus
  title: string
  tickets: Ticket[]
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void
  onTicketUpdated: (ticket: Ticket) => void
  onTicketDeleted: (ticketId: string) => void
  selectionMode: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  isAdmin?: boolean
}

const STATUS_OPTIONS: TicketStatus[] = ['todo', 'in_progress', 'done']

export function KanbanColumn({
  status, title, tickets, onStatusChange, onTicketUpdated, onTicketDeleted,
  selectionMode, selectedIds, onToggleSelect, isAdmin = false
}: KanbanColumnProps) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const { showToast } = useToast()

  async function handleStatusChange(ticketId: string, newStatus: TicketStatus) {
    try {
      await updateTicketStatus(ticketId, newStatus)
      onStatusChange(ticketId, newStatus)
    } catch {
      showToast('Failed to move ticket', 'error')
    }
  }

  function openEdit(ticket: Ticket) {
    setEditTitle(ticket.title)
    setEditDesc(ticket.description ?? '')
    setEditing(true)
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTicket) return
    try {
      const updated = await updateTicket(selectedTicket.id, { title: editTitle, description: editDesc || null })
      onTicketUpdated(updated)
      setSelectedTicket(updated)
      setEditing(false)
      showToast('Ticket updated', 'success')
    } catch { showToast('Failed to update ticket', 'error') }
  }

  async function handleDelete(ticket: Ticket) {
    if (!window.confirm(`Delete "${ticket.title}"?`)) return
    try {
      await deleteTicket(ticket.id)
      onTicketDeleted(ticket.id)
      setSelectedTicket(null)
      showToast('Ticket deleted', 'success')
    } catch { showToast('Failed to delete ticket', 'error') }
  }

  // ── Drag handlers ──────────────────────────────────────────────────
  function handleDragStart(e: React.DragEvent, ticket: Ticket) {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: ticket.id, fromStatus: ticket.status }))
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(ticket.id)
  }

  function handleDragEnd() {
    setDraggingId(null)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    // only clear if leaving the column itself, not a child element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    try {
      const { id: ticketId, fromStatus } = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (fromStatus !== status) {
        await handleStatusChange(ticketId, status)
      }
    } catch { /* invalid drag data */ }
  }

  return (
    <>
      <div
        className={`kanban-column ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="kanban-column-header">
          <div className="kanban-column-title">
            <StatusBadge status={status} />
          </div>
          <span className="kanban-count">{tickets.length}</span>
        </div>
        <div className="kanban-cards">
          {tickets.length === 0 && (
            <div className={`empty-column ${isDragOver ? 'drag-over-empty' : ''}`}>
              {isDragOver ? 'Drop here' : `No ${title.toLowerCase()} tickets`}
            </div>
          )}
          {tickets.map(ticket => (
            <div
              key={ticket.id}
              className={`ticket-card ${selectionMode && selectedIds.has(ticket.id) ? 'selected' : ''} ${draggingId === ticket.id ? 'dragging' : ''}`}
              draggable={!selectionMode}
              onDragStart={e => handleDragStart(e, ticket)}
              onDragEnd={handleDragEnd}
              onClick={() => selectionMode ? onToggleSelect(ticket.id) : (!draggingId && setSelectedTicket(ticket))}
              role="button"
              tabIndex={0}
              aria-label={`${selectionMode ? 'Select' : 'Open'} ticket: ${ticket.title}`}
              onKeyDown={e => e.key === 'Enter' && (selectionMode ? onToggleSelect(ticket.id) : setSelectedTicket(ticket))}
            >
              {selectionMode && (
                <input
                  type="checkbox"
                  className="item-checkbox"
                  checked={selectedIds.has(ticket.id)}
                  onChange={() => onToggleSelect(ticket.id)}
                  onClick={e => e.stopPropagation()}
                />
              )}
              {!selectionMode && (
                <div className="drag-handle" title="Drag to move">⠿</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ticket-card-title">{ticket.title}</div>
                {ticket.description && (
                  <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                    {ticket.description.slice(0, 60)}{ticket.description.length > 60 ? '…' : ''}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedTicket && (
        <SlideOver
          isOpen={!!selectedTicket}
          onClose={() => { setSelectedTicket(null); setEditing(false) }}
          title={editing ? 'Edit Ticket' : selectedTicket.title}
        >
          {editing ? (
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label htmlFor="edit-ticket-title">Title</label>
                <input id="edit-ticket-title" type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="edit-ticket-desc">Description</label>
                <textarea id="edit-ticket-desc" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          ) : (
            <>
              {selectedTicket.description && (
                <div>
                  <div className="card-title" style={{ marginBottom: 6 }}>Description</div>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{selectedTicket.description}</p>
                </div>
              )}

              <div>
                <div className="card-title" style={{ marginBottom: 8 }}>Status</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {isAdmin ? STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      className={`btn btn-sm ${s === selectedTicket.status ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => {
                        handleStatusChange(selectedTicket.id, s)
                        setSelectedTicket({ ...selectedTicket, status: s })
                      }}
                      aria-pressed={s === selectedTicket.status}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  )) : <StatusBadge status={selectedTicket.status} />}
                </div>
              </div>

              {isAdmin && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(selectedTicket)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selectedTicket)}>Delete</button>
                </div>
              )}

              <div>
                <div className="card-title" style={{ marginBottom: 12 }}>Comments</div>
                <CommentThread entityType="ticket" entityId={selectedTicket.id} canComment={true} />
              </div>
            </>
          )}
        </SlideOver>
      )}
    </>
  )
}
