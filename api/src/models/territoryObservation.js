const { DataTypes, Model, Sequelize, Deferrable } = require("sequelize");
const { ENCRYPTED_FIELDS_ONLY } = require("../config");
const sequelize = require("../db/sequelize");

// Territoires visités par la maraude

class TerritoryObservation extends Model {}

const schema = {
  _id: { type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4, primaryKey: true },
  organisation: { type: DataTypes.UUID, references: { model: "Organisation", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },

  encrypted: { type: DataTypes.TEXT },
  encryptedEntityKey: { type: DataTypes.TEXT },
};

if (!ENCRYPTED_FIELDS_ONLY) {
  schema.territory = { type: DataTypes.UUID, references: { model: "Territory", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } };
  schema.team = { type: DataTypes.UUID, references: { model: "Team", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } };
  schema.user = { type: DataTypes.UUID, references: { model: "User", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } };
  schema.persons = DataTypes.TEXT;
  schema.personsMale = DataTypes.TEXT;
  schema.personsFemale = DataTypes.TEXT;
  schema.police = DataTypes.TEXT;
  schema.material = DataTypes.TEXT;
  schema.atmosphere = DataTypes.TEXT;
  schema.mediation = DataTypes.TEXT;
  schema.comment = DataTypes.TEXT;
}

TerritoryObservation.init(schema, { sequelize, modelName: "TerritoryObservation", freezeTableName: true });

module.exports = TerritoryObservation;
