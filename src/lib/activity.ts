import { supabase } from './supabase'
import type { ActivityLog } from '../types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export async function getActivityByProject(projectId: string): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*, actor:profiles(*)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []) as ActivityLog[]
}

export async function deleteActivity(activityId: string): Promise<void> {
  const { error } = await supabase.from('activity_log').delete().eq('id', activityId)
  if (error) throw error
}

export async function deleteActivities(activityIds: string[]): Promise<void> {
  const { error } = await supabase.from('activity_log').delete().in('id', activityIds)
  if (error) throw error
}

export function subscribeToProjectActivity(
  projectId: string,
  callback: (entry: ActivityLog) => void
): RealtimeChannel {
  return supabase
    .channel(`activity:${projectId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_log',
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => callback(payload.new as ActivityLog)
    )
    .subscribe()
}
