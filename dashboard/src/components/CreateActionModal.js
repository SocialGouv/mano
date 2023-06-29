import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useHistory } from 'react-router-dom';
import { actionsState, CANCEL, DONE, mappedIdsToLabels, prepareActionForEncryption, TODO } from '../recoil/actions';
import { currentTeamState, organisationState, teamsState, userState } from '../recoil/auth';
import { dayjsInstance, now, outOfBoundariesDate } from '../services/date';
import API from '../services/api';

import SelectPerson from './SelectPerson';
import SelectStatus from './SelectStatus';
import useCreateReportAtDateIfNotExist from '../services/useCreateReportAtDateIfNotExist';
import { commentsState, prepareCommentForEncryption } from '../recoil/comments';
import ActionsCategorySelect from './tailwind/ActionsCategorySelect';
import { groupsState } from '../recoil/groups';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from './tailwind/Modal';
import SelectTeamMultiple from './SelectTeamMultiple';
import DatePicker from './DatePicker';
import AutoResizeTextarea from './AutoresizeTextArea';
import { useDataLoader } from './DataLoader';
import { CommentsModule } from './CommentsGeneric';

export default function ActionModal({ open, onClose, personId, action, completedAt, dueAt }) {
  return (
    <ModalContainer open={open} size="3xl">
      <ActionContent key={open} personId={personId} action={action} completedAt={completedAt} dueAt={dueAt} onClose={onClose} />
    </ModalContainer>
  );
}

