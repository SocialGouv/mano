import { Col, FormGroup, Input, Label, Modal, ModalBody, ModalHeader, Row } from 'reactstrap';
import SelectAsInput from '../../../components/SelectAsInput';
import {
  addressDetails,
  addressDetailsFixedFields,
  customFieldsPersonsMedicalSelector,
  customFieldsPersonsSocialSelector,
  employmentOptions,
  genderOptions,
  healthInsuranceOptions,
  nationalitySituationOptions,
  personalSituationOptions,
  personsState,
  preparePersonForEncryption,
  reasonsOptions,
  ressourcesOptions,
  yesNoOptions,
} from '../../../recoil/persons';
import { dateForDatePicker } from '../../../services/date';
import DatePicker from 'react-datepicker';
import SelectTeamMultiple from '../../../components/SelectTeamMultiple';
import { currentTeamState, userState } from '../../../recoil/auth';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import CustomFieldInput from '../../../components/CustomFieldInput';
import SelectCustom from '../../../components/SelectCustom';
import { useState } from 'react';
import ButtonCustom from '../../../components/ButtonCustom';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import useApi from '../../../services/api';

export default function EditModal({ person, selectedPanel, onClose }) {
  const [openPanels, setOpenPanels] = useState([selectedPanel]);
  const user = useRecoilValue(userState);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const team = useRecoilValue(currentTeamState);
  const setPersons = useSetRecoilState(personsState);
  const API = useApi();

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
            body.entityKey = person.entityKey;

            const historyEntry = {
              date: new Date(),
              user: user._id,
              data: {},
            };
            for (const key in body) {
              if (body[key] !== person[key]) historyEntry.data[key] = { oldValue: person[key], newValue: body[key] };
            }
            body.history = [...(person.history || []), historyEntry];

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
                          <FormGroup>
                            <Label htmlFor="person-wanderingAt">En rue depuis le</Label>
                            <div>
                              <DatePicker
                                locale="fr"
                                className="form-control"
                                selected={dateForDatePicker(values.wanderingAt)}
                                onChange={(date) => handleChange({ target: { value: date, name: 'wanderingAt' } })}
                                dateFormat="dd/MM/yyyy"
                                id="person-wanderingAt"
                              />
                            </div>
                          </FormGroup>
                        </Col>
                        <Col md={4}>
                          <FormGroup>
                            <Label htmlFor="person-followedSince">Suivi(e) depuis le / Créé(e) le</Label>
                            <div>
                              <DatePicker
                                locale="fr"
                                className="form-control"
                                selected={dateForDatePicker(values.followedSince || values.createdAt)}
                                onChange={(date) => handleChange({ target: { value: date, name: 'followedSince' } })}
                                dateFormat="dd/MM/yyyy"
                                id="person-followedSince"
                              />
                            </div>
                          </FormGroup>
                        </Col>
                        <Col md={8}>
                          <FormGroup>
                            <Label htmlFor="person-select-assigned-team">Équipe(s) en charge</Label>
                            <div>
                              <SelectTeamMultiple
                                onChange={(teams) => handleChange({ target: { value: teams || [], name: 'assignedTeams' } })}
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
                    )}
                  </div>
                  {!['restricted-access'].includes(user.role) && (
                    <div>
                      <div
                        className="tw-mb-4 tw-flex tw-cursor-pointer tw-border-b tw-pb-2 tw-text-lg tw-font-semibold"
                        onClick={() => {
                          if (openPanels.includes('social')) {
                            setOpenPanels(openPanels.filter((p) => p !== 'social'));
                          } else {
                            setOpenPanels([...openPanels, 'social']);
                          }
                        }}>
                        <div className="tw-flex-1">Informations sociales</div>
                        <div>{!openPanels.includes('social') ? '+' : '-'}</div>
                      </div>
                      {openPanels.includes('social') && (
                        <Row>
                          <Col md={4}>
                            <Label htmlFor="person-select-personalSituation">Situation personnelle</Label>
                            <SelectAsInput
                              options={personalSituationOptions}
                              name="personalSituation"
                              value={values.personalSituation || ''}
                              onChange={handleChange}
                              inputId="person-select-personalSituation"
                              classNamePrefix="person-select-personalSituation"
                            />
                          </Col>
                          <Col md={4}>
                            <FormGroup>
                              <Label htmlFor="structureSocial">Structure de suivi social</Label>
                              <Input name="structureSocial" id="structureSocial" value={values.structureSocial || ''} onChange={handleChange} />
                            </FormGroup>
                          </Col>
                          <Col md={4}>
                            <FormGroup>
                              <Label htmlFor="person-select-animals">Avec animaux</Label>
                              <SelectAsInput
                                options={yesNoOptions}
                                name="hasAnimal"
                                value={values.hasAnimal || ''}
                                onChange={handleChange}
                                inputId="person-select-animals"
                                classNamePrefix="person-select-animals"
                              />
                            </FormGroup>
                          </Col>
                          <Col md={4}>
                            <FormGroup>
                              <Label htmlFor="person-select-address">Hébergement</Label>
                              <SelectAsInput
                                options={yesNoOptions}
                                name="address"
                                value={values.address || ''}
                                onChange={handleChange}
                                inputId="person-select-address"
                                classNamePrefix="person-select-address"
                              />
                            </FormGroup>
                          </Col>

                          <AddressDetails values={values} onChange={handleChange} />

                          <Col md={4}>
                            <FormGroup>
                              <Label htmlFor="person-select-nationalitySituation">Nationalité</Label>
                              <SelectAsInput
                                options={nationalitySituationOptions}
                                name="nationalitySituation"
                                value={values.nationalitySituation || ''}
                                onChange={handleChange}
                                inputId="person-select-nationalitySituation"
                                classNamePrefix="person-select-nationalitySituation"
                              />
                            </FormGroup>
                          </Col>
                          <Col md={4}>
                            <FormGroup>
                              <Label htmlFor="person-select-employment">Emploi</Label>
                              <SelectAsInput
                                options={employmentOptions}
                                name="employment"
                                value={values.employment || ''}
                                onChange={handleChange}
                                inputId="person-select-employment"
                                classNamePrefix="person-select-employment"
                              />
                            </FormGroup>
                          </Col>

                          <Col md={4}>
                            <Ressources value={values.resources} onChange={handleChange} />
                          </Col>

                          <Col md={4}>
                            <Reasons value={values.reasons} onChange={handleChange} />
                          </Col>
                          {customFieldsPersonsSocial
                            .filter((f) => f.enabled || f.enabledTeams?.includes(team._id))
                            .map((field) => (
                              <CustomFieldInput model="person" values={values} handleChange={handleChange} field={field} key={field.name} />
                            ))}
                        </Row>
                      )}
                    </div>
                  )}
                  {!['restricted-access'].includes(user.role) && (
                    <div>
                      <div
                        className="tw-mb-4 tw-flex tw-cursor-pointer tw-border-b tw-pb-2 tw-text-lg tw-font-semibold"
                        onClick={() => {
                          if (openPanels.includes('medical')) {
                            setOpenPanels(openPanels.filter((p) => p !== 'medical'));
                          } else {
                            setOpenPanels([...openPanels, 'medical']);
                          }
                        }}>
                        <div className="tw-flex-1">Informations médicales</div>
                        <div>{!openPanels.includes('medical') ? '+' : '-'}</div>
                      </div>
                      {openPanels.includes('medical') && (
                        <Row>
                          <Col md={4}>
                            <Label htmlFor="person-select-healthInsurances">Couverture(s) médicale(s)</Label>
                            <SelectCustom
                              options={healthInsuranceOptions}
                              name="healthInsurances"
                              onChange={(v) => handleChange({ currentTarget: { value: v, name: 'healthInsurances' } })}
                              isClearable={false}
                              isMulti
                              inputId="person-select-healthInsurances"
                              classNamePrefix="person-select-healthInsurances"
                              value={values.healthInsurances || []}
                              placeholder={' -- Choisir -- '}
                              getOptionValue={(i) => i}
                              getOptionLabel={(i) => i}
                            />
                          </Col>
                          <Col md={4}>
                            <FormGroup>
                              <Label htmlFor="structureMedical">Structure de suivi médical</Label>
                              <Input name="structureMedical" id="structureMedical" value={values.structureMedical} onChange={handleChange} />
                            </FormGroup>
                          </Col>
                          {customFieldsPersonsMedical
                            .filter((f) => f.enabled || f.enabledTeams?.includes(team._id))
                            .map((field) => (
                              <CustomFieldInput model="person" values={values} handleChange={handleChange} field={field} key={field.name} />
                            ))}
                        </Row>
                      )}
                    </div>
                  )}
                </div>
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
            );
          }}
        </Formik>
      </ModalBody>
    </Modal>
  );
}

