import { Col, FormGroup, Input, Label, Modal, ModalBody, ModalHeader, Row } from 'reactstrap';
import SelectAsInput from '../../../components/SelectAsInput';
import {
  allowedFieldsInHistorySelector,
  customFieldsPersonsSelector,
  flattenedCustomFieldsPersonsSelector,
  personFieldsSelector,
  personsState,
  usePreparePersonForEncryption,
} from '../../../recoil/persons';
import { outOfBoundariesDate } from '../../../services/date';
import SelectTeamMultiple from '../../../components/SelectTeamMultiple';
import { currentTeamState, userState } from '../../../recoil/auth';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import CustomFieldInput from '../../../components/CustomFieldInput';
import { useMemo, useState } from 'react';
import ButtonCustom from '../../../components/ButtonCustom';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import API from '../../../services/api';
import { cleanHistory } from './History';
import DatePicker from '../../../components/DatePicker';
import { customFieldsMedicalFileSelector, medicalFileState, prepareMedicalFileForEncryption } from '../../../recoil/medicalFiles';

export default function EditModal({ person, selectedPanel, onClose, isMedicalFile = false }) {
  const [openPanels, setOpenPanels] = useState([selectedPanel]);
  const user = useRecoilValue(userState);
  const customFieldsPersons = useRecoilValue(customFieldsPersonsSelector);
  const flattenedCustomFieldsPersons = useRecoilValue(flattenedCustomFieldsPersonsSelector);
  const allowedFieldsInHistory = useRecoilValue(allowedFieldsInHistorySelector);
  const team = useRecoilValue(currentTeamState);
  const setPersons = useSetRecoilState(personsState);
  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);
  const [allMedicalFiles, setAllMedicalFiles] = useRecoilState(medicalFileState);
  const medicalFile = useMemo(() => (allMedicalFiles || []).find((m) => m.person === person._id), [allMedicalFiles, person._id]);

  const customFieldsMedicalFileWithLegacyFields = useMemo(() => {
    const c = [...customFieldsMedicalFile];
    const structureMedical = flattenedCustomFieldsPersons.find((e) => e.name === 'structureMedical');
    if (structureMedical) c.unshift(structureMedical);
    const healthInsurances = flattenedCustomFieldsPersons.find((e) => e.name === 'healthInsurances');
    if (healthInsurances) c.unshift(healthInsurances);
    return c;
  }, [customFieldsMedicalFile, flattenedCustomFieldsPersons]);

  const preparePersonForEncryption = usePreparePersonForEncryption();
  const personFields = useRecoilValue(personFieldsSelector);

  return (
    <Modal isOpen={true} toggle={() => onClose()} size="lg" backdrop="static">
      <ModalHeader toggle={() => onClose()}>Modifier {person.name}</ModalHeader>
      <ModalBody>
        <Formik
          enableReinitialize
          initialValues={person}
          onSubmit={async (body) => {
            if (!body.name?.trim()?.length) return toast.error('Une personne doit avoir un nom');
            if (!body.followedSince) body.followedSince = person.createdAt;
            if (outOfBoundariesDate(body.followedSince)) return toast.error('La date de suivi est hors limites (entre 1900 et 2100)');
            if (body.birthdate && outOfBoundariesDate(body.birthdate))
              return toast.error('La date de naissance est hors limites (entre 1900 et 2100)');
            if (body.wanderingAt && outOfBoundariesDate(body.wanderingAt))
              return toast.error('La date temps passé en rue est hors limites (entre 1900 et 2100)');

            body.entityKey = person.entityKey;

            const historyEntry = {
              date: new Date(),
              user: user._id,
              data: {},
            };
            for (const key in body) {
              if (!allowedFieldsInHistory.includes(key)) continue;
              if (body[key] !== person[key]) historyEntry.data[key] = { oldValue: person[key], newValue: body[key] };
            }
            if (!!Object.keys(historyEntry.data).length) body.history = [...cleanHistory(person.history || []), historyEntry];
            const response = await API.put({
              path: `/person/${person._id}`,
              body: preparePersonForEncryption(body),
            });
            if (response.ok) {
              const newPerson = response.decryptedData;
              setPersons((persons) =>
                persons.map((p) => {
                  if (p._id === person._id) return newPerson;
                  return p;
                })
              );

              toast.success('Mis à jour !');
              onClose();
            } else {
              toast.error("Erreur de l'enregistrement, les données n'ont pas été enregistrées");
            }
          }}>
          {({ values, handleChange, handleSubmit, isSubmitting, setFieldValue }) => {
            return (
              <>
                <div className="tw-text-sm">
                  <div>
                    <div
                      className="tw-mb-4 tw-flex tw-cursor-pointer tw-border-b tw-pb-2 tw-text-lg tw-font-semibold"
                      onClick={() => {
                        if (openPanels.includes('main')) {
                          setOpenPanels(openPanels.filter((p) => p !== 'main'));
                        } else {
                          setOpenPanels([...openPanels, 'main']);
                        }
                      }}>
                      <div className="tw-flex-1">Informations principales</div>
                      <div>{!openPanels.includes('main') ? '+' : '-'}</div>
                    </div>
                    {openPanels.includes('main') && (
                      <>
                        <Row>
                          <Col md={4}>
                            <FormGroup>
                              <Label htmlFor="name">Nom prénom ou Pseudonyme</Label>
                              <Input name="name" id="name" value={values.name || ''} onChange={handleChange} />
                            </FormGroup>
                          </Col>
                          <Col md={4}>
                            <FormGroup>
                              <Label htmlFor="otherNames">Autres pseudos</Label>
                              <Input name="otherNames" id="otherNames" value={values.otherNames || ''} onChange={handleChange} />
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
                              <Label htmlFor="person-birthdate">Date de naissance</Label>
                              <div>
                                <DatePicker name="birthdate" id="person-birthdate" defaultValue={values.birthdate} onChange={handleChange} />
                              </div>
                            </FormGroup>
                          </Col>
                          <Col md={4}>
                            <FormGroup>
                              <Label htmlFor="person-wanderingAt">En rue depuis le</Label>
                              <div>
                                <DatePicker name="wanderingAt" id="person-wanderingAt" defaultValue={values.wanderingAt} onChange={handleChange} />
                              </div>
                            </FormGroup>
                          </Col>
                          <Col md={4}>
                            <FormGroup>
                              <Label htmlFor="person-followedSince">Suivi(e) depuis le / Créé(e) le</Label>
                              <div>
                                <DatePicker
                                  id="person-followedSince"
                                  name="followedSince"
                                  defaultValue={values.followedSince || values.createdAt}
                                  onChange={handleChange}
                                />
                              </div>
                            </FormGroup>
                          </Col>
                          <Col md={8}>
                            <FormGroup>
                              <Label htmlFor="person-select-assigned-team">Équipe(s) en charge</Label>
                              <div>
                                <SelectTeamMultiple
                                  onChange={(teamIds) => handleChange({ target: { value: teamIds, name: 'assignedTeams' } })}
                                  value={values.assignedTeams}
                                  colored
                                  inputId="person-select-assigned-team"
                                  classNamePrefix="person-select-assigned-team"
                                />
                              </div>
                            </FormGroup>
                          </Col>
                          <Col md={4}>
                            <FormGroup>
                              <Label htmlFor="phone">Téléphone</Label>
                              <Input name="phone" id="phone" value={values.phone || ''} onChange={handleChange} />
                            </FormGroup>
                          </Col>
                          {!['restricted-access'].includes(user.role) && (
                            <Col md={12}>
                              <FormGroup>
                                <Label htmlFor="description">Description</Label>
                                <Input
                                  type="textarea"
                                  className="!tw-text-sm"
                                  rows={5}
                                  name="description"
                                  id="description"
                                  value={values.description || ''}
                                  onChange={handleChange}
                                />
                              </FormGroup>
                            </Col>
                          )}
                          <Col md={12}>
                            <FormGroup>
                              <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 20 }}>
                                <label htmlFor="person-alertness-checkbox">
                                  Personne très vulnérable, ou ayant besoin d'une attention particulière
                                </label>
                                <Input
                                  id="person-alertness-checkbox"
                                  type="checkbox"
                                  name="alertness"
                                  checked={values.alertness}
                                  onChange={() => handleChange({ target: { value: !values.alertness, name: 'alertness' } })}
                                />
                              </div>
                            </FormGroup>
                          </Col>
                        </Row>
                        {isMedicalFile && (
                          <div className="tw-flex tw-w-full tw-items-end tw-justify-end tw-gap-2">
                            <ButtonCustom disabled={isSubmitting} color="secondary" onClick={onClose} title="Annuler" />
                            <ButtonCustom
                              disabled={isSubmitting || JSON.stringify(person) === JSON.stringify(values)}
                              color="primary"
                              type="submit"
                              onClick={handleSubmit}
                              title="Enregistrer"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {!isMedicalFile &&
                    !['restricted-access'].includes(user.role) &&
                    customFieldsPersons.map(({ name, fields }, index) => {
                      return (
                        <div key={name + index}>
                          <div
                            className="tw-mb-4 tw-flex tw-cursor-pointer tw-border-b tw-pb-2 tw-text-lg tw-font-semibold"
                            onClick={() => {
                              if (openPanels.includes(name)) {
                                setOpenPanels(openPanels.filter((p) => p !== name));
                              } else {
                                setOpenPanels([...openPanels, name]);
                              }
                            }}>
                            <div className="tw-flex-1">{name}</div>
                            <div>{!openPanels.includes(name) ? '+' : '-'}</div>
                          </div>

                          <div className="[overflow-wrap:anywhere]">
                            {openPanels.includes(name) && (
                              <Row>
                                {fields
                                  .filter((f) => f.enabled || f.enabledTeams?.includes(team._id))
                                  .map((field) => (
                                    <CustomFieldInput model="person" values={values} handleChange={handleChange} field={field} key={field.name} />
                                  ))}
                              </Row>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
                {!isMedicalFile && (
                  <div className="tw-flex tw-items-end tw-justify-end tw-gap-2">
                    <ButtonCustom disabled={isSubmitting} color="secondary" onClick={onClose} title="Annuler" />
                    <ButtonCustom
                      disabled={isSubmitting || JSON.stringify(person) === JSON.stringify(values)}
                      color="primary"
                      type="submit"
                      onClick={handleSubmit}
                      title="Enregistrer"
                    />
                  </div>
                )}
              </>
            );
          }}
        </Formik>
        {isMedicalFile && (
          <Formik
            enableReinitialize
            initialValues={{
              ...medicalFile,
              structureMedical: person.structureMedical,
              healthInsurances: person.healthInsurances,
            }}
            onSubmit={async (body) => {
              body.entityKey = medicalFile.entityKey;
              const bodyMedicalFile = body;

              const mfResponse = await API.put({
                path: `/medical-file/${medicalFile._id}`,
                body: prepareMedicalFileForEncryption(customFieldsMedicalFile)({ ...medicalFile, ...bodyMedicalFile }),
              });
              let success = mfResponse.ok;
              if (success) {
                setAllMedicalFiles((medicalFiles) =>
                  medicalFiles.map((m) => {
                    if (m._id === medicalFile._id) return mfResponse.decryptedData;
                    return m;
                  })
                );
              }

              // We have to save legacy fields in person
              const structureMedical = flattenedCustomFieldsPersons.find((e) => e.name === 'structureMedical');
              const healthInsurances = flattenedCustomFieldsPersons.find((e) => e.name === 'healthInsurances');
              if (structureMedical || healthInsurances) {
                const personResponse = await API.put({
                  path: `/person/${person._id}`,
                  body: preparePersonForEncryption({
                    ...person,
                    structureMedical: structureMedical ? body.structureMedical : undefined,
                    healthInsurances: healthInsurances ? body.healthInsurances : undefined,
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
                } else {
                  success = false;
                }
              }

              if (!success) {
                toast.error("Les données médicales n'ont pas été enregistrées");
              } else {
                toast.success('Mis à jour !');
                onClose();
              }
            }}>
            {({ values, handleChange, handleSubmit, isSubmitting, setFieldValue }) => {
              return (
                <>
                  <div key={'Dossier Médical'}>
                    <div
                      className="tw-mb-4 tw-flex tw-cursor-pointer tw-border-b tw-pb-2 tw-text-lg tw-font-semibold"
                      onClick={() => {
                        if (openPanels.includes('Dossier Médical')) {
                          setOpenPanels(openPanels.filter((p) => p !== 'Dossier Médical'));
                        } else {
                          setOpenPanels([...openPanels, 'Dossier Médical']);
                        }
                      }}>
                      <div className="tw-flex-1">Dossier Médical</div>
                      <div>{!openPanels.includes('Dossier Médical') ? '+' : '-'}</div>
                    </div>

                    <div className="[overflow-wrap:anywhere]">
                      {openPanels.includes('Dossier Médical') && (
                        <>
                          <Row>
                            {customFieldsMedicalFileWithLegacyFields
                              .filter((f) => f.enabled || f.enabledTeams?.includes(team._id))
                              .map((field) => (
                                <CustomFieldInput model="person" values={values} handleChange={handleChange} field={field} key={field.name} />
                              ))}
                          </Row>
                          <div className="tw-flex tw-items-end tw-justify-end tw-gap-2">
                            <ButtonCustom disabled={isSubmitting} color="secondary" onClick={onClose} title="Annuler" />
                            <ButtonCustom
                              disabled={isSubmitting || JSON.stringify(person) === JSON.stringify(values)}
                              color="primary"
                              type="submit"
                              onClick={handleSubmit}
                              title="Enregistrer"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              );
            }}
          </Formik>
        )}
      </ModalBody>
    </Modal>
  );
}
