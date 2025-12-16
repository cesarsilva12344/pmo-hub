-- Add Milestone Support
alter table public.tasks 
add column if not exists is_milestone boolean default false;

-- Add Resource Support (Using assignee_id, but ensuring clarity)
-- We already have assignee_id. We might want to add 'resource_type' or 'allocation_percentage' if needed later.
-- For now, user asked "op;'ao de alocar o reruso a atividade", which fits assignee_id.

-- Advanced Dependencies (Many-to-Many instead of single predecessor)
drop table if exists public.task_dependencies cascade;
create table public.task_dependencies (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references public.tasks(id) on delete cascade,
  predecessor_id uuid references public.tasks(id) on delete cascade,
  dependency_type text default 'FS', -- 'FS', 'SS', 'FF', 'SF'
  lag_days integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(task_id, predecessor_id)
);

-- Index for performance
create index if not exists idx_task_deps_task on public.task_dependencies(task_id);
create index if not exists idx_task_deps_pred on public.task_dependencies(predecessor_id);

-- Add missing RLS for new table
alter table public.task_dependencies enable row level security;
create policy "Allow all read access dependencies" on public.task_dependencies for select using (true);
create policy "Allow all insert access dependencies" on public.task_dependencies for insert with check (true);
create policy "Allow all update access dependencies" on public.task_dependencies for update using (true);
create policy "Allow all delete access dependencies" on public.task_dependencies for delete using (true);

-- Fix for Timesheet: Ensure users exist in public.users if they don't (Trigger-like approach or manual check needed usually)
-- For now, usually we assume `public.users` is populated via trigger on auth.users creation.
-- As a fallback, we'll ensure RLS on time_logs is correct.
alter table public.time_logs enable row level security;
drop policy if exists "Allow all read access timelogs" on public.time_logs;
drop policy if exists "Allow all insert access timelogs" on public.time_logs;
drop policy if exists "Allow all update access timelogs" on public.time_logs;
drop policy if exists "Allow all delete access timelogs" on public.time_logs;

create policy "Allow all read access timelogs" on public.time_logs for select using (true);
create policy "Allow all insert access timelogs" on public.time_logs for insert with check (true);
create policy "Allow all update access timelogs" on public.time_logs for update using (true);
create policy "Allow all delete access timelogs" on public.time_logs for delete using (true);
