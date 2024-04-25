import React, { useMemo } from "react";
import { useHistory } from "react-router-dom";
import Table from "./table";
import ExclamationMarkButton from "./tailwind/ExclamationMarkButton";
import { organisationState } from "../recoil/auth";
import { useRecoilValue } from "recoil";
import UserName from "./UserName";
import TagTeam from "./TagTeam";
import PersonName from "./PersonName";
import { useLocalStorage } from "../services/useLocalStorage";
import DateBloc, { TimeBlock } from "./DateBloc";
import { sortComments } from "../recoil/comments";

export default function CommentsSortableList({ data, className = "" }) {
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
      className={className}
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
}
