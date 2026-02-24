-- Archive seasonal gameplay data and reset active season tables.
--
-- This keeps historical visits/stats for reporting while giving each new
-- Restaurant Week season a clean gameplay slate.

CREATE TABLE IF NOT EXISTS public.visits_archive (
  season_key text NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now(),
  id uuid NOT NULL,
  user_id text,
  restaurant_id uuid,
  created_at timestamptz,
  PRIMARY KEY (season_key, id)
);

CREATE INDEX IF NOT EXISTS visits_archive_user_idx
  ON public.visits_archive (user_id);

CREATE INDEX IF NOT EXISTS visits_archive_restaurant_idx
  ON public.visits_archive (restaurant_id);

CREATE TABLE IF NOT EXISTS public.user_stats_archive (
  season_key text NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now(),
  user_id text NOT NULL,
  visit_count integer NOT NULL,
  raffle_entries integer NOT NULL,
  created_at timestamptz,
  updated_at timestamptz,
  PRIMARY KEY (season_key, user_id)
);

CREATE OR REPLACE FUNCTION public.archive_and_reset_season(previous_season_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  visits_archived integer := 0;
  stats_archived integer := 0;
BEGIN
  IF previous_season_key IS NULL OR btrim(previous_season_key) = '' THEN
    RAISE EXCEPTION 'previous_season_key is required';
  END IF;

  INSERT INTO public.visits_archive (season_key, id, user_id, restaurant_id, created_at)
  SELECT previous_season_key, v.id, v.user_id, v.restaurant_id, v.created_at
  FROM public.visits v
  ON CONFLICT (season_key, id) DO NOTHING;

  GET DIAGNOSTICS visits_archived = ROW_COUNT;

  INSERT INTO public.user_stats_archive (
    season_key,
    user_id,
    visit_count,
    raffle_entries,
    created_at,
    updated_at
  )
  SELECT
    previous_season_key,
    s.user_id,
    s.visit_count,
    s.raffle_entries,
    s.created_at,
    s.updated_at
  FROM public.user_stats s
  ON CONFLICT (season_key, user_id)
  DO UPDATE SET
    visit_count = EXCLUDED.visit_count,
    raffle_entries = EXCLUDED.raffle_entries,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at,
    archived_at = now();

  GET DIAGNOSTICS stats_archived = ROW_COUNT;

  DELETE FROM public.visits;
  DELETE FROM public.user_stats;

  RETURN jsonb_build_object(
    'previous_season_key', previous_season_key,
    'visits_archived', visits_archived,
    'user_stats_archived', stats_archived,
    'visits_cleared', true,
    'user_stats_cleared', true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.archive_and_reset_season(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_and_reset_season(text) TO service_role;
