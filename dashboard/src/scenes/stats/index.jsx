import { useEffect, useMemo, useState } from "react";
import { selectorFamily, useRecoilValue } from "recoil";
import { useLocalStorage } from "../../services/useLocalStorage";
import {
  fieldsPersonsCustomizableOptionsSelector,
  filterPersonsBaseSelector,
  personFieldsSelector,
  flattenedCustomFieldsPersonsSelector,
  personTypesByFieldsNamesSelector,
} from "../../recoil/persons";
import { customFieldsObsSelector, territoryObservationsState } from "../../recoil/territoryObservations";
import { currentTeamState, organisationState, teamsState, userState } from "../../recoil/auth";
import { actionsCategoriesSelector, DONE, flattenedActionsCategoriesSelector } from "../../recoil/actions";
import { reportsState } from "../../recoil/reports";
import { territoriesState } from "../../recoil/territory";
import { customFieldsMedicalFileSelector } from "../../recoil/medicalFiles";
import { arrayOfitemsGroupedByPersonSelector, populatedPassagesSelector } from "../../recoil/selectors";
import useTitle from "../../services/useTitle";
import DateRangePickerWithPresets, { formatPeriod, statsPresets } from "../../components/DateRangePickerWithPresets";
import { useDataLoader } from "../../components/DataLoader";
import Loading from "../../components/loading";
import SelectTeamMultiple from "../../components/SelectTeamMultiple";
import ExportFormattedData from "../data-import-export/ExportFormattedData";
import GeneralStats from "./GeneralStats";
import ServicesStats from "./ServicesStats";
import ActionsStats from "./ActionsStats";
import PersonStats from "./PersonsStats";
import PassagesStats from "./PassagesStats";
import RencontresStats from "./RencontresStats";
import ObservationsStats from "./ObservationsStats";
import ReportsStats from "./ReportsStats";
import ConsultationsStats from "./ConsultationsStats";
import MedicalFilesStats from "./MedicalFilesStats";
import ButtonCustom from "../../components/ButtonCustom";
import dayjs from "dayjs";
import { filterItem } from "../../components/Filters";
import TabsNav from "../../components/tailwind/TabsNav";
import { filterPersonByAssignedTeam } from "../../utils/filter-person";
import { flattenedCustomFieldsConsultationsSelector } from "../../recoil/consultations";
import { getPersonSnapshotAtDate } from "../../utils/person-snapshot";
import { dayjsInstance } from "../../services/date";

const tabs = [
  "Général",
  "Services",
  "Actions",
  "Personnes créées",
  "Personnes suivies",
  "Passages",
  "Rencontres",
  "Observations",
  "Comptes-rendus",
  "Consultations",
  "Dossiers médicaux des personnes créées",
  "Dossiers médicaux des personnes suivies",
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
  const [hasStartLoaded, setHasStartLoaded] = useState(false);

  useEffect(() => {
    if (!isLoading && !hasStartLoaded) {
      setHasStartLoaded(true);
    }
  }, [isLoading, hasStartLoaded]);

  if (!hasStartLoaded) return <Loading />;
  return <Stats />;
};

const personsForStatsSelector = selectorFamily({
  key: "personsForStatsSelector",
  get:
    ({ period }) =>
    ({ get }) => {
      const allRawPersons = get(arrayOfitemsGroupedByPersonSelector);
      const personTypesByFieldsNames = get(personTypesByFieldsNamesSelector);

      const snapshotDate = dayjsInstance(period.endDate).format("YYYY-MM-DD");

      const allPersons = allRawPersons.map((person) => {
        const flattenedPerson = {
          ...(person.medicalFile || {}),
          ...(person.flattenedConsultations || {}),
          ...person,
        };
        const snapshotAtDate = getPersonSnapshotAtDate({
          person: flattenedPerson,
          snapshotDate: snapshotDate,
          typesByFields: personTypesByFieldsNames,
        });
        return {
          ...snapshotAtDate,
          followSinceMonths: dayjsInstance(snapshotDate).diff(person.followedSince || person.createdAt, "months"),
        };
      });

      return allPersons;
    },
});

