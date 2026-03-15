# Auth Flow SOP

## 1. Goal
Define the exact steps for authenticating an Admin vs validating a Client via an invite token.

## 2. Admin Login
- **Trigger:** Admin visits `/login`.
- **Action:** Submits `email` and `password`.
- **Tool:** `supabase.auth.signInWithPassword()`.
- **Result:** Session is created. UI redirects to `/admin`.
- **Constraint:** Admin accounts cannot be created via the UI. They are pre-seeded via SQL.

## 3. Client Invite Flow
- **Generation Trigger:** Admin clicks "Invite Client" on a Project page.
- **Generation Action:** 
  1. Insert row to `project_invites` with a unique token and the project ID.
  2. Edge function `send-invite` is triggered via PostgreSQL webhook.
  3. Resend emails the client the link: `VITE_APP_BASE_URL/invite?token=XYZ`.
- **Acceptance Trigger:** Client clicks link and arrives at `/invite?token=XYZ`.
- **Acceptance Action:**
  1. Frontend validates token against `project_invites` (via an RPC or Edge Function to bypass RLS).
  2. If valid, client is prompted to set a password.
  3. Form submits: Frontend calls `supabase.auth.signUp()`.
  4. PostgreSQL Trigger on `auth.users` creates a `profiles` record with role `client`.
  5. The `project_invites` record is updated to status `accepted`.
- **Result:** Session created. UI redirects to `/client`.

## 4. Session Hydration
- **Mechanism:** Zustand store (`useAuthStore`).
- **Initialization:** On `App.tsx` mount, call `supabase.auth.getSession()` and `supabase.auth.onAuthStateChange()`.
- **State Structure:**
  ```typescript
  interface AuthState {
    session: Session | null;
    profile: Profile | null; // Joined from public.profiles
    isLoading: boolean;
  }
  ```
- **Constraint:** The app must render a global loading spinner until `isLoading` is false.
