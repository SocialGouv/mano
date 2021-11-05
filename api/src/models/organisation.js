const { DataTypes, Model, Sequelize } = require("sequelize");
const sequelize = require("../db/sequelize");

class Organisation extends Model {}

Organisation.init(
  {
    _id: { type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4, primaryKey: true },
    name: DataTypes.TEXT,
    categories: DataTypes.ARRAY(DataTypes.TEXT),
    collaborations: { type: [DataTypes.ARRAY(DataTypes.TEXT)], defaultValue: [] },
    encryptionEnabled: { type: DataTypes.BOOLEAN },
    encryptionLastUpdateAt: DataTypes.DATE,
    encryptedVerificationKey: DataTypes.TEXT,
    receptionEnabled: { type: DataTypes.BOOLEAN },
    services: DataTypes.ARRAY(DataTypes.TEXT),
    customFieldsObs: DataTypes.JSONB,
  },
  { sequelize, modelName: "Organisation", freezeTableName: true }
);

module.exports = Organisation;
