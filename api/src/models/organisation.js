const { DataTypes, Model, Sequelize } = require("sequelize");
const sequelize = require("../db/sequelize");

class Organisation extends Model {}

Organisation.init(
  {
    _id: { type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4, primaryKey: true },
    name: DataTypes.TEXT,

    categories: DataTypes.ARRAY(DataTypes.TEXT),
    actionsGroupedCategories: {
      type: DataTypes.JSONB,
      // example: [{"groupTitle": "médical", categories: ["seringue", "pansement"]}, { "groupTitle": "local", "categories": ["entretien", "lavage"]}]
    },
    collaborations: { type: [DataTypes.ARRAY(DataTypes.TEXT)], defaultValue: [] },
    consultations: DataTypes.JSONB,
    encryptionEnabled: { type: DataTypes.BOOLEAN },
    encryptionLastUpdateAt: DataTypes.DATE,
    encryptedVerificationKey: DataTypes.TEXT,
    encrypting: { type: DataTypes.BOOLEAN, default: false },
    receptionEnabled: { type: DataTypes.BOOLEAN },
    groupedServices: {
      type: DataTypes.JSONB,
      // example: [{"groupTitle": "injection", categories: ["Garrot", "1cc"]}, { "groupTitle": "inhalation", "categories": ["Kit base", "Grille"]}]
    },
    services: DataTypes.ARRAY(DataTypes.TEXT),
    customFieldsObs: DataTypes.JSONB,
    fieldsPersonsCustomizableOptions: DataTypes.JSONB,
    customFieldsPersonsSocial: DataTypes.JSONB,
    customFieldsPersonsMedical: DataTypes.JSONB,
    customFieldsMedicalFile: DataTypes.JSONB,
    migrating: { type: DataTypes.BOOLEAN, default: false },
    migrations: DataTypes.ARRAY(DataTypes.TEXT),
    migrationLastUpdateAt: DataTypes.DATE,
  },
  { sequelize, modelName: "Organisation", freezeTableName: true }
);

module.exports = Organisation;
