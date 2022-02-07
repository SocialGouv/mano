/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Col, Container, Label, Nav, NavItem, NavLink, Row, TabContent, TabPane } from 'reactstrap';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import Header from '../../components/header';
import Loading from '../../components/loading';
import {
  healthInsuranceOptions,
  nationalitySituationOptions,
  personalSituationOptions,
  reasonsOptions,
  ressourcesOptions,
  filterPersonsBase,
  personsState,
  usePersons,
  customFieldsPersonsSocialSelector,
  customFieldsPersonsMedicalSelector,
} from '../../recoil/persons';
import { customFieldsObsSelector, territoryObservationsState } from '../../recoil/territoryObservations';
import DateRangePickerWithPresets from '../../components/DateRangePickerWithPresets';
import { CustomResponsiveBar, CustomResponsivePie } from '../../components/charts';
import Filters, { filterData } from '../../components/Filters';
import Card from '../../components/Card';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import { actionsState, useActions } from '../../recoil/actions';
import { reportsState } from '../../recoil/reports';
import { useRefresh } from '../../recoil/refresh';
import ExportData from '../data-import-export/ExportData';
import SelectCustom from '../../components/SelectCustom';
import { useTerritories } from '../../recoil/territory';
import { passagesNonAnonymousPerDatePerTeamSelector } from '../../recoil/selectors';
import { dayjsInstance } from '../../services/date';
import { refreshTriggerState } from '../../components/Loader';

const getDataForPeriod = (data, { startDate, endDate }, filters = []) => {
  if (!!filters?.filter((f) => Boolean(f?.value)).length) data = filterData(data, filters);
  if (!startDate || !endDate) {
    return data;
  }
  return data.filter((item) => dayjsInstance(item.createdAt).isBetween(startDate, endDate));
};

const tabs = ['Général', 'Accueil', 'Actions', 'Personnes suivies', 'Observations', 'Comptes-rendus'];

