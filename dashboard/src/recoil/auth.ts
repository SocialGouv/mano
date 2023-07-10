import { atom } from 'recoil';
import { AppSentry } from '../services/sentry';
import type { OrganisationInstance } from '../types/organisation';
import type { UserInstance } from '../types/user';
import type { TeamInstance } from '../types/team';

export const userState = atom<UserInstance | null>({
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

export const teamsState = atom<TeamInstance[]>({
  key: 'teamsState',
  default: [],
});

export const usersState = atom<UserInstance[]>({
  key: 'usersState',
  default: [],
});

export const currentTeamState = atom<TeamInstance | null>({
  key: 'currentTeamState',
  default: null,
});

export const sessionInitialDateTimestamp = atom({
  key: 'sessionInitialDateTimestamp',
  default: null,
});
