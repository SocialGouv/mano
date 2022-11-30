import React, { useEffect, useMemo, useState } from 'react';
import { FormGroup, Input, Label, Row, Col, Nav, TabContent, TabPane, NavItem, NavLink, Alert, Button as LinkButton } from 'reactstrap';

import { useParams, useHistory, useLocation } from 'react-router-dom';
import { Formik } from 'formik';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import DatePicker from 'react-datepicker';
import { selectorFamily, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import CustomFieldInput from '../../components/CustomFieldInput';
import TagTeam from '../../components/TagTeam';
import { SmallHeaderWithBackButton } from '../../components/header';
import ButtonCustom from '../../components/ButtonCustom';
import CreateActionModal from '../../components/CreateActionModal';
import Comments from '../../components/Comments';
import ActionStatus from '../../components/ActionStatus';
import Table from '../../components/table';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import {
  addressDetails,
  addressDetailsFixedFields,
  employmentOptions,
  genderOptions,
  healthInsuranceOptions,
  nationalitySituationOptions,
  personalSituationOptions,
  reasonsOptions,
  ressourcesOptions,
  yesNoOptions,
  personsState,
  customFieldsPersonsSocialSelector,
  customFieldsPersonsMedicalSelector,
  preparePersonForEncryption,
  personFieldsIncludingCustomFieldsSelector,
} from '../../recoil/persons';
import { actionsState, mappedIdsToLabels } from '../../recoil/actions';
import UserName from '../../components/UserName';
import SelectCustom from '../../components/SelectCustom';
import SelectAsInput from '../../components/SelectAsInput';
import Places from '../../components/Places';
import ActionOrConsultationName from '../../components/ActionOrConsultationName';
import OutOfActiveList from './OutOfActiveList';
import { currentTeamState, organisationState, teamsState, userState } from '../../recoil/auth';
import Documents from '../../components/Documents';
import { dateForDatePicker, dayjsInstance, formatDateWithFullMonth, formatTime } from '../../services/date';
import useApi from '../../services/api';
import { commentsState } from '../../recoil/comments';
import { MedicalFile } from './MedicalFile';
import { passagesState } from '../../recoil/passages';
import { rencontresState } from '../../recoil/rencontres';
import DateBloc from '../../components/DateBloc';
import Passage from '../../components/Passage';
import ExclamationMarkButton from '../../components/ExclamationMarkButton';
import useTitle from '../../services/useTitle';
import DeleteButtonAndConfirmModal from '../../components/DeleteButtonAndConfirmModal';
import { relsPersonPlaceState } from '../../recoil/relPersonPlace';
import { medicalFileState } from '../../recoil/medicalFiles';
import { consultationsState } from '../../recoil/consultations';
import { treatmentsState } from '../../recoil/treatments';
import MergeTwoPersons from './MergeTwoPersons';
import agendaIcon from '../../assets/icons/agenda-icon.svg';
import Rencontre from '../../components/Rencontre';
import { itemsGroupedByPersonSelector, personsObjectSelector } from '../../recoil/selectors';
import ActionsCategorySelect from '../../components/tailwind/ActionsCategorySelect';
import { groupSelector, groupsState, prepareGroupForEncryption } from '../../recoil/group';
import SelectPerson from '../../components/SelectPerson';
import { useDataLoader } from '../../components/DataLoader';
import dayjs from 'dayjs';
import PersonName from '../../components/PersonName';
import { ModalContainer, ModalHeader, ModalBody, ModalFooter } from '../../components/tailwind/Modal';

const initTabs = ['Résumé', 'Dossier Médical', 'Actions', 'Commentaires', 'Passages', 'Rencontres', 'Lieux', 'Documents', 'Historique', 'Famille'];
const tabsForRestrictedRole = ['Résumé', 'Actions', 'Passages', 'Rencontres'];

// we take this selector to go faster when a change happens
const personSelector = selectorFamily({
  key: 'personSelector',
  get:
    ({ personId }) =>
    ({ get }) => {
      const persons = get(personsObjectSelector);
      return persons[personId] || {};
    },
});

const populatedPersonSelector = selectorFamily({
  key: 'populatedPersonSelector',
  get:
    ({ personId }) =>
    ({ get }) => {
      const persons = get(itemsGroupedByPersonSelector);
      return persons[personId] || {};
    },
});

const View = () => {
  const { personId } = useParams();
  const location = useLocation();
  const history = useHistory();
  const API = useApi();
  const setPersons = useSetRecoilState(personsState);
  const person = useRecoilValue(personSelector({ personId }));
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const [tabsContents, setTabsContents] = useState(initTabs);
  const searchParams = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') ? initTabs.findIndex((value) => value.toLowerCase() === searchParams.get('tab')) : 0
  );

  const updateTabContent = (tabIndex, content) => setTabsContents((contents) => contents.map((c, index) => (index === tabIndex ? content : c)));

  useTitle(`${person?.name} - Personne`);

  return (
    <StyledContainer>
      <SmallHeaderWithBackButton className="noprint" refreshButton />
      <Title className="noprint">
        {`Dossier de ${person?.name}`}
        <UserName
          id={person.user}
          wrapper={() => 'créée par '}
          canAddUser
          handleChange={async (newUser) => {
            const response = await API.put({
              path: `/person/${person._id}`,
              body: preparePersonForEncryption(customFieldsPersonsMedical, customFieldsPersonsSocial)({ ...person, user: newUser }),
            });
            if (response.ok) {
              const newPerson = response.decryptedData;
              setPersons((persons) =>
                persons.map((p) => {
                  if (p._id === person._id) return newPerson;
                  return p;
                })
              );
            }
          }}
        />
      </Title>
      {person.outOfActiveList && (
        <Alert color="warning" className="noprint">
          {person?.name} est en dehors de la file active, pour {person.outOfActiveListReasons.length > 1 ? 'les motifs suivants' : 'le motif suivant'}{' '}
          : <b>{person.outOfActiveListReasons.join(', ')}</b>{' '}
          {person.outOfActiveListDate && `le ${formatDateWithFullMonth(person.outOfActiveListDate)}`}
        </Alert>
      )}
      <Nav tabs fill style={{ marginTop: 20, marginBottom: 0 }} className="noprint">
        {tabsContents.map((tabCaption, index) => {
          if (!organisation.receptionEnabled && tabCaption.includes('Passages')) return null;
          if (!user.healthcareProfessional && tabCaption.includes('Dossier Médical')) return null;
          if (['restricted-access'].includes(user.role)) {
            let showTab = false;
            for (const authorizedTab of tabsForRestrictedRole) {
              if (tabCaption.includes(authorizedTab)) showTab = true;
            }
            if (!showTab) return null;
          }
          return (
            <NavItem key={index} style={{ cursor: 'pointer' }}>
              <NavLink
                key={index}
                className={`${activeTab === index ? 'active' : ''}`}
                onClick={() => {
                  const searchParams = new URLSearchParams(location.search);
                  searchParams.set('tab', initTabs[index].toLowerCase());
                  history.replace({ pathname: location.pathname, search: searchParams.toString() });
                  setActiveTab(index);
                }}>
                {tabCaption}
              </NavLink>
            </NavItem>
          );
        })}
      </Nav>
      <TabContent activeTab={activeTab}>
        <TabPane tabId={0}>
          <Summary person={person} />
        </TabPane>
        {!['restricted-access'].includes(user.role) && !!user.healthcareProfessional && (
          <TabPane tabId={1}>
            <MedicalFile person={person} />
          </TabPane>
        )}
        <TabPane tabId={2}>
          <Actions onUpdateResults={(total) => updateTabContent(2, `Actions (${total})`)} />
        </TabPane>
        {!['restricted-access'].includes(user.role) && (
          <TabPane tabId={3}>
            <Comments personId={person?._id} onUpdateResults={(total) => updateTabContent(3, `Commentaires (${total})`)} />
          </TabPane>
        )}
        <TabPane tabId={4}>
          <Passages onUpdateResults={(total) => updateTabContent(4, `Passages (${total})`)} />
        </TabPane>
        <TabPane tabId={5}>
          <Rencontres onUpdateResults={(total) => updateTabContent(5, `Rencontres (${total})`)} />
        </TabPane>
        {!['restricted-access'].includes(user.role) && (
          <>
            <TabPane tabId={6}>
              <Places personId={person?._id} onUpdateResults={(total) => updateTabContent(6, `Lieux (${total})`)} />
            </TabPane>
            <TabPane tabId={7}>
              {
                <PersonDocuments
                  person={person}
                  onUpdateResults={(total) => updateTabContent(7, `Documents (${total})`)}
                  onGoToMedicalFiles={async () => {
                    const searchParams = new URLSearchParams(location.search);
                    searchParams.set('tab', 'dossier médical');
                    history.replace({ pathname: location.pathname, search: searchParams.toString() });
                    setActiveTab(1);
                    await new Promise((res) => setTimeout(res, 250));
                    const element = document.getElementById('all-medical-documents');
                    element.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
              }
            </TabPane>
            <TabPane tabId={8}>
              <PersonHistory person={person} />
            </TabPane>
            <TabPane tabId={9}>
              <PersonFamily person={person} />
            </TabPane>
          </>
        )}
      </TabContent>
    </StyledContainer>
  );
};

const PersonHistory = ({ person }) => {
  const personFieldsIncludingCustomFields = useRecoilValue(personFieldsIncludingCustomFieldsSelector);
  const teams = useRecoilValue(teamsState);
  const history = useMemo(() => [...(person.history || [])].reverse(), [person.history]);

  return (
    <div>
      <Row style={{ marginTop: '30px', marginBottom: '5px' }}>
        <Col md={4}>
          <Title>Historique</Title>
        </Col>
      </Row>
      <table className="table table-striped table-bordered">
        <thead>
          <tr>
            <th>Date</th>
            <th>Utilisateur</th>
            <th>Donnée</th>
          </tr>
        </thead>
        <tbody className="small">
          {history.map((h) => {
            return (
              <tr key={h.date}>
                <td>{dayjsInstance(h.date).format('DD/MM/YYYY HH:mm')}</td>
                <td>
                  <UserName id={h.user} />
                </td>
                <td>
                  <div>
                    {Object.entries(h.data).map(([key, value]) => {
                      const personField = personFieldsIncludingCustomFields.find((f) => f.name === key);
                      if (key === 'assignedTeams') {
                        return (
                          <div key={key}>
                            {personField?.label} : <br />
                            {(value.oldValue || []).map((teamId) => {
                              const team = teams.find((t) => t._id === teamId);
                              return <div key={teamId}>{team?.name}</div>;
                            })}
                          </div>
                        );
                      }
                      return (
                        <div
                          key={key}
                          data-test-id={`${personField?.label}: ${JSON.stringify(value.oldValue || '')} ➔ ${JSON.stringify(value.newValue)}`}>
                          {personField?.label} : <br />
                          <code>{JSON.stringify(value.oldValue || '')}</code> ➔ <code>{JSON.stringify(value.newValue)}</code>
                        </div>
                      );
                    })}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const PersonFamily = ({ person }) => {
  const [groups, setGroups] = useRecoilState(groupsState);
  const user = useRecoilValue(userState);
  const personGroup = useRecoilValue(groupSelector({ personId: person?._id }));
  const [newRelationModalOpen, setNewRelationModalOpen] = useState(false);
  const { refresh } = useDataLoader();
  const API = useApi();

  const onAddFamilyLink = async (e) => {
    e.preventDefault();
    const { personId, relation } = Object.fromEntries(new FormData(e.target));
    if (person._id === personId) {
      return toast.error("Le lien avec cette personne est vite vu : c'est elle !");
    }
    if (personGroup.persons.find((_personId) => _personId === personId)) {
      return toast.error('Cette personne fait déjà partie de votre groupe');
    }
    if (groups.find((group) => group.persons.find((_personId) => _personId === personId))) {
      return toast.error(
        "Cette personne fait déjà partie d'un autre groupe",
        "Vous ne pouvez pour l'instant pas ajouter une personne à plusieurs groupes. N'hésitez pas à nous contacter si vous souhaitez faire évoluer cette fonctionnalité."
      );
    }
    const nextGroup = {
      ...personGroup,
      persons: [...new Set([...personGroup.persons, person._id, personId])],
      relations: [...personGroup.relations, { persons: [person._id, personId], relation, createdAt: dayjs(), updatedAt: dayjs(), user: user._id }],
    };
    const isNew = !personGroup?._id;
    const response = isNew
      ? await API.post({ path: '/group', body: prepareGroupForEncryption(nextGroup) })
      : await API.put({ path: `/group/${personGroup._id}`, body: prepareGroupForEncryption(nextGroup) });
    if (response.ok) {
      setGroups((groups) =>
        isNew ? [...groups, response.decryptedData] : groups.map((group) => (group._id === personGroup._id ? response.decryptedData : group))
      );
      setNewRelationModalOpen(false);
      toast.success('Le lien familial a été ajouté');
    }
  };

  return (
    <>
      <div className="tw-my-10 tw-flex tw-items-center tw-gap-2">
        <h3 className="tw-mb-0 tw-text-xl tw-font-extrabold">Liens familiaux</h3>
        <ButtonCustom
          title="Ajouter un lien"
          className="tw-ml-auto"
          onClick={() => {
            refresh(); // just refresh to make sure we have the latest data
            setNewRelationModalOpen(true);
          }}
        />
      </div>
      <ModalContainer open={newRelationModalOpen}>
        <ModalHeader title="Nouveau lien familial" />
        <ModalBody>
          <form id="new-family-relation" className="tw-flex tw-w-full tw-flex-col tw-gap-4" onSubmit={onAddFamilyLink}>
            <div>
              <label htmlFor="personId" className="form-text tailwindui">
                Nouveau lien avec...
              </label>
              <SelectPerson name="personId" noLabel disableAccessToPerson />
            </div>
            <div>
              <label htmlFor="relation" className="form-text tailwindui">
                Relation/commentaire
              </label>
              <input className="form-text tailwindui" id="relation" name="relation" type="text" placeholder="Père/fille, mère/fils..." />
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <button type="submit" className="button-submit" form="new-family-relation">
            Enregistrer
          </button>
          <button type="button" name="cancel" className="button-cancel" onClick={() => setNewRelationModalOpen(false)}>
            Annuler
          </button>
        </ModalFooter>
      </ModalContainer>

      <table className="table table-striped table-bordered">
        <thead>
          <tr>
            <th>Lien entre</th>
            <th>Relation</th>
            <th>Enregistré par</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody className="small">
          {personGroup.relations.map(({ relation, persons, createdAt, user }) => {
            return (
              <tr key={JSON.stringify(persons)}>
                <td>
                  <PersonName item={{ person: persons[0] }} redirectToTab="famille" />
                  {' et '}
                  <PersonName item={{ person: persons[1] }} redirectToTab="famille" />
                </td>
                <td>{relation}</td>
                <td>
                  <UserName id={user} />
                </td>
                <td>{dayjsInstance(createdAt).format('DD/MM/YYYY HH:mm')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};

const Summary = ({ person }) => {
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const user = useRecoilValue(userState);
  const team = useRecoilValue(currentTeamState);
  const setPersons = useSetRecoilState(personsState);
  const API = useApi();

  return (
    <>
      <Row style={{ marginTop: '30px', marginBottom: '5px' }}>
        <Col md={4}>
          <Title>Résumé</Title>
        </Col>
      </Row>
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
          }
          if (response.ok) {
            toast.success('Mis à jour !');
          }
        }}>
        {({ values, handleChange, handleSubmit, isSubmitting, setFieldValue }) => {
          return (
            <React.Fragment>
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
                <Col md={4}>
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
                    <Label />
                    <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 20, width: '80%' }}>
                      <label htmlFor="person-alertness-checkbox">Personne très vulnérable, ou ayant besoin d'une attention particulière</label>
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
                      <Input type="textarea" rows={5} name="description" id="description" value={values.description || ''} onChange={handleChange} />
                    </FormGroup>
                  </Col>
                )}
              </Row>
              {!['restricted-access'].includes(user.role) && (
                <>
                  <hr />
                  <Title>Informations sociales</Title>
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
                      .map((field) => {
                        return <CustomFieldInput model="person" values={values} handleChange={handleChange} field={field} key={field.name} />;
                      })}
                  </Row>

                  <hr />
                  <Title>Informations médicales</Title>
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
                      .map((field) => {
                        return <CustomFieldInput model="person" values={values} handleChange={handleChange} field={field} key={field.name} />;
                      })}
                  </Row>

                  <hr />
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                {!['restricted-access'].includes(user.role) && (
                  <>
                    <MergeTwoPersons person={person} />
                    <OutOfActiveList person={person} />
                    <DeletePersonButton person={person} />
                  </>
                )}
                <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} />
              </div>
            </React.Fragment>
          );
        }}
      </Formik>
    </>
  );
};

export const DeletePersonButton = ({ person }) => {
  const API = useApi();
  const setPersons = useSetRecoilState(personsState);

  const [actions, setActions] = useRecoilState(actionsState);
  const [comments, setComments] = useRecoilState(commentsState);
  const [passages, setPassages] = useRecoilState(passagesState);
  const [rencontres, setRencontres] = useRecoilState(rencontresState);
  const [consultations, setConsultations] = useRecoilState(consultationsState);
  const [treatments, setTreatments] = useRecoilState(treatmentsState);
  const [medicalFiles, setMedicalFiles] = useRecoilState(medicalFileState);
  const [relsPersonPlace, setRelsPersonPlace] = useRecoilState(relsPersonPlaceState);
  const history = useHistory();

  return (
    <DeleteButtonAndConfirmModal
      title={`Voulez-vous vraiment supprimer la personne ${person.name}`}
      textToConfirm={person.name}
      onConfirm={async () => {
        const personRes = await API.delete({ path: `/person/${person._id}` });
        if (personRes.ok) {
          setPersons((persons) => persons.filter((p) => p._id !== person._id));
          for (const action of actions.filter((a) => a.person === person._id)) {
            const actionRes = await API.delete({ path: `/action/${action._id}` });
            if (actionRes.ok) {
              setActions((actions) => actions.filter((a) => a._id !== action._id));
              for (let comment of comments.filter((c) => c.action === action._id)) {
                const commentRes = await API.delete({ path: `/comment/${comment._id}` });
                if (commentRes.ok) setComments((comments) => comments.filter((c) => c._id !== comment._id));
              }
            }
          }
          for (let comment of comments.filter((c) => c.person === person._id)) {
            const commentRes = await API.delete({ path: `/comment/${comment._id}` });
            if (commentRes.ok) setComments((comments) => comments.filter((c) => c._id !== comment._id));
          }
          for (let relPersonPlace of relsPersonPlace.filter((rel) => rel.person === person._id)) {
            const relRes = await API.delete({ path: `/relPersonPlace/${relPersonPlace._id}` });
            if (relRes.ok) {
              setRelsPersonPlace((relsPersonPlace) => relsPersonPlace.filter((rel) => rel._id !== relPersonPlace._id));
            }
          }
          for (let passage of passages.filter((c) => c.person === person._id)) {
            const passageRes = await API.delete({ path: `/passage/${passage._id}` });
            if (passageRes.ok) setPassages((passages) => passages.filter((c) => c._id !== passage._id));
          }
          for (let rencontre of rencontres.filter((c) => c.person === person._id)) {
            const rencontreRes = await API.delete({ path: `/rencontre/${rencontre._id}` });
            if (rencontreRes.ok) setRencontres((rencontres) => rencontres.filter((c) => c._id !== rencontre._id));
          }

          for (let medicalFile of medicalFiles.filter((c) => c.person === person._id)) {
            const medicalFileRes = await API.delete({ path: `/medical-file/${medicalFile._id}` });
            if (medicalFileRes.ok) setMedicalFiles((medicalFiles) => medicalFiles.filter((c) => c._id !== medicalFile._id));
          }
          for (let treatment of treatments.filter((c) => c.person === person._id)) {
            const treatmentRes = await API.delete({ path: `/treatment/${treatment._id}` });
            if (treatmentRes.ok) setTreatments((treatments) => treatments.filter((c) => c._id !== treatment._id));
          }
          for (let consultation of consultations.filter((c) => c.person === person._id)) {
            const consultationRes = await API.delete({ path: `/consultation/${consultation._id}` });
            if (consultationRes.ok) setConsultations((consultations) => consultations.filter((c) => c._id !== consultation._id));
          }
        }
        if (personRes?.ok) {
          toast.success('Suppression réussie');
          history.goBack();
        }
      }}>
      <span style={{ marginBottom: 30, display: 'block', width: '100%', textAlign: 'center' }}>
        Cette opération est irréversible
        <br />
        et entrainera la suppression définitive de toutes les données liées à la personne&nbsp;:
        <br />
        actions, commentaires, lieux visités, passages, rencontres, documents...
      </span>
    </DeleteButtonAndConfirmModal>
  );
};

const filteredPersonActionsSelector = selectorFamily({
  key: 'filteredPersonActionsSelector',
  get:
    ({ personId, filterCategories, filterStatus }) =>
    ({ get }) => {
      const person = get(populatedPersonSelector({ personId }));
      let actionsToSet = person?.actions || [];
      if (filterCategories.length) {
        actionsToSet = actionsToSet.filter((a) =>
          filterCategories.some((c) => (c === '-- Aucune --' ? a.categories?.length === 0 : a.categories?.includes(c)))
        );
      }
      if (filterStatus.length) {
        actionsToSet = actionsToSet.filter((a) => filterStatus.some((s) => a.status === s));
      }
      return [...actionsToSet]
        .sort((p1, p2) => (p1.dueAt > p2.dueAt ? -1 : 1))
        .map((a) => (a.urgent ? { ...a, style: { backgroundColor: '#fecaca' } } : a));
    },
});

const Actions = ({ onUpdateResults }) => {
  const { personId } = useParams();

  const person = useRecoilValue(populatedPersonSelector({ personId }));
  const data = person?.actions || [];
  const history = useHistory();
  const user = useRecoilValue(userState);

  const [modalOpen, setModalOpen] = useState(false);
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterStatus, setFilterStatus] = useState([]);

  const filteredData = useRecoilValue(filteredPersonActionsSelector({ personId, filterCategories, filterStatus }));

  useEffect(() => {
    onUpdateResults(data.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length]);

  return (
    <React.Fragment>
      <div style={{ display: 'flex', margin: '30px 0 20px', alignItems: 'center' }}>
        <Title>Actions</Title>
        <CreateActionModal person={person._id} open={modalOpen} setOpen={(value) => setModalOpen(value)} />
        <div className="noprint" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <ButtonCustom
            icon={agendaIcon}
            onClick={() => setModalOpen(true)}
            color="primary"
            title="Créer une nouvelle action"
            padding={'12px 24px'}
          />
        </div>
      </div>
      {data.length ? (
        <Row>
          <Col md={6}>
            <ActionsCategorySelect onChange={(c) => setFilterCategories(c)} id="action-select-categories-filter" label="Filtrer par catégorie" />
          </Col>
          <Col md={6}>
            <Label htmlFor="action-select-status-filter">Filtrer par statut</Label>
            <SelectCustom
              inputId="action-select-status-filter"
              options={mappedIdsToLabels}
              getOptionValue={(s) => s._id}
              getOptionLabel={(s) => s.name}
              name="status"
              onChange={(s) => setFilterStatus(s.map((s) => s._id))}
              isClearable
              isMulti
              value={mappedIdsToLabels.filter((s) => filterStatus.includes(s._id))}
            />
          </Col>
        </Row>
      ) : null}

      <StyledTable
        data={filteredData}
        rowKey={'_id'}
        onRowClick={(action) => history.push(`/action/${action._id}`)}
        noData={data.length && !filteredData.length ? 'Aucune action trouvée' : 'Aucune action'}
        rowDisabled={() => ['restricted-access'].includes(user.role)}
        columns={[
          {
            title: '',
            dataKey: 'urgent',
            small: true,
            render: (action) => {
              return (
                <div className="tw-flex tw-items-center tw-justify-center tw-gap-1">
                  {!!action.urgent && <ExclamationMarkButton />}
                  {!!action.group && (
                    <span className="tw-text-3xl" aria-label="Action familiale">
                      👪
                    </span>
                  )}
                </div>
              );
            },
          },
          { title: 'À faire le', dataKey: 'dueAt', render: (action) => <DateBloc date={action.dueAt} /> },
          {
            title: 'Heure',
            dataKey: '_id',
            render: (action) => {
              if (!action.dueAt || !action.withTime) return null;
              return formatTime(action.dueAt);
            },
          },
          {
            title: 'Nom',
            noShow: ['restricted-access'].includes(user.role),
            dataKey: 'name',
            render: (action) => <ActionOrConsultationName item={action} />,
          },
          { title: 'Statut', dataKey: 'status', render: (action) => <ActionStatus status={action.status} /> },
          {
            title: 'Équipe',
            dataKey: 'team',
            render: (action) => {
              return <TagTeam key={action.team} teamId={action.team} />;
            },
          },
        ].filter((c) => !c.noShow)}
      />
    </React.Fragment>
  );
};

const Passages = ({ onUpdateResults }) => {
  const { personId } = useParams();
  const person = useRecoilValue(populatedPersonSelector({ personId }));
  const personPassages = useMemo(
    () => [...(person?.passages || [])].sort((r1, r2) => (dayjsInstance(r1.date).isBefore(dayjsInstance(r2.date), 'day') ? 1 : -1)),
    [person]
  );
  const [passageToEdit, setPassageToEdit] = useState(null);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);

  useEffect(() => {
    onUpdateResults(personPassages.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personPassages.length]);

  return (
    <React.Fragment>
      <div style={{ display: 'flex', margin: '30px 0 20px', alignItems: 'center' }}>
        <Title>Passages</Title>
        <ButtonCustom
          title="Ajouter un passage"
          style={{ marginLeft: 'auto', marginBottom: '10px' }}
          onClick={() =>
            setPassageToEdit({
              user: user._id,
              team: currentTeam._id,
              person: personId,
            })
          }
        />
      </div>
      <Passage passage={passageToEdit} onFinished={() => setPassageToEdit(null)} />
      <Table
        data={personPassages}
        rowKey={'_id'}
        onRowClick={(passage) => setPassageToEdit(passage)}
        columns={[
          {
            title: 'Date',
            dataKey: 'date',
            render: (passage) => {
              return <DateBloc date={passage.date} />;
            },
          },
          {
            title: 'Heure',
            dataKey: 'time',
            render: (passage) => formatTime(passage.date),
          },
          {
            title: 'Équipe',
            dataKey: 'team',
            render: (passage) => {
              return <TagTeam key={passage.team} teamId={passage.team} />;
            },
          },
          {
            title: 'Enregistré par',
            dataKey: 'user',
            render: (passage) => (passage.user ? <UserName id={passage.user} /> : null),
          },
          { title: 'Commentaire', dataKey: 'comment' },
        ]}
      />
    </React.Fragment>
  );
};

const Rencontres = ({ onUpdateResults }) => {
  const { personId } = useParams();
  const person = useRecoilValue(populatedPersonSelector({ personId }));
  const personRencontres = useMemo(
    () => [...(person?.rencontres || [])].sort((r1, r2) => (dayjsInstance(r1.date).isBefore(dayjsInstance(r2.date), 'day') ? 1 : -1)),
    [person]
  );
  const [rencontreToEdit, setRencontreToEdit] = useState(null);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);

  useEffect(() => {
    onUpdateResults(personRencontres.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personRencontres.length]);

  return (
    <React.Fragment>
      <div style={{ display: 'flex', margin: '30px 0 20px', alignItems: 'center' }}>
        <Title>Rencontres</Title>
        <ButtonCustom
          title="Ajouter une rencontre"
          style={{ marginLeft: 'auto', marginBottom: '10px' }}
          onClick={() =>
            setRencontreToEdit({
              user: user._id,
              team: currentTeam._id,
              person: personId,
            })
          }
        />
      </div>
      <Rencontre rencontre={rencontreToEdit} onFinished={() => setRencontreToEdit(null)} />
      <Table
        data={personRencontres}
        rowKey={'_id'}
        onRowClick={(rencontre) => setRencontreToEdit(rencontre)}
        columns={[
          {
            title: 'Date',
            dataKey: 'date',
            render: (rencontre) => {
              return <DateBloc date={rencontre.date} />;
            },
          },
          {
            title: 'Heure',
            dataKey: 'time',
            render: (rencontre) => formatTime(rencontre.date),
          },
          {
            title: 'Équipe',
            dataKey: 'team',
            render: (rencontre) => {
              return <TagTeam key={rencontre.team} teamId={rencontre.team} />;
            },
          },
          {
            title: 'Enregistrée par',
            dataKey: 'user',
            render: (rencontre) => (rencontre.user ? <UserName id={rencontre.user} /> : null),
          },
          { title: 'Commentaire', dataKey: 'comment' },
        ]}
      />
    </React.Fragment>
  );
};

const PersonDocuments = ({ person, onUpdateResults, onGoToMedicalFiles }) => {
  const user = useRecoilValue(userState);
  const setPersons = useSetRecoilState(personsState);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const API = useApi();

  useEffect(() => {
    if (!!onUpdateResults) onUpdateResults(person.documents?.length || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person.documents?.length]);

  return (
    <Documents
      title={<Title>Documents</Title>}
      documents={person.documents}
      person={person}
      onAdd={async (docResponse) => {
        const { data: file, encryptedEntityKey } = docResponse;
        const personResponse = await API.put({
          path: `/person/${person._id}`,
          body: preparePersonForEncryption(
            customFieldsPersonsMedical,
            customFieldsPersonsSocial
          )({
            ...person,
            documents: [
              ...(person.documents || []),
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
            documents: person.documents.filter((d) => d._id !== document._id),
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
        onUpdateResults(person.documents.length);
      }}>
      {!!user.healthcareProfessional && (
        <LinkButton onClick={onGoToMedicalFiles} color="link">
          Voir les documents médicaux
        </LinkButton>
      )}
    </Documents>
  );
};

const StyledContainer = styled.div`
  div.row {
    padding: 10px 0;
  }
`;

const StyledTable = styled(Table)`
  table tr {
    height: 40px;
  }
`;

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

export default View;
