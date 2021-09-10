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
const RelPersonTeam = require("../models/relPersonTeam");
const { ENCRYPTED_FIELDS_ONLY } = require("../config");

const generateForeignKey = (key) => ({ foreignKey: { type: DataTypes.UUID, name: key, field: key } });

const organisationForeignKey = generateForeignKey("organisation");
const teamForeignKey = generateForeignKey("team");
const userForeignKey = generateForeignKey("user");
const actionForeignKey = generateForeignKey("action");
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

// Person
if (!ENCRYPTED_FIELDS_ONLY) {
  Person.belongsTo(User, userForeignKey);
  User.hasMany(Person, userForeignKey);
  Person.belongsToMany(Team, { ...personForeignKey, through: RelPersonTeam });
  Team.belongsToMany(Person, { ...teamForeignKey, through: RelPersonTeam });
}

// Territory
if (!ENCRYPTED_FIELDS_ONLY) {
  Territory.belongsTo(User, userForeignKey);
  User.hasMany(Territory, userForeignKey);
}
Territory.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Territory, organisationForeignKey);

// TerritoryObservation
if (!ENCRYPTED_FIELDS_ONLY) {
  TerritoryObservation.belongsTo(Territory, territoryForeignKey);
  Territory.hasMany(TerritoryObservation, territoryForeignKey);
  TerritoryObservation.belongsTo(User, userForeignKey);
  User.hasMany(TerritoryObservation, userForeignKey);
  TerritoryObservation.belongsTo(Team, teamForeignKey);
  Team.hasMany(TerritoryObservation, teamForeignKey);
}
TerritoryObservation.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(TerritoryObservation, organisationForeignKey);

// Place
if (!ENCRYPTED_FIELDS_ONLY) {
  Place.belongsTo(User, userForeignKey);
  User.hasMany(Place, userForeignKey);
  Place.belongsToMany(Person, { ...placeForeignKey, through: RelPersonPlace });
  Person.belongsToMany(Place, { ...personForeignKey, through: RelPersonPlace });
}
Place.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Place, organisationForeignKey);
RelPersonPlace.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(RelPersonPlace, organisationForeignKey);

// Structure
Structure.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Structure, organisationForeignKey);

// Report
if (!ENCRYPTED_FIELDS_ONLY) {
  Report.belongsTo(Team, teamForeignKey);
  Team.hasMany(Report, teamForeignKey);
}
Report.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Report, organisationForeignKey);

// Comment
if (!ENCRYPTED_FIELDS_ONLY) {
  Comment.belongsTo(User, userForeignKey);
  User.hasMany(Comment, userForeignKey);
  Comment.belongsTo(Action, actionForeignKey);
  Action.hasMany(Comment, actionForeignKey);
  Comment.belongsTo(Person, personForeignKey);
  Person.hasMany(Comment, personForeignKey);
  Comment.belongsTo(Team, teamForeignKey);
  Team.hasMany(Comment, teamForeignKey);
}
Comment.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Comment, organisationForeignKey);

// Action
if (!ENCRYPTED_FIELDS_ONLY) {
  Action.belongsTo(Person, personForeignKey);
  Person.hasMany(Action, personForeignKey);

  Action.belongsTo(Structure, structureForeignKey);
  Structure.hasMany(Action, structureForeignKey);

  Action.belongsTo(Team, teamForeignKey);
  Team.hasMany(Action, teamForeignKey);

  Action.belongsTo(User, userForeignKey);
  User.hasMany(Action, userForeignKey);
}

Action.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Action, organisationForeignKey);
