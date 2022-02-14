// this file create the Schema and define foreign keys
const { DataTypes } = require("sequelize");
const Organisation = require("../models/organisation");
const Team = require("../models/team");
const Person = require("../models/person");
const Report = require("../models/report");
const User = require("../models/user");
const Place = require("../models/place");
const RelPersonPlace = require("../models/relPersonPlace");
const RelUserTeam = require("../models/relUserTeam");
const Structure = require("../models/structure");
const Action = require("../models/action");
const Comment = require("../models/comment");
const Territory = require("../models/territory");
const TerritoryObservation = require("../models/territoryObservation");

const generateForeignKey = (key) => ({ foreignKey: { type: DataTypes.UUID, name: key, field: key } });

const organisationForeignKey = generateForeignKey("organisation");
const teamForeignKey = generateForeignKey("team");
const userForeignKey = generateForeignKey("user");
const personForeignKey = generateForeignKey("person");
const placeForeignKey = generateForeignKey("place");
const structureForeignKey = generateForeignKey("structure");
const territoryForeignKey = generateForeignKey("territory");

// Team
Team.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Team, organisationForeignKey);

// User
User.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(User, organisationForeignKey);
User.belongsToMany(Team, { ...userForeignKey, through: RelUserTeam });
Team.belongsToMany(User, { ...teamForeignKey, through: RelUserTeam });

// Territory
Territory.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Territory, organisationForeignKey);

// TerritoryObservation
TerritoryObservation.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(TerritoryObservation, organisationForeignKey);

// Place
Place.belongsToMany(Person, { ...placeForeignKey, through: RelPersonPlace });
Person.belongsToMany(Place, { ...personForeignKey, through: RelPersonPlace });
Place.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Place, organisationForeignKey);
RelPersonPlace.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(RelPersonPlace, organisationForeignKey);

// Structure
Structure.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Structure, organisationForeignKey);

// Report
Report.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Report, organisationForeignKey);

// Comment
Comment.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Comment, organisationForeignKey);

// Action
Action.belongsTo(Structure, structureForeignKey);
Structure.hasMany(Action, structureForeignKey);
Action.belongsTo(Team, teamForeignKey);
Team.hasMany(Action, teamForeignKey);
Action.belongsTo(User, userForeignKey);
User.hasMany(Action, userForeignKey);
Action.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Action, organisationForeignKey);
