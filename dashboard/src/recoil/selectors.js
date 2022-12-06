import { currentTeamState, userState } from './auth';
import { personsState } from './persons';
import { placesState } from './places';
import { relsPersonPlaceState } from './relPersonPlace';
import { reportsState } from './reports';
import { isOnSameDay } from '../services/date';
import { customFieldsObsSelector, territoryObservationsState } from './territoryObservations';
import { selector, selectorFamily } from 'recoil';
import { actionsState } from './actions';
import { consultationsState } from './consultations';
import { commentsState } from './comments';
import { passagesState } from './passages';
import { medicalFileState } from './medicalFiles';
import { treatmentsState } from './treatments';
import { rencontresState } from './rencontres';
import { groupsState } from './groups';

export const currentTeamReportsSelector = selector({
  key: 'currentTeamReportsSelector',
  get: ({ get }) => {
    const reports = get(reportsState);
    const currentTeam = get(currentTeamState);
    return reports.filter((a) => a.team === currentTeam?._id);
  },
});

export const selectedTeamsReportsSelector = selectorFamily({
  key: 'selectedTeamsReportsSelector',
  get:
    ({ teamIds }) =>
    ({ get }) => {
      const reports = get(reportsState);
      return reports.filter((a) => teamIds.includes(a.team));
    },
});

export const reportPerDateSelector = selectorFamily({
  key: 'reportPerDateSelector',
  get:
    ({ date }) =>
    ({ get }) => {
      const teamsReports = get(currentTeamReportsSelector);
      return teamsReports.find((rep) => isOnSameDay(rep.date, date));
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
    const persons = get(personsState);
    const personsObject = {};
    const user = get(userState);
    for (const person of persons) {
      personsObject[person._id] = { ...person };
    }
    const actions = Object.values(get(actionsWithCommentsSelector));
    const comments = get(commentsState);
    const consultations = get(consultationsState);
    const treatments = get(treatmentsState);
    const medicalFiles = get(medicalFileState);
    const passages = get(passagesState);
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
    for (const comment of comments) {
      if (!personsObject[comment.person]) continue;
      personsObject[comment.person].comments = personsObject[comment.person].comments || [];
      personsObject[comment.person].comments.push(comment);
      if (!!comment.group) {
        const group = personsObject[comment.person].group;
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
    if (user.healthcareProfessional) {
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
    }
    for (const passage of passages) {
      if (!personsObject[passage.person]) continue;
      personsObject[passage.person].passages = personsObject[passage.person].passages || [];
      personsObject[passage.person].passages.push(passage);
    }
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
    return Object.values(itemsGroupedByPerson);
  },
});

export const personsWithMedicalFileMergedSelector = selector({
  key: 'personsWithMedicalFileMergedSelector',
  get: ({ get }) => {
    const user = get(userState);
    const persons = get(arrayOfitemsGroupedByPersonSelector);
    if (!user.healthcareProfessional) return persons;
    return persons.map((p) => ({
      ...(p.medicalFile || {}),
      ...p,
    }));
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
