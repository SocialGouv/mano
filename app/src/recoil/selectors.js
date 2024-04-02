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
import dayjs from 'dayjs';
import { groupsState } from './groups';
import { formatAge, formatBirthDate } from '../services/dateDayjs';

export const actionsObjectSelector = selector({
  key: 'actionsObjectSelector',
  get: ({ get }) => {
    const actions = get(actionsState);
    const actionsObject = {};
    for (const action of actions) {
      actionsObject[action._id] = { ...action };
    }
    return actionsObject;
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

export const itemsGroupedByPersonSelector = selector({
  key: 'itemsGroupedByPersonSelector',
  get: ({ get }) => {
    const persons = get(personsState);
    const personsObject = {};
    for (const person of persons) {
      const age = person.birthdate ? formatAge(person.birthdate) : 0;
      const nameLowercased = person.name.toLocaleLowerCase();
      // replace all accents with normal letters
      const nameNormalized = nameLowercased.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      personsObject[person._id] = {
        ...person,
        nameNormalized,
        formattedBirthDate: person.birthdate ? `${age} an${age > 1 ? 's' : ''} (${formatBirthDate(person.birthdate)})` : null,
        age,
        // remove anything that is not a number
        formattedPhoneNumber: person.phone?.replace(/\D/g, ''),
      };
    }
    const actions = Object.values(get(actionsWithCommentsSelector));
    const comments = get(commentsState);
    const consultations = get(consultationsState);
    const treatments = get(treatmentsState);
    const medicalFiles = [...get(medicalFileState)].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const relsPersonPlace = get(relsPersonPlaceState);
    const places = get(placesObjectSelector);
    const rencontres = get(rencontresState);
    const groups = get(groupsState);

    for (const group of groups) {
      for (const person of group.persons) {
        if (!personsObject[person]) continue;
        personsObject[person].group = group;
      }
    }

    for (const person of persons) {
      if (!person.documents?.length) continue;
      if (!personsObject[person._id].group) continue;
      for (const document of person.documents) {
        if (!document.group) continue;
        for (const personIdInGroup of personsObject[person._id].group.persons) {
          if (personIdInGroup === person._id) continue;
          if (!personsObject[personIdInGroup]) continue;
          if (!personsObject[personIdInGroup].groupDocuments) {
            personsObject[personIdInGroup].groupDocuments = [];
          }
          personsObject[personIdInGroup].groupDocuments.push({ ...document, person: person._id, personPopulated: person });
        }
      }
    }

    for (const action of actions) {
      if (!personsObject[action.person]) continue;
      personsObject[action.person].actions = personsObject[action.person].actions || [];
      personsObject[action.person].actions.push(action);
      if (!!action.group) {
        const group = personsObject[action.person].group;
        if (!group) continue;
        for (const person of group.persons) {
          if (!personsObject[person]) continue;
          if (person === action.person) continue;
          personsObject[person].actions = personsObject[person].actions || [];
          personsObject[person].actions.push(action);
        }
      }
    }
    for (const [index, comment] of Object.entries(comments)) {
      if (!personsObject[comment.person]) continue;
      personsObject[comment.person].comments = personsObject[comment.person].comments || [];
      personsObject[comment.person].comments.push(comment);
      if (!!comment.group) {
        const group = personsObject[comment.person].group;
        if (!group) continue;
        for (const person of group.persons) {
          if (!personsObject[person]) continue;
          if (person === comment.person) continue;
          personsObject[person].comments = personsObject[person].comments || [];
          personsObject[person].comments.push(comment);
        }
      }
    }
    for (const relPersonPlace of relsPersonPlace) {
      if (!personsObject[relPersonPlace.person]) continue;
      const place = places[relPersonPlace.place];
      if (!place) continue;
      personsObject[relPersonPlace.person].places = personsObject[relPersonPlace.person].places || [];
      personsObject[relPersonPlace.person].places.push(place.name);
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
      if (personsObject[medicalFile.person].medicalFile) {
        const nextDocuments = {};
        const nextComments = {};
        const existingMedicalFile = personsObject[medicalFile.person].medicalFile;
        for (const document of medicalFile.documents || []) {
          nextDocuments[document._id] = document;
        }
        for (const document of existingMedicalFile.documents || []) {
          nextDocuments[document._id] = document;
        }
        for (const comment of medicalFile.comments || []) {
          nextComments[comment._id] = comment;
        }
        for (const comment of existingMedicalFile.comments || []) {
          nextComments[comment._id] = comment;
        }
        personsObject[medicalFile.person].medicalFile = {
          ...medicalFile,
          ...personsObject[medicalFile.person].medicalFile,
          documents: Object.values(nextDocuments),
          comments: Object.values(nextComments),
        };
      } else {
        personsObject[medicalFile.person].medicalFile = medicalFile;
      }
    }
    // we don't use passages in the app - no use, no load
    // but we keep it here just to be aware of that app specificity

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
    return personsObject;
  },
});

export const arrayOfitemsGroupedByPersonSelector = selector({
  key: 'arrayOfitemsGroupedByPersonSelector',
  get: ({ get }) => {
    const itemsGroupedByPerson = get(itemsGroupedByPersonSelector);
    return Object.values(itemsGroupedByPerson).sort((a, b) => (a.nameNormalized > b.nameNormalized ? 1 : -1));
  },
});

export const personsSearchSelector = selectorFamily({
  key: 'personsSearchSelector',
  get:
    ({ search = '' }) =>
    ({ get }) => {
      const persons = get(arrayOfitemsGroupedByPersonSelector);
      if (!search?.length) return persons;
      const filteredPersons = filterBySearch(search, persons);
      return filteredPersons;
    },
});

export const itemsGroupedByActionSelector = selector({
  key: 'itemsGroupedByActionSelector',
  get: ({ get }) => {
    const actionsWithCommentsObject = get(actionsWithCommentsSelector);
    const personsObject = get(itemsGroupedByPersonSelector);

    const actionsObject = {};
    for (const actionId of Object.keys(actionsWithCommentsObject)) {
      const action = actionsWithCommentsObject[actionId];
      actionsObject[actionId] = { ...action, personPopulated: personsObject[action.person] };
    }
    return actionsObject;
  },
});

export const actionsForCurrentTeamSelector = selector({
  key: 'actionsForCurrentTeamSelector',
  get: ({ get }) => {
    const actions = get(actionsState);
    const currentTeam = get(currentTeamState);
    const filteredActions = actions.filter((a) => (Array.isArray(a.teams) ? a.teams.includes(currentTeam?._id) : a.team === currentTeam?._id));
    return filteredActions;
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
    return [
      ...actions,
      { type: 'title', title: section.title, _id: section.title },
      ...section.data.sort((a, b) => new Date(b.dueAt) - new Date(a.dueAt)),
    ];
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

const consultationsForCurrentTeamSelector = selector({
  key: 'consultationsForCurrentTeamSelector',
  get: ({ get }) => {
    const consultations = get(consultationsState);
    const currentTeam = get(currentTeamState);
    const filteredConsultations = consultations
      .filter((consultation) => {
        if (!consultation.teams?.length) return true;
        return consultation.teams.includes(currentTeam._id);
      })
      .map((c) => ({ ...c, isConsultation: true }));
    return filteredConsultations;
  },
});

const actionsAndConsultationsSelector = selector({
  key: 'actionsAndConsultationsSelector',
  get: ({ get }) => {
    const actions = get(actionsForCurrentTeamSelector);
    const consultations = get(consultationsForCurrentTeamSelector);
    const merged = [...actions, ...consultations];
    return merged;
  },
});

export const actionsDoneSelector = selector({
  key: 'actionsDoneSelector',
  get: ({ get }) => {
    const actions = get(actionsAndConsultationsSelector);
    const filteredActions = actions.filter((a) => a.status === DONE).sort(sortDoneOrCancel);
    return filteredActions;
  },
});

export const actionsDoneSelectorSliced = selectorFamily({
  key: 'actionsDoneSelectorSliced',
  get:
    ({ limit }) =>
    ({ get }) => {
      const actionsDone = get(actionsDoneSelector);
      const filteredActions = actionsDone.filter((_, index) => index < limit);
      return filteredActions;
    },
});

export const actionsTodoSelector = selector({
  key: 'actionsTodoSelector',
  get: ({ get }) => {
    const actions = get(actionsAndConsultationsSelector);
    const filteredActions = formatData(actions.filter((a) => a.status === TODO));
    return filteredActions;
  },
});

export const actionsCanceledSelector = selector({
  key: 'actionsCanceledSelector',
  get: ({ get }) => {
    const actions = get(actionsAndConsultationsSelector);
    const filteredActions = actions.filter((a) => a.status === CANCEL).sort(sortDoneOrCancel);
    return filteredActions;
  },
});

export const actionsCanceledSelectorSliced = selectorFamily({
  key: 'actionsCanceledSelectorSliced',
  get:
    ({ limit }) =>
    ({ get }) => {
      const actionsCanceled = get(actionsCanceledSelector);
      const filteredActions = actionsCanceled.filter((_, index) => index < limit);
      return filteredActions;
    },
});

export const actionsByStatusSelector = selectorFamily({
  key: 'actionsByStatusSelector',
  get:
    ({ status, limit }) =>
    ({ get }) => {
      if (status === DONE) {
        const actions = get(actionsDoneSelectorSliced({ limit }));
        return actions;
      }
      if (status === TODO) {
        const actions = get(actionsTodoSelector);
        return actions;
      }
      if (status === CANCEL) {
        const actions = get(actionsCanceledSelectorSliced({ limit }));
        return actions;
      }
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
