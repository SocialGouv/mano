import React, { useEffect, useMemo, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useHistory, useLocation } from 'react-router-dom';
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
import UserName from './UserName';
import { itemsGroupedByActionSelector } from '../recoil/selectors';
import CustomFieldDisplay from './CustomFieldDisplay';
import PersonName from './PersonName';
import TagTeam from './TagTeam';

export default function ActionModal() {
  const actionsObjects = useRecoilValue(itemsGroupedByActionSelector);
  const history = useHistory();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentActionId = searchParams.get('actionId');
  const newAction = searchParams.get('newAction');
  const currentAction = useMemo(() => {
    if (!currentActionId) return null;
    return actionsObjects[currentActionId];
  }, [currentActionId, actionsObjects]);
  const personId = searchParams.get('personId');
  const personIds = searchParams.get('personIds')?.split(',');
  const dueAt = searchParams.get('dueAt');
  const completedAt = searchParams.get('completedAt');

  const [open, setOpen] = useState(false);
  const actionIdRef = useRef(currentActionId);
  const newActionRef = useRef(newAction);
  useEffect(() => {
    if (actionIdRef.current !== currentActionId) {
      actionIdRef.current = currentActionId;
      setOpen(!!currentActionId);
    }
    if (newActionRef.current !== newAction) {
      newActionRef.current = newAction;
      setOpen(!!newAction);
    }
  }, [newAction, currentActionId]);

  const manualCloseRef = useRef(false);
  const onAfterLeave = () => {
    if (manualCloseRef.current) history.goBack();
    manualCloseRef.current = false;
  };

  return (
    <ModalContainer open={open} size="3xl" onAfterLeave={onAfterLeave}>
      <ActionContent
        key={open}
        personId={personId}
        personIds={personIds}
        isMulti={!currentActionId && !personId}
        action={currentAction}
        completedAt={completedAt}
        dueAt={dueAt}
        onClose={() => {
          manualCloseRef.current = true;
          setOpen(false);
        }}
      />
    </ModalContainer>
  );
}

