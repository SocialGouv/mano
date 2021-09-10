const { Pool } = require("pg");

const sync = async () => {
  console.log("Initialising database");

  require("./relation");

  const { sequelize } = require("../sequelize");

  console.log("ENV", process.env.PGHOST);

  console.log("Database initialised");

  // process.exit(0);
};

// sync();
