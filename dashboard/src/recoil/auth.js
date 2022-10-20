import { atom } from 'recoil';
import { AppSentry } from '../services/sentry';

export const userState = atom({
  key: 'userState',
  default: null,
  effects: [({ onSet }) => onSet((user) => AppSentry.setUser(user))],
});

export const organisationState = atom({
  key: 'organisationState',
  default: {},
  effects: [({ onSet }) => onSet((organisation) => AppSentry.setTag('organisationId', organisation._id))],
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
