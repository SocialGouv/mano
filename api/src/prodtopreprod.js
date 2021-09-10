require("dotenv").config({ path: "./.env" });
const { Sequelize } = require("sequelize");
const faker = require("faker/locale/fr");

const config = require("./config");

const ActionModel = require("./models/action");
const OrganisationModel = require("./models/organisation");
const PersonModel = require("./models/person");
const PlaceModel = require("./models/place");
const StructureModel = require("./models/structure");
const TeamModel = require("./models/team");
const UserModel = require("./models/user");

const sequelize = new Sequelize(config.PGDATABASE, config.PGUSER, config.PGPASSWORD, {
  host: config.PGHOST,
  dialect: "postgres",
  schema: "mano",
  timezone: "Europe/Paris",
  logging: false,
  dialectOptions: { ssl: true },
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (e) {
    console.log("e", e);
  }
})();

async function migrate() {}

sequelize.authenticate().then(async (e) => {

  try {
    await esclient.indices.delete({ index: "application" });
  } catch (error) {
    console.log("ERROR ES", error);
  }
  await Application.deleteMany({});
  await migrate("Application", migrateApplication);
  process.exit(1);
});


