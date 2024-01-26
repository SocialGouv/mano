const fs = require("fs");
const { version, mobileAppVersion } = require("../package.json");

const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET || "not_so_secret_4";
const ENVIRONMENT = process.env.NODE_ENV || "development";

const PGHOST = process.env.PGHOST;
const PGPORT = process.env.PGPORT;
let PGDATABASE = null;
if (process.env.PGDATABASE_FILE && fs.existsSync(process.env.PGDATABASE_FILE)) {
  PGDATABASE = fs.readFileSync(process.env.PGDATABASE_FILE, "utf8").trim().replace(/\n/g, "");
} else {
  PGDATABASE = process.env.PGDATABASE;
}
let PGUSER = null;
if (process.env.PGUSER_FILE && fs.existsSync(process.env.PGUSER_FILE)) {
  PGUSER = fs.readFileSync(process.env.PGUSER_FILE, "utf8").trim().replace(/\n/g, "");
} else {
  PGUSER = process.env.PGUSER;
}
let PGPASSWORD = null;
if (process.env.PGPASSWORD_FILE && fs.existsSync(process.env.PGPASSWORD_FILE)) {
  PGPASSWORD = fs.readFileSync(process.env.PGPASSWORD_FILE, "utf8").trim().replace(/\n/g, "") || null;
} else {
  PGPASSWORD = process.env.PGPASSWORD || null;
}
let DEPLOY_KEY = null;
if (process.env.DEPLOY_KEY_FILE && fs.existsSync(process.env.DEPLOY_KEY_FILE)) {
  DEPLOY_KEY = fs.readFileSync(process.env.DEPLOY_KEY_FILE, "utf8").trim().replace(/\n/g, "") || null;
} else {
  DEPLOY_KEY = process.env.DEPLOY_KEY || null;
}
const VERSION = version;
const MOBILE_APP_VERSION = mobileAppVersion;
const SENTRY_KEY = process.env.SENTRY_KEY || "https://e3eb487403dd4789b47cf6da857bb4bf@sentry.fabrique.social.gouv.fr/52";

const STORAGE_DIRECTORY = process.env.STORAGE_DIRECTORY;

const X_TIPIMAIL_APIUSER = process.env.X_TIPIMAIL_APIUSER || "";
const X_TIPIMAIL_APIKEY = process.env.X_TIPIMAIL_APIKEY || "";

const MINIMUM_DASHBOARD_VERSION = "1.261.10";

module.exports = {
  PORT,
  ENVIRONMENT,
  SECRET,
  PGHOST,
  PGPORT,
  PGUSER,
  PGPASSWORD,
  PGDATABASE,
  DEPLOY_KEY,
  SENTRY_KEY,
  VERSION,
  MOBILE_APP_VERSION,
  X_TIPIMAIL_APIUSER,
  X_TIPIMAIL_APIKEY,
  STORAGE_DIRECTORY,
  MINIMUM_DASHBOARD_VERSION,
};
