const Sentry = require("@sentry/node");

if (process.env.NODE_ENV !== "development") {
  Sentry.init({
    dsn: `${process.env.SENTRY_KEY}`,
    environment: `api-${process.env.NODE_ENV}`,
  });
}

function capture(err) {
  console.log("capture message", err);
  if (Sentry && err) {
    if (typeof err === "string") {
      Sentry.captureMessage(err);
    } else {
      Sentry.captureException(err);
    }
  }
}

module.exports = { capture };
