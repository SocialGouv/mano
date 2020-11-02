const passwordValidator = require("password-validator");
const bcrypt = require("bcryptjs");

function validatePassword(password) {
  const schema = new passwordValidator();
  schema.is().min(6).is().max(100).has().letters();
  return schema.validate(password);
}

function comparePassword(password, expected) {
  return bcrypt.compare(password, expected);
}

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

module.exports = {
  validatePassword,
  comparePassword,
  hashPassword,
};
