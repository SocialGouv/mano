const { DataTypes, Model, Sequelize, Deferrable } = require("sequelize");
const sequelize = require("../db/sequelize");

class RelUserTeam extends Model {}

RelUserTeam.init(
  {
    _id: { type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4, primaryKey: true },
    user: { type: DataTypes.UUID, references: { model: "User", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
    team: { type: DataTypes.UUID, references: { model: "Team", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
  },
  { sequelize, modelName: "RelUserTeam", freezeTableName: true }
);

module.exports = RelUserTeam;
