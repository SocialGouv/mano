const { VERSION, MINIMUM_DASHBOARD_VERSION } = require("../config");

const MINIMUM_MOBILE_APP_VERSION = [2, 37, 0];

module.exports = ({ headers: { version, platform } }, res, next) => {
  if (platform === "website") return next();
  if (platform === "dashboard") {
    // Add header with API version to compare with client.
    res.header("X-API-VERSION", VERSION);
    res.header("X-MINIMUM-DASHBOARD-VERSION", MINIMUM_DASHBOARD_VERSION);
    // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers
    res.header("Access-Control-Expose-Headers", "X-API-VERSION, X-MINIMUM-DASHBOARD-VERSION");
    return next();
  }

  // On doit forcer les utilisateurs à télécharger à nouveau Mano
  return res.status(403).send({
    ok: false,
    message: "Veuillez mettre à jour votre application!",
    inAppMessage: [
      `Mano a quitté la fabrique pour rejoindre le groupement d'intérêt public SESAN. Pour continuer à utiliser Mano, vous devez mettre à jour votre application mobile.`,
    ],
  });
};
