/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { FormGroup, Input, Label, Row, Col, Nav, TabContent, TabPane, NavItem, NavLink, Alert } from 'reactstrap';

import { useParams, useHistory, useLocation } from 'react-router-dom';
import { Formik } from 'formik';
import { toastr } from 'react-redux-toastr';
import styled from 'styled-components';
import DatePicker from 'react-datepicker';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import CustomFieldInput from '../../components/CustomFieldInput';
import TagTeam from '../../components/TagTeam';
import Header from '../../components/header';
import ButtonCustom from '../../components/ButtonCustom';
import BackButton from '../../components/backButton';
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
import { actionsState } from '../../recoil/actions';
import UserName from '../../components/UserName';
import SelectCustom from '../../components/SelectCustom';
import SelectAsInput from '../../components/SelectAsInput';
import Places from '../../components/Places';
import ActionName from '../../components/ActionName';
import OutOfActiveList from './OutOfActiveList';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import Documents from '../../components/Documents';
import { dateForDatePicker, formatDateWithFullMonth, formatTime } from '../../services/date';
import { refreshTriggerState } from '../../components/Loader';
import useApi from '../../services/api';
import { commentsState, prepareCommentForEncryption } from '../../recoil/comments';
import { relsPersonPlaceState } from '../../recoil/relPersonPlace';

const initTabs = ['Résumé', 'Actions', 'Commentaires', 'Passages', 'Lieux', 'Documents'];

