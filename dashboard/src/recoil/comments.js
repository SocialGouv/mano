/* eslint-disable react-hooks/exhaustive-deps */
import { atom } from 'recoil';

export const commentsState = atom({
  key: 'commentsState',
  default: [],
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
