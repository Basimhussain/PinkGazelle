-- Add 'rescinded' as a valid invite status so admins can cancel pending invites
-- or remove accepted clients while preserving the invite history.
ALTER TABLE public.project_invites
  DROP CONSTRAINT project_invites_status_check;

ALTER TABLE public.project_invites
  ADD CONSTRAINT project_invites_status_check
  CHECK (status IN ('pending', 'accepted', 'rescinded'));
