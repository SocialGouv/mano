import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { selectorFamily, useRecoilValue } from 'recoil';
import { useLocalStorage } from '../../services/useLocalStorage';
import {
  fieldsPersonsCustomizableOptionsSelector,
  filterPersonsBaseSelector,
  personFieldsSelector,
  flattenedCustomFieldsPersonsSelector,
} from '../../recoil/persons';
import { customFieldsObsSelector, territoryObservationsState } from '../../recoil/territoryObservations';
import { currentTeamState, organisationState, teamsState } from '../../recoil/auth';
import { actionsCategoriesSelector, DONE, flattenedActionsCategoriesSelector } from '../../recoil/actions';
import { reportsState } from '../../recoil/reports';
import { territoriesState } from '../../recoil/territory';
import { customFieldsMedicalFileSelector } from '../../recoil/medicalFiles';
import { personsForStatsSelector, populatedPassagesSelector } from '../../recoil/selectors';
import useTitle from '../../services/useTitle';
import DateRangePickerWithPresets, { formatPeriod } from '../../components/DateRangePickerWithPresets';
import { useDataLoader } from '../../components/DataLoader';
import { HeaderStyled, Title as HeaderTitle } from '../../components/header';
import Loading from '../../components/loading';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import ExportFormattedData from '../data-import-export/ExportFormattedData';
import { getDataForPeriod } from './utils';
import GeneralStats from './General';
import ServicesStats from './Services';
import ActionsStats from './Actions';
import PersonStats from './Persons';
import PassagesStats from './Passages';
import RencontresStats from './Rencontres';
import ObservationsStats from './Observations';
import ReportsStats from './Reports';
import ConsultationsStats from './Consultations';
import MedicalFilesStats from './MedicalFiles';
import ButtonCustom from '../../components/ButtonCustom';
import dayjs from 'dayjs';
import { filterItem } from '../../components/Filters';
import TabsNav from '../../components/tailwind/TabsNav';

const tabs = [
  'Général',
  'Services',
  'Actions',
  'Personnes créées',
  'Personnes suivies',
  'Passages',
  'Rencontres',
  'Observations',
  'Comptes-rendus',
  'Consultations',
  'Dossiers médicaux des personnes créées',
  'Dossiers médicaux des personnes suivies',
];

/*

without StatsLoader:
- click on 'Statistiques'
- lag between the click and the loader (a few seconds sometimes)
- loader showing (laoder for getting the last data)
- calculation ongoing
- loader ending
- calculation again (compensated by useMemo, but still)
- render

with StatsLoader:
- click on 'Statistiques'
- loader showing (laoder for getting the last data) with no lag
- loader ending
- calculation ongoing
- render

*/
const StatsLoader = () => {
  const { isLoading } = useDataLoader({ refreshOnMount: true });
  const hasStartLoaded = useRef(false);

  useEffect(() => {
    if (!isLoading) hasStartLoaded.current = true;
  }, [isLoading]);

  if (isLoading || !hasStartLoaded.current) return <Loading />;
  return <Stats />;
};

