import { getCacheItemDefaultValue, setCacheItem } from "../services/dataManagement";
import { atom, selector } from "recoil";
import { looseUuidRegex } from "../utils";
import { encryptItem } from "../services/encryption";
import { toast } from "react-toastify";
import { capture } from "../services/sentry";
import type { TerritoryInstance, ReadyToEncryptTerritoryInstance } from "../types/territory";
import type { PredefinedField } from "../types/field";
import { organisationState } from "./auth";

const collectionName = "territory";
export const territoriesState = atom<Array<TerritoryInstance>>({
  key: collectionName,
  default: selector({
    key: "territory/default",
    get: async () => {
      const cache = await getCacheItemDefaultValue("territory", []);
      return cache;
    },
  }),
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
});

const encryptedFields = ["name", "perimeter", "description", "types", "user"];

export const prepareTerritoryForEncryption = (territory: TerritoryInstance, { checkRequiredFields = true } = {}): ReadyToEncryptTerritoryInstance => {
  if (checkRequiredFields) {
    try {
      if (!territory.name) {
        throw new Error("Territory is missing name");
      }
      if (!looseUuidRegex.test(territory.user)) {
        throw new Error("Territory is missing user");
      }
    } catch (error) {
      toast.error(
        "Le territoire n'a pas été sauvegardé car son format était incorrect. Vous pouvez vérifier son contenu et tenter de le sauvegarder à nouveau. L'équipe technique a été prévenue et va travailler sur un correctif."
      );
      capture(error);
      throw error;
    }
  }
  const decrypted = {};
  for (const field of encryptedFields) {
    decrypted[field] = territory[field];
  }
  return {
    _id: territory._id,
    createdAt: territory.createdAt,
    updatedAt: territory.updatedAt,
    deletedAt: territory.deletedAt,
    organisation: territory.organisation,

    decrypted,
    entityKey: territory.entityKey,
  };
};

export async function encryptTerritory(territory: TerritoryInstance, { checkRequiredFields = true } = {}) {
  return encryptItem(prepareTerritoryForEncryption(territory, { checkRequiredFields }));
}

type SortOrder = "ASC" | "DESC";

type SortBy = "name" | "createdAt" | "types" | "perimeter";

const defaultSort = (a: TerritoryInstance, b: TerritoryInstance, sortOrder: SortOrder) =>
  sortOrder === "ASC" ? (a.name || "").localeCompare(b.name) : (b.name || "").localeCompare(a.name);

export const sortTerritories = (sortBy: SortBy, sortOrder: SortOrder) => (a: TerritoryInstance, b: TerritoryInstance) => {
  if (sortBy === "types") {
    if (!a.types?.length && !b.types?.length) return defaultSort(a, b, sortOrder);
    if (!a.types?.length) return sortOrder === "ASC" ? 1 : -1;
    if (!b.types?.length) return sortOrder === "ASC" ? -1 : 1;
    const aTypes = a.types.join(" ");
    const bTypes = b.types.join(" ");
    return sortOrder === "ASC" ? aTypes.localeCompare(bTypes) : bTypes.localeCompare(aTypes);
  }
  if (sortBy === "perimeter") {
    if (!a.perimeter?.length && !b.perimeter?.length) return defaultSort(a, b, sortOrder);
    if (!a.perimeter?.length) return sortOrder === "ASC" ? 1 : -1;
    if (!b.perimeter?.length) return sortOrder === "ASC" ? -1 : 1;
    return sortOrder === "ASC" ? a.perimeter.localeCompare(b.perimeter) : b.perimeter.localeCompare(a.perimeter);
  }
  if (sortBy === "createdAt") {
    if (a.createdAt > b.createdAt) return sortOrder === "ASC" ? 1 : -1;
    if (a.createdAt < b.createdAt) return sortOrder === "ASC" ? -1 : 1;
    return defaultSort(a, b, sortOrder);
  }
  // default sort: name
  return defaultSort(a, b, sortOrder);
};

export const territoriesFields = (territoriesTypes: Array<string>): Array<PredefinedField> => [
  {
    name: "name",
    label: "Nom",
    type: "text",
    encrypted: true,
    importable: true,
    filterable: true,
    enabled: true,
  },
  {
    name: "perimeter",
    label: "Périmètre",
    type: "text",
    encrypted: true,
    importable: true,
    filterable: true,
    enabled: true,
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    encrypted: true,
    importable: true,
    filterable: true,
    enabled: true,
  },
  {
    name: "types",
    label: "Types",
    type: "multi-choice",
    options: territoriesTypes,
    encrypted: true,
    importable: true,
    filterable: true,
    enabled: true,
  },
];

export const territoriesTypesSelector = selector({
  key: "territoriesTypesSelector",
  get: ({ get }) => {
    const organisation = get(organisationState);
    return organisation.territoriesGroupedTypes;
  },
});

export const flattenedTerritoriesTypesSelector = selector({
  key: "flattenedTerritoriesTypesSelector",
  get: ({ get }) => {
    const territoriesGroupedTypes = get(territoriesTypesSelector);
    return territoriesGroupedTypes.reduce((allTypes, { types }) => [...allTypes, ...types], []);
  },
});
