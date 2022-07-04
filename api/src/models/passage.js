const { DataTypes, Model, Sequelize, Deferrable } = require("sequelize");
const sequelize = require("../db/sequelize");

class Passage extends Model {}

const schema = {
  _id: { type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4, primaryKey: true },

  organisation: { type: DataTypes.UUID, references: { model: "Organisation", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
  person: { type: DataTypes.UUID, references: { model: "Person", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
  user: { type: DataTypes.UUID, references: { model: "User", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
  team: { type: DataTypes.UUID, references: { model: "Team", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },

  encrypted: { type: DataTypes.TEXT },
  encryptedEntityKey: { type: DataTypes.TEXT },
};

Passage.init(schema, { sequelize, modelName: "Passage", freezeTableName: true, timestamps: true, paranoid: true });

module.exports = Passage;
