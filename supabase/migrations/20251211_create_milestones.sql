
CREATE TABLE IF NOT EXISTS public.project_milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'active', 'done'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view milestones" ON public.project_milestones
    FOR SELECT USING (true);

CREATE POLICY "Users can insert milestones" ON public.project_milestones
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update milestones" ON public.project_milestones
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete milestones" ON public.project_milestones
    FOR DELETE USING (true);
