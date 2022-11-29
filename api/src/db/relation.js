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
const Consultation = require("../models/consultation");
const Treatment = require("../models/treatment");
const MedicalFile = require("../models/medicalFile");
const Comment = require("../models/comment");
const Passage = require("../models/passage");
const Rencontre = require("../models/rencontre");
const Territory = require("../models/territory");
const TerritoryObservation = require("../models/territoryObservation");

const generateForeignKey = (key) => ({ foreignKey: { type: DataTypes.UUID, name: key, field: key } });

const organisationForeignKey = generateForeignKey("organisation");
const teamForeignKey = generateForeignKey("team");
const userForeignKey = generateForeignKey("user");

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
Report.belongsTo(Team, teamForeignKey);
Team.hasMany(Report, teamForeignKey);

// Comment
Comment.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Comment, organisationForeignKey);

// Passage
Passage.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Passage, organisationForeignKey);

// Rencontre
Rencontre.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Rencontre, organisationForeignKey);

// Action
Action.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Action, organisationForeignKey);

// Consultation
Consultation.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Consultation, organisationForeignKey);

// Treatment
Treatment.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Treatment, organisationForeignKey);

// MedicalFile
MedicalFile.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(MedicalFile, organisationForeignKey);
