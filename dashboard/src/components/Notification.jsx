import dayjs from "dayjs";
import React, { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { useLocalStorage } from "../services/useLocalStorage";
import { actionsState, CANCEL, DONE, encryptAction, sortActionsOrConsultations, TODO } from "../recoil/actions";
import { currentTeamState, userState } from "../recoil/auth";
import { commentsState, encryptComment } from "../recoil/comments";
import { personsState } from "../recoil/persons";
import { formatTime } from "../services/date";
import ButtonCustom from "./ButtonCustom";
import DateBloc, { TimeBlock } from "./DateBloc";
import Table from "./table";
import UserName from "./UserName";
import API, { tryFetchExpectOk } from "../services/api";
import { ModalContainer, ModalBody, ModalFooter } from "./tailwind/Modal";
import PersonName from "./PersonName";
import BellIconWithNotifications from "../assets/icons/BellIconWithNotifications";
import { useDataLoader } from "./DataLoader";
import ActionOrConsultationName from "./ActionOrConsultationName";

export default function Notification() {
  const [showModal, setShowModal] = useState(false);
  const currentTeam = useRecoilValue(currentTeamState);
  const persons = useRecoilValue(personsState);
  const actions = useRecoilValue(actionsState);
  const comments = useRecoilValue(commentsState);

  const [actionsSortBy, setActionsSortBy] = useLocalStorage("actions-consultations-sortBy", "dueAt");
  const [actionsSortOrder, setActionsSortOrder] = useLocalStorage("actions-consultations-sortOrder", "ASC");

  const actionsFiltered = useMemo(
    () =>
      actions
        .filter((action) => {
          return (
            (Array.isArray(action.teams) ? action.teams.includes(currentTeam?._id) : action.team === currentTeam?._id) &&
            action.status === TODO &&
            action.urgent
          );
        })
        .sort(sortActionsOrConsultations(actionsSortBy, actionsSortOrder)),
    [actions, currentTeam?._id, actionsSortBy, actionsSortOrder]
  );

  const commentsFiltered = useMemo(
    () =>
      comments
        .filter((c) => c.urgent && (Array.isArray(c.teams) ? c.teams.includes(currentTeam?._id) : c.team === currentTeam?._id))
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
    [comments, persons, actions, currentTeam?._id]
  );

  if (!actionsFiltered.length && !commentsFiltered.length) return null;
  return (
    <>
      <button
        type="button"
        aria-label="Actions et commentaires urgents et vigilance"
        className="tw-flex tw-self-center"
        onClick={() => setShowModal(true)}
      >
        <BellIconWithNotifications size={24} notificationsNumber={actionsFiltered.length + commentsFiltered.length} />
      </button>
      <ModalContainer open={showModal} onClose={() => setShowModal(false)} size="full">
        <ModalBody className="relative tw-mb-6">
          <Actions
            setShowModal={setShowModal}
            actions={actionsFiltered}
            setSortOrder={setActionsSortOrder}
            setSortBy={setActionsSortBy}
            sortBy={actionsSortBy}
            sortOrder={actionsSortOrder}
          />
          <Comments setShowModal={setShowModal} comments={commentsFiltered} />
        </ModalBody>
        <ModalFooter>
          <ButtonCustom className="tw-mx-auto tw-my-4" title="OK, merci" onClick={() => setShowModal(false)} />
        </ModalFooter>
      </ModalContainer>
    </>
  );
}

const Actions = ({ setShowModal, actions, setSortOrder, setSortBy, sortBy, sortOrder }) => {
  const history = useHistory();
  const user = useRecoilValue(userState);
  const { refresh } = useDataLoader();
  if (!actions.length) return null;
  return (
    <div role="dialog" title="Actions urgentes et vigilance" name="Actions urgentes et vigilance">
      <h3 className="tw-mb-0 tw-flex tw-w-full tw-max-w-full tw-shrink-0 tw-items-center tw-justify-between tw-rounded-t-lg tw-border-b tw-border-gray-200 tw-bg-white tw-px-4 tw-py-4 tw-text-lg tw-font-medium tw-leading-6 tw-text-gray-900 sm:tw-px-6">
        Actions urgentes et vigilance
      </h3>
      <Table
        data={actions}
        rowKey={"_id"}
        dataTestId="name"
        onRowClick={(action) => {
          setShowModal(false);
          const searchParams = new URLSearchParams(history.location.search);
          searchParams.set("actionId", action._id);
          history.push(`?${searchParams.toString()}`);
        }}
        columns={[
          {
            title: "Date",
            dataKey: "dueAt",
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortBy,
            sortOrder,
            render: (action) => {
              return <DateBloc date={[DONE, CANCEL].includes(action.status) ? action.completedAt : action.dueAt} />;
            },
          },
          {
            title: "Heure",
            dataKey: "_id",
            render: (action) => {
              if (!action.dueAt || !action.withTime) return null;
              return formatTime(action.dueAt);
            },
          },
          {
            title: "Nom",
            dataKey: "name",
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortBy,
            sortOrder,
            render: (action) => <ActionOrConsultationName item={action} />,
          },
          {
            title: "Personne suivie",
            dataKey: "person",
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortBy,
            sortOrder,
            render: (action) => (
              <PersonName
                item={action}
                onClick={() => {
                  setShowModal(false);
                  history.push(`/person/${action.person}?tab=Résumé`);
                }}
              />
            ),
          },
          {
            title: "",
            dataKey: "urgent",
            small: true,
            className: "!tw-min-w-0 !tw-w-4",
            render: (action) => {
              return (
                <button
                  className="button-destructive !tw-ml-0"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const [error] = await tryFetchExpectOk(async () =>
                      API.put({
                        path: `/action/${action._id}`,
                        body: await encryptAction({ ...action, urgent: false, user: action.user || user._id }),
                      })
                    );
                    if (!error) {
                      await refresh();
                    }
                  }}
                >
                  Déprioriser
                </button>
              );
            },
          },
        ]}
      />
    </div>
  );
};

