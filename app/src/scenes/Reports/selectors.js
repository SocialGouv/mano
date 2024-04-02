import { selector, selectorFamily } from 'recoil';
import { actionsState } from '../../recoil/actions';
import { currentTeamState } from '../../recoil/auth';
import { commentsState } from '../../recoil/comments';
import { reportsState } from '../../recoil/reports';
import { actionsObjectSelector, itemsGroupedByPersonSelector } from '../../recoil/selectors';
import { territoryObservationsState } from '../../recoil/territoryObservations';
import { getIsDayWithinHoursOffsetOfDay } from '../../services/dateDayjs';
import { rencontresState } from '../../recoil/rencontres';

export const currentTeamReportsSelector = selector({
  key: 'currentTeamReportsSelector',
  get: ({ get }) => {
    const reports = get(reportsState);
    const currentTeam = get(currentTeamState);
    return reports.filter((r) => r.team === currentTeam._id);
  },
});

export const actionsCreatedForReport = selectorFamily({
  key: 'actionsCreatedForReport',
  get:
    ({ date }) =>
    ({ get }) => {
      const actions = get(actionsState);
      const currentTeam = get(currentTeamState);
      const filteredActions = actions
        ?.filter((a) => (Array.isArray(a.teams) ? a.teams.includes(currentTeam?._id) : a.team === currentTeam?._id))
        .filter((a) => getIsDayWithinHoursOffsetOfDay(a.createdAt, date, currentTeam?.nightSession ? 12 : 0))
        .filter((a) => !getIsDayWithinHoursOffsetOfDay(a.completedAt, date, currentTeam?.nightSession ? 12 : 0));
      return filteredActions;
    },
});

export const actionsCompletedOrCanceledForReport = selectorFamily({
  key: 'actionsCompletedOrCanceledForReport',
  get:
    ({ date, status }) =>
    ({ get }) => {
      const actions = get(actionsState);
      const currentTeam = get(currentTeamState);
      const filteredActions = actions
        ?.filter((a) => (Array.isArray(a.teams) ? a.teams.includes(currentTeam?._id) : a.team === currentTeam?._id))
        .filter((a) => a.status === status)
        .filter((a) => getIsDayWithinHoursOffsetOfDay(a.completedAt, date, currentTeam?.nightSession ? 12 : 0));
      return filteredActions;
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
      const filteredComments = comments
        .filter((c) => c.team === currentTeam._id)
        .filter((c) => getIsDayWithinHoursOffsetOfDay(c.date || c.createdAt, date, currentTeam?.nightSession ? 12 : 0))
        .map((comment) => {
          const commentPopulated = { ...comment };
          if (comment.person) {
            const id = comment.person;
            commentPopulated.person = persons[id];
            commentPopulated.type = 'person';
          }
          if (comment.action) {
            const id = comment.action;
            const action = actions[id];
            commentPopulated.action = action;
            commentPopulated.personPopulated = persons[action.person];
            commentPopulated.type = 'action';
          }
          return commentPopulated;
        })
        .filter((c) => c.action || c.person);
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
      return territoryObservations
        .filter((o) => o.team === currentTeam._id)
        .filter((o) => getIsDayWithinHoursOffsetOfDay(o.observedAt || o.createdAt, date, currentTeam?.nightSession ? 12 : 0));
    },
});

export const rencontresForReport = selectorFamily({
  key: 'rencontresForReport',
  get:
    ({ date }) =>
    ({ get }) => {
      const rencontres = get(rencontresState);
      const currentTeam = get(currentTeamState);
      return rencontres
        .filter((o) => o.team === currentTeam._id)
        .filter((o) => getIsDayWithinHoursOffsetOfDay(o.observedAt || o.createdAt, date, currentTeam?.nightSession ? 12 : 0));
    },
});
