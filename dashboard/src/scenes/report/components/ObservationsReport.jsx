import { useState } from "react";
import { useRecoilValue } from "recoil";
import { utils, writeFile } from "@e965/xlsx";
import { ModalHeader, ModalBody, ModalContainer, ModalFooter } from "../../../components/tailwind/Modal";
import { FullScreenIcon } from "../../../assets/icons/FullScreenIcon";
import Table from "../../../components/table";
import TagTeam from "../../../components/TagTeam";
import DateBloc from "../../../components/DateBloc";
import CreateObservation from "../../../components/CreateObservation";
import Observation from "../../territory-observations/view";
import { territoriesState } from "../../../recoil/territory";
import { dayjsInstance } from "../../../services/date";
import { teamsState, usersState } from "../../../recoil/auth";
import { customFieldsObsSelector } from "../../../recoil/territoryObservations";

export const ObservationsReport = ({ observations, period, selectedTeams }) => {
  const [fullScreen, setFullScreen] = useState(false);

  return (
    <>
      <section title="Observations" className="noprint tw-relative tw-m-2 tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-main">
        <p className="tw-m-0 tw-w-full tw-text-center tw-text-2xl tw-font-semibold tw-text-white">{observations.length}</p>
        <p className="tw-m-0 tw-w-full tw-text-center tw-text-sm tw-font-normal tw-text-white">observation{observations.length > 1 ? "s" : ""}</p>
        <button
          title="Passer les observations en plein écran"
          className="tw-absolute -tw-right-1.5 -tw-top-1.5 tw-h-6 tw-w-6 tw-rounded-full tw-text-white tw-transition hover:tw-scale-125 disabled:tw-cursor-not-allowed disabled:tw-opacity-30"
          onClick={() => setFullScreen(true)}
        >
          <FullScreenIcon />
        </button>
      </section>
      <section
        aria-hidden="true"
        className="printonly tw-mt-12 tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow"
      >
        <div className="tw-flex tw-flex-col tw-items-stretch tw-bg-white tw-px-3 tw-py-3">
          <h3 className="tw-m-0 tw-text-base tw-font-medium">Observations de territoire ({observations.length})</h3>
        </div>
        <div className="tw-grow tw-overflow-y-auto tw-border-t tw-border-main tw-border-opacity-20">
          <ObservationsTable observations={observations} period={period} selectedTeams={selectedTeams} />
        </div>
      </section>
      <ModalContainer open={!!fullScreen} className="" size="full" onClose={() => setFullScreen(false)}>
        <ModalHeader title={`Observations (${observations.length})`} onClose={() => setFullScreen(false)} />
        <ModalBody>
          <ObservationsTable observations={observations} period={period} selectedTeams={selectedTeams} />
        </ModalBody>
        <ModalFooter>
          <button type="button" name="cancel" className="button-cancel" onClick={() => setFullScreen(false)}>
            Fermer
          </button>
        </ModalFooter>
      </ModalContainer>
    </>
  );
};

