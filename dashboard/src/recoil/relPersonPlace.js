import { getCacheItemDefaultValue, setCacheItem } from "../services/dataManagement";
import { atom, selector } from "recoil";
import { looseUuidRegex } from "../utils";
import { toast } from "react-toastify";
import { capture } from "../services/sentry";

const collectionName = "relPersonPlace";
export const relsPersonPlaceState = atom({
  key: collectionName,
  default: selector({
    key: "relPersonPlace/default",
    get: async () => {
      const cache = await getCacheItemDefaultValue("relPersonPlace", []);
      return cache;
    },
  }),
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
});

const encryptedFields = ["place", "person", "user"];

export const prepareRelPersonPlaceForEncryption = (relPersonPlace, { checkRequiredFields = true } = {}) => {
  if (checkRequiredFields) {
    try {
      if (!looseUuidRegex.test(relPersonPlace.person)) {
        throw new Error("RelPersonPlace is missing person");
      }
      if (!looseUuidRegex.test(relPersonPlace.place)) {
        throw new Error("RelPersonPlace is missing place");
      }
      if (!looseUuidRegex.test(relPersonPlace.user)) {
        throw new Error("RelPersonPlace is missing user");
      }
    } catch (error) {
      toast.error(
        "Le lieu n'a pas été sauvegardé car son format était incorrect. Vous pouvez vérifier son contenu et tenter de le sauvegarder à nouveau. L'équipe technique a été prévenue et va travailler sur un correctif."
      );
      capture(error);
      throw error;
    }
  }
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = relPersonPlace[field];
  }
  return {
    _id: relPersonPlace._id,
    createdAt: relPersonPlace.createdAt,
    updatedAt: relPersonPlace.updatedAt,
    deletedAt: relPersonPlace.deletedAt,
    organisation: relPersonPlace.organisation,

    decrypted,
    entityKey: relPersonPlace.entityKey,
  };
};
