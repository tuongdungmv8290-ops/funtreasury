-- Add last_cursor column for Moralis pagination
ALTER TABLE public.sync_state 
ADD COLUMN IF NOT EXISTS last_cursor TEXT DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.sync_state.last_cursor IS 'Moralis pagination cursor for incremental sync';