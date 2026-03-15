# Client Isolation SOP

## 1. Goal
Define the exact mechanisms that guarantee a client can never see data belonging to another project.

## 2. Supabase Level (RLS)
The database engine enforces this fundamentally. Even if the frontend code contains bugs or the user modifies local storage, PostgreSQL will reject cross-project queries because `client_id = auth.uid()` fails.

## 3. Query Level (TypeScript Tools)
Every deterministic function in `src/lib/` must execute queries as the authenticated user, relying naturally on RLS. We do not explicitly pass `project_id` where RLS handles the filtering automatically (e.g., `supabase.from('tickets').select('*')` will inherently only return tickets for the client's project because of RLS).

## 4. Navigation Level (React Router)
- **Role Guard:** `ClientRoute` and `AdminRoute` wrapper components check the Zustand `profile.role`.
- **Project Resolution:** The `/client/` root component calculates the single `project_id` available to the client on mount and passes it down via context or store to all children.

## 5. Security Invariant
At no point does the application rely *solely* on React Router or UI-hiding to protect data. The database is the source of truth for isolation.
