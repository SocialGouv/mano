// this file create the Schema and define foreign keys
const { DataTypes } = require("sequelize");
const Organisation = require("../models/organisation");
const Team = require("../models/team");
const Report = require("../models/report");
const User = require("../models/user");
const Place = require("../models/place");
const RelPersonPlace = require("../models/relPersonPlace");
const RelUserTeam = require("../models/relUserTeam");
const Structure = require("../models/structure");
const Action = require("../models/action");
const Person = require("../models/person");
const Consultation = require("../models/consultation");
const Treatment = require("../models/treatment");
const MedicalFile = require("../models/medicalFile");
const Comment = require("../models/comment");
const Passage = require("../models/passage");
const Territory = require("../models/territory");
const TerritoryObservation = require("../models/territoryObservation");

const generateForeignKey = (key) => ({ foreignKey: { type: DataTypes.UUID, name: key, field: key } });

const organisationForeignKey = generateForeignKey("organisation");
const teamForeignKey = generateForeignKey("team");
const userForeignKey = generateForeignKey("user");
const personForeignKey = generateForeignKey("person");
const actionForeignKey = generateForeignKey("action");
const territoryForeignKey = generateForeignKey("territory");
const placeForeignKey = generateForeignKey("place");

// Team
Team.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Team, organisationForeignKey);

// User
User.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(User, organisationForeignKey);
User.belongsToMany(Team, { ...userForeignKey, through: RelUserTeam });
Team.belongsToMany(User, { ...teamForeignKey, through: RelUserTeam });

// Person
Person.belongsTo(User, userForeignKey);
User.hasMany(Person, userForeignKey);

// Territory
Territory.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Territory, organisationForeignKey);
Territory.belongsTo(User, userForeignKey);
User.hasMany(Territory, userForeignKey);

// TerritoryObservation
TerritoryObservation.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(TerritoryObservation, organisationForeignKey);
TerritoryObservation.belongsTo(Territory, territoryForeignKey);
Territory.hasMany(TerritoryObservation, territoryForeignKey);
TerritoryObservation.belongsTo(User, userForeignKey);
User.hasMany(TerritoryObservation, userForeignKey);
TerritoryObservation.belongsTo(Team, teamForeignKey);
Team.hasMany(TerritoryObservation, teamForeignKey);

// Place
Place.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Place, organisationForeignKey);
Place.belongsTo(User, userForeignKey);
User.hasMany(Place, userForeignKey);

RelPersonPlace.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(RelPersonPlace, organisationForeignKey);
RelPersonPlace.hasOne(Place, placeForeignKey);
RelPersonPlace.hasOne(Person, personForeignKey);

// Structure
Structure.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Structure, organisationForeignKey);

// Report
Report.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Report, organisationForeignKey);
Report.belongsTo(Team, teamForeignKey);
Team.hasMany(Report, teamForeignKey);

// Comment
Comment.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Comment, organisationForeignKey);
Comment.belongsTo(Person, personForeignKey);
Person.hasMany(Comment, personForeignKey);
Comment.belongsTo(Action, actionForeignKey);
Action.hasMany(Comment, actionForeignKey);
Comment.belongsTo(User, userForeignKey);
User.hasMany(Comment, userForeignKey);
Comment.belongsTo(Team, teamForeignKey);
Team.hasMany(Comment, teamForeignKey);

// Passage
Passage.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Passage, organisationForeignKey);
Passage.belongsTo(Person, personForeignKey);
Person.hasMany(Passage, personForeignKey);
Passage.belongsTo(User, userForeignKey);
User.hasMany(Passage, userForeignKey);
Passage.belongsTo(Team, teamForeignKey);
Team.hasMany(Passage, teamForeignKey);

// Action
Action.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Action, organisationForeignKey);
Action.belongsTo(Person, personForeignKey);
Person.hasMany(Action, personForeignKey);
Action.belongsTo(Team, teamForeignKey);
Team.hasMany(Action, teamForeignKey);
Action.belongsTo(User, userForeignKey);
User.hasMany(Action, userForeignKey);

// Consultation
Consultation.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Consultation, organisationForeignKey);
Consultation.belongsTo(Person, personForeignKey);
Person.hasMany(Consultation, personForeignKey);
Consultation.belongsTo(User, userForeignKey);
User.hasMany(Consultation, userForeignKey);

// Treatment
Treatment.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Treatment, organisationForeignKey);
Treatment.belongsTo(Person, personForeignKey);
Person.hasMany(Treatment, personForeignKey);
Treatment.belongsTo(User, userForeignKey);
User.hasMany(Treatment, userForeignKey);

// MedicalFile
MedicalFile.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(MedicalFile, organisationForeignKey);
MedicalFile.belongsTo(Person, personForeignKey);
Person.hasMany(MedicalFile, personForeignKey);
