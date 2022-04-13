import React, { useEffect, useMemo, useState } from 'react';
import { FormGroup, Input, Label, Row, Col, Nav, TabContent, TabPane, NavItem, NavLink, Alert } from 'reactstrap';

import { useParams, useHistory, useLocation } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import styled from 'styled-components';
import DatePicker from 'react-datepicker';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import CustomFieldInput from '../../components/CustomFieldInput';
import TagTeam from '../../components/TagTeam';
import { SmallerHeaderWithBackButton } from '../../components/header';
import ButtonCustom from '../../components/ButtonCustom';
import CreateAction from '../action/CreateAction';
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
  commentForUpdatePerson,
} from '../../recoil/persons';
import { actionsState, mappedIdsToLabels } from '../../recoil/actions';
import UserName from '../../components/UserName';
import SelectCustom from '../../components/SelectCustom';
import SelectAsInput from '../../components/SelectAsInput';
import Places from '../../components/Places';
import ActionName from '../../components/ActionName';
import OutOfActiveList from './OutOfActiveList';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import Documents from '../../components/Documents';
import { dateForDatePicker, formatTime } from '../../services/date';
import { refreshTriggerState } from '../../components/Loader';
import useApi from '../../services/api';
import { commentsState, prepareCommentForEncryption } from '../../recoil/comments';
import DeletePerson from './DeletePerson';
import { MedicalFile } from './MedicalFile';
import { passagesState } from '../../recoil/passages';
import DateBloc from '../../components/DateBloc';
import Passage from '../../components/Passage';
import ExclamationMarkButton from '../../components/ExclamationMarkButton';
import useTitle from '../../services/useTitle';

const initTabs = ['Résumé', 'Dossier Médical', 'Actions', 'Commentaires', 'Passages', 'Lieux', 'Documents'];

const View = () => {
  const { id } = useParams();
  const location = useLocation();
  const history = useHistory();
  const API = useApi();
  const [persons, setPersons] = useRecoilState(personsState);
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const [tabsContents, setTabsContents] = useState(initTabs);
  const searchParams = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') ? initTabs.findIndex((value) => value.toLowerCase() === searchParams.get('tab')) : 0
  );

  const updateTabContent = (tabIndex, content) => setTabsContents((contents) => contents.map((c, index) => (index === tabIndex ? content : c)));

  const person = persons.find((p) => p._id === id) || {};
  useTitle(`${person?.name} - Personne`);

  return (
    <StyledContainer>
      <SmallerHeaderWithBackButton
        className="noprint"
        onRefresh={() =>
          setRefreshTrigger({
            status: true,
            options: { initialLoad: false, showFullScreen: false },
          })
        }
      />
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
          {person?.name} est en dehors de la file active, pour le motif suivant : <b>{person.outOfActiveListReason}</b>
        </Alert>
      )}
      <Nav tabs fill style={{ marginTop: 20, marginBottom: 0 }} className="noprint">
        {tabsContents.map((tabCaption, index) => {
          if (!organisation.receptionEnabled && tabCaption.includes('Passages')) return null;
          if (!user.healthcareProfessional && tabCaption.includes('Dossier Médical')) return null;
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
        <TabPane tabId={1}>
          <MedicalFile person={person} />
        </TabPane>
        <TabPane tabId={2}>
          <Actions person={person} onUpdateResults={(total) => updateTabContent(2, `Actions (${total})`)} />
        </TabPane>
        <TabPane tabId={3}>
          <Comments personId={person?._id} onUpdateResults={(total) => updateTabContent(3, `Commentaires (${total})`)} />
        </TabPane>
        <TabPane tabId={4}>
          <Passages personId={person?._id} onUpdateResults={(total) => updateTabContent(4, `Passages (${total})`)} />
        </TabPane>
        <TabPane tabId={5}>
          <Places personId={person?._id} onUpdateResults={(total) => updateTabContent(5, `Lieux (${total})`)} />
        </TabPane>
        <TabPane tabId={6}>{<Documents person={person} onUpdateResults={(total) => updateTabContent(6, `Documents (${total})`)} />}</TabPane>
      </TabContent>
    </StyledContainer>
  );
};

const Summary = ({ person }) => {
  const setPersons = useSetRecoilState(personsState);
  const setComments = useSetRecoilState(commentsState);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const organisation = useRecoilValue(organisationState);
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
          if (!body.followedSince) body.followedSince = person.createdAt;
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
                <Col md={6}>
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
                <Col md={6}>
                  <FormGroup>
                    <Label />
                    <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 20, width: '80%' }}>
                      <label htmlFor="person-alertness-checkbox">Personne très vulnérable, ou ayant besoin d'une attention particulière</label>
                      <Input id="person-alertness-checkbox" type="checkbox" name="alertness" checked={values.alertness} onChange={handleChange} />
                    </div>
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <FormGroup>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input name="phone" id="phone" value={values.phone || ''} onChange={handleChange} />
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <FormGroup>
                    <Label htmlFor="description">Description</Label>
                    <Input type="textarea" rows={5} name="description" id="description" value={values.description || ''} onChange={handleChange} />
                  </FormGroup>
                </Col>
              </Row>
              <hr />
              <Title>Dossier social</Title>
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
                  .filter((f) => f.enabled)
                  .map((field) => (
                    <CustomFieldInput model="person" values={values} handleChange={handleChange} field={field} key={field.name} />
                  ))}
              </Row>

              <hr />
              <Title>Dossier médical</Title>
              <Row>
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
                <Col md={4}>
                  <FormGroup>
                    <Label htmlFor="structureMedical">Structure de suivi médical</Label>
                    <Input name="structureMedical" id="structureMedical" value={values.structureMedical} onChange={handleChange} />
                  </FormGroup>
                </Col>
                {customFieldsPersonsMedical
                  .filter((f) => f.enabled)
                  .filter((f) => !f.onlyHealthcareProfessional || user.healthcareProfessional)
                  .map((field) => (
                    <CustomFieldInput model="person" values={values} handleChange={handleChange} field={field} key={field.name} />
                  ))}
              </Row>

              <hr />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <OutOfActiveList person={person} />
                <DeletePerson person={person} />
                <ButtonCustom title={'Mettre à jour'} loading={isSubmitting} onClick={handleSubmit} width={200} />
              </div>
            </React.Fragment>
          );
        }}
      </Formik>
    </>
  );
};

