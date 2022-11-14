import React from 'react';
import { Col, FormGroup, Row, Modal, ModalBody, ModalHeader, Input, Label } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import { actionsState, DONE, prepareActionForEncryption, TODO } from '../recoil/actions';
import { organisationState, teamsState, userState } from '../recoil/auth';
import { dateForDatePicker } from '../services/date';
import useApi from '../services/api';

import SelectTeam from './SelectTeam';
import SelectPerson from './SelectPerson';
import ButtonCustom from './ButtonCustom';
import SelectStatus from './SelectStatus';
import SelectCustom from './SelectCustom';
import useCreateReportAtDateIfNotExist from '../services/useCreateReportAtDateIfNotExist';
import { commentsState, prepareCommentForEncryption } from '../recoil/comments';

const CreateActionModal = ({ person = null, persons = null, isMulti = false, completedAt, dueAt, open = false, setOpen = () => {} }) => {
  const teams = useRecoilValue(teamsState);
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const setActions = useSetRecoilState(actionsState);
  const setComments = useSetRecoilState(commentsState);
  const API = useApi();
  const createReportAtDateIfNotExist = useCreateReportAtDateIfNotExist();

  const onAddAction = async (body) => {
    if (body.status !== TODO) body.completedAt = completedAt || Date.now();
    const response = await API.post({ path: '/action', body: prepareActionForEncryption(body) });
    if (response.ok) setActions((actions) => [response.decryptedData, ...actions]);
    createReportAtDateIfNotExist(response.decryptedData.date);
    return response;
  };

  const catsSelect = [...(organisation.categories || [])];

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
            categories: [],
            description: '',
            urgent: false,
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
              withTime: values.withTime,
              status: values.status,
              categories: values.categories,
              description: values.description,
              urgent: values.urgent,
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
          {({ values, handleChange, handleSubmit, isSubmitting }) => (
            <React.Fragment>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label htmlFor="create-action-name">Nom de l'action</Label>
                    <Input id="create-action-name" name="name" value={values.name} onChange={handleChange} />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label htmlFor="create-action-team-select">Sous l'équipe</Label>
                    <SelectTeam
                      teams={user.role === 'admin' ? teams : user.teams}
                      teamId={values.team}
                      onChange={(team) => handleChange({ target: { value: team._id, name: 'team' } })}
                      inputId="create-action-team-select"
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <SelectPerson value={values.person} onChange={handleChange} isMulti={isMulti} inputId="create-action-person-select" />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <Label htmlFor="new-action-select-status">Statut</Label>
                  <SelectStatus
                    name="status"
                    value={values.status || ''}
                    onChange={handleChange}
                    inputId="new-action-select-status"
                    classNamePrefix="new-action-select-status"
                  />
                </Col>
                <Col lg={3} md={6}>
                  <FormGroup>
                    <Label htmlFor="create-action-dueat">Échéance</Label>
                    <div>
                      <DatePicker
                        locale="fr"
                        className="form-control"
                        id="create-action-dueat"
                        selected={dateForDatePicker(values.dueAt)}
                        onChange={(date) => handleChange({ target: { value: date, name: 'dueAt' } })}
                        timeInputLabel="Heure :"
                        dateFormat={values.withTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy'}
                        showTimeInput
                      />
                    </div>
                  </FormGroup>
                </Col>
                <Col lg={3} md={6}>
                  <FormGroup>
                    <Label />
                    <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 20, width: '80%' }}>
                      <label htmlFor="withTime">Montrer l'heure</label>
                      <Input type="checkbox" id="withTime" name="withTime" checked={values.withTime} onChange={handleChange} />
                    </div>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label htmlFor="categories">Catégories</Label>
                    <SelectCustom
                      inputId="categories"
                      options={catsSelect}
                      name="categories"
                      onChange={(v) => handleChange({ currentTarget: { value: v, name: 'categories' } })}
                      isClearable={false}
                      isMulti
                      value={values.categories || []}
                      getOptionValue={(i) => i}
                      getOptionLabel={(i) => i}
                    />
                  </FormGroup>
                </Col>
                <Col lg={6} md={6}>
                  <FormGroup>
                    <Label htmlFor="create-action-description">Description</Label>
                    <Input id="create-action-description" type="textarea" name="description" value={values.description} onChange={handleChange} />
                  </FormGroup>
                  <FormGroup>
                    <Label htmlFor="create-action-urgent">
                      <input
                        type="checkbox"
                        id="create-action-urgent"
                        style={{ marginRight: '0.5rem' }}
                        name="urgent"
                        checked={values.urgent}
                        onChange={handleChange}
                      />
                      Action prioritaire <br />
                      <small className="text-muted">Cette action sera mise en avant par rapport aux autres</small>
                    </Label>
                  </FormGroup>
                </Col>
                <Col lg={6} md={6}>
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
                </Col>
              </Row>
              <br />
              <ButtonCustom
                type="submit"
                disabled={isSubmitting}
                onClick={() => !isSubmitting && handleSubmit()}
                title={isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
              />
            </React.Fragment>
          )}
        </Formik>
      </ModalBody>
    </Modal>
  );
};

export default CreateActionModal;
