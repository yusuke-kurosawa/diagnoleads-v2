/**
 * Sentry Client Configuration
 *
 * This file configures Sentry error tracking for the browser.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment and release
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% when error occurs

    // Debug mode (only in development)
    debug: process.env.NODE_ENV === 'development',

    // Filter out common non-actionable errors
    ignoreErrors: [
      // Network errors
      'Network Error',
      'Failed to fetch',
      'Load failed',
      'NetworkError',
      // Browser extensions
      /^chrome-extension:\/\//,
      /^moz-extension:\/\//,
      // Third-party script errors
      'Script error.',
      // User aborted navigation
      'AbortError',
      // React hydration mismatches (usually benign)
      'Hydration failed',
      'There was an error while hydrating',
    ],

    // Before sending the event, you can modify or filter it
    beforeSend(event, hint) {
      // Don't send events in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Sentry event (dev):', event);
        return null;
      }

      // Filter out non-error events
      if (event.level === 'log' || event.level === 'info') {
        return null;
      }

      return event;
    },

    // Integrations
    integrations: [
      Sentry.replayIntegration({
        // Mask all text content for privacy
        maskAllText: false,
        // Block all media for performance
        blockAllMedia: true,
      }),
    ],
  });
}
