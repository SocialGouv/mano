const { DataTypes, Model, Sequelize, Deferrable } = require("sequelize");

const sequelize = require("../db/sequelize");
const { hashPassword } = require("../utils");

class User extends Model {}

User.init(
  {
    _id: { type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4, primaryKey: true },
    name: DataTypes.TEXT,
    email: { type: DataTypes.TEXT, allowNull: false },
    password: { type: DataTypes.TEXT, allowNull: false },
    organisation: { type: DataTypes.UUID, references: { model: "Organisation", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },
    lastLoginAt: DataTypes.DATE,
    termsAccepted: DataTypes.DATE,
    lastChangePasswordAt: DataTypes.DATE,
    forgotPasswordResetToken: DataTypes.TEXT,
    forgotPasswordResetExpires: DataTypes.DATE,
    role: { type: DataTypes.TEXT, defaultValue: "normal" },
  },
  { sequelize, modelName: "User", freezeTableName: true }
);

User.beforeCreate(async (user) => {
  user.password = await hashPassword(user.password);
});

User.beforeUpdate(async (user) => {
  if (user.changed("password")) user.password = await hashPassword(user.password);
});

module.exports = User;
