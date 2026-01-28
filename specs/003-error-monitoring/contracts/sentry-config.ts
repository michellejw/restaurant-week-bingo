/**
 * Sentry Configuration Contract
 * Branch: 003-error-monitoring
 *
 * This file defines the expected configuration structure for Sentry integration.
 * It serves as documentation and type contract for implementation.
 */

/**
 * User context to set in Sentry when user is authenticated.
 * IMPORTANT: Only include non-PII fields per FR-005.
 */
export interface SentryUserContext {
  /** Clerk user ID - the only user identifier we send to Sentry */
  id: string;
  // DO NOT ADD: email, username, name, phone, ip_address
}

/**
 * Sentry client configuration options.
 * These are the key settings for sentry.client.config.ts
 */
export interface SentryClientConfig {
  /** Sentry DSN from environment variable */
  dsn: string;

  /** Environment name - auto-detected from Vercel */
  environment: 'production' | 'development' | 'preview';

  /** Sample rate for performance tracing (0.0 to 1.0) */
  tracesSampleRate: number;

  /** Sample rate for session replays - set to 0 (disabled) */
  replaysSessionSampleRate: 0;

  /** Sample rate for error session replays - set to 0 (disabled) */
  replaysOnErrorSampleRate: 0;

  /** Enable debug mode in development only */
  debug: boolean;
}

/**
 * Sentry server configuration options.
 * These are the key settings for sentry.server.config.ts
 */
export interface SentryServerConfig {
  /** Sentry DSN from environment variable */
  dsn: string;

  /** Environment name */
  environment: 'production' | 'development' | 'preview';

  /** Sample rate for performance tracing */
  tracesSampleRate: number;
}

/**
 * Expected environment variables for Sentry integration.
 */
export const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SENTRY_DSN', // Client and server DSN
] as const;

export const OPTIONAL_ENV_VARS = [
  'SENTRY_ORG',        // For source map uploads
  'SENTRY_PROJECT',    // For source map uploads
  'SENTRY_AUTH_TOKEN', // For source map uploads (CI/CD only)
] as const;

/**
 * Helper function contract for setting user context.
 * Implementation should be in src/lib/sentry/user-context.ts
 */
export type SetSentryUserContext = (userId: string | null) => void;
