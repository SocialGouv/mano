import React from "react";
import { useParams, useHistory } from "react-router-dom";
import { toast } from "react-toastify";
import Loading from "../../components/loading";
import ButtonCustom from "../../components/ButtonCustom";
import Observations from "../territory-observations/list";
import { territoriesState } from "../../recoil/territory";
import { useRecoilState, useRecoilValue } from "recoil";
import API from "../../services/api";
import { territoryObservationsState } from "../../recoil/territoryObservations";
import useTitle from "../../services/useTitle";
import DeleteButtonAndConfirmModal from "../../components/DeleteButtonAndConfirmModal";
import { userState } from "../../recoil/auth";
import BackButton from "../../components/backButton";
import { TerritoryModal } from "./list";

const View = () => {
  const { id } = useParams();
  const history = useHistory();
  const user = useRecoilValue(userState);
  const [territories, setTerritories] = useRecoilState(territoriesState);
  const [territoryObservations, setTerritoryObservations] = useRecoilState(territoryObservationsState);
  const [modalOpen, setModalOpen] = React.useState(false);
  const territory = territories.find((t) => t._id === id);

  useTitle(`${territory?.name} - Territoire`);

  if (!territory) return <Loading />;

  return (
    <>
      {modalOpen && <TerritoryModal open={modalOpen} setOpen={setModalOpen} territory={territory} />}
      <div>
        <BackButton />
      </div>
      <div className="tw-grid tw-gap-4 tw-my-4">
        <div className="tw-text-xl">
          Territoire&nbsp;: <b>{territory.name}</b>
        </div>
        <div className="tw-grid tw-grid-cols-2">
          <div>
            Types&nbsp;:{" "}
            <b>
              <i>{territory.types.join(", ")}</i>
            </b>
          </div>
          <div>
            Périmètre&nbsp;:{" "}
            <b>
              <i>{territory.perimeter || "..."}</i>
            </b>
          </div>
        </div>
        <div>
          Description&nbsp;: <i>{territory.description || "..."}</i>
        </div>
        <div className="tw-flex tw-justify-end tw-gap-2">
          {!["restricted-access"].includes(user.role) && (
            <>
              <DeleteButtonAndConfirmModal
                title={`Voulez-vous vraiment supprimer le territoire ${territory.name}`}
                textToConfirm={territory.name}
                onConfirm={async () => {
                  const res = await API.delete({ path: `/territory/${id}` });
                  if (res.ok) {
                    setTerritories((territories) => territories.filter((t) => t._id !== id));
                    for (let obs of territoryObservations.filter((o) => o.territory === id)) {
                      const res = await API.delete({ path: `/territory-observation/${obs._id}` });
                      if (res.ok) {
                        setTerritoryObservations((territoryObservations) => territoryObservations.filter((p) => p._id !== obs._id));
                      }
                    }
                    toast.success("Suppression réussie");
                    history.goBack();
                  }
                }}
              >
                <span style={{ marginBottom: 30, display: "block", width: "100%", textAlign: "center" }}>
                  Cette opération est irréversible
                  <br />
                  et entrainera la suppression définitive de toutes les observations liées au territoire.
                </span>
              </DeleteButtonAndConfirmModal>
              <ButtonCustom
                title={"Modifier"}
                loading={false}
                onClick={() => {
                  setModalOpen(true);
                }}
              />
            </>
          )}
        </div>
      </div>
      <hr />
      <Observations territory={territory || { _id: id }} />
    </>
  );
};

export default View;
