import { atom } from 'recoil';

export const apiVersionState = atom({
  key: 'apiVersionState',
  default: null,
});

export const minimumDashboardVersionState = atom({
  key: 'minimumDashboardVersionState',
  default: null,
});
