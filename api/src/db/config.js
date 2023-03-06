require("dotenv").config({ path: "./.env" });
const config = require("../config");

const defaultConfig = {
  username: config.PGUSER,
  password: config.PGPASSWORD,
  database: config.PGDATABASE,
  port: config.PGPORT,
  host: config.PGHOST,
  dialect: "postgres",
  schema: "mano",
  timezone: "Europe/Paris",
  logging: false,
  define: {
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  },
};

module.exports = {
  development: {
    ...defaultConfig,
  },
  test: {
    ...defaultConfig,
  },
  production: {
    ...defaultConfig,
    dialectOptions: {
      ssl: {
        require: process.env.NODE_ENV !== "development",
        rejectUnauthorized: process.env.NODE_ENV !== "development",
      },
    },
  },
};
