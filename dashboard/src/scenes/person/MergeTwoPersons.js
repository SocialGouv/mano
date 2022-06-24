import React, { useMemo, useState } from 'react';
import { Col, Button, Row, Modal, ModalBody, ModalHeader } from 'reactstrap';
import styled from 'styled-components';
import { Formik } from 'formik';
import { useRecoilState, useRecoilValue } from 'recoil';
import { toastr } from 'react-redux-toastr';
import dayjs from 'dayjs';
import ButtonCustom from '../../components/ButtonCustom';
import {
  commentForUpdatePerson,
  customFieldsPersonsMedicalSelector,
  customFieldsPersonsSocialSelector,
  personFieldsIncludingCustomFieldsSelector,
  personsState,
  preparePersonForEncryption,
} from '../../recoil/persons';
import SelectCustom from '../../components/SelectCustom';
import CustomFieldInput from '../../components/CustomFieldInput';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import UserName from '../../components/UserName';
import Table from '../../components/table';
import { currentTeamState, organisationState, teamsState, userState } from '../../recoil/auth';
import useApi from '../../services/api';
import { commentsState, prepareCommentForEncryption } from '../../recoil/comments';
import { actionsState, prepareActionForEncryption } from '../../recoil/actions';
import { passagesState, preparePassageForEncryption } from '../../recoil/passages';
import { prepareRelPersonPlaceForEncryption, relsPersonPlaceState } from '../../recoil/relPersonPlace';
import { consultationsState, prepareConsultationForEncryption } from '../../recoil/consultations';
import { prepareTreatmentForEncryption, treatmentsState } from '../../recoil/treatments';
import { medicalFileState, prepareMedicalFileForEncryption } from '../../recoil/medicalFiles';
import { theme } from '../../config';

const getRawValue = (field, value) => {
  try {
    if (field.type === 'text') return <span>{value}</span>;
    if (field.type === 'textarea') return <span>{value}</span>;
    if (field.type === 'number') return <span>{value}</span>;
    if (field.type === 'date') return <span>{dayjs(value).format('DD/MM/YYYY')}</span>;
    if (field.type === 'date-with-time') return <span>{dayjs(value).format('DD/MM/YYYY HH:mm')}</span>;
    if (field.type === 'yes-no') return <span>{value}</span>;
    if (field.type === 'enum') return <span>{value}</span>;
    if (field.type === 'multi-choice') return <span>{(value || []).join(', ')}</span>;
    if (field.type === 'boolean') return <input type="checkbox" defaultChecked={value} />;
  } catch (e) {
    console.log(e);
    console.log(field, value);
  }
  return '';
};

const initMergeValue = (field, originPerson = {}, personToMergeWith = {}) => {
  if (Array.isArray(originPerson[field.name])) {
    if (!originPerson[field.name]?.length) return personToMergeWith[field.name];
    return originPerson[field.name];
  }
  return originPerson[field.name] || personToMergeWith[field.name];
};

