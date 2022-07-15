import * as Sentry from '@sentry/react-native';

// https://docs.sentry.io/platforms/javascript/enriching-events/context/#example-usages

export const capture = (err, context = {}) => {
  console.log('capture', err, JSON.stringify(context, null, 2));

  if (typeof context === 'string') {
    context = JSON.parse(context);
  } else {
    context = JSON.parse(JSON.stringify(context));
  }
  if (context?.extra?.response?.status === 401) return;

  if (context?.extra?.body?.password) {
    context.extra.body.password = '******';
  }
  if (Sentry && err) {
    if (typeof err === 'string') {
      Sentry.captureMessage(err, context);
    } else {
      Sentry.captureException(err, context);
    }
  }
};

export const AppSentry = Sentry;
