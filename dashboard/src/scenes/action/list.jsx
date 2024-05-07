import { useMemo } from "react";
import { selectorFamily, useRecoilValue } from "recoil";
import { useHistory } from "react-router-dom";
import { SmallHeader } from "../../components/header";
import Search from "../../components/search";
import ActionsCalendar from "../../components/ActionsCalendar";
import ActionsWeekly from "../../components/ActionsWeekly";
import SelectCustom from "../../components/SelectCustom";
import { mappedIdsToLabels, TODO } from "../../recoil/actions";
import { currentTeamState, teamsState, userState } from "../../recoil/auth";
import { arrayOfitemsGroupedByActionSelector, arrayOfitemsGroupedByConsultationSelector } from "../../recoil/selectors";
import { filterBySearch } from "../search/utils";
import useTitle from "../../services/useTitle";
import useSearchParamState from "../../services/useSearchParamState";
import ButtonCustom from "../../components/ButtonCustom";
import agendaIcon from "../../assets/icons/agenda-icon.svg";
import ActionsCategorySelect from "../../components/tailwind/ActionsCategorySelect";
import { useLocalStorage } from "../../services/useLocalStorage";
import SelectTeamMultiple from "../../components/SelectTeamMultiple";
import ActionsSortableList from "../../components/ActionsSortableList";
import { dayjsInstance } from "../../services/date";
import useMinimumWidth from "../../services/useMinimumWidth";

const showAsOptions = ["Calendrier", "Liste", "Hebdomadaire"];

const actionsByTeamAndStatusSelector = selectorFamily({
  key: "actionsByTeamAndStatusSelector",
  get:
    ({ statuses, categories, teamIds, viewAllOrganisationData, viewNoTeamData, actionsWithNoCategory }) =>
    ({ get }) => {
      const actions = get(arrayOfitemsGroupedByActionSelector);

      const actionsByTeamAndStatus = actions.filter((action) => {
        if (!viewAllOrganisationData) {
          if (teamIds.length) {
            if (Array.isArray(action.teams)) {
              if (!teamIds.some((t) => action.teams.includes(t))) return false;
            } else {
              if (!teamIds.includes(action.team)) return false;
            }
          }
        }
        if (viewNoTeamData) {
          if (Array.isArray(action.teams)) {
            if (action.teams.length) return false;
          } else {
            if (action.team) return false;
          }
        }
        if (statuses.length) {
          if (!statuses.includes(action.status)) return false;
        }
        if (actionsWithNoCategory) {
          if (action.categories?.length) return false;
        }
        if (categories.length) {
          if (!categories.some((c) => action.categories?.includes(c))) {
            return false;
          }
        }
        return true;
      });
      return actionsByTeamAndStatus;
    },
});

const consultationsByStatusSelector = selectorFamily({
  key: "consultationsByStatusSelector",
  get:
    ({ statuses, teamIds, viewAllOrganisationData, viewNoTeamData }) =>
    ({ get }) => {
      const consultations = get(arrayOfitemsGroupedByConsultationSelector);
      const consultationsByStatus = consultations.filter((consultation) => {
        if (!viewAllOrganisationData) {
          if (teamIds.length) {
            if (consultation.teams?.length && !teamIds.some((t) => consultation.teams.includes(t))) return false;
          }
        }
        if (viewNoTeamData) {
          if (consultation.teams?.length) return false;
        }
        if (statuses.length) {
          if (!statuses.includes(consultation.status)) return false;
        }
        return true;
      });
      return consultationsByStatus;
    },
});

const dataFilteredBySearchSelector = selectorFamily({
  key: "dataFilteredBySearchSelector",
  get:
    ({ search, statuses, categories, teamIds, viewAllOrganisationData, viewNoTeamData, actionsWithNoCategory }) =>
    ({ get }) => {
      const actions = get(
        actionsByTeamAndStatusSelector({ statuses, categories, teamIds, viewNoTeamData, viewAllOrganisationData, actionsWithNoCategory })
      );
      // When we filter by category, we don't want to see all consultations.
      const consultations = categories?.length
        ? []
        : get(consultationsByStatusSelector({ statuses, teamIds, viewNoTeamData, viewAllOrganisationData }));

      if (!search) {
        return [...actions, ...consultations];
      }
      const actionsFiltered = filterBySearch(search, actions);
      const consultationsFiltered = filterBySearch(search, consultations);
      return [...actionsFiltered, ...consultationsFiltered];
    },
});

