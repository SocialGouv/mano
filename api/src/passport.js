const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

const { SECRET } = require("./config");

// load up the user model
const { pg } = require("./pg");

module.exports = (app) => {
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("JWT"),
    secretOrKey: SECRET,
  };

  passport.use(
    "user",
    new JwtStrategy(opts, async function (jwtPayload, done) {
      try {
        const user = (
          await pg.query(`SELECT id AS _id, name, team_id AS team, organisation_id AS organisation, email FROM "user" WHERE id = $1`, [
            jwtPayload._id,
          ])
        ).rows[0];
        if (user) return done(null, user);
      } catch (e) {
        console.log("error passport", e);
      }

      return done(null, false);
    })
  );

  passport.use(
    "admin",
    new JwtStrategy(opts, async function (jwtPayload, done) {
      try {
        const user = (
          await pg.query(`SELECT id AS _id, name, team_id AS team, organisation_id AS organisation, email FROM "user" WHERE id = $1`, [
            jwtPayload._id,
          ])
        ).rows[0];
        // if (user && (user.role === "admin" || user.role === "superadmin")) return done(null, user);
        if (user) return done(null, user);
      } catch (e) {
        console.log("error passport", e);
      }
      return done(null, false);
    })
  );

  passport.use(
    "superadmin",
    new JwtStrategy(opts, async function (jwtPayload, done) {
      try {
        const user = (
          await pg.query(`SELECT id AS _id, name, team_id AS team, organisation_id AS organisation, email FROM "user" WHERE id = $1`, [
            jwtPayload._id,
          ])
        ).rows[0];
        if (user) return done(null, user);
        // if (user && user.role === "superadmin") return done(null, user);
      } catch (e) {
        console.log("error passport", e);
      }
      return done(null, false);
    })
  );

  app.use(passport.initialize());
};
