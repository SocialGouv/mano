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

// we split those "selectors" to help poor machines with heavy calculation
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

export const personsFullPopulatedSelector = selector({
  key: 'personsFullPopulatedSelector',
  get: ({ get }) => {
    const persons = get(personsState);
    const comments = get(commentsState);
    const actions = get(actionsState);
    const relsPersonPlace = get(relsPersonPlaceState);
    const places = get(placesState);
    console.log('get persons');
    return persons.map((p) => ({
      ...p,
      comments: comments.filter((c) => c.person === p._id),
      actions: actions.filter((c) => c.person === p._id).map((a) => ({ ...a, comments: comments.filter((c) => c.action === a._id) })),
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

export const actionsForCurrentTeamSelector = selectorFamily({
  key: 'actionsForCurrentTeamSelector',
  get:
    (forCurrentTeam = true) =>
    ({ get }) => {
      const actions = get(actionsState);
      const currentTeam = get(currentTeamState);
      if (!forCurrentTeam) return actions;
      return actions.filter((a) => a.team === currentTeam?._id);
    },
});

export const actionsWithPersonNameSelector = selector({
  key: 'actionsWithPersonNameSelector',
  get: ({ get }) => {
    const persons = get(personsState);
    const actions = get(actionsForCurrentTeamSelector());
    return actions.map((a) => ({
      ...a,
      personName: persons.find((p) => p._id === a.person)?.name || '',
    }));
  },
});

export const actionsByStatusSelector = selectorFamily({
  key: 'actionsByStatusSelector',
  get:
    (status) =>
    ({ get }) => {
      const actions = get(actionsWithPersonNameSelector);
      const currentTeam = get(currentTeamState);
      return actions.filter((a) => a.status === status).filter((a) => a.team === currentTeam?._id);
    },
});

export const actionsFullPopulatedSelector = selector({
  key: 'actionsFullPopulatedSelector',
  get: ({ get }) => {
    const comments = get(commentsState);
    const actions = get(actionsWithPersonNameSelector);
    return actions.map((a) => ({
      ...a,
      comments: comments.filter((c) => c.action === a._id),
    }));
  },
});

export const territoriesFullPopulatedSelector = selector({
  key: 'territoriesFullPopulatedSelector',
  get: ({ get }) => {
    const territories = get(territoriesState);
    const customFieldsObs = get(customFieldsObsSelector);
    const territoryObservations = get(territoryObservationsState);

    const observationsKeyLabels = {};
    for (const field of customFieldsObs) {
      observationsKeyLabels[field.name] = field.label;
    }

    return territories.map((t) => ({
      ...t,
      observations: territoryObservations
        .filter((obs) => obs.territory === t._id)
        .map((obs) => {
          const obsWithOnlyFilledFields = {};
          for (let key of Object.keys(obs)) {
            if (obs[key]) obsWithOnlyFilledFields[observationsKeyLabels[key]] = obs[key];
          }
          return obsWithOnlyFilledFields;
        }),
    }));
  },
});
