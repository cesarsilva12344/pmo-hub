-- Cleanup existing tables if needed (Be careful in production)
-- drop table if exists task_dependencies;
-- drop table if exists tasks;
-- drop table if exists projects;
-- drop table if exists profiles;
-- drop type if exists priority_level;
-- drop type if exists task_status;

-- 1. Enums
create type priority_level as enum ('low', 'medium', 'high', 'critical');
create type task_status as enum ('todo', 'in_progress', 'review', 'done');

-- 2. Profiles (Linked to auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  role text default 'Member',
  avatar_url text,
  updated_at timestamp with time zone
);

-- 3. Projects
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  start_date date,
  end_date date,
  owner_id uuid references profiles(id),
  status text default 'planning'
);

-- 4. Tasks
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  project_id uuid references projects(id) on delete cascade not null,
  title text not null,
  description text,
  assignee_id uuid references profiles(id),
  status task_status default 'todo',
  priority priority_level default 'medium',
  start_date date,
  end_date date,
  estimated_hours numeric default 0,
  parent_id uuid references tasks(id), -- For subtasks
  "order" integer default 0 -- For Kanban sorting
);

-- 5. Task Dependencies (Gantt)
create table if not exists task_dependencies (
  id uuid default gen_random_uuid() primary key,
  predecessor_task_id uuid references tasks(id) on delete cascade not null,
  successor_task_id uuid references tasks(id) on delete cascade not null,
  type text default 'fs' -- fs (finish-to-start), ss, ff, sf
);

-- 6. RLS (Row Level Security)
alter table profiles enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table task_dependencies enable row level security;

-- Policies (Simple 'Authenticated' access for now, refine later)
-- PROFILES
create policy "Public profiles are viewable by everyone" 
  on profiles for select using ( true );
create policy "Users can insert their own profile" 
  on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile" 
  on profiles for update using ( auth.uid() = id );

-- PROJECTS
create policy "Authenticated users can select projects" 
  on projects for select using ( auth.role() = 'authenticated' );
create policy "Authenticated users can create projects" 
  on projects for insert with check ( auth.role() = 'authenticated' );
create policy "Authenticated users can update projects" 
  on projects for update using ( auth.role() = 'authenticated' );

-- TASKS
create policy "Authenticated users can select tasks" 
  on tasks for select using ( auth.role() = 'authenticated' );
create policy "Authenticated users can create tasks" 
  on tasks for insert with check ( auth.role() = 'authenticated' );
create policy "Authenticated users can update tasks" 
  on tasks for update using ( auth.role() = 'authenticated' );

-- DEPENDENCIES
create policy "Authenticated users can manage dependencies" 
  on task_dependencies for all using ( auth.role() = 'authenticated' );


-- Trigger to handle new user signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- PMO Specific Fields Update (2025-12-09)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS client text, -- Ex: ALELO
ADD COLUMN IF NOT EXISTS pep text, -- Ex: 0040003544-83/D20
ADD COLUMN IF NOT EXISTS cost_mode text, -- Ex: Cliente, CAPEX, OPEX
ADD COLUMN IF NOT EXISTS total_estimated_hours numeric, -- Ex: 188
ADD COLUMN IF NOT EXISTS go_live_date timestamp with time zone, -- Data Go!Live
-- Faróis de Status (Health Checks)
ADD COLUMN IF NOT EXISTS health_scope text DEFAULT 'green', -- Ex: Escopo original
ADD COLUMN IF NOT EXISTS health_cost text DEFAULT 'green', -- Ex: Fora do orçado
ADD COLUMN IF NOT EXISTS health_time text DEFAULT 'green', -- Ex: Em atraso
ADD COLUMN IF NOT EXISTS tags text[]; -- Array de tags, ex: ['Lei do Bem', 'RPA']
