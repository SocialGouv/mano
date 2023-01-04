import React, { useCallback, useMemo } from 'react';
import { useLocalStorage } from 'react-use';
import { Col, Nav, NavItem, NavLink, Row, TabContent, TabPane } from 'reactstrap';
import { useRecoilValue } from 'recoil';
import { HeaderStyled, RefreshButton, Title as HeaderTitle } from '../../components/header';
import Loading from '../../components/loading';
import {
  customFieldsPersonsSocialSelector,
  customFieldsPersonsMedicalSelector,
  fieldsPersonsCustomizableOptionsSelector,
  filterPersonsBaseSelector,
  personFieldsSelector,
} from '../../recoil/persons';
import { customFieldsObsSelector, territoryObservationsState } from '../../recoil/territoryObservations';
import DateRangePickerWithPresets from '../../components/DateRangePickerWithPresets';
import { filterData } from '../../components/Filters';
import { currentTeamState, organisationState, teamsState, userState } from '../../recoil/auth';
import { actionsCategoriesSelector, actionsState, DONE, flattenedCategoriesSelector } from '../../recoil/actions';
import { reportsState } from '../../recoil/reports';
import { territoriesState } from '../../recoil/territory';
import { dayjsInstance, getIsDayWithinHoursOffsetOfPeriod } from '../../services/date';
import { useDataLoader } from '../../components/DataLoader';
import { passagesState } from '../../recoil/passages';
import { rencontresState } from '../../recoil/rencontres';
import useTitle from '../../services/useTitle';
import { consultationsState } from '../../recoil/consultations';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import { customFieldsMedicalFileSelector } from '../../recoil/medicalFiles';
import { personsWithMedicalFileMergedSelector } from '../../recoil/selectors';
import { groupsState } from '../../recoil/groups';
import ExportFormattedData from '../data-import-export/ExportFormattedData';
import GeneralStats from './1_General';
import ReceptionStats from './2_Reception';
import ActionsStats from './3_Actions';
import PersonStats from './4_Persons';
import PassagesStats from './5_Passages';
import RencontresStats from './6_Rencontres';
import ObservationsStats from './7_Observations';
import ReportsStats from './8_Reports';
import ConsultationsStats from './9_Consultations';
import MedicalFilesStats from './10_MedicalFiles';

