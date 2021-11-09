/* eslint-disable react-hooks/exhaustive-deps */
import { actionsState } from './actions';
import { currentTeamState } from './auth';
import { commentsState } from './comments';
import { personsState } from './persons';
import { placesState } from './places';
import { relsPersonPlaceState } from './relPersonPlace';
import { reportsState } from './reports';
import { territoriesState } from './territory';
import { isOnSameDay, today } from '../services/date';
import { customFieldsObsSelector, territoryObservationsState } from './territoryObservations';
import { selector, selectorFamily } from 'recoil';
import { filterData } from '../components/Filters';
import { filterBySearch } from '../scenes/search/utils';

export const currentTeamReportsSelector = selector({
  key: 'currentTeamReportsSelector',
  get: ({ get }) => {
    const reports = get(reportsState);
    const currentTeam = get(currentTeamState);
    return reports.filter((a) => a.team === currentTeam?._id);
  },
});

export const todaysReportSelector = selector({
  key: 'todaysReportSelector',
  get: ({ get }) => {
    const teamsReports = get(currentTeamReportsSelector);
    return teamsReports.find((rep) => isOnSameDay(new Date(rep.date), today()));
  },
});

export const lastReportSelector = selector({
  key: 'lastReportSelector',
  get: ({ get }) => {
    const teamsReports = get(currentTeamReportsSelector);
    const todays = get(todaysReportSelector);
    return teamsReports.filter((rep) => rep._id !== todays?._id)[0];
  },
});

export const personsWithPlacesSelector = selector({
  key: 'personsWithPlacesSelector',
  get: ({ get }) => {
    const persons = get(personsState);
    const relsPersonPlace = get(relsPersonPlaceState);
    const places = get(placesState);
    return persons.map((p) => ({
      ...p,
      places: [
        ...new Set(
          relsPersonPlace
            .filter((c) => c.person === p._id)
            .map((rel) => places.find((place) => place._id === rel.place)?.name)
            .filter(Boolean) // just to remove empty names in case it happens (it happened in dev)
        ),
      ],
    }));
  },
});

export const placesSearchSelector = selectorFamily({
  key: 'placesSearchSelector',
  get:
    ({ search = '' }) =>
    ({ get }) => {
      const places = get(placesState);
      if (!search?.length) return [];
      return filterBySearch(search, places);
    },
});

export const commentsForCurrentTeamSelector = selector({
  key: 'commentsForCurrentTeamSelector',
  get: ({ get }) => {
    const comments = get(commentsState);
    const currentTeam = get(currentTeamState);
    return comments.filter((c) => c.team === currentTeam?._id);
  },
});

export const commentsSearchSelector = selectorFamily({
  key: 'commentsSearchSelector',
  get:
    ({ search = '' }) =>
    ({ get }) => {
      const comments = get(commentsForCurrentTeamSelector);
      if (!search?.length) return [];
      return filterBySearch(search, comments);
    },
});

export const personsSearchSelector = selectorFamily({
  key: 'personsSearchSelector',
  get:
    ({ search = '' }) =>
    ({ get }) => {
      const persons = get(personsState);
      if (!search?.length) return [];
      return filterBySearch(search, persons);
    },
});

export const personsFullSearchSelector = selectorFamily({
  key: 'personsFullSearchSelector',
  get:
    ({ search = '', filterTeams = [], filters = [], alertness = false }) =>
    ({ get }) => {
      const persons = get(personsWithPlacesSelector);
      let personsFiltered = persons;
      if (!!filters?.filter((f) => Boolean(f?.value)).length) personsFiltered = filterData(personsFiltered, filters);
      if (!!alertness) personsFiltered = personsFiltered.filter((p) => !!p.alertness);
      if (filterTeams.length) {
        personsFiltered = personsFiltered.filter((p) => {
          for (let assignedTeam of p.assignedTeams) {
            if (filterTeams.includes(assignedTeam)) return true;
          }
          return false;
        });
      }
      if (search?.length) {
        const personsFilteredIds = personsFiltered.map((p) => p._id);
        const comments = get(commentsForCurrentTeamSelector);
        const actions = get(actionsState);
        const actionsOfFilteredPersons = actions.filter((a) => personsFilteredIds.includes(a.person));
        const actionsOfFilteredPersonsIds = actionsOfFilteredPersons.map((a) => a._id);
        const commentsOfFilteredPersons = comments.filter((c) => personsFilteredIds.includes(c.person));
        const commentsOfFilteredActions = comments.filter((c) => actionsOfFilteredPersonsIds.includes(c.action));
        const personsIdsFilteredByActionsSearch = filterBySearch(search, actionsOfFilteredPersons).map((a) => a.person);
        const personsIdsFilteredByActionsCommentsSearch = filterBySearch(search, commentsOfFilteredPersons).map((c) => c.person);
        const personsIdsFilteredByPersonsCommentsSearch = filterBySearch(search, commentsOfFilteredActions).map((c) => c.person);
        const personsIdsFilteredByPersonsSearch = filterBySearch(search, personsFiltered).map((c) => c._id);

        const personsIdsFilterBySearch = [
          ...new Set([
            ...personsIdsFilteredByActionsSearch,
            ...personsIdsFilteredByActionsCommentsSearch,
            ...personsIdsFilteredByPersonsCommentsSearch,
            ...personsIdsFilteredByPersonsSearch,
          ]),
        ];
        personsFiltered = personsFiltered.filter((p) => personsIdsFilterBySearch.includes(p._id));
      }
      return personsFiltered;
    },
});

