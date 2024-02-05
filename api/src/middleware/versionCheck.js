const { QueryTypes } = require("sequelize");
const { sequelize } = require("../db/sequelize");

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
    console.log(deploymentDate, typeof deploymentDate);
    res.header("X-API-DEPLOYMENT-COMMIT", deploymentCommit);
    res.header("X-API-DEPLOYMENT-DATE", deploymentDate);
    // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers
    res.header("Access-Control-Expose-Headers", "X-API-DEPLOYMENT-COMMIT, X-API-DEPLOYMENT-DATE");
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
