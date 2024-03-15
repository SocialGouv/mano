import { useRecoilValue } from "recoil";
import { deploymentCommitState, deploymentDateState } from "../recoil/version";
import { dayjsInstance } from "../services/date";

export default function VersionOutdatedAlert() {
  const deploymentCommit = useRecoilValue(deploymentCommitState);
  const deploymentDate = useRecoilValue(deploymentDateState);

  if (!deploymentCommit || !deploymentDate) {
    return null;
  }

  if (
    dayjsInstance(deploymentDate).isAfter(dayjsInstance(window.localStorage.getItem("deploymentDate"))) &&
    deploymentCommit !== window.localStorage.getItem("deploymentCommit")
  ) {
    return (
      <div className="tw-fixed tw-top-2.5 tw-z-[200] tw-mb-4 tw-rounded tw-border tw-border-orange-50 tw-bg-amber-100 tw-px-5 tw-py-3 tw-text-orange-900">
        Une nouvelle version du site est disponible.{" "}
        <a
          className="tw-font-bold tw-text-stone-800 tw-underline"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            window.localStorage.setItem("deploymentDate", deploymentDate);
            window.localStorage.setItem("deploymentCommit", deploymentCommit);
            window.location.reload(true);
          }}
        >
          Rafraichissez cette page
        </a>{" "}
        pour l'utiliser !
      </div>
    );
  }
}
