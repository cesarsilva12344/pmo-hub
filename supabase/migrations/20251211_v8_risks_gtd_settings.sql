-- 20251211_v8_risks_gtd_settings.sql

-- 1. Enhancements for Project Risks
ALTER TABLE public.project_risks ADD COLUMN IF NOT EXISTS planned_date DATE;
ALTER TABLE public.project_risks ADD COLUMN IF NOT EXISTS actual_date DATE;
ALTER TABLE public.project_risks ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE public.project_risks ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Ensure status column includes new states if strictly constrained (Dropping constraint to be safe/flexible)
ALTER TABLE public.project_risks DROP CONSTRAINT IF EXISTS project_risks_status_check;
-- Re-adding constraint with extended values might be needed, or just leave it open for app logic. 
-- We'll allow: 'Open', 'In Progress', 'Resolved', 'Canceled', 'Archived' via App logic.

-- 2. Enhancements for GTD Inbox (for Kanban & Assignment)
ALTER TABLE public.inbox_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Inbox'; -- Inbox, Action, Waiting, Done
ALTER TABLE public.inbox_items ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id);
ALTER TABLE public.inbox_items ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES public.users(id);

-- 3. Enhancements for Access Management (Users)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
-- Ensure we can delete/soft-delete users.

-- 4. Sync Function: When Inbox Item gets a Project, create a Task? 
-- Or we handle this in Frontend for now to avoid PL/SQL complexity.
