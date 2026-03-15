import { supabase } from './supabase'
import type { Ticket, TicketStatus } from '../types'

export async function getTicketsByProject(projectId: string): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Ticket[]
}

export async function createTicket(
  projectId: string,
  title: string,
  description?: string
): Promise<Ticket> {
  const { data, error } = await supabase
    .from('tickets')
    .insert({ project_id: projectId, title, description })
    .select()
    .single()
  if (error) throw error
  return data as Ticket
}

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus
): Promise<Ticket> {
  const { data, error } = await supabase
    .from('tickets')
    .update({ status })
    .eq('id', ticketId)
    .select()
    .single()
  if (error) throw error
  return data as Ticket
}

export async function updateTicket(
  ticketId: string,
  updates: Partial<Ticket>
): Promise<Ticket> {
  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', ticketId)
    .select()
    .single()
  if (error) throw error
  return data as Ticket
}

export async function deleteTicket(ticketId: string): Promise<void> {
  const { error } = await supabase.from('tickets').delete().eq('id', ticketId)
  if (error) throw error
}

export async function deleteTickets(ticketIds: string[]): Promise<void> {
  const { error } = await supabase.from('tickets').delete().in('id', ticketIds)
  if (error) throw error
}
