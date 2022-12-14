const { DataTypes, Model, Sequelize } = require("sequelize");
const sequelize = require("../db/sequelize");

class Organisation extends Model {}

Organisation.init(
  {
    _id: { type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4, primaryKey: true },
    name: DataTypes.TEXT,

    categories: DataTypes.ARRAY(DataTypes.TEXT), // kept for retro-compatiblity only
    actionsGroupedCategories: {
      type: DataTypes.JSONB,
      // example: [{"groupTitle": "médical", categories: ["seringue", "pansement"]}, { "groupTitle": "local", "categories": ["entretien", "lavage"]}]
    },

    collaborations: { type: [DataTypes.ARRAY(DataTypes.TEXT)], defaultValue: [] },

    receptionEnabled: { type: DataTypes.BOOLEAN },
    groupedServices: {
      type: DataTypes.JSONB,
      // example: [{"groupTitle": "injection", categories: ["Garrot", "1cc"]}, { "groupTitle": "inhalation", "categories": ["Kit base", "Grille"]}]
    },
    services: DataTypes.ARRAY(DataTypes.TEXT), // kept for retro-compatiblity only

    groupsEnabled: { type: DataTypes.BOOLEAN },

    encrypting: { type: DataTypes.BOOLEAN, default: false },
    encryptionEnabled: { type: DataTypes.BOOLEAN },
    encryptionLastUpdateAt: DataTypes.DATE,
    encryptedVerificationKey: DataTypes.TEXT,

    migrating: { type: DataTypes.BOOLEAN, default: false },
    migrations: DataTypes.ARRAY(DataTypes.TEXT),
    migrationLastUpdateAt: DataTypes.DATE,

    consultations: DataTypes.JSONB,
    customFieldsObs: DataTypes.JSONB,
    customFieldsPersons: DataTypes.JSONB,
    customFieldsMedicalFile: DataTypes.JSONB,

    fieldsPersonsCustomizableOptions: DataTypes.JSONB, // kept for retro-compatiblity only
    customFieldsPersonsSocial: DataTypes.JSONB, // kept for retro-compatiblity only
    customFieldsPersonsMedical: DataTypes.JSONB, // kept for retro-compatiblity only
  },
  { sequelize, modelName: "Organisation", freezeTableName: true }
);

module.exports = Organisation;
