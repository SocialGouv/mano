import { useMemo } from "react";
import { useRecoilValue } from "recoil";
import { toast } from "react-toastify";
import { CommentsModule } from "../../../components/CommentsGeneric";
import { prepareCommentForEncryption, encryptComment } from "../../../recoil/comments";
import API, { tryFetchExpectOk } from "../../../services/api";
import { organisationState, userState } from "../../../recoil/auth";
import { groupsState } from "../../../recoil/groups";
import { useDataLoader } from "../../../components/DataLoader";
import { errorMessage } from "../../../utils";

export default function Comments({ person }) {
  const organisation = useRecoilValue(organisationState);
  const groups = useRecoilValue(groupsState);
  const { refresh } = useDataLoader();
  const user = useRecoilValue(userState);
  // On affiche les commentaires médicaux partagés par les professionnels de santés
  // à tout le monde s'ils ont coché la case "Partager avec les professionnels non-médicaux"
  const medicalCommentsVisibleByAll = useMemo(() => {
    return [...(person?.commentsMedical || [])]
      .filter((e) => e.share === true)
      .map((e) => ({ ...e, isMedicalCommentShared: true }))
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }, [person, user.healthcareProfessional]);
  const comments = useMemo(
    () =>
      [...(person?.comments || []), ...medicalCommentsVisibleByAll].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)),
    [person, medicalCommentsVisibleByAll]
  );

  const canToggleGroupCheck = useMemo(
    () => !!organisation.groupsEnabled && !!person._id && groups.find((group) => group.persons.includes(person._id)),
    [groups, person._id, organisation.groupsEnabled]
  );

  return (
    <div className="tw-relative">
      <CommentsModule
        comments={comments}
        personId={person._id}
        typeForNewComment="person"
        canToggleGroupCheck={canToggleGroupCheck}
        canToggleUrgentCheck
        showPanel
        onDeleteComment={async (comment) => {
          window.sessionStorage.removeItem("currentComment");
          const [error] = await tryFetchExpectOk(async () => API.delete({ path: `/comment/${comment._id}` }));
          if (error) {
            toast.error(errorMessage(error));
            return;
          }
          await refresh();
          toast.success("Commentaire supprimé !");
        }}
        onSubmitComment={async (comment, isNewComment) => {
          if (isNewComment) {
            const [error] = await tryFetchExpectOk(async () =>
              API.post({
                path: "/comment",
                body: await encryptComment(comment),
              })
            );
            if (!error) {
              toast.success("Commentaire enregistré");
              await refresh();
            } else {
              toast.error(errorMessage(error));
            }
          } else {
            const [error] = await tryFetchExpectOk(async () =>
              API.put({
                path: `/comment/${comment._id}`,
                body: await encryptComment(comment),
              })
            );
            if (!error) {
              toast.success("Commentaire enregistré");
              await refresh();
            } else {
              toast.error(errorMessage(error));
            }
          }
        }}
      />
    </div>
  );
}
