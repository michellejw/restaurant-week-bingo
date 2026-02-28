# Developer Environment Setup

This guide walks you through setting up a local development environment for Restaurant Week Bingo. By the end, you'll have the application running locally and understand the codebase structure.

**Time Required**: ~30 minutes
**Audience**: Developers with basic web development experience
**Last Updated**: 2026-02-17

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Environment Variables](#environment-variables)
4. [External Services Setup](#external-services-setup)
5. [Architecture Overview](#architecture-overview)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

### Required Software

| Software | Version | Check Command |
|----------|---------|---------------|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Git | Any recent | `git --version` |

### Required Accounts

You'll need accounts on these services (free tiers work for development):

| Service | Purpose | Sign Up |
|---------|---------|---------|
| **Supabase** | PostgreSQL database | https://supabase.com |
| **Clerk** | User authentication | https://clerk.com |

### Optional Accounts

| Service | Purpose | Sign Up |
|---------|---------|---------|
| **Sentry** | Error monitoring | https://sentry.io |
| **Vercel** | Deployment | https://vercel.com |

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/michellejw/restaurant-week-bingo.git
cd restaurant-week-bingo

# 2. Install dependencies
npm install

# 3. Set up environment variables (see next section)
cp .env.example .env.local  # If exists, or create manually

# 4. Run the development server
npm run dev
```

Open http://localhost:3000 to see the application.

> **Note**: You'll need to configure environment variables before the app works fully. See the [Environment Variables](#environment-variables) section below.

---

## Environment Variables

Create a `.env.local` file in the project root with these variables:

### Required Variables

| Variable | Description | How to Obtain |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk secret key | Clerk Dashboard → API Keys |

### Optional Variables

| Variable | Description | How to Obtain |
|----------|-------------|---------------|
| `NEXT_PUBLIC_DEV_HOSTNAME` | Dev deployment hostname for testing overrides | Your Vercel preview URL hostname |
| `SENTRY_DSN` | Sentry error tracking DSN | Sentry → Project Settings → Client Keys |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source maps | Sentry → Settings → Auth Tokens |

### Example .env.local

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Clerk (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Development (Optional)
NEXT_PUBLIC_DEV_HOSTNAME=your-app-git-dev.vercel.app

# Sentry (Optional - recommended for production)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_...
```

---

## External Services Setup

### Supabase (Database)

1. **Create a project** at https://supabase.com/dashboard
2. **Initialize schema using migrations (recommended)**:
   - Link your project with Supabase CLI:
     - `supabase link --project-ref <your-dev-project-ref> --password '<db-password>'`
   - Verify migration status:
     - `supabase migration list`
   - Apply pending migrations:
     - `supabase db push`
   - Optionally run `supabase/dev_data_import.sql` for sample data
3. **Get your API keys** from Settings → API

### Clerk (Authentication)

1. **Create an application** at https://dashboard.clerk.com
2. **Configure allowed domains**:
   - Add `localhost:3000` for local development
   - Add your Vercel domains for deployment
3. **Get your API keys** from API Keys section

> **Important**: Clerk uses separate keys for development and production. Make sure you're using the correct environment's keys.

### Sentry (Error Monitoring - Optional)

1. **Create a project** at https://sentry.io (select Next.js)
2. **Get your DSN** from Project Settings → Client Keys
3. **Get an auth token** from Settings → Auth Tokens (needed for source maps)

Sentry is pre-configured in the project via `@sentry/nextjs`. Just add the environment variables to enable it

---

## Architecture Overview

Restaurant Week Bingo is a Next.js 15 application using the App Router, with Supabase for the database and Clerk for authentication.

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 15, React 19, TypeScript | UI and server-side rendering |
| Styling | Tailwind CSS | Utility-first CSS |
| Authentication | Clerk | User management and sessions |
| Database | Supabase (PostgreSQL) | Data storage and real-time features |
| Maps | Leaflet + OpenStreetMap | Restaurant locations |
| Error Tracking | Sentry | Production error monitoring |
| Deployment | Vercel | Hosting and CI/CD |

### Directory Structure

```text
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── check-in/        # Check-in endpoint (POST)
│   │   ├── profile/         # User profile endpoint
│   │   └── restaurants/     # Restaurant data endpoint
│   ├── admin/               # Admin dashboard (protected)
│   ├── stats/               # Statistics page
│   ├── how-to-play/         # Instructions page
│   ├── my-info/             # User profile page
│   ├── sponsors/            # Sponsors display
│   └── page.tsx             # Homepage with bingo card
│
├── components/               # Reusable React components
│   ├── BingoCard.tsx        # Main bingo card display
│   ├── CheckInModal.tsx     # Restaurant code entry
│   ├── RestaurantMap.tsx    # Leaflet map component
│   └── ...                  # Other UI components
│
├── config/                   # Application configuration
│   └── restaurant-week.ts   # Event dates, GAME_CONFIG
│
├── hooks/                    # Custom React hooks
│   ├── useRestaurants.ts    # SWR hook for restaurant data
│   └── useUserStats.ts      # SWR hook for user statistics
│
├── lib/                      # Core services and utilities
│   ├── auth/                # Admin authentication helpers
│   │   └── admin-check.ts   # verifyAdmin() function
│   ├── services/            # Database service layer
│   │   └── database.ts      # Supabase queries
│   ├── sentry/              # Error tracking utilities
│   ├── rate-limit.ts        # API rate limiting
│   └── supabase.ts          # Supabase client configuration
│
└── types/                    # TypeScript type definitions

scripts/                      # Admin and maintenance scripts
├── smart-import-restaurants.js   # Import restaurant data
├── smart-import-sponsors.js      # Import sponsor data
├── raffle-draw.js               # Draw raffle winners
├── backup-database.js           # Database backup
└── check-db-consistency.js      # Data integrity checks

supabase/                     # Database schema
├── migrations/               # Canonical schema history (source of truth)
├── updated_schema.sql        # Legacy snapshot (reference only)
└── dev_data_import.sql       # Sample data for development
```

### Key Files

| File | Purpose |
|------|---------|
| `src/config/restaurant-week.ts` | Event dates, raffle rules, rate limits |
| `src/app/api/check-in/route.ts` | Core check-in logic (validation, rate limiting) |
| `src/lib/services/database.ts` | All Supabase database queries |
| `src/middleware.ts` | Clerk authentication middleware |
| `supabase/migrations/` | Canonical database schema and policy history |

### User Flows

#### Check-in Flow

```text
User enters restaurant code
    ↓
[CheckInModal.tsx] → POST /api/check-in
    ↓
[route.ts] validates:
  - User authenticated (Clerk)
  - Rate limit not exceeded
  - Restaurant code exists
  - User hasn't already checked in
    ↓
[database.ts] creates visit record
    ↓
Database trigger updates user_stats
  - Increments visit_count
  - Calculates raffle_entries = floor(visit_count / 3)
    ↓
Response returned → UI updates via SWR revalidation
```

#### Authentication Flow

```text
User clicks Sign In
    ↓
[Clerk] handles authentication
    ↓
[middleware.ts] protects routes
    ↓
Protected pages check session:
  - Regular user → access granted
  - Admin routes → additional is_admin check
```

#### Data Fetch Flow

```text
Page loads
    ↓
[useRestaurants.ts] or [useUserStats.ts] hook
    ↓
SWR manages caching:
  - Returns cached data immediately
  - Revalidates in background
    ↓
Fetches from API route → Supabase
    ↓
UI updates when data returns
```

---

## Verification

After setup, verify everything works:

### 1. Application Starts

```bash
npm run dev
```

**Expected**: Server starts without errors, accessible at http://localhost:3000

### 2. Homepage Loads

Visit http://localhost:3000

**Expected**:
- Page renders without errors
- You see the Restaurant Week Bingo interface
- Countdown or "Restaurant Week Active" message appears

### 3. Authentication Works

Click "Sign In" or "Sign Up"

**Expected**:
- Clerk authentication modal appears
- Can create account or sign in
- Redirects back to app after authentication

### 4. Database Connection Works

After signing in, try to check in at a restaurant (if dev data was imported)

**Expected**:
- Restaurants list loads
- Check-in creates a visit record
- Stats update correctly

### 5. Build Succeeds

```bash
npm run build
```

**Expected**: Build completes without TypeScript or ESLint errors

---

## Troubleshooting

### "Cannot connect to Supabase"

**Symptoms**: Database queries fail, restaurants don't load

**Solutions**:
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct (check for typos)
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set (check Supabase dashboard)
3. Ensure database migrations were applied (`supabase migration list`, then `supabase db push`)

### "Clerk authentication fails"

**Symptoms**: Sign-in modal doesn't appear, authentication errors

**Solutions**:
1. Verify you're using `localhost:3000` (Clerk dev keys are port-specific)
2. Check that Clerk keys match your Clerk project
3. Clear browser cache and try again
4. Verify `localhost:3000` is in allowed domains in Clerk dashboard

### "kid mismatch" or token errors

**Symptoms**: Authentication appears to work but fails on subsequent requests

**Solutions**:
1. Make sure you're running on `localhost:3000` (not another port)
2. Kill all node processes: `pkill -f "next dev"`
3. Clear browser storage and cookies
4. Restart dev server

### "Module not found" errors

**Symptoms**: Build fails with missing modules

**Solutions**:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Verify Node.js version is 18+

### "Environment variable is undefined"

**Symptoms**: Features don't work, undefined errors in console

**Solutions**:
1. Verify `.env.local` exists in project root
2. Check variable names match exactly (case-sensitive)
3. Restart dev server after changing env vars
4. For client-side vars, ensure they start with `NEXT_PUBLIC_`

### Build fails with type errors

**Symptoms**: `npm run build` fails

**Solutions**:
1. Run `npm run lint` to see specific errors
2. Check TypeScript errors: `npx tsc --noEmit`
3. Ensure all dependencies are installed
