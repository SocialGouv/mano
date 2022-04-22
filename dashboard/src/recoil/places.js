import localforage from 'localforage';
import { atom } from 'recoil';

const collectionName = 'place';
export const placesState = atom({
  key: collectionName,
  default: [],
  effects: [
    ({ onSet }) => {
      onSet(async (newValue) => {
        await localforage.setItem(collectionName, newValue);
      });
    },
  ],
});

const encryptedFields = ['user', 'name'];

export const preparePlaceForEncryption = (place) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = place[field];
  }
  return {
    _id: place._id,
    createdAt: place.createdAt,
    updatedAt: place.updatedAt,
    organisation: place.organisation,

    decrypted,
    entityKey: place.entityKey,
  };
};
