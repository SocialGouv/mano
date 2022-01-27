const passwordValidator = require("password-validator");
const bcrypt = require("bcryptjs");

function validatePassword(password) {
  const schema = new passwordValidator();
  schema
    .is()
    .min(6) // Minimum length 6
    .is()
    .max(32) // Maximum length 32
    .has()
    .letters() // Must have letters
    .has()
    .digits() // Must have digits
    .has()
    .symbols(); // Must have symbols

  return schema.validate(password);
}

function generatePassword() {
  let length = 6;
  let charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

async function comparePassword(password, expected) {
  return bcrypt.compare(password, expected);
}

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

module.exports = {
  validatePassword,
  comparePassword,
  hashPassword,
  generatePassword,
};