const itemsForStatsSelector = selectorFamily({
  key: 'itemsForStatsSelector',
  get:
    ({ period, filterPersons, selectedTeamsIdsObject, viewAllOrganisationData, allSelectedTeamsAreNightSession }) =>
    ({ get }) => {
      const activeFilters = filterPersons.filter((f) => f.value);
      const filterItemByTeam = (item, key) => {
        if (viewAllOrganisationData) return true;
        if (Array.isArray(item[key])) {
          for (const team of item[key]) {
            if (selectedTeamsIdsObject[team]) return true;
          }
        }
        return !!selectedTeamsIdsObject[item[key]];
      };
      const filtersExceptOutOfActiveList = activeFilters.filter((f) => f.field !== 'outOfActiveList');
      const outOfActiveListFilter = activeFilters.find((f) => f.field === 'outOfActiveList')?.value;

      const allPersons = get(personsForStatsSelector);

      const offsetHours = allSelectedTeamsAreNightSession ? 12 : 0;
      const isoStartDate = period.startDate ? dayjs(period.startDate).startOf('day').add(offsetHours, 'hour').toISOString() : null;
      const isoEndDate = period.endDate ? dayjs(period.endDate).startOf('day').add(1, 'day').add(offsetHours, 'hour').toISOString() : null;

      const personsCreated = [];
      const personsUpdated = [];
      const personsWithActions = {};
      const actionsFilteredByPersons = {};
      const consultationsFilteredByPersons = [];
      const personsWithConsultations = {};
      const passagesFilteredByPersons = [];
      const personsWithPassages = {};
      const personsInPassagesBeforePeriod = {};
      const rencontresFilteredByPersons = [];
      const personsWithRencontres = {};
      const personsInRencontresBeforePeriod = {};
      const noPeriodSelected = !isoStartDate || !isoEndDate;
      for (let person of allPersons) {
        // get the persons concerned by filters
        if (!filterItem(filtersExceptOutOfActiveList)(person)) continue;
        if (outOfActiveListFilter === 'Oui' && !person.outOfActiveList) continue;
        if (outOfActiveListFilter === 'Non' && !!person.outOfActiveList) continue;
        // get persons for stats for period
        const createdDate = person.followedSince || person.createdAt;

        if (filterItemByTeam(person, 'assignedTeams')) {
          if (noPeriodSelected) {
            personsUpdated[person._id] = person;
            personsCreated[person._id] = person;
          } else {
            if (createdDate >= isoStartDate && createdDate < isoEndDate) {
              personsCreated[person._id] = person;
              personsUpdated[person._id] = person;
            }
            for (const date of person.interactions) {
              if (date < isoStartDate) continue;
              if (date >= isoEndDate) continue;
              personsUpdated[person._id] = person;
              break;
            }
          }
        }
        // get actions for stats for period
        for (const action of person.actions || []) {
          if (!filterItemByTeam(action, 'teams')) continue;
          if (noPeriodSelected) {
            actionsFilteredByPersons[action._id] = action;
            personsWithActions[person._id] = person;
            continue;
          }
          const date = action.completedAt || action.dueAt;
          if (date < isoStartDate) continue;
          if (date >= isoEndDate) continue;
          actionsFilteredByPersons[action._id] = action;
          personsWithActions[person._id] = person;
        }
        for (const consultation of person.consultations || []) {
          if (!filterItemByTeam(consultation, 'teams')) continue;
          if (noPeriodSelected) {
            consultationsFilteredByPersons.push(consultation);
            personsWithConsultations[person._id] = person;
            continue;
          }
          const date = consultation.completedAt || consultation.dueAt;
          if (date < isoStartDate) continue;
          if (date >= isoEndDate) continue;
          consultationsFilteredByPersons.push(consultation);
          personsWithConsultations[person._id] = person;
        }
        if (!!person.passages?.length) {
          for (const passage of person.passages) {
            if (!filterItemByTeam(passage, 'team')) continue;
            if (noPeriodSelected) {
              passagesFilteredByPersons.push(passage);
              personsWithPassages[person._id] = person;
              continue;
            }
            const date = passage.date;
            if (date < isoStartDate) continue;
            if (date >= isoEndDate) continue;
            passagesFilteredByPersons.push(passage);
            personsWithPassages[person._id] = person;
            if (createdDate < isoStartDate) {
              personsInPassagesBeforePeriod[person._id] = person;
            }
          }
        }
        if (!!person.rencontres?.length) {
          for (const rencontre of person.rencontres) {
            if (!filterItemByTeam(rencontre, 'team')) continue;
            if (noPeriodSelected) {
              rencontresFilteredByPersons.push(rencontre);
              personsWithRencontres[person._id] = person;
              continue;
            }
            const date = rencontre.date;
            if (date < isoStartDate) continue;
            if (date >= isoEndDate) continue;
            rencontresFilteredByPersons.push(rencontre);
            personsWithRencontres[person._id] = person;
            if (createdDate < isoStartDate) personsInRencontresBeforePeriod[person._id] = person;
          }
        }
      }

      return {
        personsCreated: Object.values(personsCreated),
        personsUpdated: Object.values(personsUpdated),
        personsWithActions: Object.keys(personsWithActions).length,
        actionsFilteredByPersons: Object.values(actionsFilteredByPersons),
        personsWithConsultations: Object.keys(personsWithConsultations).length,
        consultationsFilteredByPersons,
        personsWithPassages: Object.values(personsWithPassages),
        personsInPassagesBeforePeriod,
        passagesFilteredByPersons,
        personsWithRencontres: Object.values(personsWithRencontres),
        personsInRencontresBeforePeriod,
        rencontresFilteredByPersons,
      };
    },
});

