import { atom } from 'recoil';
import { writeCollection } from '../services/dataManagement';

export const placesState = atom({
  key: 'placesState',
  default: [],
  effects: [
    ({ onSet }) => {
      onSet((newValue) => {
        writeCollection('place', newValue);
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
