import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Project } from '../types'

interface RealtimeProjectCallbacks {
  onInsert: (project: Project) => void
  onUpdate: (project: Project) => void
  onDelete: (id: string) => void
}

export function useRealtimeProjects(callbacks: RealtimeProjectCallbacks) {
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useEffect(() => {
    const channel = supabase
      .channel('projects:all')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'projects' },
        (payload) => callbacksRef.current.onInsert(payload.new as Project)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'projects' },
        (payload) => callbacksRef.current.onUpdate(payload.new as Project)
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'projects' },
        (payload) => callbacksRef.current.onDelete(payload.old.id as string)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
}