const Stats = () => {
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);

  const { loading: personsLoading } = usePersons();
  const allPersons = useRecoilValue(personsState);
  const { loading: actionsLoading } = useActions();
  const allActions = useRecoilValue(actionsState);
  const allreports = useRecoilValue(reportsState);
  const allObservations = useRecoilValue(territoryObservationsState);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const { territories } = useTerritories();
  const setRefreshTrigger = useSetRecoilState(refreshTriggerState);
  const [loading, setLoading] = useState(false);
  const [territory, setTerritory] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filterPersons, setFilterPersons] = useState([]);
  const [viewAllOrganisationData, setViewAllOrganisationData] = useState(false);
  const [period, setPeriod] = useState({ startDate: null, endDate: null });
  const nonAnonymousPassages = useRecoilValue(
    passagesNonAnonymousPerDatePerTeamSelector({
      filterCurrentTeam: !viewAllOrganisationData,
      date: {
        startDate: period.startDate,
        endDate: period.endDate,
      },
    })
  );

  const addFilter = ({ field, value }) => {
    setFilterPersons((filters) => [...filters, { field, value }]);
  };

  useEffect(() => {
    if (loading) {
      setRefreshTrigger({
        status: true,
        method: 'refresh',
        options: [],
      });
    }
  }, [loading]);

  useEffect(() => {
    if (!personsLoading && !actionsLoading) setLoading(false);
  }, [personsLoading, actionsLoading]);

  if (loading) return <Loading />;

  const persons = getDataForPeriod(
    allPersons.filter((e) => viewAllOrganisationData || (e.assignedTeams || []).includes(currentTeam._id)),
    period,
    filterPersons
  );
  const actions = getDataForPeriod(
    allActions.filter((e) => viewAllOrganisationData || e.team === currentTeam._id),
    period
  );
  const observations = getDataForPeriod(
    allObservations
      .filter((e) => viewAllOrganisationData || e.team === currentTeam._id)
      .filter((e) => !territory?._id || e.territory === territory._id),
    period
  );
  const reports = getDataForPeriod(
    allreports.filter((e) => viewAllOrganisationData || e.team === currentTeam._id),
    period
  );
  const reportsServices = reports.map((rep) => (rep.services ? JSON.parse(rep.services) : null)).filter(Boolean);

  // Add enabled custom fields in filters.
  const filterPersonsWithAllFields = [
    ...filterPersonsBase,
    ...customFieldsPersonsSocial.filter((a) => a.enabled).map((a) => ({ field: a.name, ...a })),
    ...customFieldsPersonsMedical.filter((a) => a.enabled).map((a) => ({ field: a.name, ...a })),
  ];

  return (
    <Container>
      <Header
        title={
          <>
            Statistiques{' '}
            {viewAllOrganisationData ? (
              <>
                <b>globales</b> de <b>{organisation.name}</b>
              </>
            ) : (
              <>
                de l'équipe {currentTeam?.nightSession ? 'de nuit ' : ''}
                <b>{currentTeam?.name || ''}</b>
              </>
            )}
          </>
        }
        titleStyle={{ fontWeight: 400 }}
        onRefresh={() => setLoading(true)}
      />
      <Row className="date-picker-container" style={{ marginBottom: '20px', alignItems: 'center' }}>
        <Col md={4}>
          <DateRangePickerWithPresets period={period} setPeriod={setPeriod} />
        </Col>
        <Col md={4}>
          <label>
            <input type="checkbox" style={{ marginRight: '1rem' }} onChange={() => setViewAllOrganisationData(!viewAllOrganisationData)} />
            Statistiques de toute l'organisation
          </label>
        </Col>
        {['admin'].includes(user.role) && (
          <Col md={4} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <ExportData />
          </Col>
        )}
      </Row>
      <Nav tabs style={{ marginBottom: 20 }}>
        {tabs.map((tabCaption, index) => {
          if (!organisation.receptionEnabled && index === 1) return null;
          return (
            <NavItem key={index} style={{ cursor: 'pointer' }}>
              <NavLink key={index} className={`${activeTab === index && 'active'}`} onClick={() => setActiveTab(index)}>
                {tabCaption}
              </NavLink>
            </NavItem>
          );
        })}
      </Nav>
      <TabContent activeTab={activeTab}>
        <TabPane tabId={0}>
          <Title>Statistiques générales</Title>
          <Row style={{ marginBottom: '20px' }}>
            <Col md={2} />
            <Block data={persons} title="Nombre de personnes suivies" />
            <Block data={actions} title="Nombre d'actions" />
            <Col md={2} />
          </Row>
        </TabPane>
        {!!organisation.receptionEnabled && (
          <TabPane tabId={1}>
            <Title>Statistiques de l'accueil</Title>
            <Row>
              <Block
                data={reports.reduce((passages, rep) => passages + (rep.passages || 0), 0) + (nonAnonymousPassages?.length || 0)}
                title="Nombre de passages"
              />
              {organisation.services?.map((service) => (
                <Block
                  key={service}
                  data={reportsServices.reduce((serviceNumber, rep) => (rep?.[service] || 0) + serviceNumber, 0)}
                  title={service}
                />
              ))}
            </Row>
          </TabPane>
        )}
        <TabPane tabId={2}>
          <Title>Statistiques des actions</Title>
          <CustomResponsivePie
            title="Répartition des actions par catégorie"
            data={getPieData(
              actions.reduce((actionsSplitsByCategories, action) => {
                if (!!action.categories?.length) {
                  for (const category of action.categories) {
                    actionsSplitsByCategories.push({ ...action, category });
                  }
                } else {
                  actionsSplitsByCategories.push(action);
                }
                return actionsSplitsByCategories;
              }, []),
              'category',
              { options: organisation.categories }
            )}
          />
        </TabPane>
        <TabPane tabId={3}>
          <Title>Statistiques des personnes suivies</Title>
          <Filters base={filterPersonsWithAllFields} filters={filterPersons} onChange={setFilterPersons} />
          <Row>
            <Block data={persons} title="Nombre de personnes suivies" />
            <BlockCreatedAt persons={persons} />
            <BlockWanderingAt persons={persons} />
          </Row>
          <CustomResponsivePie
            onAddFilter={addFilter}
            title="Nationalité"
            field="nationalitySituation"
            data={getPieData(persons, 'nationalitySituation', { options: nationalitySituationOptions })}
          />
          <CustomResponsivePie
            onAddFilter={addFilter}
            title="Situation personnelle"
            field="personalSituation"
            data={getPieData(persons, 'personalSituation', { options: personalSituationOptions })}
          />
          <CustomResponsivePie
            onAddFilter={addFilter}
            title="Motif de la situation de rue"
            field="reasons"
            data={getPieData(persons, 'reasons', { options: reasonsOptions })}
          />
          <CustomResponsivePie
            onAddFilter={addFilter}
            title="Ressources des personnes suivies"
            field="resources"
            data={getPieData(persons, 'resources', { options: ressourcesOptions })}
          />
          <AgeRangeBar persons={persons} />
          <StatsCreatedAtRangeBar persons={persons} />
          <CustomResponsivePie onAddFilter={addFilter} title="Type d'hébergement" data={getAdressPieData(persons)} />
          <CustomResponsivePie
            onAddFilter={addFilter}
            title="Couverture médicale des personnes"
            field="healthInsurance"
            data={getPieData(persons, 'healthInsurance', { options: healthInsuranceOptions })}
          />
          <CustomResponsivePie onAddFilter={addFilter} title="Avec animaux" data={getPieData(persons, 'hasAnimal')} />
          <CustomResponsivePie
            onAddFilter={addFilter}
            title="Personnes très vulnérables"
            field="alertness"
            data={getPieData(persons, 'alertness', { isBoolean: true })}
          />
          <CustomResponsivePie
            onAddFilter={addFilter}
            title="Sortie de file active"
            field="outOfActiveList"
            data={getPieData(persons, 'outOfActiveList', { isBoolean: true })}
          />
          <CustomResponsivePie
            onAddFilter={addFilter}
            title="Raison de sortie de file active"
            field="outOfActiveListReason"
            data={getPieData(
              persons.filter((p) => !!p.outOfActiveList),
              'outOfActiveListReason'
            )}
          />
          {[customFieldsPersonsMedical, customFieldsPersonsSocial].map((customFields) => {
            return (
              <>
                {customFields
                  .filter((f) => f.enabled)
                  .filter((f) => f.showInStats)
                  .filter((field) => ['number'].includes(field.type))
                  .map((field) => (
                    <Col md={3} style={{ marginBottom: '20px' }} key={field.name}>
                      <BlockTotal title={field.label} data={persons} field={field.name} />
                    </Col>
                  ))}
                {customFields
                  .filter((f) => f.enabled)
                  .filter((f) => f.showInStats)
                  .filter((field) => ['date', 'date-with-time'].includes(field.type))
                  .map((field) => (
                    <Col md={3} style={{ marginBottom: '20px' }} key={field.name}>
                      <BlockDateWithTime data={persons} field={field} />
                    </Col>
                  ))}
                {customFields
                  .filter((f) => f.enabled)
                  .filter((f) => f.showInStats)
                  .filter((field) => ['boolean', 'yes-no', 'enum', 'multi-choice'].includes(field.type))
                  .map((field) => (
                    <CustomResponsivePie
                      title={field.label}
                      key={field.name}
                      data={getPieData(persons, field.name, { options: field.options, isBoolean: field.type === 'boolean' })}
                    />
                  ))}
              </>
            );
          })}
        </TabPane>
        <TabPane tabId={4}>
          <Title>Statistiques des observations de territoire</Title>
          <div style={{ maxWidth: '350px', marginBottom: '2rem' }}>
            <Label>Filter par territoire</Label>
            <SelectCustom
              options={territories}
              name="place"
              placeholder="Tous les territoires"
              onChange={(t) => {
                setTerritory(t);
              }}
              isClearable={true}
              getOptionValue={(i) => i._id}
              getOptionLabel={(i) => i.name}
            />
          </div>
          <Row>
            {customFieldsObs
              .filter((f) => f.enabled)
              .filter((f) => f.showInStats)
              .filter((field) => ['number'].includes(field.type))
              .map((field) => (
                <Col md={4} style={{ marginBottom: '20px' }} key={field.name}>
                  <BlockTotal title={field.label} data={observations} field={field.name} />
                </Col>
              ))}
            {customFieldsObs
              .filter((f) => f.enabled)
              .filter((f) => f.showInStats)
              .filter((field) => ['date', 'date-with-time'].includes(field.type))
              .map((field) => (
                <Col md={4} style={{ marginBottom: '20px' }} key={field.name}>
                  <BlockDateWithTime data={observations} field={field} />
                </Col>
              ))}
            {customFieldsObs
              .filter((f) => f.enabled)
              .filter((f) => f.showInStats)
              .filter((field) => ['boolean', 'yes-no', 'enum', 'multi-choice'].includes(field.type))
              .map((field) => (
                <CustomResponsivePie
                  title={field.label}
                  key={field.name}
                  data={getPieData(observations, field.name, { options: field.options, isBoolean: field.type === 'boolean' })}
                />
              ))}
          </Row>
        </TabPane>
        <TabPane tabId={5}>
          <Title>Statistiques des comptes-rendus</Title>
          <CustomResponsivePie
            title="Répartition des comptes-rendus par collaboration"
            data={getPieData(reports, 'collaborations', { options: organisation.collaborations || [] })}
          />
        </TabPane>
      </TabContent>
    </Container>
  );
};

