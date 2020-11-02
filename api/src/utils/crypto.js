const jwt = require("jsonwebtoken");

const { SECRET } = require("../config");

exports.generateJwtByUserId = (_id, expiresIn = "30d") => jwt.sign({ _id }, SECRET, { expiresIn });
