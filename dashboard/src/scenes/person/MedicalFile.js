import React, { useMemo, useState } from 'react';
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
import { organisationState, usersState, userState } from '../../recoil/auth';
import { dateForDatePicker, formatDateWithFullMonth, formatTime } from '../../services/date';
import useApi from '../../services/api';
import SelectAsInput from '../../components/SelectAsInput';
import CustomFieldInput from '../../components/CustomFieldInput';
import Table from '../../components/table';
import SelectStatus from '../../components/SelectStatus';
import ActionStatus from '../../components/ActionStatus';
import SelectCustom from '../../components/SelectCustom';
import CustomFieldDisplay from '../../components/CustomFieldDisplay';
import DateBloc from '../../components/DateBloc';
import useSearchParamState from '../../services/useSearchParamState';
import { mappedIdsToLabels } from '../../recoil/actions';
import Documents from '../../components/Documents';

export function MedicalFile({ person }) {
  const setPersons = useSetRecoilState(personsState);
  const organisation = useRecoilValue(organisationState);

  const [currentConsultationId, setCurrentConsultationId] = useSearchParamState('consultationId', null, { resetOnValueChange: true });
  const [currentConsultation, setCurrentConsultation] = useState(
    !currentConsultationId ? null : person.consultations.find((c) => c._id === currentConsultationId)
  );
  const [showAddConsultation, setShowAddConsultation] = useState(!!currentConsultation);
  const [isNewConsultation, setIsNewConsultation] = useState(false);
  const [consultationTypes, setConsultationTypes] = useSearchParamState('consultationTypes', []);
  const [consultationStatuses, setConsultationStatuses] = useSearchParamState('consultationStatuses', []);

  const [showAddTreatment, setShowAddTreatment] = useState(false);
  const [currentTreatment, setCurrentTreatment] = useState(null);
  const [isNewTreatment, setIsNewTreatment] = useState(false);

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

  const loadConsultation = (consultation) => {
    setShowAddConsultation(true);
    setIsNewConsultation(false);
    setCurrentConsultation(consultation);
    setCurrentConsultationId(consultation._id);
  };

  const resetCurrentConsultation = () => {
    setIsNewConsultation(false);
    setCurrentConsultationId(null);
    setShowAddConsultation(false);
  };

  const loadTreatment = (treatment) => {
    setShowAddTreatment(true);
    setCurrentTreatment(treatment);
  };

  const resetCurrentTreatment = () => {
    setIsNewTreatment(false);
    setShowAddTreatment(false);
  };

  const consultations = useMemo(
    () =>
      (person.consultations || [])
        .filter((c) => !c.onlyVisibleByCreator || c.user === user._id)
        .filter((c) => !consultationStatuses.length || consultationStatuses.includes(c.status))
        .filter((c) => !consultationTypes.length || consultationTypes.includes(c.type)),
    [consultationStatuses, consultationTypes, person.consultations, user._id]
  );

  const allMedicalDocuments = useMemo(() => {
    const ordonnances = person.treatments
      .map((treatment) => treatment.documents?.map((doc) => ({ ...doc, type: 'treatment', treatment })))
      .filter(Boolean)
      .flat();
    const consultationsDocs = person.consultations
      .map((consultation) => consultation.documents?.map((doc) => ({ ...doc, type: 'consultation', consultation })))
      .filter(Boolean)
      .flat();
    const otherDocs = person.documentsMedical;
    return [...ordonnances, ...consultationsDocs, ...otherDocs].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [person.consultations, person.documentsMedical, person.treatments]);

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
                    <Label htmlFor="person-birthdate">Date de naissance</Label>
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
                  <Label htmlFor="person-select-gender">Genre</Label>
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
                    <Label htmlFor="structureMedical">Structure de suivi médical</Label>
                    <Input name="structureMedical" id="structureMedical" value={values.structureMedical || ''} onChange={handleChange} />
                  </FormGroup>
                </Col>
                <Col md={4}>
                  <Label htmlFor="person-select-healthInsurance">Couverture médicale</Label>
                  <SelectAsInput
                    options={healthInsuranceOptions}
                    name="healthInsurance"
                    value={values.healthInsurance || ''}
                    onChange={handleChange}
                    inputId="person-select-healthInsurance"
                    classNamePrefix="person-select-healthInsurance"
                  />
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
              setIsNewTreatment(true);
              setCurrentTreatment({
                _id: uuidv4(),
                startDate: new Date(),
                endDate: null,
                name: '',
                dosage: '',
                frequency: '',
                indication: '',
                user: user._id,
              });
            }}
            color="primary"
            title={'💊&nbsp;&nbsp;Ajouter un traitement'}
            padding="12px 24px"
          />
        </ButtonsFloatingRight>
      </TitleWithButtonsContainer>
      <div className="printonly">
        {(person.treatments || []).map((c) => {
          return (
            <div key={c._id} style={{ marginBottom: '2rem' }}>
              <h4>{c.name}</h4>
              {Object.entries(c)
                .filter(([key, value]) => value && key !== '_id' && key !== 'name' && key !== 'documents')
                .map(([key, value]) => {
                  let field = { type: 'text', label: key };
                  if (key === 'dosage') field = { type: 'text', label: 'Dosage' };
                  if (key === 'frequency') field = { type: 'text', label: 'Fréquence' };
                  if (key === 'indication') field = { type: 'text', label: 'Indication' };
                  if (key === 'startDate') field = { type: 'date-with-time', label: 'Date de début' };
                  if (key === 'endDate') field = { type: 'date-with-time', label: 'Date de fin' };
                  if (key === 'user') {
                    field = { type: 'text', label: 'Créé par' };
                    value = users.find((u) => u._id === value)?.name;
                  }

                  return (
                    <div>
                      {field.label}&nbsp;:{' '}
                      <b>
                        <CustomFieldDisplay key={key} field={field} value={value} />
                      </b>
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
      <Table
        className="noprint"
        data={person.treatments}
        rowKey={'_id'}
        onRowClick={loadTreatment}
        columns={[
          {
            title: 'Nom',
            dataKey: 'name',
            render: (treatment) => {
              return (
                <>
                  <div>{treatment.name}</div>
                  <small className="text-muted">{treatment.indication}</small>
                </>
              );
            },
          },
          {
            title: 'Dosage / fréquence',
            dataKey: 'dosage',
            render: (treatment) => {
              return (
                <>
                  <div>{treatment.dosage}</div>
                  <small className="text-muted">{treatment.frequency}</small>
                </>
              );
            },
          },
          {
            title: 'Dates',
            dataKey: 'endDate',
            render: (e) => {
              if (!!e.endDate) {
                return (
                  <p style={{ fontSize: '12px', margin: 0 }}>
                    Du {formatDateWithFullMonth(e.startDate)}
                    <br /> au {formatDateWithFullMonth(e.endDate)}
                  </p>
                );
              }
              return <p style={{ fontSize: '12px', margin: 0 }}>À partir du {formatDateWithFullMonth(e.startDate)}</p>;
            },
          },
          {
            title: 'Documents',
            dataKey: 'documents',
            render: (e) =>
              e.documents?.length || (
                <small>
                  <i>Aucun</i>
                </small>
              ),
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
              setIsNewConsultation(true);
              const _id = uuidv4();
              setCurrentConsultationId(_id);
              setCurrentConsultation({
                _id,
                date: new Date(),
                name: '',
                type: '',
                status: 'A FAIRE',
                user: user._id,
                onlyVisibleByCreator: false,
              });
            }}
            color="primary"
            title={'🩺&nbsp;&nbsp;Ajouter une consultation'}
            padding="12px 24px"
          />
        </ButtonsFloatingRight>
      </TitleWithButtonsContainer>
      <Row className="noprint" style={{ marginBottom: 40, borderBottom: '1px solid #ddd' }}>
        <Col md={12} lg={6} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <Label style={{ marginRight: 10, width: 155, flexShrink: 0 }} htmlFor="action-select-categories-filter">
            Filtrer par catégorie&nbsp;:
          </Label>
          <div style={{ width: '100%' }}>
            <SelectCustom
              inputId="consultations-select-type-filter"
              options={organisation.consultations.map((e) => ({ _id: e.name, name: e.name }))}
              getOptionValue={(s) => s._id}
              getOptionLabel={(s) => s.name}
              name="types"
              onChange={(selectedTypes) => setConsultationTypes(selectedTypes.map((t) => t._id))}
              isClearable
              isMulti
              value={organisation.consultations.map((e) => ({ _id: e.name, name: e.name })).filter((s) => consultationTypes.includes(s._id))}
            />
          </div>
        </Col>
        <Col md={12} lg={6} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <Label style={{ marginRight: 10, width: 155, flexShrink: 0 }} htmlFor="action-select-status-filter">
            Filtrer par statut&nbsp;:
          </Label>
          <div style={{ width: '100%' }}>
            <SelectCustom
              inputId="consultations-select-status-filter"
              options={mappedIdsToLabels}
              getOptionValue={(s) => s._id}
              getOptionLabel={(s) => s.name}
              name="statuses"
              onChange={(s) => setConsultationStatuses(s.map((s) => s._id))}
              isClearable
              isMulti
              value={mappedIdsToLabels.filter((s) => consultationStatuses.includes(s._id))}
            />
          </div>
        </Col>
      </Row>
      <div className="printonly">
        {consultations.map((c) => {
          return (
            <div key={c._id} style={{ marginBottom: '2rem' }}>
              <h4>{c.name}</h4>
              {Object.entries(c)
                .filter(([key, value]) => value && key !== '_id' && key !== 'name' && key !== 'documents')
                .map(([key, value]) => {
                  let field = organisation.consultations
                    .find((e) => e.name === (c.type || ''))
                    ?.fields.filter((f) => f.enabled)
                    .find((e) => e.name === key);
                  if (!field) {
                    field = { type: 'text', label: key };
                    if (key === 'type') field = { type: 'text', label: 'Type' };
                    if (key === 'status') field = { type: 'text', label: 'Statut' };
                    if (key === 'date') field = { type: 'date-with-time', label: 'Date' };
                    if (key === 'user') {
                      field = { type: 'text', label: 'Créé par' };
                      value = users.find((u) => u._id === value)?.name;
                    }
                  }

                  return (
                    <div key={key}>
                      {field.label}&nbsp;:{' '}
                      <b>
                        <CustomFieldDisplay key={key} field={field} value={value} />
                      </b>
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
      <Table
        className="noprint"
        data={consultations}
        rowKey={'_id'}
        onRowClick={loadConsultation}
        columns={[
          {
            title: 'Date',
            dataKey: 'date-day',
            render: (e) => {
              return <DateBloc date={e.date} />;
            },
          },
          {
            title: 'Heure',
            dataKey: 'date-hour',
            render: (e) => formatTime(e.date),
          },
          {
            title: 'Nom',
            dataKey: 'name',
            render: (e) => {
              return (
                <>
                  <div>{e.name}</div>
                  <small className="text-muted">{e.type}</small>
                </>
              );
            },
          },
          {
            title: 'Créé par',
            dataKey: 'user',
            render: (e) => (e.user ? users.find((u) => u._id === e.user)?.name : ''),
          },
          {
            title: 'Documents',
            dataKey: 'documents',
            render: (e) => e.documents?.length,
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
                  await updatePerson(
                    {
                      consultations: (person.consultations || []).filter((c) => c._id !== e._id).sort((a, b) => new Date(b.date) - new Date(a.date)),
                    },
                    'Consultation supprimée !'
                  );
                }}
                color="danger"
                title={'Supprimer'}
              />
            ),
          },
        ]}
        noData="Aucune consultation enregistrée"
      />
      <Documents
        title={<Title id="all-medical-documents">Tous les documents médicaux</Title>}
        documents={allMedicalDocuments}
        person={person}
        onRowClick={(document) => {
          if (document.type === 'treatment') loadTreatment(document.treatment);
          if (document.type === 'consultation') loadConsultation(document.consultation);
          return null;
        }}
        additionalColumns={[
          {
            title: 'Type',
            render: (doc) => {
              if (doc.type === 'treatment') return 'Traitement';
              if (doc.type === 'consultation') return 'Consultation';
              return '';
            },
          },
        ]}
        conditionForDelete={(doc) => !doc.type}
        onAdd={async (docResponse) => {
          const { data: file, encryptedEntityKey } = docResponse;
          const personResponse = await API.put({
            path: `/person/${person._id}`,
            body: preparePersonForEncryption(
              customFieldsPersonsMedical,
              customFieldsPersonsSocial
            )({
              ...person,
              documentsMedical: [
                ...(person.documentsMedical || []),
                {
                  _id: file.filename,
                  name: file.originalname,
                  encryptedEntityKey,
                  createdAt: new Date(),
                  createdBy: user._id,
                  file,
                },
              ],
            }),
          });
          if (personResponse.ok) {
            const newPerson = personResponse.decryptedData;
            setPersons((persons) =>
              persons.map((p) => {
                if (p._id === person._id) return newPerson;
                return p;
              })
            );
          }
        }}
        onDelete={async (document) => {
          const personResponse = await API.put({
            path: `/person/${person._id}`,
            body: preparePersonForEncryption(
              customFieldsPersonsMedical,
              customFieldsPersonsSocial
            )({
              ...person,
              documentsMedical: person.documentsMedical.filter((d) => d._id !== document._id),
            }),
          });
          if (personResponse.ok) {
            const newPerson = personResponse.decryptedData;
            setPersons((persons) =>
              persons.map((p) => {
                if (p._id === person._id) return newPerson;
                return p;
              })
            );
          }
        }}
      />
      <div style={{ height: '50vh' }} className="noprint" />
      <Modal isOpen={showAddConsultation} toggle={resetCurrentConsultation} size="lg">
        <Formik
          enableReinitialize
          initialValues={currentConsultation}
          validate={(values) => {
            const errors = {};
            if (!values._id) errors._id = "L'identifiant est obligatoire";
            if (!values.name) errors.name = 'Le nom est obligatoire';
            if (!values.status) errors.status = 'Le statut est obligatoire';
            if (!values.date) errors.date = 'La date est obligatoire';
            if (!values.type) errors.type = 'Le type est obligatoire';
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
            consultations = consultations.sort((a, b) => new Date(b.date) - new Date(a.date));
            await updatePerson({ consultations }, 'Consultation mise à jour !');
            resetCurrentConsultation();
          }}>
          {({ values, handleChange, handleSubmit, isSubmitting, touched, errors }) => (
            <React.Fragment>
              <ModalHeader
                toggle={async () => {
                  if (JSON.stringify(values) !== JSON.stringify(currentConsultation)) {
                    if (window.confirm('Voulez-vous enregistrer vos modifications ?')) {
                      handleSubmit();
                    }
                  } else {
                    resetCurrentConsultation();
                  }
                }}>
                {isNewConsultation ? 'Ajouter une consultation' : currentConsultation?.name}
              </ModalHeader>
              <ModalBody>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="create-action-name">Nom</Label>
                      <Input id="create-action-name" name="name" value={values.name} onChange={handleChange} />
                      {touched.name && errors.name && <Error>{errors.name}</Error>}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="type">Type</Label>
                      <SelectCustom
                        id="type"
                        value={{ label: values.type, value: values.type }}
                        onChange={(t) => {
                          handleChange({ currentTarget: { value: t.value, name: 'type' } });
                        }}
                        options={organisation.consultations.map((e) => ({ label: e.name, value: e.name }))}
                      />
                      {touched.type && errors.type && <Error>{errors.type}</Error>}
                    </FormGroup>
                  </Col>
                  {organisation.consultations
                    .find((e) => e.name === values.type)
                    ?.fields.filter((f) => f.enabled)
                    .map((field) => {
                      return (
                        <CustomFieldInput colWidth={6} model="person" values={values} handleChange={handleChange} field={field} key={field.name} />
                      );
                    })}

                  <Col md={6}>
                    <Label htmlFor="new-action-select-status">Statut</Label>
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
                      <Label htmlFor="create-action-dueat">Date</Label>
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
                  <Col md={12}>
                    <FormGroup>
                      <Label htmlFor="create-action-onlyme">
                        <input
                          type="checkbox"
                          id="create-action-onlyme"
                          style={{ marginRight: '0.5rem' }}
                          name="onlyVisibleByCreator"
                          checked={values.onlyVisibleByCreator}
                          onChange={handleChange}
                        />
                        Seulement visible par moi
                      </Label>
                    </FormGroup>
                  </Col>
                  <Col md={12}>
                    <Documents
                      title="Documents"
                      person={person}
                      documents={values.documents || []}
                      onAdd={async (docResponse) => {
                        const { data: file, encryptedEntityKey } = docResponse;
                        handleChange({
                          currentTarget: {
                            value: [
                              ...(values.documents || []),
                              {
                                _id: file.filename,
                                name: file.originalname,
                                encryptedEntityKey,
                                createdAt: new Date(),
                                createdBy: user._id,
                                file,
                              },
                            ],
                            name: 'documents',
                          },
                        });
                      }}
                      onDelete={async (document) => {
                        handleChange({
                          currentTarget: {
                            value: values.documents.filter((d) => d._id !== document._id),
                            name: 'documents',
                          },
                        });
                      }}
                    />
                  </Col>
                </Row>
                <br />
                <ButtonCustom
                  type="submit"
                  color="info"
                  disabled={isSubmitting || JSON.stringify(values) === JSON.stringify(currentConsultation)}
                  onClick={() => !isSubmitting && handleSubmit()}
                  title={isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
                />
              </ModalBody>
            </React.Fragment>
          )}
        </Formik>
      </Modal>
      <Modal isOpen={showAddTreatment} toggle={resetCurrentTreatment} size="lg">
        <Formik
          enableReinitialize
          initialValues={currentTreatment}
          validate={(values) => {
            const errors = {};
            if (!values._id) errors._id = "L'identifiant est obligatoire";
            if (!values.name) errors.name = 'Le nom est obligatoire';
            if (!values.dosage) errors.dosage = 'Le dosage est obligatoire';
            if (!values.frequency) errors.frequency = 'La fréquence est obligatoire';
            if (!values.indication) errors.indication = "L'indication est obligatoire";
            if (!values.startDate) errors.startDate = 'La date de début est obligatoire';
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
            resetCurrentTreatment();
          }}>
          {({ values, handleChange, handleSubmit, isSubmitting, errors, touched }) => (
            <React.Fragment>
              <ModalHeader
                toggle={async () => {
                  if (JSON.stringify(values) !== JSON.stringify(currentTreatment)) {
                    if (window.confirm('Voulez-vous enregistrer vos modifications ?')) {
                      handleSubmit();
                    }
                  } else {
                    resetCurrentTreatment();
                  }
                }}>
                {isNewTreatment ? 'Ajouter un traitement' : currentTreatment?.name}
              </ModalHeader>
              <ModalBody>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="medicine-name">Nom</Label>
                      <Input placeholder="Amoxicilline" name="name" id="medicine-name" value={values.name} onChange={handleChange} />
                      {touched.name && errors.name && <Error>{errors.name}</Error>}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="dosage">Dosage</Label>
                      <Input placeholder="1mg" name="dosage" id="dosage" value={values.dosage} onChange={handleChange} />
                      {touched.dosage && errors.dosage && <Error>{errors.dosage}</Error>}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="frequency">Fréquence</Label>
                      <Input placeholder="1 fois par jour" name="frequency" id="frequency" value={values.frequency} onChange={handleChange} />
                      {touched.frequency && errors.frequency && <Error>{errors.frequency}</Error>}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="indication">Indication</Label>
                      <Input placeholder="Angine" name="indication" id="indication" value={values.indication} onChange={handleChange} />
                      {touched.indication && errors.indication && <Error>{errors.indication}</Error>}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="startDate">Date de début</Label>
                      <div>
                        <DatePicker
                          id="startDate"
                          locale="fr"
                          className="form-control"
                          selected={dateForDatePicker(values.startDate)}
                          onChange={(date) => handleChange({ target: { value: date, name: 'startDate' } })}
                          dateFormat={'dd/MM/yyyy'}
                        />
                      </div>
                      {touched.startDate && errors.startDate && <Error>{errors.startDate}</Error>}
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label htmlFor="endDate">Date de fin</Label>
                      <div>
                        <DatePicker
                          id="endDate"
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
                  <Col md={12}>
                    <Documents
                      title="Documents"
                      person={person}
                      documents={values.documents || []}
                      onAdd={async (docResponse) => {
                        const { data: file, encryptedEntityKey } = docResponse;
                        handleChange({
                          currentTarget: {
                            value: [
                              ...(values.documents || []),
                              {
                                _id: file.filename,
                                name: file.originalname,
                                encryptedEntityKey,
                                createdAt: new Date(),
                                createdBy: user._id,
                                file,
                              },
                            ],
                            name: 'documents',
                          },
                        });
                      }}
                      onDelete={async (document) => {
                        handleChange({
                          currentTarget: {
                            value: values.documents.filter((d) => d._id !== document._id),
                            name: 'documents',
                          },
                        });
                      }}
                    />
                  </Col>
                </Row>
                <br />
                <ButtonCustom
                  type="submit"
                  color="info"
                  disabled={isSubmitting || JSON.stringify(values) === JSON.stringify(currentTreatment)}
                  onClick={() => !isSubmitting && handleSubmit()}
                  title={isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
                />
              </ModalBody>
            </React.Fragment>
          )}
        </Formik>
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
