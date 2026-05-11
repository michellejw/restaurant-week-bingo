# Restore from a paused (or deleted) Supabase project

**Why this doc exists:** On 2026-05-11 both resto-week Supabase
projects (dev + prod) were transferred to a new free org and paused
because the next season isn't until fall 2026. Supabase free tier
keeps paused projects available to unpause for **90 days**, after
which they may be **permanently deleted**. Earliest deletion window:
**~2026-08-09**.

If you're reading this and the next season is approaching, you may be
in one of two situations:

1. **Within 90 days of pause** — just unpause from the Supabase
   dashboard. Skip this doc; everything is fine.
2. **Past 90 days / projects gone** — follow this doc to rebuild from
   scratch. You have everything you need in this repo.

## Historical user stats survive intact

Returning users (same Clerk account) will see their past seasons after
restore. Why:

- `users.id` is the Clerk user ID — Clerk is independent of Supabase,
  so signing in next season produces the same ID and all FK lookups
  resolve.
- Past seasons live in `user_stats_archive` + `visits_archive`, keyed
  by `season_key`. The May 6 dump contains `fall2025` archived and
  spring 2026 data still in the live tables (rollover hadn't run yet
  at dump time). The fall 2026 season-start rollover will move spring
  2026 into the archive automatically.

The plumbing for a "your past seasons" dashboard is fully in place —
just no UI yet. To build it: query `user_stats_archive` +
`visits_archive` filtered by Clerk user ID, group by `season_key`,
render. No schema changes needed.

## What you have (audit done 2026-05-11)

| Thing | Where | Status |
|---|---|---|
| Schema migrations | `supabase/migrations/` (4 files) | ✅ Committed |
| Full schema reference | `supabase/schema.sql` | ✅ Committed |
| Prod data dump (data-only pg_dump, May 6 2026) | `supabase/data/resto-week-prod-schema.sql` | ✅ Committed (misleading filename — it's the **data**) |
| JSON backups (app-level) | `backups/*.json` — latest prod restaurants: `prod-restaurants-pre-import-2026-03-13` | ✅ Committed |
| Storage buckets | None — app doesn't use Supabase Storage | n/a |
| Edge functions | None — `supabase/functions/` doesn't exist | n/a |
| Auth users | Lives in **Clerk**, not Supabase. Persists independently. | ✅ Safe |
| Supabase URL + keys | In `.env.production` and Vercel | ⚠️ Will change |

## Restore procedure

### 1. Create a new Supabase project

- supabase.com → New project
- Name: `pi-resto-week-prod` (or your preferred name)
- Pick same region as old (latency)
- Strong DB password, save it
- Wait ~2 min for provisioning

Note the new **project ref** and **publishable key** from
Settings → API Keys.

### 2. Apply migrations

From repo root:

```bash
supabase db push --project-ref <new-project-ref>
# Use the new DB password when prompted
```

This applies all 4 migration files. Verify the dashboard now shows
the expected tables.

### 3. Restore data

The data dump is data-only (`SET session_replication_role = replica;`
at the top, no schema), so it expects the tables to already exist
from step 2.

```bash
# Get the connection string from Supabase dashboard:
# Settings → Database → Connection string → URI (use the pooler one,
# session mode)

psql "<connection-string>" < supabase/data/resto-week-prod-schema.sql
```

If `psql` complains about constraint violations, the data is older
than the schema. Fall back to the most recent app-level JSON backup
(`backups/prod-restaurants-pre-import-2026-03-13*.json`) and import
via `npm run restaurant:import` after restoring the rest.

### 4. Update env vars

In `.env.production` and in the Vercel dashboard (Production scope):

- `NEXT_PUBLIC_SUPABASE_URL` → new project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` → new publishable key
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → new anon key (if still used)
- `SUPABASE_SERVICE_ROLE_KEY` → new service role key

Clerk env vars do **not** change.

### 5. Smoke test before announcing season

- Trigger a Vercel redeploy so it picks up new env vars
- Sign in (Clerk user should still work)
- Check that restaurants show up on the public page
- Spot-check `/admin` data
- Run through one full check-in flow

### 6. Then resume the normal season-start playbook

`/assistant` and use the start-season flow in
`ops/playbooks/start-season.yaml` for the actual season launch
(restaurant import, season config, etc.). This restore doc only gets
the database back online.

## If you forget all of this

The `/assistant` slash command should surface this doc automatically
if you mention "Supabase" or "database missing." If it doesn't,
search the repo for "RESTORE-FROM-PAUSED."
