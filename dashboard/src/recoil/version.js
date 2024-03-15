import { atom, selector } from "recoil";

export const deploymentDateState = atom({
  key: "deploymentDateState",
  default: null,
});

export const deploymentCommitState = atom({
  key: "deploymentCommitState",
  default: null,
});

export const deploymentShortCommitSHAState = selector({
  key: "shortCommitSHAState",
  get: ({ get }) => {
    const fullSHA = get(deploymentCommitState);
    return (fullSHA || "-").substring(0, 7);
  },
});
