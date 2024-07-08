import { useRecoilValue } from "recoil";
import { evolutiveStatsForPersonsSelector } from "../recoil/evolutiveStats";
import type { PersonPopulated } from "../types/person";
import type { IndicatorsSelection } from "../types/evolutivesStats";
import { useState } from "react";
import { capture } from "../services/sentry";
import type { FilterableField } from "../types/field";
import { SelectedPersonsModal } from "../scenes/stats/PersonsStats";
import { itemsGroupedByPersonSelector } from "../recoil/selectors";
import { CustomResponsivePie } from "../scenes/stats/Charts";
import { userAuthentifiedState } from "../recoil/auth";

interface EvolutiveStatsViewerProps {
  evolutiveStatsIndicators: IndicatorsSelection;
  period: {
    startDate: string;
    endDate: string;
  };
  persons: Array<PersonPopulated>;
  filterBase: Array<FilterableField>;
  viewAllOrganisationData: boolean;
  selectedTeamsObjectWithOwnPeriod: Record<string, { isoStartDate: string; isoEndDate: string }>;
}

export default function EvolutiveStatsViewer({
  evolutiveStatsIndicators,
  period,
  persons,
  filterBase,
  viewAllOrganisationData,
  selectedTeamsObjectWithOwnPeriod,
}: EvolutiveStatsViewerProps) {
  const [personsModalOpened, setPersonsModalOpened] = useState(false);
  const [modalValueEnd, setModalValueEnd] = useState<string | null>(null);
  const personsObject = useRecoilValue(itemsGroupedByPersonSelector);
  const user = useRecoilValue(userAuthentifiedState);

  const evolutiveStatsPerson = useRecoilValue(
    evolutiveStatsForPersonsSelector({
      persons,
      startDate: period.startDate,
      endDate: period.endDate,
      evolutiveStatsIndicators,
      viewAllOrganisationData,
      selectedTeamsObjectWithOwnPeriod,
    })
  );
  try {
    const {
      startDateConsolidated,
      endDateConsolidated,
      valueStart,
      valueEnd,
      countSwitched,
      countPersonSwitched,
      percentSwitched,
      indicatorFieldLabel,
      personsIdsSwitchedByValue,
    } = evolutiveStatsPerson;

    if (startDateConsolidated.isSame(endDateConsolidated)) {
      return <p>Pour afficher des stats évolutives, veuillez sélectionner une période entre deux dates différentes</p>;
    }
    if (valueStart == null) return null;

    return (
      <>
        {valueEnd?.length && (
          <>
            <div className="tw-flex tw-w-full tw-justify-around tw-flex-col tw-items-center tw-gap-y-4">
              <h5>
                Entre le {startDateConsolidated.format("DD/MM/YYYY")} et le {endDateConsolidated.format("DD/MM/YYYY")}
              </h5>

              <div className="tw-flex tw-shrink-0 tw-items-center tw-justify-evenly tw-gap-y-4 tw-w-full">
                <button
                  className="tw-flex tw-flex-col tw-items-center tw-justify-around tw-rounded-lg tw-border tw-p-4"
                  type="button"
                  onClick={() => {
                    setPersonsModalOpened(true);
                    setModalValueEnd(valueEnd);
                  }}
                >
                  <div className="tw-flex tw-items-baseline tw-gap-x-2">
                    <p className="tw-text-6xl tw-font-bold tw-text-main">{countSwitched}</p>
                    <p>changements</p>
                  </div>
                  <p className="tw-text-center">
                    de <strong>{indicatorFieldLabel}</strong> de <strong>{valueStart} </strong> vers <strong>{valueEnd}</strong>
                    <br />
                    ont été effectués
                  </p>
                </button>
              </div>
              <div className="tw-flex tw-items-baseline tw-gap-x-2">
                <p className="tw-text-center">
                  impactant <strong>{countPersonSwitched}</strong> personnes (<strong>{percentSwitched}%</strong>)
                </p>
              </div>
            </div>
          </>
        )}
        <CustomResponsivePie
          title={`${indicatorFieldLabel}: de ${valueStart} à ...`}
          onItemClick={
            user.role === "stats-only"
              ? undefined
              : (newSlice) => {
                  console.log("newSlice", newSlice);
                  setPersonsModalOpened(true);
                  setModalValueEnd(newSlice);
                }
          }
          data={Object.keys(personsIdsSwitchedByValue).map((key) => {
            return {
              id: key,
              label: key === valueStart ? `${key} (pas de changement)` : key,
              value: personsIdsSwitchedByValue[key].length,
            };
          })}
          help={`On compte le nombre de changements pour le champ ${indicatorFieldLabel} en partant de la valeur ${valueStart} vers toutes les valeurs possibles, dans la période définie.`}
        />
        <SelectedPersonsModal
          open={personsModalOpened}
          onClose={() => {
            setPersonsModalOpened(false);
            setModalValueEnd(null);
          }}
          persons={modalValueEnd ? [...new Set(personsIdsSwitchedByValue[modalValueEnd] ?? [])].map((id) => personsObject[id]) : []}
          sliceField={filterBase.find((f) => f.name === evolutiveStatsIndicators[0].fieldName)}
          onAfterLeave={() => {}}
          title={
            <p className="tw-basis-1/2">
              Personnes dont le champ {indicatorFieldLabel}{" "}
              {valueStart === modalValueEnd ? `est resté à ${valueStart}` : `est passé de ${valueStart} à ${modalValueEnd}`}
              <br />
              entre le {startDateConsolidated.format("DD/MM/YYYY")} et le {endDateConsolidated.format("DD/MM/YYYY")}
              <br />
              <br />
              <small className="tw-text-gray-500 tw-block tw-text-xs">
                Attention: cette liste affiche les personnes <strong>telles qu'elles sont aujourd'hui</strong>.
                <br /> Pour en savoir plus sur l'évolution de chaque personne, cliquez dessus et consultez son historique.
              </small>
            </p>
          }
        />
      </>
    );
  } catch (error) {
    capture(error, {
      extra: {
        evolutiveStatsIndicators,
        period,
      },
    });
  }
  return (
    <div>
      <h4>Erreur</h4>
      <p>Une erreur est survenue lors de l'affichage des statistiques évolutives. Les équipes techniques ont été prévenues</p>
    </div>
  );
}
