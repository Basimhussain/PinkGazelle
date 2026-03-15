import { supabase } from './supabase'
import type { Invoice } from '../types'

export async function getInvoicesByProject(projectId: string): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Invoice[]
}

export async function createInvoice(
  projectId: string,
  amount: number,
  dueDate?: string
): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .insert({ project_id: projectId, amount, due_date: dueDate })
    .select()
    .single()
  if (error) throw error
  return data as Invoice
}

export async function updateInvoice(
  invoiceId: string,
  updates: { amount?: number; due_date?: string | null }
): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', invoiceId)
    .select()
    .single()
  if (error) throw error
  return data as Invoice
}

export async function deleteInvoice(invoiceId: string): Promise<void> {
  const { error } = await supabase.from('invoices').delete().eq('id', invoiceId)
  if (error) throw error
}

export async function deleteInvoices(invoiceIds: string[]): Promise<void> {
  const { error } = await supabase.from('invoices').delete().in('id', invoiceIds)
  if (error) throw error
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: 'draft' | 'sent' | 'paid'
): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', invoiceId)
    .select()
    .single()
  if (error) throw error
  return data as Invoice
}
