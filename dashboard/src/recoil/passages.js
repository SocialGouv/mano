import localforage from 'localforage';
import { atom } from 'recoil';

const collectionName = 'passage';
export const passagesState = atom({
  key: collectionName,
  /* default: new Promise(async (resolve) => {
    const cache = await localforage.getItem(collectionName);
    resolve(cache || []);
  }), */
  default: [],
  effects: [
    ({ onSet }) => {
      onSet(async (newValue) => {
        await localforage.setItem(collectionName, newValue);
      });
    },
  ],
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
