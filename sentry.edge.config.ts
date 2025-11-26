/**
 * Sentry Edge Configuration
 *
 * This file configures Sentry error tracking for Edge Runtime (middleware).
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment and release
    environment: process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',

    // Performance Monitoring (lower rate for edge)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

    // Debug mode
    debug: process.env.NODE_ENV === 'development',

    // Before sending
    beforeSend(event) {
      if (process.env.NODE_ENV === 'development') {
        return null;
      }
      return event;
    },
  });
}
