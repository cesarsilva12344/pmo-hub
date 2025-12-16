-- 20251208_initial_schema.sql
-- Initial Schema for PMO Hub v15.1

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    client TEXT,
    budget NUMERIC(12, 2) DEFAULT 0,
    spent NUMERIC(12, 2) DEFAULT 0,
    start_date DATE DEFAULT CURRENT_DATE,
    status TEXT CHECK (status IN ('Em Planejamento', 'Em Execução', 'Em Risco', 'Atrasado', 'Concluído')),
    methodology TEXT DEFAULT 'Waterfall',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) -- RLS
);

-- 2. Risks Table
CREATE TABLE risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    probability INTEGER CHECK (probability BETWEEN 1 AND 5),
    impact INTEGER CHECK (impact BETWEEN 1 AND 5),
    mitigation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Resources (Team) Table
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT,
    capacity_hours INTEGER DEFAULT 160,
    avatar_url TEXT
);

-- 4. Allocations Table
CREATE TABLE allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    role TEXT,
    hours INTEGER DEFAULT 0,
    UNIQUE(project_id, resource_id)
);

-- 5. Status Reports Table
CREATE TABLE status_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    report_date DATE DEFAULT CURRENT_DATE,
    health_score INTEGER,
    health_status TEXT CHECK (health_status IN ('Otimizado', 'Atenção', 'Crítico')),
    summary TEXT,
    risks_summary TEXT,
    recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects" 
ON projects FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" 
ON projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);
