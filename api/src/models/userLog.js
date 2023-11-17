const { Model, Deferrable } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const schema = {
    _id: { type: DataTypes.UUID, allowNull: false, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    organisation: { type: DataTypes.UUID, references: { model: "Organisation", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
    user: { type: DataTypes.UUID, references: { model: "User", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
    platform: DataTypes.TEXT, // dashboard, app
    action: DataTypes.TEXT, // login, logout, change-encryption-key
    debugApp: DataTypes.JSONB,
    debugDashboard: DataTypes.JSONB,
  };

  class UserLog extends Model {
    static associate({ Organisation, User }) {
      Organisation.hasMany(UserLog, { foreignKey: { type: DataTypes.UUID, name: "organisation", field: "organisation" } });
      User.hasMany(UserLog, { foreignKey: { type: DataTypes.UUID, name: "organisation", field: "organisation" } });
    }
  }

  UserLog.init(schema, { sequelize, modelName: "UserLog", freezeTableName: true, timestamps: true });

  return UserLog;
};
