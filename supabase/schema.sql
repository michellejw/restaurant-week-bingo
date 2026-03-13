
\restrict FFk1ey5MyWWEV1rLsyiLIE8qxrCOqAbhgTJgE4wkg9A8n6Gtn7ysxTfoac7TOBr


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."archive_and_reset_season"("previous_season_key" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."archive_and_reset_season"("previous_season_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."update_user_stats"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."restaurants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "address" "text" NOT NULL,
    "url" "text",
    "code" "text" NOT NULL,
    "latitude" double precision NOT NULL,
    "longitude" double precision NOT NULL,
    "description" "text",
    "phone" "text",
    "specials" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "logo_file" "text",
    "promotions" "text"
);


ALTER TABLE "public"."restaurants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_stats" (
    "user_id" "text" NOT NULL,
    "visit_count" integer DEFAULT 0,
    "raffle_entries" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."visits" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "text",
    "restaurant_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."visits" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."raffle_entries" AS
 SELECT "s"."user_id",
    "s"."visit_count",
    "s"."raffle_entries",
    "array_agg"(DISTINCT "r"."name") AS "visited_restaurants"
   FROM (("public"."user_stats" "s"
     LEFT JOIN "public"."visits" "v" ON (("s"."user_id" = "v"."user_id")))
     LEFT JOIN "public"."restaurants" "r" ON (("v"."restaurant_id" = "r"."id")))
  GROUP BY "s"."user_id", "s"."visit_count", "s"."raffle_entries";


ALTER VIEW "public"."raffle_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sponsors" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "address" "text" NOT NULL,
    "phone" "text",
    "url" "text",
    "description" "text",
    "promo_offer" "text",
    "latitude" double precision NOT NULL,
    "longitude" double precision NOT NULL,
    "is_retail" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "logo_file" "text"
);


ALTER TABLE "public"."sponsors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_stats_archive" (
    "season_key" "text" NOT NULL,
    "archived_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "text" NOT NULL,
    "visit_count" integer NOT NULL,
    "raffle_entries" integer NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."user_stats_archive" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "name" "text",
    "phone" "text",
    "email" "text",
    "is_admin" boolean DEFAULT false,
    "last_seen_at" timestamp with time zone
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."visits_archive" (
    "season_key" "text" NOT NULL,
    "archived_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" NOT NULL,
    "user_id" "text",
    "restaurant_id" "uuid",
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."visits_archive" OWNER TO "postgres";


ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sponsors"
    ADD CONSTRAINT "sponsors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_stats_archive"
    ADD CONSTRAINT "user_stats_archive_pkey" PRIMARY KEY ("season_key", "user_id");



ALTER TABLE ONLY "public"."user_stats"
    ADD CONSTRAINT "user_stats_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."visits_archive"
    ADD CONSTRAINT "visits_archive_pkey" PRIMARY KEY ("season_key", "id");



ALTER TABLE ONLY "public"."visits"
    ADD CONSTRAINT "visits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."visits"
    ADD CONSTRAINT "visits_user_id_restaurant_id_key" UNIQUE ("user_id", "restaurant_id");



CREATE INDEX "visits_archive_restaurant_idx" ON "public"."visits_archive" USING "btree" ("restaurant_id");



CREATE INDEX "visits_archive_user_idx" ON "public"."visits_archive" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_stats_on_visit_delete" AFTER DELETE ON "public"."visits" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_stats"();



CREATE OR REPLACE TRIGGER "update_stats_on_visit_insert" AFTER INSERT ON "public"."visits" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_stats"();



ALTER TABLE ONLY "public"."user_stats"
    ADD CONSTRAINT "user_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."visits"
    ADD CONSTRAINT "visits_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."visits"
    ADD CONSTRAINT "visits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_stats"("user_id") ON DELETE CASCADE;



CREATE POLICY "Enable read access for all users" ON "public"."restaurants" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."sponsors" FOR SELECT USING (true);



CREATE POLICY "Public read access for user_stats" ON "public"."user_stats" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Public read access for users" ON "public"."users" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Public read access for visits" ON "public"."visits" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Service role delete for visits" ON "public"."visits" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "Service role insert for user_stats" ON "public"."user_stats" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role insert for users" ON "public"."users" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role insert for visits" ON "public"."visits" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role update for user_stats" ON "public"."user_stats" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role update for users" ON "public"."users" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role update for visits" ON "public"."visits" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."restaurants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sponsors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."visits" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."archive_and_reset_season"("previous_season_key" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."archive_and_reset_season"("previous_season_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."archive_and_reset_season"("previous_season_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."archive_and_reset_season"("previous_season_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_stats"() TO "service_role";



GRANT ALL ON TABLE "public"."restaurants" TO "anon";
GRANT ALL ON TABLE "public"."restaurants" TO "authenticated";
GRANT ALL ON TABLE "public"."restaurants" TO "service_role";



GRANT ALL ON TABLE "public"."user_stats" TO "anon";
GRANT ALL ON TABLE "public"."user_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."user_stats" TO "service_role";



GRANT ALL ON TABLE "public"."visits" TO "anon";
GRANT ALL ON TABLE "public"."visits" TO "authenticated";
GRANT ALL ON TABLE "public"."visits" TO "service_role";



GRANT ALL ON TABLE "public"."raffle_entries" TO "anon";
GRANT ALL ON TABLE "public"."raffle_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."raffle_entries" TO "service_role";



GRANT ALL ON TABLE "public"."sponsors" TO "anon";
GRANT ALL ON TABLE "public"."sponsors" TO "authenticated";
GRANT ALL ON TABLE "public"."sponsors" TO "service_role";



GRANT ALL ON TABLE "public"."user_stats_archive" TO "anon";
GRANT ALL ON TABLE "public"."user_stats_archive" TO "authenticated";
GRANT ALL ON TABLE "public"."user_stats_archive" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."visits_archive" TO "anon";
GRANT ALL ON TABLE "public"."visits_archive" TO "authenticated";
GRANT ALL ON TABLE "public"."visits_archive" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






\unrestrict FFk1ey5MyWWEV1rLsyiLIE8qxrCOqAbhgTJgE4wkg9A8n6Gtn7ysxTfoac7TOBr

RESET ALL;
