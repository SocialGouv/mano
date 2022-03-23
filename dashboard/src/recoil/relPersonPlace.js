import { atom } from 'recoil';
import { writeCollection } from '../services/dataManagement';

export const relsPersonPlaceState = atom({
  key: 'relsPersonPlaceState',
  default: [],
  effects: [
    ({ onSet }) => {
      onSet((newValue) => {
        writeCollection('relPersonPlace', newValue);
      });
    },
  ],
});

const encryptedFields = ['place', 'person', 'user'];

export const prepareRelPersonPlaceForEncryption = (relPersonPlace) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = relPersonPlace[field];
  }
  return {
    _id: relPersonPlace._id,
    createdAt: relPersonPlace.createdAt,
    updatedAt: relPersonPlace.updatedAt,
    organisation: relPersonPlace.organisation,

    decrypted,
    entityKey: relPersonPlace.entityKey,
  };
};
