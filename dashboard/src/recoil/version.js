import { atom } from 'recoil';

export const deploymentDateState = atom({
  key: 'deploymentDateState',
  default: null,
});

export const deploymentCommitState = atom({
  key: 'deploymentCommitState',
  default: '-',
});
