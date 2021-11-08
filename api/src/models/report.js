const { DataTypes, Model, Sequelize, Deferrable } = require("sequelize");
const { ENCRYPTED_FIELDS_ONLY } = require("../config");
const sequelize = require("../db/sequelize");

class Report extends Model {}

const schema = {
  _id: { type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4, primaryKey: true },
  organisation: { type: DataTypes.UUID, references: { model: "Organisation", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },

  encrypted: { type: DataTypes.TEXT },
  encryptedEntityKey: { type: DataTypes.TEXT },
};

if (!ENCRYPTED_FIELDS_ONLY) {
  schema.date = DataTypes.DATE;
  schema.team = { type: DataTypes.UUID, references: { model: "Team", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } };
  schema.description = DataTypes.TEXT;
  schema.collaborations = { type: [DataTypes.ARRAY(DataTypes.TEXT)], defaultValue: [] };
  schema.services = DataTypes.TEXT;
  schema.passages = DataTypes.INTEGER;
}

Report.init(schema, { sequelize, modelName: "Report", freezeTableName: true });

module.exports = Report;
