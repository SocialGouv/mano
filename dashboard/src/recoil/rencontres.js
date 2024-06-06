import { getCacheItemDefaultValue, setCacheItem } from "../services/dataManagement";
import { atom, selector } from "recoil";
import { looseUuidRegex } from "../utils";
import { toast } from "react-toastify";
import { capture } from "../services/sentry";
import { encryptItem } from "../services/encryption";

const collectionName = "rencontre";
export const rencontresState = atom({
  key: collectionName,
  default: selector({
    key: "rencontre/default",
    get: async () => {
      const cache = await getCacheItemDefaultValue("rencontre", []);
      return cache;
    },
  }),
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
});

const encryptedFields = ["person", "team", "user", "date", "observation", "comment"];

export const prepareRencontreForEncryption = (rencontre, { checkRequiredFields = true } = {}) => {
  if (checkRequiredFields) {
    try {
      if (!looseUuidRegex.test(rencontre.person)) {
        throw new Error("Rencontre is missing person");
      }
      if (!looseUuidRegex.test(rencontre.team)) {
        throw new Error("Rencontre is missing team");
      }
      if (!looseUuidRegex.test(rencontre.user)) {
        throw new Error("Rencontre is missing user");
      }
      if (!rencontre.date) {
        throw new Error("Rencontre is missing date");
      }
    } catch (error) {
      toast.error(
        "La rencontre n'a pas été sauvegardée car son format était incorrect. Vous pouvez vérifier son contenu et tenter de la sauvegarder à nouveau. L'équipe technique a été prévenue et va travailler sur un correctif."
      );
      capture(error);
      throw error;
    }
  }
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = rencontre[field];
  }
  return {
    _id: rencontre._id,
    createdAt: rencontre.createdAt,
    updatedAt: rencontre.updatedAt,
    deletedAt: rencontre.deletedAt,
    organisation: rencontre.organisation,

    decrypted,
    entityKey: rencontre.entityKey,
  };
};

export async function encryptRencontre(rencontre, { checkRequiredFields = true } = {}) {
  return encryptItem(prepareRencontreForEncryption(rencontre, { checkRequiredFields }));
}

export const sortRencontres =
  (sortBy = "date", sortOrder = "ASC") =>
  (a, b) => {
    const defaultSort = (a, b) =>
      sortOrder === "ASC" ? new Date(b.date).getTime() - new Date(a.date).getTime() : new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === "date") {
      return defaultSort(a, b);
    }
    if (sortBy === "person") {
      if (!a.personPopulated && !b.personPopulated) return defaultSort(a, b);
      if (!a.personPopulated) return sortOrder === "ASC" ? 1 : -1;
      if (!b.personPopulated) return sortOrder === "ASC" ? -1 : 1;
      return sortOrder === "ASC"
        ? a.personPopulated.name.localeCompare(b.personPopulated.name)
        : b.personPopulated.name.localeCompare(a.personPopulated.name);
    }
    if (sortBy === "user") {
      if (!a.userPopulated && !b.userPopulated) return defaultSort(a, b);
      if (!a.userPopulated) return sortOrder === "ASC" ? 1 : -1;
      if (!b.userPopulated) return sortOrder === "ASC" ? -1 : 1;
      return sortOrder === "ASC"
        ? a.userPopulated.name.localeCompare(b.userPopulated.name)
        : b.userPopulated.name.localeCompare(a.userPopulated.name);
    }
    if (sortBy === "comment") {
      if (!a.comment) return sortOrder === "ASC" ? 1 : -1;
      if (!b.comment) return sortOrder === "ASC" ? -1 : 1;
      return sortOrder === "ASC" ? a.comment.localeCompare(b.comment) : b.comment.localeCompare(a.comment);
    }
    return a[sortBy] > b[sortBy] ? 1 : -1;
  };
