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

export const prepareCommentForEncryption = (comment) => {
  try {
    const decrypted = {};
    if (!looseUuidRegex.test(comment.person) || !looseUuidRegex.test(comment.action)) {
      throw new Error('Comment is missing person or action');
    }
    if (!looseUuidRegex.test(comment.team)) {
      throw new Error('Comment is missing team');
    }
    if (!looseUuidRegex.test(comment.user)) {
      throw new Error('Comment is missing user');
    }
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
  } catch (error) {
    toast.error("Désolé, une erreur technique est survenue, l'équipe technique a été prévenue.");
    capture(error, { extra: { comment } });
    throw error;
  }
};
