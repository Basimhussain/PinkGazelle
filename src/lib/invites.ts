import { supabase } from './supabase'
import type { ProjectInvite } from '../types'

export async function getInvitesByProject(projectId: string): Promise<ProjectInvite[]> {
  const { data, error } = await supabase
    .from('project_invites')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ProjectInvite[]
}

export async function generateInvite(
  projectId: string,
  email: string,
  projectTitle: string
): Promise<ProjectInvite> {
  const token = crypto.randomUUID()
  const { data, error } = await supabase
    .from('project_invites')
    .insert({ project_id: projectId, email, token })
    .select()
    .single()
  if (error) throw error

  // Send invite email using supabase.functions.invoke
  const { error: funcError } = await supabase.functions.invoke('send-invite', {
    body: { email, token, projectTitle },
  })
  
  if (funcError) {
    console.error('Edge Function error:', funcError)
    
    // Try to get a more specific message if available
    let detailedMessage = funcError.message
    try {
      // In some versions of supabase-js, the error body is available via context
      // Note: We'll just report the message for now, but log the object for the user
      if (funcError.name === 'FunctionsHttpError') {
        const body = await (funcError as any).context?.json().catch(() => null)
        if (body?.error) detailedMessage = body.error
      }
    } catch (e) {
      console.error('Error parsing function error body', e)
    }
    
    throw new Error(detailedMessage || 'Invitation failed to send email (Auth Error)')
  }

  return data as ProjectInvite
}

export async function validateInviteToken(
  token: string
): Promise<{ email: string; projectId: string } | null> {
  const { data, error } = await supabase
    .from('project_invites')
    .select('email, project_id, status')
    .eq('token', token)
    .eq('status', 'pending')
    .single()
  if (error || !data) return null
  return { email: data.email, projectId: data.project_id }
}

export async function markInviteAccepted(token: string): Promise<void> {
  const { error } = await supabase
    .from('project_invites')
    .update({ status: 'accepted' })
    .eq('token', token)
  if (error) throw error
}

export async function rescindInvite(inviteId: string): Promise<void> {
  const { error } = await supabase
    .from('project_invites')
    .update({ status: 'rescinded' })
    .eq('id', inviteId)
  if (error) throw error
}

export async function removeClientFromProject(projectId: string, inviteId: string): Promise<void> {
  const { error: projectError } = await supabase
    .from('projects')
    .update({ client_id: null })
    .eq('id', projectId)
  if (projectError) throw projectError

  const { error: inviteError } = await supabase
    .from('project_invites')
    .update({ status: 'rescinded' })
    .eq('id', inviteId)
  if (inviteError) throw inviteError
}

export async function deleteInvite(inviteId: string): Promise<void> {
  const { error } = await supabase
    .from('project_invites')
    .delete()
    .eq('id', inviteId)
  if (error) throw error
}

export async function deleteInvites(inviteIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('project_invites')
    .delete()
    .in('id', inviteIds)
  if (error) throw error
}
