import { getCacheItemDefaultValue, setCacheItem } from "../services/dataManagement";
import { atom, selector } from "recoil";
import { looseUuidRegex } from "../utils";
import { toast } from "react-toastify";
import { capture } from "../services/sentry";

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
  if (!!checkRequiredFields) {
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
