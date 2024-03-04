const { QueryTypes } = require("sequelize");
const { sequelize } = require("../db/sequelize");

const MINIMUM_MOBILE_APP_VERSION = [3, 0, 3];

let deploymentCommit = null;
let deploymentDate = null;

module.exports = async ({ headers: { version, platform } }, res, next) => {
  if (platform === "website") return next();
  if (platform === "dashboard") {
    if (deploymentCommit === null) {
      try {
        const [deployment] = await sequelize.query(`select commit, "createdAt" from mano."Deployment" order by "createdAt" desc limit 1`, {
          type: QueryTypes.SELECT,
        });
        if (deployment) {
          deploymentCommit = deployment.commit;
          deploymentDate = deployment.createdAt.toISOString();
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (deploymentCommit && deploymentDate) {
      res.header("X-API-DEPLOYMENT-COMMIT", deploymentCommit);
      res.header("X-API-DEPLOYMENT-DATE", deploymentDate);
      // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers
      res.header("Access-Control-Expose-Headers", "X-API-DEPLOYMENT-COMMIT, X-API-DEPLOYMENT-DATE");
    }
    return next();
  }

  return res.status(403).send({
    ok: false,
    message: "Bienvenue sur Mano Sesan 🎆",
    inAppMessage: [
      `Bienvenue sur Mano Sesan 🎆`,
      `L'application sera utilisable à partir du mardi 5 mars en fin de journée, sans changement d'interface ni de fonctionnalités, le temps pour nous de réaliser la bascule technique de Mano.

Vous avec peut-être encore deux icônes "Mano" sur votre téléphone:
- celle-ci, la nouvelle, estampillée "Sesan" pour la reconnaître facilement
- et l'ancienne en fin de vie, que vous pouvez d'ores et déjà supprimer

Merci de votre patience !`,
      [{ text: "Un peu de musique pour patienter", link: "https://youtu.be/yG_xZLWzcjg" }],
    ],
  });

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
          [{ text: "Télécharger la dernière version", link: `https://mano.sesan.fr/download?ts=${Date.now()}` }],
        ],
      });
    }
  }

  next();
};
