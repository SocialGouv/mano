import { selector, selectorFamily } from 'recoil';
import { actionsState, CANCEL, DONE, TODO } from './actions';
import { currentTeamState } from './auth';
import { commentsState } from './comments';
import { personsState } from './persons';
import { placesState } from './places';
import { relsPersonPlaceState } from './relPersonPlace';
import { territoriesState } from './territory';
import { isComingInDays, isPassed, isToday, isTomorrow } from '../services/date';
import { customFieldsObsSelector, territoryObservationsState } from './territoryObservations';
import { filterBySearch, filterData } from '../utils/search';
import { consultationsState } from './consultations';

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

export const commentsFilteredSelector = selectorFamily({
  key: 'commentsFilteredSelector',
  get:
    ({ personId, actionId, forPassages }) =>
    ({ get }) => {
      const comments = get(commentsState);
      return comments
        .filter((c) => {
          if (personId) return c.person === personId;
          if (actionId) return c.action === actionId;
          return false;
        })
        .filter((c) => {
          const commentIsPassage = c?.comment?.includes('Passage enregistré');
          if (forPassages) return commentIsPassage;
          return !commentIsPassage;
        });
    },
});

export const commentsSearchSelector = selectorFamily({
  key: 'commentsSearchSelector',
  get:
    ({ search = '' }) =>
    ({ get }) => {
      const comments = get(commentsState);
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
      if (!search?.length) return persons;
      return filterBySearch(search, persons);
    },
});

export const personsFullSearchSelector = selectorFamily({
  key: 'personsFullSearchSelector',
  get:
    ({ search = '', filterTeams = [], filters = [], filterAlertness = false, filterOutOfActiveList = '' }) =>
    ({ get }) => {
      const persons = get(personsWithPlacesSelector);
      let personsFiltered = persons;
      if (filters?.filter((f) => Boolean(f?.value)).length) personsFiltered = filterData(personsFiltered, filters);
      if (filterOutOfActiveList) {
        personsFiltered = personsFiltered.filter((p) => (filterOutOfActiveList === 'Oui' ? p.outOfActiveList : !p.outOfActiveList));
      }
      if (filterAlertness) personsFiltered = personsFiltered.filter((p) => !!p.alertness);
      if (filterTeams.length) {
        personsFiltered = personsFiltered.filter((p) => {
          const assignedTeams = p.assignedTeams || [];
          for (let assignedTeam of assignedTeams) {
            if (filterTeams.includes(assignedTeam)) return true;
          }
          return false;
        });
      }
      if (search?.length) {
        const personsFilteredIds = personsFiltered.map((p) => p._id);
        const comments = get(commentsState);
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

const PASSED = 'Passées';
const TODAY = "Aujourd'hui";
const TOMORROW = 'Demain';
const INCOMINGDAYS = 'À venir';
const sections = [
  {
    title: PASSED,
    data: [],
  },
  {
    title: TODAY,
    data: [],
  },
  {
    title: TOMORROW,
    data: [],
  },
  {
    title: INCOMINGDAYS,
    data: [],
  },
];

const formatData = (data) => {
  if (!data?.length) return [];
  const dataInSections = data.reduce((actions, action) => {
    let inSection = null;
    if (isPassed(action.dueAt)) inSection = PASSED;
    if (isToday(action.dueAt)) inSection = TODAY;
    if (isTomorrow(action.dueAt)) inSection = TOMORROW;
    if (isComingInDays(action.dueAt, 2)) inSection = INCOMINGDAYS;
    return actions.map((section) => {
      if (section.title !== inSection) return section;
      return { ...section, data: [...section.data, action] };
    });
  }, sections);
  return dataInSections;
};

/*

Actions and consultations

*/

const sortDoneOrCancel = (a, b) => {
  if (!a.dueAt) return -1;
  if (!b.dueAt) return 1;
  if (a.dueAt > b.dueAt) return -1;
  return 1;
};
/*

Actions and Consultations

*/

const actionsAndConsultationsSelector = selector({
  key: 'actionsAndConsultationsSelector',
  get: ({ get }) => {
    const actions = get(actionsForCurrentTeamSelector);
    const consultations = get(consultationsState);
    return [...actions, ...consultations.map((c) => ({ ...c, isConsultation: true }))];
  },
});

export const actionsDoneSelector = selector({
  key: 'actionsDoneSelector',
  get: ({ get }) => {
    const actions = get(actionsAndConsultationsSelector);
    return actions.filter((a) => a.status === DONE).sort(sortDoneOrCancel);
  },
});

export const actionsDoneSelectorSliced = selectorFamily({
  key: 'actionsDoneSelectorSliced',
  get:
    ({ limit }) =>
    ({ get }) => {
      const actionsDone = get(actionsDoneSelector);
      return actionsDone.filter((_, index) => index < limit);
    },
});

export const actionsTodoSelector = selector({
  key: 'actionsTodoSelector',
  get: ({ get }) => {
    const actions = get(actionsAndConsultationsSelector);
    return formatData(actions.filter((a) => a.status === TODO));
  },
});

export const actionsCanceledSelector = selector({
  key: 'actionsCanceledSelector',
  get: ({ get }) => {
    const actions = get(actionsAndConsultationsSelector);
    return actions.filter((a) => a.status === CANCEL).sort(sortDoneOrCancel);
  },
});

export const actionsCanceledSelectorSliced = selectorFamily({
  key: 'actionsCanceledSelectorSliced',
  get:
    ({ limit }) =>
    ({ get }) => {
      const actionsCanceled = get(actionsCanceledSelector);
      return actionsCanceled.filter((_, index) => index < limit);
    },
});

export const actionsByStatusSelector = selectorFamily({
  key: 'actionsByStatusSelector',
  get:
    ({ status, limit }) =>
    ({ get }) => {
      if (status === DONE) return get(actionsDoneSelectorSliced({ limit }));
      if (status === TODO) return get(actionsTodoSelector);
      if (status === CANCEL) return get(actionsCanceledSelectorSliced({ limit }));
    },
});

export const totalActionsByStatusSelector = selectorFamily({
  key: 'totalActionsByStatusSelector',
  get:
    ({ status }) =>
    ({ get }) => {
      if (status === DONE) return get(actionsDoneSelector).length;
      if (status === TODO) return get(actionsTodoSelector).length;
      if (status === CANCEL) return get(actionsCanceledSelector).length;
    },
});

/*

Observations

*/

export const onlyFilledObservationsTerritories = selector({
  key: 'onlyFilledObservationsTerritories',
  get: ({ get }) => {
    const customFieldsObs = get(customFieldsObsSelector);
    const territoryObservations = get(territoryObservationsState);

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
      if (!search?.length) return territories;
      return filterBySearch(search, territories);
    },
});
