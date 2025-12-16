-- Limpeza de Schema (Reset)
-- CUIDADO: Isso apagará todos os dados existentes nas tabelas abaixo!
drop table if exists public.inbox_items cascade;
drop table if exists public.time_logs cascade;
drop table if exists public.tasks cascade;
drop table if exists public.projects cascade;
drop table if exists public.users cascade;

-- Habilitar extensão de UUID
create extension if not exists "uuid-ossp";

-- 1. Usuários e Funções (RBAC Simplificado)
create table public.users (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  full_name text not null,
  role text check (role in ('admin', 'manager', 'member', 'viewer')) default 'member',
  avatar_url text,
  hourly_rate numeric(10, 2) default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Projetos (Aprimorado)
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  status text check (status in ('Em Planejamento', 'Execução', 'Monitoramento', 'Entregue', 'Cancelado')) default 'Em Planejamento',
  client text,
  manager_id uuid references public.users(id),
  
  -- Dimensões
  track text check (track in ('traditional', 'agile', 'quick_win')), 
  category text, 
  product text,
  pep_code text,

  -- Indicadores de Saúde (RAG: Vermelho, Amarelo, Verde)
  health_scope text default 'green',
  health_time text default 'green',
  health_cost text default 'green',
  
  -- Datas
  start_date_est date,
  end_date_est date,
  start_date_real date,
  end_date_real date,
  
  -- Financeiro (Calculado ou Orçado)
  budget_total numeric(12, 2) default 0.00,
  cost_actual numeric(12, 2) default 0.00,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tarefas (Suporte a Gantt e Kanban)
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  parent_id uuid references public.tasks(id), -- Hierarquia
  
  name text not null,
  description text,
  status text default 'todo', -- todo, in_progress, review, done
  priority text default 'medium',
  
  -- Atribuição
  assignee_id uuid references public.users(id),
  
  -- Agendamento
  start_date date,
  end_date date,
  duration_days integer,
  progress integer default 0, -- 0 a 100
  
  -- Dependências (Coluna predecessora simples para Gantt básico)
  predecessor_id uuid references public.tasks(id),
  dependency_type text default 'FS', -- FS (Término-Início), SS, FF, SF
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Logs de Tempo (Timesheet e EVM)
create table public.time_logs (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references public.tasks(id),
  user_id uuid references public.users(id),
  project_id uuid references public.projects(id), -- Desnormalizado para velocidade de consulta
  
  duration_minutes integer not null,
  cost_calulated numeric(10, 2), -- Snapshot do custo no momento logado
  log_date timestamp with time zone default timezone('utc'::text, now()) not null,
  
  source text check (source in ('manual', 'pomodoro', 'import')) default 'manual',
  notes text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Inbox (GTD)
create table public.inbox_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id),
  content text not null,
  is_processed boolean default false,
  processed_at timestamp with time zone,
  
  -- Link para artefato criado se processado
  converted_to_project_id uuid references public.projects(id),
  converted_to_task_id uuid references public.tasks(id),
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Políticas RLS (Segurança em Nível de Linha) - Configuração Básica
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

-- Política: Permitir acesso de leitura a tudo por enquanto (Modo Protótipo)
create policy "Allow all read access" on public.projects for select using (true);
create policy "Allow all insert access" on public.projects for insert with check (true);
create policy "Allow all update access" on public.projects for update using (true);

-- Índices para performance
create index idx_projects_manager on public.projects(manager_id);
create index idx_tasks_project on public.tasks(project_id);
create index idx_timelogs_project on public.time_logs(project_id);

-- 6. Riscos do Projeto
create table public.project_risks (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  description text,
  
  probability integer check (probability between 1 and 5) default 3,
  impact integer check (impact between 1 and 5) default 3,
  score integer generated always as (probability * impact) stored, 
  
  mitigation_plan text,
  status text default 'open', 
  
  owner_id uuid references public.users(id),
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_risks_project on public.project_risks(project_id);
alter table public.project_risks enable row level security;
create policy "Allow all read access risks" on public.project_risks for select using (true);
create policy "Allow all insert access risks" on public.project_risks for insert with check (true);
create policy "Allow all update access risks" on public.project_risks for update using (true);
