# Restaurant week bingo

We are building a web app for Pleasure Island Restaurant Week. It is a Bingo game where
people can log in and scan a QR code at each restaurant to log their visit. After a
certain number of visits to restaurants, they have their names entered into a raffle to
win a prize.

This is a temporary overview of the project plan. It may change but for now it seems
reasonable.

# Restaurant Week Bingo: Development Plan

## Phase 1: Core UI Structure

1. Set up base Next.js project with TypeScript (done)
2. Create main layout with map and bingo card placeholders (done)
3. Build reusable Bingo Card component (done)
    - Grid layout (done)
    - Single square component (done)
    - Click handling (done)
4. Build basic Map component (done)
    - Integrate Mapbox (done)
    - Add placeholder markers (done)
    - Basic interactivity (done)

## Phase 2: Basic State Management

1. Create sample restaurant data structure (done)
2. Add state management for:
    - Selected restaurants (done)
    - Completed squares (done)
    - Map/Bingo card interaction (done)
3. Implement basic restaurant selection logic (done)
4. Add visual feedback for selections (done)

## Phase 3: Data Layer

1. Set up Supabase project (done)
2. Design database schema:
    - Restaurants table (done)
    - Users table (done)
    - Visits table (done)
3. Set up Prisma * Note prisma only works with node stable releases (done)
4. Create basic API routes for:
    - Fetching restaurants (done)
    - Updating visits (done)
5. Connect UI to real data (done)

## Phase 4: Authentication

1. Set up Auth0
2. Add login/logout functionality
3. Create protected routes
4. Add user-specific data handling
5. Implement session management

## Phase 5: Admin Features

1. Create admin dashboard layout
2. Build restaurant management interface
3. Add QR code generation
4. Create basic analytics display
5. Add data export functionality

## Phase 6: QR Code Integration

1. Add QR code scanner component
2. Implement QR code validation
3. Connect scanning to visit tracking
4. Add success/error handling

## Phase 7: Polish & Deploy

1. Add loading states
2. Implement error boundaries
3. Add responsive design tweaks
4. Performance optimization
5. Deploy to Vercel

## Phase 8: Testing & Documentation

1. Write unit tests for core components
2. Add integration tests
3. Create user documentation
4. Write admin documentation
5. Document API endpoints

---

# Prisma + Supabase Integration Summary

I had to resolve some issues when setting up prisma with supabase and wanted to summarize
here for future me...

## Environment Setup

- Use `.env` file (not `.env.local`) for compatibility with both Next.js and Prisma
- Include a `.env.example` in the repo with placeholder values
- Add `.env` to `.gitignore` (this was done automatically by WebStorm which is nice)

## Required Environment Variables

```
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
```

## Prisma Schema Configuration

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL") // Transaction pooler connection
  directUrl = env("DIRECT_URL") // Direct connection
}
```

## Connection Types (Supabase)

- Use Transaction Pooler for `DATABASE_URL` (regular queries)
- Use Direct Connection for `DIRECT_URL` (migrations/schema changes)
- Don't use Session Pooler for Next.js apps