const filterMakingThingsClearAboutOutOfActiveListStatus = {
  field: 'outOfActiveList',
  value: "Oui et non (c'est-à-dire tout le monde)",
  type: 'multi-choice',
};

const initFilters = [filterMakingThingsClearAboutOutOfActiveListStatus];

const Stats = () => {
  const organisation = useRecoilValue(organisationState);
  const currentTeam = useRecoilValue(currentTeamState);
  const teams = useRecoilValue(teamsState);

  const allreports = useRecoilValue(reportsState);
  const allObservations = useRecoilValue(territoryObservationsState);
  const allPassagesPopulated = useRecoilValue(populatedPassagesSelector);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);
  const fieldsPersonsCustomizableOptions = useRecoilValue(fieldsPersonsCustomizableOptionsSelector);
  const flattenedCustomFieldsPersons = useRecoilValue(flattenedCustomFieldsPersonsSelector);
  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);
  const personFields = useRecoilValue(personFieldsSelector);
  const territories = useRecoilValue(territoriesState);
  const allCategories = useRecoilValue(flattenedActionsCategoriesSelector);
  const groupsCategories = useRecoilValue(actionsCategoriesSelector);

  const [selectedTerritories, setSelectedTerritories] = useLocalStorage('stats-territories', []);
  const [activeTab, setActiveTab] = useLocalStorage('stats-tabCaption', 'Général');
  const [filterPersons, setFilterPersons] = useLocalStorage('stats-filterPersons-defaultEverybody', initFilters);
  const [viewAllOrganisationData, setViewAllOrganisationData] = useLocalStorage('stats-viewAllOrganisationData', teams.length === 1);
  const [period, setPeriod] = useLocalStorage('period', { startDate: null, endDate: null });
  const [preset, setPreset, removePreset] = useLocalStorage('stats-date-preset', null);
  const [manuallySelectedTeams, setSelectedTeams] = useLocalStorage('stats-teams', [currentTeam]);
  const [actionsStatuses, setActionsStatuses] = useLocalStorage('stats-actionsStatuses', DONE);
  const [actionsCategoriesGroups, setActionsCategoriesGroups] = useLocalStorage('stats-catGroups', []);
  const [actionsCategories, setActionsCategories] = useLocalStorage('stats-categories', []);

  useTitle(`${activeTab} - Statistiques`);

  /*
   *
    FILTERS BY TEAM TOOLS
    Options are: we clicked on 'view all organisation data' or we selected manually some teams
    Base on those options we get
    - selectedTeams: the teams we want to display
    - selectedTeamsIdsObject: an object with the ids of the selected teams as keys, to loop faster - O(1) instead of O(n)
    - allSelectedTeamsAreNightSession: a boolean to know if all the selected teams are night sessions
    - filterArrayByTeam: a function to filter an array of elements by team
   *
  */

  const selectedTeams = useMemo(() => {
    if (viewAllOrganisationData) return teams;
    return manuallySelectedTeams;
  }, [manuallySelectedTeams, viewAllOrganisationData, teams]);
  const selectedTeamsIdsObject = useMemo(() => {
    const teamsIdsObject = {};
    for (const team of selectedTeams) {
      teamsIdsObject[team._id] = true;
    }
    return teamsIdsObject;
  }, [selectedTeams]);
  const allSelectedTeamsAreNightSession = useMemo(() => {
    for (const team of selectedTeams) {
      if (!team.nightSession) return false;
    }
    return true;
  }, [selectedTeams]);

  const filterArrayByTeam = useCallback(
    (elements, key) => {
      if (viewAllOrganisationData) return elements;
      const filteredElements = elements.filter((e) => {
        if (Array.isArray(e[key])) {
          for (const team of e[key]) {
            if (selectedTeamsIdsObject[team]) return true;
          }
        }
        return !!selectedTeamsIdsObject[e[key]];
      });
      return filteredElements;
    },
    [selectedTeamsIdsObject, viewAllOrganisationData]
  );

  /*
   *
    FILTERS THE PERSONS
    We have two stats pages for persons: stats on the creation date and stats on last interation date
    We do the filtering step by step
    1. We filter the persons by the teams
    2. We filter the persons by the filters EXCEPT the 'outOfActiveList' filter
    3. We filter the persons by the 'outOfActiveList' filter
   *
  */

  // const persons = useMemo(
  //   () =>
  //     getDataForPeriod(filterArrayByTeam(allPersons, 'assignedTeams'), period, {
  //       filters: filterPersons.filter((f) => f.field !== 'outOfActiveList'),
  //       field: 'followedSince',
  //       allSelectedTeamsAreNightSession,
  //     }),
  //   [allPersons, filterArrayByTeam, filterPersons, period, allSelectedTeamsAreNightSession]
  // );

  /*
   *
    FILTERS THE ACTIONS/PASSAGES/RENCONTRES/CONSULTATIONS BY PERSONS AND BY TEAM
    The big memo below is used for
    - getting the actions filtered by team and by persons - and the number of persons with actions
    - getting the consultations filtered by team and by persons - and the number of persons with consultations
    - getting the passages filtered by team and by persons - and the number of persons with passages
    - getting the rencontres filtered by team and by persons - and the number of persons with rencontres
   *
  */

  const {
    personsCreated,
    personsUpdated,
    personsWithActions,
    actionsFilteredByPersons,
    personsWithConsultations,
    consultationsFilteredByPersons,
    personsWithPassages,
    personsInPassagesBeforePeriod,
    passagesFilteredByPersons,
    personsWithRencontres,
    personsInRencontresBeforePeriod,
    rencontresFilteredByPersons,
  } = useRecoilValue(
    itemsForStatsSelector({
      period,
      filterPersons,
      selectedTeamsIdsObject,
      viewAllOrganisationData,
      allSelectedTeamsAreNightSession,
    })
  );

  const filterableActionsCategories = useMemo(() => {
    if (!actionsCategoriesGroups.length) return ['-- Aucune --', ...allCategories];
    return groupsCategories
      .filter((group) => actionsCategoriesGroups.includes(group.groupTitle))
      .reduce((filteredCats, group) => [...filteredCats, ...group.categories], []);
  }, [actionsCategoriesGroups, allCategories, groupsCategories]);

  const actionsWithDetailedGroupAndCategories = useMemo(() => {
    const actionsDetailed = [];
    const categoriesGroupObject = {};
    for (const groupCategory of groupsCategories) {
      for (const category of groupCategory.categories) {
        categoriesGroupObject[category] = groupCategory.groupTitle;
      }
    }
    for (const action of actionsFilteredByPersons) {
      if (!!actionsStatuses.length && !actionsStatuses.includes(action.status)) {
        continue;
      }
      if (!!action.categories?.length) {
        for (const category of action.categories) {
          actionsDetailed.push({
            ...action,
            category,
            categoryGroup: categoriesGroupObject[category] ?? 'Autres',
          });
        }
      } else {
        actionsDetailed.push(action);
      }
    }
    const _actionsWithDetailedGroupAndCategories = actionsDetailed
      .filter((a) => !actionsCategoriesGroups.length || actionsCategoriesGroups.includes(a.categoryGroup))
      .filter((a) => {
        if (!actionsCategories.length) return true;
        if (actionsCategories.length === 1 && actionsCategories[0] === '-- Aucune --') return !a.categories?.length;
        return actionsCategories.includes(a.category);
      });
    return _actionsWithDetailedGroupAndCategories;
  }, [actionsFilteredByPersons, groupsCategories, actionsCategoriesGroups, actionsCategories, actionsStatuses]);

  const passages = useMemo(() => {
    const activeFilters = filterPersons.filter((f) => f.value);
    if (!!activeFilters.length) {
      if (activeFilters.length > 1) return passagesFilteredByPersons;
      const filter = activeFilters[0];
      if (filter.type !== filterMakingThingsClearAboutOutOfActiveListStatus.type) return passagesFilteredByPersons;
      if (filter.value !== filterMakingThingsClearAboutOutOfActiveListStatus.value) return passagesFilteredByPersons;
    }
    const teamsPassages = filterArrayByTeam(allPassagesPopulated, 'team');
    return getDataForPeriod(teamsPassages, period, { field: 'date', allSelectedTeamsAreNightSession });
  }, [allPassagesPopulated, filterArrayByTeam, period, allSelectedTeamsAreNightSession, passagesFilteredByPersons, filterPersons]);

  const observations = useMemo(
    () =>
      getDataForPeriod(
        filterArrayByTeam(allObservations, 'team').filter(
          (e) => !selectedTerritories.length || selectedTerritories.some((t) => e.territory === t._id)
        ),
        period,
        { field: 'observedAt', allSelectedTeamsAreNightSession }
      ),
    [allObservations, filterArrayByTeam, period, selectedTerritories, allSelectedTeamsAreNightSession]
  );

  const reports = useMemo(
    () =>
      getDataForPeriod(filterArrayByTeam(allreports, 'team'), period, {
        field: 'date',
        allSelectedTeamsAreNightSession,
      }),
    [allreports, filterArrayByTeam, period, allSelectedTeamsAreNightSession]
  );
  const filterPersonsBase = useRecoilValue(filterPersonsBaseSelector);
  // Add enabled custom fields in filters.
  const filterPersonsWithAllFields = (withMedicalFiles = false) => [
    ...(withMedicalFiles ? customFieldsMedicalFile : [])
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
    ...fieldsPersonsCustomizableOptions.filter((a) => a.enabled || a.enabledTeams?.includes(currentTeam._id)).map((a) => ({ field: a.name, ...a })),
    ...flattenedCustomFieldsPersons.filter((a) => a.enabled || a.enabledTeams?.includes(currentTeam._id)).map((a) => ({ field: a.name, ...a })),
  ];

  const availableTabs = tabs.filter((tabCaption) => {
    if (['Observations'].includes(tabCaption)) {
      return !!organisation.territoriesEnabled;
    }
    if (['Services'].includes(tabCaption)) {
      return !!organisation.receptionEnabled;
    }
    if (['Rencontres'].includes(tabCaption)) {
      return !!organisation.rencontresEnabled;
    }
    if (['Passages'].includes(tabCaption)) {
      return !!organisation.passagesEnabled;
    }
    return true;
  });

  return (
    <>
      <HeaderStyled className=" !tw-py-4 tw-px-0">
        <div className="printonly tw-py-4 tw-px-8 tw-text-2xl tw-font-bold" aria-hidden>
          Statistiques{' '}
          {viewAllOrganisationData ? (
            <>globales</>
          ) : (
            <>
              {selectedTeams.length > 1 ? 'des équipes' : "de l'équipe"} {selectedTeams.map((t) => t.name).join(', ')}
            </>
          )}{' '}
          - {formatPeriod({ period, preset })}
        </div>
        <div className="noprint tw-flex tw-grow">
          <HeaderTitle className="tw-w-64 tw-font-normal">
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
      <div className="noprint date-picker-container tw-mb-5 tw-flex tw-flex-wrap tw-items-center">
        <div className="tw-min-w-[15rem] tw-shrink-0 tw-basis-1/3 tw-p-0">
          <DateRangePickerWithPresets period={period} setPeriod={setPeriod} preset={preset} setPreset={setPreset} removePreset={removePreset} />
        </div>
        <div className="tw-flex tw-basis-2/3 tw-items-center tw-justify-end">
          <ButtonCustom color="link" title="Imprimer" onClick={window.print} />
          <ExportFormattedData personCreated={personsCreated} personUpdated={personsUpdated} actions={actionsWithDetailedGroupAndCategories} />
        </div>
      </div>
      <TabsNav
        className="tw-flex-wrap tw-justify-center tw-px-3 tw-py-2"
        tabs={availableTabs}
        onClick={(tabCaption) => setActiveTab(tabCaption)}
        activeTabIndex={availableTabs.findIndex((tab) => tab === activeTab)}
      />
      <div className="print:tw-flex print:tw-flex-col print:tw-px-8 print:tw-py-4">
        {activeTab === 'Général' && (
          <GeneralStats
            personsCreated={personsCreated}
            personsUpdated={personsUpdated}
            rencontres={rencontresFilteredByPersons}
            actions={actionsWithDetailedGroupAndCategories}
            // numberOfActionsPerPersonConcernedByActions={numberOfActionsPerPersonConcernedByActions}
            personsWithActions={personsWithActions}
            // filter by persons
            filterBase={filterPersonsWithAllFields()}
            filterPersons={filterPersons}
            setFilterPersons={setFilterPersons}
          />
        )}
        {!!organisation.receptionEnabled && activeTab === 'Services' && <ServicesStats period={period} teamIds={selectedTeams.map((e) => e?._id)} />}
        {activeTab === 'Actions' && (
          <ActionsStats
            // data
            actionsWithDetailedGroupAndCategories={actionsWithDetailedGroupAndCategories}
            // filter by status
            setActionsStatuses={setActionsStatuses}
            actionsStatuses={actionsStatuses}
            // filter by group
            setActionsCategoriesGroups={setActionsCategoriesGroups}
            actionsCategoriesGroups={actionsCategoriesGroups}
            groupsCategories={groupsCategories}
            // filter by category
            setActionsCategories={setActionsCategories}
            actionsCategories={actionsCategories}
            filterableActionsCategories={filterableActionsCategories}
            // filter by persons
            personsWithActions={personsWithActions}
            filterBase={filterPersonsWithAllFields()}
            filterPersons={filterPersons}
            setFilterPersons={setFilterPersons}
          />
        )}
        {activeTab === 'Personnes créées' && (
          <PersonStats
            title="personnes créées"
            firstBlockHelp={`Nombre de personnes dont la date 'Suivi(e) depuis le / Créé(e) le' se situe dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
            filterBase={filterPersonsWithAllFields()}
            filterPersons={filterPersons}
            setFilterPersons={setFilterPersons}
            personsForStats={personsCreated}
            personFields={personFields}
            flattenedCustomFieldsPersons={flattenedCustomFieldsPersons}
          />
        )}
        {activeTab === 'Personnes suivies' && (
          <PersonStats
            title="personnes suivies"
            firstBlockHelp={`Nombre de personnes pour lesquelles il s'est passé quelque chose durant la période sélectionnée:\n\ncréation, modification, commentaire, action, rencontre, passage, lieu fréquenté, consultation, traitement.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
            personsForStats={personsUpdated}
            personFields={personFields}
            flattenedCustomFieldsPersons={flattenedCustomFieldsPersons}
            // filter by persons
            filterBase={filterPersonsWithAllFields()}
            filterPersons={filterPersons}
            setFilterPersons={setFilterPersons}
          />
        )}
        {!!organisation.passagesEnabled && activeTab === 'Passages' && (
          <PassagesStats
            passages={passages}
            personFields={personFields}
            personsInPassagesBeforePeriod={personsInPassagesBeforePeriod}
            // filter by persons
            personsWithPassages={personsWithPassages}
            filterBase={filterPersonsWithAllFields()}
            filterPersons={filterPersons}
            setFilterPersons={setFilterPersons}
          />
        )}
        {!!organisation.rencontresEnabled && activeTab === 'Rencontres' && (
          <RencontresStats
            rencontres={rencontresFilteredByPersons}
            personFields={personFields}
            personsInRencontresBeforePeriod={personsInRencontresBeforePeriod}
            // filter by persons
            personsWithRencontres={personsWithRencontres}
            filterBase={filterPersonsWithAllFields()}
            filterPersons={filterPersons}
            setFilterPersons={setFilterPersons}
          />
        )}
        {activeTab === 'Observations' && (
          <ObservationsStats
            territories={territories}
            setSelectedTerritories={setSelectedTerritories}
            observations={observations}
            customFieldsObs={customFieldsObs}
          />
        )}
        {activeTab === 'Comptes-rendus' && <ReportsStats reports={reports} />}
        {activeTab === 'Consultations' && (
          <ConsultationsStats
            consultations={consultationsFilteredByPersons} // filter by persons
            // filter by persons
            personsWithConsultations={personsWithConsultations}
            filterBase={filterPersonsWithAllFields()}
            filterPersons={filterPersons}
            setFilterPersons={setFilterPersons}
          />
        )}
        {activeTab === 'Dossiers médicaux des personnes créées' && (
          <MedicalFilesStats
            filterBase={filterPersonsWithAllFields(true)}
            title="personnes créées"
            filterPersons={filterPersons}
            setFilterPersons={setFilterPersons}
            personsForStats={personsCreated}
            customFieldsMedicalFile={customFieldsMedicalFile}
            personFields={personFields}
          />
        )}
        {activeTab === 'Dossiers médicaux des personnes suivies' && (
          <MedicalFilesStats
            title="personnes suivies"
            personsForStats={personsUpdated}
            customFieldsMedicalFile={customFieldsMedicalFile}
            personFields={personFields}
            // filter by persons
            filterBase={filterPersonsWithAllFields(true)}
            filterPersons={filterPersons}
            setFilterPersons={setFilterPersons}
          />
        )}
      </div>
      {/* HACK: this last div is because Chrome crop the end of the page - I didn't find any better solution */}
      <div className="printonly tw-h-screen" aria-hidden />
    </>
  );
};

export default StatsLoader;
