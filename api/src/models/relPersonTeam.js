const { DataTypes, Model, Sequelize, Deferrable } = require("sequelize");
const { ENCRYPTED_FIELDS_ONLY } = require("../config");
const sequelize = require("../db/sequelize");

class RelPersonTeam extends Model {}

if (!ENCRYPTED_FIELDS_ONLY) {
  RelPersonTeam.init(
    {
      _id: { type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      person: { type: DataTypes.UUID, references: { model: "Person", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
      team: { type: DataTypes.UUID, references: { model: "Team", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
    },
    { sequelize, modelName: "RelPersonTeam", freezeTableName: true }
  );
}

module.exports = RelPersonTeam;
