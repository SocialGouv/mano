import { setCacheItem } from '../services/dataManagement';
import { atom } from 'recoil';

const collectionName = 'passage';
export const passagesState = atom({
  key: collectionName,
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
});

const encryptedFields = ['date', 'comment'];

export const preparePassageForEncryption = (passage) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = passage[field];
  }
  return {
    _id: passage._id,
    createdAt: passage.createdAt,
    updatedAt: passage.updatedAt,
    deletedAt: passage.deletedAt,
    organisation: passage.organisation,
    person: passage.person,
    team: passage.team,
    user: passage.user,

    decrypted,
    entityKey: passage.entityKey,
  };
};
