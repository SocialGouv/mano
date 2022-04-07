const { z } = require("zod");
const { looseUuidRegex } = require("../utils");

/**
 * Check that the request user has the correct role, return 403 otherwise.
 * @param {string|string[]} roles
 */
function validateUser(roles = ["admin", "normal"]) {
  return async (req, res, next) => {
    try {
      if (Array.isArray(roles)) z.enum(roles).parse(req.user.role);
      else z.literal(roles).parse(req.user.role);
      z.string().regex(looseUuidRegex).parse(req.user.organisation);
    } catch (e) {
      const error = new Error(`Invalid user: ${e}`);
      error.status = 400;
      return next(error);
    }

    next();
  };
}

module.exports = validateUser;
