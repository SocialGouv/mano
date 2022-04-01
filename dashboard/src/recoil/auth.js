import { atom } from 'recoil';

export const userState = atom({
  key: 'userState',
  default: null,
});

export const organisationState = atom({
  key: 'organisationState',
  default: {},
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
