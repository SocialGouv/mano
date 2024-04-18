import { useState } from "react";
import { useRecoilValue } from "recoil";
import { utils, writeFile } from "@e965/xlsx";
import SelectCustom from "../../components/SelectCustom";
import CustomFieldsStats from "./CustomFieldsStats";
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from "../../components/tailwind/Modal";
import { currentTeamState, teamsState, usersState } from "../../recoil/auth";
import TagTeam from "../../components/TagTeam";
import Table from "../../components/table";
import { dayjsInstance } from "../../services/date";
import { customFieldsObsSelector } from "../../recoil/territoryObservations";
import CreateObservation from "../../components/CreateObservation";
import { filterData } from "../../components/Filters";
import DateBloc, { TimeBlock } from "../../components/DateBloc";
import CustomFieldDisplay from "../../components/CustomFieldDisplay";

const ObservationsStats = ({ territories, selectedTerritories, setSelectedTerritories, observations, customFieldsObs, allFilters }) => {
  const [obsModalOpened, setObsModalOpened] = useState(false);
  const [sliceField, setSliceField] = useState(null);
  const [sliceValue, setSliceValue] = useState(null);
  const [slicedData, setSlicedData] = useState([]);

  const onSliceClick = (newSlice, fieldName, observationsConcerned = observations) => {
    const newSlicefield = customFieldsObs.find((f) => f.name === fieldName);
    setSliceField(newSlicefield);
    setSliceValue(newSlice);
    const slicedData =
      newSlicefield.type === "boolean"
        ? observationsConcerned.filter((p) => (newSlice === "Non" ? !p[newSlicefield.field] : !!p[newSlicefield.field]))
        : filterData(
            observationsConcerned,
            [{ ...newSlicefield, value: newSlice, type: newSlicefield.field === "outOfActiveList" ? "boolean" : newSlicefield.field }],
            true
          );
    setSlicedData(slicedData);
    setObsModalOpened(true);
  };
  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques des observations de territoire</h3>
      <div className="tw-mx-5 tw-mb-8">
        <label htmlFor="filter-territory">Filter par territoire</label>
        <SelectCustom
          isMulti
          options={territories}
          name="place"
          placeholder="Tous les territoires"
          value={selectedTerritories?.map((t) => ({ _id: t._id, name: t.name })) || []}
          onChange={(t) => {
            setSelectedTerritories(t);
          }}
          isClearable={true}
          inputId="filter-territory"
          getOptionValue={(i) => i._id}
          getOptionLabel={(i) => i.name}
        />
      </div>
      <CustomFieldsStats
        data={observations}
        customFields={customFieldsObs}
        onSliceClick={onSliceClick}
        dataTestId="number-observations"
        additionalCols={[
          {
            title: "Nombre d'observations de territoire",
            value: observations.length,
            onBlockClick: () => {
              setSlicedData(observations);
              setObsModalOpened(true);
            },
          },
        ]}
        help={(label) =>
          `${label.capitalize()} des observations des territoires sélectionnés, dans la période définie.\n\nLa moyenne de cette données est basée sur le nombre d'observations faites.`
        }
        totalTitleForMultiChoice={<span className="tw-font-bold">Nombre d'observations concernées</span>}
      />
      <SelectedObsModal
        open={obsModalOpened}
        onClose={() => {
          setObsModalOpened(false);
        }}
        observations={slicedData}
        sliceField={sliceField}
        onAfterLeave={() => {
          setSliceField(null);
          setSliceValue(null);
          setSlicedData([]);
        }}
        title={`${sliceField?.label ?? "Observations de territoire"}${sliceValue ? ` : ${sliceValue}` : ""} (${slicedData.length})`}
        territories={territories}
        allFilters={allFilters}
      />
    </>
  );
};

const SelectedObsModal = ({ open, onClose, observations, territories, title, onAfterLeave, allFilters }) => {
  const [observationToEdit, setObservationToEdit] = useState({});
  const [openObservationModaleKey, setOpenObservationModaleKey] = useState(0);
  const teams = useRecoilValue(teamsState);
  const team = useRecoilValue(currentTeamState);
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
    utils.book_append_sheet(wb, utils.json_to_sheet(allFilters.selectedTerritories), "Filtres (territoires)");
    utils.book_append_sheet(wb, utils.json_to_sheet(allFilters.selectedTeams), "Filtres (équipes)");
    const otherFilters = [
      {
        "Période - début": allFilters.period.startDate,
        "Période - fin": allFilters.period.endDate,
      },
    ];
    utils.book_append_sheet(wb, utils.json_to_sheet(otherFilters), "Filtres (autres)");
    writeFile(
      wb,
      `Statistiques (${dayjsInstance(allFilters.period.startDate).format("YYYY-MM-DD")} - ${dayjsInstance(allFilters.period.endDate).format(
        "YYYY-MM-DD"
      )}) - ${title}.xlsx`
    );
  };

  return (
    <>
      <ModalContainer open={open} size="full" onClose={onClose} onAfterLeave={onAfterLeave}>
        <ModalHeader
          title={
            <div className="tw-flex tw-w-full tw-items-center tw-justify-between">
              {title}{" "}
              <button onClick={exportXlsx} className="button-submit tw-ml-auto tw-mr-20">
                Télécharger un export
              </button>
            </div>
          }
        />
        <ModalBody>
          <div className="tw-p-4">
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
                    return (
                      <>
                        <DateBloc date={obs.observedAt} />
                        <TimeBlock time={obs.observedAt} />
                      </>
                    );
                  },
                },
                { title: "Territoire", dataKey: "territory", render: (obs) => territories.find((t) => t._id === obs.territory)?.name },
                {
                  title: "Observation",
                  dataKey: "entityKey",
                  render: (obs) => (
                    <div className="tw-text-xs">
                      {customFieldsObs
                        .filter((f) => f)
                        .filter((f) => f.enabled || f.enabledTeams?.includes(team._id))
                        .filter((f) => obs[f.name])
                        .map((field) => {
                          const { name, label } = field;
                          return (
                            <div key={name}>
                              {label}:{" "}
                              {["textarea"].includes(field.type) ? (
                                <div className="tw-pl-8">
                                  <CustomFieldDisplay type={field.type} value={obs[field.name]} />
                                </div>
                              ) : (
                                <CustomFieldDisplay type={field.type} value={obs[field.name]} />
                              )}
                            </div>
                          );
                        })}
                    </div>
                  ),
                  left: true,
                },
                {
                  title: "Équipe en charge",
                  dataKey: "team",
                  render: (obs) => <TagTeam teamId={obs?.team} />,
                },
              ]}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            name="cancel"
            className="button-cancel"
            onClick={() => {
              onClose(null);
            }}
          >
            Fermer
          </button>
        </ModalFooter>
      </ModalContainer>
      <CreateObservation observation={observationToEdit} forceOpen={!!openObservationModaleKey} />
    </>
  );
};

export default ObservationsStats;
