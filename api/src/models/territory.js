const { DataTypes, Model, Sequelize, Deferrable } = require("sequelize");
const { ENCRYPTED_FIELDS_ONLY } = require("../config");
const sequelize = require("../db/sequelize");

// Territoires visités par la maraude

class Territory extends Model {}

const schema = {
  _id: { type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4, primaryKey: true },
  organisation: { type: DataTypes.UUID, references: { model: "Organisation", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },

  encrypted: { type: DataTypes.TEXT },
  encryptedEntityKey: { type: DataTypes.TEXT },
};

if (!ENCRYPTED_FIELDS_ONLY) {
  schema.user = { type: DataTypes.UUID, references: { model: "User", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } };
  schema.name = DataTypes.TEXT;
  schema.perimeter = DataTypes.TEXT; // bounderies
  schema.types = DataTypes.ARRAY(DataTypes.TEXT); // Lieu de conso, Lieu de deal, Campement, Lieu de vie, Prostitution
}

Territory.init(schema, { sequelize, modelName: "Territory", freezeTableName: true });

module.exports = Territory;
