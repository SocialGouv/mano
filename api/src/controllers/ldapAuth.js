const express = require("express");
const router = express.Router();
var passport = require('passport');
var LdapStrategy = require('passport-ldapauth').Strategy;
var bodyParser = require('body-parser')
const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const config = require("../config");
var app = express();
const { authenticate } = require('ldap-authentication');
const { catchErrors } = require("../errors");
const User = require("../models/user");
const Team = require("../models/team");
const RelUserTeam = require("../models/relUserTeam");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
const JWT_MAX_AGE = 60 * 60 * 3; // 3 hours in s
const COOKIE_MAX_AGE = JWT_MAX_AGE * 1000;
function cookieOptions() {
  if (config.ENVIRONMENT === "development" || config.ENVIRONMENT === "test") {
    return { maxAge: COOKIE_MAX_AGE, httpOnly: true, secure: true, sameSite: "None" };
  } else {
    return { maxAge: COOKIE_MAX_AGE, httpOnly: true, secure: true, domain: ".fabrique.social.gouv.fr", sameSite: "Lax" };
  }
}

router.post("/", async function(req, res, next){
    // auth with admin
    let options = {
      ldapOpts: {
        url: 'ldap://' + process.env.LDAP_URL,
        // tlsOptions: { rejectUnauthorized: false }
      },
      adminDn: process.env.BIND_DN,
      adminPassword:  process.env.LDAP_PASSWORD,
      userPassword:  req.body.password,
      userSearchBase: process.env.BASE_DN,
      usernameAttribute: 'samaccountname',
      username: req.body.username,
      // starttls: false
    }
    try {
     let user_ldap =  await authenticate(options)
      email = user_ldap.mail
      const user = await User.findOne({ where: {email}});
      if(!user) res.status(403).send({ ok: false, error: "E-mail ou mot de passe incorrect", code: EMAIL_OR_PASSWORD_INVALID });

      user.lastLoginAt = new Date();
      await user.save()

      const organisation = await user.getOrganisation();
      const orgTeams = await Team.findAll({ where: { organisation: organisation._id } });
      const userTeams = await RelUserTeam.findAll({ where: { user: user._id, team: { [Op.in]: orgTeams.map((t) => t._id) } } });
      const teams = userTeams.map((rel) => orgTeams.find((t) => t._id === rel.team));
      const token = jwt.sign({ _id: user._id }, config.SECRET, { expiresIn: JWT_MAX_AGE });
      res.cookie("jwt", token, cookieOptions());
      return res.status(200).send({ ok: true, token, user: { ...user.toJSON(), teams, organisation } });
    }
    catch(error)
    {
      console.log(error)
      return res.status(403).send({ ok: false, error: error });
    }
  
})

module.exports = router;