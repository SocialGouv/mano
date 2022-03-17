/* eslint-disable react-hooks/exhaustive-deps */
import { atom, useRecoilState, useRecoilValue } from 'recoil';
import { currentTeamState, organisationState, userState } from '../recoil/auth';
import useApi from '../services/api';
import { capture } from '../services/sentry';

export const commentsState = atom({
  key: 'commentsState',
  default: [],
});

export const useComments = () => {
  const currentTeam = useRecoilValue(currentTeamState);
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const API = useApi();

  const [comments, setComments] = useRecoilState(commentsState);

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
    comments,
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
  };
};
