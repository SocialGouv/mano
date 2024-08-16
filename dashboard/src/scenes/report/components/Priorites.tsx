import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useRecoilValue } from "recoil";
import { useLocalStorage } from "../../../services/useLocalStorage";
import { sortActionsOrConsultations } from "../../../recoil/actions";
import { personsState } from "../../../recoil/persons";
import ButtonCustom from "../../../components/ButtonCustom";
import { ModalContainer, ModalBody, ModalFooter } from "../../../components/tailwind/Modal";
import { NotificationActionList, NotificationCommentList } from "../../../components/Notification";

export default function Priorites({ actions, comments }) {
  const [showModal, setShowModal] = useState(false);
  const persons = useRecoilValue(personsState);

  const [actionsSortBy, setActionsSortBy] = useLocalStorage("actions-consultations-sortBy", "dueAt");
  const [actionsSortOrder, setActionsSortOrder] = useLocalStorage("actions-consultations-sortOrder", "ASC");

  const actionsFiltered = useMemo(
    () => actions.filter((action) => action.urgent).sort(sortActionsOrConsultations(actionsSortBy, actionsSortOrder)),
    [actions, actionsSortBy, actionsSortOrder]
  );

  const commentsFiltered = useMemo(
    () =>
      comments
        .filter((c) => c.urgent)
        .map((comment) => {
          const commentPopulated = { ...comment };
          if (comment.person) {
            const id = comment?.person;
            commentPopulated.personPopulated = persons.find((p) => p._id === id);
            commentPopulated.type = "person";
          }
          if (comment.action) {
            const id = comment?.action;
            const action = actions.find((p) => p._id === id);
            commentPopulated.actionPopulated = action;
            commentPopulated.personPopulated = persons.find((p) => p._id === action?.person);
            commentPopulated.type = "action";
          }
          return commentPopulated;
        })
        .filter((c) => c.actionPopulated || c.personPopulated)
        .sort((a, b) => dayjs(a.createdAt).diff(dayjs(b.createdAt))),
    [comments, persons, actions]
  );

  if (!actionsFiltered.length && !commentsFiltered.length) return null;
  return (
    <>
      <button className="button-classic tw-flex tw-items-center tw-gap-2 tw-w-full tw-mb-4" onClick={() => setShowModal(true)}>
        <svg width="16" height="16" viewBox="0 0 201 223">
          <path
            d="M193.31569,128.607426 L169.527584,105.067112 C163.580557,99.1200857 159.36808,91.1907169 157.633531,81.7745913 C153.916639,62.4467547 143.013757,46.0924314 126.411641,35.437342 C118.234479,30.2336936 109.313939,26.7645948 100.145606,25.0300453 C100.145606,23.5432886 99.8978134,22.3043248 99.6500206,20.8175681 C97.1720928,7.18896534 83.7912829,-1.73157464 70.1626801,0.746353129 C56.5340774,3.2242809 47.6135374,16.6050909 50.0914651,30.2336936 C50.3392579,31.7204503 50.8348435,32.9594142 51.330429,34.4461708 C32.7459707,45.8446386 19.8607463,65.6680608 17.6306113,88.2172035 C16.887233,95.1554013 17.1350258,101.845806 18.6217824,108.536211 C20.3563319,117.208958 19.6129535,125.38612 16.1438546,132.819903 L2.76304467,163.050622 C-0.953846987,171.475577 0.2851169,181.387288 5.98435078,188.573278 C10.6924135,194.768098 17.8784041,198.237197 25.5599802,198.237197 C27.0467369,198.237197 28.5334935,197.989404 30.0202502,197.741611 L42.1620963,195.511476 C46.6223663,211.618007 61.2421401,222.520889 77.5964634,222.520889 C79.8265984,222.520889 82.0567334,222.273096 84.5346612,221.777511 C94.1985795,220.042961 102.623534,214.343727 108.074975,206.414358 C113.030831,199.228368 115.013173,191.051206 114.269794,182.626252 L180.182673,170.979991 C189.351006,169.245442 196.784789,162.80283 199.51051,153.88229 C202.23623,144.96175 200.006095,135.297831 193.31569,128.607426 Z M62.481104,28.0035586 C61.7377257,24.5344598 62.481104,21.3131536 64.4634462,18.3396403 C66.4457885,15.6139198 69.171509,13.6315776 72.6406079,12.8881992 C76.1097068,12.1448209 79.3310129,12.8881992 82.3045262,14.8705414 C85.0302468,16.8528837 87.012589,19.5786042 87.7559673,23.0477031 C87.7559673,23.2954959 87.7559673,23.5432886 87.7559673,23.7910814 C82.3045262,23.7910814 76.8530851,24.5344598 71.401644,25.7734236 C68.4281307,26.516802 65.7024101,27.5079731 62.9766896,28.4991442 C62.7288968,28.4991442 62.481104,28.2513514 62.481104,28.0035586 Z M97.6676784,199.476161 C93.9507867,204.927602 88.4993456,208.396701 82.0567334,209.635664 C69.9148873,211.865799 58.020834,204.679809 54.3039424,193.281341 L101.880156,184.856387 C102.127948,190.060035 100.641192,195.015891 97.6676784,199.476161 Z M187.616457,150.165398 C186.1297,154.625668 182.660601,157.846974 177.952538,158.838145 L27.7901152,185.599765 C23.0820524,186.343143 18.6217824,184.608594 15.6482691,180.891702 C12.6747558,177.174811 12.1791702,172.466748 14.1615124,168.006478 L27.5423224,137.775759 C31.7547996,128.111841 32.9937635,117.208958 30.7636285,106.058284 C29.7724574,100.606842 29.5246646,94.9076085 30.0202502,89.4561674 C32.498178,64.6768897 50.3392579,43.8622964 74.1273645,38.1630625 C78.8354273,36.9240986 83.5434901,36.4285131 88.2515529,36.4285131 C99.4022278,36.4285131 110.30511,39.6498192 119.721236,45.8446386 C133.349838,54.5173858 142.518171,68.1459886 145.491684,84.2525191 C147.721819,95.8987796 152.925468,106.306076 160.854837,113.987652 L184.642943,137.527966 C187.864249,140.749272 189.103213,145.457335 187.616457,150.165398 Z"
            id="Shape"
            fill="currentColor"
            fillRule="nonzero"
          />
        </svg>
        Voir les priorités ({actionsFiltered.length + commentsFiltered.length})
      </button>
      <ModalContainer open={showModal} onClose={() => setShowModal(false)} size="full">
        <ModalBody className="relative tw-mb-6">
          <NotificationActionList
            title="Actions urgentes et vigilance de la période sélectionnée"
            setShowModal={setShowModal}
            actions={actionsFiltered}
            setSortOrder={setActionsSortOrder}
            setSortBy={setActionsSortBy}
            sortBy={actionsSortBy}
            sortOrder={actionsSortOrder}
            showTeam={true}
          />
          <NotificationCommentList
            title="Commentaires urgents et vigilance de la période sélectionnée"
            setShowModal={setShowModal}
            comments={commentsFiltered}
            showTeam={true}
          />
        </ModalBody>
        <ModalFooter>
          <button type="button" name="cancel" className="button-cancel" onClick={() => setShowModal(false)}>
            Fermer
          </button>
        </ModalFooter>
      </ModalContainer>
    </>
  );
}
