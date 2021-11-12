const sequelize = require("../db/sequelize");
const Organisation = require("../models/organisation");

const encryptedTransaction = (req) => (dbOperation) =>
  sequelize.transaction(async (tx) => {
    const { encryptionEnabled, encryptionLastUpdateAt, changeMasterKey } = req.query;

    const checkIfCanChangeData = async () => {
      const organisation = await Organisation.findOne({ where: { _id: req.user.organisation } });
      if (encryptionEnabled !== "true" && organisation.encryptionEnabled) {
        return {
          ok: false,
          status: 403,
          error:
            "Les données ont déjà été chiffrées pendant que vous essayez vous-même. Veuillez rafraichir vos données avec la clé de chiffrement déjà présente.",
        };
      }

      if (
        !!organisation.encryptionEnabled &&
        Date.parse(new Date(encryptionLastUpdateAt)) < Date.parse(new Date(organisation.encryptionLastUpdateAt))
      ) {
        return {
          ok: false,
          status: 403,
          error: "La clé de chiffrement a changé. Veuillez vous déconnecter et vous reconnecter avec la nouvelle clé/",
        };
      }
      return organisation;
    };

    await checkIfCanChangeData();

    const data = await dbOperation(tx);

    const organisation = await checkIfCanChangeData();

    if (changeMasterKey === "true") {
      const { encryptedVerificationKey } = req.body;
      organisation.set({
        encryptionEnabled: encryptionEnabled === "true",
        encryptionLastUpdateAt: new Date(),
        encryptedVerificationKey,
      });
      await organisation.save({ transaction: tx });
    }

    return { ok: true, data, status: 200 };
  });

module.exports = encryptedTransaction;
