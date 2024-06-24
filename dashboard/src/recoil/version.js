import { atom, selector } from "recoil";
import { dayjsInstance } from "../services/date";

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

export const showOutdateAlertBannerState = selector({
  key: "showOutdateAlertBannerState",
  get: ({ get }) => {
    const deploymentCommit = get(deploymentCommitState);
    const deploymentDate = get(deploymentDateState);
    if (!deploymentCommit || !deploymentDate) return false;
    return (
      dayjsInstance(deploymentDate).isAfter(dayjsInstance(window.localStorage.getItem("deploymentDate"))) &&
      deploymentCommit !== window.localStorage.getItem("deploymentCommit")
    );
  },
});
