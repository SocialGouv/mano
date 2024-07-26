import { useEffect, useMemo, useRef, useState } from "react";
import { selectorFamily, useRecoilValue } from "recoil";
import { useLocalStorage } from "../../services/useLocalStorage";
import {
  fieldsPersonsCustomizableOptionsSelector,
  filterPersonsBaseSelector,
  personFieldsSelector,
  flattenedCustomFieldsPersonsSelector,
} from "../../recoil/persons";
import { customFieldsObsSelector, territoryObservationsState } from "../../recoil/territoryObservations";
import { currentTeamState, organisationState, teamsState, userState } from "../../recoil/auth";
import { actionsCategoriesSelector, DONE, flattenedActionsCategoriesSelector } from "../../recoil/actions";
import { reportsState } from "../../recoil/reports";
import { territoriesState } from "../../recoil/territory";
import { customFieldsMedicalFileSelector } from "../../recoil/medicalFiles";
import { personsForStatsSelector, populatedPassagesSelector } from "../../recoil/selectors";
import useTitle from "../../services/useTitle";
import DateRangePickerWithPresets, { formatPeriod, statsPresets } from "../../components/DateRangePickerWithPresets";
import { useDataLoader } from "../../components/DataLoader";
import Loading from "../../components/loading";
import SelectTeamMultiple from "../../components/SelectTeamMultiple";
import ExportFormattedData from "../data-import-export/ExportFormattedData";
import GeneralStats from "./GeneralStats";
import ServicesStats from "./ServicesStats";
import ActionsStats from "./ActionsStats";
import PersonStats from "./PersonsStatsNew";
import PassagesStats from "./PassagesStats";
import RencontresStats from "./RencontresStats";
import ObservationsStats from "./ObservationsStats";
import ReportsStats from "./ReportsStats";
import ConsultationsStats from "./ConsultationsStats";
import MedicalFilesStats from "./MedicalFilesStats";
import ButtonCustom from "../../components/ButtonCustom";
import dayjs from "dayjs";
import Filters, { filterItem } from "../../components/Filters";
import TabsNav from "../../components/tailwind/TabsNav";
import { filterPersonByAssignedTeam } from "../../utils/filter-person";
import { flattenedCustomFieldsConsultationsSelector } from "../../recoil/consultations";
import DatePicker from "../../components/DatePicker";

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

