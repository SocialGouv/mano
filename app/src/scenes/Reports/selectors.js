import { selector, selectorFamily } from 'recoil';
import { CANCEL, DONE } from '../../recoil/actions';
import { currentTeamState, userState } from '../../recoil/auth';
import { commentsState } from '../../recoil/comments';
import { reportsState } from '../../recoil/reports';
import {
  actionsForCurrentTeamSelector,
  actionsObjectSelector,
  consultationsForCurrentTeamSelector,
  itemsGroupedByPersonSelector,
} from '../../recoil/selectors';
import { territoryObservationsState } from '../../recoil/territoryObservations';
import { getDayWithOffset } from '../../services/dateDayjs';
import { rencontresState } from '../../recoil/rencontres';
import { passagesState } from '../../recoil/passages';
import { consultationIsVisibleByMe } from '../../recoil/consultations';

export const currentTeamReportsSelector = selector({
  key: 'currentTeamReportsSelector',
  get: ({ get }) => {
    const reports = get(reportsState);
    const currentTeam = get(currentTeamState);
    return reports.filter((r) => r.team === currentTeam._id);
  },
});

function emptyItemsForReport() {
  return {
    actionsCreated: [],
    actionsCompleted: [],
    actionsCanceled: [],
    consultationsCreated: [],
    consultationsCompleted: [],
    consultationsCanceled: [],
    comments: [],
    observations: [],
    passages: [],
    rencontres: [],
    report: null,
  };
}

export const itemsGroupedDateSelector = selector({
  key: 'itemsGroupedDateSelector',
  get: ({ get }) => {
    const currentTeam = get(currentTeamState);
    const itemsGroupedByDate = {};
    const user = get(userState);
    const persons = get(itemsGroupedByPersonSelector);

    const reports = get(currentTeamReportsSelector);
    const actions = get(actionsForCurrentTeamSelector);
    const actionsObject = get(actionsObjectSelector);
    const consultations = get(consultationsForCurrentTeamSelector);
    const comments = get(commentsState);
    const rencontres = get(rencontresState);
    const passages = get(passagesState);
    const territoryObservations = get(territoryObservationsState);

    for (const report of reports) {
      if (report.team !== currentTeam._id) continue;
      const date = getDayWithOffset(report.date, currentTeam.nightSession ? 12 : 0);
      if (!date) continue;
      if (!itemsGroupedByDate[date]) {
        itemsGroupedByDate[date] = emptyItemsForReport();
      }
      itemsGroupedByDate[date].report = report;
    }

    for (const action of actions) {
      const teams = Array.isArray(action.teams) ? action.teams : [action.team];
      for (const team of teams) {
        if (team !== currentTeam._id) continue;
        const created = getDayWithOffset(action.createdAt, currentTeam.nightSession ? 12 : 0);
        const completed = getDayWithOffset(action.completedAt, currentTeam.nightSession ? 12 : 0);
        if (!itemsGroupedByDate[created]) {
          itemsGroupedByDate[created] = emptyItemsForReport();
        }
        itemsGroupedByDate[created].actionsCreated.push(action);
        if (completed) {
          if (!itemsGroupedByDate[completed]) {
            itemsGroupedByDate[completed] = emptyItemsForReport();
          }
          if (action.status === CANCEL) itemsGroupedByDate[completed].actionsCanceled.push(action);
          if (action.status === DONE) itemsGroupedByDate[completed].actionsCompleted.push(action);
        }
      }
    }

    for (const consultation of consultations) {
      const isVisibleByMe = consultationIsVisibleByMe(consultation, user);
      if (!isVisibleByMe) continue;
      const teams = Array.isArray(consultation.teams) ? consultation.teams : [consultation.team];
      for (const team of teams) {
        if (team !== currentTeam._id) continue;
        const created = getDayWithOffset(consultation.createdAt, currentTeam.nightSession ? 12 : 0);
        const completed = getDayWithOffset(consultation.completedAt, currentTeam.nightSession ? 12 : 0);
        if (!itemsGroupedByDate) continue;
        if (!itemsGroupedByDate[created]) {
          itemsGroupedByDate[created] = emptyItemsForReport();
        }
        itemsGroupedByDate[created].consultationsCreated.push(consultation);
        if (completed) {
          if (!itemsGroupedByDate[completed]) {
            itemsGroupedByDate[completed] = emptyItemsForReport();
          }
          if (consultation.status === CANCEL) itemsGroupedByDate[completed].consultationsCompleted.push(consultation);
          if (consultation.status === DONE) itemsGroupedByDate[completed].consultationsCanceled.push(consultation);
        }
      }
    }
    for (const comment of comments) {
      if (comment.team !== currentTeam._id) continue;
      if (!comment.person && !comment.action) continue;
      const date = getDayWithOffset(comment.date || comment.createdAt, currentTeam.nightSession ? 12 : 0);
      if (!date) continue;
      if (!itemsGroupedByDate[date]) {
        itemsGroupedByDate[date] = emptyItemsForReport();
      }
      if (comment.person) {
        itemsGroupedByDate[date].comments.push({
          ...comment,
          person: persons[comment.person],
          type: 'person',
        });
      }
      if (comment.action) {
        const action = actionsObject[comment.action];
        itemsGroupedByDate[date].comments.push({
          ...comment,
          action,
          personPopulated: persons[action.person],
          type: 'action',
        });
      }
    }

    for (const passage of passages) {
      if (passage.team !== currentTeam._id) continue;
      if (!passage.person) continue;
      const date = getDayWithOffset(passage.date || passage.createdAt, currentTeam.nightSession ? 12 : 0);
      if (!date) continue;
      if (!itemsGroupedByDate[date]) {
        itemsGroupedByDate[date] = emptyItemsForReport();
      }
      itemsGroupedByDate[date].passages.push(passage);
    }

    for (const rencontre of rencontres) {
      if (rencontre.team !== currentTeam._id) continue;
      if (!rencontre.person) continue;
      const date = getDayWithOffset(rencontre.date || rencontre.createdAt, currentTeam.nightSession ? 12 : 0);
      if (!date) continue;
      if (!itemsGroupedByDate[date]) {
        itemsGroupedByDate[date] = emptyItemsForReport();
      }
      itemsGroupedByDate[date].passages.push(rencontre);
    }

    for (const observation of territoryObservations) {
      if (observation.team !== currentTeam._id) continue;
      const date = getDayWithOffset(observation.observedAt || observation.createdAt, currentTeam.nightSession ? 12 : 0);
      if (!date) continue;
      if (!itemsGroupedByDate[date]) {
        itemsGroupedByDate[date] = emptyItemsForReport();
      }
      itemsGroupedByDate[date].observations.push(observation);
    }

    return itemsGroupedByDate;
  },
});

