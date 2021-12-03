import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';
// or use es6 import statements
// import * as Sentry from '@sentry/node';
const { ENV, VERSION } = require('../config');
// or use es6 import statements
// import * as Tracing from '@sentry/tracing';

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
    ignoreErrors: ['Network request failed', 'Failed to fetch', 'NetworkError', 'withrealtime/messaging'],
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
