import { getCacheItemDefaultValue, setCacheItem } from "../services/dataManagement";
import { atom, selector, selectorFamily } from "recoil";
import type { GroupInstance } from "../types/group";
import type { UUIDV4 } from "../types/uuid";
import { encryptItem } from "../services/encryption";

const collectionName = "group";
export const groupsState = atom<GroupInstance[]>({
  key: collectionName,
  default: selector({
    key: "group/default",
    get: async () => {
      const cache = await getCacheItemDefaultValue("group", []);
      return cache;
    },
  }),
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
});

export const groupSelector = selectorFamily({
  key: "groupSelector",
  get:
    ({ personId }: { personId: UUIDV4 }) =>
    ({ get }) => {
      const groups = get(groupsState);
      return groups.find((group) => group?.persons?.includes?.(personId)) || { persons: [], relations: [] };
    },
});

const encryptedFields: Array<keyof GroupInstance> = ["persons", "relations"];

export const prepareGroupForEncryption = (group: GroupInstance) => {
  const decrypted: any = {};

  for (const field of encryptedFields) {
    decrypted[field] = group[field];
  }

  return {
    _id: group._id,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    deletedAt: group.deletedAt,
    organisation: group.organisation,

    decrypted,
    entityKey: group.entityKey,
  };
};

export async function encryptGroup(group: GroupInstance) {
  return encryptItem(prepareGroupForEncryption(group));
}
