import { setCacheItem } from '../services/dataManagement';
import { atom, selectorFamily } from 'recoil';

const collectionName = 'group';
export const groupsState = atom({
  key: collectionName,
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
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

export const prepareGroupForEncryption = (group, { checkRequiredFields = true } = {}) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = group[field];
  }
  return {
    _id: group._id,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    organisation: group.organisation,

    decrypted,
    entityKey: group.entityKey,
  };
};
