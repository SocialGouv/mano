import { setCacheItem } from '../services/dataManagement';
import { atom } from 'recoil';

const collectionName = 'comment';
export const commentsState = atom({
  key: collectionName,
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
});

const encryptedFields = ['comment', 'date', 'urgent'];

export const prepareCommentForEncryption = (comment) => {
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
    person: comment.person,
    team: comment.team,
    user: comment.user,
    action: comment.action,

    decrypted,
    entityKey: comment.entityKey,
  };
};
