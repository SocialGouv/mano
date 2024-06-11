import { useMemo } from "react";
import { useHistory } from "react-router-dom";
import { useRecoilValue } from "recoil";
import Table from "./table";
import DateBloc, { TimeBlock } from "./DateBloc";
import ActionOrConsultationName from "./ActionOrConsultationName";
import PersonName from "./PersonName";
import { CANCEL, DONE, sortActionsOrConsultations } from "../recoil/actions";
import { currentTeamState, organisationState, userState } from "../recoil/auth";
import ExclamationMarkButton from "./tailwind/ExclamationMarkButton";
import useTitle from "../services/useTitle";
import ConsultationButton from "./ConsultationButton";
import { disableConsultationRow } from "../recoil/consultations";
import TagTeam from "./TagTeam";
import { useLocalStorage } from "../services/useLocalStorage";
import Page from "./pagination";
import useSearchParamState from "../services/useSearchParamState";
import DescriptionIcon from "./DescriptionIcon";
import { AgendaMutedIcon } from "../assets/icons/AgendaMutedIcon";
import ActionStatusSelect from "./ActionStatusSelect";

const ActionsSortableList = ({ data, limit = 0 }) => {
  useTitle("Agenda");
  const history = useHistory();
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const organisation = useRecoilValue(organisationState);
  const [sortBy, setSortBy] = useLocalStorage("actions-consultations-sortBy", "dueAt");
  const [sortOrder, setSortOrder] = useLocalStorage("actions-consultations-sortOrder", "ASC");
  const [page, setPage] = useSearchParamState("page", 0, { resetToDefaultIfTheFollowingValueChange: currentTeam?._id });

  const dataSorted = useMemo(() => {
    return [...data].sort(sortActionsOrConsultations(sortBy, sortOrder)).map((a) => {
      if (a.urgent) return { ...a, style: { backgroundColor: "#fecaca99" } };
      if (a.isConsultation) return { ...a, style: { backgroundColor: "#DDF4FF99" } };
      return a;
    });
  }, [data, sortBy, sortOrder]);

  const dataConsolidatedPaginated = useMemo(() => {
    if (limit > 0) return dataSorted.slice(page * limit, (page + 1) * limit);
    return dataSorted;
  }, [dataSorted, page, limit]);

  const total = data.length;

  if (total <= 0) {
    return (
      <div className="tw-mt-8 tw-w-full tw-text-center tw-text-gray-300">
        <AgendaMutedIcon />
        Aucun élément pour le moment
      </div>
    );
  }

  return (
    <>
      <Table
        data={dataConsolidatedPaginated}
        rowKey={"_id"}
        onRowClick={(actionOrConsultation) => {
          const searchParams = new URLSearchParams(history.location.search);
          if (actionOrConsultation.isConsultation) {
            searchParams.set("consultationId", actionOrConsultation._id);
            history.push(`?${searchParams.toString()}`);
          } else {
            searchParams.set("actionId", actionOrConsultation._id);
            history.push(`?${searchParams.toString()}`);
          }
        }}
        rowDisabled={(actionOrConsultation) => disableConsultationRow(actionOrConsultation, user)}
        columns={[
          {
            title: "",
            dataKey: "urgentOrGroupOrConsultation",
            small: true,
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortBy,
            sortOrder,
            render: (actionOrConsult) => {
              return (
                <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2">
                  {!!actionOrConsult.urgent && <ExclamationMarkButton />}
                  {!!actionOrConsult.description && <DescriptionIcon />}
                  {!!organisation.groupsEnabled && !!actionOrConsult.group && (
                    <span className="tw-text-3xl" aria-label="Action familiale" title="Action familiale">
                      👪
                    </span>
                  )}
                  {!!actionOrConsult.isConsultation && <ConsultationButton />}
                </div>
              );
            },
          },
          {
            title: "Date",
            dataKey: "dueAt" || "_id",
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortBy,
            sortOrder,
            style: { width: "90px" },
            small: true,
            render: (action) => {
              return (
                <>
                  <DateBloc date={[DONE, CANCEL].includes(action.status) ? action.completedAt : action.dueAt} />
                  {!action.dueAt || !action.withTime ? null : <TimeBlock time={action.dueAt} />}
                </>
              );
            },
          },
          {
            title: "Nom",
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortBy,
            sortOrder,
            dataKey: "name",
            render: (action) => <ActionOrConsultationName item={action} />,
          },
          {
            title: "Personne suivie",
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortBy,
            sortOrder,
            dataKey: "person",
            render: (action) => <PersonName item={action} />,
          },
          {
            title: "Statut",
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            small: true,
            sortBy,
            sortOrder,
            dataKey: "status",
            style: { width: "85px" },
            render: (action) => <ActionStatusSelect action={action} />,
          },
          {
            title: "Équipe(s) en charge",
            dataKey: "team",
            render: (a) => {
              if (!Array.isArray(a?.teams)) return <TagTeam teamId={a?.team} />;
              return (
                <div className="tw-flex tw-flex-col">
                  {a.teams.map((e) => (
                    <TagTeam key={e} teamId={e} />
                  ))}
                </div>
              );
            },
          },
        ]}
      />
      {limit > 0 && <Page page={page} limit={limit} total={total} onChange={({ page }) => setPage(page, true)} />}
    </>
  );
};

export default ActionsSortableList;
