const { Sequelize } = require("sequelize");
const process = require("process");
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/config.js")[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

db.Action = require("../models/action")(sequelize, Sequelize);
db.Comment = require("../models/comment")(sequelize, Sequelize);
db.Consultation = require("../models/consultation")(sequelize, Sequelize);
db.Group = require("../models/group")(sequelize, Sequelize);
db.MedicalFile = require("../models/medicalFile")(sequelize, Sequelize);
db.Organisation = require("../models/organisation")(sequelize, Sequelize);
db.Passage = require("../models/passage")(sequelize, Sequelize);
db.Person = require("../models/person")(sequelize, Sequelize);
db.Place = require("../models/place")(sequelize, Sequelize);
db.RelPersonPlace = require("../models/relPersonPlace")(sequelize, Sequelize);
db.RelUserTeam = require("../models/relUserTeam")(sequelize, Sequelize);
db.Rencontre = require("../models/rencontre")(sequelize, Sequelize);
db.Report = require("../models/report")(sequelize, Sequelize);
db.Service = require("../models/service")(sequelize, Sequelize);
db.Structure = require("../models/structure")(sequelize, Sequelize);
db.Team = require("../models/team")(sequelize, Sequelize);
db.Territory = require("../models/territory")(sequelize, Sequelize);
db.TerritoryObservation = require("../models/territoryObservation")(sequelize, Sequelize);
db.Treatment = require("../models/treatment")(sequelize, Sequelize);
db.User = require("../models/user")(sequelize, Sequelize);
db.UserLog = require("../models/userLog")(sequelize, Sequelize);

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
