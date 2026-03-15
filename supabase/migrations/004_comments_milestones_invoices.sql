-- 004_comments_milestones_invoices.sql
-- Extend comments to support milestone and invoice threads.
-- Also enables realtime on projects table for live sidebar updates.

-- 1. Make ticket_id nullable and add milestone_id / invoice_id
ALTER TABLE public.comments ALTER COLUMN ticket_id DROP NOT NULL;
ALTER TABLE public.comments ADD COLUMN milestone_id UUID REFERENCES public.milestones(id) ON DELETE CASCADE;
ALTER TABLE public.comments ADD COLUMN invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE;

-- 2. Constraint: exactly one of ticket_id / milestone_id / invoice_id must be set
ALTER TABLE public.comments ADD CONSTRAINT comments_entity_check CHECK (
  (
    (ticket_id   IS NOT NULL)::int +
    (milestone_id IS NOT NULL)::int +
    (invoice_id   IS NOT NULL)::int
  ) = 1
);

-- 3. Drop old client comment policies and recreate to cover all three entity types
DROP POLICY IF EXISTS "Client select comments on their project" ON public.comments;
DROP POLICY IF EXISTS "Client insert comments on their project" ON public.comments;

CREATE POLICY "Client select comments on their project" ON public.comments
  FOR SELECT USING (
    (ticket_id IS NOT NULL AND ticket_id IN (
      SELECT t.id FROM public.tickets t
      JOIN public.projects p ON p.id = t.project_id
      WHERE p.client_id = auth.uid()
    ))
    OR
    (milestone_id IS NOT NULL AND milestone_id IN (
      SELECT m.id FROM public.milestones m
      JOIN public.projects p ON p.id = m.project_id
      WHERE p.client_id = auth.uid()
    ))
    OR
    (invoice_id IS NOT NULL AND invoice_id IN (
      SELECT i.id FROM public.invoices i
      JOIN public.projects p ON p.id = i.project_id
      WHERE p.client_id = auth.uid()
    ))
  );

CREATE POLICY "Client insert comments on their project" ON public.comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND (
      (ticket_id IS NOT NULL AND ticket_id IN (
        SELECT t.id FROM public.tickets t
        JOIN public.projects p ON p.id = t.project_id
        WHERE p.client_id = auth.uid()
      ))
      OR
      (milestone_id IS NOT NULL AND milestone_id IN (
        SELECT m.id FROM public.milestones m
        JOIN public.projects p ON p.id = m.project_id
        WHERE p.client_id = auth.uid()
      ))
      OR
      (invoice_id IS NOT NULL AND invoice_id IN (
        SELECT i.id FROM public.invoices i
        JOIN public.projects p ON p.id = i.project_id
        WHERE p.client_id = auth.uid()
      ))
    )
  );

-- 4. Update the activity-log trigger to handle milestone and invoice comments
CREATE OR REPLACE FUNCTION public.log_new_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
BEGIN
  IF NEW.ticket_id IS NOT NULL THEN
    SELECT project_id INTO v_project_id FROM public.tickets WHERE id = NEW.ticket_id;
  ELSIF NEW.milestone_id IS NOT NULL THEN
    SELECT project_id INTO v_project_id FROM public.milestones WHERE id = NEW.milestone_id;
  ELSIF NEW.invoice_id IS NOT NULL THEN
    SELECT project_id INTO v_project_id FROM public.invoices WHERE id = NEW.invoice_id;
  END IF;

  INSERT INTO public.activity_log (project_id, actor_id, action, entity_type, entity_id)
  VALUES (v_project_id, NEW.author_id, 'Added a comment', 'comment', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Restrict client invoice visibility to sent/paid only
DROP POLICY IF EXISTS "Client select invoices in assigned project" ON public.invoices;
CREATE POLICY "Client select invoices in assigned project" ON public.invoices
  FOR SELECT USING (
    status IN ('sent', 'paid') AND
    project_id IN (SELECT id FROM public.projects WHERE client_id = auth.uid())
  );

-- 6. Enable realtime on projects so the sidebar list stays live
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