const getPieData = (source, key, { options = null, isBoolean = false } = {}) => {
  const data = source.reduce(
    (newData, person) => {
      if (isBoolean) {
        newData[Boolean(person[key]) ? 'Oui' : 'Non']++;
        return newData;
      }
      if (!person[key] || !person[key].length) {
        newData['Non renseigné']++;
        return newData;
      }
      if (options && options.length) {
        for (let option of [...options, 'Uniquement']) {
          if (typeof person[key] === 'string' ? person[key] === option : person[key].includes(option)) {
            if (!newData[option]) newData[option] = 0;
            newData[option]++;
          }
        }
        return newData;
      }
      if (!newData[person[key]]) newData[person[key]] = 0;
      newData[person[key]]++;
      return newData;
    },
    { 'Non renseigné': 0, Oui: 0, Non: 0 }
  );
  return Object.keys(data)
    .map((key) => ({ id: key, label: key, value: data[key] }))
    .filter((d) => d.value > 0);
};

const getAdressPieData = (data) => {
  data = data.reduce(
    (newData, person) => {
      if (!person.address) {
        newData['Non renseigné']++;
        return newData;
      }
      if (person.address === 'Non') {
        newData.Non++;
        return newData;
      }
      if (!person.addressDetail) {
        newData['Oui (Autre)']++;
        return newData;
      }
      if (!newData[person.addressDetail]) newData[person.addressDetail] = 0;
      newData[person.addressDetail]++;
      return newData;
    },
    { 'Oui (Autre)': 0, Non: 0, 'Non renseigné': 0 }
  );
  return Object.keys(data).map((key) => ({ id: key, label: key, value: data[key] }));
};

