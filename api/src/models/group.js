const { Model, Deferrable } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const schema = {
    _id: { type: DataTypes.UUID, allowNull: false, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    organisation: { type: DataTypes.UUID, references: { model: "Organisation", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
    encrypted: { type: DataTypes.TEXT },
    encryptedEntityKey: { type: DataTypes.TEXT },
  };

  class Group extends Model {
    static associate({ Organisation, Group }) {
      Group.belongsTo(Organisation, { foreignKey: { type: DataTypes.UUID, name: "organisation", field: "organisation" } });
      Organisation.hasMany(Group, { foreignKey: { type: DataTypes.UUID, name: "organisation", field: "organisation" } });
    }
  }

  Group.init(schema, { sequelize, modelName: "Group", freezeTableName: true, timestamps: true, paranoid: true });
  return Group;
};
