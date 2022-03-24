import React, { useEffect, useState } from 'react';
import { FormGroup, Input, Label, Row, Col, Nav, TabContent, TabPane, NavItem, NavLink, Alert, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { Formik } from 'formik';
import styled from 'styled-components';
import { toastr } from 'react-redux-toastr';
import DatePicker from 'react-datepicker';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import ButtonCustom from '../../components/ButtonCustom';
import {
  personsState,
  customFieldsPersonsSocialSelector,
  customFieldsPersonsMedicalSelector,
  preparePersonForEncryption,
  commentForUpdatePerson,
  genderOptions,
  healthInsuranceOptions,
} from '../../recoil/persons';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import { dateForDatePicker, formatDateTimeWithNameOfDay, formatDateWithFullMonth } from '../../services/date';
import useApi from '../../services/api';
import { commentsState, prepareCommentForEncryption } from '../../recoil/comments';
import SelectAsInput from '../../components/SelectAsInput';
import CustomFieldInput from '../../components/CustomFieldInput';
import Table from '../../components/table';
import SelectStatus from '../../components/SelectStatus';
import ActionStatus from '../../components/ActionStatus';

export function MedicalFile({ person }) {
  const setPersons = useSetRecoilState(personsState);
  const setComments = useSetRecoilState(commentsState);
  const [showAddConsultation, setShowAddConsultation] = useState(false);
  const [showAddTreatment, setShowAddTreatment] = useState(false);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const organisation = useRecoilValue(organisationState);
  const API = useApi();
  return (
    <>
      <TitleWithButtonsContainer>
        <Title>Dossier médical</Title>
        <ButtonsFloatingRight>
          <ButtonCustom icon={false} disabled={false} onClick={() => {}} color="primary" title={'📋&nbsp;&nbsp;Dossier PDF'} padding="12px 24px" />
          <ButtonCustom
            icon={false}
            disabled={false}
            onClick={() => {}}
            color="primary"
            title={'🩺&nbsp;&nbsp;Ajouter une consultation'}
            padding="12px 24px"
          />
        </ButtonsFloatingRight>
      </TitleWithButtonsContainer>
      <Formik
        initialValues={person}
        onSubmit={async (body) => {
          if (!body.createdAt) body.createdAt = person.createdAt;
          body.entityKey = person.entityKey;
          const response = await API.put({
            path: `/person/${person._id}`,
            body: preparePersonForEncryption(customFieldsPersonsMedical, customFieldsPersonsSocial)(body),
          });
          if (response.ok) {
            const newPerson = response.decryptedData;
            setPersons((persons) =>
              persons.map((p) => {
                if (p._id === person._id) return newPerson;
                return p;
              })
            );
            const comment = commentForUpdatePerson({ newPerson, oldPerson: person });
            if (comment) {
              comment.user = user._id;
              comment.team = currentTeam._id;
              comment.organisation = organisation._id;
              const commentResponse = await API.post({ path: '/comment', body: prepareCommentForEncryption(comment) });
              if (commentResponse.ok) setComments((comments) => [commentResponse.decryptedData, ...comments]);
            }
          }
          if (response.ok) {
            toastr.success('Mis à jour !');
          }
        }}>
        {({ values, handleChange, handleSubmit, isSubmitting, setFieldValue }) => {
          return (
            <React.Fragment>
              <Row>
                <Col md={4}>
                  <FormGroup>
                    <Label>Date de naissance</Label>
                    <div>
                      <DatePicker
                        locale="fr"
                        className="form-control"
                        selected={dateForDatePicker(values.birthdate)}
                        onChange={(date) => handleChange({ target: { value: date, name: 'birthdate' } })}
                        dateFormat="dd/MM/yyyy"
                        id="person-birthdate"
                      />
                    </div>
                  </FormGroup>
                </Col>
                <Col md={4}>
                  <Label>Genre</Label>
                  <SelectAsInput
                    options={genderOptions}
                    name="gender"
                    value={values.gender || ''}
                    onChange={handleChange}
                    inputId="person-select-gender"
                    classNamePrefix="person-select-gender"
                  />
                </Col>
                <Col md={4}>
                  <FormGroup>
                    <Label>Structure de suivi social</Label>
                    <Input name="structureSocial" value={values.structureSocial || ''} onChange={handleChange} />
                  </FormGroup>
                </Col>
                <Col md={4}>
                  <Label>Couverture médicale</Label>
                  <SelectAsInput
                    options={healthInsuranceOptions}
                    name="healthInsurance"
                    value={values.healthInsurance || ''}
                    onChange={handleChange}
                    inputId="person-select-healthInsurance"
                    classNamePrefix="person-select-healthInsurance"
                  />
                </Col>
                <Col md={4}>
                  <Label>Numéro de sécurité sociale</Label>
                  <Input name="phone" value={values.numeroSecuriteSociale || ''} onChange={handleChange} />
                </Col>
              </Row>
              <Row>
                {customFieldsPersonsMedical
                  .filter((f) => f.enabled)
                  .map((field) => (
                    <CustomFieldInput colWidth={4} model="person" values={values} handleChange={handleChange} field={field} key={field.name} />
                  ))}
              </Row>
              <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} width={200} />
            </React.Fragment>
          );
        }}
      </Formik>
      <TitleWithButtonsContainer>
        <Title style={{ marginTop: '2rem' }}>Traitement en cours</Title>
        <ButtonsFloatingRight>
          <ButtonCustom
            icon={false}
            disabled={false}
            onClick={() => {
              setShowAddTreatment(true);
            }}
            color="primary"
            title={'💊&nbsp;&nbsp;Ajouter un traitement'}
            padding="12px 24px"
          />
        </ButtonsFloatingRight>
      </TitleWithButtonsContainer>
      <Table
        data={person.treatments}
        rowKey={'_id'}
        columns={[
          {
            title: 'Nom',
            dataKey: 'name',
            render: (e) => e.name,
          },
          {
            title: 'Dosage',
            dataKey: 'dosage',
            render: (e) => e.dosage,
          },
          {
            title: 'Fréquence',
            dataKey: 'frequency',
            render: (e) => e.frequency,
          },
          {
            title: 'Date de fin',
            dataKey: 'endDate',
            render: (e) => (e.endDate ? formatDateWithFullMonth(e.endDate) : ''),
          },
        ]}
        noData="Aucun traitement en cours"
      />
      <TitleWithButtonsContainer>
        <Title style={{ marginTop: '2rem' }}>Historique des consultations</Title>
        <ButtonsFloatingRight>
          <ButtonCustom
            icon={false}
            disabled={false}
            onClick={() => {
              setShowAddConsultation(true);
            }}
            color="primary"
            title={'🩺&nbsp;&nbsp;Ajouter une consultation'}
            padding="12px 24px"
          />
        </ButtonsFloatingRight>
      </TitleWithButtonsContainer>
      <Table
        data={person.consultations}
        rowKey={'_id'}
        columns={[
          {
            title: 'Date',
            dataKey: 'date',
            render: (e) => (e.date ? formatDateTimeWithNameOfDay(e.date) : ''),
          },
          {
            title: 'Description',
            dataKey: 'name',
            render: (e) => e.name,
          },
          {
            title: 'Créé par',
            dataKey: 'user',
            render: (e) => e.user,
          },
          {
            title: 'Statut',
            dataKey: 'status',
            render: (e) => <ActionStatus status={e.status} />,
          },
        ]}
        noData="Aucune consultation enregistrée"
      />
      <Modal isOpen={showAddConsultation} toggle={() => setShowAddConsultation(false)} size="lg">
        <ModalHeader toggle={() => setShowAddConsultation(false)}>Ajouter une consultation</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{
              date: new Date(),
              name: '',
              status: 'A FAIRE',
              user: user._id,
            }}
            onSubmit={async (values) => {
              const response = await API.put({
                path: `/person/${person._id}`,
                body: preparePersonForEncryption(
                  customFieldsPersonsMedical,
                  customFieldsPersonsSocial
                )({ ...person, consultations: [...(person.consultations || []), values] }),
              });
              if (response.ok) {
                const newPerson = response.decryptedData;
                setPersons((persons) =>
                  persons.map((p) => {
                    if (p._id === person._id) return newPerson;
                    return p;
                  })
                );
                toastr.success('Mis à jour !');
              }
              setShowAddConsultation(false);
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Nom</Label>
                      <Input id="create-action-name" name="name" value={values.name} onChange={handleChange} />
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
                  <Col md={6}>
                    <FormGroup>
                      <Label>Date</Label>
                      <div>
                        <DatePicker
                          locale="fr"
                          className="form-control"
                          id="create-action-dueat"
                          selected={dateForDatePicker(values.date)}
                          onChange={(date) => handleChange({ target: { value: date, name: 'date' } })}
                          timeInputLabel="Heure :"
                          dateFormat={'dd/MM/yyyy HH:mm'}
                          showTimeInput
                        />
                      </div>
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
      <Modal isOpen={showAddTreatment} toggle={() => setShowAddTreatment(false)} size="lg">
        <ModalHeader toggle={() => setShowAddTreatment(false)}>Ajouter un traitement</ModalHeader>
        <ModalBody>
          <Formik
            initialValues={{
              endDate: new Date(),
              name: '',
              dosage: '',
              frequency: '',
              user: user._id,
            }}
            validate={(values) => {
              const errors = {};
              if (!values.name) errors.name = 'Le nom est obligatoire';
              if (!values.dosage) errors.dosage = 'Le dosage est obligatoire';
              if (!values.frequency) errors.frequency = 'La fréquence est obligatoire';
              if (!values.endDate) errors.endDate = 'La date de fin est obligatoire';
              return errors;
            }}
            onSubmit={async (values) => {
              const response = await API.put({
                path: `/person/${person._id}`,
                body: preparePersonForEncryption(
                  customFieldsPersonsMedical,
                  customFieldsPersonsSocial
                )({ ...person, treatments: [...(person.treatments || []), values] }),
              });
              if (response.ok) {
                const newPerson = response.decryptedData;
                setPersons((persons) =>
                  persons.map((p) => {
                    if (p._id === person._id) return newPerson;
                    return p;
                  })
                );
                toastr.success('Mis à jour !');
              }
              setShowAddConsultation(false);
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting, errors, touched }) => (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Nom</Label>
                      <Input placeholder="Amoxiciline" name="name" value={values.name} onChange={handleChange} />
                      {touched.name && errors.name && <Error>{errors.name}</Error>}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Dosage</Label>
                      <Input placeholder="1mg" name="dosage" value={values.dosage} onChange={handleChange} />
                      {touched.dosage && errors.dosage && <Error>{errors.dosage}</Error>}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Fréquence</Label>
                      <Input placeholder="1 fois par jour" name="frequency" value={values.frequency} onChange={handleChange} />
                      {touched.frequency && errors.frequency && <Error>{errors.frequency}</Error>}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Date</Label>
                      <div>
                        <DatePicker
                          locale="fr"
                          className="form-control"
                          selected={dateForDatePicker(values.endDate)}
                          onChange={(date) => handleChange({ target: { value: date, name: 'endDate' } })}
                          dateFormat={'dd/MM/yyyy'}
                        />
                      </div>
                      {touched.endDate && errors.endDate && <Error>{errors.endDate}</Error>}
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
    </>
  );
}

const Title = styled.h2`
  font-size: 20px;
  font-weight: 800;
  display: flex;
  justify-content: space-between;
  span {
    margin-bottom: 20px;
    font-size: 16px;
    font-weight: 400;
    font-style: italic;
    display: block;
  }
`;

const ButtonsFloatingRight = styled.div`
  flex: 1;
  display: flex;
  justify-content: flex-end;
  column-gap: 1rem;
`;

const TitleWithButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 30px 0 20px;
`;

const Error = styled.span`
  color: red;
  font-size: 11px;
`;
