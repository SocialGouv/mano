import { atom } from 'recoil';
import { storage } from '../services/dataManagement';

export const commentsState = atom({
  key: 'commentsState',
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => storage.set('comment', JSON.stringify(newValue)))],
});

const encryptedFields = ['comment', 'person', 'action', 'team', 'user', 'date', 'urgent'];

export const prepareCommentForEncryption = (comment) => {
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
