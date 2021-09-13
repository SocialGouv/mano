/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useState } from 'react';
import API from '../services/api';
import { mergeNewUpdatedData } from '../services/dataManagement';
import { capture } from '../services/sentry';
import AuthContext from './auth';

const CommentsContext = React.createContext();

export const CommentsProvider = ({ children }) => {
  const { currentTeam, organisation, user } = useContext(AuthContext);

  const [state, setState] = useState({ commentKey: 0, comments: [], encrypted: [], loading: false, lastRefresh: undefined });

  const setComments = (newComments, encrypted) =>
    setState(({ commentKey }) => ({
      comments: newComments,
      encrypted,
      commentKey: commentKey + 1,
      loading: false,
      lastRefresh: Date.now(),
    }));

  const setBatchData = (newComments) =>
    setState(({ comments, ...oldState }) => ({
      ...oldState,
      comments: [...comments, ...newComments],
    }));

  const refreshComments = async (setProgress, initialLoad) => {
    setState((state) => ({ ...state, loading: true }));
    if (!!initialLoad && !state.lastRefresh) {
      const response = await API.get({ path: '/comment', batch: 1000, setProgress, setBatchData });
      if (!response.ok) {
        capture('error getting comments', { extra: { response } });
        setState((state) => ({ ...state, loading: false }));
        return false;
      }
      setComments(response.decryptedData, response.data);
      return true;
    }
    const response = await API.get({ path: '/comment', query: { lastRefresh: state.lastRefresh } });
    if (!response.ok) {
      capture('error refreshing comments', { extra: { response } });
      return setState((state) => ({ ...state, loading: false }));
    }
    if (response.decryptedData) {
      setComments(mergeNewUpdatedData(response.decryptedData, state.comments), mergeNewUpdatedData(response.data, state.encrypted));
    }
  };

  const deleteComment = async (id) => {
    const res = await API.delete({ path: `/comment/${id}` });
    if (res.ok) {
      setState(({ comments, commentKey, ...s }) => ({
        ...s,
        commentKey: commentKey + 1,
        comments: comments.filter((p) => p._id !== id),
      }));
    }
    return res;
  };

  const addComment = async (body) => {
    try {
      if (!body.user) body.user = user._id;
      if (!body.team) body.team = currentTeam._id;
      if (!body.organisation) body.organisation = organisation._id;
      const response = await API.post({ path: '/comment', body: prepareCommentForEncryption(body) });
      if (response.ok) {
        setState(({ comments, encrypted, commentKey, s }) => ({
          ...s,
          commentKey: commentKey + 1,
          comments: [response.decryptedData, ...comments],
          encrypted: [response.data, ...encrypted],
        }));
      }
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
        setState(({ comments, commentKey, encrypted, ...s }) => ({
          ...s,
          commentKey: commentKey + 1,
          comments: comments.map((c) => {
            if (c._id === comment._id) return response.decryptedData;
            return c;
          }),
          encrypted: encrypted.map((c) => {
            if (c._id === comment._id) return response.data;
            return c;
          }),
        }));
      }
      return response;
    } catch (error) {
      console.error('error in updating comment', error);
      return { ok: false, error: error.message };
    }
  };

  return (
    <CommentsContext.Provider
      value={{
        ...state,
        prepareCommentsForEncryption: state.comments.map(prepareCommentForEncryption),
        refreshComments,
        deleteComment,
        addComment,
        updateComment,
      }}>
      {children}
    </CommentsContext.Provider>
  );
};

export default CommentsContext;

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
