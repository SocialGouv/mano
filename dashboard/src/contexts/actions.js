import React, { useContext, useState } from 'react';
import API from '../services/api';
import { getData, useStorage } from '../services/dataManagement';
import { capture } from '../services/sentry';
import AuthContext from './auth';
import CommentsContext from './comments';

const ActionsContext = React.createContext({});

export const ActionsProvider = ({ children }) => {
  const { addComment, deleteComment, comments } = useContext(CommentsContext);
  const { user } = useContext(AuthContext);

  const [state, setState] = useState({ actionKey: 0, actions: [], loading: false });
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh-actions', 0);

  const setActions = (newActions) => {
    if (newActions) {
      setState(({ actionKey }) => ({
        actions: newActions,
        actionKey: actionKey + 1,
        loading: false,
      }));
    }
    setLastRefresh(Date.now());
  };

  const setBatchData = (newActions) =>
    setState(({ actions, ...oldState }) => ({
      ...oldState,
      actions: [...actions, ...newActions],
    }));

  const refreshActions = async (setProgress, initialLoad) => {
    setState((state) => ({ ...state, loading: true }));
    try {
      setActions(
        await getData({
          collectionName: 'action',
          data: state.actions,
          isInitialization: initialLoad,
          setProgress,
          lastRefresh,
          setBatchData,
        })
      );
      return true;
    } catch (e) {
      capture(e.message, { extra: { response: e.response } });
      setState((state) => ({ ...state, loading: false }));
      return false;
    }
  };

  const deleteAction = async (id) => {
    const res = await API.delete({ path: `/action/${id}` });
    if (res.ok) {
      setState(({ actionKey, actions, ...s }) => ({
        ...s,
        actionKey: actionKey + 1,
        actions: actions.filter((a) => a._id !== id),
      }));
      for (let comment of comments.filter((c) => c.action === id)) {
        await deleteComment(comment._id);
      }
    }
    return res;
  };

  const addAction = async (action) => {
    try {
      const response = await API.post({ path: '/action', body: prepareActionForEncryption(action) });
      if (response.ok) {
        setState(({ actions, actionKey, ...s }) => ({
          ...s,
          actionKey: actionKey + 1,
          actions: [response.decryptedData, ...actions],
        }));
      }
      return response;
    } catch (error) {
      capture('error in creating action' + error, { extra: { error, action } });
      return { ok: false, error: error.message };
    }
  };

  const updateAction = async (action, { oldAction = null } = {}) => {
    let response = null;
    if (!oldAction) oldAction = state.actions.find((a) => a._id === action._id);
    const statusChanged = action.status && oldAction.status !== action.status;
    try {
      if (statusChanged) {
        if ([DONE, CANCEL].includes(action.status)) {
          action.completedAt = new Date().toISOString();
        } else {
          action.completedAt = null;
        }
      }
      response = await API.put({
        path: `/action/${action._id}`,
        body: prepareActionForEncryption(action),
      });
      if (response.ok) {
        setState(({ actions, actionKey, ...s }) => ({
          ...s,
          actionKey: actionKey + 1,
          actions: actions.map((a) => {
            if (a._id === response.decryptedData._id) return response.decryptedData;
            return a;
          }),
        }));
      }
      return response;
    } catch (error) {
      capture(error, { extra: { message: 'error in updating action', action } });
      return { ok: false, error: error.message };
    } finally {
      if (response.ok) {
        const newAction = response.decryptedData;
        if (statusChanged) {
          const comment = {
            comment: `${user.name} a changé le status de l'action: ${mappedIdsToLabels.find((status) => status._id === newAction.status)?.name}`,
            type: 'action',
            item: oldAction._id,
            action: oldAction._id,
            team: oldAction.team,
          };
          const response = await addComment(comment);
          if (!response.ok) {
            capture(response.error, {
              extra: { message: 'error in creating comment for action update', action, comment },
            });
          }
        }
      }
    }
  };

  return (
    <ActionsContext.Provider
      value={{
        ...state,
        refreshActions,
        deleteAction,
        updateAction,
        addAction,
      }}>
      {children}
    </ActionsContext.Provider>
  );
};

export default ActionsContext;

const encryptedFields = ['category', 'categories', 'person', 'structure', 'name', 'description', 'withTime', 'team', 'user'];

export const prepareActionForEncryption = (action) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = action[field];
  }
  return {
    _id: action._id,
    organisation: action.organisation,
    createdAt: action.createdAt,
    updatedAt: action.updatedAt,

    completedAt: action.completedAt,
    dueAt: action.dueAt,
    status: action.status,

    decrypted,
    entityKey: action.entityKey,

    ...action,
  };
};

export const CHOOSE = 'CHOOSE';
export const TODO = 'A FAIRE';
export const DONE = 'FAIT';
export const CANCEL = 'ANNULEE';

export const mappedIdsToLabels = [
  { _id: TODO, name: 'À FAIRE' },
  { _id: DONE, name: 'FAITE' },
  { _id: CANCEL, name: 'ANNULÉE' },
];

const sortTodo = (a, b) => {
  if (!a.dueAt) return 1;
  if (!b.dueAt) return -1;
  if (a.dueAt > b.dueAt) return 1;
  return -1;
};

const sortDoneOrCancel = (a, b) => {
  if (!a.dueAt) return -1;
  if (!b.dueAt) return 1;
  if (a.dueAt > b.dueAt) return -1;
  return 1;
};

export const sortActions = (a, b) => {
  if (a.status === TODO && b.status !== TODO) return -1;
  if (a.status !== TODO && b.status === TODO) return 1;
  if (a.status === TODO && b.status === TODO) return sortTodo(a, b);
  if (a.status === DONE && b.status === DONE) return sortDoneOrCancel(a, b);
  if (a.status === CANCEL && b.status === CANCEL) return sortDoneOrCancel(a, b);
};

export const actionsCategories = [
  'Accompagnement Médical',
  'Accompagnement Social',
  'Accompagnement Juridique',
  'Accompagnement Autre',
  'Accompagnement Entretien',
  'Accompagnement dans les démarches',
  'Contact',
  'Consultation',
  'Démarche Sociale',
  'Démarche Médicale',
  'Démarche Juridique',
  'Distribution',
  'Entretien psychothérapeutique',
  'Entretien organisationnel',
  'Orientation',
  'Rappel de rdv',
  'Soins',
  'Travail avec partenaire social',
  'Travail avec partenaire sanitaire',
  'Travail avec partenaire autre',
  'Travail avec collaborateur bailleur',
  'Réunion de synthèse',
  'Visite Hôpital',
  'Visite Prison',
  'Visite Domicile',
  'Ramassage',
  'Informer',
  'Rechercher',
  'Explorer',
  'Signalement',
  'Médiation',
];
