# Findings & Discovery

## Discovery Questions Answered

1. **North Star:**
A solo freelance developer in Riyadh manages multiple client projects from one admin dashboard. They send clients an email invite, and the client lands on a clean read-only portal showing project tickets, progress, milestones, activity feed, and invoices. Clients can comment on tickets. Admin has full control.

2. **Integrations & Environment Variables:**
- **Supabase** (Postgres, Auth, Realtime, Storage)
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (Edge functions only)
- **Resend** (Transactional email, invite links, comment notifications)
  - `RESEND_API_KEY` (Edge functions only)
- **Vite/App Base URL**
  - `VITE_APP_BASE_URL` (For invite links)
- **Google Fonts:** DM Sans / Inter (Loaded via `index.html`)

3. **Source of Truth:**
Supabase Postgres strictly holds all application data. Supabase Auth manages identity. UI state is hydrated via Zustand on load.

4. **Delivery Payload:**
- Vite + React + TypeScript web application
- Deployed to Vercel
- Admin view at `/admin` (Project & Ticket Management)
- Client view at `/client` (Read-only portal + commenting)
- Realtime activity feed
- Complete invite flow end-to-end

5. **Behavioral Rules:**
- Do not guess business logic.
- RLS strictly isolates client data. One client = One project view.
- Admin is a single pre-seeded user. No public registration.
- Progress % = `(tickets with status='done' / total tickets) * 100` (computed server-side).
- Currency is SAR only.
- Dates formatted as "Mar 14, 2026" (No ISO/relative, except relative in activity feed).
- Feature limitations constraint: No dark mode, analytics, third-party tracking, social login, or any unspecified feature.

## Technical Research Findings

### 1. Supabase RLS Multi-Tenant Patterns
- **Approach:** Project-based isolation using a `project_id` on all sensitive tables.
- **Implementation:** User's profile must be associated with the project.
- **Policy Pattern:** Client can `SELECT/UPDATE` if their `id` in the `profiles` table matches the `client_id` on the `projects` table.
- **Auth Context:** The `auth.uid()` function is used within RLS to securely identify the current user. Since clients can only see their project, all child tables (tickets, milestones, etc.) use a nested query or JOIN in their RLS to verify the `auth.uid()` against the parent project's `client_id`.

### 2. Supabase Auth Invite Flow with Custom Token
- **Approach:** Use a custom `project_invites` table rather than the built-in magic link for absolute control over the payload and routing.
- **Implementation:** Admin generates a unique, unguessable token (e.g., using `crypto.randomUUID()`) and stores it in `project_invites` with the client's email.
- **Delivery:** An Edge Function is triggered to email this token via a custom invite link.
- **Acceptance:** The client visits the `/invite?token=XYZ` route. The frontend calls an RPC or Edge Function to validate the token. If valid, the user provides a password, and the frontend calls `supabase.auth.signUp()`. Once signed up, the profile is created (via Postgres trigger) and the invite is marked 'accepted'.

### 3. Supabase Realtime Subscription Patterns (React)
- **Approach:** Use the `@supabase/supabase-js` client within React `useEffect` hooks.
- **Implementation:** Create a channel (`supabase.channel('custom-all-channel')`), listen for `postgres_changes` on the `activity_log` table, filter by the `project_id`, and update local React/Zustand state in the payload callback.
- **Cleanup:** Always return a cleanup function from the `useEffect` that calls `supabase.removeChannel(channel)` to prevent memory leaks and zombie subscriptions.

### 4. React + Zustand + Supabase Session Hydration Pattern
- **Approach:** Centralized `useAuthStore` to hold the session and user profile.
- **Implementation:** 
  - On app load, call `supabase.auth.getSession()` to seed initial state.
  - Immediately set up an `onAuthStateChange` listener to keep the Zustand store perfectly synced with Supabase Auth events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED).
  - Use an `isLoading` flag in the store that remains true until the initial session check resolves, preventing layout shift or premature redirects in guarded routes.

### 5. Resend Email Sending from Vite/React via Edge Function
- **Approach:** Browser CANNOT hold the Resend API key. Must use a Supabase Edge Function as a proxy.
- **Implementation:**
  - Create function: `supabase functions new send-email`.
  - Provide `RESEND_API_KEY` to the Supabase project secrets.
  - Write Deno code in the Edge Function that receives the payload (to, subject, body) from the authenticated (or anon for invites) client, then executes a secure server-to-server POST to the Resend API.
  - From the Vite app, call `supabase.functions.invoke('send-email', { body: payload })`.
