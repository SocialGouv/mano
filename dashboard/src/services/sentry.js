import * as Sentry from '@sentry/react';

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
