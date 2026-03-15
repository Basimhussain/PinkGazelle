import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getActivityByProject } from '../lib/activity'
import type { ActivityLog } from '../types'

export function useRealtimeActivity(
  projectId: string | null,
  onNewActivity: (activity: ActivityLog) => void,
  onInitialLoad: (activities: ActivityLog[]) => void
) {
  const callbackRef = useRef(onNewActivity)
  callbackRef.current = onNewActivity

  useEffect(() => {
    if (!projectId) return

    getActivityByProject(projectId).then(onInitialLoad)

    const channel = supabase
      .channel(`activity:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => callbackRef.current(payload.new as ActivityLog)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps
}
