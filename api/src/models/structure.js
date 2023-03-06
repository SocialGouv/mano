const { Model, Deferrable } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const schema = {
    _id: { type: DataTypes.UUID, allowNull: false, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    organisation: { type: DataTypes.UUID, references: { model: "Organisation", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
    name: DataTypes.TEXT,
    phone: DataTypes.TEXT,
    adresse: DataTypes.TEXT,
    city: DataTypes.TEXT,
    postcode: DataTypes.TEXT,
    description: DataTypes.TEXT,
    categories: DataTypes.ARRAY(DataTypes.TEXT),
  };

  class Structure extends Model {
    static associate({ Organisation, Structure }) {
      Structure.belongsTo(Organisation, { foreignKey: { type: DataTypes.UUID, name: "organisation", field: "organisation" } });
      Organisation.hasMany(Structure, { foreignKey: { type: DataTypes.UUID, name: "organisation", field: "organisation" } });
    }
  }

  Structure.init(schema, { sequelize, modelName: "Structure", freezeTableName: true });
  return Structure;
};
