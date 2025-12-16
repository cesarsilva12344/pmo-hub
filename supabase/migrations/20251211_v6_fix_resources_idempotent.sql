-- 20251211_v6_fix_resources_idempotent.sql
-- Idempotent script: Safe to run multiple times.

-- 1. Create Resources Table
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, 
    role TEXT,
    email TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'Active',
    hourly_rate NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read resources" ON public.resources;
DROP POLICY IF EXISTS "Allow auth write resources" ON public.resources;
CREATE POLICY "Allow public read resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Allow auth write resources" ON public.resources FOR ALL USING (auth.role() = 'authenticated');

-- 2. Update Projects Table (Add columns if not exist)
DO $$
BEGIN
    ALTER TABLE public.projects ADD COLUMN client_name TEXT;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'client_name already exists';
END $$;

DO $$
BEGIN
    ALTER TABLE public.projects ADD COLUMN lei_do_bem BOOLEAN DEFAULT FALSE;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'lei_do_bem already exists';
END $$;

DO $$
BEGIN
    ALTER TABLE public.projects ADD COLUMN dt_start_est DATE;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'dt_start_est already exists';
END $$;

DO $$
BEGIN
    ALTER TABLE public.projects ADD COLUMN dt_end_est DATE;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'dt_end_est already exists';
END $$;

DO $$
BEGIN
    ALTER TABLE public.projects ADD COLUMN dt_golive_est DATE;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'dt_golive_est already exists';
END $$;

DO $$
BEGIN
    ALTER TABLE public.projects ADD COLUMN costing_model TEXT DEFAULT 'Fixed';
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'costing_model already exists';
END $$;

DO $$
BEGIN
    ALTER TABLE public.projects ADD COLUMN category TEXT;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'category already exists';
END $$;

DO $$
BEGIN
    ALTER TABLE public.projects ADD COLUMN sector TEXT;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'sector already exists';
END $$;

-- 3. App Configurations
CREATE TABLE IF NOT EXISTS app_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, 
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(type, value)
);

ALTER TABLE app_configurations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read config" ON app_configurations;
DROP POLICY IF EXISTS "Allow auth write config" ON app_configurations;
CREATE POLICY "Allow public read config" ON app_configurations FOR SELECT USING (true);
CREATE POLICY "Allow auth write config" ON app_configurations FOR ALL USING (auth.role() = 'authenticated');

-- 4. Project Issues Table
CREATE TABLE IF NOT EXISTS project_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
    status TEXT CHECK (status IN ('Open', 'In Progress', 'Resolved')) DEFAULT 'Open',
    owner_id UUID REFERENCES resources(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE project_issues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read issues" ON project_issues;
DROP POLICY IF EXISTS "Allow auth write issues" ON project_issues;
CREATE POLICY "Allow public read issues" ON project_issues FOR SELECT USING (true);
CREATE POLICY "Allow auth write issues" ON project_issues FOR ALL USING (auth.role() = 'authenticated');

-- 5. Allocations Table
CREATE TABLE IF NOT EXISTS public.allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    role TEXT,
    hours INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read allocations" ON public.allocations;
DROP POLICY IF EXISTS "Allow auth write allocations" ON public.allocations;
CREATE POLICY "Allow public read allocations" ON public.allocations FOR SELECT USING (true);
CREATE POLICY "Allow auth write allocations" ON public.allocations FOR ALL USING (auth.role() = 'authenticated');