const AgeRangeBar = ({ persons }) => {
  const categories = ['0 - 2', '3 - 17', '18 - 24', '25 - 44', '45 - 59', '60+'];

  let data = persons.reduce((newData, person) => {
    if (!person.birthdate || !person.birthdate.length) {
      newData['Non renseigné']++;
      return newData;
    }
    const parsedDate = Date.parse(person.birthdate);
    const fromNowInYear = (Date.now() - parsedDate) / 1000 / 60 / 60 / 24 / 365.25;
    if (fromNowInYear < 2) {
      newData['0 - 2']++;
      return newData;
    }
    if (fromNowInYear < 18) {
      newData['3 - 17']++;
      return newData;
    }
    if (fromNowInYear < 25) {
      newData['18 - 24']++;
      return newData;
    }
    if (fromNowInYear < 45) {
      newData['25 - 44']++;
      return newData;
    }
    if (fromNowInYear < 60) {
      newData['45 - 59']++;
      return newData;
    }
    newData['60+']++;
    return newData;
  }, initCategories(categories));

  data = Object.keys(data)
    .filter((key) => data[key] > 0)
    .map((key) => ({ name: key, [key]: data[key] }));

  return (
    <CustomResponsiveBar title="Tranche d'âges" categories={categories} data={data} axisTitleX="Tranche d'âge" axisTitleY="Nombre de personnes" />
  );
};

const initCategories = (categories) => {
  const objCategories = {};
  for (const cat of categories) {
    objCategories[cat] = 0;
  }
  return objCategories;
};

