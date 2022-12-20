const { DataTypes, Model, Sequelize, Deferrable } = require("sequelize");
const sequelize = require("../db/sequelize");

class Structure extends Model {}

Structure.init(
  {
    _id: { type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4, primaryKey: true },
    organisation: { type: DataTypes.UUID, references: { model: "Organisation", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
    name: DataTypes.TEXT,
    phone: DataTypes.TEXT,
    adresse: DataTypes.TEXT,
    city: DataTypes.TEXT,
    postcode: DataTypes.TEXT,
    description: DataTypes.TEXT,
    categories: DataTypes.ARRAY(DataTypes.TEXT),
  },
  { sequelize, modelName: "Structure", freezeTableName: true }
);

module.exports = Structure;
