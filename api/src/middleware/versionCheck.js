const { VERSION, MINIMUM_DASHBOARD_VERSION } = require("../config");

module.exports = ({ headers: { version, platform } }, res, next) => {
  if (platform === "website") return next();
  if (platform === "dashboard") {
    return res.status(403).send({
      ok: false,
      error:
        "Cette version de Mano est en fin de vie 🪦. Veuillez désormais vous rediriger vers https://espace-mano.sesan.fr/ disponible à partir du mercredi 6 mars",
    });
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
