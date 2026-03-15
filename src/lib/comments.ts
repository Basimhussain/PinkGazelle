import { supabase } from './supabase'
import type { Comment, CommentEntityType } from '../types'

function entityFilter(type: CommentEntityType, id: string) {
  if (type === 'ticket')    return { ticket_id: id }
  if (type === 'milestone') return { milestone_id: id }
  return { invoice_id: id }
}

export async function getComments(
  entityType: CommentEntityType,
  entityId: string
): Promise<Comment[]> {
  const col = entityType === 'ticket' ? 'ticket_id'
            : entityType === 'milestone' ? 'milestone_id'
            : 'invoice_id'
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:profiles(*)')
    .eq(col, entityId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Comment[]
}

export async function createComment(
  entityType: CommentEntityType,
  entityId: string,
  content: string
): Promise<Comment> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('comments')
    .insert({ ...entityFilter(entityType, entityId), content, author_id: user.id })
    .select('*, author:profiles(*)')
    .single()
  if (error) throw error
  return data as Comment
}
