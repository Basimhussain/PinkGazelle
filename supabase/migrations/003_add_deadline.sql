-- 003_add_deadline.sql
-- Add deadline column to projects table

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS deadline DATE;
