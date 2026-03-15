import { supabase } from './supabase'
import { computePercentage } from './progress'
import type { Project, ProjectWithProgress } from '../types'

export async function getAllProjects(): Promise<ProjectWithProgress[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*, client:profiles(*)')
    .neq('status', 'archived')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ProjectWithProgress[]
}

export async function getProjectById(id: string): Promise<ProjectWithProgress | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*, client:profiles(*)')
    .eq('id', id)
    .single()
  if (error) return null
  return data as ProjectWithProgress
}

export async function createProject(
  title: string,
  description: string,
  deadline?: string
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ title, description, deadline: deadline || null })
    .select()
    .single()
  if (error) throw error
  return data as Project
}

export async function updateProject(
  id: string,
  updates: Partial<Project>
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Project
}

export async function getArchivedProjects(): Promise<ProjectWithProgress[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*, client:profiles(*)')
    .eq('status', 'archived')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ProjectWithProgress[]
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

export async function getClientProjects(): Promise<ProjectWithProgress[]> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return []

  const { data, error } = await supabase
    .from('projects')
    .select('*, client:profiles(*)')
    .eq('client_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching client projects:', error)
    return []
  }

  const projects = data as ProjectWithProgress[]
  // Attach progress to each project
  const projectsWithProgress = await Promise.all(
    projects.map(async (p) => {
      const progress = await computePercentage(p.id)
      return { ...p, progress }
    })
  )

  return projectsWithProgress
}

export async function getClientProject(projectId?: string): Promise<ProjectWithProgress | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null

  let query = supabase
    .from('projects')
    .select('*, client:profiles(*)')
    .eq('client_id', session.user.id)

  if (projectId) {
    query = query.eq('id', projectId)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching client project:', error)
    return null
  }
  return data as ProjectWithProgress
}
