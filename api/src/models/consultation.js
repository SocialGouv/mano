const { DataTypes, Model, Sequelize, Deferrable } = require("sequelize");
const sequelize = require("../db/sequelize");

class Consultation extends Model {}

const schema = {
  _id: { type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4, primaryKey: true },

  organisation: { type: DataTypes.UUID, references: { model: "Organisation", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
  person: { type: DataTypes.UUID, references: { model: "Person", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
  user: { type: DataTypes.UUID, references: { model: "User", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },

  status: DataTypes.TEXT,
  dueAt: DataTypes.DATE,
  completedAt: DataTypes.DATE,

  onlyVisibleBy: [{ type: DataTypes.UUID, references: { model: "User", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } }],

  encrypted: { type: DataTypes.TEXT },
  encryptedEntityKey: { type: DataTypes.TEXT },
};

Consultation.init(schema, { sequelize, modelName: "Consultation", freezeTableName: true, timestamps: true, paranoid: true });

module.exports = Consultation;
