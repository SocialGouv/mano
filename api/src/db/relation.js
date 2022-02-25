// this file create the Schema and define foreign keys
const Organisation = require("../models/organisation");
const Team = require("../models/team");
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

// Comment
Comment.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Comment, organisationForeignKey);

// Action
Action.belongsTo(Organisation, organisationForeignKey);
Organisation.hasMany(Action, organisationForeignKey);
