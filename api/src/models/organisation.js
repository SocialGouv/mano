const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const schema = {
    _id: { type: DataTypes.UUID, allowNull: false, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: DataTypes.TEXT,
    orgId: DataTypes.TEXT,
    categories: DataTypes.ARRAY(DataTypes.TEXT),
    actionsGroupedCategories: {
      type: DataTypes.JSONB, // example: [{"groupTitle": "médical", categories: ["seringue", "pansement"]}, { "groupTitle": "local", "categories": ["entretien", "lavage"]}]
    },
    structuresGroupedCategories: {
      type: DataTypes.JSONB,
      // example: [{"groupTitle": "lala", categories: ["carud", "mairie"]}, { "groupTitle": "lolo", "categories": ["entretien", "lavage"]}]
    },
    collaborations: { type: [DataTypes.ARRAY(DataTypes.TEXT)], defaultValue: [] },
    consultations: DataTypes.JSONB,
    encryptionEnabled: { type: DataTypes.BOOLEAN },
    encryptionLastUpdateAt: DataTypes.DATE,
    encryptedVerificationKey: DataTypes.TEXT,
    encrypting: { type: DataTypes.BOOLEAN, default: false },
    receptionEnabled: { type: DataTypes.BOOLEAN },
    territoriesEnabled: { type: DataTypes.BOOLEAN },
    groupsEnabled: { type: DataTypes.BOOLEAN },
    passagesEnabled: { type: DataTypes.BOOLEAN },
    rencontresEnabled: { type: DataTypes.BOOLEAN },
    groupedServices: {
      type: DataTypes.JSONB, // example: [{"groupTitle": "injection", categories: ["Garrot", "1cc"]}, { "groupTitle": "inhalation", "categories": ["Kit base", "Grille"]}]
    },
    services: DataTypes.ARRAY(DataTypes.TEXT),
    groupedCustomFieldsObs: DataTypes.JSONB,
    fieldsPersonsCustomizableOptions: DataTypes.JSONB,
    customFieldsPersons: DataTypes.JSONB,
    customFieldsMedicalFile: DataTypes.JSONB,
    migrating: { type: DataTypes.BOOLEAN, default: false },
    migrations: DataTypes.ARRAY(DataTypes.TEXT),
    migrationLastUpdateAt: DataTypes.DATE,
  };

  class Organisation extends Model {
    static associate() {
      // See other models
    }
  }

  Organisation.init(schema, { sequelize, modelName: "Organisation", freezeTableName: true });
  return Organisation;
};
