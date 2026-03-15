-- 001_initial_schema.sql
-- Pink Gazelle Schema and RLS Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------------------------------------
-- 1. TABLES
--------------------------------------------------------------------------------

-- Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'client')),
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Projects Table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tickets Table
CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Milestones Table
CREATE TABLE public.milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activity Log Table
CREATE TABLE public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- e.g., 'ticket', 'comment', 'milestone'
    entity_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Invoices Table
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'paid')) DEFAULT 'draft',
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comments Table
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Project Invites Table
CREATE TABLE public.project_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

--------------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS)
--------------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invites ENABLE ROW LEVEL SECURITY;


-- 1. PROFILES
-- Admin can do everything. Client can select and update their own profile.
CREATE POLICY "Admin full access profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Client select own profile" ON public.profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Client update own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());


-- 2. PROJECTS
-- Admin can do everything. Client can select only projects assigned to them.
CREATE POLICY "Admin full access projects" ON public.projects
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Client select assigned projects" ON public.projects
    FOR SELECT USING (client_id = auth.uid());


-- 3. TICKETS
-- Admin full access. Client can select tickets in their assigned projects.
CREATE POLICY "Admin full access tickets" ON public.tickets
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Client select tickets in assigned project" ON public.tickets
    FOR SELECT USING (
        project_id IN (SELECT id FROM public.projects WHERE client_id = auth.uid())
    );


-- 4. MILESTONES
CREATE POLICY "Admin full access milestones" ON public.milestones
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Client select milestones in assigned project" ON public.milestones
    FOR SELECT USING (
        project_id IN (SELECT id FROM public.projects WHERE client_id = auth.uid())
    );


-- 5. ACTIVITY LOG
-- Note: Inserts done via PostgreSQL triggers running as SECURITY DEFINER bypass RLS.
CREATE POLICY "Admin full access activity_log" ON public.activity_log
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Client select activity_log in assigned project" ON public.activity_log
    FOR SELECT USING (
        project_id IN (SELECT id FROM public.projects WHERE client_id = auth.uid())
    );


-- 6. INVOICES
CREATE POLICY "Admin full access invoices" ON public.invoices
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Client select invoices in assigned project" ON public.invoices
    FOR SELECT USING (
        project_id IN (SELECT id FROM public.projects WHERE client_id = auth.uid())
    );


-- 7. COMMENTS
-- Admin full access.
CREATE POLICY "Admin full access comments" ON public.comments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Client select comments for tickets in their project
CREATE POLICY "Client select comments on their project" ON public.comments
    FOR SELECT USING (
        ticket_id IN (
            SELECT id FROM public.tickets 
            WHERE project_id IN (
                SELECT id FROM public.projects WHERE client_id = auth.uid()
            )
        )
    );

-- Client insert comments (must be the author, and ticket must belong to their project)
CREATE POLICY "Client insert comments on their project" ON public.comments
    FOR INSERT WITH CHECK (
        author_id = auth.uid() AND 
        ticket_id IN (
            SELECT id FROM public.tickets 
            WHERE project_id IN (
                SELECT id FROM public.projects WHERE client_id = auth.uid()
            )
        )
    );


-- 8. PROJECT INVITES
-- Only Admins and Service Role have access. No Client policies.
CREATE POLICY "Admin full access project_invites" ON public.project_invites
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

--------------------------------------------------------------------------------
-- 3. TRIGGERS & FUNCTIONS
--------------------------------------------------------------------------------

-- A. Auto-create Profile on User Signup (For Clients accepting invites)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Default newly signed up users to 'client'. 
  -- Admin must be inserted manually via SQL or dashboard.
  INSERT INTO public.profiles (id, role, email, first_name, last_name)
  VALUES (new.id, 'client', new.email, '', '');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- B. Auto-log Ticket Status Changes
CREATE OR REPLACE FUNCTION public.log_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.activity_log (project_id, actor_id, action, entity_type, entity_id)
    VALUES (
      NEW.project_id, 
      auth.uid(), 
      'Changed ticket status to ' || NEW.status, 
      'ticket', 
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_ticket_status_changed
  AFTER UPDATE OF status ON public.tickets
  FOR EACH ROW
  EXECUTE PROCEDURE public.log_ticket_status_change();


-- C. Auto-log New Ticket Creation
CREATE OR REPLACE FUNCTION public.log_ticket_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_log (project_id, actor_id, action, entity_type, entity_id)
  VALUES (
    NEW.project_id, 
    auth.uid(), 
    'Created new ticket: ' || NEW.title, 
    'ticket', 
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_ticket_created
  AFTER INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE PROCEDURE public.log_ticket_creation();


-- D. Auto-log New Comment
CREATE OR REPLACE FUNCTION public.log_new_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
BEGIN
  -- We need to fetch the project_id from the ticket
  SELECT project_id INTO v_project_id FROM public.tickets WHERE id = NEW.ticket_id;
  
  INSERT INTO public.activity_log (project_id, actor_id, action, entity_type, entity_id)
  VALUES (
    v_project_id, 
    NEW.author_id, 
    'Added a comment', 
    'comment', 
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE PROCEDURE public.log_new_comment();

--------------------------------------------------------------------------------
-- 4. REALTIME CONFIGURATION
--------------------------------------------------------------------------------
-- Enable replication on activity_log to allow realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;

