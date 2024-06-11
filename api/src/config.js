const fs = require("fs");
const { mobileAppVersion } = require("../package.json");

const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET || "not_so_secret_4";
const ENVIRONMENT = process.env.NODE_ENV || "development";
const VERSION = process.env.SHA || "0.0.0";

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

const MOBILE_APP_VERSION = mobileAppVersion;

const STORAGE_DIRECTORY = process.env.STORAGE_DIRECTORY;

module.exports = {
  PORT,
  VERSION,
  ENVIRONMENT,
  SECRET,
  PGHOST,
  PGPORT,
  PGUSER,
  PGPASSWORD,
  PGDATABASE,
  DEPLOY_KEY,
  MOBILE_APP_VERSION,
  STORAGE_DIRECTORY,
};
