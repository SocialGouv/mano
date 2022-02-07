import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';
const { ENV, VERSION } = require('../config');

if (ENV === 'production') {
  Sentry.init({
    dsn: 'https://d5bde308505f4860b199e7031dcd17d6@o348403.ingest.sentry.io/5384501',
    environment: 'dashboard',
    release: VERSION,
    integrations: [new Integrations.BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
    ignoreErrors: [
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
      // ???
      'withrealtime/messaging',
      // This error seems to happen only in firefox and to be ignorable.
      // The "fetch" failed because user has navigated.
      // Since other browsers don't have this problem, we don't care about it,
      // it may be a false positive.
      'AbortError: The operation was aborted',
    ],
  });
}

export const capture = (err, context = {}) => {
  console.log('capture', err, context);
  if (typeof context === 'string') {
    context = JSON.parse(context);
  } else {
    context = JSON.parse(JSON.stringify(context));
  }
  if (context?.extra?.response?.status === 401) return;
  if (!!context.extra && typeof context.extra !== 'string') {
    try {
      const newExtra = {};
      for (let extraKey of Object.keys(context.extra)) {
        if (typeof context.extra[extraKey] === 'string') {
          newExtra[extraKey] = context.extra[extraKey];
        } else {
          newExtra[extraKey] = JSON.stringify(context.extra[extraKey]);
        }
      }
      context.extra = newExtra;
    } catch (e) {
      Sentry.captureMessage(e, context);
    }
  }
  if (Sentry && err) {
    if (typeof err === 'string') {
      Sentry.captureMessage(err, context);
    } else {
      Sentry.captureException(err, context);
    }
  } else {
    console.log('capture', err, JSON.stringify(context));
  }
};

export const AppSentry = Sentry;
