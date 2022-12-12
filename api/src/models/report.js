const { DataTypes, Model, Sequelize, Deferrable } = require("sequelize");
const sequelize = require("../db/sequelize");

class Report extends Model {}

const schema = {
  _id: { type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4, primaryKey: true },
  organisation: { type: DataTypes.UUID, references: { model: "Organisation", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
  date: { type: DataTypes.TEXT },
  team: { type: DataTypes.UUID, references: { model: "Team", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
  debug: { type: DataTypes.JSONB },
  encrypted: { type: DataTypes.TEXT },
  encryptedEntityKey: { type: DataTypes.TEXT },
};

Report.init(schema, { sequelize, modelName: "Report", freezeTableName: true, timestamps: true, paranoid: true });

module.exports = Report;
