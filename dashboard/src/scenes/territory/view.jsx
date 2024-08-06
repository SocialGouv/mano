import React, { useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { toast } from "react-toastify";
import Loading from "../../components/loading";
import Observations from "../territory-observations/list";
import { territoriesState } from "../../recoil/territory";
import { useRecoilState, useRecoilValue } from "recoil";
import API, { tryFetchExpectOk } from "../../services/api";
import useTitle from "../../services/useTitle";
import DeleteButtonAndConfirmModal from "../../components/DeleteButtonAndConfirmModal";
import { userState } from "../../recoil/auth";
import BackButton from "../../components/backButton";
import { TerritoryModal } from "./list";
import { useLocalStorage } from "../../services/useLocalStorage";
import { useDataLoader } from "../../components/DataLoader";
import { territoryObservationsState } from "../../recoil/territoryObservations";
import { errorMessage } from "../../utils";

const View = () => {
  const { refresh } = useDataLoader();
  const { id } = useParams();
  const history = useHistory();
  const [, setActiveTab] = useLocalStorage("stats-tabCaption");
  const [, setSelectedTerritories] = useLocalStorage("stats-territories");
  const user = useRecoilValue(userState);
  const [territories] = useRecoilState(territoriesState);
  const [modalOpen, setModalOpen] = useState(false);
  const territory = territories.find((t) => t._id === id);
  const territoryObservations = useRecoilValue(territoryObservationsState);

  const observations = territoryObservations.filter((obs) => obs.territory === territory?._id);

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
              <i>{(territory.types || []).join(", ")}</i>
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
          Description&nbsp;:{" "}
          <i>
            {territory.description?.split("\n").map((paragraph, i, description) => {
              if (i === description.length - 1) return paragraph;
              return (
                <React.Fragment key={i}>
                  {paragraph}
                  <br />
                </React.Fragment>
              );
            }) || "..."}
          </i>
        </div>
        <div className="tw-flex tw-justify-end">
          {!["restricted-access"].includes(user.role) && (
            <>
              <button
                className="button-submit !tw-bg-blue-900"
                onClick={() => {
                  setActiveTab("Observations");
                  setSelectedTerritories([territory]);
                  history.push("/stats");
                }}
              >
                Statistiques du territoire
              </button>
              <DeleteButtonAndConfirmModal
                // eslint-disable-next-line no-irregular-whitespace
                title={`Voulez-vous vraiment supprimer le territoire ${territory.name} ?`}
                textToConfirm={territory.name}
                onConfirm={async () => {
                  const [error] = await tryFetchExpectOk(async () =>
                    API.delete({
                      path: `/territory/${id}`,
                      body: {
                        observationIds: observations.map((o) => o._id).filter(Boolean),
                      },
                    })
                  );
                  if (error) {
                    toast.error(errorMessage(error));
                    return;
                  }
                  await refresh();
                  toast.success("Suppression réussie");
                  history.goBack();
                }}
              >
                <div className="tw-px-8 tw-pb-8 tw-text-center">
                  Cette opération est <u>irréversible</u> et entrainera la <b>suppression définitive</b> de <b>toutes les observations</b> liées au
                  territoire, <b>y compris dans les statistiques</b>.
                </div>
              </DeleteButtonAndConfirmModal>
              <button
                className="button-submit"
                onClick={() => {
                  setModalOpen(true);
                }}
              >
                Modifier
              </button>
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
