import * as Sentry from '@sentry/react-native';
import { atom } from 'recoil';

export const userState = atom({
  key: 'userState',
  default: null,
  effects: [({ onSet }) => onSet((user) => Sentry.setUser(user))],
});

export const organisationState = atom({
  key: 'organisationState',
  default: {},
  effects: [({ onSet }) => onSet((organisation) => Sentry.setTag('organisationId', organisation._id))],
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
