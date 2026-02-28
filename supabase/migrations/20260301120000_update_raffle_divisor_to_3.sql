-- Update raffle entry divisor from 4 visits per entry to 3 visits per entry.
--
-- This migration updates the visit trigger math and recalculates existing
-- user_stats values so app behavior, scripts, and database stay consistent.

CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_user_id text;
  visit_count_val integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_user_id := OLD.user_id;
  ELSE
    affected_user_id := NEW.user_id;
  END IF;

  SELECT COUNT(*) INTO visit_count_val
  FROM public.visits
  WHERE user_id = affected_user_id;

  INSERT INTO public.user_stats (user_id, visit_count, raffle_entries, updated_at)
  VALUES (affected_user_id, visit_count_val, FLOOR(visit_count_val / 3), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    visit_count = visit_count_val,
    raffle_entries = FLOOR(visit_count_val / 3),
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS update_stats_on_visit_insert ON public.visits;
DROP TRIGGER IF EXISTS update_stats_on_visit_delete ON public.visits;
DROP TRIGGER IF EXISTS update_stats_on_visit ON public.visits;

CREATE TRIGGER update_stats_on_visit_insert
AFTER INSERT ON public.visits
FOR EACH ROW
EXECUTE FUNCTION public.update_user_stats();

CREATE TRIGGER update_stats_on_visit_delete
AFTER DELETE ON public.visits
FOR EACH ROW
EXECUTE FUNCTION public.update_user_stats();

UPDATE public.user_stats
SET
  raffle_entries = FLOOR(COALESCE(visit_count, 0) / 3),
  updated_at = NOW();
