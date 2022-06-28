const { version, mobileAppVersion } = require("../package.json");
const crypto = require("crypto");

const { publicKey: CHECK_ENCRYPTION_KEY_PUBLIC_KEY, privateKey: CHECK_ENCRYPTION_KEY_PRIVATE_KEY } = crypto.generateKeyPairSync("rsa", {
  // The standard secure default length for RSA keys is 2048 bits
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "pkcs1",
    format: "pem",
  },
});

const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET || "not_so_secret_4";
const ENCRYPTION_TOKEN_SECRET = process.env.ENCRYPTION_TOKEN_SECRET || "not_so_secret_6";
const ENVIRONMENT = process.env.NODE_ENV || "development";

const PGHOST = process.env.PGHOST;
const PGPORT = process.env.PGPORT;
const PGUSER = process.env.PGUSER;
const VERSION = version;
const MOBILE_APP_VERSION = mobileAppVersion;
const PGPASSWORD = process.env.PGPASSWORD || null;
const SENTRY_KEY = process.env.SENTRY_KEY || "https://e3eb487403dd4789b47cf6da857bb4bf@sentry.fabrique.social.gouv.fr/52";
const PGDATABASE = process.env.PGDATABASE;
const STORAGE_DIRECTORY = process.env.STORAGE_DIRECTORY;

const X_TIPIMAIL_APIUSER = process.env.X_TIPIMAIL_APIUSER || "";
const X_TIPIMAIL_APIKEY = process.env.X_TIPIMAIL_APIKEY || "";

module.exports = {
  PORT,
  ENVIRONMENT,
  SECRET,
  ENCRYPTION_TOKEN_SECRET,
  CHECK_ENCRYPTION_KEY_PRIVATE_KEY,
  CHECK_ENCRYPTION_KEY_PUBLIC_KEY,
  PGHOST,
  PGPORT,
  PGUSER,
  PGPASSWORD,
  PGDATABASE,
  SENTRY_KEY,
  VERSION,
  MOBILE_APP_VERSION,
  X_TIPIMAIL_APIUSER,
  X_TIPIMAIL_APIKEY,
  STORAGE_DIRECTORY,
};
