import { atom } from 'recoil';

const collectionName = 'rencontre';
export const rencontresState = atom({
  key: collectionName,
  default: [],
});

const encryptedFields = ['person', 'team', 'user', 'date', 'comment'];

export const prepareRencontreForEncryption = (rencontre) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = rencontre[field];
  }
  return {
    _id: rencontre._id,
    createdAt: rencontre.createdAt,
    updatedAt: rencontre.updatedAt,
    organisation: rencontre.organisation,

    decrypted,
    entityKey: rencontre.entityKey,
  };
};
