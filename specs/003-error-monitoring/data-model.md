# Data Model: Error Monitoring

**Branch**: `003-error-monitoring`
**Date**: 2026-01-26

## Overview

This feature does not introduce new data entities to the application database. Error data is stored in Sentry's SaaS platform, not locally.

## External Data (Sentry-Managed)

The following data is captured and stored by Sentry. We do not manage this schema directly, but we control what data we send.

### Error Event

| Field | Description | Source |
|-------|-------------|--------|
| `exception` | Error message and stack trace | Automatic capture |
| `timestamp` | When the error occurred | Automatic |
| `environment` | "production" or "development" | Sentry config |
| `release` | Git commit SHA or version | Vercel integration |
| `user.id` | Clerk user ID (if authenticated) | Manual: `setUser()` |
| `browser` | Browser name and version | Automatic (client errors) |
| `os` | Operating system | Automatic (client errors) |
| `device` | Device type (desktop/mobile/tablet) | Automatic (client errors) |
| `url` | Page URL where error occurred | Automatic |
| `request.method` | HTTP method (for API errors) | Automatic (server errors) |
| `request.url` | API endpoint URL | Automatic (server errors) |
| `tags` | Custom key-value pairs for filtering | Manual (optional) |
| `extra` | Additional context data | Manual (optional) |

### Data NOT Captured (PII Protection)

Per FR-005, the following fields are explicitly excluded:

| Excluded Field | Reason |
|----------------|--------|
| `user.email` | PII - can be looked up in Clerk if needed |
| `user.username` | PII |
| `user.name` | PII |
| `ip_address` | Configured to not store (Sentry setting) |
| Request body content | May contain user-submitted PII |

## Environment Variables

New environment variables required:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry Data Source Name | `https://xxx@xxx.ingest.sentry.io/123` |
| `SENTRY_ORG` | Sentry organization slug | `my-org` |
| `SENTRY_PROJECT` | Sentry project slug | `restaurant-week-bingo` |
| `SENTRY_AUTH_TOKEN` | Auth token for source map upload | `sntrys_xxx` |

## State Transitions

N/A - No local state management for error data.

## Relationships

N/A - Error data is not related to application entities in the database.
