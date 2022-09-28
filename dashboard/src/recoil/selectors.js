import { currentTeamState } from './auth';
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

export const currentTeamReportsSelector = selector({
  key: 'currentTeamReportsSelector',
  get: ({ get }) => {
    const reports = get(reportsState);
    const currentTeam = get(currentTeamState);
    return reports.filter((a) => a.team === currentTeam?._id);
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
    console.time('ACTIONS WITH COMMENTS');
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
    console.timeEnd('ACTIONS WITH COMMENTS');
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
    const personsObjectImmutable = get(personsObjectSelector);
    const actions = Object.values(get(actionsWithCommentsSelector));
    const comments = get(commentsState);
    const consultations = get(consultationsState);
    const treatments = get(treatmentsState);
    const medicalFiles = get(medicalFileState);
    const passages = get(passagesState);
    const relsPersonPlace = get(relsPersonPlaceState);
    const places = get(placesObjectSelector);
    const rencontres = get(rencontresState);
    const personsObject = JSON.parse(JSON.stringify(personsObjectImmutable));
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

export const itemsGroupedByActionSelector = selector({
  key: 'itemsGroupedByActionSelector',
  get: ({ get }) => {
    console.time('ITEMS GROUPED BY ACTION');
    console.time('GET ACTIONS WITH COMMENTS');
    const actionsWithCommentsObject = get(actionsWithCommentsSelector);
    console.timeEnd('GET ACTIONS WITH COMMENTS');
    console.time('GET ACTIONS WITH COMMENTS OBJECT');
    console.timeEnd('GET ACTIONS WITH COMMENTS OBJECT');
    console.time('GET PERSONS WITH PLACES OBJECT');
    const personsWithPlacesObject = get(personsWithPlacesSelector);
    console.timeEnd('GET PERSONS WITH PLACES OBJECT');

    console.time('POPULATE ACTIONS');
    const actionsObject = {};
    for (const actionId of Object.keys(actionsWithCommentsObject)) {
      const action = actionsWithCommentsObject[actionId];
      actionsObject[actionId] = { ...action, personPopulated: personsWithPlacesObject[action.person] };
    }
    console.timeEnd('POPULATE ACTIONS');
    console.timeEnd('ITEMS GROUPED BY ACTION');
    return actionsObject;
  },
});

export const arrayOfitemsGroupedByActionSelector = selector({
  key: 'arrayOfitemsGroupedByActionSelector',
  get: ({ get }) => {
    console.time('ITEMS GROUPED BY ACTION ARRAY');
    const itemsGroupedByAction = get(itemsGroupedByActionSelector);
    const itemsGroupedByActionArray = Object.values(itemsGroupedByAction);
    console.timeEnd('ITEMS GROUPED BY ACTION ARRAY');
    return itemsGroupedByActionArray;
  },
});

export const itemsGroupedByConsultationSelector = selector({
  key: 'itemsGroupedByConsultationSelector',
  get: ({ get }) => {
    console.time('ITEMS GROUPED BY CONSULTATION');
    const consultations = get(consultationsState);
    const personsWithPlacesObject = get(personsWithPlacesSelector);

    const consultationObject = {};
    for (const consultation of consultations) {
      consultationObject[consultation._id] = { ...consultation, person: personsWithPlacesObject[consultation.person] };
    }
    console.timeEnd('ITEMS GROUPED BY CONSULTATION');
    return consultationObject;
  },
});

export const arrayOfitemsGroupedByConsultationSelector = selector({
  key: 'arrayOfitemsGroupedByConsultationSelector',
  get: ({ get }) => {
    console.time('ITEMS GROUPED BY CONSULTATION ARRAY');
    const itemsGroupedByConsultation = get(itemsGroupedByConsultationSelector);
    const itemsGroupedByConsultationArray = Object.values(itemsGroupedByConsultation);
    console.timeEnd('ITEMS GROUPED BY CONSULTATION ARRAY');
    return itemsGroupedByConsultationArray;
  },
});

export const personsWithPlacesSelector = selector({
  key: 'personsWithPlacesSelector',
  get: ({ get }) => {
    console.time('PERSONS WITH PLACES');
    const personsObjectImmutable = get(personsObjectSelector);
    const personsObject = JSON.parse(JSON.stringify(personsObjectImmutable));
    const relsPersonPlace = get(relsPersonPlaceState);
    const places = get(placesObjectSelector);

    for (const relPersonPlace of relsPersonPlace) {
      if (!personsObject[relPersonPlace.person]) continue;
      const place = places[relPersonPlace.place];
      if (!place) continue;
      personsObject[relPersonPlace.person].places = personsObject[relPersonPlace.person].places || {};
      personsObject[relPersonPlace.person].places[place._id] = place.name;
    }
    console.timeEnd('PERSONS WITH PLACES');
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
