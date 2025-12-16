-- 20251216_fix_rls_permissive.sql
-- Relax RLS strictness to allow deleting projects that have no user_id set (legacy data)

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 1. DELETE Policy: Allow any authenticated user to delete any project
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete projects" ON projects;

CREATE POLICY "Enable delete for authenticated users"
ON projects FOR DELETE
TO authenticated
USING (true);

-- 2. UPDATE Policy: Allow any authenticated user to update any project
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects" ON projects;

CREATE POLICY "Enable update for authenticated users"
ON projects FOR UPDATE
TO authenticated
USING (true);

-- 3. INSERT Policy: Ensure user_id is captured automatically for new rows
ALTER TABLE projects ALTER COLUMN user_id SET DEFAULT auth.uid();
-- Also Add policy for insert just in case
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
CREATE POLICY "Enable insert for authenticated users"
ON projects FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. SELECT Policy: Ensure visibility
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Allow all read access" ON projects;

CREATE POLICY "Enable read access for all users"
ON projects FOR SELECT
USING (true);
