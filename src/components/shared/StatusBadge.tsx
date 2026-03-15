import type { TicketStatus, InvoiceStatus, MilestoneStatus, ProjectStatus } from '../../types'

type AnyStatus = TicketStatus | InvoiceStatus | MilestoneStatus | ProjectStatus

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  pending: 'Pending',
  completed: 'Completed',
  active: 'Active',
  paused: 'Paused',
  archived: 'Archived',
}

export function StatusBadge({ status }: { status: AnyStatus }) {
  return (
    <span className={`status-badge ${status}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
