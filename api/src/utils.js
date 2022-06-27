const passwordValidator = require("password-validator");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const sanitizeHtml = require("sanitize-html");

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

async function comparePassword(password, expected) {
  return bcrypt.compare(password, expected);
}

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

const looseUuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const cryptoHexRegex = /^[A-Fa-f0-9]{16,128}$/;
const positiveIntegerRegex = /^\d+$/;
const jwtRegex = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;
const headerJwtRegex = /JWT [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;

const customFieldSchema = z
  .object({
    name: z.string().min(1),
    type: z.string().min(1),
    label: z.optional(z.string().min(1)),
    enabled: z.optional(z.boolean()),
    deletable: z.optional(z.boolean()),
    required: z.optional(z.boolean()),
    showInStats: z.optional(z.boolean()),
    onlyHealthcareProfessional: z.optional(z.boolean()),
    options: z.optional(z.array(z.string())),
  })
  .strict();

function sanitizeAll(text) {
  return sanitizeHtml(text || "", { allowedTags: [], allowedAttributes: {} });
}

module.exports = {
  validatePassword,
  comparePassword,
  hashPassword,
  looseUuidRegex,
  positiveIntegerRegex,
  cryptoHexRegex,
  jwtRegex,
  headerJwtRegex,
  customFieldSchema,
  sanitizeAll,
};
