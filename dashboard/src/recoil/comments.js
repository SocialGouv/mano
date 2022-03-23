/* eslint-disable react-hooks/exhaustive-deps */
import { atom } from 'recoil';
import { writeCollection } from '../services/dataManagement';

export const commentsState = atom({
  key: 'commentsState',
  default: [],
  effects: [
    ({ onSet }) => {
      onSet((newValue) => {
        writeCollection('comment', newValue);
      });
    },
  ],
});

const encryptedFields = ['comment', 'type', 'item', 'person', 'action', 'team', 'user'];

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
