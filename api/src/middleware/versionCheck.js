const { VERSION, MINIMUM_DASHBOARD_VERSION } = require("../config");

const MINIMUM_MOBILE_APP_VERSION = [2, 30, 0];

const featuresDashboard = {
  "1.218.0": "En cliquant sur une statistique d'action, on peut voir la liste d'actions concernées",
  "1.217.0":
    "Vous n'êtes plus déconnectés automatiquement après 3h d'inactivité, mais la clé de chiffrement vous sera demandée pour continuer votre session",
  "1.216.0": "Une bulle d'aide est disponbile dans 2 statistiques de personnes suivies",
  "1.215.0": "Dans l'export depuis les statistiques, le nom d'utilisateur n'est plus exporté avec les actions",
  "1.214.1": "Les commentaires créées en même temps qu'une action sont de nouveau disponibles dans les comptes-rendus",
  "1.214.0": "Possibilité de filtrer par date non renseignée",
};

module.exports = ({ headers: { version, platform } }, res, next) => {
  if (platform === "website") return next();
  if (platform === "dashboard") {
    // Add header with API version to compare with client.
    // version = "1.215.1";
    res.header("X-API-VERSION", VERSION);
    res.header("X-MINIMUM-DASHBOARD-VERSION", MINIMUM_DASHBOARD_VERSION);
    res.header(
      "X-DASHBOARD-NEWFEATURES",
      Object.keys(featuresDashboard)
        .filter((v) => v > version)
        .reverse()
        .map((version) => featuresDashboard[version])
        .join("_")
    );
    // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers
    res.header("Access-Control-Expose-Headers", "X-API-VERSION, X-MINIMUM-DASHBOARD-VERSION, X-DASHBOARD-NEWFEATURES");
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
- Compatibilité avec les actions multi-équipes (paramétrage sur navigateur)
- Possibilité de n'enregistrer un lieu fréquenté qu'une fois par personne.
Appuyez sur ok pour télécharger la dernière application`,
          [{ text: "Télécharger", link: "https://mano-app.fabrique.social.gouv.fr/download" }],
        ],
      });
    }
  }

  next();
};
