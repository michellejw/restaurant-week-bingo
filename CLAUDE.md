# restaurant-week-bingo Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-16

## Active Technologies
- TypeScript 5.x with Next.js 15 (App Router) + @sentry/nextjs (Sentry's official Next.js SDK) (003-error-monitoring)
- N/A (Sentry is SaaS - no local storage for errors) (003-error-monitoring)
- TypeScript 5.x with Next.js 15 (App Router) + SWR (stale-while-revalidate), existing @supabase/supabase-js, @clerk/nextjs (004-data-caching)
- Client-side memory cache (SWR default); no persistent storage needed (004-data-caching)
- TypeScript 5.x with Next.js 15 (App Router) + Existing @supabase/supabase-js, @clerk/nextjs (no new dependencies) (005-config-constants)
- N/A (config is static TypeScript constants) (005-config-constants)

- TypeScript 5.x with Next.js 15 (App Router) + @clerk/nextjs (auth), @supabase/supabase-js (database), React 19 (001-security-hardening)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x with Next.js 15 (App Router): Follow standard conventions

## Recent Changes
- 005-config-constants: Added TypeScript 5.x with Next.js 15 (App Router) + Existing @supabase/supabase-js, @clerk/nextjs (no new dependencies)
- 004-data-caching: Added TypeScript 5.x with Next.js 15 (App Router) + SWR (stale-while-revalidate), existing @supabase/supabase-js, @clerk/nextjs
- 003-error-monitoring: Added TypeScript 5.x with Next.js 15 (App Router) + @sentry/nextjs (Sentry's official Next.js SDK)


<!-- MANUAL ADDITIONS START -->

## Development Roadmap

Check [docs/ROADMAP.md](docs/ROADMAP.md) for the current development plan and progress. This tracks feature specs to be implemented and their completion status.

<!-- MANUAL ADDITIONS END -->
