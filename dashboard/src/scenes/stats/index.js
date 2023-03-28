import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { useLocalStorage } from '../../services/useLocalStorage';
import {
  fieldsPersonsCustomizableOptionsSelector,
  filterPersonsBaseSelector,
  personFieldsSelector,
  flattenedCustomFieldsPersonsSelector,
} from '../../recoil/persons';
import { customFieldsObsSelector, territoryObservationsState } from '../../recoil/territoryObservations';
import { currentTeamState, organisationState, teamsState, userState } from '../../recoil/auth';
import { actionsCategoriesSelector, actionsState, DONE, flattenedActionsCategoriesSelector } from '../../recoil/actions';
import { reportsState } from '../../recoil/reports';
import { territoriesState } from '../../recoil/territory';
import { consultationsState } from '../../recoil/consultations';
import { customFieldsMedicalFileSelector } from '../../recoil/medicalFiles';
import {
  personsWithMedicalFileMergedSelector,
  itemsGroupedByPersonSelector,
  populatedPassagesSelector,
  populatedRencontresSelector,
} from '../../recoil/selectors';
import { groupsState } from '../../recoil/groups';
import useTitle from '../../services/useTitle';
import DateRangePickerWithPresets, { formatPeriod } from '../../components/DateRangePickerWithPresets';
import { useDataLoader } from '../../components/DataLoader';
import { HeaderStyled, Title as HeaderTitle } from '../../components/header';
import Loading from '../../components/loading';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import ExportFormattedData from '../data-import-export/ExportFormattedData';
import { getDataForPeriod } from './utils';
import GeneralStats from './General';
import ReceptionStats from './Reception';
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

