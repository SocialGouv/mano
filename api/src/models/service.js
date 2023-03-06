const { Model, Deferrable } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const schema = {
    _id: { type: DataTypes.UUID, allowNull: false, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    date: DataTypes.DATEONLY,
    service: DataTypes.TEXT,
    count: DataTypes.INTEGER,
    team: { type: DataTypes.UUID, references: { model: "Team", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
    organisation: { type: DataTypes.UUID, references: { model: "Organisation", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
  };

  class Service extends Model {
    static associate({ Organisation, Service, Team }) {
      Service.belongsTo(Organisation, { foreignKey: { type: DataTypes.UUID, name: "organisation", field: "organisation" } });
      Organisation.hasMany(Service, { foreignKey: { type: DataTypes.UUID, name: "organisation", field: "organisation" } });
      Service.belongsTo(Team, { foreignKey: { type: DataTypes.UUID, name: "team", field: "team" } });
      Team.hasMany(Service, { foreignKey: { type: DataTypes.UUID, name: "team", field: "team" } });
    }
  }

  Service.init(schema, { sequelize, modelName: "Service", freezeTableName: true });
  return Service;
};
