import { atom } from 'recoil';
import { storage } from '../services/dataManagement';

export const passagesState = atom({
  key: 'passagesState',
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => storage.set('passage', JSON.stringify(newValue)))],
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
