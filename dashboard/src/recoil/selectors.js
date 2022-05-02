import { currentTeamState, userState } from './auth';
import { personsState } from './persons';
import { placesState } from './places';
import { relsPersonPlaceState } from './relPersonPlace';
import { reportsState } from './reports';
import { isOnSameDay } from '../services/date';
import { customFieldsObsSelector, territoryObservationsState } from './territoryObservations';
import { selector, selectorFamily } from 'recoil';

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
