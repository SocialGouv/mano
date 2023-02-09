import { atom } from 'recoil';
import { storage } from '../services/dataManagement';
import { looseUuidRegex } from '../utils/regex';
import { capture } from '../services/sentry';
import { Alert } from 'react-native';

export const commentsState = atom({
  key: 'commentsState',
  default: JSON.parse(storage.getString('comment') || '[]'),
  effects: [({ onSet }) => onSet(async (newValue) => storage.set('comment', JSON.stringify(newValue)))],
});

const encryptedFields = ['comment', 'person', 'group', 'action', 'team', 'user', 'date', 'urgent'];

export const prepareCommentForEncryption = (comment) => {
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
    Alert.alert(
      "Le commentaire n'a pas été sauvegardé car son format était incorrect.",
      "Vous pouvez vérifier son contenu et tenter de le sauvegarder à nouveau. L'équipe technique a été prévenue et va travailler sur un correctif."
    );
    capture(error, { extra: { comment } });
    throw error;
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
