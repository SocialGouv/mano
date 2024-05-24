import { useRecoilValue } from "recoil";
import { DONE, TODO, CANCEL, prepareActionForEncryption } from "../recoil/actions";
import API from "../services/api";
import { now } from "../services/date";
import { toast } from "react-toastify";
import { organisationState, userState } from "../recoil/auth";
import { prepareConsultationForEncryption } from "../recoil/consultations";
import { ConsultationInstance } from "../types/consultation";
import { ActionInstance } from "../types/action";
import { useDataLoader } from "./DataLoader";

function isConsultation(action: ActionInstance | ConsultationInstance): action is ConsultationInstance {
  return action.isConsultation !== undefined && action.isConsultation;
}

export default function ActionStatusSelect({ action }: { action: ActionInstance | ConsultationInstance }) {
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const { refresh } = useDataLoader();

  if (!organisation || !user) return null;

  return (
    <select
      className={`tw-cursor-pointer tw-appearance-none tw-rounded tw-border-none tw-px-2 tw-transition hover:tw-scale-105 ${
        action.status === DONE ? "tw-bg-green-700" : action.status === TODO ? "tw-bg-red-700" : "tw-bg-cyan-700"
      } tw-text-center tw-text-[11px] tw-font-bold tw-text-white tw-outline-none`}
      value={action.status}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onChange={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const status = e.target.value;
        const completedAt = status === TODO ? null : action.completedAt || now();
        const updatedUser = action.user || user._id;
        const historyEntry = {
          date: new Date(),
          user: user._id,
          data: {
            status: { oldValue: action.status, newValue: status },
            completedAt: { oldValue: action.completedAt, newValue: completedAt },
          },
        };
        const updatedHistory = [...(action.history || []), historyEntry];

        if (isConsultation(action)) {
          const consultation = action;
          const consultationResponse = await API.put({
            path: `/consultation/${consultation._id}`,
            body: prepareConsultationForEncryption(organisation.consultations)({
              ...consultation,
              status,
              completedAt,
              user: updatedUser,
              history: updatedHistory,
            }),
          });
          if (!consultationResponse.ok) {
            toast.error("Erreur lors de la mise à jour de la consultation");
            return;
          }
          await refresh();
          toast.success("Le statut de la consultation a été mis à jour");
          return;
        } else {
          const actionResponse = await API.put({
            path: `/action/${action._id}`,
            body: prepareActionForEncryption({
              ...action,
              status,
              completedAt,
              user: updatedUser,
              history: updatedHistory,
            }),
          });
          if (!actionResponse.ok) {
            toast.error("Erreur lors de la mise à jour de l'action");
            return;
          }
          await refresh();
          toast.success("Le statut de l'action a été mis à jour");
        }
      }}
    >
      <option value={TODO}>À faire</option>
      <option value={DONE}>Fait</option>
      <option value={CANCEL}>Annulé</option>
    </select>
  );
}
