const { VERSION, MINIMUM_DASHBOARD_VERSION } = require("../config");

const MINIMUM_MOBILE_APP_VERSION = [2, 31, 0];

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
          `Veuillez mettre à jour votre application !`,
          `Les fonctionnalités de cette nouvelle version sont:
- Possibilité, depuis le navigateur web, de choisir les champs à afficher pour une personne (exemple: ne pas afficher "Avec animaux")
- Possibilité de rajouter des pdfs dans les documents d'une personne

Appuyez sur ok pour télécharger la dernière application`,
          [{ text: "Télécharger", link: "https://mano-app.fabrique.social.gouv.fr/download" }],
        ],
      });
    }
  }

  next();
};
