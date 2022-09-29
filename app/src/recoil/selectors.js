import { selector, selectorFamily } from 'recoil';
import { actionsState, CANCEL, DONE, TODO } from './actions';
import { currentTeamState } from './auth';
import { commentsState } from './comments';
import { personsState } from './persons';
import { placesState } from './places';
import { relsPersonPlaceState } from './relPersonPlace';
import { territoriesState } from './territory';
import { isComingInDays, isPassed, isToday, isTomorrow } from '../services/date';
import { filterBySearch } from '../utils/search';
import { consultationsState } from './consultations';
import { rencontresState } from './rencontres';
import { treatmentsState } from './treatments';
import { medicalFileState } from './medicalFiles';

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

const actionsWithCommentsSelector = selector({
  key: 'actionsWithCommentsSelector',
  get: ({ get }) => {
    const actions = get(actionsState);
    const comments = get(commentsState);
    const actionsObject = {};
    for (const action of actions) {
      actionsObject[action._id] = { ...action, comments: [] };
    }
    for (const comment of comments) {
      if (!actionsObject[comment.action]) continue;
      actionsObject[comment.action].comments.push(comment);
    }
    return actionsObject;
  },
});

const placesObjectSelector = selector({
  key: 'placesObjectSelector',
  get: ({ get }) => {
    const places = get(placesState);
    const placesObject = {};
    for (const place of places) {
      if (!place?.name) continue;
      placesObject[place._id] = place;
    }
    return placesObject;
  },
});

export const personsObjectSelector = selector({
  key: 'personsObjectSelector',
  get: ({ get }) => {
    const persons = get(personsState);
    const personsObject = {};
    for (const person of persons) {
      personsObject[person._id] = { ...person };
    }
    return personsObject;
  },
});

export const itemsGroupedByPersonSelector = selector({
  key: 'itemsGroupedByPersonSelector',
  get: ({ get }) => {
    const now = Date.now();
    console.log('START PERSONS SELECTOR');
    const persons = get(personsState);
    const personsObject = {};
    for (const person of persons) {
      personsObject[person._id] = { ...person };
    }
    const actions = Object.values(get(actionsWithCommentsSelector));
    const comments = get(commentsState);
    const consultations = get(consultationsState);
    const treatments = get(treatmentsState);
    const medicalFiles = get(medicalFileState);
    // const passages = get(passagesState);
    const relsPersonPlace = get(relsPersonPlaceState);
    const places = get(placesObjectSelector);
    const rencontres = get(rencontresState);
    for (const action of actions) {
      if (!personsObject[action.person]) continue;
      personsObject[action.person].actions = personsObject[action.person].actions || [];
      personsObject[action.person].actions.push(action);
    }
    for (const comment of comments) {
      if (!personsObject[comment.person]) continue;
      personsObject[comment.person].comments = personsObject[comment.person].comments || [];
      personsObject[comment.person].comments.push(comment);
    }
    for (const relPersonPlace of relsPersonPlace) {
      if (!personsObject[relPersonPlace.person]) continue;
      const place = places[relPersonPlace.place];
      if (!place) continue;
      personsObject[relPersonPlace.person].places = personsObject[relPersonPlace.person].places || {};
      personsObject[relPersonPlace.person].places[place._id] = place.name;
      personsObject[relPersonPlace.person].relsPersonPlace = personsObject[relPersonPlace.person].relsPersonPlace || [];
      personsObject[relPersonPlace.person].relsPersonPlace.push(relPersonPlace);
    }
    for (const consultation of consultations) {
      if (!personsObject[consultation.person]) continue;
      personsObject[consultation.person].consultations = personsObject[consultation.person].consultations || [];
      personsObject[consultation.person].consultations.push(consultation);
    }
    for (const treatment of treatments) {
      if (!personsObject[treatment.person]) continue;
      personsObject[treatment.person].treatments = personsObject[treatment.person].treatments || [];
      personsObject[treatment.person].treatments.push(treatment);
    }
    for (const medicalFile of medicalFiles) {
      if (!personsObject[medicalFile.person]) continue;
      personsObject[medicalFile.person].medicalFile = medicalFile;
    }
    // for (const passage of passages) {
    //   if (!personsObject[passage.person]) continue;
    //   personsObject[passage.person].passages = personsObject[passage.person].passages || [];
    //   personsObject[passage.person].passages.push(passage);
    // }
    for (const rencontre of rencontres) {
      if (!personsObject[rencontre.person]) continue;
      personsObject[rencontre.person].rencontres = personsObject[rencontre.person].rencontres || [];
      personsObject[rencontre.person].rencontres.push(rencontre);
    }
    console.log('FINISH PERSONS SELECTOR', Date.now() - now);
    return personsObject;
  },
});

export const itemsGroupedByActionSelector = selector({
  key: 'itemsGroupedByActionSelector',
  get: ({ get }) => {
    const actionsWithCommentsObject = get(actionsWithCommentsSelector);
    const personsWithPlacesObject = get(personsWithPlacesSelector);

    const actionsObject = {};
    for (const actionId of Object.keys(actionsWithCommentsObject)) {
      const action = actionsWithCommentsObject[actionId];
      actionsObject[actionId] = { ...action, personPopulated: personsWithPlacesObject[action.person] };
    }
    return actionsObject;
  },
});

export const personsWithPlacesSelector = selector({
  key: 'personsWithPlacesSelector',
  get: ({ get }) => {
    const persons = get(personsState);
    const personsObject = {};
    for (const person of persons) {
      personsObject[person._id] = { ...person };
    }
    const relsPersonPlace = get(relsPersonPlaceState);
    const places = get(placesObjectSelector);

    for (const relPersonPlace of relsPersonPlace) {
      if (!personsObject[relPersonPlace.person]) continue;
      const place = places[relPersonPlace.place];
      if (!place) continue;
      personsObject[relPersonPlace.person].places = personsObject[relPersonPlace.person].places || {};
      personsObject[relPersonPlace.person].places[place._id] = place.name;
    }
    return personsObject;
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

  return dataInSections.reduce((actions, section) => {
    return [...actions, { type: 'title', title: section.title, _id: section.title }, ...section.data];
  }, []);
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
