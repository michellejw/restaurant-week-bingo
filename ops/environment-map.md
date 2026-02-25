# Environment Map

Use this as the source of truth before any seasonal operation.

## Canonical Mapping

| Layer | Local | Dev | Prod |
|---|---|---|---|
| Git branch | feature branch or `dev` | `dev` | `main` |
| Vercel target | localhost | preview deployment from `dev` | production deployment from `main` |
| Supabase project | dev project only | dev project (`lhynosiqalkouyotibwt`) | prod project (`ncezsildjpkioofgsmkj`) |
| Clerk keys | test keys | test keys | live keys |
| Data safety | disposable | reusable test data | production records |

## Hard Safety Rules

1. Never run destructive DB actions on prod unless:
   - you are on `main`
   - `npm run backup:prod` completed in this session
   - `supabase link` confirms prod project ref
2. Never point local `.env.local` to prod Supabase.
3. Never use live Clerk keys in dev/preview.
4. Always test on dev preview before pushing `main`.

## Environment Verification Checklist

Before each major step, confirm:

- Git: `git branch --show-current`
- Supabase link: `cat supabase/.temp/project-ref`
- Vercel target: branch/deployment URL matches intended env
- Clerk key type in target env (`pk_test` vs `pk_live`)

If any layer mismatches, stop and fix mapping before continuing.
