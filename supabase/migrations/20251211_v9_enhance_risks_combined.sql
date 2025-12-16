-- 20251211_v9_enhance_risks_combined.sql
-- Combined migration for Risks, GTD Inbox, and Settings

-- 1. Enhancements for Project Risks
ALTER TABLE public.project_risks ADD COLUMN IF NOT EXISTS planned_date DATE;
ALTER TABLE public.project_risks ADD COLUMN IF NOT EXISTS actual_date DATE;
ALTER TABLE public.project_risks ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE public.project_risks ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
ALTER TABLE public.project_risks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Open';
ALTER TABLE public.project_risks ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.project_risks ADD COLUMN IF NOT EXISTS cause TEXT;
ALTER TABLE public.project_risks ADD COLUMN IF NOT EXISTS mitigation_plan TEXT;
ALTER TABLE public.project_risks ADD COLUMN IF NOT EXISTS contingency_plan TEXT;

-- Drop constraint to allow new statuses if any
ALTER TABLE public.project_risks DROP CONSTRAINT IF EXISTS project_risks_status_check;

-- 2. Enhancements for GTD Inbox
ALTER TABLE public.inbox_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Inbox'; -- Inbox, Action, Waiting, Done
ALTER TABLE public.inbox_items ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id);
ALTER TABLE public.inbox_items ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES public.users(id);

-- 3. Enhancements for Access Management
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 4. Policies (Idempotent)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read risks' AND tablename = 'project_risks') THEN
        CREATE POLICY "Allow public read risks" ON project_risks FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow auth write risks' AND tablename = 'project_risks') THEN
        CREATE POLICY "Allow auth write risks" ON project_risks FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;
