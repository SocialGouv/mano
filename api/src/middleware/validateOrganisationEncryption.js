const Organisation = require("../models/organisation");

function dateForCompare(date) {
  return Date.parse(new Date(date));
}

async function validateOrganisationEncryption(req, res, next) {
  const { encryptionLastUpdateAt } = req.query;
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

  next();
}

module.exports = validateOrganisationEncryption;
