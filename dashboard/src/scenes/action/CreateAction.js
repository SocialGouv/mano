import React, { useState } from 'react';
import { Col, FormGroup, Row, Modal, ModalBody, ModalHeader, Input, Label, Button as LinkButton } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import agendaIcon from '../../assets/icons/agenda-icon.svg';

import SelectTeam from '../../components/SelectTeam';
import SelectPerson from '../../components/SelectPerson';
import ButtonCustom from '../../components/ButtonCustom';
import { DONE, TODO, useActions } from '../../recoil/actions';
import SelectStatus from '../../components/SelectStatus';
import { organisationState, teamsState, userState } from '../../recoil/auth';
import { useRefresh } from '../../recoil/refresh';
import SelectCustom from '../../components/SelectCustom';
import { dateForDatePicker, formatDateWithFullMonth } from '../../services/date';
import { refreshTriggerState } from '../../components/Loader';

const CreateAction = ({ disabled, title, person = null, persons = null, isMulti = false, completedAt, refreshable, buttonOnly = false, noIcon }) => {
  const [open, setOpen] = useState(false);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);
  const teams = useRecoilValue(teamsState);
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const { addAction } = useActions();
  const { loading } = useRefresh();
  const history = useHistory();

  title = title || 'Créer une nouvelle action' + (Boolean(completedAt) ? ` faite le ${formatDateWithFullMonth(completedAt)}` : '');

  const onAddAction = async (body) => {
    if (body.status !== TODO) body.completedAt = completedAt || Date.now();
    const res = await addAction(body);
    return res;
  };

  const Wrapper = buttonOnly ? React.Fragment : CreateStyle;

  const wrapperProps = buttonOnly ? {} : { className: 'noprint' };

  const catsSelect = [...(organisation.categories || [])].sort((c1, c2) => c1.localeCompare(c2));

  return (
    <Wrapper {...wrapperProps}>
      {!!refreshable && (
        <LinkButton
          onClick={() => {
            setRefreshTrigger({
              status: true,
              method: 'actionsRefresher',
              options: [],
            });
          }}
          disabled={!!loading}
          color="link"
          style={{ marginRight: 10 }}>
          Rafraichir
        </LinkButton>
      )}
      <ButtonCustom
        icon={!noIcon && agendaIcon}
        disabled={disabled}
        onClick={() => setOpen(true)}
        color="primary"
        title={title}
        padding="12px 24px"
      />
      <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
        <ModalHeader toggle={() => setOpen(false)}>{title}</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{
              name: '',
              person: isMulti ? persons : person,
              team: null,
              dueAt: !!completedAt ? new Date(completedAt) : new Date(),
              withTime: false,
              status: !!completedAt ? DONE : TODO,
              categories: [],
              description: '',
            }}
            onSubmit={async (values, actions) => {
              if (!values.name) return toastr.error('Erreur!', 'Le nom est obligatoire');
              if (!values.team) return toastr.error('Erreur!', "L'équipe est obligatoire");
              if (!isMulti && !values.person) return toastr.error('Erreur!', 'La personne suivie est obligatoire');
              if (isMulti && !values.person?.length) return toastr.error('Erreur!', 'Une personne suivie est obligatoire');
              if (!values.dueAt) return toastr.error('Erreur!', "La date d'échéance est obligatoire");
              const body = {
                name: values.name,
                team: values.team,
                dueAt: values.dueAt,
                withTime: values.withTime,
                status: values.status,
                categories: values.categories,
                description: values.description,
                user: user._id,
              };
              if (typeof values.person === 'string') {
                body.person = values.person;
                const res = await onAddAction(body);
                actions.setSubmitting(false);
                if (res.ok) {
                  toastr.success('Création réussie !');
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
                  toastr.success('Création réussie !');
                  history.push(`/action/${res.data._id}`);
                }
              } else {
                for (const person of values.person) {
                  const res = await onAddAction({ ...body, person });
                  if (!res.ok) break;
                }
                actions.setSubmitting(false);
                toastr.success('Création réussie !');
                setOpen(false);
              }
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Nom de l'action</Label>
                      <Input id="create-action-name" name="name" value={values.name} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Sous l'équipe</Label>
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
                    <Label>Statut</Label>
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
                      <Label>Échéance</Label>
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
                      <Label>Afficher l'heure</Label>
                      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 20, width: '80%' }}>
                        <span>Montrer l'heure</span>
                        <Input type="checkbox" name="withTime" checked={values.withTime} onChange={handleChange} />
                      </div>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Catégories</Label>
                      <SelectCustom
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
                  <Col lg={12} md={6}>
                    <FormGroup>
                      <Label>Description</Label>
                      <Input id="create-action-description" type="textarea" name="description" value={values.description} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                </Row>
                <br />
                <ButtonCustom
                  type="submit"
                  color="info"
                  disabled={isSubmitting}
                  onClick={() => !isSubmitting && handleSubmit()}
                  title={isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
                />
              </React.Fragment>
            )}
          </Formik>
        </ModalBody>
      </Modal>
    </Wrapper>
  );
};

const CreateStyle = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
`;

export default CreateAction;
