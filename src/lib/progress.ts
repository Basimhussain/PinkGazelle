import { supabase } from './supabase'

export async function computePercentage(projectId: string): Promise<number> {
  const { data, error } = await supabase
    .from('tickets')
    .select('status')
    .eq('project_id', projectId)
  
  if (error || !data || data.length === 0) return 0
  
  const total = data.length
  const done = data.filter((t) => t.status === 'done').length
  return Math.round((done / total) * 100)
}
