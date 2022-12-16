const { DataTypes, Model, Sequelize, Deferrable } = require("sequelize");
const sequelize = require("../db/sequelize");

class Structure extends Model {}

Structure.init(
  {
    _id: { type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4, primaryKey: true },
    organisation: { type: DataTypes.UUID, references: { model: "Organisation", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
    name: DataTypes.TEXT,
    description: DataTypes.TEXT,
    city: DataTypes.TEXT,
    postcode: DataTypes.TEXT,
    adresse: DataTypes.TEXT,
    phone: DataTypes.TEXT,
    categories: DataTypes.ARRAY(DataTypes.TEXT),
    //social ou medical ???
  },
  { sequelize, modelName: "Structure", freezeTableName: true }
);

module.exports = Structure;
