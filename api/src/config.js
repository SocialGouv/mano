const PG_CONNECTION_STRING = process.env.PG_CONNECTION_STRING;
const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET || "not_so_secret";
const ENVIRONMENT = process.env.NODE_ENV;
const ADMIN_URL = "http://localhost:8083";

module.exports = { PORT, PG_CONNECTION_STRING, ENVIRONMENT, SECRET, ADMIN_URL };
