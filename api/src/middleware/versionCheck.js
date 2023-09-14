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

  // now platform is react native app
  if (!version) return res.status(403).send({ ok: false, message: "Veuillez mettre à jour votre application!" });

  const appVer = version.split(".").map((d) => parseInt(d));

  for (let i = 0; i < 3; i++) {
    if (appVer[i] > MINIMUM_MOBILE_APP_VERSION[i]) {
      return next();
    } else if (appVer[i] < MINIMUM_MOBILE_APP_VERSION[i]) {
      return res.status(403).send({
        ok: false,
        message: "Veuillez mettre à jour votre application!",
        inAppMessage: [
          `Veuillez mettre à jour votre application\u00A0!`,
          `Les fonctionnalités de cette nouvelle version sont\u00A0:
- Compatibilité de l 'historique des actions, consultations, traitements et dossier médical (seulement consultable sur navigateur)`,
          [{ text: "Télécharger la dernière version", link: `https://mano-app.fabrique.social.gouv.fr/download?ts=${Date.now()}` }],
        ],
      });
    }
  }

  next();
};
