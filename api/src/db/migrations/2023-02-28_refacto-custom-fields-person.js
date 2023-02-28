const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
  } catch (e) {
    capture(e);
  }
};