const tabs = [
  'Général',
  'Accueil',
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

const Stats = () => {
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const teams = useRecoilValue(teamsState);

  const allPersons = useRecoilValue(personsWithMedicalFileMergedSelector);
  const allPersonsAsObject = useRecoilValue(itemsGroupedByPersonSelector);
  const allConsultations = useRecoilValue(consultationsState);
  const allActions = useRecoilValue(actionsState);
  const allreports = useRecoilValue(reportsState);
  const allObservations = useRecoilValue(territoryObservationsState);
  const allPassagesPopulated = useRecoilValue(populatedPassagesSelector);
  const allRencontresPopulated = useRecoilValue(populatedRencontresSelector);
  const allGroups = useRecoilValue(groupsState);
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
  const [filterPersons, setFilterPersons] = useLocalStorage('stats-filterPersons-defaultEverybody', [
    { field: 'outOfActiveList', value: "Oui et non (c'est-à-dire tout le monde)", type: 'multi-choice' },
  ]);
  const [viewAllOrganisationData, setViewAllOrganisationData] = useLocalStorage('stats-viewAllOrganisationData', teams.length === 1);
  const [period, setPeriod] = useLocalStorage('period', { startDate: null, endDate: null });
  const [preset, setPreset] = useLocalStorage('stats-date-preset', null);
  const [actionsStatuses, setActionsStatuses] = useLocalStorage('stats-actionsStatuses', DONE);
  const [manuallySelectedTeams, setSelectedTeams] = useLocalStorage('stats-teams', [currentTeam]);
  const [actionsCategoriesGroups, setActionsCategoriesGroups] = useLocalStorage('stats-catGroups', []);
  const [actionsCategories, setActionsCategories] = useLocalStorage('stats-categories', []);
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
  useTitle(`${activeTab} - Statistiques`);
  const filterByTeam = useCallback(
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
  const groupsForPersons = useCallback(
    (persons) => {
      const groupIds = new Set();
      for (const person of persons) {
        if (person.group) {
          groupIds.add(person.group._id);
        }
      }
      return allGroups.filter((group) => groupIds.has(group._id));
    },
    [allGroups]
  );
  const persons = useMemo(
    () =>
      getDataForPeriod(filterByTeam(allPersons, 'assignedTeams'), period, {
        filters: filterPersons.filter((f) => f.field !== 'outOfActiveList'),
        field: 'followedSince',
        allSelectedTeamsAreNightSession,
      }),
    [allPersons, filterByTeam, filterPersons, period, allSelectedTeamsAreNightSession]
  );
  const personsUpdated = useMemo(() => {
    return getDataForPeriod(
      filterByTeam(allPersons, 'assignedTeams'),
      period,
      {
        filters: filterPersons.filter((f) => f.field !== 'outOfActiveList'),
        field: 'followedSince',
        allSelectedTeamsAreNightSession,
      },
      (personsFilteredByFiltersToBeFitleredByPeriod) => {
        const offsetHours = allSelectedTeamsAreNightSession ? 12 : 0;
        const startDate = dayjs(period.startDate).startOf('day').add(offsetHours, 'hour').toISOString();
        const endDate = dayjs(period.endDate).startOf('day').add(1, 'day').add(offsetHours, 'hour').toISOString();

        const res = personsFilteredByFiltersToBeFitleredByPeriod.filter((_person) => {
          if (!_person) return false;
          for (const date of _person.interactions) {
            if (date < startDate) continue;
            if (date > endDate) continue;
            return true;
          }
          return false;
        });
        return res;
      }
    );
  }, [filterByTeam, allPersons, period, filterPersons, allSelectedTeamsAreNightSession]);

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
    const isoStartDate = period.startDate ? dayjs(period.startDate).startOf('day').add(offsetHours, 'hour').toISOString() : null;
    const isoEndDate = period.endDate ? dayjs(period.endDate).startOf('day').add(1, 'day').add(offsetHours, 'hour').toISOString() : null;

    return personsUpdatedForStats.filter((person) => {
      if (!person?.actions?.length) return false;
      if (!isoStartDate || !isoEndDate) return !!person.actions?.length;
      for (const action of person.actions) {
        const date = action.completedAt || action.dueAt;
        if (date < isoStartDate) continue;
        if (date > isoEndDate) continue;
        return true;
      }
      return false;
    });
  }, [period.endDate, period.startDate, personsUpdatedForStats, selectedTeams, viewAllOrganisationData]);
  const actions = useMemo(
    () =>
      getDataForPeriod(filterByTeam(allActions, 'teams'), period, {
        field: 'completedAt',
        backupField: 'dueAt',
        allSelectedTeamsAreNightSession,
      }),
    [allActions, filterByTeam, period, allSelectedTeamsAreNightSession]
  );
  const actionsFilteredByStatus = useMemo(
    () => actions.filter((a) => !actionsStatuses.length || actionsStatuses.includes(a.status)),
    [actions, actionsStatuses]
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
    for (const action of actionsFilteredByStatus) {
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
    return actionsDetailed
      .filter((a) => !actionsCategoriesGroups.length || actionsCategoriesGroups.includes(a.categoryGroup))
      .filter((a) => {
        if (!actionsCategories.length) return true;
        if (actionsCategories.length === 1 && actionsCategories[0] === '-- Aucune --') return !a.categories?.length;
        return actionsCategories.includes(a.category);
      });
  }, [actionsFilteredByStatus, groupsCategories, actionsCategoriesGroups, actionsCategories]);
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
  const consultations = useMemo(
    () =>
      getDataForPeriod(allConsultations, period, {
        field: 'completedAt',
        backupField: 'dueAt',
        allSelectedTeamsAreNightSession,
      }),
    [allConsultations, period, allSelectedTeamsAreNightSession]
  );
  const observations = useMemo(
    () =>
      getDataForPeriod(
        filterByTeam(allObservations, 'team').filter((e) => !selectedTerritories.length || selectedTerritories.some((t) => e.territory === t._id)),
        period,
        { field: 'observedAt', allSelectedTeamsAreNightSession }
      ),
    [allObservations, filterByTeam, period, selectedTerritories, allSelectedTeamsAreNightSession]
  );
  const passages = useMemo(() => {
    const teamsPassages = filterByTeam(allPassagesPopulated, 'team');
    return getDataForPeriod(teamsPassages, period, { field: 'date', allSelectedTeamsAreNightSession });
  }, [allPassagesPopulated, filterByTeam, period, allSelectedTeamsAreNightSession]);
  const personsInPassagesBeforePeriod = useMemo(() => {
    if (!period?.startDate) return [];
    const offsetHours = Boolean(viewAllOrganisationData) || selectedTeams.every((e) => !e.nightSession) ? 0 : 12;
    const isoStartDate = dayjs(period.startDate).startOf('day').add(offsetHours, 'hour').toISOString();
    const passagesIds = {};
    for (const passage of passages) {
      passagesIds[passage._id] = true;
    }
    const passagesNotIncludedInPeriod = allPassagesPopulated.filter((p) => !passagesIds[p._id]).filter((p) => p.date < isoStartDate);
    const personsOfPassages = {};
    for (const passage of passagesNotIncludedInPeriod) {
      if (!passage.person) continue;
      if (!!personsOfPassages[passage.person]) continue;
      personsOfPassages[passage.person] = allPersonsAsObject[passage.person] || { _id: passage.person, gender: 'Non précisé' };
    }
    const arrayOfPersonsOfPassages = Object.values(personsOfPassages);
    return arrayOfPersonsOfPassages;
  }, [period.startDate, viewAllOrganisationData, selectedTeams, allPassagesPopulated, passages, allPersonsAsObject]);
  const personsInPassagesOfPeriod = useMemo(() => {
    const personsOfPassages = {};
    for (const passage of passages) {
      if (!passage.person) continue;
      if (!!personsOfPassages[passage.person]) continue;
      personsOfPassages[passage.person] = allPersonsAsObject[passage.person] || { _id: passage.person, gender: 'Non précisé' };
    }
    const arrayOfPersonsOfPassages = Object.values(personsOfPassages);
    return arrayOfPersonsOfPassages;
  }, [passages, allPersonsAsObject]);
  const rencontres = useMemo(() => {
    const teamsRencontres = filterByTeam(allRencontresPopulated, 'team');
    return getDataForPeriod(teamsRencontres, period, { field: 'date', allSelectedTeamsAreNightSession });
  }, [allRencontresPopulated, filterByTeam, period, allSelectedTeamsAreNightSession]);
  const personsInRencontresBeforePeriod = useMemo(() => {
    if (!period?.startDate) return [];
    const offsetHours = Boolean(viewAllOrganisationData) || selectedTeams.every((e) => !e.nightSession) ? 0 : 12;
    const isoStartDate = dayjs(period.startDate).startOf('day').add(offsetHours, 'hour').toISOString();
    const rencontresIds = rencontres.map((p) => p._id);
    const rencontresNotIncludedInPeriod = allRencontresPopulated.filter((p) => !rencontresIds.includes(p._id)).filter((p) => p.date < isoStartDate);
    const personsOfRencontres = {};
    for (const rencontre of rencontresNotIncludedInPeriod) {
      if (!rencontre.person) continue;
      if (!!personsOfRencontres[rencontre.person]) continue;
      personsOfRencontres[rencontre.person] = allPersonsAsObject[rencontre.person] || { _id: rencontre.person, gender: 'Non précisé' };
    }
    const arrayOfPersonsOfRencontres = Object.values(personsOfRencontres);
    return arrayOfPersonsOfRencontres;
  }, [period.startDate, viewAllOrganisationData, selectedTeams, rencontres, allRencontresPopulated, allPersonsAsObject]);
  const personsInRencontresOfPeriod = useMemo(() => {
    const personsOfRencontres = {};
    for (const rencontre of rencontres) {
      if (!rencontre.person) continue;
      if (!!personsOfRencontres[rencontre.person]) continue;
      personsOfRencontres[rencontre.person] = allPersonsAsObject[rencontre.person] || { _id: rencontre.person, gender: 'Non précisé' };
    }
    const arrayOfPersonsOfRencontres = Object.values(personsOfRencontres);
    return arrayOfPersonsOfRencontres;
  }, [rencontres, allPersonsAsObject]);
  const reports = useMemo(
    () =>
      getDataForPeriod(filterByTeam(allreports, 'team'), period, {
        field: 'date',
        allSelectedTeamsAreNightSession,
      }),
    [allreports, filterByTeam, period, allSelectedTeamsAreNightSession]
  );
  const reportsServices = useMemo(() => reports.map((rep) => (rep.services ? JSON.parse(rep.services) : null)).filter(Boolean), [reports]);
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
          <DateRangePickerWithPresets period={period} setPeriod={setPeriod} preset={preset} setPreset={setPreset} />
        </div>
        <div className="tw-flex tw-basis-2/3 tw-items-center tw-justify-end">
          <ButtonCustom color="link" title="Imprimer" onClick={window.print} />
          <ExportFormattedData
            personCreated={personsForStats}
            personUpdated={personsUpdatedForStats}
            actions={actionsWithDetailedGroupAndCategories}
          />
        </div>
      </div>
      <ul className="noprint tw-mb-5 tw-flex tw-list-none tw-flex-wrap tw-border-b tw-border-zinc-200 tw-pl-0">
        {tabs
          .filter((tabCaption) => {
            if (['Consultations', 'Dossiers médicaux des personnes créées', 'Dossiers médicaux des personnes suivies'].includes(tabCaption)) {
              return !!user.healthcareProfessional;
            }
            if (['Observations'].includes(tabCaption)) {
              return !!organisation.territoriesEnabled;
            }
            if (['Accueil'].includes(tabCaption)) {
              return !!organisation.receptionEnabled;
            }
            return true;
          })
          .map((tabCaption, index) => {
            return (
              <li key={index} className="tw-cursor-pointer">
                <button
                  key={tabCaption}
                  className={[
                    '-tw-mb-px tw-block tw-rounded-t-md tw-border tw-border-transparent tw-py-2 tw-px-4',
                    activeTab !== tabCaption && 'tw-text-main75',
                    activeTab === tabCaption && 'tw-border-x-zinc-200 tw-border-t-zinc-200 tw-bg-white',
                  ].join(' ')}
                  onClick={() => setActiveTab(tabCaption)}>
                  {tabCaption}
                </button>
              </li>
            );
          })}
      </ul>
      <div className="print:tw-flex print:tw-flex-col print:tw-px-8 print:tw-py-4">
        {activeTab === 'Général' && (
          <GeneralStats
            personsForStats={personsForStats}
            personsUpdatedForStats={personsUpdatedForStats}
            rencontres={rencontres}
            actions={actions}
            numberOfActionsPerPerson={numberOfActionsPerPerson}
            numberOfActionsPerPersonConcernedByActions={numberOfActionsPerPersonConcernedByActions}
          />
        )}
        {!!organisation.receptionEnabled && activeTab === 'Accueil' && (
          <ReceptionStats
            reportsServices={reportsServices}
            passages={passages}
            period={period}
            teamsId={viewAllOrganisationData ? teams.map((e) => e?._id) : selectedTeams.map((e) => e?._id)}
          />
        )}
        {activeTab === 'Actions' && (
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
        )}
        {activeTab === 'Personnes créées' && (
          <PersonStats
            title="personnes créées"
            firstBlockHelp={`Nombre de personnes dont la date 'Suivi(e) depuis le / Créé(e) le' se situe dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
            filterBase={filterPersonsWithAllFields()}
            filterPersons={filterPersons}
            setFilterPersons={setFilterPersons}
            personsForStats={personsForStats}
            groupsForPersons={groupsForPersons}
            personFields={personFields}
            flattenedCustomFieldsPersons={flattenedCustomFieldsPersons}
          />
        )}
        {activeTab === 'Personnes suivies' && (
          <PersonStats
            title="personnes suivies"
            firstBlockHelp={`Nombre de personnes pour lesquelles il s'est passé quelque chose durant la période sélectionnée:\n\ncréation, modification, commentaire, action, rencontre, passage, lieu fréquenté, consultation, traitement.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
            filterBase={filterPersonsWithAllFields()}
            filterPersons={filterPersons}
            setFilterPersons={setFilterPersons}
            personsForStats={personsUpdatedForStats}
            groupsForPersons={groupsForPersons}
            personFields={personFields}
            flattenedCustomFieldsPersons={flattenedCustomFieldsPersons}
          />
        )}
        {activeTab === 'Passages' && (
          <PassagesStats
            passages={passages}
            personFields={personFields}
            personsInPassagesOfPeriod={personsInPassagesOfPeriod}
            personsInPassagesBeforePeriod={personsInPassagesBeforePeriod}
          />
        )}
        {activeTab === 'Rencontres' && (
          <RencontresStats
            rencontres={rencontres}
            personFields={personFields}
            personsInRencontresOfPeriod={personsInRencontresOfPeriod}
            personsInRencontresBeforePeriod={personsInRencontresBeforePeriod}
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
        {user.healthcareProfessional && (
          <>
            {activeTab === 'Consultations' && <ConsultationsStats consultations={consultations} />}
            {activeTab === 'Dossiers médicaux des personnes créées' && (
              <MedicalFilesStats
                filterBase={filterPersonsWithAllFields(true)}
                title="personnes créées"
                filterPersons={filterPersons}
                setFilterPersons={setFilterPersons}
                personsForStats={personsForStats}
                customFieldsMedicalFile={customFieldsMedicalFile}
                personFields={personFields}
              />
            )}
            {activeTab === 'Dossiers médicaux des personnes suivies' && (
              <MedicalFilesStats
                filterBase={filterPersonsWithAllFields(true)}
                filterPersons={filterPersons}
                title="personnes suivies"
                setFilterPersons={setFilterPersons}
                personsForStats={personsUpdatedForStats}
                customFieldsMedicalFile={customFieldsMedicalFile}
                personFields={personFields}
              />
            )}
          </>
        )}
      </div>
      {/* HACK: this last div is because Chrome crop the end of the page - I didn't find any better solution */}
      <div className="printonly tw-h-screen" aria-hidden />
    </>
  );
};

export default StatsLoader;
