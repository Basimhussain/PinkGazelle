// All TypeScript interfaces matching Supabase row shapes exactly

export type UserRole = 'admin' | 'client'

export interface Profile {
  id: string
  role: UserRole
  email: string
  first_name: string | null
  last_name: string | null
  created_at: string
}

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived'

export interface Project {
  id: string
  title: string
  description: string | null
  client_id: string | null
  status: ProjectStatus
  deadline: string | null
  created_at: string
}

export interface ProjectWithProgress extends Project {
  progress: number
  client?: Profile
}

export type TicketStatus = 'todo' | 'in_progress' | 'done'

export interface Ticket {
  id: string
  project_id: string
  title: string
  description: string | null
  status: TicketStatus
  created_at: string
}

export type MilestoneStatus = 'pending' | 'completed'

export interface Milestone {
  id: string
  project_id: string
  title: string
  status: MilestoneStatus
  due_date: string | null
  created_at: string
}

export interface ActivityLog {
  id: string
  project_id: string
  actor_id: string | null
  action: string
  entity_type: string
  entity_id: string
  created_at: string
  actor?: Profile
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid'

export interface Invoice {
  id: string
  project_id: string
  amount: number
  status: InvoiceStatus
  due_date: string | null
  created_at: string
}

export type CommentEntityType = 'ticket' | 'milestone' | 'invoice'

export interface Comment {
  id: string
  ticket_id: string | null
  milestone_id: string | null
  invoice_id: string | null
  author_id: string
  content: string
  created_at: string
  author?: Profile
}

export interface ProjectInvite {
  id: string
  project_id: string
  email: string
  token: string
  status: 'pending' | 'accepted' | 'rescinded'
  created_at: string
}
