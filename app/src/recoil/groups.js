import { atom, selectorFamily } from 'recoil';
import { storage } from '../services/dataManagement';

export const groupsState = atom({
  key: 'groupsState',
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => storage.set('group', JSON.stringify(newValue)))],
});

export const groupSelector = selectorFamily({
  key: 'groupSelector',
  get:
    ({ personId }) =>
    ({ get }) => {
      const groups = get(groupsState);
      return groups.find((group) => group?.persons?.includes?.(personId)) || { persons: [], relations: [] };
    },
});

const encryptedFields = ['persons', 'relations'];

// @type Relation: { persons: uuid[], description: string, createdAt: Date, updatedAt: Date, user: uuid };

export const prepareGroupForEncryption = (report) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = report[field];
  }
  return {
    _id: report._id,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    organisation: report.organisation,

    decrypted,
    entityKey: report.entityKey,
  };
};
