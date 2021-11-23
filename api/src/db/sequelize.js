const { Sequelize } = require("sequelize");

const config = require("../config");
const { capture } = require("../sentry");

console.log(config.PGDATABASE, config.PGUSER, config.PGPASSWORD);

const sequelizeConfig = {
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

if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
  sequelizeConfig.port = config.PGPORT;
  sequelizeConfig.dialectOptions = {
    ssl: {
      require: process.env.NODE_ENV !== "development",
      rejectUnauthorized: process.env.NODE_ENV !== "development",
    },
  };
}

const sequelize = new Sequelize(config.PGDATABASE, config.PGUSER, config.PGPASSWORD, sequelizeConfig);

sequelize
  .authenticate()
  .then(() => {
    require("./migrations");
    require("./migration");
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });

module.exports = sequelize;