export const actionsForCurrentTeamSelector = selector({
  key: 'actionsForCurrentTeamSelector',
  get: ({ get }) => {
    const actions = get(actionsState);
    const currentTeam = get(currentTeamState);
    return actions.filter((a) => a.team === currentTeam?._id);
  },
});

export const actionsByStatusSelector = selectorFamily({
  key: 'actionsByStatusSelector',
  get:
    (status) =>
    ({ get }) => {
      const actions = get(actionsForCurrentTeamSelector);
      return actions.filter((a) => a.status === status);
    },
});

export const actionsSearchSelector = selectorFamily({
  key: 'actionsSearchSelector',
  get:
    ({ search = '' }) =>
    ({ get }) => {
      const actions = get(actionsForCurrentTeamSelector);
      if (!search?.length) return [];
      return filterBySearch(search, actions);
    },
});

export const actionsFullSearchSelector = selectorFamily({
  key: 'actionsFullSearchSelector',
  get:
    ({ status, search = '' }) =>
    ({ get }) => {
      const actions = get(actionsForCurrentTeamSelector);
      let actionsFiltered = actions;
      if (status) actionsFiltered = actionsFiltered.filter((a) => a.status === status);
      if (search?.length) {
        const actionsFilteredIds = actionsFiltered.map((p) => p._id);
        const comments = get(commentsForCurrentTeamSelector);
        const persons = get(personsWithPlacesSelector);
        const personsOfFilteredActions = persons.filter((a) => actionsFilteredIds.includes(a.person));
        const commentsOfFilteredActions = comments.filter((c) => actionsFilteredIds.includes(c.action));
        const actionsIdsFilteredByActionsSearch = filterBySearch(search, actionsFiltered).map((a) => a._id);
        const actionsIdsFilteredByActionsCommentsSearch = filterBySearch(search, commentsOfFilteredActions).map((c) => c.action);
        const personIdsFilteredByPersonsSearch = filterBySearch(search, personsOfFilteredActions).map((p) => p._id);
        const actionIdsFilteredByPersonsSearch = actionsFiltered.filter((a) => personIdsFilteredByPersonsSearch.includes(a.person));

        const actionsIdsFilterBySearch = [
          ...new Set([...actionsIdsFilteredByActionsSearch, ...actionsIdsFilteredByActionsCommentsSearch, ...actionIdsFilteredByPersonsSearch]),
        ];
        actionsFiltered = actionsFiltered.filter((a) => actionsIdsFilterBySearch.includes(a._id));
      }
      return actionsFiltered;
    },
});

export const territoriesObservationsForCurrentTeamSelector = selector({
  key: 'territoriesObservationsForCurrentTeamSelector',
  get: ({ get }) => {
    const observations = get(territoryObservationsState);
    const currentTeam = get(currentTeamState);
    return observations.filter((a) => a.team === currentTeam?._id);
  },
});

export const onlyFilledObservationsTerritories = selector({
  key: 'onlyFilledObservationsTerritories',
  get: ({ get }) => {
    const customFieldsObs = get(customFieldsObsSelector);
    const territoryObservations = get(territoriesObservationsForCurrentTeamSelector);

    const observationsKeyLabels = {};
    for (const field of customFieldsObs) {
      observationsKeyLabels[field.name] = field.label;
    }

    return territoryObservations.map((obs) => {
      const obsWithOnlyFilledFields = {};
      for (let key of Object.keys(obs)) {
        if (obs[key]) obsWithOnlyFilledFields[observationsKeyLabels[key]] = obs[key];
      }
      return { territory: obs.territory, ...obsWithOnlyFilledFields };
    });
  },
});

export const territoriesObservationsSearchSelector = selectorFamily({
  key: 'territoriesObservationsSearchSelector',
  get:
    ({ search = '' }) =>
    ({ get }) => {
      const onlyFilledObservations = get(onlyFilledObservationsTerritories);
      const observations = get(territoryObservationsState);

      if (!search?.length) return [];
      const obsIds = filterBySearch(search, onlyFilledObservations).map((obs) => obs._id);
      return observations.filter((obs) => obsIds.includes(obs._id));
    },
});

export const territoriesSearchSelector = selectorFamily({
  key: 'territoriesSearchSelector',
  get:
    ({ search = '' }) =>
    ({ get }) => {
      const territories = get(territoriesState);
      if (!search?.length) return [];
      return filterBySearch(search, territories);
    },
});

export const territoriesFullSearchSelector = selectorFamily({
  key: 'territoriesFullSearchSelector',
  get:
    ({ search = '' }) =>
    ({ get }) => {
      const territories = get(territoriesState);
      if (!search.length) return territories;

      const territoryObservations = get(onlyFilledObservationsTerritories);

      const territoriesIdsByTerritoriesSearch = filterBySearch(search, territories).map((t) => t._id);
      const territoriesIdsFilteredByObsSearch = filterBySearch(search, territoryObservations).map((obs) => obs.territory);

      const territoriesIdsFilterBySearch = [...new Set([...territoriesIdsByTerritoriesSearch, ...territoriesIdsFilteredByObsSearch])];
      return territories.filter((t) => territoriesIdsFilterBySearch.includes(t._id));
    },
});
