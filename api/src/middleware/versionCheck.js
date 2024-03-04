const { VERSION, MINIMUM_DASHBOARD_VERSION } = require("../config");

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

  return res.status(403).send({
    ok: false,
    message: "Cette version de Mano est en fin de vie 🪦",
    inAppMessage: [
      `Cette version de Mano est\nen fin de vie 🪦`,
      `Une nouvelle app Mano Sesan est disponible en cliquant sur "Télécharger" ci-dessous, ou le lien
https://mano.sesan.fr/download.
\n
Elle sera utilisable à partir du mardi 5 mars en fin de journée, sans changement d'interface ni de fonctionnalités.
\n
Vous aurez donc deux icônes "Mano" sur votre téléphone:
- la nouvelle, estampillée "Sesan" pour la reconnaître facilement
- et celle-ci, que vous pourrez supprimer ensuite.`,
      [{ text: "Télécharger\nla nouvelle app Mano Sesan 🎆", link: `https://mano.sesan.fr/download?ts=${Date.now()}` }],
    ],
  });
};
