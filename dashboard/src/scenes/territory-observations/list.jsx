import { useMemo, useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";

import ButtonCustom from "../../components/ButtonCustom";
import Observation from "./view";
import CreateObservation from "../../components/CreateObservation";
import { territoryObservationsState } from "../../recoil/territoryObservations";
import { useRecoilState } from "recoil";
import API from "../../services/api";

const List = ({ territory = {} }) => {
  const [territoryObservations, setTerritoryObservations] = useRecoilState(territoryObservationsState);
  const [observation, setObservation] = useState({});
  const [openObservationModale, setOpenObservationModale] = useState(null);

  const observations = useMemo(
    () =>
      territoryObservations
        .filter((obs) => obs.territory === territory._id)
        .sort((a, b) => new Date(b.observedAt || b.createdAt) - new Date(a.observedAt || a.createdAt)),
    [territory._id, territoryObservations]
  );

  if (!observations) return null;

  const deleteData = async (id) => {
    const confirm = window.confirm("Êtes-vous sûr ?");
    if (confirm) {
      const res = await API.delete({ path: `/territory-observation/${id}` });
      if (res.ok) {
        setTerritoryObservations((territoryObservations) => territoryObservations.filter((p) => p._id !== id));
      }
      if (!res.ok) return;
      toast.success("Suppression réussie");
    }
  };

  return (
    <>
      <div className="tw-flex tw-items-center tw-mt-12 tw-mb-6">
        <div className="tw-flex-1 tw-mt-2">
          <Title>Observations</Title>
        </div>
        <div>
          <ButtonCustom
            onClick={() => {
              setObservation({});
              setOpenObservationModale((k) => k + 1);
            }}
            color="primary"
            title="Nouvelle observation"
            padding="12px 24px"
          />
        </div>
      </div>
      {observations.map((obs) => (
        <Observation
          key={obs._id}
          obs={obs}
          onDelete={deleteData}
          onClick={() => {
            setObservation(obs);
            setOpenObservationModale((k) => k + 1);
          }}
        />
      ))}
      <CreateObservation observation={{ ...observation, territory: observation.territory || territory?._id }} forceOpen={openObservationModale} />
    </>
  );
};

const Title = styled.h1`
  font-size: 20px;
  font-weight: 800;
`;

export default List;
