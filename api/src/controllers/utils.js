const express = require("express");
const router = express.Router();
const passport = require("passport");
const { VERSION } = require("../config");

router.get("/check-auth", passport.authenticate("user", { session: false }), async (req, res) => {
  // called when the app / the dashboard get from unfocused to focused
  // to check if the user should be logged out or not
  res.status(200).send({ ok: true });
});

router.get("/version", async (req, res) => {
  res.status(200).send({ ok: true, data: VERSION });
});

module.exports = router;
