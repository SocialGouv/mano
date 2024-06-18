const passwordValidator = require("password-validator");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const sanitizeHtml = require("sanitize-html");

function validatePassword(password) {
  const schema = new passwordValidator();
  schema
    .is()
    .min(8) // Minimum length 8
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
const headerJwtRegex = /JWT ^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{1,3}Z$/;

const customFieldSchema = z
  .object({
    name: z.string().min(1),
    type: z.string().min(1),
    label: z.optional(z.string().min(1)),
    enabled: z.optional(z.boolean()),
    enabledTeams: z.optional(z.array(z.string().min(1))),
    importable: z.optional(z.boolean()),
    deletable: z.optional(z.boolean()),
    required: z.optional(z.boolean()),
    showInStats: z.optional(z.boolean()),
    onlyHealthcareProfessional: z.optional(z.boolean()),
    options: z.optional(z.array(z.string())),
    allowCreateOption: z.optional(z.boolean()),
  })
  .strict();

const customFieldGroupSchema = z
  .object({
    name: z.string().min(1),
    fields: z.array(customFieldSchema),
  })
  .strict();

function sanitizeAll(text) {
  return sanitizeHtml(text || "", { allowedTags: [], allowedAttributes: {} });
}

const folderSchema = z.object({
  _id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string(),
  createdBy: z.string(),
  parentId: z.string().optional(),
  position: z.number().optional(),
  movable: z.boolean().optional(),
  type: z.literal("folder"),
});

module.exports = {
  validatePassword,
  comparePassword,
  hashPassword,
  looseUuidRegex,
  positiveIntegerRegex,
  cryptoHexRegex,
  jwtRegex,
  headerJwtRegex,
  dateRegex,
  isoDateRegex,
  customFieldSchema,
  customFieldGroupSchema,
  sanitizeAll,
  folderSchema,
};
