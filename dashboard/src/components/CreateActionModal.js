import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import { actionsState, CANCEL, DONE, prepareActionForEncryption, TODO } from '../recoil/actions';
import { currentTeamState, organisationState, teamsState, userState } from '../recoil/auth';
import { dayjsInstance, outOfBoundariesDate } from '../services/date';
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

const CreateActionModal = ({ person = null, persons = null, isMulti = false, completedAt = null, dueAt, open = false, setOpen = () => {} }) => {
  const teams = useRecoilValue(teamsState);
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const currentTeam = useRecoilValue(currentTeamState);
  const setActions = useSetRecoilState(actionsState);
  const groups = useRecoilValue(groupsState);
  const setComments = useSetRecoilState(commentsState);

  const createReportAtDateIfNotExist = useCreateReportAtDateIfNotExist();

  const onAddAction = async (body) => {
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState({});

  useEffect(() => {
    if (open) {
      setData({
        name: '',
        person: isMulti ? persons : person,
        teams: teams.length === 1 ? [teams[0]._id] : [],
        dueAt: dueAt || (!!completedAt ? new Date(completedAt) : new Date()),
        withTime: false,
        status: !!completedAt ? DONE : TODO,
        completedAt,
        categories: [],
        description: '',
        urgent: false,
        group: false,
        comment: '',
        commentUrgent: false,
      });
    }
  }, [open, person, persons, teams, dueAt, completedAt, isMulti]);

  const isOnePerson = typeof data?.person === 'string' || data?.person?.length === 1;
  const onlyPerson = !isOnePerson ? null : typeof data?.person === 'string' ? data.person : data.person?.[0];
  const canToggleGroupCheck = !!organisation.groupsEnabled && !!onlyPerson && groups.find((group) => group.persons.includes(onlyPerson));

  const handleChange = (event) => {
    const target = event.currentTarget || event.target;
    const { name, value } = target;
    setData((data) => ({ ...data, [name]: value }));
  };

  return (
    <ModalContainer open={open} onClose={() => setOpen(false)} size="3xl">
      <ModalHeader title="Créer une nouvelle action" />
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
            let actionsId = [];
            // What is this strange case?
            if (typeof data.person === 'string') {
              body.person = data.person;
              const res = await onAddAction(body);
              setIsSubmitting(false);
              if (res.ok) {
                toast.success('Création réussie !');
                setOpen(false);
                actionsId.push(res.decryptedData._id);
              }
            } else if (data.person.length === 1) {
              body.person = data.person[0];
              const res = await onAddAction(body);
              setIsSubmitting(false);
              if (res.ok) {
                toast.success('Création réussie !');
                setOpen(false);
                actionsId.push(res.decryptedData._id);
              }
            } else {
              for (const person of data.person) {
                const res = await onAddAction({ ...body, person });
                if (!res.ok) break;
                actionsId.push(res.decryptedData._id);
              }
              setIsSubmitting(false);
              toast.success('Création réussie !');
              setOpen(false);
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
              setComments((comments) => [...commentsToAdd, ...comments]);
            }
          }}>
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
            {!['restricted-access'].includes(user.role) && (
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
          <div className="tw-mt-4 tw-flex tw-justify-end"></div>
        </form>
      </ModalBody>
      <ModalFooter>
        <button type="button" name="cancel" className="button-cancel" onClick={() => setOpen(false)}>
          Annuler
        </button>
        <button type="submit" form="create-action-modal-form" className="button-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </ModalFooter>
    </ModalContainer>
  );
};

export default CreateActionModal;
