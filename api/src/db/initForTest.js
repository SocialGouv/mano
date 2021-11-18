/// const { Pool } = require("pg");
const { Sequelize } = require("sequelize");

const sync = async () => {
  console.log("Initialising database");
  console.log("ENV", process.env.PGHOST);

  const sequelize = new Sequelize("postgresql://localhost:5432/manoteeest");
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }

  require("./relation");

  sequelize.sync({ force: true });

  console.log("Database initialised");

  // process.exit(0);
};

sync();