const StatsCreatedAtRangeBar = ({ persons }) => {
  const categories = ['0-6 mois', '6-12 mois', '1-2 ans', '2-5 ans', '+ 5 ans'];

  let data = persons.reduce((newData, person) => {
    if (!person.createdAt || !person.createdAt.length) {
      return newData;
      // newData["Non renseigné"]++;
    }
    const parsedDate = Date.parse(person.createdAt);
    const fromNowInMonths = (Date.now() - parsedDate) / 1000 / 60 / 60 / 24 / (365.25 / 12);
    if (fromNowInMonths < 6) {
      newData['0-6 mois']++;
      return newData;
    }
    if (fromNowInMonths < 12) {
      newData['6-12 mois']++;
      return newData;
    }
    if (fromNowInMonths < 24) {
      newData['1-2 ans']++;
      return newData;
    }
    if (fromNowInMonths < 60) {
      newData['2-5 ans']++;
      return newData;
    }
    newData['+ 5 ans']++;
    return newData;
  }, initCategories(categories));

  data = Object.keys(data)
    .filter((key) => data[key] > 0)
    .map((key) => ({ name: key, [key]: data[key] }));

  return (
    <CustomResponsiveBar
      title="Temps de suivi (par tranche)"
      categories={categories}
      data={data}
      axisTitleX="Temps de suivi"
      axisTitleY="Nombre de personnes"
    />
  );
};

const Block = ({ data, title = 'Nombre de personnes suivies' }) => (
  <Col md={4} style={{ marginBottom: 20 }}>
    <Card title={title} count={Array.isArray(data) ? String(data.length) : data} />
  </Col>
);

const getDuration = (timestampFromNow) => {
  const inDays = Math.round(timestampFromNow / 1000 / 60 / 60 / 24);
  if (inDays < 90) return [inDays, 'jours'];
  const inMonths = inDays / (365 / 12);
  if (inMonths < 24) return [Math.round(inMonths), 'mois'];
  const inYears = inDays / 365.25;
  return [Math.round(inYears), 'années'];
};

const BlockDateWithTime = ({ data, field }) => {
  if (!data.filter((item) => Boolean(item[field.name])).length) return null;

  const averageField =
    data.filter((item) => Boolean(item[field.name])).reduce((total, item) => total + Date.parse(item[field.name]), 0) / (data.length || 1);

  const durationFromNowToAverage = Date.now() - averageField;
  const [count, unit] = getDuration(durationFromNowToAverage);

  return <Card title={field.label + ' (moyenne)'} unit={unit} count={count} />;
};

const BlockCreatedAt = ({ persons }) => {
  const averageCreatedAt = persons.reduce((total, person) => total + Date.parse(person.createdAt), 0) / (persons.length || 1);
  const durationFromNowToAverage = Date.now() - averageCreatedAt;
  const [count, unit] = getDuration(durationFromNowToAverage);

  return (
    <Col md={4} style={{ marginBottom: 20 }}>
      <Card title="Temps de suivi moyen" unit={unit} count={count} />
    </Col>
  );
};

const BlockWanderingAt = ({ persons }) => {
  persons = persons.filter((p) => Boolean(p.wanderingAt));
  if (!persons.length) {
    return <Card title="Temps d'errance des personnes<br/>en moyenne" unit={'N/A'} count={0} />;
  }
  const averageWanderingAt = persons.reduce((total, person) => total + Date.parse(person.wanderingAt), 0) / (persons.length || 1);
  const durationFromNowToAverage = Date.now() - averageWanderingAt;
  const [count, unit] = getDuration(durationFromNowToAverage);

  return (
    <Col md={4} style={{ marginBottom: 20 }}>
      <Card title="Temps d'errance des personnes<br/>en moyenne" unit={unit} count={count} />
    </Col>
  );
};

const BlockTotal = ({ title, unit, data, field }) => {
  try {
    data = data.filter((item) => Boolean(item[field]));
    if (!data.length) {
      return <Card title={title} unit={unit} count={0} />;
    }
    const total = data.reduce((total, item) => total + Number(item[field]), 0);
    return <Card title={title} unit={unit} count={total} />;
  } catch (errorBlockTotal) {
    console.log('error block total', errorBlockTotal, { title, unit, data, field });
  }
  return null;
};

const Title = styled.h3`
  margin-top: 20px;
  margin-bottom: 20px;
  font-size: 20px;
`;

export default Stats;