export const actionsForReport = selectorFamily({
  key: 'actionsForReport',
  get:
    ({ date }) =>
    ({ get }) => {
      const itemsGroupedByDate = get(itemsGroupedDateSelector);
      return {
        actionsCreated: itemsGroupedByDate[date]?.actionsCreated || [],
        actionsCompleted: itemsGroupedByDate[date]?.actionsCompleted || [],
        actionsCanceled: itemsGroupedByDate[date]?.actionsCanceled || [],
      };
    },
});

export const consultationsForReport = selectorFamily({
  key: 'consultationsForReport',
  get:
    ({ date }) =>
    ({ get }) => {
      const itemsGroupedByDate = get(itemsGroupedDateSelector);
      return {
        consultationsCreated: itemsGroupedByDate[date]?.consultationsCreated || [],
        consultationsCompleted: itemsGroupedByDate[date]?.consultationsCompleted || [],
        consultationsCanceled: itemsGroupedByDate[date]?.consultationsCanceled || [],
      };
    },
});

export const commentsForReport = selectorFamily({
  key: 'commentsForReport',
  get:
    ({ date }) =>
    ({ get }) => {
      const itemsGroupedByDate = get(itemsGroupedDateSelector);
      return itemsGroupedByDate[date]?.comments || [];
    },
});

export const observationsForReport = selectorFamily({
  key: 'observationsForReport',
  get:
    ({ date }) =>
    ({ get }) => {
      const itemsGroupedByDate = get(itemsGroupedDateSelector);
      return itemsGroupedByDate[date]?.observations || [];
    },
});

export const rencontresForReport = selectorFamily({
  key: 'rencontresForReport',
  get:
    ({ date }) =>
    ({ get }) => {
      const itemsGroupedByDate = get(itemsGroupedDateSelector);
      return itemsGroupedByDate[date]?.rencontres || [];
    },
});

export const passagesForReport = selectorFamily({
  key: 'passagesForReport',
  get:
    ({ date }) =>
    ({ get }) => {
      const itemsGroupedByDate = get(itemsGroupedDateSelector);
      return itemsGroupedByDate[date]?.passages || [];
    },
});
