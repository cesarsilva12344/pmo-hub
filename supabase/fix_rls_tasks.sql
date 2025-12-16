-- Fix Missing RLS Policies for Tasks
-- Enabling RLS was already done in schema.sql, but policies were missing, leading to 'default deny'.

drop policy if exists "Allow all read access tasks" on public.tasks;
drop policy if exists "Allow all insert access tasks" on public.tasks;
drop policy if exists "Allow all update access tasks" on public.tasks;
drop policy if exists "Allow all delete access tasks" on public.tasks;

create policy "Allow all read access tasks" on public.tasks for select using (true);
create policy "Allow all insert access tasks" on public.tasks for insert with check (true);
create policy "Allow all update access tasks" on public.tasks for update using (true);
create policy "Allow all delete access tasks" on public.tasks for delete using (true);

-- Time Logs
alter table public.time_logs enable row level security;

drop policy if exists "Allow all read access time_logs" on public.time_logs;
drop policy if exists "Allow all insert access time_logs" on public.time_logs;
drop policy if exists "Allow all update access time_logs" on public.time_logs;
drop policy if exists "Allow all delete access time_logs" on public.time_logs;

create policy "Allow all read access time_logs" on public.time_logs for select using (true);
create policy "Allow all insert access time_logs" on public.time_logs for insert with check (true);
create policy "Allow all update access time_logs" on public.time_logs for update using (true);
create policy "Allow all delete access time_logs" on public.time_logs for delete using (true);

-- Inbox Items
alter table public.inbox_items enable row level security;

drop policy if exists "Allow all read access inbox_items" on public.inbox_items;
drop policy if exists "Allow all insert access inbox_items" on public.inbox_items;
drop policy if exists "Allow all update access inbox_items" on public.inbox_items;
drop policy if exists "Allow all delete access inbox_items" on public.inbox_items;

create policy "Allow all read access inbox_items" on public.inbox_items for select using (true);
create policy "Allow all insert access inbox_items" on public.inbox_items for insert with check (true);
create policy "Allow all update access inbox_items" on public.inbox_items for update using (true);
create policy "Allow all delete access inbox_items" on public.inbox_items for delete using (true);
