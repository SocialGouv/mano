import { setCacheItem } from '../services/dataManagement';
import { atom } from 'recoil';
import { looseUuidRegex } from '../utils';
import { toast } from 'react-toastify';
import { capture } from '../services/sentry';

const collectionName = 'comment';
export const commentsState = atom({
  key: collectionName,
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
});

const encryptedFields = ['comment', 'person', 'action', 'group', 'team', 'user', 'date', 'urgent'];

export const prepareCommentForEncryption = (comment, { checkRequiredFields = true } = {}) => {
  if (!!checkRequiredFields) {
    try {
      if (!looseUuidRegex.test(comment.person) && !looseUuidRegex.test(comment.action)) {
        throw new Error('Comment is missing person or action');
      }
      if (!looseUuidRegex.test(comment.team)) {
        throw new Error('Comment is missing team');
      }
      if (!looseUuidRegex.test(comment.user)) {
        throw new Error('Comment is missing user');
      }
    } catch (error) {
      toast.error(
        "Le commentaire n'a pas été sauvegardé car son format était incorrect. Vous pouvez vérifier son contenu et tenter de le sauvegarder à nouveau. L'équipe technique a été prévenue et va travailler sur un correctif."
      );
      capture(error, { extra: { comment } });
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
    organisation: comment.organisation,

    decrypted,
    entityKey: comment.entityKey,
  };
};