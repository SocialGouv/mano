const { z } = require("zod");
const { looseUuidRegex } = require("../utils");

/**
 * Check that the request user has the correct role, return 403 otherwise.
 * @param {string|string[]} roles
 */
function validateUser(roles = ["admin", "normal"], options = { healthcareProfessional: false }) {
  return async (req, res, next) => {
    try {
      z.object({
        ...(Array.isArray(roles) ? { role: z.enum(roles) } : { role: z.literal(roles) }),
        organisation: z.string().regex(looseUuidRegex),
        ...(options && options.healthcareProfessional ? { healthcareProfessional: z.literal(true) } : {}),
      }).parse(req.user);
    } catch (e) {
      const error = new Error(`Invalid user: ${e}`);
      error.status = 400;
      return next(error);
    }

    next();
  };
}

module.exports = validateUser;
