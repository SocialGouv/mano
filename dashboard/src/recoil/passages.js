import { getCacheItemDefaultValue, setCacheItem } from "../services/dataManagement";
import { atom, selector } from "recoil";
import { looseUuidRegex } from "../utils";
import { toast } from "react-toastify";
import { capture } from "../services/sentry";
import { encryptItem } from "../services/encryption";

const collectionName = "passage";
export const passagesState = atom({
  key: collectionName,
  default: selector({
    key: "passage/default",
    get: async () => {
      const cache = await getCacheItemDefaultValue("passage", []);
      return cache;
    },
  }),
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
});

const encryptedFields = ["person", "team", "user", "date", "comment"];

export const preparePassageForEncryption = (passage, { checkRequiredFields = true } = {}) => {
  if (checkRequiredFields) {
    try {
      // we don't check the presence of a person because passage can be anonymous
      if (!looseUuidRegex.test(passage.team)) {
        throw new Error("Passage is missing team");
      }
      if (!looseUuidRegex.test(passage.user)) {
        throw new Error("Passage is missing user");
      }
      if (!passage.date) {
        throw new Error("Passage is missing date");
      }
    } catch (error) {
      toast.error(
        "Le passage n'a pas été sauvegardé car son format était incorrect. Vous pouvez vérifier son contenu et tenter de le sauvegarder à nouveau. L'équipe technique a été prévenue et va travailler sur un correctif."
      );
      capture(error);
      throw error;
    }
  }
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

    decrypted,
    entityKey: passage.entityKey,
  };
};

export async function encryptPassage(passage, { checkRequiredFields = true } = {}) {
  return encryptItem(preparePassageForEncryption(passage, { checkRequiredFields }));
}

export const sortPassages =
  (sortBy = "dueAt", sortOrder = "ASC") =>
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
