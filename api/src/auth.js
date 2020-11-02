const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { capture } = require("./sentry");

const config = require("./config");
const { validatePassword } = require("./utils");

const EMAIL_OR_PASSWORD_INVALID = "EMAIL_OR_PASSWORD_INVALID";
const PASSWORD_INVALID = "PASSWORD_INVALID";
const EMAIL_AND_PASSWORD_REQUIRED = "EMAIL_AND_PASSWORD_REQUIRED";
const PASSWORD_TOKEN_EXPIRED_OR_INVALID = "PASSWORD_TOKEN_EXPIRED_OR_INVALID";
const PASSWORDS_NOT_MATCH = "PASSWORDS_NOT_MATCH";
const SERVER_ERROR = "SERVER_ERROR";
const USER_ALREADY_REGISTERED = "USER_ALREADY_REGISTERED";
const PASSWORD_NOT_VALIDATED = "PASSWORD_NOT_VALIDATED";
const ACOUNT_NOT_ACTIVATED = "ACOUNT_NOT_ACTIVATED";
const USER_NOT_EXISTS = "USER_NOT_EXISTS";

const mailservice = require("./emails");
const { hashPassword } = require("./utils");
const { comparePassword } = require("./utils");
const { pg } = require("./pg");

// mailservice.init("contact@email.com", "contact");

const COOKIE_MAX_AGE = 2592000000;
const JWT_MAX_AGE = 86400;

class Auth {
  constructor(tableName) {
    this.tableName = tableName;
  }

  signin = async (req, res, cookie = true) => {
    let { password, email } = req.body;
    email = (email || "").trim().toLowerCase();
    try {
      const user = (await pg.query(`SELECT id, password, name, email FROM "${this.tableName}" WHERE email = $1`, [email])).rows[0];
      if (!user) return res.status(401).send({ ok: false, code: EMAIL_OR_PASSWORD_INVALID });

      // simplify
      const match = await comparePassword(password, user.password);
      console.log(req.body);
      if (!match) return res.status(401).send({ ok: false, code: EMAIL_OR_PASSWORD_INVALID });

      await pg.query(`UPDATE "admin" SET last_login_at = $1 WHERE id = $2`, [new Date(), user.id]);

      const token = jwt.sign({ _id: user.id }, config.SECRET, { expiresIn: JWT_MAX_AGE });

      if (cookie) {
        const opts = { maxAge: COOKIE_MAX_AGE, secure: config.ENVIRONMENT !== "test", httpOnly: false };
        res.cookie("jwt", token, opts);
      }

      return res.status(200).send({ ok: true, token, user });
    } catch (error) {
      capture(error);
      return res.status(500).send({ ok: false, code: SERVER_ERROR });
    }
  };
  logout = async (req, res) => {
    try {
      res.clearCookie("jwt");
      return res.status(200).send({ ok: true });
    } catch (error) {
      capture(error);
      return res.status(500).send({ ok: false, error });
    }
  };

  signinToken = async (req, res) => {
    try {
      const { user } = req;
      pg.query(`UPDATE "${this.tableName}" SET last_login_at = $1 WHERE id = $2`, [new Date(), user._id]);

      res.send({ user, token: req.cookies.jwt, ok: true });
    } catch (error) {
      capture(error);
      return res.status(500).send({ ok: false, code: SERVER_ERROR });
    }
  };

  resetPassword = async (req, res) => {
    try {
      const { password, newPassword, verifyPassword } = req.body;
      const user = (await pg.query(`SELECT password FROM "${this.tableName}" WHERE id = $1`, [req.user._id])).rows[0];
      const match = await comparePassword(password, user.password);
      if (!match) return res.status(401).send({ ok: false, code: PASSWORD_INVALID });

      if (newPassword !== verifyPassword) return res.status(422).send({ ok: false, code: PASSWORDS_NOT_MATCH });
      if (!validatePassword(newPassword)) return res.status(400).send({ ok: false, code: PASSWORD_NOT_VALIDATED });

      const obj = (
        await pg.query(`UPDATE "${this.tableName}" SET password = $1 WHERE id = $2 RETURNING id AS _id, name, password, email`, [
          await hashPassword(password),
          req.user._id,
        ])
      ).rows[0];

      return res.status(200).send({ ok: true, user: obj });
    } catch (error) {
      capture(error);
      return res.status(500).send({ ok: false, code: SERVER_ERROR });
    }
  };

  forgotPassword = async (req, res, cta) => {
    try {
      const obj = (
        await pg.query(`SELECT id AS _id, email, password, name FROM "${this.tableName}" WHERE email = $1`, [req.body.email.toLowerCase()])
      ).rows[0];

      if (!obj) return res.status(401).send({ ok: false, code: EMAIL_OR_PASSWORD_INVALID });

      if (!obj.password) return res.status(401).send({ ok: false, code: ACOUNT_NOT_ACTIVATED, user: obj });

      const token = await crypto.randomBytes(20).toString("hex");
      await pg.query(`UPDATE "${this.tableName}" SET forgot_password_reset_token = $1, forgot_password_reset_expires = $2 WHERE id = $3`, [
        token,
        new Date(Date.now() + JWT_MAX_AGE),
        obj._id,
      ]);

      const subject = "Reset your password";
      const body = `A request to reset your password has been made, if you did this you can <a href="${cta}?token=${token}">Reset Password</a>`;
      await mailservice.sendEmail(obj.email, subject, body);

      res.status(200).send({ ok: true });
    } catch (error) {
      capture(error);
      return res.status(500).send({ ok: false, code: SERVER_ERROR });
    }
  };

  forgotPasswordReset = async (req, res) => {
    try {
      const { token, password } = req.body;
      const obj = await pg.query(
        `SELECT id AS _id FROM "${this.tableName}" WHERE forgot_password_reset_token = $1 AND forgot_password_reset_expires > $2`,
        [token, new Date()]
      );

      if (!obj) return res.status(400).send({ ok: false, code: PASSWORD_TOKEN_EXPIRED_OR_INVALID });

      if (!validatePassword(password)) return res.status(400).send({ ok: false, code: PASSWORD_NOT_VALIDATED });

      await pg.query(
        `UPDATE "${this.tableName}" SET password = $1, forgot_password_reset_token = NULL, forgot_password_reset_expires = NULL WHERE id = $2`,
        [hashPassword(password), obj._id]
      );

      return res.status(200).send({ ok: true });
    } catch (error) {
      capture(error);
      return res.status(500).send({ ok: false, code: SERVER_ERROR });
    }
  };
}

module.exports = Auth;
