# System Constitution — Pink Gazelle

This document replaces `gemini.md` and acts as the project's immutable law.

## 1. Supabase Postgres Schema (8 Tables)

```sql
-- 1. profiles
id UUID PRIMARY KEY REFERENCES auth.users(id),
role TEXT NOT NULL CHECK (role IN ('admin', 'client')),
email TEXT NOT NULL,
first_name TEXT,
last_name TEXT,
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())

-- 2. projects
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
title TEXT NOT NULL,
description TEXT,
client_id UUID REFERENCES profiles(id),
status TEXT NOT NULL DEFAULT 'active',
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())

-- 3. tickets
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
title TEXT NOT NULL,
description TEXT,
status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())

-- 4. milestones
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
title TEXT NOT NULL,
status TEXT NOT NULL CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
due_date DATE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())

-- 5. activity_log
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
actor_id UUID REFERENCES profiles(id),
action TEXT NOT NULL,
entity_type TEXT NOT NULL,
entity_id UUID NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())

-- 6. invoices
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
amount NUMERIC NOT NULL,
status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'paid')) DEFAULT 'draft',
due_date DATE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())

-- 7. comments
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
author_id UUID REFERENCES profiles(id),
content TEXT NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())

-- 8. project_invites
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
email TEXT NOT NULL,
token TEXT NOT NULL UNIQUE,
status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')) DEFAULT 'pending',
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
```

## 2. Row Level Security (RLS) Policies

Every table has RLS enabled.

- **profiles:** Client can select their own profile. Admin full CRUD.
- **projects:** Client can select if `projects.client_id = auth.uid()`. Admin full CRUD.
- **tickets:** Client can select if `tickets.project_id` matches a project where they are `client_id`. Admin full CRUD.
- **milestones:** Client can select if project matches. Admin full CRUD.
- **activity_log:** Client can select if project matches. Admin full CRUD. (Trigger bypasses RLS for inserts).
- **invoices:** Client can select if project matches. Admin full CRUD.
- **comments:** Client can select if ticket->project matches. Client can INSERT if `comments.author_id = auth.uid()`. Admin full CRUD.
- **project_invites:** Accessible only to Admin and Service Role (Edge Functions).

## 3. Role Behavior Contract

- **Admin:** Manages all projects, creates/updates tickets, issues invoices, tracks milestones, and generates client invites. Cannot sign up publicly (pre-seeded).
- **Client:** Logs in via sent invite token. Can only view the single project assigned to them. All items are read-only except for writing comments on existing tickets. 

## 4. Auth Flow Map

1. **Admin Login:** Admin enters credentials → Validated → Routed to `/admin`.
2. **Invite Client:** Admin clicks "Invite Client" → Inserts to `project_invites` → Triggers Edge Function `/send-invite` → Resend sends email with `VITE_APP_BASE_URL/invite?token=XYZ`.
3. **Client Accept:** Client clicks email link → Pages validates token via Edge Function/Service Role → Prompts for password → Creates user in Auth → Trigger creates `profiles` record with role `client` → User clicks "Login" → Routed to `/client`.

## 5. Routing Rules and Guard Logic

- `/login`: Public. Redirects authenticated users based on their role in `profiles`.
- `/admin/*`: Protected guard. `useAuthStore` checks `profile.role === 'admin'`. Redirects `client` to `/client`.
- `/client/*`: Protected guard. `useAuthStore` checks `profile.role === 'client'`. Fetches the single assigned project ID to display.
- `/invite`: Public but token-gated route for accepting invitations.

## 6. Design System Tokens

- **Typography:** `Inter` (Font weights limited to 300, 400, 500, 600). Fallback: `sans-serif`. (Google Fonts).
- **Colors:** Minimalist Apple-style.
  - Background: White (`#ffffff`), Off-White (`#f9fafb`)
  - Text: Dark Gray (`#111827`), Medium Gray (`#4b5563`)
  - Accents: Light gradients (e.g. progress bar)
  - *No pure black (`#000000`)*.
- **Radii:** `8px` to `12px` (Modern soft corners).
- **Shadows:** Subtle, diffused drop shadows.
- **Formatting:** Dates rendered as `Mar 14, 2026`. Monies as `SAR 1,500` via `.toLocaleString()`.

## 7. Architectural Invariants

- ALL state hydration originates from Supabase Postgres.
- ALL logic changes must first be documented in `architecture/` SOPs before code modifications.
- Mutations strictly use isolated deterministic tools in `src/lib/`.
- Ticket status changes must atomically insert a tracking row in `activity_log` (using a postgres trigger or stored procedure).
- Emails strictly sent via Supabase Edge Functions. The browser shall NEVER invoke Resend.