const Comments = ({ setShowModal, comments }) => {
  const history = useHistory();
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const { refresh } = useDataLoader();

  if (!comments.length) return null;
  return (
    <div role="dialog" title="Commentaires urgents et vigilance" name="Commentaires urgents et vigilance">
      <h3 className="tw-mb-0 tw-flex tw-w-full tw-max-w-full tw-shrink-0 tw-items-center tw-justify-between tw-rounded-t-lg tw-border-y tw-border-gray-200 tw-bg-white tw-px-4 tw-py-4 tw-text-lg tw-font-medium tw-leading-6 tw-text-gray-900 sm:tw-px-6">
        Commentaires urgents et vigilance
      </h3>
      <Table
        data={comments}
        rowKey={"_id"}
        dataTestId="comment"
        onRowClick={(comment) => {
          setShowModal(false);
          if (comment.type === "action") {
            const searchParams = new URLSearchParams(history.location.search);
            searchParams.set("actionId", comment.action);
            history.push(`?${searchParams.toString()}`);
          } else {
            history.push(`/person/${comment.person}`);
          }
        }}
        columns={[
          {
            title: "Date",
            dataKey: "date",
            render: (comment) => {
              return (
                <>
                  <DateBloc date={comment.date || comment.createdAt} />
                  <TimeBlock time={comment.date || comment.createdAt} />
                </>
              );
            },
          },
          {
            title: "Utilisateur",
            dataKey: "user",
            render: (comment) => <UserName id={comment.user} />,
          },
          {
            title: "Commentaire",
            dataKey: "comment",
            render: (comment) => {
              return (
                <>
                  {comment.type === "action" && (
                    <p>
                      Action <b>{comment.actionPopulated?.name} </b>
                      pour{" "}
                      <b>
                        <PersonName
                          item={comment}
                          onClick={() => {
                            setShowModal(false);
                            history.push(`/person/${comment.personPopulated._id}?tab=Résumé`);
                          }}
                        />
                      </b>
                    </p>
                  )}
                  {comment.type === "person" && (
                    <p>
                      Personne suivie:{" "}
                      <b>
                        <PersonName
                          onClick={() => {
                            setShowModal(false);
                            history.push(`/person/${comment.person}?tab=Résumé`);
                          }}
                          item={comment}
                        />
                      </b>
                    </p>
                  )}
                  <p>
                    {comment.comment
                      ? comment.comment.split("\n").map((c, i, a) => {
                          if (i === a.length - 1) return c;
                          return (
                            <React.Fragment key={i}>
                              {c}
                              <br />
                            </React.Fragment>
                          );
                        })
                      : ""}
                  </p>
                </>
              );
            },
          },
          {
            title: "",
            dataKey: "urgent",
            small: true,
            className: "!tw-min-w-0 !tw-w-4",
            render: (comment) => {
              return (
                <button
                  className="button-destructive !tw-ml-0"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const [error] = await tryFetchExpectOk(async () =>
                      API.put({
                        path: `/comment/${comment._id}`,
                        body: await encryptComment({
                          ...comment,
                          user: comment.user || user._id,
                          team: comment.team || currentTeam._id,
                          urgent: false,
                        }),
                      })
                    );
                    if (!error) {
                      await refresh();
                    }
                  }}
                >
                  Déprioriser
                </button>
              );
            },
          },
        ]}
      />
    </div>
  );
};
