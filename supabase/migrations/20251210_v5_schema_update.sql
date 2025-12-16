-- Add new fields to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS responsible_id UUID,
ADD COLUMN IF NOT EXISTS reporter_id UUID,
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS pep_code TEXT,
ADD COLUMN IF NOT EXISTS health_scope TEXT DEFAULT 'grey', -- green, yellow, red, blue, grey
ADD COLUMN IF NOT EXISTS health_time TEXT DEFAULT 'grey',
ADD COLUMN IF NOT EXISTS health_cost TEXT DEFAULT 'grey',
ADD COLUMN IF NOT EXISTS costing_model TEXT DEFAULT 'Fixed', -- Fixed, Hourly, Hybrid
ADD COLUMN IF NOT EXISTS hours_estimated NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS dt_start_est DATE,
ADD COLUMN IF NOT EXISTS dt_golive_est DATE,
ADD COLUMN IF NOT EXISTS dt_end_est DATE,
ADD COLUMN IF NOT EXISTS dt_start_real DATE,
ADD COLUMN IF NOT EXISTS dt_golive_real DATE,
ADD COLUMN IF NOT EXISTS dt_end_real DATE,
ADD COLUMN IF NOT EXISTS lei_do_bem BOOLEAN DEFAULT FALSE;

-- Create timesheet_entries table
CREATE TABLE IF NOT EXISTS timesheet_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL, -- optional link to task
    user_id UUID, -- References auth.users implicitly
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    hours NUMERIC NOT NULL CHECK (hours > 0),
    type TEXT NOT NULL DEFAULT 'Production', -- Production, Meeting, Correction
    observation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_timesheets_project ON timesheet_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_user ON timesheet_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_date ON timesheet_entries(date);
