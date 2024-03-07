const { Model, Deferrable } = require("sequelize");
const { hashPassword } = require("../utils");

module.exports = (sequelize, DataTypes) => {
  const schema = {
    _id: { type: DataTypes.UUID, allowNull: false, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: DataTypes.TEXT,
    phone: DataTypes.TEXT,
    email: { type: DataTypes.TEXT, allowNull: false },
    password: { type: DataTypes.TEXT, allowNull: false },
    organisation: { type: DataTypes.UUID, references: { model: "Organisation", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
    lastLoginAt: DataTypes.DATE,
    termsAccepted: DataTypes.DATE,
    cgusAccepted: DataTypes.DATE,
    lastChangePasswordAt: DataTypes.DATE,
    forgotPasswordResetToken: DataTypes.TEXT,
    forgotPasswordResetExpires: DataTypes.DATE,
    healthcareProfessional: DataTypes.BOOLEAN,
    role: { type: DataTypes.TEXT, defaultValue: "normal" },
    debugApp: DataTypes.JSONB,
    debugDashboard: DataTypes.JSONB,
    gaveFeedbackEarly2023: DataTypes.BOOLEAN,
  };

  class User extends Model {
    static associate({ Organisation, User, Team, RelUserTeam }) {
      User.belongsTo(Organisation, { foreignKey: { type: DataTypes.UUID, name: "organisation", field: "organisation" } });
      Organisation.hasMany(User, { foreignKey: { type: DataTypes.UUID, name: "organisation", field: "organisation" } });
      User.belongsToMany(Team, { foreignKey: { type: DataTypes.UUID, name: "user", field: "user" }, through: RelUserTeam });
      Team.belongsToMany(User, { foreignKey: { type: DataTypes.UUID, name: "team", field: "team" }, through: RelUserTeam });
    }
  }

  User.init(schema, {
    sequelize,
    modelName: "User",
    freezeTableName: true,
    defaultScope: {
      attributes: { exclude: ["password", "forgotPasswordResetToken", "forgotPasswordResetExpires", "debugApp", "debugDashboard"] },
    },
    scopes: {
      withPassword: {
        attributes: {},
      },
    },
  });

  User.beforeCreate(async (user) => {
    user.password = await hashPassword(user.password);
  });

  User.beforeUpdate(async (user) => {
    if (user.changed("password")) user.password = await hashPassword(user.password);
  });

  return User;
};