const AddressDetails = ({ values, onChange }) => {
  const isFreeFieldAddressDetail = (addressDetail = '') => {
    if (!addressDetail) return false;
    return !addressDetailsFixedFields.includes(addressDetail);
  };

  const computeValue = (value = '') => {
    if (!value) return '';
    if (addressDetailsFixedFields.includes(value)) return value;
    return 'Autre';
  };

  const onChangeRequest = (event) => {
    event.target.value = event.target.value || 'Autre';
    onChange(event);
  };

  return (
    <>
      <Col md={4}>
        <FormGroup>
          <Label htmlFor="person-select-addressDetail">Type d'hébergement</Label>
          <SelectAsInput
            isDisabled={values.address !== 'Oui'}
            name="addressDetail"
            value={computeValue(values.addressDetail)}
            options={addressDetails}
            onChange={onChange}
            inputId="person-select-addressDetail"
            classNamePrefix="person-select-addressDetail"
          />
        </FormGroup>{' '}
      </Col>
      <Col md={4}>
        {!!isFreeFieldAddressDetail(values.addressDetail) && (
          <FormGroup>
            <Label htmlFor="addressDetail">Autre type d'hébergement</Label>
            <Input name="addressDetail" value={values.addressDetail === 'Autre' ? '' : values.addressDetail} onChange={onChangeRequest} />
          </FormGroup>
        )}
      </Col>
    </>
  );
};

const Reasons = ({ value, onChange }) => (
  <FormGroup>
    <Label htmlFor="person-select-reasons">Motif de la situation en rue</Label>
    <SelectCustom
      options={reasonsOptions}
      name="reasons"
      onChange={(v) => onChange({ currentTarget: { value: v, name: 'reasons' } })}
      isClearable={false}
      isMulti
      value={value}
      getOptionValue={(i) => i}
      getOptionLabel={(i) => i}
      inputId="person-select-reasons"
      classNamePrefix="person-select-reasons"
    />
  </FormGroup>
);

const Ressources = ({ value, onChange }) => (
  <FormGroup>
    <Label htmlFor="person-select-resources">Ressources</Label>
    <SelectCustom
      options={ressourcesOptions}
      name="resources"
      onChange={(v) => onChange({ currentTarget: { value: v, name: 'resources' } })}
      isClearable={false}
      isMulti
      value={value}
      getOptionValue={(i) => i}
      getOptionLabel={(i) => i}
      inputId="person-select-resources"
      classNamePrefix="person-select-resources"
    />
  </FormGroup>
);
