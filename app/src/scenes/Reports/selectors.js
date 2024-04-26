import { selector, selectorFamily } from 'recoil';
import { actionsState, CANCEL, DONE } from '../../recoil/actions';
import { currentTeamState, userState } from '../../recoil/auth';
import { commentsState } from '../../recoil/comments';
import { reportsState } from '../../recoil/reports';
import { actionsObjectSelector, itemsGroupedByPersonSelector } from '../../recoil/selectors';
import { territoryObservationsState } from '../../recoil/territoryObservations';
import { getIsDayWithinHoursOffsetOfDay } from '../../services/dateDayjs';
import { rencontresState } from '../../recoil/rencontres';
import { passagesState } from '../../recoil/passages';
import { consultationIsVisibleByMe, consultationsState } from '../../recoil/consultations';

export const currentTeamReportsSelector = selector({
  key: 'currentTeamReportsSelector',
  get: ({ get }) => {
    const reports = get(reportsState);
    const currentTeam = get(currentTeamState);
    return reports.filter((r) => r.team === currentTeam._id);
  },
});

export const actionsForReport = selectorFamily({
  key: 'actionsForReport',
  get:
    ({ date }) =>
    ({ get }) => {
      const actions = get(actionsState);
      const currentTeam = get(currentTeamState);
      const actionsCreated = [];
      const actionsCompleted = [];
      const actionsCanceled = [];
      for (const action of actions) {
        const isInTeam = Array.isArray(action.teams) ? action.teams.includes(currentTeam._id) : action.team === currentTeam._id;
        if (!isInTeam) continue;
        const isCreatedToday = getIsDayWithinHoursOffsetOfDay(action.createdAt, date, currentTeam?.nightSession ? 12 : 0);
        const isCompletedToday = getIsDayWithinHoursOffsetOfDay(action.completedAt, date, currentTeam?.nightSession ? 12 : 0);
        if (isCreatedToday && !isCompletedToday) {
          actionsCreated.push(action);
          continue;
        }
        if (!isCompletedToday) continue;
        if (action.status === CANCEL) actionsCanceled.push(action);
        if (action.status === DONE) actionsCompleted.push(action);
      }
      return { actionsCreated, actionsCompleted, actionsCanceled };
    },
});

export const consultationsForReport = selectorFamily({
  key: 'consultationsForReport',
  get:
    ({ date }) =>
    ({ get }) => {
      const consultations = get(consultationsState);
      const currentTeam = get(currentTeamState);
      const user = get(userState);
      const consultationsCreated = [];
      const consultationsCompleted = [];
      const consultationsCanceled = [];
      for (const consultation of consultations) {
        const isVisibleByMe = consultationIsVisibleByMe(consultation, user);
        if (!isVisibleByMe) continue;
        const isInTeam = Array.isArray(consultation.teams) ? consultation.teams.includes(currentTeam._id) : consultation.team === currentTeam._id;
        if (!isInTeam) continue;
        const isCreatedToday = getIsDayWithinHoursOffsetOfDay(consultation.createdAt, date, currentTeam?.nightSession ? 12 : 0);
        const isCompletedToday = getIsDayWithinHoursOffsetOfDay(consultation.completedAt, date, currentTeam?.nightSession ? 12 : 0);
        if (isCreatedToday && !isCompletedToday) {
          consultationsCreated.push(consultation);
          continue;
        }
        if (!isCompletedToday) continue;
        if (consultation.status === CANCEL) consultationsCanceled.push(consultation);
        if (consultation.status === DONE) consultationsCompleted.push(consultation);
      }
      return { consultationsCreated, consultationsCompleted, consultationsCanceled };
    },
});

export const commentsForReport = selectorFamily({
  key: 'commentsForReport',
  get:
    ({ date }) =>
    ({ get }) => {
      const actions = get(actionsObjectSelector);
      const persons = get(itemsGroupedByPersonSelector);
      const comments = get(commentsState);
      const currentTeam = get(currentTeamState);
      const filteredComments = [];
      for (const comment of comments) {
        if (comment.team !== currentTeam._id) continue;
        if (!getIsDayWithinHoursOffsetOfDay(comment.date || comment.createdAt, date, currentTeam?.nightSession ? 12 : 0)) continue;
        if (!comment.person && !comment.action) continue;
        if (comment.person) {
          filteredComments.push({
            ...comment,
            person: persons[comment.person],
            type: 'person',
          });
        }
        if (comment.action) {
          const action = actions[comment.action];
          filteredComments.push({
            ...comment,
            action,
            personPopulated: persons[action.person],
            type: 'action',
          });
        }
      }
      return filteredComments;
    },
});

export const observationsForReport = selectorFamily({
  key: 'observationsForReport',
  get:
    ({ date }) =>
    ({ get }) => {
      const territoryObservations = get(territoryObservationsState);
      const currentTeam = get(currentTeamState);
      const filteredObservations = [];
      for (const observation of territoryObservations) {
        if (observation.team !== currentTeam._id) continue;
        if (!getIsDayWithinHoursOffsetOfDay(observation.observedAt || observation.createdAt, date, currentTeam?.nightSession ? 12 : 0)) continue;
        filteredObservations.push(observation);
      }
      return filteredObservations;
    },
});

export const rencontresForReport = selectorFamily({
  key: 'rencontresForReport',
  get:
    ({ date }) =>
    ({ get }) => {
      const rencontres = get(rencontresState);
      const currentTeam = get(currentTeamState);
      const filteredRencontres = [];
      for (const rencontre of rencontres) {
        if (rencontre.team !== currentTeam._id) continue;
        if (!getIsDayWithinHoursOffsetOfDay(rencontre.observedAt || rencontre.createdAt, date, currentTeam?.nightSession ? 12 : 0)) continue;
        filteredRencontres.push(rencontre);
      }
      return filteredRencontres;
    },
});

export const passagesForReport = selectorFamily({
  key: 'passagesForReport',
  get:
    ({ date }) =>
    ({ get }) => {
      const passages = get(passagesState);
      const currentTeam = get(currentTeamState);
      const filteredPassages = [];
      for (const passage of passages) {
        if (passage.team !== currentTeam._id) continue;
        if (!getIsDayWithinHoursOffsetOfDay(passage.observedAt || passage.createdAt, date, currentTeam?.nightSession ? 12 : 0)) continue;
        filteredPassages.push(passage);
      }
      return filteredPassages;
    },
});
