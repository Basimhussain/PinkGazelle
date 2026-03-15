# Invite Flow SOP

## 1. Goal
Map the exact journey from Admin inviting a new Client to that Client viewing their dashboard.

## 2. Trigger
Admin provides an `email` in the `/admin/projects/[id]` dashboard.

## 3. Storage
A row is inserted into `project_invites`:
- `id` (uuid default)
- `project_id`
- `email`
- `token` (generated via `crypto.randomUUID()` in the browser)
- `status` (default: `pending`)

## 4. Edge Execution
- A Supabase Database Webhook fires on `INSERT` into `project_invites`.
- The Webhook calls the edge function `send-invite`.
- The edge function constructs the email template with the link:
  `{VITE_APP_BASE_URL}/invite?token={token}`
- The edge function executes a `fetch` call to the Resend API.

## 5. Client Acceptance
- Client clicks the link in their email and arrives at Route `/invite`.
- The `InviteAcceptPage.tsx` component extracts the `token` from the query string.
- The component calls an RPC function `validate_invite_token(token_val)` which maps the token to an email and project ID.
- If valid, the UI displays a password input field.
- The client submits the password. The component calls `supabase.auth.signUp({ email, password })`.

## 6. Profile Generation
- An Auth trigger fires on `auth.users` insertion.
- The trigger generates a row in `profiles` with `role = 'client'`.

## 7. Linkage and Cleanup
- The client profile `id` is linked to the `projects` table (by the admin or a subsequent Edge Function).
- The `project_invites` row status is updated to `accepted`.
