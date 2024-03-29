import { getCacheItemDefaultValue, setCacheItem } from "../services/dataManagement";
import { atom, selector } from "recoil";
import { looseUuidRegex } from "../utils";
import { toast } from "react-toastify";
import { capture } from "../services/sentry";

const collectionName = "territory";
export const territoriesState = atom({
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

export const prepareTerritoryForEncryption = (territory, { checkRequiredFields = true } = {}) => {
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
  for (let field of encryptedFields) {
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

export const territoryTypes = [
  "Lieu de conso",
  "Lieu de deal",
  "Carrefour de passage",
  "Campement",
  "Lieu de vie",
  "Prostitution",
  "Errance",
  "Mendicité",
  "Loisir",
  "Rassemblement communautaire",
  "Historique",
];

const defaultSort = (a, b, sortOrder) => (sortOrder === "ASC" ? (a.name || "").localeCompare(b.name) : (b.name || "").localeCompare(a.name));

export const sortTerritories = (sortBy, sortOrder) => (a, b) => {
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
