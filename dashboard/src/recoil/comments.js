import { getCacheItemDefaultValue, setCacheItem } from "../services/dataManagement";
import { atom, selector } from "recoil";
import { looseUuidRegex } from "../utils";
import { toast } from "react-toastify";
import { capture } from "../services/sentry";
import { encryptItem } from "../services/encryption";

const collectionName = "comment";
export const commentsState = atom({
  key: collectionName,
  default: selector({
    key: "comment/default",
    get: async () => {
      const cache = await getCacheItemDefaultValue("comment", []);
      return cache;
    },
  }),
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
});

const encryptedFields = ["comment", "person", "action", "group", "team", "user", "date", "urgent"];

export const prepareCommentForEncryption = (comment, { checkRequiredFields = true } = {}) => {
  if (checkRequiredFields) {
    try {
      if (!looseUuidRegex.test(comment.person) && !looseUuidRegex.test(comment.action)) {
        throw new Error("Comment is missing person or action");
      }
      if (!looseUuidRegex.test(comment.team)) {
        throw new Error("Comment is missing team");
      }
      if (!looseUuidRegex.test(comment.user)) {
        throw new Error("Comment is missing user");
      }
    } catch (error) {
      toast.error(
        "Le commentaire n'a pas été sauvegardé car son format était incorrect. Vous pouvez vérifier son contenu et tenter de le sauvegarder à nouveau. L'équipe technique a été prévenue et va travailler sur un correctif."
      );
      capture(error);
      throw error;
    }
  }
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = comment[field];
  }
  return {
    _id: comment._id,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    deletedAt: comment.deletedAt,
    organisation: comment.organisation,

    decrypted,
    entityKey: comment.entityKey,
  };
};

export async function encryptComment(comment, { checkRequiredFields = true } = {}) {
  return encryptItem(prepareCommentForEncryption(comment, { checkRequiredFields }));
}

export const sortComments = (_sortBy, sortOrder) => (a, b) => {
  // sortBy is always `date` for now
  return sortOrder === "ASC" ? new Date(b.date).getTime() - new Date(a.date).getTime() : new Date(a.date).getTime() - new Date(b.date).getTime();
};
