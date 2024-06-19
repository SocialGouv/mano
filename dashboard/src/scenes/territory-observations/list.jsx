import { useMemo, useState } from "react";

import ButtonCustom from "../../components/ButtonCustom";
import CreateObservation from "../../components/CreateObservation";
import { customFieldsObsSelector, territoryObservationsState } from "../../recoil/territoryObservations";
import { useRecoilValue } from "recoil";
import Table from "../../components/table";
import { useLocalStorage } from "../../services/useLocalStorage";
import { dayjsInstance, formatDateWithFullMonth } from "../../services/date";
import UserName from "../../components/UserName";
import { currentTeamAuthentifiedState, userAuthentifiedState } from "../../recoil/auth";
import CustomFieldDisplay from "../../components/CustomFieldDisplay";
import TagTeam from "../../components/TagTeam";

const List = ({ territory = {} }) => {
  const [sortBy, setSortBy] = useLocalStorage("territory-obs-sortBy", "name");
  const [sortOrder, setSortOrder] = useLocalStorage("territory-obs-sortOrder", "ASC");
  const territoryObservations = useRecoilValue(territoryObservationsState);
  const team = useRecoilValue(currentTeamAuthentifiedState);
  const user = useRecoilValue(userAuthentifiedState);
  const [observation, setObservation] = useState(undefined);
  const [openObservationModale, setOpenObservationModale] = useState(false);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);

  const observations = useMemo(
    () =>
      territoryObservations
        .filter((obs) => obs.territory === territory._id)
        .sort((a, b) => new Date(b.observedAt || b.createdAt) - new Date(a.observedAt || a.createdAt)),
    [territory._id, territoryObservations]
  );

  if (!observations) return null;

  return (
    <>
      <div className="tw-flex tw-items-center tw-mt-12 tw-mb-6">
        <div className="tw-flex-1 tw-mt-2">
          <h1 className="tw-text-xl tw-font-bold">Observations</h1>
        </div>
        <div>
          <ButtonCustom
            onClick={() => {
              setObservation({
                user: user._id,
                team: null,
                observedAt: dayjsInstance().toDate(),
                createdAt: dayjsInstance().toDate(),
                territory: territory?._id,
              });
              setOpenObservationModale(true);
            }}
            color="primary"
            title="Nouvelle observation"
            padding="12px 24px"
          />
        </div>
      </div>
      <Table
        data={observations}
        rowKey={"_id"}
        noData={`Pas encore d'observations pour ce territoire`}
        onRowClick={(obs) => {
          setObservation(obs);
          setOpenObservationModale(true);
        }}
        columns={[
          {
            title: "Date",
            dataKey: "observedAt",
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (obs) => formatDateWithFullMonth(obs.observedAt || obs.createdAt),
          },
          {
            title: "Créée par",
            dataKey: "user",
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (obs) => <UserName id={obs.user} />,
          },
          {
            title: "Observations",
            dataKey: "infos",
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
      <CreateObservation observation={observation} open={openObservationModale} setOpen={setOpenObservationModale} />
    </>
  );
};

export default List;
