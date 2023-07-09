import { atom } from 'recoil';
import { AppSentry } from '../services/sentry';
import type { OrganisationInstance } from '../types/organisation';

export const userState = atom({
  key: 'userState',
  default: null,
  effects: [({ onSet }) => onSet((user) => AppSentry.setUser(user))],
});

export const organisationState = atom<OrganisationInstance>({
  key: 'organisationState',
  default: { _id: '' },
  effects: [
    ({ onSet }) =>
      onSet((organisation) => {
        AppSentry.setTag('organisationId', organisation?._id);
      }),
  ],
});

export const teamsState = atom({
  key: 'teamsState',
  default: [],
});

export const usersState = atom({
  key: 'usersState',
  default: [],
});

export const currentTeamState = atom({
  key: 'currentTeamState',
  default: null,
});

export const sessionInitialDateTimestamp = atom({
  key: 'sessionInitialDateTimestamp',
  default: null,
});
