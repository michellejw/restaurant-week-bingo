# Data Model: Client-Side Data Caching

**Feature**: 004-data-caching
**Date**: 2026-02-01

## Overview

This feature adds a client-side caching layer. No database schema changes are required. This document describes the **cache data structures** that will be managed by SWR.

## Cached Entities

### Restaurant Data

**Cache Key**: `['restaurants', userId]` (when logged in) or `'restaurants'` (anonymous)

**Shape** (from existing `/api/restaurants` endpoint):
```typescript
interface RestaurantWithVisitStatus {
  id: string;
  name: string;
  address: string;
  category: string;
  code: string;
  latitude: number;
  longitude: number;
  logo_url: string | null;
  created_at: string;
  visited: boolean;  // User-specific: true if user has checked in
}

interface RestaurantsResponse {
  restaurants: RestaurantWithVisitStatus[];
  sponsors: Sponsor[];
}
```

**Invalidation Triggers**:
- User completes a check-in (restaurant becomes visited)
- User logs in/out (visited status changes)

### User Stats

**Cache Key**: `['user-stats', userId]`

**Shape** (from existing `DatabaseService.userStats.getOrCreate`):
```typescript
interface UserStats {
  user_id: string;
  visit_count: number;
  raffle_entries: number;
  created_at: string;
  updated_at: string;
}
```

**Invalidation Triggers**:
- User completes a check-in (visit_count and raffle_entries change)

## Cache Key Registry

All cache keys are centralized for maintainability:

```typescript
// src/lib/swr/config.ts

export const CACHE_KEYS = {
  // Global keys (same for all users)
  restaurants: 'restaurants',
  sponsors: 'sponsors',

  // User-specific key generators
  userStats: (userId: string) => ['user-stats', userId],
  restaurantsWithVisits: (userId: string) => ['restaurants', userId],
} as const;
```

## Cache Lifecycle

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Page Load     │────▶│   Check Cache   │────▶│  Return Cached  │
│                 │     │                 │     │  (if exists)    │
└─────────────────┘     └────────┬────────┘     └────────┬────────┘
                                 │                       │
                                 │ Cache miss            │ Revalidate
                                 ▼                       ▼ in background
                        ┌─────────────────┐     ┌─────────────────┐
                        │  Fetch from     │     │  Fetch from     │
                        │  API            │     │  API            │
                        └────────┬────────┘     └────────┬────────┘
                                 │                       │
                                 ▼                       ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │ Store in Cache  │     │ Update Cache    │
                        │ + Return Data   │     │ (silent)        │
                        └─────────────────┘     └─────────────────┘


┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Check-in      │────▶│   API Success   │────▶│  Invalidate     │
│   Submitted     │     │                 │     │  Cache Keys     │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │  SWR Refetches  │
                                                │  Automatically  │
                                                └─────────────────┘
```

## State Transitions

### User Auth State Changes

| Previous State | New State | Cache Action |
|---------------|-----------|--------------|
| Logged Out | Logged In | Clear anonymous restaurant cache; fetch user-specific data |
| Logged In | Logged Out | Clear user-specific caches; fall back to anonymous mode |
| User A | User B | Clear User A caches; fetch User B data |

### Check-in Flow

| Event | Cache Action |
|-------|--------------|
| Check-in starts | No cache change |
| Check-in succeeds | Invalidate `userStats(userId)` and `restaurantsWithVisits(userId)` |
| Check-in fails | No cache change (keep existing data) |
