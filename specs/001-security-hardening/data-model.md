# Data Model: Security Hardening

**Branch**: `001-security-hardening`
**Date**: 2026-01-16

## Overview

This feature does not introduce new entities. It modifies access control on existing entities through Row Level Security (RLS) policies.

## Affected Entities

### Users

**Description**: Represents a participant in Restaurant Week Bingo.

| Field | Type | Access (Before) | Access (After) |
|-------|------|-----------------|----------------|
| id | text (PK) | anon: read/write | anon: read, service_role: write |
| name | text | anon: read/write | anon: read, service_role: write |
| email | text | anon: read/write | anon: read, service_role: write |
| phone | text | anon: read/write | anon: read, service_role: write |
| is_admin | boolean | anon: read/write | anon: read, service_role: write |
| created_at | timestamptz | anon: read/write | anon: read, service_role: write |

**Security-relevant field**: `is_admin` - Used by admin auth check to authorize access.

### Visits

**Description**: Represents a user's check-in at a restaurant.

| Field | Type | Access (Before) | Access (After) |
|-------|------|-----------------|----------------|
| id | serial (PK) | anon: read/write | anon: read, service_role: write |
| user_id | text (FK) | anon: read/write | anon: read, service_role: write |
| restaurant_id | int (FK) | anon: read/write | anon: read, service_role: write |
| created_at | timestamptz | anon: read/write | anon: read, service_role: write |

**Security concern**: Direct INSERT would allow fake check-ins, corrupting raffle fairness.

### User Stats

**Description**: Cached statistics for a user (visit count, raffle entries).

| Field | Type | Access (Before) | Access (After) |
|-------|------|-----------------|----------------|
| user_id | text (PK, FK) | anon: read/write | anon: read, service_role: write |
| visit_count | int | anon: read/write | anon: read, service_role: write |
| raffle_entries | int | anon: read/write | anon: read, service_role: write |
| updated_at | timestamptz | anon: read/write | anon: read, service_role: write |

**Note**: Updated by database trigger on visit INSERT. Trigger runs as table owner, not affected by RLS.

### Restaurants (Reference)

**Description**: Restaurant participating in Restaurant Week.

| Field | Type | Access (Before) | Access (After) |
|-------|------|-----------------|----------------|
| * | * | anon: read only | anon: read only (unchanged) |

**Note**: Already read-only for anon. No changes needed.

### Sponsors (Reference)

**Description**: Business sponsors of Restaurant Week.

| Field | Type | Access (Before) | Access (After) |
|-------|------|-----------------|----------------|
| * | * | anon: read only | anon: read only (unchanged) |

**Note**: Already read-only for anon. No changes needed.

## Access Control Summary

| Entity | anon SELECT | anon INSERT | anon UPDATE | anon DELETE | service_role |
|--------|-------------|-------------|-------------|-------------|--------------|
| users | ✅ | ❌ | ❌ | ❌ | ✅ all |
| visits | ✅ | ❌ | ❌ | ❌ | ✅ all |
| user_stats | ✅ | ❌ | ❌ | ❌ | ✅ all |
| restaurants | ✅ | ❌ | ❌ | ❌ | ✅ all |
| sponsors | ✅ | ❌ | ❌ | ❌ | ✅ all |

## Relationships

```text
users (1) ----< visits (many)
  |
  +---- user_stats (1:1)

restaurants (1) ----< visits (many)
```

## Validation Rules

No new validation rules. Existing constraints remain:
- `visits`: UNIQUE(user_id, restaurant_id) - Prevents duplicate check-ins
- `user_stats.user_id`: REFERENCES users(id) - Ensures stats belong to valid user
- `visits.user_id`: REFERENCES users(id) - Ensures visits belong to valid user
- `visits.restaurant_id`: REFERENCES restaurants(id) - Ensures visits are at valid restaurants

## State Transitions

No state machines in this feature. Access control is stateless (based on role at time of request).