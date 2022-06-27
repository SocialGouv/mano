const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const { SECRET, ENCRYPTION_TOKEN_SECRET } = require("./config");
const User = require("./models/user"); // load up the user model

const extractTokenFromAuth = (scheme, authHeader) =>
  authHeader
    .split(",")
    .map((authorization) => authorization.split(" "))
    .find(([authScheme]) => authScheme === scheme)?.[1];

exports.extractTokenFromAuth = extractTokenFromAuth;

module.exports = (app) => {
  passport.use(
    "user",
    new JwtStrategy(
      {
        jwtFromRequest: (req) => {
          let token = extractTokenFromAuth("JWT", req.headers.authorization);
          if (!token) token = req.cookies.jwt;
          return token;
        },
        secretOrKey: SECRET,
      },
      async function (jwt, done) {
        try {
          const { _id } = jwt;
          const user = await User.findOne({ where: { _id } });
          if (user) {
            const t = await user.getTeams();
            const teams = t.map((t) => t.toJSON());
            return done(null, { ...user.toJSON(), teams });
          }
        } catch (e) {
          console.log("error passport", e);
        }
        return done(null, false);
      }
    )
  );

  passport.use(
    "user-allowed-for-encrypted-data",
    new JwtStrategy(
      {
        jwtFromRequest: (req) => {
          let token = extractTokenFromAuth("JWT-ENCRYPTED-DATA", req.headers.authorization);
          if (!token) token = req.cookies.jwtEncryptedData;
          return token;
        },
        secretOrKey: ENCRYPTION_TOKEN_SECRET,
      },
      async function (jwt, done) {
        try {
          const { _id } = jwt;
          const user = await User.findOne({ where: { _id } });
          if (user) {
            const t = await user.getTeams();
            const teams = t.map((t) => t.toJSON());
            return done(null, { ...user.toJSON(), teams });
          }
        } catch (e) {
          console.log("error passport", e);
        }
        return done(null, false);
      }
    )
  );

  app.use(passport.initialize());
};
