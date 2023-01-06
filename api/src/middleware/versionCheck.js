const MINIMUM_MOBILE_APP_VERSION = [2, 30, 0];

module.exports = ({ headers: { version, platform } }, res, next) => {
  if (platform === "dashboard") return next();
  if (platform === "website") return next();
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
