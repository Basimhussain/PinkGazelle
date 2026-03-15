-- Privileged function to accept a project invite.
-- Runs as SECURITY DEFINER so it bypasses RLS and can update projects.client_id.
CREATE OR REPLACE FUNCTION public.accept_project_invite(
  p_token   TEXT,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
  v_email      TEXT;
BEGIN
  -- Validate token is still pending and get the project id + email
  SELECT project_id, email INTO v_project_id, v_email
  FROM public.project_invites
  WHERE token = p_token
    AND status = 'pending';

  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or already-used invite token';
  END IF;

  -- Guarantee profile row exists before the FK check on projects.client_id.
  -- ON CONFLICT is a no-op if the trigger already created it.
  INSERT INTO public.profiles (id, role, email)
  VALUES (p_user_id, 'client', v_email)
  ON CONFLICT (id) DO NOTHING;

  -- Assign client to project
  UPDATE public.projects
  SET client_id = p_user_id
  WHERE id = v_project_id;

  -- Mark invite accepted
  UPDATE public.project_invites
  SET status = 'accepted'
  WHERE token = p_token;
END;
$$;

-- Only authenticated users can call this (prevents anonymous abuse)
REVOKE ALL ON FUNCTION public.accept_project_invite(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_project_invite(TEXT, UUID) TO authenticated;
