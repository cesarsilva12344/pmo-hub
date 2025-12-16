-- Fix RLS Policies for Projects and Tasks

-- 1. Projects: Add Update/Delete Policies
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects"
ON projects FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects"
ON projects FOR DELETE
USING (auth.uid() = user_id);

-- 2. Tasks: Enable RLS and Add Policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tasks of their projects" ON tasks;
CREATE POLICY "Users can view tasks of their projects"
ON tasks FOR SELECT
USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()) 
    OR 
    project_id IN (SELECT id FROM projects WHERE responsible_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert tasks to their projects" ON tasks;
CREATE POLICY "Users can insert tasks to their projects"
ON tasks FOR INSERT
WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update tasks of their projects" ON tasks;
CREATE POLICY "Users can update tasks of their projects"
ON tasks FOR UPDATE
USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete tasks of their projects" ON tasks;
CREATE POLICY "Users can delete tasks of their projects"
ON tasks FOR DELETE
USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);

-- 3. Project Risks/Issues Update/Delete (Just in case)
ALTER TABLE project_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_issues ENABLE ROW LEVEL SECURITY;

-- Risks
CREATE POLICY "Users can all risks of their projects"
ON project_risks FOR ALL
USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Issues
CREATE POLICY "Users can all issues of their projects"
ON project_issues FOR ALL
USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
