import React, { useState, useCallback, useMemo } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { useDataLoader } from "../../components/DataLoader";
import { organisationState } from "../../recoil/auth";
import API, { tryFetchExpectOk } from "../../services/api";
import { ModalContainer, ModalBody, ModalFooter, ModalHeader } from "../../components/tailwind/Modal";
import { toast } from "react-toastify";
import DragAndDropSettings from "./DragAndDropSettings";
import { prepareReportForEncryption, reportsState } from "../../recoil/reports";
import { encryptItem } from "../../services/encryption";

function CollaborationsSettings() {
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const dataFormatted = useMemo(() => {
    return [
      {
        groupTitle: "Toutes mes co-interventions",
        items: organisation.collaborations,
      },
    ];
  }, [organisation.collaborations]);

  const { refresh } = useDataLoader();

  const onDragAndDrop = useCallback(
    async (newGroups) => {
      const [error, response] = await tryFetchExpectOk(async () =>
        API.put({
          path: `/organisation/${organisation._id}`,
          body: { collaborations: newGroups[0].items },
        })
      );
      if (!error) {
        setOrganisation(response.data);
        refresh();
      }
    },
    [organisation._id, refresh, setOrganisation]
  );

  return (
    <DragAndDropSettings
      title="Co-interventions"
      data={dataFormatted}
      dataItemKey={(cat) => cat}
      ItemComponent={Collaboration}
      NewItemComponent={AddCollaboration}
      onDragAndDrop={onDragAndDrop}
    />
  );
}

const AddCollaboration = ({ groupTitle }) => {
  const [organisation, setOrganisation] = useRecoilState(organisationState);

  const onAddCategory = async (e) => {
    e.preventDefault();
    const { newCollaboration } = Object.fromEntries(new FormData(e.target));
    if (!newCollaboration) return toast.error("Vous devez saisir un nom pour la co-intervention");
    if (organisation.collaborations.includes(newCollaboration)) return toast.error("Cette co-intervention existe déjà");

    const newCollaborations = [...organisation.collaborations, newCollaboration];

    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, collaborations: newCollaborations }); // optimistic UI
    const [error, response] = await tryFetchExpectOk(async () =>
      API.put({
        path: `/organisation/${organisation._id}`,
        body: {
          collaborations: newCollaborations,
        },
      })
    );

    if (!error) {
      setOrganisation(response.data);
      toast.success("Co-intervention ajoutée. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  return (
    <form className="tw-mt-4 tw-flex tw-break-normal" onSubmit={onAddCategory}>
      <input
        type="text"
        id="newCollaboration"
        name="newCollaboration"
        className="form-text tw-my-1  tw-w-full tw-rounded tw-bg-white/50 tw-px-1.5 tw-py-1 placeholder:tw-opacity-80"
        placeholder="Ajouter une co-intervention"
      />
      <button type="submit" className="tw-ml-4 tw-rounded tw-bg-transparent hover:tw-underline">
        Ajouter
      </button>
    </form>
  );
};

const Collaboration = ({ item: collaboration }) => {
  const [isSelected, setIsSelected] = useState(false);
  const [isEditingCategory, setIsEditingCollaboration] = useState(false);
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const [reports, setReports] = useRecoilState(reportsState);

  const { refresh } = useDataLoader();

  const onEditCategory = async (e) => {
    e.preventDefault();
    const { newCollaboration } = Object.fromEntries(new FormData(e.target));
    const oldCollaboration = collaboration;
    if (!newCollaboration) return toast.error("Vous devez saisir un nom pour la co-intervention");
    if (newCollaboration.trim() === oldCollaboration.trim()) return toast.error("Le nom de la co-intervention n'a pas changé");
    if (organisation.collaborations.includes(newCollaboration)) return toast.error("Cette co-intervention existe déjà");

    const newCollaborations = organisation.collaborations.map((cat) => (cat === oldCollaboration ? newCollaboration : cat));

    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, collaborations: newCollaborations }); // optimistic UI

    const encryptedReports = await Promise.all(
      reports
        .filter((report) => report.collaborations?.includes(oldCollaboration))
        .map((report) => ({ ...report, collaborations: report.collaborations.map((cat) => (cat === oldCollaboration ? newCollaboration : cat)) }))
        .map(prepareReportForEncryption)
        .map(encryptItem)
    );

    const [error, response] = await tryFetchExpectOk(
      async () =>
        await API.put({
          path: `/collaboration`,
          body: {
            collaborations: newCollaborations,
            reports: encryptedReports,
          },
        })
    );
    if (!error) {
      await refresh();
      setOrganisation(response.data);
      setIsEditingCollaboration(false);
      toast.success("Co-intervention mise à jour. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  const onDeleteCollaboration = async () => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette collaboration ? Cette opération est irréversible")) return;
    const newCollaborations = organisation.collaborations.filter((cat) => cat !== collaboration);
    const oldOrganisation = organisation;
    setOrganisation({ ...organisation, collaborations: newCollaborations }); // optimistic UI

    const [error, response] = await tryFetchExpectOk(async () =>
      API.put({
        path: `/organisation/${organisation._id}`,
        body: {
          collaborations: newCollaborations,
        },
      })
    );
    if (!error) {
      refresh();
      setIsEditingCollaboration(false);
      setOrganisation(response.data);
      toast.success("Co-intervention supprimée. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard");
    } else {
      setOrganisation(oldOrganisation);
    }
  };

  return (
    <>
      <div
        key={collaboration}
        onMouseDown={() => setIsSelected(true)}
        onMouseUp={() => setIsSelected(false)}
        className={[
          "tw-group tw-flex tw-cursor-move tw-items-center tw-border-2 tw-border-transparent tw-pl-1",
          isSelected ? "tw-rounded tw-border-main" : "",
        ].join(" ")}
      >
        <p className="tw-m-0" id={collaboration}>
          {collaboration}
        </p>
        <button
          type="button"
          aria-label={`Modifier la co-intervention ${collaboration}`}
          className="tw-ml-auto tw-hidden group-hover:tw-inline-flex"
          onClick={() => setIsEditingCollaboration(true)}
        >
          ✏️
        </button>
      </div>
      <ModalContainer open={isEditingCategory}>
        <ModalHeader title={`Éditer la collaboration: ${collaboration}`} />
        <ModalBody className="tw-py-4">
          <form id="edit-collaboration-form" className="tw-flex tw-w-full tw-flex-col tw-gap-4 tw-px-8" onSubmit={onEditCategory}>
            <div>
              <label htmlFor="newCollaboration" className="tailwindui">
                Nouvelle co-intervention
              </label>
              <input className="tailwindui" id="newCollaboration" name="newCollaboration" type="text" placeholder={collaboration} />
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <button type="button" name="cancel" className="button-cancel" onClick={() => setIsEditingCollaboration(false)}>
            Annuler
          </button>
          <button type="button" className="button-destructive" onClick={onDeleteCollaboration}>
            Supprimer
          </button>
          <button type="submit" className="button-submit" form="edit-collaboration-form">
            Enregistrer
          </button>
        </ModalFooter>
      </ModalContainer>
    </>
  );
};

export default CollaborationsSettings;
