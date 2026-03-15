# RLS Policies SOP

## 1. Goal
Ensure total client-to-client data isolation based on `project_id`.

## 2. Core Rule
**One Client = One Project.** A client profile ID is tied directly to `projects.client_id`. All child tables are tied to a project via `project_id`.

## 3. Policy Matrices

### `profiles`
- **Admin:** ALL
- **Client (SELECT):** `id = auth.uid()`
- **Client (UPDATE):** `id = auth.uid()`

### `projects`
- **Admin:** ALL
- **Client (SELECT):** `client_id = auth.uid()`

### `tickets`
- **Admin:** ALL
- **Client (SELECT):** `project_id IN (SELECT id FROM projects WHERE client_id = auth.uid())`

### `milestones`
- **Admin:** ALL
- **Client (SELECT):** `project_id IN (SELECT id FROM projects WHERE client_id = auth.uid())`

### `activity_log`
- **Admin:** ALL
- **Client (SELECT):** `project_id IN (SELECT id FROM projects WHERE client_id = auth.uid())`
- *(Note: Inserts happen via PostgreSQL triggers operating as SUPERUSER, bypassing RLS.)*

### `invoices`
- **Admin:** ALL
- **Client (SELECT):** `project_id IN (SELECT id FROM projects WHERE client_id = auth.uid())`

### `comments`
- **Admin:** ALL
- **Client (SELECT):** `ticket_id IN (SELECT id FROM tickets WHERE project_id IN (SELECT id FROM projects WHERE client_id = auth.uid()))`
- **Client (INSERT):** Allowed if `author_id = auth.uid()` AND ticket exists in their project.

### `project_invites`
- **Admin:** ALL
- **Client:** NO ACCESS
- *(Edge functions access this via service_role key to validate tokens before users have a session).*
