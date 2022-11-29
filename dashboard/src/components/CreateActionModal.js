import React from 'react';
import { FormGroup, Modal, ModalBody, ModalHeader, Input, Label } from 'reactstrap';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import { actionsState, CANCEL, DONE, prepareActionForEncryption, TODO } from '../recoil/actions';
import { organisationState, teamsState, userState } from '../recoil/auth';
import { dateForDatePicker, dayjsInstance } from '../services/date';
import useApi from '../services/api';

import SelectTeam from './SelectTeam';
import SelectPerson from './SelectPerson';
import ButtonCustom from './ButtonCustom';
import SelectStatus from './SelectStatus';
import useCreateReportAtDateIfNotExist from '../services/useCreateReportAtDateIfNotExist';
import { commentsState, prepareCommentForEncryption } from '../recoil/comments';
import ActionsCategorySelect from './tailwind/ActionsCategorySelect';
import { groupsState } from '../recoil/groups';

const CreateActionModal = ({ person = null, persons = null, isMulti = false, completedAt = null, dueAt, open = false, setOpen = () => {} }) => {
  const teams = useRecoilValue(teamsState);
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const setActions = useSetRecoilState(actionsState);
  const groups = useRecoilValue(groupsState);
  const setComments = useSetRecoilState(commentsState);
  const API = useApi();
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

  if (['restricted-access'].includes(user.role)) return null;

  return (
    <Modal isOpen={open} toggle={() => setOpen(false)} size="lg" backdrop="static">
      <ModalHeader toggle={() => setOpen(false)}>{'Créer une nouvelle action'}</ModalHeader>
      <ModalBody>
        <Formik
          initialValues={{
            name: '',
            person: isMulti ? persons : person,
            team: null,
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
          }}
          onSubmit={async (values, actions) => {
            if (!values.name) return toast.error('Le nom est obligatoire');
            if (!values.team) return toast.error("L'équipe est obligatoire");
            if (!isMulti && !values.person) return toast.error('La personne suivie est obligatoire');
            if (isMulti && !values.person?.length) return toast.error('Une personne suivie est obligatoire');
            if (!values.dueAt) return toast.error("La date d'échéance est obligatoire");
            const body = {
              name: values.name,
              team: values.team,
              dueAt: values.dueAt,
              completedAt: values.completedAt,
              withTime: values.withTime,
              status: values.status,
              categories: values.categories,
              description: values.description,
              urgent: values.urgent,
              group: values.group,
              user: user._id,
            };
            let actionsId = [];
            // What is this strange case?
            if (typeof values.person === 'string') {
              body.person = values.person;
              const res = await onAddAction(body);
              actions.setSubmitting(false);
              if (res.ok) {
                toast.success('Création réussie !');
                setOpen(false);
                actionsId.push(res.decryptedData._id);
              }
            } else if (values.person.length === 1) {
              body.person = values.person[0];
              const res = await onAddAction(body);
              actions.setSubmitting(false);
              if (res.ok) {
                toast.success('Création réussie !');
                setOpen(false);
                actionsId.push(res.decryptedData._id);
              }
            } else {
              for (const person of values.person) {
                const res = await onAddAction({ ...body, person });
                if (!res.ok) break;
                actionsId.push(res.decryptedData._id);
              }
              actions.setSubmitting(false);
              toast.success('Création réussie !');
              setOpen(false);
            }
            // Then, save the comment if present.
            if (values.comment.trim()) {
              const commentBody = {
                comment: values.comment,
                urgent: values.commentUrgent,
                user: user._id,
                date: new Date(),
                team: values.team,
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
          {({ values, handleChange, handleSubmit, isSubmitting }) => {
            const isOnePerson = typeof values?.person === 'string' || values?.person?.length === 1;
            const person = !isOnePerson ? null : typeof values?.person === 'string' ? values.person : values.person?.[0];
            const canToggleGroupCheck = !!organisation.groupsEnabled && !!person && groups.find((group) => group.persons.includes(person));
            return (
              <>
                <div className="tw-flex tw-flex-row">
                  <div className="tw-flex tw-flex-[2] tw-basis-2/3 tw-flex-col">
                    <FormGroup>
                      <Label htmlFor="name">Nom</Label>
                      <Input name="name" id="name" type="textarea" value={values.name} onChange={handleChange} />
                    </FormGroup>
                    <FormGroup>
                      <SelectPerson value={values.person} onChange={handleChange} inputId="create-action-person-select" />
                    </FormGroup>
                    <FormGroup>
                      <ActionsCategorySelect
                        values={values.categories}
                        id="categories"
                        label="Catégories"
                        onChange={(v) => handleChange({ currentTarget: { value: v, name: 'categories' } })}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor="description">Description</Label>
                      <Input type="textarea" name="description" id="description" value={values.description} onChange={handleChange} />
                    </FormGroup>
                    {!!canToggleGroupCheck && (
                      <FormGroup>
                        <Label htmlFor="create-action-for-group">
                          <input
                            type="checkbox"
                            className="tw-mr-2"
                            id="create-action-for-group"
                            name="group"
                            checked={values.group}
                            onChange={handleChange}
                          />
                          Action familiale <br />
                          <small className="text-muted">Cette action sera à effectuer pour toute la famille</small>
                        </Label>
                      </FormGroup>
                    )}
                  </div>
                  <div className="tw-flex tw-shrink-0 tw-flex-col tw-px-4">
                    <hr className="tw-m-0 tw-w-px tw-shrink-0 tw-basis-full tw-border tw-bg-gray-300" />
                  </div>
                  <div className="tw-flex tw-flex-[1] tw-basis-1/3 tw-flex-col">
                    <FormGroup>
                      <Label htmlFor="dueAt">À faire le</Label>
                      <div>
                        <DatePicker
                          id="dueAt"
                          name="dueAt"
                          locale="fr"
                          className="form-control"
                          selected={dateForDatePicker(values.dueAt ?? new Date())}
                          onChange={(date) => handleChange({ target: { value: date, name: 'dueAt' } })}
                          dateFormat={values.withTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy'}
                          showTimeInput={values.withTime}
                        />
                      </div>
                      <div>
                        <input
                          type="checkbox"
                          id="withTime"
                          name="withTime"
                          className="tw-mr-2"
                          checked={values.withTime || false}
                          onChange={() => {
                            handleChange({ target: { name: 'withTime', checked: Boolean(!values.withTime), value: Boolean(!values.withTime) } });
                          }}
                        />
                        <label htmlFor="withTime">Afficher l'heure</label>
                      </div>
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor="team">Sous l'équipe</Label>
                      <SelectTeam
                        teams={user.role === 'admin' ? teams : user.teams}
                        teamId={values.team}
                        inputId="team"
                        onChange={(team) => handleChange({ target: { value: team._id, name: 'team' } })}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor="create-action-urgent">
                        <input
                          type="checkbox"
                          id="create-action-urgent"
                          className="tw-mr-2"
                          name="urgent"
                          checked={values.urgent}
                          onChange={() => {
                            handleChange({ target: { name: 'urgent', checked: Boolean(!values.urgent), value: Boolean(!values.urgent) } });
                          }}
                        />
                        Action prioritaire <br />
                        <small className="text-muted">Cette action sera mise en avant par rapport aux autres</small>
                      </Label>
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor="update-action-select-status">Statut</Label>
                      <SelectStatus
                        name="status"
                        value={values.status || ''}
                        onChange={handleChange}
                        inputId="update-action-select-status"
                        classNamePrefix="update-action-select-status"
                      />
                    </FormGroup>
                    {[DONE, CANCEL].includes(values.status) && (
                      <FormGroup>
                        {values.status === DONE && <Label htmlFor="completedAt">Faite le</Label>}
                        {values.status === CANCEL && <Label htmlFor="completedAt">Annulée le</Label>}
                        <div>
                          <DatePicker
                            id="completedAt"
                            name="completedAt"
                            locale="fr"
                            className="form-control"
                            selected={dateForDatePicker(values.completedAt ?? new Date())}
                            onChange={(date) => handleChange({ target: { value: date, name: 'completedAt' } })}
                            timeInputLabel="Heure :"
                            dateFormat="dd/MM/yyyy HH:mm"
                            showTimeInput
                          />
                        </div>
                      </FormGroup>
                    )}
                  </div>
                </div>
                <div>
                  <FormGroup>
                    <Label htmlFor="create-comment-description">Commentaire (optionnel)</Label>
                    <Input id="create-comment-description" type="textarea" name="comment" value={values.comment} onChange={handleChange} />
                  </FormGroup>
                  <FormGroup>
                    <Label htmlFor="create-comment-urgent">
                      <input
                        type="checkbox"
                        id="create-comment-urgent"
                        style={{ marginRight: '0.5rem' }}
                        name="commentUrgent"
                        checked={values.commentUrgent}
                        onChange={handleChange}
                      />
                      Commentaire prioritaire <br />
                      <small className="text-muted">Ce commentaire sera mise en avant par rapport aux autres</small>
                    </Label>
                  </FormGroup>
                </div>
                <div className="tw-mt-4 tw-flex tw-justify-end">
                  <ButtonCustom
                    type="submit"
                    disabled={isSubmitting}
                    onClick={() => !isSubmitting && handleSubmit()}
                    title={isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
                  />
                </div>
              </>
            );
          }}
        </Formik>
      </ModalBody>
    </Modal>
  );
};

export default CreateActionModal;
