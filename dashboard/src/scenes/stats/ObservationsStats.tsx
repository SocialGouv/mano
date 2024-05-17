import { useMemo, useState } from "react";
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
import Filters, { filterData } from "../../components/Filters";
import DateBloc, { TimeBlock } from "../../components/DateBloc";
import CustomFieldDisplay from "../../components/CustomFieldDisplay";
import { CustomResponsivePie } from "./charts";
import type { TerritoryInstance } from "../../types/territory";
import type { Filter, FilterableField } from "../../types/field";
import type { TerritoryObservationInstance } from "../../types/territoryObs";
import type { CustomField } from "../../types/field";
import type { Period } from "../../types/date";
import type { TeamInstance } from "../../types/team";
import type { PersonPopulated } from "../../types/person";

interface ObservationsStatsProps {
  territories: Array<TerritoryInstance>;
  filterObs: Array<Filter>;
  setFilterObs: (filters: Array<Filter>) => void;
  observations: Array<TerritoryObservationInstance>;
  customFieldsObs: Array<CustomField>;
  period: Period;
  selectedTeams: Array<TeamInstance>;
  personsWithRencontres: Array<PersonPopulated>;
}

const ObservationsStats = ({
  territories,
  filterObs,
  setFilterObs,
  observations,
  customFieldsObs,
  period,
  selectedTeams,
  personsWithRencontres,
}: ObservationsStatsProps) => {
  const currentTeam = useRecoilValue(currentTeamState);
  const selectedTerritories = useMemo(() => {
    return territories.filter((t) => filterObs.find((f) => f.field === "territory")?.value?.includes(t.name));
  }, [territories, filterObs]);

  const filterBase: Array<FilterableField> = useMemo(() => {
    return [
      {
        field: "territory",
        name: "territory",
        label: "Territoire",
        type: "multi-choice",
        options: territories.map((t) => t.name),
      },
      ...customFieldsObs
        .filter((a) => a.enabled || a.enabledTeams?.includes(currentTeam._id))
        .map((field) => ({
          field: field.name,
          name: field.name,
          label: field.label,
          type: field.type,
          options: field.options,
        })),
    ];
  }, [territories, customFieldsObs]);
  const [obsModalOpened, setObsModalOpened] = useState(false);
  const [sliceField, setSliceField] = useState(null);
  const [sliceValue, setSliceValue] = useState(null);
  const [slicedData, setSlicedData] = useState([]);

  const onSliceClick = (newSlice: string, fieldName: FilterableField["field"], observationsConcerned = observations) => {
    const newSlicefield = customFieldsObs.find((f) => f.name === fieldName);
    setSliceField(newSlicefield);
    setSliceValue(newSlice);
    const slicedData =
      newSlicefield.type === "boolean"
        ? observationsConcerned.filter((p) => (newSlice === "Non" ? !p[newSlicefield.name] : !!p[newSlicefield.name]))
        : filterData(observationsConcerned, [{ ...newSlicefield, value: newSlice, type: newSlicefield.type }]);
    setSlicedData(slicedData);
    setObsModalOpened(true);
  };

  const [personsRencontresByTerritories, rencontresByTerritories] = useMemo(() => {
    const personsRencontresByTerritories = {};
    const rencontresByTerritories = {};
    for (const p of personsWithRencontres) {
      for (const r of p.rencontres) {
        if (r.territoryObject?.name) {
          if (!personsRencontresByTerritories[r.territoryObject.name]) personsRencontresByTerritories[r.territoryObject.name] = {};
          if (!personsRencontresByTerritories[r.territoryObject.name][p._id]) personsRencontresByTerritories[r.territoryObject.name][p._id] = true;
          rencontresByTerritories[r.territoryObject.name] = (rencontresByTerritories[r.territoryObject.name] || 0) + 1;
        }
      }
    }
    return [personsRencontresByTerritories, rencontresByTerritories];
  }, [personsWithRencontres]);

  const filteredPersonsRencontresByTerritories = useMemo(() => {
    return Object.entries(personsRencontresByTerritories).reduce((acc, [territory, persons]) => {
      if (selectedTerritories.length && !selectedTerritories.find((t) => t.name === territory)) return acc;
      acc[territory] = persons;
      return acc;
    }, {});
  }, [personsRencontresByTerritories, selectedTerritories]);

  const filteredRencontresByTerritories = useMemo(() => {
    return Object.entries(rencontresByTerritories).reduce((acc, [territory, rencontres]) => {
      if (selectedTerritories.length && !selectedTerritories.find((t) => t.name === territory)) return acc;
      acc[territory] = rencontres;
      return acc;
    }, {});
  }, [rencontresByTerritories, selectedTerritories]);

  return (
    <>
      <h3 className="tw-my-5 tw-text-xl">Statistiques des observations de territoire</h3>
      <Filters base={filterBase} filters={filterObs} onChange={setFilterObs} />
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
      <CustomResponsivePie
        title="Nombre de personnes suivies différentes rencontrées (sur les territoires)"
        help={`Répartition par territoire du nombre de personnes suivies ayant été rencontrées lors de la saisie d'une observation dans la période définie. Si une personne est rencontrée plusieurs fois sur un même territoire, elle n'est comptabilisée qu'une seule fois. Si elle est rencontrée sur deux territoires différents, elle sera comptée indépendamment sur chaque territoire.\n\nSi aucune période n'est définie, on considère l'ensemble des observations.`}
        data={Object.entries(filteredPersonsRencontresByTerritories).map(([territory, persons]) => ({
          id: territory,
          label: territory,
          value: Object.keys(persons).length,
        }))}
      />
      <CustomResponsivePie
        title="Nombre de rencontres de personnes suivies (dans les territoires)"
        help={`Répartition par territoire du nombre de rencontres lors de la saisie d'une observation dans la période définie. Chaque rencontre est comptabilisée, même si plusieurs rencontres avec une même personne ont eu lieu sur un même territoire.\n\nSi aucune période n'est définie, on considère l'ensemble des observations.`}
        data={Object.entries(filteredRencontresByTerritories).map(([territory, rencontres]) => ({
          id: territory,
          label: territory,
          value: rencontres || 0,
        }))}
      />
      <SelectedObsModal
        open={obsModalOpened}
        onClose={() => {
          setObsModalOpened(false);
        }}
        observations={slicedData}
        onAfterLeave={() => {
          setSliceField(null);
          setSliceValue(null);
          setSlicedData([]);
        }}
        title={`${sliceField?.label ?? "Observations de territoire"}${sliceValue ? ` : ${sliceValue}` : ""} (${slicedData.length})`}
        territories={territories}
        selectedTeams={selectedTeams}
        period={period}
      />
    </>
  );
};

const SelectedObsModal = ({ open, onClose, observations, territories, title, onAfterLeave, selectedTeams, period }) => {
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
      `Statistiques (${dayjsInstance(period.startDate).format("YYYY-MM-DD")} - ${dayjsInstance(period.endDate).format("YYYY-MM-DD")}) - ${title}.xlsx`
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
      <CreateObservation observation={observationToEdit} forceOpen={openObservationModaleKey} />
    </>
  );
};

export default ObservationsStats;
