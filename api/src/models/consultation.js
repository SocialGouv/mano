const { Model, Deferrable } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const schema = {
    _id: { type: DataTypes.UUID, allowNull: false, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    organisation: { type: DataTypes.UUID, references: { model: "Organisation", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
    status: DataTypes.TEXT,
    dueAt: DataTypes.DATE,
    completedAt: DataTypes.DATE,
    onlyVisibleBy: [{ type: DataTypes.UUID, references: { model: "User", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } }],
    encrypted: { type: DataTypes.TEXT },
    encryptedEntityKey: { type: DataTypes.TEXT },
  };

  class Consultation extends Model {
    static associate({ Organisation, Consultation }) {
      Consultation.belongsTo(Organisation, { foreignKey: { type: DataTypes.UUID, name: "organisation", field: "organisation" } });
      Organisation.hasMany(Consultation, { foreignKey: { type: DataTypes.UUID, name: "organisation", field: "organisation" } });
    }
  }

  Consultation.init(schema, { sequelize, modelName: "Consultation", freezeTableName: true, timestamps: true, paranoid: true });
  return Consultation;
};
