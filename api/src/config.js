const { version } = require("../package.json");

const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET || "not_so_secret_4";
const ENVIRONMENT = process.env.NODE_ENV || "development";

const PGHOST = process.env.PGHOST;
const PGPORT = process.env.PGPORT;
const PGUSER = process.env.PGUSER;
const VERSION = version;
const PGPASSWORD = process.env.PGPASSWORD || null;
const SENTRY_KEY = process.env.SENTRY_KEY || "https://e3eb487403dd4789b47cf6da857bb4bf@sentry.fabrique.social.gouv.fr/52";
const PGDATABASE = process.env.PGDATABASE;
const DASHBOARD_URL = ENVIRONMENT === "development" ? "http://localhost:4145" : "https://dashboard-mano.fabrique.social.gouv.fr";
const DASHBOARD_PREPROD_URL = ENVIRONMENT === "development" ? "http://localhost:8083" : "https://dashboard-preprod-mano.dev.fabrique.social.gouv.fr";
const WEBSITE_URL = ENVIRONMENT === "development" ? "http://localhost:3000" : "https://mano-app.fabrique.social.gouv.fr";
const WEBSITE_PREPROD_URL = ENVIRONMENT === "development" ? "http://localhost:3000" : "https://app-preprod-mano.dev.fabrique.social.gouv.fr/";
const DASHBBOARD_DOMAIN = `/\.fabrique\.social\.gouv\.fr$/`;
const DASHBBOARD_PREPROD_DOMAIN = `/\.dev\.fabrique\.social\.gouv\.fr$/`;

const X_TIPIMAIL_APIUSER = process.env.X_TIPIMAIL_APIUSER || "";
const X_TIPIMAIL_APIKEY = process.env.X_TIPIMAIL_APIKEY || "";

const ENCRYPTED_FIELDS_ONLY = process.env.ENCRYPTED_FIELDS_ONLY === "true" ? true : false;

const CORS_ORIGIN_ALLOWED = [DASHBBOARD_DOMAIN, DASHBBOARD_PREPROD_DOMAIN, WEBSITE_URL, DASHBOARD_PREPROD_URL, DASHBOARD_URL, WEBSITE_PREPROD_URL];

module.exports = {
  PORT,
  ENVIRONMENT,
  SECRET,
  CORS_ORIGIN_ALLOWED,
  PGHOST,
  PGPORT,
  PGUSER,
  PGPASSWORD,
  PGDATABASE,
  SENTRY_KEY,
  VERSION,
  ENCRYPTED_FIELDS_ONLY,
  X_TIPIMAIL_APIUSER,
  X_TIPIMAIL_APIKEY,
};
