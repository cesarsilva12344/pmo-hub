-- 20251211_v5_fix_resources_and_schema.sql

-- 1. Create Resources Table (since it was missing)
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- Changed from full_name to match code usage often
    role TEXT,
    email TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'Active',
    hourly_rate NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policy for Resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Allow auth write resources" ON public.resources FOR ALL USING (auth.role() = 'authenticated');

-- 2. Update Projects Table to match Code (V5 Fields)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS lei_do_bem BOOLEAN DEFAULT FALSE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS dt_start_est DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS dt_end_est DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS dt_golive_est DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS costing_model TEXT DEFAULT 'Fixed'; -- Fixed, Hourly, Hybrid
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS sector TEXT;

-- 3. App Configurations (for dynamic lists)
CREATE TABLE IF NOT EXISTS app_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, -- 'client', 'sector', 'category'
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(type, value)
);

ALTER TABLE app_configurations ENABLE ROW LEVEL SECURITY;
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
CREATE POLICY "Allow public read issues" ON project_issues FOR SELECT USING (true);
CREATE POLICY "Allow auth write issues" ON project_issues FOR ALL USING (auth.role() = 'authenticated');

-- 5. Allocations Table (Required for ProjectTeam)
CREATE TABLE IF NOT EXISTS public.allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    role TEXT,
    hours INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read allocations" ON public.allocations FOR SELECT USING (true);
CREATE POLICY "Allow auth write allocations" ON public.allocations FOR ALL USING (auth.role() = 'authenticated');
