import { useState } from "react";
import { useRecoilValue, selectorFamily } from "recoil";
import { organisationState, userState } from "../../../recoil/auth";
import { CANCEL, DONE, flattenedActionsCategoriesSelector, mappedIdsToLabels } from "../../../recoil/actions";
import { useHistory } from "react-router-dom";
import SelectCustom from "../../../components/SelectCustom";
import ExclamationMarkButton from "../../../components/tailwind/ExclamationMarkButton";
import TagTeam from "../../../components/TagTeam";
import ActionOrConsultationName from "../../../components/ActionOrConsultationName";
import { formatDateWithNameOfDay, formatTime } from "../../../services/date";
import { ModalHeader, ModalBody, ModalContainer, ModalFooter } from "../../../components/tailwind/Modal";
import { AgendaMutedIcon } from "../../../assets/icons/AgendaMutedIcon";
import { FullScreenIcon } from "../../../assets/icons/FullScreenIcon";
import UserName from "../../../components/UserName";
import { itemsGroupedByPersonSelector } from "../../../recoil/selectors";
import DescriptionIcon from "../../../components/DescriptionIcon";
import SelectTeamMultiple from "../../../components/SelectTeamMultiple";
import ActionStatusSelect from "../../../components/ActionStatusSelect";

const filteredPersonActionsSelector = selectorFamily({
  key: "filteredPersonActionsSelector",
  get:
    ({ personId, filterCategories, filterStatus, filterTeamIds }) =>
    ({ get }) => {
      const person = get(itemsGroupedByPersonSelector)[personId];
      let actionsToSet = person?.actions || [];

      if (filterCategories.length) {
        actionsToSet = actionsToSet.filter((a) =>
          filterCategories.some((c) => (c === "-- Aucune --" ? a.categories?.length === 0 : a.categories?.includes(c)))
        );
      }
      if (filterStatus.length) {
        actionsToSet = actionsToSet.filter((a) => filterStatus.some((s) => a.status === s));
      }
      if (filterTeamIds.length) {
        actionsToSet = actionsToSet.filter((action) => {
          if (Array.isArray(action.teams)) {
            if (!filterTeamIds.some((t) => action.teams.includes(t))) return false;
          } else {
            if (!filterTeamIds.includes(action.team)) return false;
          }
          return true;
        });
      }
      return [...actionsToSet]
        .sort((p1, p2) => ((p1.completedAt || p1.dueAt) > (p2.completedAt || p2.dueAt) ? -1 : 1))
        .map((a) => (a.urgent ? { ...a, style: { backgroundColor: "#fecaca99" } } : a));
    },
});

export const Actions = ({ person }) => {
  const data = person?.actions || [];
  const [fullScreen, setFullScreen] = useState(false);
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterStatus, setFilterStatus] = useState([]);
  const [filterTeamIds, setFilterTeamIds] = useState([]);
  const filteredData = useRecoilValue(filteredPersonActionsSelector({ personId: person._id, filterCategories, filterStatus, filterTeamIds }));
  const history = useHistory();

  return (
    <section title="Actions de la personne suivie" className="tw-relative tw-overflow-x-hidden">
      <div className="tw-sticky tw-top-0 tw-z-10 tw-flex tw-bg-white tw-p-3 tw-shadow-sm">
        <h4 className="tw-flex-1 tw-text-xl">Actions {filteredData.length ? `(${filteredData.length})` : ""}</h4>
        <div className="flex-col tw-flex tw-items-center tw-gap-2">
          <button
            aria-label="Ajouter une action"
            className="tw-text-md tw-h-8 tw-w-8 tw-rounded-full tw-bg-main tw-font-bold tw-text-white tw-transition hover:tw-scale-125"
            onClick={() => {
              const searchParams = new URLSearchParams(history.location.search);
              searchParams.set("newAction", true);
              searchParams.set("personId", person._id);
              history.push(`?${searchParams.toString()}`);
            }}
          >
            ＋
          </button>
          {Boolean(filteredData.length) && (
            <button
              title="Passer les actions en plein écran"
              className="tw-h-6 tw-w-6 tw-rounded-full tw-text-main tw-transition hover:tw-scale-125"
              onClick={() => setFullScreen(true)}
            >
              <FullScreenIcon />
            </button>
          )}
        </div>
      </div>
      <ActionsFilters
        data={data}
        setFilterCategories={setFilterCategories}
        filterCategories={filterCategories}
        setFilterStatus={setFilterStatus}
        filterStatus={filterStatus}
        setFilterTeamIds={setFilterTeamIds}
        filterTeamIds={filterTeamIds}
      />
      <ModalContainer open={!!fullScreen} className="" size="prose" onClose={() => setFullScreen(false)}>
        <ModalHeader title={`Actions de  ${person?.name} (${filteredData.length})`}>
          <div className="tw-mt-2 tw-w-full tw-max-w-2xl">
            <ActionsFilters
              data={data}
              setFilterCategories={setFilterCategories}
              filterCategories={filterCategories}
              setFilterStatus={setFilterStatus}
              filterStatus={filterStatus}
              setFilterTeamIds={setFilterTeamIds}
              filterTeamIds={filterTeamIds}
            />
          </div>
        </ModalHeader>
        <ModalBody>
          <ActionsTable filteredData={filteredData} />
        </ModalBody>
        <ModalFooter>
          <button type="button" name="cancel" className="button-cancel" onClick={() => setFullScreen(false)}>
            Fermer
          </button>
          <button
            type="button"
            className="button-submit"
            onClick={() => {
              const searchParams = new URLSearchParams(history.location.search);
              searchParams.set("newAction", true);
              history.push(`?${searchParams.toString()}`);
            }}
          >
            ＋ Ajouter une action
          </button>
        </ModalFooter>
      </ModalContainer>
      <ActionsTable filteredData={filteredData} />
    </section>
  );
};

