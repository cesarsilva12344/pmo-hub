-- 20251211_v7_enhance_risks.sql
-- Add new columns to project_risks for improved management

ALTER TABLE public.project_risks ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.project_risks ADD COLUMN IF NOT EXISTS cause TEXT;
ALTER TABLE public.project_risks ADD COLUMN IF NOT EXISTS mitigation_plan TEXT;
ALTER TABLE public.project_risks ADD COLUMN IF NOT EXISTS contingency_plan TEXT;

-- Verify policies (idempotent check)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read risks' AND tablename = 'project_risks') THEN
        CREATE POLICY "Allow public read risks" ON project_risks FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow auth write risks' AND tablename = 'project_risks') THEN
        CREATE POLICY "Allow auth write risks" ON project_risks FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;
