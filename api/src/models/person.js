const { DataTypes, Model, Sequelize, Deferrable } = require("sequelize");
const sequelize = require("../db/sequelize");

class Person extends Model {}

const schema = {
  _id: { type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4, primaryKey: true },
  organisation: { type: DataTypes.UUID, references: { model: "Organisation", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },

  // FR: File Active (https://www.anfh.fr/file-active-psychiatrie), EN: Active List.
  // See: https://trello.com/c/Si0kbPet/464-renseigner-une-sortie-de-file-active-avec-un-motif
  outOfActiveList: { type: DataTypes.BOOLEAN, defaultValue: false },

  encrypted: { type: DataTypes.TEXT },
  encryptedEntityKey: { type: DataTypes.TEXT },
};

Person.init(schema, { sequelize, modelName: "Person", freezeTableName: true });

module.exports = Person;
