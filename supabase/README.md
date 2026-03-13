# Supabase Database

Two Supabase projects, one for dev and one for prod:

| Environment | Project Ref | Used by |
|-------------|-------------|---------|
| **Dev** | `lhynosiqalkouyotibwt` | Local dev (`npm run dev`), Vercel preview deploys |
| **Prod** | `ncezsildjpkioofgsmkj` | `picc-rest-week.waveformanalytics.com` |

The Supabase CLI defaults to linking to **dev**. The app connects to whichever database is configured in `.env.local` (local) or Vercel env vars (deployed).

## Files

| File | Purpose |
|------|---------|
| `schema.sql` | Canonical snapshot of the full database schema (generated via `supabase db dump`) |
| `migrations/` | Timestamped migration files applied to both dev and prod |
| `data/` | Data import files (restaurants, sponsors) |
| `dev_data_import.sql` | Sample data for development |
| `dev_config.sql` | Dev-specific settings (disables RLS for easier testing) |
| `fix-user-stats-triggers.sql` | Trigger definitions (referenced by game config) |
| `updated_schema.sql` | Legacy full schema — superseded by `schema.sql` |

## Applying Migrations

Always use the CLI, never the Supabase dashboard.

### Quick way (recommended)

```bash
./scripts/db-push.sh
```

This script pushes pending migrations to both dev and prod, re-links to dev, and dumps a fresh `schema.sql`. It asks for confirmation before pushing.

### Manual way

```bash
# 1. Link to dev and push
supabase link --project-ref lhynosiqalkouyotibwt
supabase db push

# 2. Link to prod and push
supabase link --project-ref ncezsildjpkioofgsmkj
supabase db push

# 3. Re-link to dev
supabase link --project-ref lhynosiqalkouyotibwt

# 4. Dump fresh schema snapshot
supabase db dump -s public -f supabase/schema.sql
```

### Checking migration status

```bash
supabase migration list
```

Shows which migrations are applied to the currently linked database vs which are local-only.

## Setting Up a New Database From Scratch

```
1. Run: schema.sql               -- Full schema with tables, policies, functions
2. Run: dev_data_import.sql      -- Sample data (dev only, skip for prod)
3. Run: dev_config.sql           -- Disables RLS for easier testing (dev only)
```

## Architecture Notes

- **Auth**: Clerk handles authentication; Supabase is data-only
- **RLS**: Policies allow `anon` and `service_role` access (Clerk manages who can reach the app)
- **Frontend**: Uses Supabase anon/publishable key
- **Server/scripts**: Uses service role key
- See `DATABASE_SETUP_GUIDE.md` for details on the Clerk + Supabase RLS pattern
