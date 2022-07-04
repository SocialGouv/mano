import { setCacheItem } from '../services/dataManagement';
import { atom } from 'recoil';

const collectionName = 'relPersonPlace';
export const relsPersonPlaceState = atom({
  key: collectionName,
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
});

// const encryptedFields = [];

export const prepareRelPersonPlaceForEncryption = (relPersonPlace) => {
  const decrypted = {};
  // for (let field of encryptedFields) {
  //   decrypted[field] = relPersonPlace[field];
  // }
  return {
    _id: relPersonPlace._id,
    createdAt: relPersonPlace.createdAt,
    updatedAt: relPersonPlace.updatedAt,
    organisation: relPersonPlace.organisation,
    user: relPersonPlace.user,
    person: relPersonPlace.person,
    place: relPersonPlace.place,

    decrypted,
    entityKey: relPersonPlace.entityKey,
  };
};