const ActionsFilters = ({ data, setFilterCategories, setFilterTeamIds, setFilterStatus, filterStatus, filterTeamIds, filterCategories }) => {
  const categories = useRecoilValue(flattenedActionsCategoriesSelector);

  const catsSelect = ["-- Aucune --", ...(categories || [])];
  return (
    <>
      {data.length ? (
        <div className="tw-mb-4 tw-flex tw-justify-between">
          <div className="tw-shrink-0 tw-grow tw-basis-1/3 tw-pl-2 tw-pr-1">
            <label htmlFor="action-select-categories-filter" className="tw-text-xs">
              Filtrer par catégorie
            </label>
            <div className="tw-max-w-full">
              <SelectCustom
                options={catsSelect.map((_option) => ({ value: _option, label: _option }))}
                value={filterCategories?.map((_option) => ({ value: _option, label: _option })) || []}
                getOptionValue={(i) => i.value}
                getOptionLabel={(i) => i.label}
                onChange={(values) => setFilterCategories(values.map((v) => v.value))}
                inputId="action-select-categories-filter"
                name="categories"
                isClearable
                isMulti
              />
            </div>
          </div>
          <div className="tw-shrink-0 tw-grow tw-basis-1/3 tw-px-1">
            <label htmlFor="action-select-categories-filter" className="tw-text-xs">
              Filtrer par équipe
            </label>
            <SelectTeamMultiple onChange={(teamIds) => setFilterTeamIds(teamIds)} value={filterTeamIds} colored inputId="action-team-select" />
          </div>
          <div className="tw-shrink-0 tw-grow tw-basis-1/3 tw-pl-1 tw-pr-2">
            <label htmlFor="action-select-status-filter" className="tw-text-xs">
              Filtrer par statut
            </label>
            <SelectCustom
              inputId="action-select-status-filter"
              options={mappedIdsToLabels}
              getOptionValue={(s) => s._id}
              getOptionLabel={(s) => s.name}
              name="status"
              onChange={(s) => setFilterStatus(s.map((s) => s._id))}
              isClearable
              isMulti
              value={mappedIdsToLabels.filter((s) => filterStatus.includes(s._id))}
            />
          </div>
        </div>
      ) : (
        <div className="tw-mt-8 tw-w-full tw-text-center tw-text-gray-300">
          <AgendaMutedIcon />
          Aucune action pour le moment
        </div>
      )}
    </>
  );
};

const ActionsTable = ({ filteredData }) => {
  const history = useHistory();
  const user = useRecoilValue(userState);
  const organisation = useRecoilValue(organisationState);

  return (
    <table className="table table-striped">
      <tbody className="small">
        {filteredData.map((action) => {
          const date = formatDateWithNameOfDay([DONE, CANCEL].includes(action.status) ? action.completedAt : action.dueAt);
          const time = action.withTime && action.dueAt ? ` ${formatTime(action.dueAt)}` : "";
          return (
            <tr key={action._id}>
              <td>
                <div
                  className={["restricted-access"].includes(user.role) ? "tw-cursor-not-allowed tw-py-2" : "tw-cursor-pointer tw-py-2"}
                  onClick={() => {
                    const searchParams = new URLSearchParams(history.location.search);
                    searchParams.set("actionId", action._id);
                    history.push(`?${searchParams.toString()}`);
                  }}
                >
                  <div className="tw-flex">
                    <div className="tw-flex tw-flex-1 tw-items-center tw-gap-x-2">
                      {action.urgent ? <ExclamationMarkButton /> : null}
                      {action.description ? <DescriptionIcon /> : null}
                      <span>{`${date}${time}`}</span>
                    </div>
                    <div>
                      <ActionStatusSelect action={action} />
                    </div>
                  </div>
                  <div className="tw-mt-2 tw-flex">
                    <div className="tw-flex tw-flex-1 tw-flex-row tw-items-start">
                      {!!organisation.groupsEnabled && !!action.group && (
                        <span className="tw-mr-2 tw-text-xl" aria-label="Action familiale" title="Action familiale">
                          👪
                        </span>
                      )}
                      <div className="tw-flex tw-grow tw-flex-col tw-items-start">
                        <ActionOrConsultationName item={action} />
                      </div>
                      <div className="tw-flex tw-h-full tw-shrink-0 tw-flex-col tw-justify-center tw-gap-px">
                        {Array.isArray(action?.teams) ? action.teams.map((e) => <TagTeam key={e} teamId={e} />) : <TagTeam teamId={action?.team} />}
                      </div>
                    </div>
                  </div>
                  <div className="-tw-mb-2 tw-mt-2 tw-flex tw-basis-full tw-gap-1 tw-text-xs tw-opacity-50 [overflow-wrap:anywhere]">
                    <span>Créée par</span>
                    <UserName id={action.user} />
                  </div>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
