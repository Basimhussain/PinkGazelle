-- 002_fix_rls_recursion.sql
-- Fix infinite recursion in admin RLS policies.
-- The problem: checking profiles inside a profiles policy causes infinite recursion.
-- The fix: use a SECURITY DEFINER function that executes as owner (bypasses RLS).

-- Step 1: Create a stable, security-definer function to check if current user is admin.
-- SECURITY DEFINER = runs as the function owner, not the calling user, bypassing RLS.
-- This breaks the recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Step 2: Drop all old admin policies that used the recursive inline EXISTS check
DROP POLICY IF EXISTS "Admin full access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin full access projects" ON public.projects;
DROP POLICY IF EXISTS "Admin full access tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admin full access milestones" ON public.milestones;
DROP POLICY IF EXISTS "Admin full access activity_log" ON public.activity_log;
DROP POLICY IF EXISTS "Admin full access invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admin full access comments" ON public.comments;
DROP POLICY IF EXISTS "Admin full access project_invites" ON public.project_invites;

-- Step 3: Re-create all admin policies using the non-recursive is_admin() function

CREATE POLICY "Admin full access profiles" ON public.profiles
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admin full access projects" ON public.projects
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admin full access tickets" ON public.tickets
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admin full access milestones" ON public.milestones
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admin full access activity_log" ON public.activity_log
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admin full access invoices" ON public.invoices
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admin full access comments" ON public.comments
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admin full access project_invites" ON public.project_invites
    FOR ALL USING (public.is_admin());
