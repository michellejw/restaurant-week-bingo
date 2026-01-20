# Research: Security Hardening

**Branch**: `001-security-hardening`
**Date**: 2026-01-16

## Research Questions

1. How to implement server-side auth checks in Next.js 15 App Router with Clerk?
2. How to structure RLS policies for Clerk + Supabase (external auth)?
3. How to handle the Server/Client Component split for admin pages?

---

## 1. Server-Side Auth with Clerk in Next.js App Router

### Decision
Use Clerk's `auth()` function from `@clerk/nextjs/server` in Server Components to verify session before rendering.

### Rationale
- Clerk provides first-class Next.js App Router support
- `auth()` is designed for Server Components and API routes
- Returns `{ userId }` which can be used to query database for admin status
- Fails safely (returns null userId) when session invalid

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Middleware-only protection | Middleware can check auth but can't easily query database for `is_admin` |
| Client-side check with redirect | Can be bypassed; doesn't meet Constitution "Security First" principle |
| Supabase Auth instead of Clerk | Would require migration; Clerk already working well |

### Implementation Pattern
```typescript
// In Server Component (page.tsx)
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect('/');

  // Query database for is_admin
  // If not admin, redirect('/')

  return <AdminContent />;
}
```

---

## 2. RLS Policies for External Auth (Clerk + Supabase)

### Decision
Use role-based RLS where `anon` is read-only and `service_role` has full access. Application enforces auth via Clerk before calling Supabase with service_role key.

### Rationale
- Supabase RLS can't directly verify Clerk tokens (different auth systems)
- The `anon` key is exposed in frontend; must assume it's public
- All writes already go through API routes which use `service_role`
- This pattern is recommended by Supabase for external auth providers

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Custom JWT verification in RLS | Complex; requires Supabase function to verify Clerk JWTs |
| Disable RLS entirely | Dangerous; no defense in depth |
| Use Supabase Auth | Would require full migration from Clerk |

### Policy Structure
```sql
-- Pattern for each table with user-modifiable data
-- 1. Drop existing permissive policies
DROP POLICY IF EXISTS "Allow anon full access" ON table_name;

-- 2. Allow anon to SELECT only
CREATE POLICY "Public read access" ON table_name
  FOR SELECT TO anon USING (true);

-- 3. Allow service_role full access (implicit, but explicit for clarity)
CREATE POLICY "Service role full access" ON table_name
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

### Affected Tables
- `visits` - User check-ins (writes via API only)
- `users` - User profiles (writes via API only)
- `user_stats` - Cached statistics (writes via trigger + API)
- `restaurants` - Read-only for users (admin import via scripts)
- `sponsors` - Read-only for users (admin import via scripts)

---

## 3. Server/Client Component Split Pattern

### Decision
Extract interactive UI to Client Components; keep auth checks in Server Components.

### Rationale
- Admin pages likely use `useState`, `useEffect` for interactivity
- These hooks require Client Components (`"use client"`)
- Auth checks should happen before any rendering (Server Component)
- Clean separation: Server = security gate, Client = UI

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Move entire page to Client Component | Auth check would be client-side (bypassable) |
| Use Server Actions for everything | Overkill for read-heavy admin dashboard |
| API route middleware | Doesn't protect page rendering, only API calls |

### Implementation Pattern
```text
src/app/admin/
├── page.tsx          # Server Component - auth check, renders AdminContent if authorized
└── AdminContent.tsx  # Client Component - "use client", all the interactive UI
```

```typescript
// page.tsx (Server Component)
import { verifyAdmin } from '@/lib/auth/admin-check';
import { redirect } from 'next/navigation';
import AdminContent from './AdminContent';

export default async function AdminPage() {
  const { authorized } = await verifyAdmin();
  if (!authorized) redirect('/');
  return <AdminContent />;
}

// AdminContent.tsx (Client Component)
"use client";
import { useState } from 'react';
// ... existing admin UI code
```

---

## 4. Test Endpoint Handling Across Branches

### Decision
Delete `/api/test/route.ts` from `main` branch only; keep on `dev` branch.

### Rationale
- Git allows different file states between branches
- Dev deployment (from `dev` branch) keeps debugging tool
- Production deployment (from `main` branch) minimizes surface area
- No code changes needed; purely a git operation

### Process
```bash
git checkout main
rm src/app/api/test/route.ts
git commit -m "Remove debug endpoint from production"
git push origin main
git checkout dev  # dev still has the file
```

---

## Summary of Decisions

| Topic | Decision | Confidence |
|-------|----------|------------|
| Server auth | Clerk `auth()` in Server Component | High |
| RLS strategy | Role-based: anon=read, service_role=write | High |
| Component split | Server wrapper + Client content | High |
| Test endpoint | Git-based branch difference | High |

All research questions resolved. No NEEDS CLARIFICATION remaining.