import { atom, useRecoilState } from 'recoil';
import API from '../services/api';
import { getData, useStorage } from '../services/dataManagement';
import { capture } from '../services/sentry';

export const commentsState = atom({
  key: 'commentsState',
  default: [],
});

export const useComments = () => {
  const [comments, setComments] = useRecoilState(commentsState);
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh-comments', 0);

  const setCommentsFullState = (newComments) => {
    if (newComments) setComments(newComments);
    setLastRefresh(Date.now());
  };
  const setBatchData = (newActions) => setComments((actions) => [...actions, ...newActions]);

  const refreshComments = async (setProgress, initialLoad) => {
    try {
      setCommentsFullState(
        await getData({
          collectionName: 'comment',
          data: comments,
          isInitialization: initialLoad,
          setProgress,
          setBatchData,
          lastRefresh,
          API,
        })
      );
      return true;
    } catch (e) {
      capture(e.message, { extra: { response: e.response } });
      return false;
    }
  };

  return refreshComments;
};

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

    ...comment,
  };
};
