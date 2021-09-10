const sequelize = require("../db/sequelize");
const Organisation = require("../models/organisation");

const encryptedTransaction = (req) => (dbOperation) =>
  sequelize
    .transaction(async (tx) => {
      const { encryptionEnabled, encryptionLastUpdateAt, changeMasterKey } = req.query;

      const checkIfCanChangeData = async () => {
        const organisation = await Organisation.findOne({ where: { _id: req.user.organisation } });
        if (encryptionEnabled !== "true" && organisation.encryptionEnabled) {
          throw new Error(
            "Data has been already encrypted while you tried to encrypt, please refresh your data with the encryption key setup already"
          );
        }

        if (
          !!organisation.encryptionEnabled &&
          Date.parse(new Date(encryptionLastUpdateAt)) < Date.parse(new Date(organisation.encryptionLastUpdateAt))
        ) {
          throw new Error("The encryption key has changed, please logout and login with the new key");
        }
        return organisation;
      };

      await checkIfCanChangeData();

      const data = await dbOperation(tx);

      const organisation = await checkIfCanChangeData();

      if (changeMasterKey === "true") {
        organisation.set({
          encryptionEnabled: encryptionEnabled === "true",
          encryptionLastUpdateAt: new Date(),
        });
        await organisation.save({ transaction: tx });
      }

      return { ok: true, data, status: 200 };
    })
    .catch((error) => {
      return { ok: false, error: error.message, status: 409 };
    });

module.exports = encryptedTransaction;
