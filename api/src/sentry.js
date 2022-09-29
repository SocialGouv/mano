const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");
const { VERSION, ENVIRONMENT } = require("./config");

const sentryEnabled = ENVIRONMENT !== "development" && ENVIRONMENT !== "test" && process.env.MANO_API_IS_PRODUCTION === "true";

const SentryInit = (app) => {
  if (!sentryEnabled) return;
  Sentry.init({
    dsn: "https://e3eb487403dd4789b47cf6da857bb4bf@sentry.fabrique.social.gouv.fr/52",
    environment: `api-${ENVIRONMENT}`,
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // enable Express.js middleware tracing
      new Tracing.Integrations.Express({ app }),
    ],
    release: VERSION,
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });
};

function capture(err, context = {}) {
  if (!sentryEnabled) {
    console.log("capture", err, JSON.stringify(context));
    return;
  }

  if (typeof context === "string") {
    context = JSON.parse(context);
  } else {
    context = JSON.parse(JSON.stringify(context));
  }
  if (!!context.extra && typeof context.extra !== "string") {
    try {
      const newExtra = {};
      for (const [extraKey, extraValue] of Object.entries(context.extra)) {
        if (typeof extraValue === "string") {
          newExtra[extraKey] = extraValue;
        } else {
          if (extraValue?.password) {
            extraValue.password = "******";
          }
          newExtra[extraKey] = JSON.stringify(extraValue);
        }
      }
      context.extra = newExtra;
    } catch (e) {
      Sentry.captureMessage(e, context);
    }
  }

  if (typeof err === "string") {
    Sentry.captureMessage(err, context);
  } else {
    Sentry.captureException(err, context);
  }
}

module.exports = { capture, SentryInit };