const MergeTwoPersons = ({ person }) => {
  const API = useApi();
  const [open, setOpen] = useState(false);

  const [originPerson, setOriginPerson] = useState(person);
  const [personToMergeWith, setPersonToMergeWith] = useState(null);

  const [persons, setPersons] = useRecoilState(personsState);
  const teams = useRecoilValue(teamsState);
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const [comments, setComments] = useRecoilState(commentsState);
  const [actions, setActions] = useRecoilState(actionsState);
  const [passages, setPassages] = useRecoilState(passagesState);
  const [relsPersonPlace, setRelsPersonPlace] = useRecoilState(relsPersonPlaceState);
  const [consultations, setConsultations] = useRecoilState(consultationsState);
  const [medicalFiles, setMedicalFiles] = useRecoilState(medicalFileState);
  const [treatments, setTreatments] = useRecoilState(treatmentsState);

  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsMedicalFile = useRecoilValue(customFieldsPersonsMedicalSelector);

  const allFields = useRecoilValue(personFieldsIncludingCustomFieldsSelector);

  const personsToMergeWith = useMemo(() => persons.filter((p) => p._id !== originPerson?._id), [persons, originPerson]);

  const originPersonMedicalFile = useMemo(() => medicalFiles.find((p) => p.person === originPerson._id), [medicalFiles, originPerson]);
  const personToMergeMedicalFile = useMemo(() => medicalFiles.find((p) => p.person === personToMergeWith?._id), [medicalFiles, personToMergeWith]);

  const fields = useMemo(() => {
    if (!originPerson || !personToMergeWith) return [];
    return [...new Set([...Object.keys(originPerson), ...Object.keys(personToMergeWith)])]
      .filter((fieldName) => !['_id', 'encryptedEntityKey', 'entityKey', 'createdAt', 'updatedAt', 'organisation', 'documents'].includes(fieldName))
      .map((fieldName) => allFields.find((f) => f.name === fieldName))
      .filter(Boolean);
  }, [originPerson, personToMergeWith, allFields]);

  const medicalFields = useMemo(() => {
    if (!originPerson || !personToMergeWith) return [];
    return [...new Set([...Object.keys(originPersonMedicalFile || {}), ...Object.keys(personToMergeMedicalFile || {})])]
      .filter(
        (fieldName) =>
          !['_id', 'encryptedEntityKey', 'entityKey', 'createdAt', 'updatedAt', 'organisation', 'documents', 'person'].includes(fieldName)
      )
      .map((fieldName) => customFieldsMedicalFile.find((f) => f.name === fieldName))
      .filter(Boolean);
  }, [originPerson, personToMergeWith, originPersonMedicalFile, personToMergeMedicalFile, customFieldsMedicalFile]);

  const initMergedPerson = useMemo(() => {
    if (!originPerson || !personToMergeWith) return null;
    const mergedPerson = {};
    for (let field of fields) {
      mergedPerson[field.name] = initMergeValue(field, originPerson, personToMergeWith);
    }
    for (let medicalField of medicalFields) {
      mergedPerson[medicalField.name] = initMergeValue(medicalField, originPersonMedicalFile, personToMergeMedicalFile);
    }
    return {
      _id: originPerson._id,
      organisation: originPerson.organisation,
      createdAt: originPerson.createdAt,
      updatedAt: originPerson.updatedAt,
      entityKey: originPerson.entityKey,
      documents: [...(originPerson.documents || []), ...(personToMergeWith.documents || [])],
      ...mergedPerson,
    };
  }, [originPerson, personToMergeWith, fields, medicalFields, originPersonMedicalFile, personToMergeMedicalFile]);

  return (
    <>
      <ButtonCustom title="Fusionner avec un autre dossier" color="link" onClick={() => setOpen(true)} />
      <StyledModal isOpen={open} toggle={() => setOpen(false)} size="xl" centered>
        <ModalHeader toggle={() => setOpen(false)} color="danger">
          <Row style={{ justifyContent: 'center', marginTop: 10 }}>
            <Col style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }} md={4}>
              Fusionner
            </Col>
            <Col md={6}>
              <SelectCustom
                options={personsToMergeWith}
                inputId="origin-person-with-select"
                isClearable
                isSearchable
                onChange={setOriginPerson}
                value={originPerson}
                getOptionValue={(i) => i._id}
                getOptionLabel={(i) => i?.name || ''}
              />
            </Col>
            <Col md={2} />
          </Row>
          <Row style={{ justifyContent: 'center', marginTop: 10 }}>
            <Col style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }} md={4}>
              avec
            </Col>
            <Col md={6}>
              <SelectCustom
                options={personsToMergeWith}
                inputId="person-to-merge-with-select"
                isClearable
                isSearchable
                onChange={setPersonToMergeWith}
                value={personToMergeWith}
                getOptionValue={(i) => i._id}
                getOptionLabel={(i) => i?.name || ''}
              />
            </Col>
            <Col md={2} />
          </Row>
          {!user.healthcareProfessional && (
            <p style={{ color: theme.redDark, textAlign: 'center', lineHeight: '1rem', width: '75%', margin: '5px auto' }}>
              <small>
                Attention: si cette personne a un dossier médical, il faut que la fusion soit effectuée par un professionnel de santé. Sinon, toute
                donnée médicale de la personne fusionnée sera définitivement perdue.
              </small>
            </p>
          )}
        </ModalHeader>
        <ModalBody>
          {!!initMergedPerson && (
            <Formik
              initialValues={initMergedPerson}
              enableReinitialize
              onSubmit={async (body, { setSubmitting }) => {
                if (window.confirm('Cette opération est irréversible, êtes-vous sûr ?')) {
                  if (!body.followedSince) body.followedSince = originPerson.createdAt;
                  body.entityKey = originPerson.entityKey;
                  const response = await API.put({
                    path: `/person/${originPerson._id}`,
                    body: preparePersonForEncryption(customFieldsPersonsMedical, customFieldsPersonsSocial)(body),
                  });
                  if (response.ok) {
                    const newPerson = response.decryptedData;
                    setPersons((persons) =>
                      persons.map((p) => {
                        if (p._id === originPerson._id) return newPerson;
                        return p;
                      })
                    );
                    const comment = commentForUpdatePerson({ newPerson, oldPerson: originPerson });
                    if (comment) {
                      comment.user = user._id;
                      comment.team = currentTeam._id;
                      comment.organisation = organisation._id;
                      const commentResponse = await API.post({ path: '/comment', body: prepareCommentForEncryption(comment) });
                      if (commentResponse.ok) setComments((comments) => [commentResponse.decryptedData, ...comments]);
                    }
                  }
                  for (const action of actions.filter((a) => a.person === personToMergeWith._id)) {
                    const actionResponse = await API.put({
                      path: `/action/${action._id}`,
                      body: prepareActionForEncryption({ ...action, person: originPerson._id }),
                    });
                    if (actionResponse.ok) {
                      const newAction = actionResponse.decryptedData;
                      setActions((actions) =>
                        actions.map((a) => {
                          if (a._id === newAction._id) return newAction;
                          return a;
                        })
                      );
                    }
                  }
                  for (let comment of comments.filter((c) => c.person === personToMergeWith._id)) {
                    const commentRes = await API.put({
                      path: `/comment/${comment._id}`,
                      body: prepareCommentForEncryption({ ...comment, person: originPerson._id }),
                    });
                    if (commentRes.ok) {
                      setComments((comments) =>
                        comments.map((c) => {
                          if (c._id === comment._id) return commentRes.decryptedData;
                          return c;
                        })
                      );
                    }
                  }
                  for (let relPersonPlace of relsPersonPlace.filter((rel) => rel.person === personToMergeWith._id)) {
                    const relRes = await API.delete({ path: `/relPersonPlace/${relPersonPlace._id}` });
                    if (relRes.ok) setRelsPersonPlace((relsPersonPlace) => relsPersonPlace.filter((rel) => rel._id !== relPersonPlace._id));
                    const res = await API.post({
                      path: '/relPersonPlace',
                      body: prepareRelPersonPlaceForEncryption({ place: relPersonPlace.place, person: originPerson._id, user: relPersonPlace.user }),
                    });
                    if (res.ok) setRelsPersonPlace((relsPersonPlace) => [res.decryptedData, ...relsPersonPlace]);
                  }
                  for (let passage of passages.filter((p) => p.person === personToMergeWith._id)) {
                    const passageRes = await API.put({
                      path: `/passage/${passage._id}`,
                      body: preparePassageForEncryption({ ...passage, person: originPerson._id }),
                    });
                    if (passageRes.ok) {
                      setPassages((passages) =>
                        passages.map((p) => {
                          if (p._id === passage._id) return passageRes.decryptedData;
                          return p;
                        })
                      );
                    }
                  }
                  for (let consultation of consultations.filter((p) => p.person === personToMergeWith._id)) {
                    const consultationRes = await API.put({
                      path: `/consultation/${consultation._id}`,
                      body: prepareConsultationForEncryption(organisation.consultations)({ ...consultation, person: originPerson._id }),
                    });
                    if (consultationRes.ok) {
                      setConsultations((consultations) =>
                        consultations.map((c) => {
                          if (c._id === consultation._id) return consultationRes.decryptedData;
                          return c;
                        })
                      );
                    }
                  }
                  if (!originPersonMedicalFile && !!personToMergeMedicalFile) {
                    const medicalFileRes = await API.put({
                      path: `/medical-file/${personToMergeMedicalFile._id}`,
                      body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({
                        ...body,
                        documents: personToMergeMedicalFile.documents || [],
                        person: originPerson._id,
                      }),
                    });
                    if (medicalFileRes.ok) {
                      setMedicalFiles((medicalFiles) =>
                        medicalFiles.map((m) => {
                          if (m._id === personToMergeMedicalFile._id) return medicalFileRes.decryptedData;
                          return m;
                        })
                      );
                    }
                  } else if (!!originPersonMedicalFile && !!personToMergeMedicalFile && !!personToMergeMedicalFile?.documents?.length) {
                    const medicalFileRes = await API.put({
                      path: `/medical-file/${originPersonMedicalFile._id}`,
                      body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({
                        ...body,
                        person: originPerson._id,
                        documents: [...(originPersonMedicalFile.documents || []), ...(personToMergeMedicalFile.documents || [])],
                      }),
                    });
                    if (medicalFileRes.ok) {
                      await API.delete({ path: `/medical-file/${personToMergeMedicalFile._id}` });
                      setMedicalFiles((medicalFiles) =>
                        medicalFiles
                          .map((m) => {
                            if (m._id === originPersonMedicalFile._id) return medicalFileRes.decryptedData;
                            return m;
                          })
                          .filter((m) => m._id !== personToMergeMedicalFile._id)
                      );
                    }
                  }
                  for (let treatment of treatments.filter((p) => p.person === personToMergeWith._id)) {
                    const treatmentRes = await API.put({
                      path: `/treatment/${treatment._id}`,
                      body: prepareTreatmentForEncryption({ ...treatment, person: originPerson._id }),
                    });
                    if (treatmentRes.ok) {
                      setTreatments((treatments) =>
                        treatments.map((t) => {
                          if (t._id === treatment._id) return treatmentRes.decryptedData;
                          return t;
                        })
                      );
                    }
                  }
                  const personToMergeWithRes = await API.delete({ path: `/person/${personToMergeWith._id}` });
                  if (personToMergeWithRes.ok) setPersons((persons) => persons.filter((p) => p._id !== personToMergeWith._id));
                }
                toastr.success('Fusion réussie !');
                setOpen(false);
                setSubmitting(false);
              }}>
              {({ values, handleChange, handleSubmit, isSubmitting }) => (
                <>
                  <Table
                    data={[...fields, ...medicalFields]}
                    // use this key prop to reset table and reset sortablejs on each element added/removed
                    rowKey="name"
                    columns={[
                      {
                        dataKey: 'field',
                        render: (field) => {
                          console.log(field);
                          return <Field>{field.name === 'user' ? 'Créé(e) par' : field.label}</Field>;
                        },
                      },
                      {
                        title: originPerson?.name,
                        dataKey: 'originPerson',
                        render: (field) => {
                          if (field.name === 'user')
                            return (
                              <Col md={12}>
                                <UserName id={originPerson.user} />
                              </Col>
                            );
                          if (field.name === 'assignedTeams') {
                            return <Col md={12}>{originPerson?.assignedTeams?.map((id) => teams.find((t) => t._id === id)?.name).join(', ')}</Col>;
                          }
                          return getRawValue(field, originPerson[field.name] || originPersonMedicalFile?.[field.name]);
                        },
                      },
                      {
                        title: personToMergeWith?.name,
                        dataKey: 'personToMergeWith',
                        render: (field) => {
                          if (field.name === 'user')
                            return (
                              <Col md={12}>
                                <UserName id={personToMergeWith?.user} />
                              </Col>
                            );
                          if (field.name === 'assignedTeams') {
                            return (
                              <Col md={12}>{personToMergeWith?.assignedTeams?.map((id) => teams.find((t) => t._id === id)?.name).join(', ')}</Col>
                            );
                          }
                          return getRawValue(field, personToMergeWith?.[field.name] || personToMergeMedicalFile?.[field.name]);
                        },
                      },
                      {
                        title: 'Je garde :',
                        dataKey: 'keeping',
                        render: (field) => {
                          if (field.name === 'user')
                            return (
                              <Col md={12}>
                                <UserName
                                  id={values.user}
                                  canAddUser
                                  handleChange={async (newUser) => handleChange({ currentTarget: { name: 'user', value: newUser } })}
                                />
                              </Col>
                            );
                          if (field.name === 'assignedTeams')
                            return (
                              <Col md={12}>
                                <SelectTeamMultiple
                                  onChange={(teams) => handleChange({ target: { value: teams || [], name: 'assignedTeams' } })}
                                  value={values.assignedTeams}
                                  colored
                                  inputId="person-select-assigned-team"
                                  classNamePrefix="person-select-assigned-team"
                                />
                              </Col>
                            );
                          return (
                            <CustomFieldInput model="person" values={values} handleChange={handleChange} field={field} hideLabel colWidth={12} />
                          );
                        },
                      },
                    ]}
                  />
                  <Row style={{ justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                    <Button color="link" onClick={() => setOpen(false)}>
                      Annuler
                    </Button>
                    <Button disabled={isSubmitting} onClick={() => !isSubmitting && handleSubmit()}>
                      {isSubmitting ? 'Fusion en cours' : 'Fusionner'}
                    </Button>
                  </Row>
                </>
              )}
            </Formik>
          )}
        </ModalBody>
      </StyledModal>
    </>
  );
};

const StyledModal = styled(Modal)`
  align-items: center;
  .modal-title {
    width: 100%;
    flex-grow: 1;
    padding: auto;
  }
`;

const Field = styled.p`
  font-weight: bold;
`;

export default MergeTwoPersons;
