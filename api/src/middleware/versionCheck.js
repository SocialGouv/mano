const MINIMUM_MOBILE_APP_VERSION = [2, 26, 0];

module.exports = ({ headers: { version, platform } }, res, next) => {
  if (platform === "dashboard") return next();
  if (platform === "website") return next();
  if (!version) return res.status(403).send({ ok: false, message: "Veuillez mettre à jour votre application!" });

  const appVer = version.split(".").map((d) => parseInt(d));

  for (let i = 0; i < 3; i++) {
    if (appVer[i] > MINIMUM_MOBILE_APP_VERSION[i]) {
      return next();
    } else if (appVer[i] < MINIMUM_MOBILE_APP_VERSION[i]) {
      return res.status(403).send({ ok: false, message: "Veuillez mettre à jour votre application!" });
    }
  }

  next();
};