const ObservationsTable = ({ period, observations, selectedTeams }) => {
  const [observationToEdit, setObservationToEdit] = useState({});
  const [openObservationModaleKey, setOpenObservationModaleKey] = useState(0);
  const territories = useRecoilValue(territoriesState);
  const teams = useRecoilValue(teamsState);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);
  const users = useRecoilValue(usersState);

  const exportXlsx = () => {
    const wb = utils.book_new();
    const formattedData = utils.json_to_sheet(
      observations.map((observation) => {
        return {
          id: observation._id,
          "Territoire - Nom": territories.find((t) => t._id === observation.territory)?.name,
          "Observé le": dayjsInstance(observation.observedAt).format("YYYY-MM-DD HH:mm"),
          Équipe: observation.team ? teams.find((t) => t._id === observation.team)?.name : "",
          ...customFieldsObs.reduce((fields, field) => {
            if (["date", "date-with-time", "duration"].includes(field.type))
              fields[field.label || field.name] = observation[field.name]
                ? dayjsInstance(observation[field.name]).format(field.type === "date" ? "YYYY-MM-DD" : "YYYY-MM-DD HH:mm")
                : "";
            else if (["boolean"].includes(field.type)) fields[field.label || field.name] = observation[field.name] ? "Oui" : "Non";
            else if (["yes-no"].includes(field.type)) fields[field.label || field.name] = observation[field.name];
            else if (Array.isArray(observation[field.name])) fields[field.label || field.name] = observation[field.name].join(", ");
            else fields[field.label || field.name] = observation[field.name];
            return fields;
          }, {}),
          "Créée par": users.find((u) => u._id === observation.user)?.name,
          "Créée le": dayjsInstance(observation.createdAt).format("YYYY-MM-DD HH:mm"),
          "Mise à jour le": dayjsInstance(observation.updatedAt).format("YYYY-MM-DD HH:mm"),
        };
      })
    );
    utils.book_append_sheet(wb, formattedData, "Observations de territoires");

    utils.book_append_sheet(wb, utils.json_to_sheet(observations), "Observations (données brutes)");
    utils.book_append_sheet(wb, utils.json_to_sheet(territories), "Territoires (données brutes)");
    utils.book_append_sheet(wb, utils.json_to_sheet(selectedTeams), "Filtres (équipes)");
    const otherFilters = [
      {
        "Période - début": period.startDate,
        "Période - fin": period.endDate,
      },
    ];
    utils.book_append_sheet(wb, utils.json_to_sheet(otherFilters), "Filtres (autres)");
    writeFile(
      wb,
      `Compte rendu (${dayjsInstance(period.startDate).format("YYYY-MM-DD")} - ${dayjsInstance(period.endDate).format(
        "YYYY-MM-DD"
      )}) - Observations de territoires (${observations.length}).xlsx`
    );
  };

  return (
    <>
      <div className="tw-px-4 tw-py-2 print:tw-mb-4 print:tw-px-0">
        <div className="noprint tw-mb-5 tw-flex tw-justify-between">
          <h3 className="tw-w-full tw-px-3 tw-py-2 tw-text-2xl tw-font-medium tw-text-black">Observations</h3>
          <button onClick={exportXlsx} className="button-submit tw-ml-auto tw-mr-4">
            Télécharger un export
          </button>
          <button
            type="button"
            className="button-submit"
            onClick={() => {
              setObservationToEdit({
                date: dayjsInstance(period.startDate),
                observations: [],
              });
              setOpenObservationModaleKey((k) => k + 1);
            }}
          >
            Ajouter une observation
          </button>
        </div>
        {!!observations.length && (
          <Table
            className="Table"
            data={observations}
            onRowClick={(obs) => {
              setObservationToEdit(obs);
              setOpenObservationModaleKey((k) => k + 1);
            }}
            rowKey={"_id"}
            columns={[
              {
                title: "Date",
                dataKey: "observedAt",
                render: (obs) => {
                  // anonymous comment migrated from `report.observations`
                  // have no time
                  // have no user assigned either
                  const time = dayjsInstance(obs.observedAt).format("D MMM HH:mm");
                  return (
                    <>
                      <DateBloc date={obs.observedAt} />
                      <span className="tw-mb-2 tw-block tw-w-full tw-text-center tw-opacity-50">{time === "00:00" && !obs.user ? null : time}</span>
                    </>
                  );
                },
              },
              { title: "Territoire", dataKey: "territory", render: (obs) => territories.find((t) => t._id === obs.territory)?.name },
              { title: "Observation", dataKey: "entityKey", render: (obs) => <Observation noTeams noBorder obs={obs} />, left: true },
              {
                title: "Équipe en charge",
                dataKey: "team",
                render: (obs) => <TagTeam teamId={obs?.team} />,
              },
            ]}
          />
        )}
      </div>
      <CreateObservation observation={observationToEdit} forceOpen={!!openObservationModaleKey} />
    </>
  );
};