const List = () => {
  useTitle("Agenda");
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const teams = useRecoilValue(teamsState);

  const history = useHistory();
  const [search, setSearch] = useSearchParamState("search", "");

  const [categories, setCategories] = useLocalStorage("action-categories", []);
  const [statuses, setStatuses] = useLocalStorage("action-statuses", [TODO]);
  const [selectedTeamIds, setSelectedTeamIds] = useLocalStorage("action-teams", [currentTeam._id]);
  const [viewAllOrganisationData, setViewAllOrganisationData] = useLocalStorage("action-allOrg", false);
  const [viewNoTeamData, setViewNoTeamData] = useLocalStorage("action-noTeam", false);
  const [actionsWithNoCategory, setActionsWithNoCategory] = useLocalStorage("action-noCategory", false);

  const [showAs, setShowAs] = useLocalStorage("action-showAs", showAsOptions[0]); // calendar, list
  const dataConsolidated = useRecoilValue(
    dataFilteredBySearchSelector({
      search,
      statuses,
      categories,
      teamIds: selectedTeamIds,
      viewAllOrganisationData,
      viewNoTeamData,
      actionsWithNoCategory,
    })
  );
  const isDesktop = useMinimumWidth("sm");

  const selectedTeams = useMemo(() => {
    if (viewAllOrganisationData) return teams;
    if (!selectedTeamIds.length) return teams;
    return teams.filter((t) => selectedTeamIds.includes(t._id));
  }, [selectedTeamIds, viewAllOrganisationData, teams]);
  const allSelectedTeamsAreNightSession = useMemo(() => {
    for (const team of selectedTeams) {
      if (!team.nightSession) return false;
    }
    return true;
  }, [selectedTeams]);

  return (
    <>
      <SmallHeader
        title={
          <span>
            Agenda{" "}
            {viewAllOrganisationData ? (
              <>de toute l'organisation</>
            ) : (
              <>
                {selectedTeamIds.length > 1 ? "des équipes" : "de l'équipe"}{" "}
                <b>
                  {teams
                    .filter((t) => selectedTeamIds.includes(t._id))
                    .map((e) => e?.name)
                    .join(", ")}
                </b>
              </>
            )}
          </span>
        }
      />

      <div className="tw-mb-5 tw-flex tw-flex-row tw-justify-center">
        <div className="noprint tw-flex tw-w-full tw-justify-end tw-gap-3">
          <ButtonCustom
            icon={agendaIcon}
            disabled={!currentTeam}
            onClick={() => {
              const searchParams = new URLSearchParams(history.location.search);
              searchParams.set("dueAt", dayjsInstance().toISOString());
              searchParams.set("newAction", true);
              history.push(`?${searchParams.toString()}`);
            }}
            color="primary"
            title="Créer une nouvelle action"
            padding={"12px 24px"}
          />
          {Boolean(user.healthcareProfessional) && (
            <ButtonCustom
              icon={agendaIcon}
              disabled={!currentTeam}
              onClick={() => {
                const searchParams = new URLSearchParams(history.location.search);
                searchParams.set("dueAt", dayjsInstance().toISOString());
                searchParams.set("newConsultation", true);
                history.push(`?${searchParams.toString()}`);
              }}
              color="primary"
              title="Créer une nouvelle consultation"
              padding={"12px 24px"}
            />
          )}
        </div>
      </div>

      {isDesktop && (
        <div className="tw-mb-10 tw-flex tw-flex-wrap tw-border-b tw-border-gray-200">
          <div className="tw-mb-5 tw-flex tw-w-full tw-items-center tw-px-2">
            <label htmlFor="actions-show-as" className="tw-mr-5 tw-w-40 tw-shrink-0">
              Afficher par&nbsp;:
            </label>
            <div className="tw-basis-1/3">
              <SelectCustom
                onChange={({ value }) => setShowAs(value)}
                value={{ value: showAs, label: showAs }}
                options={showAsOptions.map((_option) => ({ value: _option, label: _option }))}
                isClearable={false}
                isMulti={false}
                inputId="actions-show-as"
                getOptionValue={(o) => o.value}
                getOptionLabel={(o) => o.label}
              />
            </div>
          </div>
          <div className="tw-mb-5 tw-flex tw-w-full tw-items-center tw-px-2">
            <label htmlFor="search" className="tw-mr-5 tw-w-40 tw-shrink-0">
              Recherche&nbsp;:
            </label>
            <Search placeholder="Par mot clé, présent dans le nom, la catégorie, un commentaire, ..." value={search} onChange={setSearch} />
          </div>
          <div className="tw-mb-5 tw-flex tw-basis-1/3 tw-flex-col tw-items-start tw-px-2">
            <label htmlFor="action-select-categories-filter">Filtrer par catégorie&nbsp;:</label>
            <div className="tw-w-full">
              <ActionsCategorySelect
                id="action-select-categories-filter"
                onChange={(c) => setCategories(c)}
                values={categories}
                isDisabled={!!actionsWithNoCategory}
              />
            </div>
            <label htmlFor="actionsWithNoCategory" className="tw-flex tw-items-center tw-text-sm">
              <input
                id="actionsWithNoCategory"
                type="checkbox"
                className="tw-mr-2"
                checked={actionsWithNoCategory}
                onChange={() => setActionsWithNoCategory(!actionsWithNoCategory)}
              />
              Actions sans catégorie
            </label>
          </div>
          <div className="tw-mb-5 tw-flex tw-basis-1/3 tw-flex-col tw-items-start tw-px-2">
            <label htmlFor="action-select-categories-filter">Filtrer par équipe&nbsp;:</label>
            <div className="tw-w-full">
              <SelectTeamMultiple
                onChange={setSelectedTeamIds}
                value={selectedTeamIds}
                colored
                isDisabled={viewAllOrganisationData || viewNoTeamData}
              />
              {teams.length > 1 && (
                <label htmlFor="viewAllOrganisationData" className="tw-flex tw-items-center tw-text-sm">
                  <input
                    id="viewAllOrganisationData"
                    type="checkbox"
                    className="tw-mr-2"
                    checked={viewAllOrganisationData}
                    disabled={viewNoTeamData}
                    onChange={() => setViewAllOrganisationData(!viewAllOrganisationData)}
                  />
                  Actions/consultations de toute l'organisation
                </label>
              )}
              {teams.length > 1 && (
                <label htmlFor="viewNoTeamData" className="tw-flex tw-items-center tw-text-sm">
                  <input
                    id="viewNoTeamData"
                    type="checkbox"
                    className="tw-mr-2"
                    checked={viewNoTeamData}
                    onChange={() => setViewNoTeamData(!viewNoTeamData)}
                  />
                  Actions/consultations sans équipe attribuée
                </label>
              )}
            </div>
          </div>
          <div className="tw-mb-5 tw-flex tw-basis-1/3 tw-flex-col tw-items-start tw-px-2">
            <label htmlFor="action-select-status-filter">Filtrer par statut&nbsp;:</label>
            <div className="tw-w-full">
              <SelectCustom
                inputId="action-select-status-filter"
                classNamePrefix="action-select-status-filter"
                options={mappedIdsToLabels}
                getOptionValue={(s) => s._id}
                getOptionLabel={(s) => s.name}
                name="statuses"
                onChange={(s) => setStatuses(s.map((s) => s._id))}
                isClearable
                isMulti
                value={mappedIdsToLabels.filter((s) => statuses.includes(s._id))}
              />
            </div>
          </div>
        </div>
      )}
      {showAs === showAsOptions[0] && (
        <div className="tw-min-h-screen">
          <ActionsCalendar actions={dataConsolidated} isNightSession={allSelectedTeamsAreNightSession} />
        </div>
      )}
      {showAs === showAsOptions[1] && (
        <div className="[overflow-wrap:anywhere]">
          <ActionsSortableList data={dataConsolidated} limit={20} />
        </div>
      )}
      {showAs === showAsOptions[2] && (
        <div className="tw-min-h-screen [overflow-wrap:anywhere]">
          <ActionsWeekly
            isNightSession={allSelectedTeamsAreNightSession}
            actions={dataConsolidated}
            onCreateAction={(date) => {
              const searchParams = new URLSearchParams(history.location.search);
              searchParams.set("dueAt", dayjsInstance(date).toISOString());
              searchParams.set("newAction", true);
              history.push(`?${searchParams.toString()}`); // Update the URL with the new search parameters.
            }}
          />
        </div>
      )}
    </>
  );
};

export default List;