const itemsForStatsSelector = selectorFamily({
  key: "itemsForStatsSelector",
  get:
    ({ period, filterPersons, selectedTeamsObjectWithOwnPeriod, viewAllOrganisationData }) =>
    ({ get }) => {
      const allPersons = get(personsForStatsSelector({ period }));

      const relativeFilters = [
        "hasAtLeastOneConsultation",
        "numberOfConsultations",
        "numberOfActions",
        "numberOfTreatments",
        "numberOfPassages",
        "numberOfRencontres",
      ];

      const activeFilters = filterPersons.filter((f) => f.value && !relativeFilters.includes(f.field) && f.field !== "outOfActiveList");
      const outOfActiveListFilter = filterPersons.find((f) => f.field === "outOfActiveList")?.value;
      const filterByNumberOfActions = filterPersons.filter((f) => f.field === "numberOfActions");
      const filterByNumberOfConsultations = filterPersons.filter((f) => f.field === "numberOfConsultations");
      const filterHasAtLeastOneConsultation = filterPersons.filter((f) => f.field === "hasAtLeastOneConsultation");
      const filterByNumberOfPassages = filterPersons.filter((f) => f.field === "numberOfPassages");
      const filterByNumberOfRencontres = filterPersons.filter((f) => f.field === "numberOfRencontres");
      const filterByNumberOfTreatments = filterPersons.filter((f) => f.field === "numberOfTreatments");

      const filterItemByTeam = (item, key) => {
        if (viewAllOrganisationData) return true;
        if (Array.isArray(item[key])) {
          for (const team of item[key]) {
            if (selectedTeamsObjectWithOwnPeriod[team]) return true;
          }
        }
        return !!selectedTeamsObjectWithOwnPeriod[item[key]];
      };

      const personsCreated = [];
      const personsUpdated = [];
      // Les personnes suivies ayant des actions
      const personsUpdatedWithActions = {};
      const actionsFilteredByPersons = {};
      const consultationsFilteredByPersons = [];
      const personsWithConsultations = {};
      const passagesFilteredByPersons = [];
      const personsWithPassages = {};
      const personsInPassagesBeforePeriod = {};
      const rencontresFilteredByPersons = [];
      const personsWithRencontres = {};
      const personsInRencontresBeforePeriod = {};
      const noPeriodSelected = !period.startDate || !period.endDate;
      const defaultIsoDates = {
        isoStartDate: period.startDate ? dayjs(period.startDate).startOf("day").toISOString() : null,
        isoEndDate: period.endDate ? dayjs(period.endDate).startOf("day").add(1, "day").toISOString() : null,
      };
      for (let person of allPersons) {
        // get the persons concerned by filters
        if (!filterItem(activeFilters)(person)) continue;
        if (outOfActiveListFilter === "Oui" && !person.outOfActiveList) continue;
        if (outOfActiveListFilter === "Non" && !!person.outOfActiveList) continue;

        if (filterByNumberOfTreatments.length) {
          let numberOfTreatments = 0;
          if (person.treatments?.length) {
            for (const treatment of person.treatments) {
              if (noPeriodSelected) {
                numberOfTreatments++;
                continue;
              }
              const date = treatment.date;
              const { isoStartDate, isoEndDate } = selectedTeamsObjectWithOwnPeriod[treatment.team] ?? defaultIsoDates;
              if (date < isoStartDate) continue;
              if (date >= isoEndDate) continue;
              numberOfTreatments++;
            }
          }
          if (!filterItem(filterByNumberOfTreatments)({ numberOfTreatments })) continue;
        }

        // get persons for stats for period
        const createdDate = person.followedSince || person.createdAt;

        if (filterPersonByAssignedTeam(viewAllOrganisationData, selectedTeamsObjectWithOwnPeriod, person.assignedTeams, person.forTeamFiltering)) {
          if (noPeriodSelected) {
            personsUpdated[person._id] = person;
            personsCreated[person._id] = person;
          } else {
            const { isoStartDate, isoEndDate } = selectedTeamsObjectWithOwnPeriod[person.assignedTeams] ?? defaultIsoDates;
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

        let numberOfActions = 0;
        for (const action of person.actions || []) {
          if (!filterItemByTeam(action, "teams")) continue;
          if (noPeriodSelected) {
            actionsFilteredByPersons[action._id] = action;
            numberOfActions++;
            // On veut seulement les personnes considérées comme suivies
            // Pour ne pas avoir plus de personnes suivies concernées par les actions que de personnes suivies
            if (personsUpdated[person._id]) personsUpdatedWithActions[person._id] = person;
            continue;
          }
          const date = action.completedAt || action.dueAt;
          if (Array.isArray(action.teams)) {
            let isIncluded = false;
            for (const team of action.teams) {
              const { isoStartDate, isoEndDate } = selectedTeamsObjectWithOwnPeriod[team] ?? defaultIsoDates;
              if (date < isoStartDate) continue;
              if (date >= isoEndDate) continue;
              isIncluded = true;
            }
            if (!isIncluded) continue;
          } else {
            const { isoStartDate, isoEndDate } = selectedTeamsObjectWithOwnPeriod[action.team] ?? defaultIsoDates;
            if (date < isoStartDate) continue;
            if (date >= isoEndDate) continue;
          }
          numberOfActions++;
          actionsFilteredByPersons[action._id] = action;
          // Voir ci-dessus (pourquoi on limite aux personnes suivies)
          if (personsUpdated[person._id]) personsUpdatedWithActions[person._id] = person;
        }
        if (filterByNumberOfActions.length) {
          if (!filterItem(filterByNumberOfActions)({ numberOfActions })) {
            delete personsUpdated[person._id];
            delete personsCreated[person._id];
            delete personsUpdatedWithActions[person._id];
            for (const action of person.actions || []) {
              delete actionsFilteredByPersons[action._id];
            }
            continue;
          }
        }

        let numberOfConsultations = 0;
        for (const consultation of person.consultations || []) {
          if (!filterItemByTeam(consultation, "teams")) continue;
          if (noPeriodSelected) {
            consultationsFilteredByPersons.push(consultation);
            numberOfConsultations++;
            personsWithConsultations[person._id] = person;
            continue;
          }
          const date = consultation.completedAt || consultation.dueAt;
          if (Array.isArray(consultation.teams)) {
            let isIncluded = false;
            for (const team of consultation.teams) {
              const { isoStartDate, isoEndDate } = selectedTeamsObjectWithOwnPeriod[team] ?? defaultIsoDates;
              if (date < isoStartDate) continue;
              if (date >= isoEndDate) continue;
              isIncluded = true;
            }
            if (!isIncluded) continue;
          } else {
            const { isoStartDate, isoEndDate } = selectedTeamsObjectWithOwnPeriod[consultation.team] ?? defaultIsoDates;
            if (date < isoStartDate) continue;
            if (date >= isoEndDate) continue;
          }
          numberOfConsultations++;
          consultationsFilteredByPersons.push(consultation);
          personsWithConsultations[person._id] = person;
        }
        if (filterByNumberOfConsultations.length) {
          if (!filterItem(filterByNumberOfConsultations)({ numberOfConsultations })) {
            delete personsUpdated[person._id];
            delete personsCreated[person._id];
            delete personsUpdatedWithActions[person._id];
            for (const action of person.actions || []) {
              delete actionsFilteredByPersons[action._id];
            }
            delete personsWithConsultations[person._id];
            for (let i = 0; i < numberOfConsultations; i++) {
              consultationsFilteredByPersons.pop();
            }
            continue;
          }
        }
        if (filterHasAtLeastOneConsultation.length) {
          if (!filterItem(filterHasAtLeastOneConsultation)({ hasAtLeastOneConsultation: numberOfConsultations > 0 })) {
            delete personsUpdated[person._id];
            delete personsCreated[person._id];
            delete personsUpdatedWithActions[person._id];
            for (const action of person.actions || []) {
              delete actionsFilteredByPersons[action._id];
            }
            delete personsWithConsultations[person._id];
            for (let i = 0; i < numberOfConsultations; i++) {
              consultationsFilteredByPersons.pop();
            }
            continue;
          }
        }

        let numberOfPassages = 0;
        if (person.passages?.length) {
          for (const passage of person.passages) {
            if (!filterItemByTeam(passage, "team")) continue;
            if (noPeriodSelected) {
              passagesFilteredByPersons.push(passage);
              personsWithPassages[person._id] = person;
              numberOfPassages++;
              continue;
            }
            const date = passage.date;
            const { isoStartDate, isoEndDate } = selectedTeamsObjectWithOwnPeriod[passage.team] ?? defaultIsoDates;
            if (date < isoStartDate) continue;
            if (date >= isoEndDate) continue;
            numberOfPassages++;
            passagesFilteredByPersons.push(passage);
            personsWithPassages[person._id] = person;
            if (createdDate < isoStartDate) {
              personsInPassagesBeforePeriod[person._id] = person;
            }
          }
        }
        if (filterByNumberOfPassages.length) {
          if (!filterItem(filterByNumberOfPassages)({ numberOfPassages })) {
            delete personsUpdated[person._id];
            delete personsCreated[person._id];
            delete personsUpdatedWithActions[person._id];
            for (const action of person.actions || []) {
              delete actionsFilteredByPersons[action._id];
            }
            delete personsWithConsultations[person._id];
            for (let i = 0; i < numberOfConsultations; i++) {
              consultationsFilteredByPersons.pop();
            }
            delete personsWithPassages[person._id];
            delete personsInPassagesBeforePeriod[person._id];
            for (let i = 0; i < numberOfPassages; i++) {
              passagesFilteredByPersons.pop();
            }
            continue;
          }
        }

        let numberOfRencontres = 0;
        if (person.rencontres?.length) {
          for (const rencontre of person.rencontres) {
            if (!filterItemByTeam(rencontre, "team")) continue;
            if (noPeriodSelected) {
              rencontresFilteredByPersons.push({ ...rencontre, gender: person.gender });
              personsWithRencontres[person._id] = person;
              numberOfRencontres++;
              continue;
            }
            const date = rencontre.date;
            const { isoStartDate, isoEndDate } = selectedTeamsObjectWithOwnPeriod[rencontre.team] ?? defaultIsoDates;
            if (date < isoStartDate) continue;
            if (date >= isoEndDate) continue;
            numberOfRencontres++;
            rencontresFilteredByPersons.push({ ...rencontre, gender: person.gender });
            personsWithRencontres[person._id] = person;
            if (createdDate < isoStartDate) personsInRencontresBeforePeriod[person._id] = person;
          }
        }
        if (filterByNumberOfRencontres.length) {
          if (!filterItem(filterByNumberOfRencontres)({ numberOfRencontres })) {
            delete personsUpdated[person._id];
            delete personsCreated[person._id];
            delete personsUpdatedWithActions[person._id];
            for (const action of person.actions || []) {
              delete actionsFilteredByPersons[action._id];
            }
            delete personsWithConsultations[person._id];
            for (let i = 0; i < numberOfConsultations; i++) {
              consultationsFilteredByPersons.pop();
            }
            delete personsWithPassages[person._id];
            delete personsInPassagesBeforePeriod[person._id];
            for (let i = 0; i < numberOfPassages; i++) {
              passagesFilteredByPersons.pop();
            }
            delete personsWithRencontres[person._id];
            delete personsInRencontresBeforePeriod[person._id];
            for (let i = 0; i < numberOfRencontres; i++) {
              rencontresFilteredByPersons.pop();
            }
            continue;
          }
        }
      }

      return {
        personsCreated: Object.values(personsCreated),
        personsUpdated: Object.values(personsUpdated),
        personsUpdatedWithActions: Object.keys(personsUpdatedWithActions).length,
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
  field: "outOfActiveList",
  value: "Oui et non (c'est-à-dire tout le monde)",
  type: "multi-choice",
};

const initFilters = [filterMakingThingsClearAboutOutOfActiveListStatus];

const Stats = () => {
  const organisation = useRecoilValue(organisationState);
  const currentTeam = useRecoilValue(currentTeamState);
  const teams = useRecoilValue(teamsState);
  const user = useRecoilValue(userState);

  const allreports = useRecoilValue(reportsState);
  const allObservations = useRecoilValue(territoryObservationsState);
  const allPassagesPopulated = useRecoilValue(populatedPassagesSelector);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);
  const fieldsPersonsCustomizableOptions = useRecoilValue(fieldsPersonsCustomizableOptionsSelector);
  const flattenedCustomFieldsPersons = useRecoilValue(flattenedCustomFieldsPersonsSelector);
  const customFieldsMedicalFile = useRecoilValue(customFieldsMedicalFileSelector);
  const consultationFields = useRecoilValue(flattenedCustomFieldsConsultationsSelector);
  const personFields = useRecoilValue(personFieldsSelector);
  const territories = useRecoilValue(territoriesState);
  const allCategories = useRecoilValue(flattenedActionsCategoriesSelector);
  const groupsCategories = useRecoilValue(actionsCategoriesSelector);

  const [activeTab, setActiveTab] = useLocalStorage("stats-tabCaption", "Général");
  const [filterPersons, setFilterPersons] = useLocalStorage("stats-filterPersons-defaultEverybody", initFilters);
  const [filterObs, setFilterObs] = useLocalStorage("stats-filterObs-defaultEverybody", []);
  const [viewAllOrganisationData, setViewAllOrganisationData] = useLocalStorage("stats-viewAllOrganisationData", teams.length === 1);
  const [period, setPeriod] = useLocalStorage("period", { startDate: null, endDate: null });
  const [preset, setPreset, removePreset] = useLocalStorage("stats-date-preset", null);
  const [manuallySelectedTeams, setSelectedTeams] = useLocalStorage("stats-teams", [currentTeam]);
  const [actionsStatuses, setActionsStatuses] = useLocalStorage("stats-actionsStatuses", DONE);
  const [actionsCategoriesGroups, setActionsCategoriesGroups] = useLocalStorage("stats-catGroups", []);
  const [actionsCategories, setActionsCategories] = useLocalStorage("stats-categories", []);

  const [evolutivesStatsActivated, setEvolutivesStatsActivated] = useLocalStorage("stats-evolutivesStatsActivated", false);
  const [evolutiveStatsIndicators, setEvolutiveStatsIndicators] = useLocalStorage("stats-evolutivesStatsIndicatorsArray", []);

  useTitle(`${activeTab} - Statistiques`);

  /*
   *
    FILTERS BY TEAM TOOLS
    Options are: we clicked on 'view all organisation data' or we selected manually some teams
    Base on those options we get
    - selectedTeams: the teams we want to display
    - selectedTeamsObjectWithOwnPeriod: an object with the ids of the selected teams as keys, to loop faster - O(1) instead of O(n)
    - filterArrayByTeam: a function to filter an array of elements by team
   *
  */

  const selectedTeams = useMemo(() => {
    if (viewAllOrganisationData) return teams;
    return manuallySelectedTeams;
  }, [manuallySelectedTeams, viewAllOrganisationData, teams]);

  const selectedTeamsObjectWithOwnPeriod = useMemo(() => {
    const teamsIdsObject = {};
    for (const team of selectedTeams) {
      const offsetHours = team.nightSession ? 12 : 0;
      const isoStartDate = period.startDate ? dayjs(period.startDate).startOf("day").add(offsetHours, "hour").toISOString() : null;
      const isoEndDate = period.endDate ? dayjs(period.endDate).startOf("day").add(1, "day").add(offsetHours, "hour").toISOString() : null;
      teamsIdsObject[team._id] = {
        isoStartDate,
        isoEndDate,
      };
    }
    return teamsIdsObject;
  }, [selectedTeams, period]);

  const defaultIsoDates = useMemo(
    () => ({
      isoStartDate: period.startDate ? dayjs(period.startDate).startOf("day").toISOString() : null,
      isoEndDate: period.endDate ? dayjs(period.endDate).startOf("day").add(1, "day").toISOString() : null,
    }),
    [period]
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
    personsUpdatedWithActions,
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
      selectedTeamsObjectWithOwnPeriod,
      viewAllOrganisationData,
    })
  );
  const filterableActionsCategories = useMemo(() => {
    if (!actionsCategoriesGroups.length) return ["-- Aucune --", ...allCategories];
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
      if (action.categories?.length) {
        for (const category of action.categories) {
          actionsDetailed.push({
            ...action,
            category,
            categoryGroup: categoriesGroupObject[category] ?? "Catégories supprimées",
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
        if (actionsCategories.length === 1 && actionsCategories[0] === "-- Aucune --") return !a.categories?.length;
        return actionsCategories.includes(a.category);
      });
    return _actionsWithDetailedGroupAndCategories;
  }, [actionsFilteredByPersons, groupsCategories, actionsCategoriesGroups, actionsCategories, actionsStatuses]);

  const passages = useMemo(() => {
    const activeFilters = filterPersons.filter((f) => f.value);
    if (activeFilters.length) {
      if (activeFilters.length > 1) return passagesFilteredByPersons;
      const filter = activeFilters[0];
      if (filter.type !== filterMakingThingsClearAboutOutOfActiveListStatus.type) return passagesFilteredByPersons;
      if (filter.value !== filterMakingThingsClearAboutOutOfActiveListStatus.value) return passagesFilteredByPersons;
    }
    const passagesFiltered = [];
    for (const passage of allPassagesPopulated) {
      if (!viewAllOrganisationData) {
        if (!selectedTeamsObjectWithOwnPeriod[passage.team]) continue;
      }
      const { isoStartDate, isoEndDate } = selectedTeamsObjectWithOwnPeriod[passage.team] ?? defaultIsoDates;
      const date = passage.date ?? passage.createdAt;
      if (date < isoStartDate) continue;
      if (date >= isoEndDate) continue;
      passagesFiltered.push(passage);
    }
    return passagesFiltered;
  }, [allPassagesPopulated, defaultIsoDates, passagesFilteredByPersons, filterPersons, selectedTeamsObjectWithOwnPeriod, viewAllOrganisationData]);

  const observations = useMemo(() => {
    const observationsFiltered = [];
    const territoriesById = {};
    for (const territory of territories) {
      territoriesById[territory._id] = territory;
    }
    const activeFilters = filterObs.filter((f) => f.value);
    const territoryFilter = activeFilters.find((f) => f.field === "territory");
    const otherFilters = activeFilters.filter((f) => f.field !== "territory");
    for (const observation of allObservations) {
      if (!viewAllOrganisationData) {
        if (!selectedTeamsObjectWithOwnPeriod[observation.team]) continue;
      }
      if (territoryFilter) {
        if (!territoryFilter.value.includes(territoriesById[observation.territory]?.name)) continue;
      }
      if (!filterItem(otherFilters)(observation)) continue;
      const { isoStartDate, isoEndDate } = selectedTeamsObjectWithOwnPeriod[observation.team] ?? defaultIsoDates;
      const date = observation.observedAt ?? observation.createdAt;
      if (date < isoStartDate) continue;
      if (date >= isoEndDate) continue;
      observationsFiltered.push(observation);
    }
    return observationsFiltered;
  }, [allObservations, filterObs, territories, defaultIsoDates, selectedTeamsObjectWithOwnPeriod, viewAllOrganisationData]);

  const reports = useMemo(() => {
    const reportsFiltered = [];
    for (const report of allreports) {
      if (!viewAllOrganisationData) {
        if (!selectedTeamsObjectWithOwnPeriod[report.team]) continue;
      }
      const { isoStartDate, isoEndDate } = selectedTeamsObjectWithOwnPeriod[report.team] ?? defaultIsoDates;
      const date = report.date;
      if (date < isoStartDate) continue;
      if (date >= isoEndDate) continue;
      reportsFiltered.push(report);
    }
    return reportsFiltered;
  }, [allreports, defaultIsoDates, selectedTeamsObjectWithOwnPeriod, viewAllOrganisationData]);

  const filterPersonsBase = useRecoilValue(filterPersonsBaseSelector);
  // Add enabled custom fields in filters.
  const filterPersonsWithAllFields = useMemo(() => {
    const filterBase = [
      ...filterPersonsBase.map((f) =>
        f.field !== "outOfActiveList"
          ? f
          : {
              ...f,
              options: ["Oui", "Non", "Oui et non (c'est-à-dire tout le monde)"],
              type: "multi-choice",
            }
      ),
      ...fieldsPersonsCustomizableOptions.filter((a) => a.enabled || a.enabledTeams?.includes(currentTeam._id)).map((a) => ({ field: a.name, ...a })),
      ...flattenedCustomFieldsPersons.filter((a) => a.enabled || a.enabledTeams?.includes(currentTeam._id)).map((a) => ({ field: a.name, ...a })),
    ];
    if (user.healthcareProfessional) {
      filterBase.push(
        ...customFieldsMedicalFile.filter((a) => a.enabled || a.enabledTeams?.includes(currentTeam._id)).map((a) => ({ field: a.name, ...a }))
      );
      filterBase.push(
        ...consultationFields.filter((a) => a.enabled || a.enabledTeams?.includes(currentTeam._id)).map((a) => ({ field: a.name, ...a }))
      );
    }
    return filterBase;
  }, [
    filterPersonsBase,
    fieldsPersonsCustomizableOptions,
    flattenedCustomFieldsPersons,
    customFieldsMedicalFile,
    consultationFields,
    currentTeam,
    user,
  ]);

  const availableTabs = tabs.filter((tabCaption) => {
    if (["Observations"].includes(tabCaption)) {
      return !!organisation.territoriesEnabled;
    }
    if (["Services"].includes(tabCaption)) {
      return !!organisation.receptionEnabled;
    }
    if (["Rencontres"].includes(tabCaption)) {
      return !!organisation.rencontresEnabled;
    }
    if (["Passages"].includes(tabCaption)) {
      return !!organisation.passagesEnabled;
    }
    return true;
  });

  return (
    <>
      <div>
        <div className="printonly tw-px-8 tw-py-4 tw-text-2xl tw-font-bold" aria-hidden>
          Statistiques{" "}
          {viewAllOrganisationData ? (
            <>globales</>
          ) : (
            <>
              {selectedTeams.length > 1 ? "des équipes" : "de l'équipe"} {selectedTeams.map((t) => t.name).join(", ")}
            </>
          )}{" "}
          - {formatPeriod({ period, preset })}
        </div>
        <div className="noprint tw-flex tw-justify-start tw-items-start tw-mt-10 tw-mb-8">
          <h1 className="tw-block tw-text-xl tw-min-w-64 tw-full tw-font-normal">
            <span>Statistiques {viewAllOrganisationData ? <>globales</> : <>{selectedTeams.length > 1 ? "des équipes" : "de l'équipe"}</>}</span>
          </h1>
          <div className="tw-ml-4 tw-min-w-96">
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
      </div>
      <div className="noprint date-picker-container tw-mb-5 tw-flex tw-flex-wrap tw-items-center">
        <div className="tw-min-w-[15rem] tw-shrink-0 tw-basis-1/3 tw-p-0">
          <DateRangePickerWithPresets
            presets={statsPresets}
            period={period}
            setPeriod={setPeriod}
            preset={preset}
            setPreset={setPreset}
            removePreset={removePreset}
          />
        </div>
        <div className="tw-min-w-[15rem] tw-basis-1/3 tw-p-0">
          {activeTab.includes("Personnes") && (
            <button
              type="button"
              className={!evolutivesStatsActivated ? "button-classic" : "button-submit"}
              onClick={() => {
                setEvolutivesStatsActivated(!evolutivesStatsActivated);
              }}
            >
              Affichage évolutif {evolutivesStatsActivated ? "activé" : "désactivé"}
            </button>
          )}
        </div>
        <div className="tw-ml-auto tw-flex tw-basis-1/3 tw-items-center tw-justify-end">
          <ButtonCustom color="link" title="Imprimer" onClick={window.print} />
          <ExportFormattedData
            observations={observations}
            passages={passagesFilteredByPersons}
            rencontres={rencontresFilteredByPersons}
            personCreated={personsCreated}
            personUpdated={personsUpdated}
            actions={actionsWithDetailedGroupAndCategories}
            consultations={consultationsFilteredByPersons}
          />
        </div>
      </div>
      <TabsNav
        className="tw-flex-wrap tw-justify-center tw-px-3 tw-py-2"
        tabs={availableTabs}
        onClick={(tabCaption) => setActiveTab(tabCaption)}
        activeTabIndex={availableTabs.findIndex((tab) => tab === activeTab)}
      />
      <div className="tw-pb-[75vh] print:tw-flex print:tw-flex-col print:tw-px-8 print:tw-py-4">
        {activeTab === "Général" && (
          <GeneralStats
            personsCreated={personsCreated}
            personsUpdated={personsUpdated}
            rencontres={rencontresFilteredByPersons}
            actions={actionsWithDetailedGroupAndCategories}
            // numberOfActionsPerPersonConcernedByActions={numberOfActionsPerPersonConcernedByActions}
            personsUpdatedWithActions={personsUpdatedWithActions}
            // filter by persons
            filterBase={filterPersonsWithAllFields}
            filterPersons={filterPersons}
            setFilterPersons={setFilterPersons}
          />
        )}
        {!!organisation.receptionEnabled && activeTab === "Services" && <ServicesStats period={period} teamIds={selectedTeams.map((e) => e?._id)} />}
        {activeTab === "Actions" && (
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
            personsUpdatedWithActions={personsUpdatedWithActions}
            filterBase={filterPersonsWithAllFields}
            filterPersons={filterPersons}
            setFilterPersons={setFilterPersons}
          />
        )}
        {activeTab === "Personnes créées" && (
          <PersonStats
            title="personnes créées"
            firstBlockHelp={`Nombre de personnes dont la date 'Suivi(e) depuis le / Créé(e) le' se situe dans la période définie.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
            filterBase={filterPersonsWithAllFields}
            filterPersons={filterPersons}
            setFilterPersons={setFilterPersons}
            personsForStats={personsCreated}
            personFields={personFields}
            flattenedCustomFieldsPersons={flattenedCustomFieldsPersons}
            evolutivesStatsActivated={evolutivesStatsActivated}
            period={period}
            evolutiveStatsIndicators={evolutiveStatsIndicators}
            setEvolutiveStatsIndicators={setEvolutiveStatsIndicators}
            viewAllOrganisationData={viewAllOrganisationData}
            selectedTeamsObjectWithOwnPeriod={selectedTeamsObjectWithOwnPeriod}
          />
        )}
        {activeTab === "Personnes suivies" && (
          <PersonStats
            title="personnes suivies"
            firstBlockHelp={`Nombre de personnes pour lesquelles il s'est passé quelque chose durant la période sélectionnée:\n\ncréation, modification, commentaire, action, rencontre, passage, lieu fréquenté, consultation, traitement.\n\nSi aucune période n'est définie, on considère l'ensemble des personnes.`}
            personsForStats={personsUpdated}
            personFields={personFields}
            flattenedCustomFieldsPersons={flattenedCustomFieldsPersons}
            // filter by persons
            filterBase={filterPersonsWithAllFields}
            filterPersons={filterPersons}
            setFilterPersons={setFilterPersons}
            evolutivesStatsActivated={evolutivesStatsActivated}
            period={period}
            evolutiveStatsIndicators={evolutiveStatsIndicators}
            setEvolutiveStatsIndicators={setEvolutiveStatsIndicators}
            viewAllOrganisationData={viewAllOrganisationData}
            selectedTeamsObjectWithOwnPeriod={selectedTeamsObjectWithOwnPeriod}
          />
        )}
        {!!organisation.passagesEnabled && activeTab === "Passages" && (
          <PassagesStats
            passages={passages}
            personFields={personFields}
            personsInPassagesBeforePeriod={personsInPassagesBeforePeriod}
            // filter by persons
            personsWithPassages={personsWithPassages}
            filterBase={filterPersonsWithAllFields}
            filterPersons={filterPersons}
            setFilterPersons={setFilterPersons}
          />
        )}
        {!!organisation.rencontresEnabled && activeTab === "Rencontres" && (
          <RencontresStats
            rencontres={rencontresFilteredByPersons}
            personFields={personFields}
            personsInRencontresBeforePeriod={personsInRencontresBeforePeriod}
            // filter by persons
            personsWithRencontres={personsWithRencontres}
            filterBase={filterPersonsWithAllFields}
            filterPersons={filterPersons}
            setFilterPersons={setFilterPersons}
          />
        )}
        {activeTab === "Observations" && (
          <ObservationsStats
            territories={territories}
            personsWithRencontres={personsWithRencontres}
            filterObs={filterObs}
            setFilterObs={setFilterObs}
            observations={observations}
            customFieldsObs={customFieldsObs}
            period={period}
            selectedTeams={selectedTeams}
          />
        )}
        {activeTab === "Comptes-rendus" && <ReportsStats reports={reports} />}
        {activeTab === "Consultations" && (
          <ConsultationsStats
            consultations={consultationsFilteredByPersons} // filter by persons
            // filter by persons
            personsWithConsultations={personsWithConsultations}
            filterBase={filterPersonsWithAllFields}
            filterPersons={filterPersons}
            setFilterPersons={setFilterPersons}
          />
        )}
        {activeTab === "Dossiers médicaux des personnes créées" && (
          <MedicalFilesStats
            filterBase={filterPersonsWithAllFields}
            title="personnes créées"
            filterPersons={filterPersons}
            setFilterPersons={setFilterPersons}
            personsForStats={personsCreated}
            customFieldsMedicalFile={customFieldsMedicalFile}
            personFields={personFields}
          />
        )}
        {activeTab === "Dossiers médicaux des personnes suivies" && (
          <MedicalFilesStats
            title="personnes suivies"
            personsForStats={personsUpdated}
            customFieldsMedicalFile={customFieldsMedicalFile}
            personFields={personFields}
            // filter by persons
            filterBase={filterPersonsWithAllFields}
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
