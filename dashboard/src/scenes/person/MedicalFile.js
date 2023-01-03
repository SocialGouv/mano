import React, { useEffect, useMemo, useState } from 'react';
import { FormGroup, Input, Label, Row, Col, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { Formik } from 'formik';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import { useRecoilValue, useSetRecoilState, useRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';
import ButtonCustom from '../../components/ButtonCustom';
import { personsState, usePreparePersonForEncryption, personFieldsSelector } from '../../recoil/persons';
import { currentTeamState, organisationState, usersState, userState } from '../../recoil/auth';
import { dateForDatePicker, formatDateWithFullMonth, formatTime } from '../../services/date';
import useApi from '../../services/api';
import useSearchParamState from '../../services/useSearchParamState';
import SelectAsInput from '../../components/SelectAsInput';
import CustomFieldInput from '../../components/CustomFieldInput';
import Table from '../../components/table';
import ActionStatus from '../../components/ActionStatus';
import SelectCustom from '../../components/SelectCustom';
import CustomFieldDisplay from '../../components/CustomFieldDisplay';
import DateBloc from '../../components/DateBloc';
import { mappedIdsToLabels, DONE, CANCEL, sortActionsOrConsultations } from '../../recoil/actions';
import Documents from '../../components/Documents';
import { arrayOfitemsGroupedByConsultationSelector } from '../../recoil/selectors';
import { prepareTreatmentForEncryption, treatmentsState } from '../../recoil/treatments';
import { medicalFileState, prepareMedicalFileForEncryption, customFieldsMedicalFileSelector } from '../../recoil/medicalFiles';
import { modalConfirmState } from '../../components/ModalConfirm';
import ActionOrConsultationName from '../../components/ActionOrConsultationName';
import { useLocalStorage } from 'react-use';
import ConsultationModal from '../../components/ConsultationModal';
import { consultationsState } from '../../recoil/consultations';

export function MedicalFile({ person }) {
  const setPersons = useSetRecoilState(personsState);
  const organisation = useRecoilValue(organisationState);
  const setAllConsultations = useSetRecoilState(consultationsState);
  const allConsultations = useRecoilValue(arrayOfitemsGroupedByConsultationSelector);
  const [allTreatments, setAllTreatments] = useRecoilState(treatmentsState);
  const [allMedicalFiles, setAllMedicalFiles] = useRecoilState(medicalFileState);
  const setModalConfirmState = useSetRecoilState(modalConfirmState);
  const team = useRecoilValue(currentTeamState);

  const [currentConsultationId, setCurrentConsultationId] = useSearchParamState('consultationId', null);
  const [showConsultationModal, setShowConsultationModal] = useState(!!currentConsultationId);
  const [consultation, setConsultation] = useState(!currentConsultationId ? null : allConsultations?.find((c) => c._id === currentConsultationId));

  const [consultationTypes, setConsultationTypes] = useLocalStorage('consultation-types', []);
  const [consultationStatuses, setConsultationStatuses] = useLocalStorage('consultation-statuses', []);
  const [consultationsSortBy, setConsultationsSortBy] = useLocalStorage('consultations-sortBy', 'dueAt');
  const [consultationsSortOrder, setConsultationsSortOrder] = useLocalStorage('consultations-sortOrder', 'ASC');

  const [showAddTreatment, setShowAddTreatment] = useState(false);
  const [currentTreatment, setCurrentTreatment] = useState(null);
  const [isNewTreatment, setIsNewTreatment] = useState(false);

  const personFields = useRecoilValue(personFieldsSelector);
  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);
  const preparePersonForEncryption = usePreparePersonForEncryption();

  const user = useRecoilValue(userState);
  const users = useRecoilValue(usersState);
  const API = useApi();

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
      (allConsultations || [])
        .filter((c) => c.person === person._id)
        .filter((c) => !consultationStatuses.length || consultationStatuses.includes(c.status))
        .filter((c) => !consultationTypes.length || consultationTypes.includes(c.type))
        .sort(sortActionsOrConsultations(consultationsSortBy, consultationsSortOrder)),
    [allConsultations, consultationStatuses, consultationTypes, person._id, consultationsSortBy, consultationsSortOrder]
  );

  const treatments = useMemo(() => (allTreatments || []).filter((t) => t.person === person._id), [allTreatments, person._id]);

  const medicalFile = useMemo(() => (allMedicalFiles || []).find((m) => m.person === person._id), [allMedicalFiles, person._id]);

  useEffect(() => {
    if (!medicalFile) {
      (async () => {
        const response = await API.post({
          path: '/medical-file',
          body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({ person: person._id, documents: [], organisation: organisation._id }),
        });
        if (!response.ok) return;
        setAllMedicalFiles((medicalFiles) => [...medicalFiles, response.decryptedData]);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicalFile]);

  const allMedicalDocuments = useMemo(() => {
    const ordonnances =
      treatments
        ?.map((treatment) => treatment.documents?.map((doc) => ({ ...doc, type: 'treatment', treatment })))
        .filter(Boolean)
        .flat() || [];
    const consultationsDocs =
      consultations
        ?.map((consultation) => consultation.documents?.map((doc) => ({ ...doc, type: 'consultation', consultation })))
        .filter(Boolean)
        .flat() || [];
    const otherDocs = medicalFile?.documents || [];
    return [...ordonnances, ...consultationsDocs, ...otherDocs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [consultations, medicalFile?.documents, treatments]);

  return (
    <>
      <TitleWithButtonsContainer>
        <Title>Informations générales</Title>
        <ButtonsFloatingRight>
          <ButtonCustom
            icon={false}
            disabled={false}
            onClick={() => {
              window.print();
            }}
            color="primary"
            title={'📋\u00A0\u00A0Imprimer le dossier PDF'}
            padding="12px 24px"
          />
        </ButtonsFloatingRight>
      </TitleWithButtonsContainer>
      <Formik
        enableReinitialize
        initialValues={person}
        onSubmit={async (body) => {
          const response = await API.put({
            path: `/person/${person._id}`,
            body: preparePersonForEncryption({ ...person, ...body }),
          });
          if (!response.ok) return;
          setPersons((persons) =>
            persons.map((p) => {
              if (p._id === person._id) return response.decryptedData;
              return p;
            })
          );
          toast.success('Mise à jour effectuée !');
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
                    options={personFields.find((f) => f.name === 'gender').options}
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
                  <Label htmlFor="person-select-healthInsurances">Couverture(s) médicale(s)</Label>
                  <SelectCustom
                    options={personFields.find((f) => f.name === 'healthInsurances').options.map((_option) => ({ value: _option, label: _option }))}
                    value={values.healthInsurances?.map((_option) => ({ value: _option, label: _option })) || []}
                    getOptionValue={(i) => i.value}
                    getOptionLabel={(i) => i.label}
                    onChange={(values) => handleChange({ currentTarget: { value: values.map((v) => v.value), name: 'healthInsurances' } })}
                    name="healthInsurances"
                    isClearable={false}
                    isMulti
                    inputId="person-select-healthInsurances"
                    classNamePrefix="person-select-healthInsurances"
                    placeholder={' -- Choisir -- '}
                  />
                </Col>
              </Row>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
                <ButtonCustom
                  title={'Mettre à jour'}
                  disabled={JSON.stringify(person) === JSON.stringify(values)}
                  loading={isSubmitting}
                  onClick={handleSubmit}
                />
              </div>
            </React.Fragment>
          );
        }}
      </Formik>
      {!!medicalFile && !!customFieldsMedicalFile.filter((f) => f.enabled || f.enabledTeams?.includes(team._id)).length && (
        <>
          <TitleWithButtonsContainer>
            <Title>Dossier médical</Title>
          </TitleWithButtonsContainer>
          <Formik
            enableReinitialize
            initialValues={medicalFile}
            onSubmit={async (body) => {
              const response = await API.put({
                path: `/medical-file/${medicalFile._id}`,
                body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({ ...medicalFile, ...body }),
              });
              if (!response.ok) return;
              setAllMedicalFiles((medicalFiles) =>
                medicalFiles.map((m) => {
                  if (m._id === medicalFile._id) return response.decryptedData;
                  return m;
                })
              );
              toast.success('Mise à jour effectuée !');
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting }) => {
              return (
                <React.Fragment>
                  <Row>
                    {customFieldsMedicalFile
                      .filter((f) => f.enabled || f.enabledTeams?.includes(team._id))
                      .map((field) => (
                        <CustomFieldInput model="person" values={values} handleChange={handleChange} field={field} key={field.name} />
                      ))}
                  </Row>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
                    <ButtonCustom
                      title={'Mettre à jour'}
                      disabled={JSON.stringify(medicalFile) === JSON.stringify(values)}
                      loading={isSubmitting}
                      onClick={handleSubmit}
                    />
                  </div>
                </React.Fragment>
              );
            }}
          </Formik>
        </>
      )}
      <hr />
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
                person: person._id,
                organisation: organisation._id,
              });
            }}
            color="primary"
            title={'💊\u00A0\u00A0Ajouter un traitement'}
            padding="12px 24px"
          />
        </ButtonsFloatingRight>
      </TitleWithButtonsContainer>
      <div className="printonly">
        {(treatments || []).map((c) => {
          const hiddenKeys = ['_id', 'name', 'documents', 'encryptedEntityKey', 'entityKey', 'updatedAt', 'createdAt', 'person', 'organisation'];
          return (
            <div key={c._id} style={{ marginBottom: '2rem' }}>
              <h4>{c.name}</h4>
              {Object.entries(c)
                .filter(([key, value]) => value && !hiddenKeys.includes(key))
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
                    <div key={key}>
                      {field.label}&nbsp;:{' '}
                      <b>
                        <CustomFieldDisplay key={key} type={field.type} value={value} />
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
        data={treatments}
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
            title: 'Créé par',
            dataKey: 'user',
            render: (e) => (e.user ? users.find((u) => u._id === e.user)?.name : ''),
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
            render: (treatment) => (
              <ButtonCustom
                style={{ margin: 'auto' }}
                icon={false}
                disabled={false}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!window.confirm('Voulez-vous supprimer ce traitement ?')) return;
                  const response = await API.delete({ path: `/treatment/${treatment._id}` });
                  if (!response.ok) return;
                  setAllTreatments((all) => all.filter((t) => t._id !== treatment._id));
                  toast.success('Traitement supprimé !');
                }}
                color="danger"
                title="Supprimer"
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
            ariaLabel="Ajouter une consultation"
            onClick={() => {
              setCurrentConsultationId(null);
              setConsultation(null);
              setShowConsultationModal(true);
            }}
            color="primary"
            title={'🩺\u00A0\u00A0Ajouter une consultation'}
            padding="12px 24px"
          />
        </ButtonsFloatingRight>
      </TitleWithButtonsContainer>
      {!!consultations.length && (
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
      )}
      <div className="printonly">
        {consultations.map((c) => {
          const hiddenKeys = [
            '_id',
            'name',
            'documents',
            'encryptedEntityKey',
            'entityKey',
            'onlyVisibleBy',
            'updatedAt',
            'createdAt',
            'person',
            'organisation',
            'isConsultation',
            'withTime',
            'personPopulated',
            'userPopulated',
          ];
          return (
            <div key={c._id} style={{ marginBottom: '2rem' }}>
              <h4>{c.name}</h4>
              {Object.entries(c)
                .filter(([key, value]) => value && !hiddenKeys.includes(key))
                .map(([key, value]) => {
                  let field = organisation.consultations
                    .find((e) => e.name === (c.type || ''))
                    ?.fields.filter((f) => f.enabled || f.enabledTeams?.includes(team._id))
                    .find((e) => e.name === key);
                  if (!field) {
                    field = { type: 'text', label: key };
                    if (key === 'type') field = { type: 'text', label: 'Type' };
                    if (key === 'status') field = { type: 'text', label: 'Statut' };
                    if (key === 'dueAt') field = { type: 'date-with-time', label: 'Date' };
                    if (key === 'user') {
                      field = { type: 'text', label: 'Créé par' };
                      value = users.find((u) => u._id === value)?.name;
                    }
                  }

                  return (
                    <div key={key}>
                      {field.label}&nbsp;:{' '}
                      <b>
                        <CustomFieldDisplay key={key} type={field.type} value={value} />
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
        onRowClick={(item) => {
          setCurrentConsultationId(item._id);
          setConsultation(item);
          setShowConsultationModal(true);
        }}
        columns={[
          {
            title: 'Date',
            dataKey: 'dueAt',
            onSortOrder: setConsultationsSortOrder,
            onSortBy: setConsultationsSortBy,
            sortBy: consultationsSortBy,
            sortOrder: consultationsSortOrder,
            render: (e) => {
              return <DateBloc date={[DONE, CANCEL].includes(e.status) ? e.completedAt : e.dueAt} />;
            },
          },
          {
            title: 'Heure',
            dataKey: 'time',
            render: (e) => formatTime(e.dueAt),
          },
          {
            title: 'Nom',
            dataKey: 'name',
            onSortOrder: setConsultationsSortOrder,
            onSortBy: setConsultationsSortBy,
            sortBy: consultationsSortBy,
            sortOrder: consultationsSortOrder,
            render: (e) => <ActionOrConsultationName item={e} />,
          },
          {
            title: 'Créé par',
            dataKey: 'user',
            onSortOrder: setConsultationsSortOrder,
            onSortBy: setConsultationsSortBy,
            sortBy: consultationsSortBy,
            sortOrder: consultationsSortOrder,
            render: (e) => (e.user ? users.find((u) => u._id === e.user)?.name : ''),
          },
          {
            title: 'Documents',
            dataKey: 'documents',
            onSortOrder: setConsultationsSortOrder,
            onSortBy: setConsultationsSortBy,
            sortBy: consultationsSortBy,
            sortOrder: consultationsSortOrder,
            render: (e) => e.documents?.length,
          },
          {
            title: 'Statut',
            dataKey: 'status',
            render: (e) => <ActionStatus status={e.status} />,
          },
          {
            title: 'Action',
            render: (consultation) => (
              <ButtonCustom
                style={{ margin: 'auto' }}
                icon={false}
                disabled={false}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!window.confirm('Voulez-vous supprimer cette consultation ?')) return;
                  const response = await API.delete({ path: `/consultation/${consultation._id}` });
                  if (!response.ok) return;
                  setAllConsultations((all) => all.filter((t) => t._id !== consultation._id));
                  toast.success('Consultation supprimée !');
                }}
                color="danger"
                title="Supprimer"
              />
            ),
          },
        ]}
        noData="Aucune consultation enregistrée"
      />
      <Documents
        title={<Title id="all-medical-documents">Tous les documents médicaux</Title>}
        documents={allMedicalDocuments}
        personId={person._id}
        onRowClick={(document) => {
          if (document.type === 'treatment') loadTreatment(document.treatment);
          if (document.type === 'consultation') {
            setConsultation(document.consultation);
            setShowConsultationModal(true);
          }
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
          const medicalFileResponse = await API.put({
            path: `/medical-file/${medicalFile._id}`,
            body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({
              ...medicalFile,
              documents: [
                ...(medicalFile.documents || []),
                {
                  _id: file.filename,
                  name: file.originalname,
                  encryptedEntityKey,
                  createdAt: new Date(),
                  createdBy: user._id,
                  downloadPath: `/person/${person._id}/document/${file.filename}`,
                  file,
                },
              ],
            }),
          });
          if (medicalFileResponse.ok) {
            const newMedicalFile = medicalFileResponse.decryptedData;
            setAllMedicalFiles((allMedicalFiles) =>
              allMedicalFiles.map((m) => {
                if (m._id === medicalFile._id) return newMedicalFile;
                return m;
              })
            );
          }
        }}
        onDelete={async (document) => {
          const medicalFileResponse = await API.put({
            path: `/medical-file/${medicalFile._id}`,
            body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({
              ...medicalFile,
              documents: medicalFile.documents.filter((d) => d._id !== document._id),
            }),
          });
          if (medicalFileResponse.ok) {
            const newMedicalFile = medicalFileResponse.decryptedData;
            setAllMedicalFiles((allMedicalFiles) =>
              allMedicalFiles.map((m) => {
                if (m._id === medicalFile._id) return newMedicalFile;
                return m;
              })
            );
          }
        }}
      />
      <div style={{ height: '50vh' }} className="noprint" />
      <Modal isOpen={showAddTreatment} toggle={resetCurrentTreatment} size="lg" backdrop="static">
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
            const treatmentResponse = isNewTreatment
              ? await API.post({
                  path: '/treatment',
                  body: prepareTreatmentForEncryption(values),
                })
              : await API.put({
                  path: `/treatment/${currentTreatment._id}`,
                  body: prepareTreatmentForEncryption(values),
                });
            if (!treatmentResponse.ok) return;
            if (isNewTreatment) {
              setAllTreatments((all) => [...all, treatmentResponse.decryptedData].sort((a, b) => new Date(b.startDate) - new Date(a.startDate)));
              toast.success('Traitement créé !');
            } else {
              setAllTreatments((all) =>
                all
                  .map((c) => {
                    if (c._id === currentTreatment._id) return treatmentResponse.decryptedData;
                    return c;
                  })
                  .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
              );
              toast.success('Traitement mis à jour !');
            }
            resetCurrentTreatment();
          }}>
          {({ values, handleChange, handleSubmit, isSubmitting, errors, touched }) => (
            <React.Fragment>
              <ModalHeader
                toggle={async () => {
                  if (JSON.stringify(values) === JSON.stringify(currentTreatment)) return resetCurrentTreatment();
                  setModalConfirmState({
                    open: true,
                    options: {
                      title: 'Voulez-vous enregistrer vos modifications ?',
                      buttons: [
                        {
                          text: 'Annuler',
                          style: 'cancel',
                        },
                        {
                          text: 'Non',
                          style: 'danger',
                          onClick: resetCurrentTreatment,
                        },
                        {
                          text: 'Oui',
                          onClick: handleSubmit,
                        },
                      ],
                    },
                  });
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
                      personId={person._id}
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
                                downloadPath: `/person/${person._id}/document/${file.filename}`,
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
                  disabled={isSubmitting || JSON.stringify(values) === JSON.stringify(currentTreatment)}
                  onClick={() => !isSubmitting && handleSubmit()}
                  title={isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
                />
              </ModalBody>
            </React.Fragment>
          )}
        </Formik>
      </Modal>
      {showConsultationModal && (
        <ConsultationModal
          consultation={consultation}
          onClose={() => {
            setCurrentConsultationId(null);
            setShowConsultationModal(false);
          }}
          personId={person._id}
        />
      )}
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
