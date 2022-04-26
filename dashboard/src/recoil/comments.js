import localforage from 'localforage';
import { atom } from 'recoil';

const collectionName = 'comment';
export const commentsState = atom({
  key: collectionName,
  default: [],
  effects: [
    ({ onSet }) => {
      onSet(async (newValue) => {
        await localforage.setItem(collectionName, newValue);
      });
    },
  ],
});

const encryptedFields = ['comment', 'person', 'action', 'team', 'user', 'date'];

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
