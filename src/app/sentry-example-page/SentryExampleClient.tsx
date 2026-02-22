'use client';

import * as Sentry from '@sentry/nextjs';
import { useState } from 'react';

class SentryExampleFrontendError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = 'SentryExampleFrontendError';
  }
}

export default function SentryExampleClient() {
  const [message, setMessage] = useState('');

  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Sentry Example (Dev Only)</h1>
      <p className="mb-6 text-gray-600">
        Use this page to verify frontend and backend Sentry error capture in non-production environments.
      </p>

      <button
        type="button"
        className="rounded-md bg-coral-600 px-4 py-2 font-medium text-white hover:bg-coral-700"
        onClick={async () => {
          setMessage('Sending example errors...');

          await Sentry.startSpan(
            {
              name: 'Example Frontend/Backend Span',
              op: 'test',
            },
            async () => {
              await fetch('/api/sentry-example-api');
            }
          );

          throw new SentryExampleFrontendError('This error is raised on the frontend example page.');
        }}
      >
        Throw Sample Error
      </button>

      {message ? <p className="mt-4 text-sm text-gray-600">{message}</p> : null}
    </main>
  );
}