const ActionContent = ({ onClose, action, personId = null, personIds = null, isMulti = false, completedAt = null, dueAt = null }) => {
  const teams = useRecoilValue(teamsState);
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const currentTeam = useRecoilValue(currentTeamState);
  const setActions = useSetRecoilState(actionsState);
  const groups = useRecoilValue(groupsState);
  const setComments = useSetRecoilState(commentsState);
  const history = useHistory();
  const location = useLocation();
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
  }, [organisation?._id, personId, user?._id, action, dueAt, completedAt, teams, isMulti, personIds]);

  const [data, setData] = useState(initialState);
  const isNewAction = !data._id;
  useEffect(() => {
    setData(initialState);
  }, [initialState]);

  const [activeTab, setActiveTab] = useState('Informations');
  const isOnePerson = typeof data?.person === 'string' || data?.person?.length === 1;
  const onlyPerson = !isOnePerson ? null : typeof data?.person === 'string' ? data.person : data.person?.[0];
  const canToggleGroupCheck = !!organisation.groupsEnabled && !!onlyPerson && groups.find((group) => group.persons.includes(onlyPerson));

  const [isEditing, setIsEditing] = useState(isNewAction);

  const handleChange = (event) => {
    const target = event.currentTarget || event.target;
    const { name, value } = target;
    setData((data) => ({ ...data, [name]: value }));
    setIsEditing(true);
  };

  const handleCreateAction = async () => {
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
    const body = { ...data };
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
    const searchParams = new URLSearchParams(history.location.search);
    searchParams.set('actionId', response.decryptedData._id);
    history.push(`?${searchParams.toString()}`);
    refresh();
  };

  const handleDelete = async () => {
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

  const handleUpdateAction = async () => {
    const body = { ...data };
    body.teams = Array.isArray(data.teams) ? data.teams : [data.team];
    if (!data.teams?.length) return toast.error('Une action doit être associée à au moins une équipe.');
    const statusChanged = data.status && action.status !== data.status;
    if (statusChanged) {
      if ([DONE, CANCEL].includes(data.status)) {
        // When status changed to finished (done, cancel) completedAt we set it to now if not set.
        body.completedAt = data.completedAt || now();
      } else {
        // When status just changed to "todo" we set completedAt to null (since it's not done yet).
        body.completedAt = null;
      }
    }
    if (data.completedAt && outOfBoundariesDate(data.completedAt)) return toast.error('La date de complétion est hors limites (entre 1900 et 2100)');
    if (data.dueAt && outOfBoundariesDate(data.dueAt)) return toast.error("La date d'échéance est hors limites (entre 1900 et 2100)");
    if (!body.dueAt) body.dueAt = data.completedAt || new Date();

    delete body.team;
    const actionResponse = await API.put({
      path: `/action/${action._id}`,
      body: prepareActionForEncryption({ ...body, user: data.user || user._id }),
    });
    if (!actionResponse.ok) return;
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
    if (location.pathname !== '/stats') refresh(); // if we refresh when we're on stats page, it will remove the view we're on
    const actionCancelled = action.status !== CANCEL && body.status === CANCEL;
    if (actionCancelled && window.confirm('Cette action est annulée, voulez-vous la dupliquer ? Avec une date ultérieure par exemple')) {
      handleDuplicate();
    } else {
      onClose();
    }
  };
  const canSave = useMemo(() => {
    if (data.status !== initialState.status) return true;
    if (JSON.stringify(data.onlyVisibleBy) !== JSON.stringify(initialState.onlyVisibleBy)) return true;
    if (JSON.stringify(data.completedAt) !== JSON.stringify(initialState.completedAt)) return true;
    return false;
  }, [data, initialState]);

  const canEdit = true;

  return (
    <>
      <ModalHeader
        title={
          <>
            {isNewAction && 'Ajouter une action'}
            {!isNewAction && !isEditing && `Action: ${action?.name}`}
            {!isNewAction && isEditing && `Modifier l'action: ${action?.name}`}
            {!isNewAction && action?.user && (
              <UserName
                className="tw-block tw-text-right tw-text-base tw-font-normal tw-italic"
                id={action.user}
                wrapper={(name) => ` (créée par ${name})`}
              />
            )}
          </>
        }
        onClose={onClose}
      />
      <ModalBody>
        <form
          id="add-action-form"
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

            if (!data._id) return handleCreateAction();
            return handleUpdateAction();
          }}>
          {!['restricted-access'].includes(user.role) && data?._id && (
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
          <div
            className={['tw-flex tw-h-[50vh] tw-w-full tw-flex-wrap tw-overflow-y-auto tw-p-4', activeTab !== 'Informations' && 'tw-hidden']
              .filter(Boolean)
              .join(' ')}>
            <div className="tw-flex tw-w-full tw-flex-row">
              <div className="tw-flex tw-flex-[2] tw-basis-2/3 tw-flex-col">
                <div className="tw-mb-4 tw-flex tw-flex-1 tw-flex-col">
                  <label className={isEditing ? '' : 'tw-text-sm tw-font-semibold tw-text-main'} htmlFor="name">
                    Nom de l'action
                  </label>
                  {isEditing ? (
                    <textarea
                      name="name"
                      id="name"
                      value={data.name}
                      onChange={handleChange}
                      className="tw-w-full tw-rounded tw-border tw-border-gray-300 tw-py-1.5 tw-px-3 tw-text-base tw-transition-all"
                    />
                  ) : (
                    <CustomFieldDisplay value={data.name} type="textarea" />
                  )}
                </div>
                <div className="tw-mb-4 tw-flex tw-flex-1 tw-flex-col">
                  <label className={isEditing ? '' : 'tw-text-sm tw-font-semibold tw-text-main'} htmlFor="person">
                    {isMulti ? 'Personne(s) suivie(s)' : 'Personne suivie'}
                  </label>
                  {isEditing ? (
                    <SelectPerson noLabel value={data.person} onChange={handleChange} isMulti={isMulti} inputId="create-action-person-select" />
                  ) : (
                    <PersonName item={data} />
                  )}
                </div>
                <div className="tw-mb-4 tw-flex tw-flex-1 tw-flex-col">
                  <label className={isEditing ? '' : 'tw-text-sm tw-font-semibold tw-text-main'} htmlFor="categories">
                    Catégorie(s)
                  </label>
                  {isEditing ? (
                    <ActionsCategorySelect
                      values={data.categories}
                      id="categories"
                      onChange={(v) => handleChange({ currentTarget: { value: v, name: 'categories' } })}
                      withMostUsed
                    />
                  ) : (
                    <CustomFieldDisplay value={data.categories?.join(', ')} type="text" />
                  )}
                </div>
                {!['restricted-access'].includes(user.role) && (
                  <div className="tw-mb-4 tw-flex tw-flex-1 tw-flex-col">
                    <label className={isEditing ? '' : 'tw-text-sm tw-font-semibold tw-text-main'} htmlFor="description">
                      Description
                    </label>
                    {isEditing ? (
                      <div className="tw-block tw-w-full tw-overflow-hidden tw-rounded tw-border tw-border-gray-300 tw-text-base tw-transition-all">
                        <AutoResizeTextarea name="description" id="description" value={data.description} onChange={handleChange} rows={4} />
                      </div>
                    ) : (
                      <CustomFieldDisplay value={data.description} type="textarea" />
                    )}
                  </div>
                )}
                {!!canToggleGroupCheck && (
                  <div className="tw-mb-4 tw-flex tw-flex-1 tw-flex-col">
                    <label htmlFor="create-action-for-group">
                      <input
                        type="checkbox"
                        disabled={!isEditing}
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
                  <label className={isEditing ? '' : 'tw-text-sm tw-font-semibold tw-text-main'} htmlFor="dueAt">
                    À faire le
                  </label>
                  {isEditing ? (
                    <>
                      <div>
                        <DatePicker
                          withTime={data.withTime}
                          id="dueAt"
                          name="dueAt"
                          defaultValue={data.dueAt ?? new Date()}
                          onChange={handleChange}
                        />
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
                    </>
                  ) : (
                    <CustomFieldDisplay value={data.dueAt} type={data.withTime ? 'date-with-time' : 'date'} />
                  )}
                </div>
                <div className="tw-mb-4 tw-flex tw-flex-1 tw-flex-col">
                  <label className={isEditing ? '' : 'tw-text-sm tw-font-semibold tw-text-main'} htmlFor="team">
                    Équipe(s) en charge
                  </label>
                  {isEditing ? (
                    <SelectTeamMultiple
                      onChange={(teamIds) => handleChange({ target: { value: teamIds, name: 'teams' } })}
                      value={Array.isArray(data.teams) ? data.teams : [data.team]}
                      colored
                      inputId="create-action-team-select"
                      classNamePrefix="create-action-team-select"
                    />
                  ) : (
                    <div className="tw-flex tw-flex-col">
                      {(Array.isArray(data.teams) ? data.teams : [data.team]).map((teamId) => (
                        <TagTeam key={teamId} teamId={teamId} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="tw-mb-4 tw-flex tw-flex-1 tw-flex-col">
                  <label htmlFor="create-action-urgent">
                    <input
                      type="checkbox"
                      disabled={!isEditing}
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
                <div
                  className={['tw-mb-4 tw-flex tw-flex-1 tw-flex-col', [DONE, CANCEL].includes(data.status) ? 'tw-visible' : 'tw-invisible'].join(
                    ' '
                  )}>
                  <label htmlFor="completedAt">{data.status === DONE ? 'Faite le' : 'Annulée le'}</label>
                  <div>
                    <DatePicker withTime id="completedAt" name="completedAt" defaultValue={data.completedAt ?? new Date()} onChange={handleChange} />
                  </div>
                </div>
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
              className={[
                'tw-flex tw-h-[50vh] tw-w-full tw-flex-col tw-flex-wrap tw-gap-4 tw-overflow-y-auto',
                activeTab !== 'Commentaires' && 'tw-hidden',
              ]
                .filter(Boolean)
                .join(' ')}>
              <CommentsModule
                comments={action?.comments.map((comment) => ({ ...comment, type: 'action', person: action.person }))}
                color="main"
                typeForNewComment="action"
                actionId={action?._id}
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
        <button name="Fermer" type="button" className="button-cancel" onClick={() => onClose()}>
          Fermer
        </button>
        {!['restricted-access'].includes(user.role) && !isNewAction && !!isEditing && (
          <button type="button" name="cancel" disabled={!canEdit} className="button-destructive" onClick={handleDelete}>
            Supprimer
          </button>
        )}
        {(isEditing || canSave) && (
          <button type="submit" className="button-submit" form="add-action-form" disabled={isSubmitting || !canEdit}>
            Sauvegarder
          </button>
        )}
        {!isEditing && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsEditing(true);
            }}
            className={['button-submit', activeTab === 'Informations' ? 'tw-visible' : 'tw-invisible'].join(' ')}
            disabled={!canEdit}>
            Modifier
          </button>
        )}
      </ModalFooter>
    </>
  );
};
