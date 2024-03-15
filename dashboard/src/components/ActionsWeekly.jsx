import React, { useMemo } from "react";
import { useHistory } from "react-router-dom";
import { Button } from "reactstrap";
import { useRecoilValue } from "recoil";
import { CANCEL, DONE } from "../recoil/actions";
import { dayjsInstance, formatTime } from "../services/date";
import ActionOrConsultationName from "./ActionOrConsultationName";
import ExclamationMarkButton from "./tailwind/ExclamationMarkButton";
import PersonName from "./PersonName";
import { organisationState, userState } from "../recoil/auth";
import TagTeam from "./TagTeam";
import useSearchParamState from "../services/useSearchParamState";
import { disableConsultationRow } from "../recoil/consultations";
import ActionStatusSelect from "./ActionStatusSelect";

// TODO: remove inline style when UI is stabilized.

export default function ActionsWeekly({ actions, isNightSession, onCreateAction }) {
  const [startOfWeek, setStartOfWeek] = useSearchParamState("startOfWeek", dayjsInstance().startOf("week").format("YYYY-MM-DD"));

  const actionsInWeek = useMemo(() => {
    return actions.filter((action) =>
      dayjsInstance([DONE, CANCEL].includes(action.status) ? action.completedAt : action.dueAt).isBetween(
        dayjsInstance(startOfWeek),
        dayjsInstance(startOfWeek).add(7, "day").endOf("day"),
        null,
        "[)"
      )
    );
  }, [actions, startOfWeek]);

  return (
    <div>
      {!!isNightSession && (
        <div className="-tw-mt-8 tw-mb-8">
          <p className="tw-m-0 tw-text-center tw-text-xs tw-opacity-50">
            On affiche les actions faites/à faire entre midi de ce jour et 11h59 du jour suivant
          </p>
        </div>
      )}
      <div className="tw-mb-4 tw-flex tw-flex-row tw-items-center tw-gap-8">
        <Button color="secondary" outline={true} onClick={() => setStartOfWeek(dayjsInstance().startOf("week").format("YYYY-MM-DD"))}>
          Aujourd'hui
        </Button>
        <div className="tw-flex tw-flex-row tw-gap-1">
          <Button
            size="sm"
            color="secondary"
            outline={true}
            onClick={() => setStartOfWeek(dayjsInstance(startOfWeek).subtract(1, "week").startOf("week").format("YYYY-MM-DD"))}
          >
            &lt;
          </Button>
          <Button
            size="sm"
            color="secondary"
            outline={true}
            onClick={() => setStartOfWeek(dayjsInstance(startOfWeek).add(1, "week").startOf("week").format("YYYY-MM-DD"))}
          >
            &gt;
          </Button>
        </div>
        <div style={{ textTransform: "capitalize" }}>{dayjsInstance(startOfWeek).format("MMMM YYYY")}</div>
      </div>
      <div className="tw-grid tw-w-full tw-auto-rows-fr tw-grid-cols-7 tw-gap-x-2 tw-gap-y-0">
        {[...Array(7)].map((_, index) => {
          const day = dayjsInstance(startOfWeek).add(index, "day");
          const isToday = day.isSame(dayjsInstance(), "day");
          const offsetHours = isNightSession ? 12 : 0;
          const isoStartToday = dayjsInstance(day).startOf("day").add(offsetHours, "hour").toISOString();
          const isoEndToday = dayjsInstance(day).startOf("day").add(1, "day").add(offsetHours, "hour").toISOString();

          return (
            <div key={day.format("YYYY-MM-DD")}>
              <div className="tw-my-1.5 tw-text-center">
                <div className={["tw-text-xs", isToday ? "tw-text-[#1a73e8]" : ""].join(" ")}>{day.format("ddd")}</div>
                <div
                  className={[
                    "tw-mx-auto tw-mt-1 tw-h-9 tw-w-9 tw-text-xl tw-leading-9",
                    isToday ? "tw-rounded-full tw-bg-[#1a73e8] tw-text-white" : "",
                  ].join(" ")}
                >
                  {day.format("D")}
                </div>
              </div>
              <div className="tw-mb-4 tw-flex tw-flex-col tw-gap-0.5">
                <ActionsOfDay
                  actions={actionsInWeek.filter((a) => {
                    const date = [DONE, CANCEL].includes(a.status) ? a.completedAt : a.dueAt;
                    return date >= isoStartToday && date < isoEndToday;
                  })}
                />
                <button
                  type="button"
                  className="tw-mx-auto tw-my-0 tw-text-xs tw-text-neutral-400 tw-no-underline hover:tw-text-zinc-500 hover:tw-underline"
                  onClick={() => onCreateAction(day.toDate())}
                >
                  + ajouter une action
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionsOfDay({ actions }) {
  const history = useHistory();
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);

  const sortedActions = [
    // Urgent actions first
    ...actions.filter((action) => action.urgent),
    // Then actions with time ordered by dueAt
    ...actions
      .filter((action) => !action.urgent)
      .filter((action) => Boolean(action.withTime))
      .sort((a, b) => dayjsInstance(a.completedAt || a.dueAt).diff(dayjsInstance(b.completedAt || b.dueAt))),
    // Then actions without time.
    ...actions.filter((action) => !action.urgent).filter((action) => !action.withTime),
  ];

  return (
    <>
      {sortedActions.map((action) => (
        <div
          key={action._id}
          onClick={() => {
            const searchParams = new URLSearchParams(history.location.search);
            if (action.isConsultation) {
              if (disableConsultationRow(action, user)) return;
              searchParams.set("consultationId", action._id);
              history.push(`?${searchParams.toString()}`);
            } else {
              searchParams.set("actionId", action._id);
              history.push(`?${searchParams.toString()}`);
            }
          }}
          className={[
            Boolean(action.isConsultation) ? "tw-bg-[#DDF4FF99]" : Boolean(action.urgent) ? "tw-bg-[#fecaca99]" : "tw-bg-[#fafafa]",
            "tw-flex tw-cursor-pointer tw-flex-col tw-gap-2 tw-rounded-sm tw-border tw-border-gray-300 tw-p-1 tw-text-xs",
            disableConsultationRow(action, user) ? "tw-cursor-not-allowed" : "",
          ].join(" ")}
        >
          {(Boolean(action.isConsultation) || Boolean(action.urgent)) && (
            <div>
              {Boolean(action.urgent) && (
                <div className="tw-flex tw-flex-row tw-items-center tw-gap-2.5 tw-font-bold tw-text-[#dc2626]">
                  <ExclamationMarkButton />
                  Urgent
                </div>
              )}
              {Boolean(action.isConsultation) && (
                <div className="tw-flex tw-flex-row tw-items-center tw-font-bold tw-text-[#43738b]">
                  <i>🩺 Consultation</i>
                </div>
              )}
            </div>
          )}
          <div className="tw-flex tw-flex-col tw-gap-px">
            {Array.isArray(action?.teams) ? action.teams.map((e) => <TagTeam key={e} teamId={e} />) : <TagTeam teamId={action?.team} />}
          </div>
          <div>
            <ActionOrConsultationName item={action} />
          </div>
          {Boolean(action.withTime) && <div>🕑 {formatTime(action.dueAt)}</div>}
          <div>
            🧑 <PersonName item={action} />
          </div>
          {!!organisation.groupsEnabled && !!action.group && <div>👪 Action familiale</div>}
          <ActionStatusSelect action={action} />
        </div>
      ))}
    </>
  );
}
