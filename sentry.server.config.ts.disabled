/**
 * Sentry Server Configuration
 *
 * This file configures Sentry error tracking for the server (Node.js).
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

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Debug mode (only in development)
    debug: process.env.NODE_ENV === 'development',

    // Filter out common non-actionable errors
    ignoreErrors: [
      // Database connection issues (handled by retry logic)
      'Connection terminated unexpectedly',
      // Rate limiting
      'Too Many Requests',
      // Expected errors
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
    ],

    // Before sending the event
    beforeSend(event, hint) {
      // Don't send events in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Sentry server event (dev):', event);
        return null;
      }

      // Add extra context
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'code' in error) {
        event.tags = {
          ...event.tags,
          errorCode: String(error.code),
        };
      }

      return event;
    },

    // Integrations
    integrations: [
      // Capture unhandled promise rejections
      Sentry.captureConsoleIntegration({
        levels: ['error'],
      }),
    ],
  });
}
