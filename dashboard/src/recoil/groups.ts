import { setCacheItem } from '../services/dataManagement';
import { atom, selectorFamily } from 'recoil';
import type { GroupInstance, GroupToBeEncrypted, EncryptedGroupFields, EncryptedGroupKeys } from '../types/group';
import type { UUIDV4 } from '../types/uuid';

const collectionName = 'group';
export const groupsState = atom<GroupInstance[]>({
  key: collectionName,
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
});

export const groupSelector = selectorFamily({
  key: 'groupSelector',
  get:
    ({ personId }: { personId: UUIDV4 }) =>
    ({ get }) => {
      const groups = get(groupsState);
      return groups.find((group) => group?.persons?.includes?.(personId)) || { persons: [], relations: [] };
    },
});

const encryptedFields: Array<keyof GroupInstance> = ['persons', 'relations'];

export const prepareGroupForEncryption = (group: GroupInstance) => {
  const decrypted: any = {};

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