const View = () => {
  const { id } = useParams();
  const location = useLocation();
  const history = useHistory();
  const persons = useRecoilValue(personsState);
  const organisation = useRecoilValue(organisationState);
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);
  const [tabsContents, setTabsContents] = useState(initTabs);
  const searchParams = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') ? initTabs.findIndex((value) => value.toLowerCase() === searchParams.get('tab')) : 0
  );

  const updateTabContent = (tabIndex, content) => setTabsContents((contents) => contents.map((c, index) => (index === tabIndex ? content : c)));

  const person = persons.find((p) => p._id === id) || {};

  return (
    <StyledContainer style={{ padding: '40px 0' }}>
      <Header
        title={<BackButton />}
        onRefresh={() =>
          setRefreshTrigger({
            status: true,
            options: { initialLoad: false, showFullScreen: false },
          })
        }
      />
      <Title>
        {`Dossier de ${person?.name}`}
        <UserName id={person.user} wrapper={(name) => ` (créée par ${name})`} />
      </Title>
      {person.outOfActiveList && (
        <Alert color="warning">
          {person?.name} est en dehors de la file active, pour le motif suivant : <b>{person.outOfActiveListReason}</b>
        </Alert>
      )}
      <Nav tabs fill style={{ marginTop: 20, marginBottom: 0 }}>
        {tabsContents.map((tabCaption, index) => {
          if (!organisation.receptionEnabled && tabCaption.includes('Passages')) return null;
          return (
            <NavItem key={index} style={{ cursor: 'pointer' }}>
              <NavLink
                key={index}
                className={`${activeTab === index && 'active'}`}
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
          <Actions person={person} onUpdateResults={(total) => updateTabContent(1, `Actions (${total})`)} />
        </TabPane>
        <TabPane tabId={2}>
          <Comments personId={person?._id} onUpdateResults={(total) => updateTabContent(2, `Commentaires (${total})`)} />
        </TabPane>
        <TabPane tabId={3}>
          <Comments personId={person?._id} forPassages onUpdateResults={(total) => updateTabContent(3, `Passages (${total})`)} />
        </TabPane>
        <TabPane tabId={4}>
          <Places personId={person?._id} onUpdateResults={(total) => updateTabContent(4, `Lieux (${total})`)} />
        </TabPane>
        <TabPane tabId={5}>{<Documents person={person} onUpdateResults={(total) => updateTabContent(5, `Documents (${total})`)} />}</TabPane>
      </TabContent>
    </StyledContainer>
  );
};

const Summary = ({ person }) => {
  const history = useHistory();
  const setPersons = useSetRecoilState(personsState);
  const [actions, setActions] = useRecoilState(actionsState);
  const [comments, setComments] = useRecoilState(commentsState);
  const [relsPersonPlace, setRelsPersonPlace] = useRecoilState(relsPersonPlaceState);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const organisation = useRecoilValue(organisationState);
  const API = useApi();

  const deleteData = async () => {
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
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
      }
      if (personRes?.ok) {
        toastr.success('Suppression réussie');
        history.goBack();
      }
    }
  };

  return (
    <>
      <Row style={{ marginTop: '30px', marginBottom: '5px' }}>
        <Col md={4}>
          <Title>Résumé</Title>
        </Col>
      </Row>
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
              if (commentResponse.ok) setComments((comments) => [response.decryptedData, ...comments]);
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
                    <Label>Nom prénom ou Pseudonyme</Label>
                    <Input name="name" value={values.name || ''} onChange={handleChange} />
                  </FormGroup>
                </Col>
                <Col md={4}>
                  <FormGroup>
                    <Label>Autres pseudos</Label>
                    <Input name="otherNames" value={values.otherNames || ''} onChange={handleChange} />
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
                  <FormGroup>
                    <Label>En rue depuis le</Label>
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
                    <Label>Suivi(e) depuis le / Créé le</Label>
                    <div>
                      <DatePicker
                        locale="fr"
                        className="form-control"
                        selected={dateForDatePicker(values.createdAt)}
                        onChange={(date) => handleChange({ target: { value: date, name: 'createdAt' } })}
                        dateFormat="dd/MM/yyyy"
                        id="person-createdAt"
                      />
                    </div>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Équipe(s) en charge</Label>
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
                      <span>Personne très vulnérable, ou ayant besoin d'une attention particulière</span>
                      <Input id="person-alertness-checkbox" type="checkbox" name="alertness" checked={values.alertness} onChange={handleChange} />
                    </div>
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <FormGroup>
                    <Label>Téléphone</Label>
                    <Input name="phone" value={values.phone || ''} onChange={handleChange} />
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <FormGroup>
                    <Label>Description</Label>
                    <Input type="textarea" rows={5} name="description" value={values.description || ''} onChange={handleChange} />
                  </FormGroup>
                </Col>
              </Row>
              <hr />
              <Title>Dossier social</Title>
              <Row>
                <Col md={4}>
                  <Label>Situation personnelle</Label>
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
                    <Label>Structure de suivi social</Label>
                    <Input name="structureSocial" value={values.structureSocial || ''} onChange={handleChange} />
                  </FormGroup>
                </Col>
                <Col md={4}>
                  <FormGroup>
                    <Label>Avec animaux</Label>
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
                    <Label>Hébergement</Label>
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
                    <Label>Nationalité</Label>
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
                    <Label>Emploi</Label>
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
                  <FormGroup>
                    <Label>Structure de suivi médical</Label>
                    <Input name="structureMedical" value={values.structureMedical} onChange={handleChange} />
                  </FormGroup>
                </Col>
                {customFieldsPersonsMedical
                  .filter((f) => f.enabled)
                  .map((field) => (
                    <CustomFieldInput model="person" values={values} handleChange={handleChange} field={field} key={field.name} />
                  ))}
              </Row>

              <hr />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <OutOfActiveList person={person} />
                <ButtonCustom title={'Supprimer'} type="button" style={{ marginRight: 10 }} color="danger" onClick={deleteData} width={200} />
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
  const [data, setData] = useState([]);
  const history = useHistory();

  useEffect(() => {
    if (!person) return;
    setData(actions.filter((a) => a.person === person._id).sort((p1, p2) => (p1.dueAt > p2.dueAt ? -1 : 1)));
  }, [actions, person]);

  useEffect(() => {
    onUpdateResults(data.length);
  }, [data.length]);

  return (
    <React.Fragment>
      <div style={{ display: 'flex', margin: '30px 0 20px', alignItems: 'center' }}>
        <Title>Actions</Title>
        <CreateAction person={person._id} />
      </div>
      <StyledTable
        data={data}
        rowKey={'_id'}
        onRowClick={(action) => history.push(`/action/${action._id}`)}
        columns={[
          { title: 'Nom', dataKey: 'name', render: (action) => <ActionName action={action} /> },
          { title: 'À faire le', dataKey: 'dueAt', render: (action) => formatDateWithFullMonth(action.dueAt) },
          {
            title: 'Heure',
            dataKey: '_id',
            render: (action) => {
              if (!action.dueAt || !action.withTime) return null;
              return formatTime(action.dueAt);
            },
          },
          { title: 'Status', dataKey: 'status', render: (action) => <ActionStatus status={action.status} /> },
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
          <Label>Type d'hébergement</Label>
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
            <Label>Autre type d'hébergement</Label>
            <Input name="addressDetail" value={values.addressDetail === 'Autre' ? '' : values.addressDetail} onChange={onChangeRequest} />
          </FormGroup>
        )}
      </Col>
    </>
  );
};

const Reasons = ({ value, onChange }) => (
  <FormGroup>
    <Label>Motif de la situation en rue</Label>
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
    <Label>Ressources</Label>
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
