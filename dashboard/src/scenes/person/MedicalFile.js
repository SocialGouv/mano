import React, { useState } from 'react';
import { FormGroup, Input, Label, Row, Col, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { Formik } from 'formik';
import styled from 'styled-components';
import { toastr } from 'react-redux-toastr';
import DatePicker from 'react-datepicker';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import ButtonCustom from '../../components/ButtonCustom';
import {
  personsState,
  customFieldsPersonsSocialSelector,
  customFieldsPersonsMedicalSelector,
  preparePersonForEncryption,
  genderOptions,
  healthInsuranceOptions,
} from '../../recoil/persons';
import { usersState, userState } from '../../recoil/auth';
import { dateForDatePicker, formatDateTimeWithNameOfDay, formatDateWithFullMonth } from '../../services/date';
import useApi from '../../services/api';
import SelectAsInput from '../../components/SelectAsInput';
import CustomFieldInput from '../../components/CustomFieldInput';
import Table from '../../components/table';
import SelectStatus from '../../components/SelectStatus';
import ActionStatus from '../../components/ActionStatus';

export function MedicalFile({ person }) {
  const setPersons = useSetRecoilState(personsState);
  const [showAddConsultation, setShowAddConsultation] = useState(false);
  const [showAddTreatment, setShowAddTreatment] = useState(false);
  const [currentConsultation, setCurrentConsultation] = useState(null);
  const [currentTreatment, setCurrentTreatment] = useState(null);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const user = useRecoilValue(userState);
  const users = useRecoilValue(usersState);
  const API = useApi();

  async function updatePerson(properties = {}, message = 'Mise à jour effectuée !') {
    const response = await API.put({
      path: `/person/${person._id}`,
      body: preparePersonForEncryption(customFieldsPersonsMedical, customFieldsPersonsSocial)({ ...person, ...properties }),
    });
    if (!response.ok) {
      toastr.success('Erreur lors de la mise à jour');
      return;
    }
    setPersons((persons) =>
      persons.map((p) => {
        if (p._id === person._id) return response.decryptedData;
        return p;
      })
    );
    toastr.success(message);
  }

  return (
    <>
      <TitleWithButtonsContainer>
        <Title>Dossier médical</Title>
        <ButtonsFloatingRight>
          <ButtonCustom
            icon={false}
            disabled={false}
            onClick={() => {
              window.print();
            }}
            color="primary"
            title={'📋&nbsp;&nbsp;Imprimer le dossier PDF'}
            padding="12px 24px"
          />
        </ButtonsFloatingRight>
      </TitleWithButtonsContainer>
      <Formik
        enableReinitialize
        initialValues={person}
        onSubmit={async (body) => {
          await updatePerson(body);
        }}>
        {({ values, handleChange, handleSubmit, isSubmitting }) => {
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
                    <Label>Structure de suivi médical</Label>
                    <Input name="structureMedical" value={values.structureMedical || ''} onChange={handleChange} />
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
              setCurrentTreatment({
                _id: uuidv4(),
                endDate: new Date(),
                name: '',
                dosage: '',
                frequency: '',
                user: user._id,
              });
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
            dataKey: '_id',
            render: (treatment) => (
              <EditButton
                className="noprint"
                onClick={() => {
                  setShowAddTreatment(true);
                  setCurrentTreatment(treatment);
                }}>
                &#9998;
              </EditButton>
            ),
            small: true,
          },
          { title: 'Nom', dataKey: 'name' },
          { title: 'Dosage', dataKey: 'dosage' },
          { title: 'Fréquence', dataKey: 'frequency' },
          {
            title: 'Date de fin',
            dataKey: 'endDate',
            render: (e) => (e.endDate ? formatDateWithFullMonth(e.endDate) : ''),
          },
          {
            title: 'Action',
            render: (e) => (
              <ButtonCustom
                style={{ margin: 'auto' }}
                icon={false}
                disabled={false}
                onClick={async () => {
                  if (!window.confirm('Voulez-vous supprimer ce traitement ?')) return;
                  await updatePerson({ treatments: (person.treatments || []).filter((c) => c._id !== e._id) }, 'Traitement supprimée !');
                }}
                color="danger"
                title={'Supprimer'}
              />
            ),
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
              setCurrentConsultation({
                _id: uuidv4(),
                date: new Date(),
                name: '',
                status: 'A FAIRE',
                user: user._id,
              });
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
            dataKey: '_id',
            render: (consultation) => (
              <EditButton
                className="noprint"
                onClick={() => {
                  setShowAddConsultation(true);
                  setCurrentConsultation(consultation);
                }}>
                &#9998;
              </EditButton>
            ),
            small: true,
          },
          {
            title: 'Date',
            dataKey: 'date',
            render: (e) => (e.date ? formatDateTimeWithNameOfDay(e.date) : ''),
          },
          { title: 'Description', dataKey: 'name' },
          {
            title: 'Créé par',
            dataKey: 'user',
            render: (e) => (e.user ? users.find((u) => u._id === e.user)?.name : ''),
          },
          {
            title: 'Statut',
            dataKey: 'status',
            render: (e) => <ActionStatus status={e.status} />,
          },
          {
            title: 'Action',
            render: (e) => (
              <ButtonCustom
                style={{ margin: 'auto' }}
                icon={false}
                disabled={false}
                onClick={async () => {
                  if (!window.confirm('Voulez-vous supprimer cette consultation ?')) return;
                  await updatePerson({ consultations: (person.consultations || []).filter((c) => c._id !== e._id) }, 'Consultation supprimée !');
                }}
                color="danger"
                title={'Supprimer'}
              />
            ),
          },
        ]}
        noData="Aucune consultation enregistrée"
      />
      <Modal isOpen={showAddConsultation} toggle={() => setShowAddConsultation(false)} size="lg">
        <ModalHeader toggle={() => setShowAddConsultation(false)}>Ajouter une consultation</ModalHeader>
        <ModalBody>
          <Formik
            enableReinitialize
            initialValues={currentConsultation}
            validate={(values) => {
              const errors = {};
              if (!values._id) errors._id = "L'identifiant est obligatoire";
              if (!values.name) errors.name = 'Le nom est obligatoire';
              if (!values.status) errors.status = 'Le statut est obligatoire';
              if (!values.date) errors.date = 'La date est obligatoire';
              return errors;
            }}
            onSubmit={async (values) => {
              let consultations = person.consultations || [];
              if (consultations.find((t) => t._id === values._id)) {
                consultations = consultations.map((t) => {
                  if (t._id === values._id) return values;
                  return t;
                });
              } else {
                consultations = [...consultations, values];
              }
              await updatePerson({ consultations }, 'Consultation mise à jour !');
              setShowAddConsultation(false);
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting, touched, errors }) => (
              <React.Fragment>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label>Nom</Label>
                      <Input id="create-action-name" name="name" value={values.name} onChange={handleChange} />
                      {touched.name && errors.name && <Error>{errors.name}</Error>}
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
                    {touched.status && errors.status && <Error>{errors.status}</Error>}
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
                      {touched.date && errors.date && <Error>{errors.date}</Error>}
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
            enableReinitialize
            initialValues={currentTreatment}
            validate={(values) => {
              const errors = {};
              if (!values._id) errors._id = "L'identifiant est obligatoire";
              if (!values.name) errors.name = 'Le nom est obligatoire';
              if (!values.dosage) errors.dosage = 'Le dosage est obligatoire';
              if (!values.frequency) errors.frequency = 'La fréquence est obligatoire';
              if (!values.endDate) errors.endDate = 'La date de fin est obligatoire';
              return errors;
            }}
            onSubmit={async (values) => {
              let treatments = person.treatments || [];
              if (treatments.find((t) => t._id === values._id)) {
                treatments = treatments.map((t) => {
                  if (t._id === values._id) return values;
                  return t;
                });
              } else {
                treatments = [...treatments, values];
              }
              await updatePerson({ treatments }, 'Traitement mise à jour !');
              setShowAddTreatment(false);
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

const EditButton = styled.button`
  width: 30px;
  border: none;
  background: transparent;
`;
