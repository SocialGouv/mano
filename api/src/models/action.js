const { Model, Deferrable } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const schema = {
    _id: { type: DataTypes.UUID, allowNull: false, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    organisation: { type: DataTypes.UUID, references: { model: "Organisation", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
    status: DataTypes.TEXT,
    dueAt: DataTypes.DATE,
    completedAt: DataTypes.DATE,
    encrypted: { type: DataTypes.TEXT },
    encryptedEntityKey: { type: DataTypes.TEXT },
  };

  class Action extends Model {
    static associate({ Organisation, Action }) {
      Action.belongsTo(Organisation, { foreignKey: { type: DataTypes.UUID, name: "organisation", field: "organisation" } });
      Organisation.hasMany(Action, { foreignKey: { type: DataTypes.UUID, name: "organisation", field: "organisation" } });
    }
  }

  Action.init(schema, { sequelize, modelName: "Action", freezeTableName: true, timestamps: true, paranoid: true });
  return Action;
};
