export default function EvolutiveStatsViewer() {
  return (
    <div className="tw-flex tw-w-full tw-justify-around">
      <div className="tw-flex tw-basis-1/4 tw-flex-col tw-items-center tw-justify-end tw-gap-y-4">
        <h5>Au 31/12/2023</h5>
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-around tw-rounded-lg tw-border tw-p-4">
          <p className="tw-text-6xl tw-font-bold tw-text-main">45</p>
          <p>des personnes SDF</p>
        </div>
      </div>
      <div className="tw-flex tw-basis-1/2 tw-flex-col tw-items-center tw-justify-end tw-gap-y-4">
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-around tw-p-4">
          <p className="tw-text-6xl tw-font-bold tw-text-main">45%</p>
          <p className="tw-m-0 tw-text-center">
            des “Sans” Couverture Médicale au 31/01/2022
            <br />
            ont évolué vers “AME” au 01/02/2023
          </p>
        </div>
      </div>
      <div className="tw-flex tw-basis-1/4 tw-flex-col tw-items-center tw-justify-end tw-gap-y-4">
        <h5>Au 31/12/2023</h5>
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-around tw-rounded-lg tw-border tw-p-4">
          <p className="tw-text-6xl tw-font-bold tw-text-main">45</p>
          <p>des personnes SDF</p>
        </div>
      </div>
    </div>
  );
}
