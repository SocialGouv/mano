const { DataTypes, Model, Sequelize, Deferrable } = require("sequelize");
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

Action.init(schema, { sequelize, modelName: "Action", freezeTableName: true, timestamps: true, paranoid: true });

module.exports = Action;
