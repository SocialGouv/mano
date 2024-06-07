import React from "react";
import { useHistory } from "react-router-dom";
import { toast } from "react-toastify";
import { useRecoilValue } from "recoil";
import { actionsState, encryptAction } from "../../../recoil/actions";
import API, { tryFetchExpectOk } from "../../../services/api";
import { commentsState, encryptComment } from "../../../recoil/comments";
import { passagesState } from "../../../recoil/passages";
import { rencontresState } from "../../../recoil/rencontres";
import DeleteButtonAndConfirmModal from "../../../components/DeleteButtonAndConfirmModal";
import { relsPersonPlaceState } from "../../../recoil/relPersonPlace";
import { medicalFileState } from "../../../recoil/medicalFiles";
import { consultationsState } from "../../../recoil/consultations";
import { treatmentsState } from "../../../recoil/treatments";
import { userState } from "../../../recoil/auth";
import { useDataLoader } from "../../../components/DataLoader";
import { prepareGroupForEncryption } from "../../../recoil/groups";
import { encryptItem } from "../../../services/encryption";

const DeletePersonButton = ({ person }) => {
  const actions = useRecoilValue(actionsState);
  const comments = useRecoilValue(commentsState);
  const passages = useRecoilValue(passagesState);
  const rencontres = useRecoilValue(rencontresState);
  const consultations = useRecoilValue(consultationsState);
  const treatments = useRecoilValue(treatmentsState);
  const medicalFiles = useRecoilValue(medicalFileState);
  const relsPersonPlace = useRecoilValue(relsPersonPlaceState);
  const user = useRecoilValue(userState);
  const history = useHistory();
  const { refresh } = useDataLoader();

  return (
    <DeleteButtonAndConfirmModal
      title={`Voulez-vous vraiment supprimer la personne ${person.name}`}
      textToConfirm={person.name || "Nom de la personne non renseigné"}
      roles={["normal", "admin", "superadmin"]}
      roleErrorMessage="Désolé, seules les personnes autorisées peuvent supprimer des personnes"
      onConfirm={async () => {
        if (
          !user.healthcareProfessional &&
          (!!medicalFiles.find((c) => c.person === person._id) ||
            !!treatments.find((c) => c.person === person._id) ||
            !!consultations.find((c) => c.person === person._id))
        ) {
          if (
            !window.confirm(
              "Des données médicales sont associées à cette personne. Si vous la supprimez, ces données seront également effacées. Vous n’avez pas accès à ces données médicales car vous n’êtes pas un·e professionnel·le de santé. Voulez-vous supprimer cette personne et toutes ses données ?"
            )
          )
            return;
        }

        const body = {
          // groupToUpdate: undefined,
          // groupIdToDelete: undefined,
          actionsToTransfer: [],
          commentsToTransfer: [],
          actionIdsToDelete: [],
          commentIdsToDelete: [],
          passageIdsToDelete: [],
          rencontreIdsToDelete: [],
          consultationIdsToDelete: [],
          treatmentIdsToDelete: [],
          medicalFileIdsToDelete: [],
          relsPersonPlaceIdsToDelete: [],
        };

        if (person.group) {
          const updatedGroup = {
            ...person.group,
            persons: person.group.persons.filter((p) => p !== person._id),
            relations: person.group.relations.filter((r) => !r.persons.includes(person._id)),
          };
          const personTransferId = person.group.persons.find((p) => p !== person._id);
          if (updatedGroup.relations.length === 0) {
            body.groupIdToDelete = person.group._id;
          } else {
            body.groupToUpdate = await encryptItem(prepareGroupForEncryption(updatedGroup));
          }
          if (personTransferId) {
            body.actionsToTransfer = await Promise.all(
              actions
                .filter((a) => a.person === person._id && a.group === true)
                .map((action) => encryptAction({ ...action, person: personTransferId, user: action.user || user._id }))
            );

            body.commentsToTransfer = await Promise.all(
              comments
                .filter((c) => c.person === person._id && c.group === true)
                .map((comment) => encryptComment({ ...comment, person: personTransferId }))
            );
          }
        }
        const actionIdsToDelete = actions.filter((a) => a.group === false && a.person === person._id).map((a) => a._id);
        const commentIdsToDelete = comments
          .filter((c) => {
            if (c.group) return false;
            if (actionIdsToDelete.includes(c.action)) return true;
            if (c.person === person._id) return true;
            return false;
          })
          .map((c) => c._id);
        body.actionIdsToDelete = actionIdsToDelete;
        body.commentIdsToDelete = commentIdsToDelete;
        body.relsPersonPlaceIdsToDelete = relsPersonPlace.filter((rel) => rel.person === person._id).map((rel) => rel._id);
        body.passageIdsToDelete = passages.filter((c) => c.person === person._id).map((c) => c._id);
        body.rencontreIdsToDelete = rencontres.filter((c) => c.person === person._id).map((c) => c._id);
        body.consultationIdsToDelete = consultations.filter((c) => c.person === person._id).map((c) => c._id);
        body.treatmentIdsToDelete = treatments.filter((c) => c.person === person._id).map((c) => c._id);
        body.medicalFileIdsToDelete = medicalFiles.filter((c) => c.person === person._id).map((c) => c._id);

        const [error] = await tryFetchExpectOk(async () => API.delete({ path: `/person/${person._id}`, body }));
        if (!error) {
          toast.success("Suppression réussie");
          await refresh();
          history.goBack();
        }
      }}
    >
      <span style={{ marginBottom: 30, display: "block", width: "100%", textAlign: "center" }}>
        Cette opération est irréversible
        <br />
        et entrainera la suppression définitive de toutes les données liées à la personne&nbsp;:
        <br />
        actions, commentaires, lieux visités, passages, rencontres, documents...
      </span>
    </DeleteButtonAndConfirmModal>
  );
};

export default DeletePersonButton;
