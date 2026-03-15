import { supabase } from './supabase'
import type { Milestone } from '../types'

export async function getMilestonesByProject(projectId: string): Promise<Milestone[]> {
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('due_date', { ascending: true, nullsFirst: false })
  if (error) throw error
  return (data ?? []) as Milestone[]
}

export async function createMilestone(
  projectId: string,
  title: string,
  dueDate?: string
): Promise<Milestone> {
  const { data, error } = await supabase
    .from('milestones')
    .insert({ project_id: projectId, title, due_date: dueDate })
    .select()
    .single()
  if (error) throw error
  return data as Milestone
}

export async function updateMilestone(
  milestoneId: string,
  updates: { title?: string; due_date?: string | null }
): Promise<Milestone> {
  const { data, error } = await supabase
    .from('milestones')
    .update(updates)
    .eq('id', milestoneId)
    .select()
    .single()
  if (error) throw error
  return data as Milestone
}

export async function deleteMilestone(milestoneId: string): Promise<void> {
  const { error } = await supabase.from('milestones').delete().eq('id', milestoneId)
  if (error) throw error
}

export async function deleteMilestones(milestoneIds: string[]): Promise<void> {
  const { error } = await supabase.from('milestones').delete().in('id', milestoneIds)
  if (error) throw error
}

export async function updateMilestoneStatus(
  milestoneId: string,
  status: 'pending' | 'completed'
): Promise<Milestone> {
  const { data, error } = await supabase
    .from('milestones')
    .update({ status })
    .eq('id', milestoneId)
    .select()
    .single()
  if (error) throw error
  return data as Milestone
}
