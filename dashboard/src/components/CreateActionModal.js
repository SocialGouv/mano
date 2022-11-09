import React from 'react';
import { Col, FormGroup, Row, Modal, ModalBody, ModalHeader, Input, Label } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import { actionsState, DONE, prepareActionForEncryption, TODO } from '../recoil/actions';
import { teamsState, userState } from '../recoil/auth';
import { dateForDatePicker } from '../services/date';
import useApi from '../services/api';

import SelectTeam from './SelectTeam';
import SelectPerson from './SelectPerson';
import ButtonCustom from './ButtonCustom';
import SelectStatus from './SelectStatus';
import useCreateReportAtDateIfNotExist from '../services/useCreateReportAtDateIfNotExist';
import ActionsCategorySelect from './tailwind/ActionsCategorySelect';

const CreateActionModal = ({ person = null, persons = null, isMulti = false, completedAt, dueAt, open = false, setOpen = () => {} }) => {
  const teams = useRecoilValue(teamsState);
  const user = useRecoilValue(userState);
  const setActions = useSetRecoilState(actionsState);
  const history = useHistory();
  const API = useApi();
  const createReportAtDateIfNotExist = useCreateReportAtDateIfNotExist();

  const onAddAction = async (body) => {
    if (body.status !== TODO) body.completedAt = completedAt || Date.now();
    const response = await API.post({ path: '/action', body: prepareActionForEncryption(body) });
    if (response.ok) setActions((actions) => [response.decryptedData, ...actions]);
    createReportAtDateIfNotExist(response.decryptedData.date);
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
            categories: [],
            description: '',
            urgent: false,
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
            if (typeof values.person === 'string') {
              body.person = values.person;
              const res = await onAddAction(body);
              actions.setSubmitting(false);
              if (res.ok) {
                toast.success('Création réussie !');
                history.push(`/action/${res.data._id}`);
                setOpen(false);
              }
              return;
            }
            if (values.person.length === 1) {
              body.person = values.person[0];
              const res = await onAddAction(body);
              actions.setSubmitting(false);
              if (res.ok) {
                toast.success('Création réussie !');
                history.push(`/action/${res.data._id}`);
              }
            } else {
              for (const person of values.person) {
                const res = await onAddAction({ ...body, person });
                if (!res.ok) break;
              }
              actions.setSubmitting(false);
              toast.success('Création réussie !');
              setOpen(false);
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
                    <ActionsCategorySelect
                      id="categories"
                      label="Catégories"
                      onChange={(v) => handleChange({ currentTarget: { value: v, name: 'categories' } })}
                    />
                  </FormGroup>
                </Col>
                <Col lg={12} md={6}>
                  <FormGroup>
                    <Label htmlFor="create-action-description">Description</Label>
                    <Input id="create-action-description" type="textarea" name="description" value={values.description} onChange={handleChange} />
                  </FormGroup>
                </Col>
                <Col md={12}>
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
