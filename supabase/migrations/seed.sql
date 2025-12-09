-- Seed Data for ALELO Project
-- Run this block in Supabase SQL Editor

DO $$
DECLARE
  v_project_id uuid;
  v_user_id uuid;
BEGIN
  -- 1. Try to get your User ID (first one found)
  -- This assumes you have already signed up in the app
  SELECT id INTO v_user_id FROM profiles LIMIT 1;
  
  -- If no profile exists, we can't assign owner, so we might need to handle that.
  -- But for this script, we assume at least one user exists (YOU).
  
  -- 2. Insert Project Header
  INSERT INTO projects (
    title, 
    description, 
    client, 
    pep, 
    status, 
    start_date, 
    go_live_date, 
    total_estimated_hours,
    health_scope,
    health_cost, 
    health_time, 
    tags,
    owner_id
  ) VALUES (
    'ALELO | RPA CORTESIA| 0040003544-83/D20', 
    'Desenvolvimento e implementação de RPA para cortesia Alelo.',
    'ALELO',
    '0040003544-83/D20',
    'active',
    '2025-08-08',
    '2025-11-05',
    188,
    'green', -- Escopo OK
    'red',   -- Custo Estourado
    'red',   -- Prazo Atrasado
    ARRAY['RPA', 'Lei do Bem'],
    v_user_id
  ) RETURNING id INTO v_project_id;

  -- 3. Insert Tasks
  -- Mapping: Concluído -> done, Em andamento -> in_progress, Backlog -> todo
  
  INSERT INTO tasks (project_id, title, status, assignee_id, priority) VALUES
  (v_project_id, 'PROJ-582 Transferência S2D', 'done', v_user_id, 'high'),
  (v_project_id, 'PROJ-583 Material de Kick-off', 'done', v_user_id, 'medium'),
  (v_project_id, 'PROJ-584 Atualização do cronograma', 'done', v_user_id, 'high'),
  (v_project_id, 'PROJ-585 Controle financeiro', 'done', v_user_id, 'high'),
  (v_project_id, 'PROJ-586 Daily', 'in_progress', v_user_id, 'medium'),
  (v_project_id, 'PROJ-587 Atas de Reunião', 'done', v_user_id, 'low'),
  (v_project_id, 'PROJ-588 Status Report', 'in_progress', v_user_id, 'high'),
  (v_project_id, 'PROJ-589 Reuniões com gerência', 'in_progress', v_user_id, 'medium'),
  (v_project_id, 'PROJ-590 Reuniões com clientes', 'in_progress', v_user_id, 'high'),
  (v_project_id, 'PROJ-591 Reuniões internas', 'in_progress', v_user_id, 'medium'),
  (v_project_id, 'PROJ-592 PDD', 'in_progress', v_user_id, 'high'),
  (v_project_id, 'PROJ-593 Acompanhamento GMUD', 'todo', v_user_id, 'critical'),
  (v_project_id, 'PROJ-594 Hypercare', 'todo', v_user_id, 'medium'),
  (v_project_id, 'PROJ-595 Alinhamento KT', 'todo', v_user_id, 'medium'),
  (v_project_id, 'PROJ-596 Changes Requests', 'todo', v_user_id, 'low'),
  (v_project_id, 'PROJ-597 Riscos', 'in_progress', v_user_id, 'critical'),
  (v_project_id, 'PROJ-598 Issues', 'in_progress', v_user_id, 'high');

END $$;