const itemsForStatsSelector = selectorFamily({
  key: "itemsForStatsSelector",
  get:
    ({ period, filterPersons, selectedTeamsObjectWithOwnPeriod, viewAllOrganisationData }) =>
    ({ get }) => {
      const activeFilters = filterPersons.filter((f) => f.value);
      const filterItemByTeam = (item, key) => {
        if (viewAllOrganisationData) return true;
        if (Array.isArray(item[key])) {
          for (const team of item[key]) {
            if (selectedTeamsObjectWithOwnPeriod[team]) return true;
          }
        }
        return !!selectedTeamsObjectWithOwnPeriod[item[key]];
      };
      const filtersExceptOutOfActiveList = activeFilters.filter((f) => f.field !== "outOfActiveList");
      const outOfActiveListFilter = activeFilters.find((f) => f.field === "outOfActiveList")?.value;

      const allPersons = get(personsForStatsSelector);

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
        if (!filterItem(filtersExceptOutOfActiveList)(person)) continue;
        if (outOfActiveListFilter === "Oui" && !person.outOfActiveList) continue;
        if (outOfActiveListFilter === "Non" && !!person.outOfActiveList) continue;
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
        // get actions for stats for period
        for (const action of person.actions || []) {
          if (!filterItemByTeam(action, "teams")) continue;
          if (noPeriodSelected) {
            actionsFilteredByPersons[action._id] = action;
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
          actionsFilteredByPersons[action._id] = action;
          // Voir ci-dessus (pourquoi on limite aux personnes suivies)
          if (personsUpdated[person._id]) personsUpdatedWithActions[person._id] = person;
        }
        for (const consultation of person.consultations || []) {
          if (!filterItemByTeam(consultation, "teams")) continue;
          if (noPeriodSelected) {
            consultationsFilteredByPersons.push(consultation);
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
          consultationsFilteredByPersons.push(consultation);
          personsWithConsultations[person._id] = person;
        }
        if (person.passages?.length) {
          for (const passage of person.passages) {
            if (!filterItemByTeam(passage, "team")) continue;
            if (noPeriodSelected) {
              passagesFilteredByPersons.push(passage);
              personsWithPassages[person._id] = person;
              continue;
            }
            const date = passage.date;
            const { isoStartDate, isoEndDate } = selectedTeamsObjectWithOwnPeriod[passage.team] ?? defaultIsoDates;
            if (date < isoStartDate) continue;
            if (date >= isoEndDate) continue;
            passagesFilteredByPersons.push(passage);
            personsWithPassages[person._id] = person;
            if (createdDate < isoStartDate) {
              personsInPassagesBeforePeriod[person._id] = person;
            }
          }
        }
        if (person.rencontres?.length) {
          for (const rencontre of person.rencontres) {
            if (!filterItemByTeam(rencontre, "team")) continue;
            if (noPeriodSelected) {
              rencontresFilteredByPersons.push({ ...rencontre, gender: person.gender });
              personsWithRencontres[person._id] = person;
              continue;
            }
            const date = rencontre.date;
            const { isoStartDate, isoEndDate } = selectedTeamsObjectWithOwnPeriod[rencontre.team] ?? defaultIsoDates;
            if (date < isoStartDate) continue;
            if (date >= isoEndDate) continue;
            rencontresFilteredByPersons.push({ ...rencontre, gender: person.gender });
            personsWithRencontres[person._id] = person;
            if (createdDate < isoStartDate) personsInRencontresBeforePeriod[person._id] = person;
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

const initFilters = [];

function TabTitle({ children }) {
  return <h3 className="tw-my-10 tw-flex tw-justify-between tw-text-xl tw-font-extrabold">{children}</h3>;
}

function MenuButton({ selected, text, onClick }) {
  return (
    <button className={["tw-text-sm tw-text-left", selected ? "tw-text-main tw-font-semibold" : "tw-text-zinc-800"].join(" ")} onClick={onClick}>
      {text}
    </button>
  );
}

const Stats = () => {
  const organisation = useRecoilValue(organisationState);
  const currentTeam = useRecoilValue(currentTeamState);
  const teams = useRecoilValue(teamsState);
  const user = useRecoilValue(userState);
  const { refresh } = useDataLoader();
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

  const [snapshotDate, setSnapshotDate] = useLocalStorage("stats-snapshotDate", new Date());
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

  const scrollContainer = useRef(null);

  useEffect(() => {
    scrollContainer.current.scrollTo({ top: 0 });
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className="relative tw--m-12 tw--mt-4 tw-flex tw-h-[calc(100%+4rem)] tw-flex-col">
      <div className="tw-flex tw-flex-1 tw-overflow-hidden">
        <div className="tw-flex tw-h-full tw-w-58 tw-shrink-0 tw-flex-col tw-items-start tw-bg-main tw-px-2 tw-pt-2 tw-overflow-auto">
          <div className="tw-text-white tw-font-bold tw-text-sm mt-4">Personnes</div>
          <div className="rounded tw-mx-auto tw-w-full tw-p-2 my-2 tw-flex tw-bg-main25 tw-flex-col tw-gap-2 tw-items-start tw">
            <MenuButton selected={activeTab === "Personnes suivies"} text="Personnes suivies" onClick={() => setActiveTab("Personnes suivies")} />
            <MenuButton selected={activeTab === "Personnes créées"} text="Personnes créées" onClick={() => setActiveTab("Personnes créées")} />
            <MenuButton
              selected={activeTab === "Dossiers médicaux des personnes créées"}
              text={
                <>
                  Dossiers médicaux
                  <br />
                  des personnes crées
                </>
              }
              onClick={() => console.log("Dossiers médicaux des personnes créées")}
            />
            <MenuButton
              selected={activeTab === "Dossiers médicaux des personnes suivies"}
              text={
                <>
                  Dossiers médicaux
                  <br />
                  des personnes suivies
                </>
              }
              onClick={() => console.log("Dossiers médicaux des personnes suivies")}
            />
          </div>
          <div className="tw-text-white tw-font-bold  tw-text-sm mt-3">Activité</div>
          <div className="rounded tw-mx-auto tw-w-full tw-p-2 my-2 tw-flex tw-bg-main25 tw-flex-col tw-gap-2 tw-items-start tw">
            <MenuButton selected={activeTab === "Général"} text="Général" onClick={() => console.log("Général")} />
            <MenuButton selected={activeTab === "Services"} text="Services" onClick={() => console.log("Services")} />
            <MenuButton selected={activeTab === "Actions"} text="Actions" onClick={() => console.log("Actions")} />
            <MenuButton selected={activeTab === "Consultations"} text="Consultations" onClick={() => console.log("Consultations")} />
            <MenuButton selected={activeTab === "Passages"} text="Passages" onClick={() => console.log("Passages")} />
            <MenuButton selected={activeTab === "Rencontres"} text="Rencontres" onClick={() => console.log("Rencontres")} />
            <MenuButton selected={activeTab === "Observations"} text="Observations" onClick={() => console.log("Observations")} />
            <MenuButton selected={activeTab === "Comptes-rendus"} text="Comptes-rendus" onClick={() => console.log("Comptes-rendus")} />
          </div>
        </div>
        <div ref={scrollContainer} className="tw-basis-full tw-overflow-auto tw-px-6 tw-py-4">
          {activeTab === "Personnes suivies" && (
            <>
              <div className="tw-pb-[75vh] print:tw-flex print:tw-flex-col print:tw-px-8 print:tw-py-4">
                <TabTitle>Statistiques des personnes suivies</TabTitle>
                <div className="tw-flex tw-flex-row tw-gap-2 tw-items-center">
                  <p className="tw-mb-0 tw-basis-1/2">Personnes suivies pendant la période:</p>
                  <div className="tw-min-w-[15rem] tw-shrink-0 tw-basis-1/3 tw-p-0 ">
                    <DateRangePickerWithPresets
                      presets={statsPresets}
                      period={period}
                      setPeriod={setPeriod}
                      preset={preset}
                      setPreset={setPreset}
                      removePreset={removePreset}
                    />
                  </div>
                </div>
                <hr className="tw-my-0.5" />
                <div className="tw-flex tw-flex-row tw-gap-2 tw-items-center">
                  <p className="tw-mb-0 tw-basis-1/2 tw-shrink-0">Suivies par les équipes pendant cette période:</p>
                  <div className="tw-grow">
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
                <hr className="tw-my-0.5" />
                <div className="tw-flex tw-flex-row tw-gap-2 tw-items-center">
                  <p className="tw-mb-0 tw-basis-1/2">Visualiser les personnes dans leur état du:</p>
                  <div className="tw-shrink-0 tw-basis-60 tw-p-0">
                    <DatePicker defaultValue={snapshotDate} onChange={(event) => setSnapshotDate(event.target.value)} />
                  </div>
                </div>
                <hr className="tw-my-0.5" />
                <Filters title={null} base={filterPersonsWithAllFields} filters={filterPersons} onChange={setFilterPersons} />
                <hr className="tw-my-0.5" />
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsLoader;
