const { Model, Deferrable } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const schema = {
    _id: { type: DataTypes.UUID, allowNull: false, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    organisation: { type: DataTypes.UUID, references: { model: "Organisation", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
    date: { type: DataTypes.TEXT },
    team: { type: DataTypes.UUID, references: { model: "Team", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
    debug: { type: DataTypes.JSONB },
    encrypted: { type: DataTypes.TEXT },
    encryptedEntityKey: { type: DataTypes.TEXT },
  };

  class Report extends Model {
    static associate({ Organisation, Report, Team }) {
      Report.belongsTo(Organisation, { foreignKey: { type: DataTypes.UUID, name: "organisation", field: "organisation" } });
      Organisation.hasMany(Report, { foreignKey: { type: DataTypes.UUID, name: "organisation", field: "organisation" } });
      Report.belongsTo(Team, { foreignKey: { type: DataTypes.UUID, name: "team", field: "team" } });
      Team.hasMany(Report, { foreignKey: { type: DataTypes.UUID, name: "team", field: "team" } });
    }
  }

  Report.init(schema, {
    sequelize,
    modelName: "Report",
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ["organisation", "team", "date"],
      },
    ],
  });
  return Report;
};