const Actions = ({ person, onUpdateResults }) => {
  const actions = useRecoilValue(actionsState);
  const history = useHistory();
  const organisation = useRecoilValue(organisationState);
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterStatus, setFilterStatus] = useState([]);

  const catsSelect = ['-- Aucune --', ...(organisation.categories || [])];

  const data = useMemo(() => {
    if (!person) return [];
    return actions.filter((a) => a.person === person._id);
  }, [person, actions]);

  const filteredData = useMemo(() => {
    let actionsToSet = data;
    if (filterCategories.length) {
      actionsToSet = actionsToSet.filter((a) =>
        filterCategories.some((c) => (c === '-- Aucune --' ? a.categories?.length === 0 : a.categories?.includes(c)))
      );
    }
    if (filterStatus.length) {
      actionsToSet = actionsToSet.filter((a) => filterStatus.some((s) => a.status === s));
    }
    return actionsToSet.sort((p1, p2) => (p1.dueAt > p2.dueAt ? -1 : 1)).map((a) => (a.urgent ? { ...a, style: { backgroundColor: '#fecaca' } } : a));
  }, [data, filterCategories, filterStatus]);

  useEffect(() => {
    onUpdateResults(data.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length]);

  return (
    <React.Fragment>
      <div style={{ display: 'flex', margin: '30px 0 20px', alignItems: 'center' }}>
        <Title>Actions</Title>
        <CreateAction person={person._id} />
      </div>
      {data.length ? (
        <Row>
          <Col md={6}>
            <Label htmlFor="action-select-categories-filter">Filtrer par catégorie</Label>
            <SelectCustom
              options={catsSelect}
              inputId="action-select-categories-filter"
              name="categories"
              onChange={(c) => {
                setFilterCategories(c);
              }}
              isClearable
              isMulti
              getOptionValue={(c) => c}
              getOptionLabel={(c) => c}
            />
          </Col>
          <Col md={6}>
            <Label htmlFor="action-select-status-filter">Filtrer par statut</Label>
            <SelectCustom
              inputId="action-select-status-filter"
              options={mappedIdsToLabels}
              getOptionValue={(s) => s._id}
              getOptionLabel={(s) => s.name}
              name="status"
              onChange={(s) => {
                setFilterStatus(s.map((s) => s._id));
              }}
              isClearable
              isMulti
            />
          </Col>
        </Row>
      ) : null}

      <StyledTable
        data={filteredData}
        rowKey={'_id'}
        onRowClick={(action) => history.push(`/action/${action._id}`)}
        noData={data.length && !filteredData.length ? 'Aucune action trouvée' : 'Aucune action'}
        columns={[
          {
            title: '',
            dataKey: 'urgent',
            small: true,
            render: (action) => {
              return action.urgent ? <ExclamationMarkButton /> : null;
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
          { title: 'Nom', dataKey: 'name', render: (action) => <ActionName action={action} /> },
          { title: 'Statut', dataKey: 'status', render: (action) => <ActionStatus status={action.status} /> },
          {
            title: 'Équipe',
            dataKey: 'team',
            render: (action) => <TagTeam key={action.team} teamId={action.team} />,
          },
        ]}
      />
    </React.Fragment>
  );
};

const Passages = ({ personId, onUpdateResults }) => {
  const passages = useRecoilValue(passagesState);
  const personPassages = useMemo(() => passages.filter((passage) => passage.person === personId), [personId, passages]);
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
            render: (passage) => <TagTeam key={passage.team} teamId={passage.team} />,
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
