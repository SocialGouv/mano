const Sentry = require("@sentry/node");
// or use es6 import statements
// import * as Sentry from '@sentry/node';

const Tracing = require("@sentry/tracing");
// or use es6 import statements
// import * as Tracing from '@sentry/tracing';

const { VERSION, ENVIRONMENT } = require("./config");

if (ENVIRONMENT !== "development" && ENVIRONMENT !== "test") {
  Sentry.init({
    dsn: "https://7b294e89e98e4ffdaeeb74102f050567@o548798.ingest.sentry.io/5833236",
    environment: `api-${ENVIRONMENT}`,
    release: VERSION,
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });
}

function capture(err, context = {}) {
  console.log("capture", err, JSON.stringify(context));
  if (typeof context === "string") {
    context = JSON.parse(context);
  } else {
    context = JSON.parse(JSON.stringify(context));
  }
  if (!!context.extra && typeof context.extra !== "string") {
    try {
      const newExtra = {};
      for (let extraKey of Object.keys(context.extra)) {
        if (typeof context.extra[extraKey] === "string") {
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
  if (ENVIRONMENT !== "development" && ENVIRONMENT !== "test") {
    if (typeof err === "string") {
      Sentry.captureMessage(err, context);
    } else {
      Sentry.captureException(err, context);
    }
  } else {
    console.log("capture", err, JSON.stringify(context));
  }
}

module.exports = { capture };
