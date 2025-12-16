-- Add 'type' column to inbox_items for GTD lists
-- Values: 'inbox', 'action', 'waiting', 'reference', 'project' (if converted but kept for ref)
ALTER TABLE public.inbox_items 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'inbox';

-- Ensure type check
ALTER TABLE public.inbox_items 
ADD CONSTRAINT check_inbox_type CHECK (type IN ('inbox', 'action', 'waiting', 'reference', 'someday'));

-- Update existing items to 'inbox'
UPDATE public.inbox_items SET type = 'inbox' WHERE type IS NULL;