const getDataForPeriod = (
  data,
  { startDate, endDate },
  selectedTeams,
  viewAllOrganisationData,
  { filters = [], field = 'createdAt', backupField = 'createdAt' } = {},
  callback = null
) => {
  if (!!filters?.filter((f) => Boolean(f?.value)).length) data = filterData(data, filters);
  if (!startDate || !endDate) {
    return data;
  }
  const offsetHours = Boolean(viewAllOrganisationData) || selectedTeams.every((e) => !e.nightSession) ? 0 : 12;

  if (callback) {
    return callback(data, offsetHours);
  }
  return data.filter((item) =>
    getIsDayWithinHoursOffsetOfPeriod(
      item[field] || item[backupField] || item.createdAt,
      { referenceStartDay: startDate, referenceEndDay: endDate },
      offsetHours
    )
  );
};
const tabs = [
  'Général',
  'Accueil',
  'Actions',
  'Personnes suivies',
  'Passages',
  'Rencontres',
  'Observations',
  'Comptes-rendus',
  'Consultations',
  'Dossiers médicaux',
];
const Stats = () => {
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const teams = useRecoilValue(teamsState);

  const allPersons = useRecoilValue(personsWithMedicalFileMergedSelector);
  const allConsultations = useRecoilValue(consultationsState);
  const allActions = useRecoilValue(actionsState);
  const allreports = useRecoilValue(reportsState);
  const allObservations = useRecoilValue(territoryObservationsState);
  const allPassages = useRecoilValue(passagesState);
  const allRencontres = useRecoilValue(rencontresState);
  const allGroups = useRecoilValue(groupsState);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);
  const fieldsPersonsCustomizableOptions = useRecoilValue(fieldsPersonsCustomizableOptionsSelector);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);
  const personFields = useRecoilValue(personFieldsSelector);
  const territories = useRecoilValue(territoriesState);
  const allCategories = useRecoilValue(flattenedCategoriesSelector);
  const groupsCategories = useRecoilValue(actionsCategoriesSelector);
  const { isLoading } = useDataLoader({ refreshOnMount: true });

  const [selectedTerritories, setSelectedTerritories] = useLocalStorage('stats-territories', []);
  const [activeTab, setActiveTab] = useLocalStorage('stats-tab', 0);
  const [filterPersons, setFilterPersons] = useLocalStorage('stats-filterPersons-defaultEverybody', [
    { field: 'outOfActiveList', value: "Oui et non (c'est-à-dire tout le monde)", type: 'multi-choice' },
  ]);
  const [viewAllOrganisationData, setViewAllOrganisationData] = useLocalStorage('stats-viewAllOrganisationData', teams.length === 1);
  const [period, setPeriod] = useLocalStorage('period', { startDate: null, endDate: null });
  const [actionsStatuses, setActionsStatuses] = useLocalStorage('stats-actionsStatuses', DONE);
  const [selectedTeams, setSelectedTeams] = useLocalStorage('stats-teams', [currentTeam]);

  useTitle(`${tabs[activeTab]} - Statistiques`);

  const filterByTeam = useCallback(
    (elements, key) => {
      return elements.filter((e) => viewAllOrganisationData || selectedTeams.some((f) => (e[key] || []).includes(f._id)));
    },
    [selectedTeams, viewAllOrganisationData]
  );

  const filterActionsByTeam = useCallback(
    (elements) => {
      if (viewAllOrganisationData) return elements;
      return elements.filter((e) => selectedTeams.some((f) => (e.teams?.length ? e.teams.includes(f._id) : e.team === f._id)));
    },
    [selectedTeams, viewAllOrganisationData]
  );

  const groupsForPersons = useCallback(
    (persons) => {
      const groupIds = persons.reduce((setOfGroupIds, person) => {
        if (person.group) {
          setOfGroupIds.add(person.group._id);
        }
        return setOfGroupIds;
      }, new Set());
      return allGroups.filter((group) => groupIds.has(group._id));
    },
    [allGroups]
  );

  const persons = useMemo(
    () =>
      getDataForPeriod(filterByTeam(allPersons, 'assignedTeams'), period, selectedTeams, viewAllOrganisationData, {
        filters: filterPersons.filter((f) => f.field !== 'outOfActiveList'),
        field: 'followedSince',
      }),
    [allPersons, filterByTeam, filterPersons, period, selectedTeams, viewAllOrganisationData]
  );

  const personsUpdated = useMemo(
    () =>
      getDataForPeriod(
        filterByTeam(allPersons, 'assignedTeams'),
        period,
        selectedTeams,
        viewAllOrganisationData,
        {
          filters: filterPersons.filter((f) => f.field !== 'outOfActiveList'),
          field: 'followedSince',
        },
        (data, offsetHours) => {
          const res = data.filter((item) => {
            const params = [{ referenceStartDay: period.startDate, referenceEndDay: period.endDate }, offsetHours];
            if (!item) return false;
            return (
              getIsDayWithinHoursOffsetOfPeriod(item.createdAt, ...params) ||
              getIsDayWithinHoursOffsetOfPeriod(item.updatedAt, ...params) ||
              item.actions?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.createdAt, ...params)) ||
              item.actions?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.updatedAt, ...params)) ||
              item.comments?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.createdAt, ...params)) ||
              item.comments?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.updatedAt, ...params)) ||
              item.passages?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.createdAt, ...params)) ||
              item.passages?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.updatedAt, ...params)) ||
              item.rencontres?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.createdAt, ...params)) ||
              item.rencontres?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.updatedAt, ...params)) ||
              item.relsPersonPlace?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.createdAt, ...params)) ||
              item.relsPersonPlace?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.updatedAt, ...params)) ||
              item.treatments?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.createdAt, ...params)) ||
              item.treatments?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.updatedAt, ...params)) ||
              item.consultations?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.createdAt, ...params)) ||
              item.consultations?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.updatedAt, ...params))
            );
          });
          return res;
        }
      ),
    [filterByTeam, allPersons, period, selectedTeams, viewAllOrganisationData, filterPersons]
  );

  const personsForStats = useMemo(() => {
    const outOfActiveListFilter = filterPersons.find((f) => f.field === 'outOfActiveList')?.value;
    if (outOfActiveListFilter === 'Oui') return persons.filter((p) => p.outOfActiveList);
    if (outOfActiveListFilter === 'Non') return persons.filter((p) => !p.outOfActiveList);
    return persons;
  }, [filterPersons, persons]);

  const personsUpdatedForStats = useMemo(() => {
    const outOfActiveListFilter = filterPersons.find((f) => f.field === 'outOfActiveList')?.value;
    if (outOfActiveListFilter === 'Oui') return personsUpdated.filter((p) => p.outOfActiveList);
    if (outOfActiveListFilter === 'Non') return personsUpdated.filter((p) => !p.outOfActiveList);
    return personsUpdated;
  }, [filterPersons, personsUpdated]);

  const personsWithActions = useMemo(() => {
    const offsetHours = Boolean(viewAllOrganisationData) || selectedTeams.every((e) => !e.nightSession) ? 0 : 12;
    const params = [{ referenceStartDay: period.startDate, referenceEndDay: period.endDate }, offsetHours];
    return personsUpdatedForStats.filter((person) => {
      if (!person) return false;
      if (!period.startDate || !period.endDate) return !!person.actions?.length;
      const hasActions = person.actions?.some((a) => getIsDayWithinHoursOffsetOfPeriod(a.updatedAt, ...params));
      return hasActions;
    });
  }, [period.endDate, period.startDate, personsUpdatedForStats, selectedTeams, viewAllOrganisationData]);

  const actions = useMemo(
    () =>
      getDataForPeriod(filterActionsByTeam(allActions), period, selectedTeams, viewAllOrganisationData, {
        field: 'completedAt',
        backupField: 'dueAt',
      }),
    [allActions, filterActionsByTeam, period, selectedTeams, viewAllOrganisationData]
  );

  const actionsFilteredByStatus = useMemo(
    () => actions.filter((a) => !actionsStatuses.length || actionsStatuses.includes(a.status)),
    [actions, actionsStatuses]
  );
  const [actionsCategoriesGroups, setActionsCategoriesGroups] = useLocalStorage('stats-catGroups', []);
  const [actionsCategories, setActionsCategories] = useLocalStorage('stats-categories', []);

  const filterableActionsCategories = useMemo(() => {
    if (!actionsCategoriesGroups.length) return allCategories;
    return groupsCategories
      .filter((group) => actionsCategoriesGroups.includes(group.groupTitle))
      .reduce((filteredCats, group) => [...filteredCats, ...group.categories], []);
  }, [actionsCategoriesGroups, allCategories, groupsCategories]);

  const actionsWithDetailedGroupAndCategories = useMemo(
    () =>
      actionsFilteredByStatus
        .reduce((actionsDetailed, action) => {
          if (!!action.categories?.length) {
            for (const category of action.categories) {
              actionsDetailed.push({
                ...action,
                category,
                group: groupsCategories.find((g) => g.categories.includes(category))?.groupTitle ?? 'Autres',
              });
            }
          } else {
            actionsDetailed.push(action);
          }
          return actionsDetailed;
        }, [])
        .filter((a) => !actionsCategoriesGroups.length || actionsCategoriesGroups.includes(a.group))
        .filter((a) => !actionsCategories.length || actionsCategories.includes(a.category)),
    [actionsFilteredByStatus, groupsCategories, actionsCategoriesGroups, actionsCategories]
  );

  const numberOfActionsPerPerson = useMemo(() => {
    if (!personsUpdatedForStats.length) return 0;
    if (!actions.length) return 0;
    return Math.round((actions.length / personsUpdatedForStats.length) * 10) / 10;
  }, [actions.length, personsUpdatedForStats.length]);

  const numberOfActionsPerPersonConcernedByActions = useMemo(() => {
    if (!personsWithActions.length) return 0;
    if (!actions.length) return 0;
    return Math.round((actions.length / personsWithActions.length) * 10) / 10;
  }, [actions.length, personsWithActions.length]);

  const consultations = useMemo(() => getDataForPeriod(allConsultations, period, selectedTeams, true), [allConsultations, period, selectedTeams]);
  const observations = useMemo(
    () =>
      getDataForPeriod(
        filterByTeam(allObservations, 'team').filter((e) => !selectedTerritories.length || selectedTerritories.some((t) => e.territory === t._id)),
        period,
        selectedTeams,
        viewAllOrganisationData,
        { field: 'observedAt' }
      ),
    [allObservations, filterByTeam, period, selectedTeams, viewAllOrganisationData, selectedTerritories]
  );
  const passages = useMemo(
    () =>
      getDataForPeriod(
        filterByTeam(allPassages, 'team')
          .map((p) => ({ ...p, type: !!p.person ? 'Non-anonyme' : 'Anonyme' }))
          .map((passage) => ({
            ...passage,
            gender: !passage.person ? null : allPersons.find((person) => person._id === passage.person)?.gender || 'Non renseigné',
          })),
        period,
        selectedTeams,
        viewAllOrganisationData,
        { field: 'date' }
      ),
    [allPassages, filterByTeam, period, selectedTeams, viewAllOrganisationData, allPersons]
  );
  const personsInPassagesBeforePeriod = useMemo(() => {
    if (!period?.startDate) return [];
    const passagesIds = passages.map((p) => p._id);
    const passagesNotIncludedInPeriod = allPassages
      .filter((p) => !passagesIds.includes(p._id))
      .filter((p) => dayjsInstance(p.date).isBefore(period.startDate));
    return passagesNotIncludedInPeriod
      .reduce((personsIds, passage) => {
        if (!passage.person) return personsIds;
        if (personsIds.includes(passage.person)) return personsIds;
        return [...personsIds, passage.person];
      }, [])
      .map((personId) => allPersons.find((p) => p._id === personId) || { _id: personId, gender: 'Non précisé' });
  }, [allPassages, passages, period.startDate, allPersons]);
  const personsInPassagesOfPeriod = useMemo(
    () =>
      passages
        .reduce((personsIds, passage) => {
          if (!passage.person) return personsIds;
          if (personsIds.includes(passage.person)) return personsIds;
          return [...personsIds, passage.person];
        }, [])
        .map((personId) => allPersons.find((p) => p._id === personId) || { _id: personId, gender: 'Non précisé' }),
    [passages, allPersons]
  );

  const rencontres = useMemo(
    () =>
      getDataForPeriod(
        filterByTeam(allRencontres, 'team')
          .map((p) => ({ ...p, type: 'Rencontres' }))
          .map((rencontre) => ({
            ...rencontre,
            gender: !rencontre.person ? null : allPersons.find((person) => person._id === rencontre.person)?.gender || 'Non renseigné',
          })),
        period,
        selectedTeams,
        viewAllOrganisationData,
        { field: 'date' }
      ),
    [allRencontres, filterByTeam, period, selectedTeams, viewAllOrganisationData, allPersons]
  );

  const personsInRencontresBeforePeriod = useMemo(() => {
    if (!period?.startDate) return [];
    const rencontresIds = rencontres.map((p) => p._id);
    const rencontresNotIncludedInPeriod = allRencontres
      .filter((p) => !rencontresIds.includes(p._id))
      .filter((p) => dayjsInstance(p.date).isBefore(period.startDate));
    return rencontresNotIncludedInPeriod
      .reduce((personsIds, rencontre) => {
        if (!rencontre.person) return personsIds;
        if (personsIds.includes(rencontre.person)) return personsIds;
        return [...personsIds, rencontre.person];
      }, [])
      .map((personId) => allPersons.find((p) => p._id === personId) || { _id: personId, gender: 'Non précisé' });
  }, [allRencontres, rencontres, period.startDate, allPersons]);
  const personsInRencontresOfPeriod = useMemo(
    () =>
      rencontres
        .reduce((personsIds, rencontre) => {
          if (!rencontre.person) return personsIds;
          if (personsIds.includes(rencontre.person)) return personsIds;
          return [...personsIds, rencontre.person];
        }, [])
        .map((personId) => allPersons.find((p) => p._id === personId) || { _id: personId, gender: 'Non précisé' }),
    [rencontres, allPersons]
  );

  const reports = useMemo(
    () => getDataForPeriod(filterByTeam(allreports, 'team'), period, selectedTeams, viewAllOrganisationData, { field: 'date' }),
    [allreports, filterByTeam, period, selectedTeams, viewAllOrganisationData]
  );

  const reportsServices = useMemo(() => reports.map((rep) => (rep.services ? JSON.parse(rep.services) : null)).filter(Boolean), [reports]);

  const filterPersonsBase = useRecoilValue(filterPersonsBaseSelector);
  // Add enabled custom fields in filters.
  const filterPersonsWithAllFields = (withMedicalWiles = false) => [
    ...(withMedicalWiles ? customFieldsMedicalFile : [])
      .filter((a) => a.enabled || a.enabledTeams?.includes(currentTeam._id))
      .map((a) => ({ field: a.name, ...a })),
    ...filterPersonsBase.map((f) =>
      f.field !== 'outOfActiveList'
        ? f
        : {
            ...f,
            options: ['Oui', 'Non', "Oui et non (c'est-à-dire tout le monde)"],
            type: 'multi-choice',
          }
    ),
    ...customFieldsPersonsSocial.filter((a) => a.enabled || a.enabledTeams?.includes(currentTeam._id)).map((a) => ({ field: a.name, ...a })),
    ...customFieldsPersonsMedical.filter((a) => a.enabled || a.enabledTeams?.includes(currentTeam._id)).map((a) => ({ field: a.name, ...a })),
  ];

  if (isLoading) return <Loading />;

  return (
    <>
      <HeaderStyled style={{ padding: '16px 0' }}>
        <div style={{ display: 'flex', flexGrow: '1' }}>
          <HeaderTitle style={{ fontWeight: '400', width: '260px' }}>
            <span>Statistiques {viewAllOrganisationData ? <>globales</> : <>{selectedTeams.length > 1 ? 'des équipes' : "de l'équipe"}</>}</span>
          </HeaderTitle>
          <div className="tw-ml-4">
            <SelectTeamMultiple
              onChange={(teamsId) => {
                setSelectedTeams(teams.filter((t) => teamsId.includes(t._id)));
              }}
              value={selectedTeams.map((e) => e?._id)}
              colored
              isDisabled={viewAllOrganisationData}
            />
            {teams.length > 1 && (
              <label htmlFor="viewAllOrganisationData" className="tw-flex tw-items-center tw-text-sm">
                <input
                  id="viewAllOrganisationData"
                  type="checkbox"
                  className="tw-mr-2.5"
                  checked={viewAllOrganisationData}
                  value={viewAllOrganisationData}
                  onChange={() => setViewAllOrganisationData(!viewAllOrganisationData)}
                />
                Statistiques de toute l'organisation
              </label>
            )}
          </div>
        </div>
      </HeaderStyled>
      <Row className="date-picker-container" style={{ marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <Col md={4} style={{ flexShrink: 0, minWidth: '15rem', padding: 0 }}>
          <DateRangePickerWithPresets period={period} setPeriod={setPeriod} />
        </Col>
        <Col md={8} style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <RefreshButton />
          <ExportFormattedData
            personCreated={personsForStats}
            personUpdated={personsUpdatedForStats}
            actions={actionsWithDetailedGroupAndCategories}
          />
        </Col>
      </Row>
      <Nav tabs style={{ marginBottom: 20 }}>
        {tabs
          .filter((e) => user.healthcareProfessional || !['Consultations', 'Dossiers médicaux'].includes(e))
          .map((tabCaption, index) => {
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
          <GeneralStats
            personsForStats={personsForStats}
            personsUpdatedForStats={personsUpdatedForStats}
            rencontres={rencontres}
            actions={actions}
            numberOfActionsPerPerson={numberOfActionsPerPerson}
            numberOfActionsPerPersonConcernedByActions={numberOfActionsPerPersonConcernedByActions}
          />
        </TabPane>
        {!!organisation.receptionEnabled && (
          <TabPane tabId={1}>
            <ReceptionStats reportsServices={reportsServices} passages={passages} />
          </TabPane>
        )}
        <TabPane tabId={2}>
          <ActionsStats
            setActionsStatuses={setActionsStatuses}
            actionsStatuses={actionsStatuses}
            setActionsCategories={setActionsCategories}
            actionsCategories={actionsCategories}
            setActionsCategoriesGroups={setActionsCategoriesGroups}
            actionsCategoriesGroups={actionsCategoriesGroups}
            groupsCategories={groupsCategories}
            filterableActionsCategories={filterableActionsCategories}
            actionsWithDetailedGroupAndCategories={actionsWithDetailedGroupAndCategories}
            allCategories={allCategories}
          />
        </TabPane>
        <TabPane tabId={3}>
          <PersonStats
            filterBase={filterPersonsWithAllFields()}
            filterPersons={filterPersons}
            setFilterPersons={setFilterPersons}
            personsForStats={personsForStats}
            personsUpdatedForStats={personsUpdatedForStats}
            groupsForPersons={groupsForPersons}
            personFields={personFields}
            persons={persons}
            fieldsPersonsCustomizableOptions={fieldsPersonsCustomizableOptions}
            customFieldsPersonsMedical={customFieldsPersonsMedical}
            customFieldsPersonsSocial={customFieldsPersonsSocial}
          />
        </TabPane>
        <TabPane tabId={4}>
          <PassagesStats
            passages={passages}
            personFields={personFields}
            personsInPassagesOfPeriod={personsInPassagesOfPeriod}
            personsInPassagesBeforePeriod={personsInPassagesBeforePeriod}
          />
        </TabPane>
        <TabPane tabId={5}>
          <RencontresStats
            rencontres={rencontres}
            personFields={personFields}
            personsInRencontresOfPeriod={personsInRencontresOfPeriod}
            personsInRencontresBeforePeriod={personsInRencontresBeforePeriod}
          />
        </TabPane>
        <TabPane tabId={6}>
          <ObservationsStats
            territories={territories}
            setSelectedTerritories={setSelectedTerritories}
            observations={observations}
            customFieldsObs={customFieldsObs}
          />
        </TabPane>
        <TabPane tabId={7}>
          <ReportsStats reports={reports} />
        </TabPane>
        {user.healthcareProfessional && (
          <>
            <TabPane tabId={8}>
              <ConsultationsStats consultations={consultations} />
            </TabPane>
            <TabPane tabId={9}>
              <MedicalFilesStats
                filterBase={filterPersonsWithAllFields(true)}
                filterPersons={filterPersons}
                setFilterPersons={setFilterPersons}
                personsForStats={personsForStats}
                customFieldsMedicalFile={customFieldsMedicalFile}
                personFields={personFields}
              />
            </TabPane>
          </>
        )}
      </TabContent>
    </>
  );
};

export default Stats;
