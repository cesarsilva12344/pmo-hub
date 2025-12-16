-- 20251211_v5_fix_timesheet.sql

-- 1. Create Timesheet Entries Table (matching frontend service)
CREATE TABLE IF NOT EXISTS public.timesheet_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id), -- or resources(id) if we want to link unrelated to auth
    task_id UUID, -- Optional link to tasks
    date DATE NOT NULL,
    hours NUMERIC(5, 2) NOT NULL,
    type TEXT, -- Production, Meeting, Correction
    observation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.timesheet_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read timesheet" ON public.timesheet_entries FOR SELECT USING (true);
CREATE POLICY "Allow auth insert timesheet" ON public.timesheet_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow auth delete timesheet" ON public.timesheet_entries FOR DELETE USING (auth.uid() = user_id);

-- 2. Ensure Projects has all fields for Editing
-- (Already added in previous step, but safe to repeat IF NOT EXISTS)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Em Planejamento'; 
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS health_scope TEXT DEFAULT 'green';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS health_time TEXT DEFAULT 'green';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS health_cost TEXT DEFAULT 'green';
