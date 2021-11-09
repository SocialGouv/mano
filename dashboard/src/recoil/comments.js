/* eslint-disable react-hooks/exhaustive-deps */
import { atom, selector, useRecoilState } from 'recoil';
import useAuth from '../recoil/auth';
import useApi from '../services/api-interface-with-dashboard';
import { getData, useStorage } from '../services/dataManagement';
import { capture } from '../services/sentry';

export const commentsState = atom({
  key: 'commentsState',
  default: [],
});

export const commentsLoadingState = atom({
  key: 'commentsLoadingState',
  default: true,
});

export const prepareCommentsForEncryption = selector({
  key: 'prepareCommentsForEncryption',
  get: ({ get }) => get(commentsState).map(prepareCommentForEncryption),
});

export const useComments = () => {
  const { currentTeam, organisation, user } = useAuth();
  const API = useApi();

  const [comments, setComments] = useRecoilState(commentsState);
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh-comments', 0);
  const [loading, setLoading] = useRecoilState(commentsLoadingState);

  const setCommentsFullState = (newComments) => {
    if (newComments) setComments(newComments);
    setLoading(false);
    setLastRefresh(Date.now());
  };
  const setBatchData = (newActions) => setComments((actions) => [...actions, ...newActions]);

  const refreshComments = async (setProgress, initialLoad) => {
    setLoading(true);
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
      setLoading(false);
      capture(e.message, { extra: { response: e.response } });
      return false;
    }
  };

  const deleteComment = async (id) => {
    const res = await API.delete({ path: `/comment/${id}` });
    if (res.ok) setComments((comments) => comments.filter((p) => p._id !== id));
    return res;
  };

  const addComment = async (body) => {
    try {
      if (!body.user) body.user = user._id;
      if (!body.team) body.team = currentTeam._id;
      if (!body.organisation) body.organisation = organisation._id;
      const response = await API.post({ path: '/comment', body: prepareCommentForEncryption(body) });
      if (response.ok) setComments((comments) => [response.decryptedData, ...comments]);
      return response;
    } catch (error) {
      capture('error in creating comment' + error, { extra: { error, body } });
      return { ok: false, error: error.message };
    }
  };
  const updateComment = async (comment) => {
    try {
      const response = await API.put({
        path: `/comment/${comment._id}`,
        body: prepareCommentForEncryption(comment),
      });
      if (response.ok) {
        setComments((comments) =>
          comments.map((c) => {
            if (c._id === comment._id) return response.decryptedData;
            return c;
          })
        );
      }
      return response;
    } catch (error) {
      console.error('error in updating comment', error);
      return { ok: false, error: error.message };
    }
  };

  return {
    loading,
    comments,
    refreshComments,
    deleteComment,
    addComment,
    updateComment,
  };
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
