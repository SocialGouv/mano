const { DataTypes, Model, Sequelize, Deferrable } = require("sequelize");
const { ENCRYPTED_FIELDS_ONLY } = require("../config");
const sequelize = require("../db/sequelize");

class Action extends Model {}

const schema = {
  _id: { type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4, primaryKey: true },

  organisation: { type: DataTypes.UUID, references: { model: "Organisation", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },

  status: DataTypes.TEXT,
  dueAt: DataTypes.DATE,
  completedAt: DataTypes.DATE,

  encrypted: { type: DataTypes.TEXT },
  encryptedEntityKey: { type: DataTypes.TEXT },
};

if (!ENCRYPTED_FIELDS_ONLY) {
  // data to encrypt
  schema.team = { type: DataTypes.UUID, references: { model: "Team", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } };
  schema.user = { type: DataTypes.UUID, references: { model: "User", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } };
  schema.withTime = { type: DataTypes.BOOLEAN, defaultValue: false };
  schema.category = DataTypes.TEXT;
  schema.categories = { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] };
  schema.person = { type: DataTypes.UUID, references: { model: "Person", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } };
  schema.structure = { type: DataTypes.UUID, references: { model: "Structure", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } };
  schema.name = DataTypes.TEXT;
  schema.description = DataTypes.TEXT;
}

Action.init(schema, { sequelize, modelName: "Action", freezeTableName: true });

module.exports = Action;
