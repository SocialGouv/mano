import { currentTeamState, teamsState, userState, usersState } from "./auth";
import { personsState } from "./persons";
import { placesState } from "./places";
import { relsPersonPlaceState } from "./relPersonPlace";
import { reportsState } from "./reports";
import { ageFromBirthdateAsYear, dayjsInstance, formatBirthDate, startOfToday } from "../services/date";
import { customFieldsObsSelector, territoryObservationsState } from "./territoryObservations";
import { selector } from "recoil";
import { actionsState } from "./actions";
import { consultationsState } from "./consultations";
import { commentsState } from "./comments";
import { passagesState } from "./passages";
import { medicalFileState } from "./medicalFiles";
import { treatmentsState } from "./treatments";
import { rencontresState } from "./rencontres";
import { groupsState } from "./groups";

const tomorrow = dayjsInstance().add(1, "day").format("YYYY-MM-DD");

const usersObjectSelector = selector({
  key: "usersObjectSelector",
  get: ({ get }) => {
    const users = get(usersState);
    const usersObject = {};
    for (const user of users) {
      usersObject[user._id] = { ...user };
    }
    return usersObject;
  },
});

export const currentTeamReportsSelector = selector({
  key: "currentTeamReportsSelector",
  get: ({ get }) => {
    const reports = get(reportsState);
    const currentTeam = get(currentTeamState);
    return reports.filter((a) => a.team === currentTeam?._id);
  },
});

