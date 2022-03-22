import { atom } from 'recoil';

export const passagesState = atom({
  key: 'passagesState',
  default: [],
});

const encryptedFields = ['person', 'team', 'user', 'date', 'comment'];

export const preparePassageForEncryption = (passage) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = passage[field];
  }
  return {
    _id: passage._id,
    createdAt: passage.createdAt,
    updatedAt: passage.updatedAt,
    organisation: passage.organisation,

    decrypted,
    entityKey: passage.entityKey,
  };
};
