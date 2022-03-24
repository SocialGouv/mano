const Organisation = require("../models/organisation");

function dateForCompare(date) {
  return Date.parse(new Date(date));
}

async function validateEncryptionAndMigrations(req, res, next) {
  const { encryptionLastUpdateAt, migrationLastUpdateAt } = req.query;
  const organisation = await Organisation.findOne({ where: { _id: req.user.organisation } });

  if (!encryptionLastUpdateAt) {
    return res.status(400).send({ ok: false, status: 400, error: "encryptionLastUpdateAt is required" });
  }

  if (organisation.encrypting === true) {
    return res.status(403).send({
      ok: false,
      status: 403,
      error: "Les données sont en cours de chiffrement par un administrateur. Veuillez patienter, vous reconnecter et réessayer.",
    });
  }

  if (dateForCompare(encryptionLastUpdateAt) < dateForCompare(organisation.encryptionLastUpdateAt)) {
    return res.status(403).send({
      ok: false,
      status: 403,
      error: "La clé de chiffrement a changé ou a été régénérée. Veuillez vous déconnecter et vous reconnecter avec la nouvelle clé.",
    });
  }

  if (organisation.migrationLastUpdateAt) {
    if (!migrationLastUpdateAt) {
      return res
        .status(400)
        .send({ ok: false, status: 400, error: "Une mise-à-jour de vos données a été effectuée, veuillez recharger votre navigateur" });
    }
    if (dateForCompare(migrationLastUpdateAt) < dateForCompare(organisation.migrationLastUpdateAt)) {
      return res.status(403).send({
        ok: false,
        status: 403,
        error: "Une mise-à-jour de vos données a été effectuée, veuillez recharger votre navigateur",
      });
    }
  }

  if (organisation.migrating) {
    return res
      .status(403)
      .send({ ok: false, error: "Une mise à jour de vos données est en cours, veuillez recharger la page dans quelques minutes" });
  }

  if (req.params?.migrationName?.length > 1 && organisation.migrations?.includes(req.params.migrationName)) {
    return res.status(403).send({ ok: false, error: "Une mise à jour de vos données a été effectuée, veuillez recharger votre navigateur" });
  }

  next();
}

module.exports = validateEncryptionAndMigrations;
