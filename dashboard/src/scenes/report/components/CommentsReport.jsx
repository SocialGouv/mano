import React, { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import dayjs from "dayjs";
import { ModalHeader, ModalBody, ModalContainer, ModalFooter } from "../../../components/tailwind/Modal";
import { FullScreenIcon } from "../../../assets/icons/FullScreenIcon";
import TabsNav from "../../../components/tailwind/TabsNav";
import Table from "../../../components/table";
import ExclamationMarkButton from "../../../components/tailwind/ExclamationMarkButton";
import { organisationState, userState } from "../../../recoil/auth";
import { useRecoilValue } from "recoil";
import UserName from "../../../components/UserName";
import TagTeam from "../../../components/TagTeam";
import PersonName from "../../../components/PersonName";
import { useLocalStorage } from "../../../services/useLocalStorage";
import DateBloc, { TimeBlock } from "../../../components/DateBloc";
import { sortComments } from "../../../recoil/comments";

export const CommentsSocialAndMedical = ({ comments, commentsMedical }) => {
  const [activeTab, setActiveTab] = useLocalStorage("reports-comments-toggle", "Commentaires");
  const [fullScreen, setFullScreen] = useState(false);
  const user = useRecoilValue(userState);
  const canSeeMedicalData = ["admin", "normal"].includes(user.role) && !!user.healthcareProfessional;

  const data = canSeeMedicalData && activeTab.includes("Commentaires médicaux") ? commentsMedical : comments;
  const tabs = canSeeMedicalData
    ? [`Commentaires (${comments.length})`, `Commentaires médicaux (${commentsMedical.length})`]
    : [`Commentaires (${comments.length})`];

  return (
    <>
      <section title={activeTab} className="noprint tw-relative tw-flex tw-h-full tw-flex-col tw-overflow-hidden">
        <div className="tw-flex tw-items-center tw-bg-white tw-px-3 tw-py-3">
          <TabsNav
            className="tw-m-0 tw-flex-wrap tw-justify-start tw-border-b-0 tw-py-0.5 tw-pl-0 [&_button]:tw-text-xl"
            tabs={tabs}
            renderTab={(caption) => <h3 className="m-0 tw-text-base tw-font-medium">{caption}</h3>}
            onClick={(_, index) => setActiveTab(index === 0 ? "Commentaires" : "Commentaires médicaux")}
            activeTabIndex={activeTab.includes("Commentaires médicaux") ? 1 : 0}
          />
          <div className="flex-col tw-flex tw-items-center tw-gap-2">
            <button
              title="Passer les commentaires en plein écran"
              className={[
                "tw-h-6 tw-w-6 tw-rounded-full tw-transition hover:tw-scale-125 disabled:tw-cursor-not-allowed disabled:tw-opacity-30",
                activeTab.includes("Commentaires médicaux") ? "tw-text-blue-900" : "tw-text-main",
              ].join(" ")}
              disabled={!data.length}
              onClick={() => setFullScreen(true)}
            >
              <FullScreenIcon />
            </button>
          </div>
        </div>
        <div className="tw-grow tw-overflow-y-auto tw-border-t tw-border-main tw-border-opacity-20 tw-pb-10">
          <CommentsTable data={data} activeTab={activeTab} />
        </div>
      </section>
      <section
        aria-hidden="true"
        className="printonly tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow"
      >
        <div className="tw-flex tw-flex-col tw-items-stretch tw-bg-white tw-px-3 tw-py-3">
          <h3 className="tw-m-0 tw-text-base tw-font-medium">Commentaires ({comments.length})</h3>
        </div>
        <div className="tw-grow tw-overflow-y-auto tw-border-t tw-border-main tw-border-opacity-20">
          <CommentsTable data={comments} activeTab="Commentaires" />
        </div>
      </section>
      {!!canSeeMedicalData && (
        <section
          aria-hidden="true"
          className="printonly tw-mt-12 tw-flex tw-h-full tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow"
        >
          <div className="tw-flex tw-flex-col tw-items-stretch tw-bg-white tw-px-3 tw-py-3">
            <h3 className="tw-m-0 tw-text-base tw-font-medium">Commentaires médicaux ({commentsMedical.length})</h3>
          </div>
          <div className="tw-grow tw-overflow-y-auto tw-border-t tw-border-main tw-border-opacity-20">
            <CommentsTable data={commentsMedical} activeTab="Commentaires médicaux" />
          </div>
        </section>
      )}
      <ModalContainer open={!!fullScreen} className="" size="full" onClose={() => setFullScreen(false)}>
        <ModalHeader title={`${activeTab} (${data.length})`} onClose={() => setFullScreen(false)} />
        <ModalBody>
          <CommentsTable data={data} activeTab={activeTab} />
        </ModalBody>
        <ModalFooter>
          <button type="button" name="cancel" className="button-cancel" onClick={() => setFullScreen(false)}>
            Fermer
          </button>
        </ModalFooter>
      </ModalContainer>
    </>
  );
};

const CommentsTable = ({ data, activeTab }) => {
  const organisation = useRecoilValue(organisationState);
  const history = useHistory();
  const [sortOrder, setSortOrder] = useLocalStorage("comments-reports-sortOrder", "ASC");
  const [sortBy, setSortBy] = useLocalStorage("comments-reports-sortBy", "ASC");
  const dataSorted = useMemo(() => {
    return [...data].sort(sortComments(sortBy, sortOrder));
  }, [data, sortBy, sortOrder]);

  if (!dataSorted.length) {
    return (
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-6">
        <div className="tw-mb-2 tw-mt-8 tw-w-full tw-text-center tw-text-gray-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="tw-mx-auto tw-h-16 tw-w-16 tw-text-gray-200"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M3 20l1.3 -3.9a9 8 0 1 1 3.4 2.9l-4.7 1"></path>
            <line x1={12} y1={12} x2={12} y2="12.01"></line>
            <line x1={8} y1={12} x2={8} y2="12.01"></line>
            <line x1={16} y1={12} x2={16} y2="12.01"></line>
          </svg>
          Aucun commentaire pour le moment
        </div>
      </div>
    );
  }

  return (
    <Table
      className={activeTab.includes("Commentaires médicaux") ? "medical" : ""}
      data={dataSorted}
      onRowClick={(comment) => {
        const searchParams = new URLSearchParams(history.location.search);
        switch (comment.type) {
          case "action":
            searchParams.set("actionId", comment.action);
            history.push(`?${searchParams.toString()}`);
            break;
          case "person":
            history.push(`/person/${comment.person}`);
            break;
          case "consultation":
            searchParams.set("consultationId", comment.consultation._id);
            history.push(`?${searchParams.toString()}`);
            break;
          case "treatment":
            searchParams.set("treatmentId", comment.treatment._id);
            history.push(`?${searchParams.toString()}`);
            break;
          case "passage":
            history.push(`/person/${comment.person}?passageId=${comment.passage}`);
            break;
          case "rencontre":
            history.push(`/person/${comment.person}?rencontreId=${comment.rencontre}`);
            break;
          case "medical-file":
            history.push(`/person/${comment.person}?tab=Dossier+Médical`);
            break;
          default:
            break;
        }
      }}
      rowKey="_id"
      dataTestId="comment"
      columns={[
        {
          title: "Date",
          dataKey: "date",
          className: "tw-w-24",
          onSortOrder: setSortOrder,
          onSortBy: setSortBy,
          sortBy,
          sortOrder,
          render: (comment) => {
            return (
              <>
                <DateBloc date={comment.date || comment.createdAt} />
                <TimeBlock time={comment.date || comment.createdAt} />
                <div className="tw-mt-1 tw-flex tw-items-center tw-justify-center tw-gap-1">
                  {!!comment.urgent && <ExclamationMarkButton />}
                  {!!organisation.groupsEnabled && !!comment.group && (
                    <span className="tw-text-3xl" aria-label="Commentaire familial" title="Commentaire familial">
                      👪
                    </span>
                  )}
                </div>
              </>
            );
          },
        },
        {
          title: "Commentaire",
          dataKey: "comment",
          render: (comment) => {
            return (
              <>
                <p>
                  {comment.type === "action" && (
                    <>
                      Action <b>{comment.actionPopulated?.name} </b>
                      pour{" "}
                    </>
                  )}
                  {comment.type === "treatment" && <>Traitement pour </>}
                  {comment.type === "passage" && <>Passage pour </>}
                  {comment.type === "rencontre" && <>Rencontre pour </>}
                  {comment.type === "person" && <>Personne suivie </>}
                  {comment.type === "consultation" && <>Consultation pour </>}
                  {comment.type === "medical-file" && <>Personne suivie </>}
                  <b>
                    <PersonName item={comment} />
                  </b>
                </p>
                <p className="tw-mb-4">
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
                <p className="tw-font-medium tw-italic">
                  Par: <UserName id={comment.user} />
                </p>
              </>
            );
          },
        },
        {
          title: "Équipe en charge",
          dataKey: "team",
          render: (comment) => <TagTeam teamId={comment?.team} />,
        },
      ]}
    />
  );
};
