-- Create Project Risks Table
create table if not exists public.project_risks (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  
  title text not null,
  description text,
  
  -- Probability x Impact (1-5)
  probability integer check (probability between 1 and 5) default 3,
  impact integer check (impact between 1 and 5) default 3,
  
  -- Calculated Score (Prob * Impact)
  score integer generated always as (probability * impact) stored,
  
  status text check (status in ('Identificado', 'Mitigado', 'Materializado', 'Fechado')) default 'Identificado',
  mitigation_plan text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.project_risks enable row level security;
create policy "Allow all access to risks" on public.project_risks for select using (true);
create policy "Allow all insert to risks" on public.project_risks for insert with check (true);
create policy "Allow all update to risks" on public.project_risks for update using (true);
create policy "Allow all delete to risks" on public.project_risks for delete using (true);