const ActionContent = ({ open, onClose, action, personId = null, personIds = null, isMulti = false, completedAt = null, dueAt = null }) => {
  const teams = useRecoilValue(teamsState);
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const currentTeam = useRecoilValue(currentTeamState);
  const setActions = useSetRecoilState(actionsState);
  const groups = useRecoilValue(groupsState);
  const setComments = useSetRecoilState(commentsState);
  const history = useHistory();
  const createReportAtDateIfNotExist = useCreateReportAtDateIfNotExist();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refresh } = useDataLoader();

  const initialState = useMemo(() => {
    if (action) return action;
    return {
      _id: null,
      dueAt: dueAt || (!!completedAt ? new Date(completedAt) : new Date()),
      withTime: false,
      completedAt,
      status: !!completedAt ? DONE : TODO,
      teams: teams.length === 1 ? [teams[0]._id] : [],
      user: user._id,
      person: isMulti ? personIds : personId,
      organisation: organisation._id,
      categories: [],
      name: '',
      description: '',
      urgent: false,
      group: false,
      createdAt: new Date(),
      comment: '',
      commentUrgent: false,
    };
  }, [organisation._id, personId, user._id, action, dueAt, completedAt, teams, isMulti, personIds]);

  const [data, setData] = useState(initialState);
  const isNewAction = !data._id;
  useEffect(() => {
    setData(initialState);
  }, [initialState]);

  const [activeTab, setActiveTab] = useState('Informations');
  const isOnePerson = typeof data?.person === 'string' || data?.person?.length === 1;
  const onlyPerson = !isOnePerson ? null : typeof data?.person === 'string' ? data.person : data.person?.[0];
  const canToggleGroupCheck = !!organisation.groupsEnabled && !!onlyPerson && groups.find((group) => group.persons.includes(onlyPerson));

  const handleChange = (event) => {
    const target = event.currentTarget || event.target;
    const { name, value } = target;
    setData((data) => ({ ...data, [name]: value }));
  };

  const handleCreateAction = async (body) => {
    const handlePostNewAction = async (body) => {
      if (body.status !== TODO) body.completedAt = body.completedAt || Date.now();
      const response = await API.post({ path: '/action', body: prepareActionForEncryption(body) });
      if (response.ok) setActions((actions) => [response.decryptedData, ...actions]);
      const { createdAt } = response.decryptedData;
      await createReportAtDateIfNotExist(createdAt);
      if (!!completedAt) {
        if (dayjsInstance(completedAt).format('YYYY-MM-DD') !== dayjsInstance(createdAt).format('YYYY-MM-DD')) {
          await createReportAtDateIfNotExist(completedAt);
        }
      }
      return response;
    };
    let actionsId = [];
    // What is this strange case?
    if (typeof data.person === 'string') {
      body.person = data.person;
      const res = await handlePostNewAction(body);
      setIsSubmitting(false);
      if (res.ok) {
        toast.success('Création réussie !');
        onClose();
        actionsId.push(res.decryptedData._id);
      }
    } else if (data.person.length === 1) {
      body.person = data.person[0];
      const res = await handlePostNewAction(body);
      setIsSubmitting(false);
      if (res.ok) {
        toast.success('Création réussie !');
        onClose();
        actionsId.push(res.decryptedData._id);
      }
    } else {
      for (const person of data.person) {
        const res = await handlePostNewAction({ ...body, person });
        if (!res.ok) break;
        actionsId.push(res.decryptedData._id);
      }
      setIsSubmitting(false);
      toast.success('Création réussie !');
      onClose();
    }
    // Then, save the comment if present.
    if (data.comment.trim()) {
      const commentBody = {
        comment: data.comment,
        urgent: data.commentUrgent,
        user: user._id,
        date: new Date(),
        team: currentTeam._id,
        organisation: organisation._id,
      };
      // There can be multiple actions, so we need to save the comment for each action.
      const commentsToAdd = [];
      for (const actionId of actionsId) {
        const response = await API.post({
          path: '/comment',
          body: prepareCommentForEncryption({ ...commentBody, action: actionId }),
        });
        if (response.ok) commentsToAdd.push(response.decryptedData);
        else toast.error('Erreur lors de la création du commentaire');
      }
    }
    refresh();
  };

  const handleDuplicate = async () => {
    const { name, person, dueAt, withTime, description, categories, urgent, teams } = data;
    const response = await API.post({
      path: '/action',
      body: prepareActionForEncryption({
        name,
        person,
        teams,
        user: user._id,
        dueAt,
        withTime,
        status: TODO,
        description,
        categories,
        urgent,
      }),
    });
    if (!response.ok) {
      return;
    }
    setActions((actions) => [response.decryptedData, ...actions]);
    for (let c of action.comments.filter((c) => c.action === action._id).filter((c) => !c.comment.includes('a changé le status'))) {
      const body = {
        comment: c.comment,
        action: response.decryptedData._id,
        user: c.user || user._id,
        team: c.team || currentTeam._id,
        organisation: c.organisation,
      };
      const res = await API.post({ path: '/comment', body: prepareCommentForEncryption(body) });
      if (res.ok) {
        setComments((comments) => [res.decryptedData, ...comments]);
      }
    }
    history.replace(`/action/${response.decryptedData._id}`);
  };

  const HandleDelete = async () => {
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
      const actionRes = await API.delete({ path: `/action/${action._id}` });
      if (actionRes.ok) {
        setActions((actions) => actions.filter((a) => a._id !== action._id));
        for (let comment of action.comments) {
          const commentRes = await API.delete({ path: `/comment/${comment._id}` });
          if (commentRes.ok) setComments((comments) => comments.filter((c) => c._id !== comment._id));
        }
      }
      if (!actionRes.ok) return;
      toast.success('Suppression réussie');
      history.goBack();
    }
  };

  const handleUpdateAction = async (body) => {
    body.teams = Array.isArray(body.teams) ? body.teams : [body.team];
    if (!body.teams?.length) return toast.error('Une action doit être associée à au moins une équipe.');
    const statusChanged = body.status && action.status !== body.status;
    if (statusChanged) {
      if ([DONE, CANCEL].includes(body.status)) {
        // When status changed to finished (done, cancel) completedAt we set it to now if not set.
        body.completedAt = body.completedAt || now();
      } else {
        // When status just changed to "todo" we set completedAt to null (since it's not done yet).
        body.completedAt = null;
      }
    }
    if (body.completedAt && outOfBoundariesDate(body.completedAt)) return toast.error('La date de complétion est hors limites (entre 1900 et 2100)');
    if (body.dueAt && outOfBoundariesDate(body.dueAt)) return toast.error("La date d'échéance est hors limites (entre 1900 et 2100)");
    if (!body.dueAt) body.dueAt = body.completedAt || new Date();

    delete body.team;
    const actionResponse = await API.put({
      path: `/action/${body._id}`,
      body: prepareActionForEncryption({ ...body, user: body.user || user._id }),
    });
    if (actionResponse.ok) {
      const newAction = actionResponse.decryptedData;
      setActions((actions) =>
        actions.map((a) => {
          if (a._id === newAction._id) return newAction;
          return a;
        })
      );
      await createReportAtDateIfNotExist(newAction.createdAt);
      if (!!newAction.completedAt) {
        if (dayjsInstance(newAction.completedAt).format('YYYY-MM-DD') !== dayjsInstance(newAction.createdAt).format('YYYY-MM-DD')) {
          await createReportAtDateIfNotExist(newAction.completedAt);
        }
      }
      if (statusChanged) {
        const comment = {
          comment: `${user.name} a changé le status de l'action: ${mappedIdsToLabels.find((status) => status._id === newAction.status)?.name}`,
          action: action._id,
          team: currentTeam._id,
          user: user._id,
          organisation: organisation._id,
        };
        const commentResponse = await API.post({ path: '/comment', body: prepareCommentForEncryption(comment) });
        if (commentResponse.ok) setComments((comments) => [commentResponse.decryptedData, ...comments]);
      }
      toast.success('Mise à jour !');
      refresh();
      const actionCancelled = action.status !== CANCEL && body.status === CANCEL;
      if (actionCancelled && window.confirm('Cette action est annulée, voulez-vous la dupliquer ? Avec une date ultérieure par exemple')) {
        handleDuplicate();
      }
    }
  };

  return (
    <ModalContainer open={open} onClose={onClose} size="3xl">
      <ModalHeader title={isNewAction ? 'Créer une nouvelle action' : "Modifier l'action"} onClose={onClose} />
      <ModalBody className="tw-px-4 tw-py-2">
        <form
          id="create-action-modal-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!data.name) return toast.error('Le nom est obligatoire');
            if (!data.teams?.length) return toast.error('Une action doit être associée à au moins une équipe');
            if (!isMulti && !data.person) return toast.error('La personne suivie est obligatoire');
            if (isMulti && !data.person?.length) return toast.error('Une personne suivie est obligatoire');
            if (!data.dueAt) return toast.error("La date d'échéance est obligatoire");
            if (outOfBoundariesDate(data.dueAt)) return toast.error("La date d'échéance est hors limites (entre 1900 et 2100)");
            if (data.completedAt && outOfBoundariesDate(data.completedAt))
              return toast.error('La date de complétion est hors limites (entre 1900 et 2100)');

            setIsSubmitting(true);

            const body = {
              name: data.name,
              teams: data.teams,
              dueAt: data.dueAt,
              completedAt: data.completedAt,
              withTime: data.withTime,
              status: data.status,
              categories: data.categories,
              description: data.description,
              urgent: data.urgent,
              group: data.group,
              user: user._id,
            };

            if (!data._id) return handleCreateAction(body);
            return handleUpdateAction(body);
          }}>
          {!['restricted-access'].includes(user.role) && (
            <ul className="noprint tw-mb-5 tw-mt-4 tw-flex tw-list-none tw-flex-wrap tw-border-b tw-border-zinc-200 tw-px-2">
              <li className="tw-cursor-pointer">
                <button
                  type="button"
                  className={[
                    '-tw-mb-px tw-block tw-rounded-t-md tw-border tw-border-transparent tw-py-2 tw-px-4',
                    activeTab !== 'Informations' && 'tw-text-main75',
                    activeTab === 'Informations' && 'tw-border-x-zinc-200 tw-border-t-zinc-200 tw-bg-white',
                  ].join(' ')}
                  onClick={() => setActiveTab('Informations')}>
                  Informations
                </button>
              </li>
              <li className="tw-cursor-pointer">
                <button
                  type="button"
                  className={[
                    '-tw-mb-px tw-block tw-rounded-t-md tw-border tw-border-transparent tw-py-2 tw-px-4',
                    activeTab !== 'Commentaires' && 'tw-text-main75',
                    activeTab === 'Commentaires' && 'tw-border-x-zinc-200 tw-border-t-zinc-200 tw-bg-white',
                  ].join(' ')}
                  onClick={() => setActiveTab('Commentaires')}>
                  Commentaires {data?.comments?.length ? `(${data.comments.length})` : ''}
                </button>
              </li>
            </ul>
          )}
          <div className={['tw-flex tw-w-full tw-flex-wrap tw-p-4', activeTab !== 'Informations' ? 'tw-hidden' : ''].join(' ')}>
            <div className="tw-flex tw-flex-row">
              <div className="tw-flex tw-flex-[2] tw-basis-2/3 tw-flex-col">
                <div className="tw-mb-4 tw-flex tw-flex-1 tw-flex-col">
                  <label htmlFor="name">Nom de l'action</label>
                  <textarea
                    name="name"
                    id="name"
                    value={data.name}
                    onChange={handleChange}
                    className="tw-w-full tw-rounded tw-border tw-border-gray-300 tw-py-1.5 tw-px-3 tw-text-base tw-transition-all"
                  />
                </div>
                <div className="tw-mb-4 tw-flex tw-flex-1 tw-flex-col">
                  <SelectPerson value={data.person} onChange={handleChange} isMulti={isMulti} inputId="create-action-person-select" />
                </div>
                <div className="tw-mb-4 tw-flex tw-flex-1 tw-flex-col">
                  <ActionsCategorySelect
                    data={data.categories}
                    id="categories"
                    label="Catégories"
                    onChange={(v) => handleChange({ currentTarget: { value: v, name: 'categories' } })}
                    withMostUsed
                  />
                </div>
                {!['restricted-access'].includes(user.role) && (
                  <div className="tw-mb-4 tw-flex tw-flex-1 tw-flex-col">
                    <label htmlFor="description">Description</label>
                    <div className="tw-block tw-w-full tw-overflow-hidden tw-rounded tw-border tw-border-gray-300 tw-text-base tw-transition-all">
                      <AutoResizeTextarea name="description" id="description" value={data.description} onChange={handleChange} rows={4} />
                    </div>
                  </div>
                )}
                {!!canToggleGroupCheck && (
                  <div className="tw-mb-4 tw-flex tw-flex-1 tw-flex-col">
                    <label htmlFor="create-action-for-group">
                      <input
                        type="checkbox"
                        className="tw-mr-2"
                        id="create-action-for-group"
                        name="group"
                        checked={data.group}
                        onChange={() => {
                          handleChange({ target: { name: 'group', checked: Boolean(!data.group), value: Boolean(!data.group) } });
                        }}
                      />
                      Action familiale <br />
                      <small className="text-muted">Cette action sera à effectuer pour toute la famille</small>
                    </label>
                  </div>
                )}
              </div>
              <div className="tw-flex tw-shrink-0 tw-flex-col tw-px-4">
                <hr className="tw-m-0 tw-w-px tw-shrink-0 tw-basis-full tw-border tw-bg-gray-300" />
              </div>
              <div className="tw-flex tw-flex-[1] tw-basis-1/3 tw-flex-col">
                <div className="tw-mb-4 tw-flex tw-flex-1 tw-flex-col">
                  <label htmlFor="dueAt">À faire le</label>
                  <div>
                    <DatePicker withTime={data.withTime} id="dueAt" defaultValue={data.dueAt ?? new Date()} onChange={handleChange} />
                  </div>
                  <div>
                    <input
                      type="checkbox"
                      id="withTime"
                      name="withTime"
                      className="tw-mr-2"
                      checked={data.withTime || false}
                      onChange={() => {
                        handleChange({ target: { name: 'withTime', checked: Boolean(!data.withTime), value: Boolean(!data.withTime) } });
                      }}
                    />
                    <label htmlFor="withTime">Montrer l'heure</label>
                  </div>
                </div>
                <div className="tw-mb-4 tw-flex tw-flex-1 tw-flex-col">
                  <label htmlFor="team">Équipe(s) en charge</label>
                  <SelectTeamMultiple
                    onChange={(teamIds) => handleChange({ target: { value: teamIds, name: 'teams' } })}
                    value={Array.isArray(data.teams) ? data.teams : [data.team]}
                    colored
                    inputId="create-action-team-select"
                    classNamePrefix="create-action-team-select"
                  />
                </div>
                <div className="tw-mb-4 tw-flex tw-flex-1 tw-flex-col">
                  <label htmlFor="create-action-urgent">
                    <input
                      type="checkbox"
                      id="create-action-urgent"
                      className="tw-mr-2"
                      name="urgent"
                      checked={data.urgent}
                      onChange={() => {
                        handleChange({ target: { name: 'urgent', checked: Boolean(!data.urgent), value: Boolean(!data.urgent) } });
                      }}
                    />
                    Action prioritaire <br />
                    <small className="text-muted">Cette action sera mise en avant par rapport aux autres</small>
                  </label>
                </div>
                <div className="tw-mb-4 tw-flex tw-flex-1 tw-flex-col">
                  <label htmlFor="update-action-select-status">Statut</label>
                  <SelectStatus
                    name="status"
                    value={data.status || ''}
                    onChange={handleChange}
                    inputId="update-action-select-status"
                    classNamePrefix="update-action-select-status"
                  />
                </div>
                {[DONE, CANCEL].includes(data.status) && (
                  <div className="tw-mb-4 tw-flex tw-flex-1 tw-flex-col">
                    {data.status === DONE && <label htmlFor="completedAt">Faite le</label>}
                    {data.status === CANCEL && <label htmlFor="completedAt">Annulée le</label>}
                    <div>
                      <DatePicker withTime id="completedAt" defaultValue={data.completedAt ?? new Date()} onChange={handleChange} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              {!!isNewAction && !['restricted-access'].includes(user.role) && (
                <>
                  <div className="tw-mb-4 tw-flex tw-flex-1 tw-flex-col">
                    <label htmlFor="create-comment-description">Commentaire (optionnel)</label>
                    <textarea
                      id="create-comment-description"
                      name="comment"
                      value={data.comment}
                      onChange={handleChange}
                      className="tw-w-full tw-rounded tw-border tw-border-gray-300 tw-py-1.5 tw-px-3 tw-text-base tw-transition-all"
                    />
                  </div>
                  <div className="tw-mb-4 tw-flex tw-flex-1 tw-flex-col">
                    <label htmlFor="create-comment-urgent">
                      <input
                        type="checkbox"
                        id="create-comment-urgent"
                        style={{ marginRight: '0.5rem' }}
                        name="commentUrgent"
                        checked={data.commentUrgent}
                        onChange={() => {
                          handleChange({
                            target: { name: 'commentUrgent', checked: Boolean(!data.commentUrgent), value: Boolean(!data.commentUrgent) },
                          });
                        }}
                      />
                      Commentaire prioritaire <br />
                      <small className="text-muted">Ce commentaire sera mise en avant par rapport aux autres</small>
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
          {!['restricted-access'].includes(user.role) && (
            <div
              className={['tw-flex tw-min-h-1/2 tw-w-full tw-flex-col tw-gap-4 tw-px-8', activeTab !== 'Commentaires' ? 'tw-hidden' : ''].join(' ')}>
              <CommentsModule
                comments={action.comments}
                color="main"
                typeForNewComment="action"
                onDeleteComment={async (comment) => {
                  const confirm = window.confirm('Voulez-vous vraiment supprimer ce commentaire ?');
                  if (!confirm) return false;
                  const res = await API.delete({ path: `/comment/${comment._id}` });
                  if (res.ok) setComments((comments) => comments.filter((p) => p._id !== comment._id));
                  if (!res.ok) return false;
                  toast.success('Suppression réussie');
                  return true;
                }}
                onSubmitComment={async (comment, isNewComment) => {
                  if (isNewComment) {
                    const response = await API.post({ path: '/comment', body: prepareCommentForEncryption(comment) });
                    if (!response.ok) return;
                    setComments((comments) => [response.decryptedData, ...comments]);
                    toast.success('Commentaire ajouté !');
                    await createReportAtDateIfNotExist(response.decryptedData.date);
                  } else {
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
                      await createReportAtDateIfNotExist(response.decryptedData.date || response.decryptedData.createdAt);
                    }
                    if (!response.ok) return;
                    toast.success('Commentaire mis à jour');
                  }
                }}
              />
            </div>
          )}
        </form>
      </ModalBody>
      <ModalFooter>
        <button type="button" name="cancel" className="button-cancel" onClick={onClose}>
          Annuler
        </button>
        <button type="submit" form="create-action-modal-form" className="button-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </ModalFooter>
    </ModalContainer>
  );
};
