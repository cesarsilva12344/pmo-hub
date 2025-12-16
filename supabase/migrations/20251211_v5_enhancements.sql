-- 20251211_v5_enhancements.sql

-- 1. App Configurations (for dynamic lists: Clients, Sectors, Categories)
CREATE TABLE IF NOT EXISTS app_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, -- 'client', 'sector', 'category'
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(type, value)
);

-- 2. Project Issues Table
CREATE TABLE IF NOT EXISTS project_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
    status TEXT CHECK (status IN ('Open', 'In Progress', 'Resolved')) DEFAULT 'Open',
    owner_id UUID REFERENCES resources(id), -- Assigned to
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enhance Resources Table (if not already sufficient)
ALTER TABLE resources ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT 0;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active'; -- Active, Archived
ALTER TABLE resources ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS phone TEXT;

-- 4. Add Category/Sector columns to Projects if missing
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sector TEXT;

-- 5. RLS Policies
ALTER TABLE app_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read config" ON app_configurations FOR SELECT USING (true);
CREATE POLICY "Allow auth write config" ON app_configurations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow auth delete config" ON app_configurations FOR DELETE USING (auth.role() = 'authenticated');

ALTER TABLE project_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read issues" ON project_issues FOR SELECT USING (true);
CREATE POLICY "Allow auth insert issues" ON project_issues FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow auth update issues" ON project_issues FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow auth delete issues" ON project_issues FOR DELETE USING (auth.role() = 'authenticated');
