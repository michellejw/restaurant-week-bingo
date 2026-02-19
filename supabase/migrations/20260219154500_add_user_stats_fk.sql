-- Ensure user_stats.user_id has a foreign key to users.id.
--
-- Why: production had this constraint added manually, but dev did not.
-- This migration makes the relationship consistent across environments.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_stats_user_id_fkey'
      AND conrelid = 'public.user_stats'::regclass
  ) THEN
    ALTER TABLE public.user_stats
      ADD CONSTRAINT user_stats_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES public.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;