const actionsWithCommentsSelector = selector({
  key: "actionsWithCommentsSelector",
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
  key: "placesObjectSelector",
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
  key: "personsObjectSelector",
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
  key: "itemsGroupedByPersonSelector",
  get: ({ get }) => {
    const persons = get(personsState);
    const personsObject = {};
    const user = get(userState);
    const allTeams = get(teamsState);
    const allTeamIds = allTeams.map((t) => t._id);
    const usersObject = get(usersObjectSelector);
    for (const person of persons) {
      let latestTeamFilteringItem = {
        date: startOfToday().toISOString(),
        assignedTeams: person.assignedTeams?.length ? person.assignedTeams : allTeamIds,
        outOfActiveList: person.outOfActiveList, // organisation level
        def: "today",
      };
      personsObject[person._id] = {
        ...person,
        followedSince: person.followedSince || person.createdAt,
        userPopulated: usersObject[person.user],
        formattedBirthDate: formatBirthDate(person.birthdate),
        age: ageFromBirthdateAsYear(person.birthdate),
        formattedPhoneNumber: person.phone?.replace(/\D/g, ""),
        interactions: [person.followedSince || person.createdAt],
        lastUpdateCheckForGDPR: person.followedSince || person.createdAt,
        // BUG FIX: we used to set an `outOfActiveListDate` even if `outOfActiveList` was false.
        // https://github.com/SocialGouv/mano/blob/34a86a3e6900b852e0b3fe828a03e6721d200973/dashboard/src/scenes/person/OutOfActiveList.js#L22
        // This was causing a bug in the "person suivies" stats, where people who were not out of active list were counted as out of active list.
        outOfActiveListDate: person.outOfActiveList ? person.outOfActiveListDate : null,
        forTeamFiltering: [latestTeamFilteringItem],
      };
      if (person.history?.length) {
        for (const historyEntry of person.history) {
          personsObject[person._id].interactions.push(historyEntry.date);
          if (historyEntry.data.assignedTeams) {
            let nextTeamFilteringItem = {
              date: dayjsInstance(historyEntry.date).startOf("day").toISOString(),
              assignedTeams: historyEntry.data.assignedTeams.newValue?.length ? historyEntry.data.assignedTeams.newValue : allTeamIds,
              outOfActiveList: latestTeamFilteringItem.outOfActiveList,
              def: "change-teams",
            };
            latestTeamFilteringItem = nextTeamFilteringItem;
            personsObject[person._id].forTeamFiltering.push(nextTeamFilteringItem);
          }
        }
      }
      personsObject[person._id].forTeamFiltering.push({
        date: person.createdAt,
        assignedTeams: latestTeamFilteringItem.assignedTeams,
        outOfActiveList: latestTeamFilteringItem.outOfActiveList,
        def: "created",
      });
    }
    const actions = Object.values(get(actionsWithCommentsSelector));
    const comments = get(commentsState);
    const consultations = get(consultationsState);
    const treatments = get(treatmentsState);
    const medicalFiles = [...get(medicalFileState)].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
      const documentsForModule = [];
      for (const document of person.documents) {
        const documentForModule = {
          ...document,
          type: document.type ?? "document", // or 'folder'
          linkedItem: {
            _id: person._id,
            type: "person",
          },
        };
        documentsForModule.push(documentForModule);
        personsObject[person._id].interactions.push(document.createdAt);
        if (!document.group) continue;
        if (!personsObject[person._id].group) continue;
        for (const personIdInGroup of personsObject[person._id].group.persons) {
          if (personIdInGroup === person._id) continue;
          if (!personsObject[personIdInGroup]) continue;
          if (!personsObject[personIdInGroup].groupDocuments) {
            personsObject[personIdInGroup].groupDocuments = [];
          }
          personsObject[personIdInGroup].groupDocuments.push(documentForModule);
        }
      }
      personsObject[person._id].documentsForModule = documentsForModule;
    }

    // to dispatch comments efficiently
    const personPerAction = {};

    for (const action of actions) {
      if (!personsObject[action.person]) continue;
      personPerAction[action._id] = action.person;
      personsObject[action.person].actions = personsObject[action.person].actions || [];
      personsObject[action.person].actions.push(action);
      personsObject[action.person].interactions.push(action.dueAt);
      personsObject[action.person].interactions.push(action.createdAt);
      personsObject[action.person].interactions.push(action.completedAt);
      if (action.group) {
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
      if (comment.action) {
        const person = personPerAction[comment.action];
        if (!person) continue;
        if (!personsObject[person]) continue;
        personsObject[person].comments = personsObject[person].comments || [];
        personsObject[person].comments.push({ ...comment, type: "action", date: comment.date || comment.createdAt });
        continue;
      }
      if (!personsObject[comment.person]) continue;
      personsObject[comment.person].comments = personsObject[comment.person].comments || [];
      personsObject[comment.person].comments.push({ ...comment, type: "person", date: comment.date || comment.createdAt });
      personsObject[comment.person].interactions.push(comment.date || comment.createdAt);
      if (comment.group) {
        const group = personsObject[comment.person].group;
        if (!group) continue;
        for (const person of group.persons) {
          if (!personsObject[person]) continue;
          if (person === comment.person) continue;
          personsObject[person].comments = personsObject[person].comments || [];
          personsObject[person].comments.push({ ...comment, type: "person", date: comment.date || comment.createdAt });
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
      personsObject[relPersonPlace.person].interactions.push(relPersonPlace.createdAt);
    }
    for (const consultation of consultations) {
      if (!personsObject[consultation.person]) continue;
      personsObject[consultation.person].consultations = personsObject[consultation.person].consultations || [];
      personsObject[consultation.person].consultations.push(consultation);
      personsObject[consultation.person].hasAtLeastOneConsultation = true;
      personsObject[consultation.person].interactions.push(consultation.dueAt);
      personsObject[consultation.person].interactions.push(consultation.createdAt);
      personsObject[consultation.person].interactions.push(consultation.completedAt);
      const consultationIsVisibleByMe = consultation.onlyVisibleBy.length === 0 || consultation.onlyVisibleBy.includes(user._id);
      for (const comment of consultation.comments || []) {
        personsObject[consultation.person].interactions.push(comment.date);
        if (!consultationIsVisibleByMe) continue;
        personsObject[consultation.person].commentsMedical = personsObject[consultation.person].commentsMedical || [];
        personsObject[consultation.person].commentsMedical.push({
          ...comment,
          consultation,
          person: consultation.person,
          type: "consultation",
        });
      }
    }
    for (const treatment of treatments) {
      if (!personsObject[treatment.person]) continue;
      personsObject[treatment.person].treatments = personsObject[treatment.person].treatments || [];
      personsObject[treatment.person].treatments.push(treatment);
      personsObject[treatment.person].interactions.push(treatment.createdAt);
      for (const comment of treatment.comments || []) {
        personsObject[treatment.person].interactions.push(comment.date);
        personsObject[treatment.person].commentsMedical = personsObject[treatment.person].commentsMedical || [];
        personsObject[treatment.person].commentsMedical.push({
          ...comment,
          treatment,
          person: treatment.person,
          type: "treatment",
        });
      }
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
      personsObject[medicalFile.person].interactions.push(medicalFile.createdAt);
      for (const comment of medicalFile.comments || []) {
        personsObject[medicalFile.person].interactions.push(comment.date);
        personsObject[medicalFile.person].commentsMedical = personsObject[medicalFile.person].commentsMedical || [];
        personsObject[medicalFile.person].commentsMedical.push({
          ...comment,
          person: medicalFile.person,
          type: "medical-file",
        });
      }
    }
    for (const passage of passages) {
      if (!personsObject[passage.person]) continue;
      personsObject[passage.person].passages = personsObject[passage.person].passages || [];
      personsObject[passage.person].passages.push({
        ...passage,
        type: "Non-anonyme",
        gender: personsObject[passage.person]?.gender || "Non renseigné",
      });
      personsObject[passage.person].interactions.push(passage.date || passage.createdAt);
      if (passage.comment) {
        personsObject[passage.person].comments = personsObject[passage.person].comments || [];
        personsObject[passage.person].comments.push({
          comment: passage.comment,
          type: "passage",
          team: passage.team,
          person: passage.person,
          passage: passage._id,
          date: passage.date,
          user: passage.user,
          _id: passage.date + passage._id,
        });
      }
    }
    for (const rencontre of rencontres) {
      if (!personsObject[rencontre.person]) continue;
      personsObject[rencontre.person].rencontres = personsObject[rencontre.person].rencontres || [];
      personsObject[rencontre.person].rencontres.push(rencontre);
      personsObject[rencontre.person].interactions.push(rencontre.date || rencontre.createdAt);
      if (rencontre.comment) {
        personsObject[rencontre.person].comments = personsObject[rencontre.person].comments || [];
        personsObject[rencontre.person].comments.push({
          comment: rencontre.comment,
          type: "rencontre",
          rencontre: rencontre._id,
          person: rencontre.person,
          team: rencontre.team,
          user: rencontre.user,
          date: rencontre.date,
          _id: rencontre.date + rencontre._id,
        });
      }
    }

    for (const personId of Object.keys(personsObject)) {
      personsObject[personId].interactions = [
        ...new Set(
          personsObject[personId].interactions.sort((a, b) => {
            // sort by date descending: the latest date at 0
            if (a > b) return -1;
            if (a < b) return 1;
            return 0;
          })
        ),
        // Some interactions may contain undefined values, such as dueAt for an action that is not completed yet. We filter them out.
        // We could have done it before by checking with 'if' but it would have made more conditions in loops.
        // If we do not filter them, when comparing for date periods in stats, we would have to check for undefined,
        // otherwise we would have a bug that consider everybody "person suivies" in every period.
      ].filter((i) => Boolean(i));

      personsObject[personId].lastUpdateCheckForGDPR = personsObject[personId].interactions.filter((a) => a < tomorrow)[0];
    }
    return personsObject;
  },
});

export const arrayOfitemsGroupedByPersonSelector = selector({
  key: "arrayOfitemsGroupedByPersonSelector",
  get: ({ get }) => {
    const itemsGroupedByPerson = get(itemsGroupedByPersonSelector);
    return Object.values(itemsGroupedByPerson);
  },
});

export const personsWithMedicalFileMergedSelector = selector({
  key: "personsWithMedicalFileMergedSelector",
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

export const personsForStatsSelector = selector({
  key: "personsForStatsSelector",
  get: ({ get }) => {
    const persons = get(arrayOfitemsGroupedByPersonSelector);
    return persons.map((p) => ({
      ...(p.medicalFile || {}),
      ...p,
    }));
  },
});

const personsWithPlacesSelector = selector({
  key: "personsWithPlacesSelector",
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

export const itemsGroupedByActionSelector = selector({
  key: "itemsGroupedByActionSelector",
  get: ({ get }) => {
    const actionsWithCommentsObject = get(actionsWithCommentsSelector);
    const personsWithPlacesObject = get(personsWithPlacesSelector);
    const usersObject = get(usersObjectSelector);

    const actionsObject = {};
    for (const actionId of Object.keys(actionsWithCommentsObject)) {
      const action = actionsWithCommentsObject[actionId];
      actionsObject[actionId] = {
        ...action,
        personPopulated: personsWithPlacesObject[action.person],
        userPopulated: action.user ? usersObject[action.user] : null,
      };
    }
    return actionsObject;
  },
});

export const arrayOfitemsGroupedByActionSelector = selector({
  key: "arrayOfitemsGroupedByActionSelector",
  get: ({ get }) => {
    const itemsGroupedByAction = get(itemsGroupedByActionSelector);
    const itemsGroupedByActionArray = Object.values(itemsGroupedByAction);
    return itemsGroupedByActionArray;
  },
});

export const itemsGroupedByConsultationSelector = selector({
  key: "itemsGroupedByConsultationSelector",
  get: ({ get }) => {
    const consultations = get(consultationsState);
    const personsWithPlacesObject = get(personsWithPlacesSelector);
    const usersObject = get(usersObjectSelector);

    const consultationObject = {};
    for (const consultation of consultations) {
      consultationObject[consultation._id] = {
        ...consultation,
        personPopulated: personsWithPlacesObject[consultation.person],
        userPopulated: consultation.user ? usersObject[consultation.user] : null,
      };
    }
    return consultationObject;
  },
});

export const arrayOfitemsGroupedByConsultationSelector = selector({
  key: "arrayOfitemsGroupedByConsultationSelector",
  get: ({ get }) => {
    const itemsGroupedByConsultation = get(itemsGroupedByConsultationSelector);
    const itemsGroupedByConsultationArray = Object.values(itemsGroupedByConsultation);
    return itemsGroupedByConsultationArray;
  },
});

export const itemsGroupedByTreatmentSelector = selector({
  key: "itemsGroupedByTreatmentSelector",
  get: ({ get }) => {
    const treatments = get(treatmentsState);
    const personsWithPlacesObject = get(personsWithPlacesSelector);
    const usersObject = get(usersObjectSelector);

    const treatmentsObject = {};
    for (const treatment of treatments) {
      treatmentsObject[treatment._id] = {
        ...treatment,
        personPopulated: personsWithPlacesObject[treatment.person],
        userPopulated: treatment.user ? usersObject[treatment.user] : null,
      };
    }
    return treatmentsObject;
  },
});

export const onlyFilledObservationsTerritories = selector({
  key: "onlyFilledObservationsTerritories",
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
        if (observationsKeyLabels[key]) {
          if (obs[key] != null) obsWithOnlyFilledFields[key] = obs[key];
        } else {
          obsWithOnlyFilledFields[key] = obs[key];
        }
      }
      const nextObs = { _id: obs._id, territory: obs.territory, ...obsWithOnlyFilledFields };
      return nextObs;
    });
  },
});

export const populatedPassagesSelector = selector({
  key: "populatedPassagesSelector",
  get: ({ get }) => {
    const passages = get(passagesState);
    const allPersonsAsObject = get(itemsGroupedByPersonSelector);
    return passages
      .map((passage) => {
        if (!!passage.person && !allPersonsAsObject[passage.person]) return null;
        return {
          ...passage,
          type: passage.person ? "Non-anonyme" : "Anonyme",
          gender: !passage.person ? null : allPersonsAsObject[passage.person].gender || "Non renseigné",
        };
      })
      .filter(Boolean);
  },
});
