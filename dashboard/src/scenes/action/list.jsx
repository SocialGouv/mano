import { useMemo } from "react";
import { selectorFamily, useRecoilValue } from "recoil";
import { useHistory } from "react-router-dom";
import Search from "../../components/search";
import ActionsCalendar from "../../components/ActionsCalendar";
import ActionsWeekly from "../../components/ActionsWeekly";
import SelectCustom from "../../components/SelectCustom";
import { mappedIdsToLabels, TODO } from "../../recoil/actions";
import { currentTeamState, organisationState, teamsState, userState } from "../../recoil/auth";
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
const showTypeOptions = ["Actions et consultations", "Actions", "Consultations"];

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
    ({ statuses, teamIds, consultationTypes, viewAllOrganisationData, viewNoTeamData, actionsWithNoCategory }) =>
    ({ get }) => {
      // On retourne seulement les actions si "Actions sans catégorie" est coché
      if (actionsWithNoCategory) return [];
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
        if (consultationTypes?.length) {
          if (!consultationTypes.includes(consultation.type)) return false;
        }
        return true;
      });
      return consultationsByStatus;
    },
});

const dataFilteredBySearchSelector = selectorFamily({
  key: "dataFilteredBySearchSelector",
  get:
    ({ search, statuses, categories, teamIds, viewAllOrganisationData, viewNoTeamData, actionsWithNoCategory, showType, consultationTypes }) =>
    ({ get }) => {
      const actions =
        showType === "Actions" || showType === "Actions et consultations"
          ? get(actionsByTeamAndStatusSelector({ statuses, categories, teamIds, viewNoTeamData, viewAllOrganisationData, actionsWithNoCategory }))
          : [];
      // When we filter by category, we don't want to see all consultations.
      const consultations =
        !categories?.length && (showType === "Consultations" || showType === "Actions et consultations")
          ? get(
              consultationsByStatusSelector({ statuses, consultationTypes, teamIds, viewNoTeamData, viewAllOrganisationData, actionsWithNoCategory })
            )
          : [];

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
  const organisation = useRecoilValue(organisationState);

  const history = useHistory();
  const [search, setSearch] = useSearchParamState("search", "");

  const [categories, setCategories] = useLocalStorage("action-categories", []);
  const [statuses, setStatuses] = useLocalStorage("action-statuses", [TODO]);
  const [selectedTeamIds, setSelectedTeamIds] = useLocalStorage("action-teams", [currentTeam._id]);
  const [viewAllOrganisationData, setViewAllOrganisationData] = useLocalStorage("action-allOrg", false);
  const [viewNoTeamData, setViewNoTeamData] = useLocalStorage("action-noTeam", false);
  const [actionsWithNoCategory, setActionsWithNoCategory] = useLocalStorage("action-noCategory", false);
  const [consultationTypes, setConsultationTypes] = useLocalStorage("action-consultationTypes", []);

  const [showAs, setShowAs] = useLocalStorage("action-showAs", showAsOptions[0]); // calendar, list
  const [showType, setShowType] = useLocalStorage("action-showType", "Actions et consultations"); // actions, consultations, both

  const dataConsolidated = useRecoilValue(
    dataFilteredBySearchSelector({
      search,
      statuses,
      categories,
      showType,
      consultationTypes,
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
      <div className="tw-flex tw-w-full tw-items-center tw-mt-8 tw-mb-12">
        <div className="tw-grow tw-text-xl">
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
        </div>
        <div className="noprint tw-flex  tw-gap-3">
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
            title="Créer une action"
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
              title="Créer une consultation"
              padding={"12px 24px"}
            />
          )}
        </div>
      </div>
      {isDesktop && (
        <div className="tw-flex tw-flex-wrap tw-rounded-lg -tw-mx-4 tw-mb-8">
          <div className="tw-px-4 tw-py-8 tw-grid tw-grid-cols-3 tw-w-full tw-items-start tw-gap-4">
            <div className="tw-flex tw-items-center tw-col-span-3">
              <label htmlFor="search" className="tw-w-24 tw-shrink-0 tw-m-0">
                Recherche
              </label>
              <Search placeholder="Par mot clé, nom, catégorie, commentaire, ..." value={search} onChange={setSearch} />
            </div>
            <div className="tw-flex tw-flex-col">
              <label htmlFor="actions-show-as" className="tw-w-24 tw-shrink-0 tw-m-0">
                Afficher par
              </label>
              <div className="tw-grow">
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
            <div className="tw-flex tw-flex-col">
              <label htmlFor="actions-show-as" className="tw-shrink-0 tw-m-0">
                Éléments affichés
              </label>
              <div className="tw-grow">
                <SelectCustom
                  onChange={({ value }) => setShowType(value)}
                  value={{ value: showType, label: showType }}
                  options={showTypeOptions.map((_option) => ({ value: _option, label: _option }))}
                  isClearable={false}
                  isMulti={false}
                  inputId="actions-show-type"
                  getOptionValue={(o) => o.value}
                  getOptionLabel={(o) => o.label}
                />
              </div>
            </div>
            <div className="tw-flex tw-flex-col tw-items-start">
              <label htmlFor="action-select-status-filter" className="tw-shrink-0 tw-m-0">
                Filtrer par statut
              </label>
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
            <div className="tw-flex tw-flex-col">
              <label htmlFor="action-select-categories-filter" className="tw-shrink-0 tw-m-0">
                Filtrer par équipe
              </label>
              <div className="tw-w-grow">
                <SelectTeamMultiple
                  onChange={setSelectedTeamIds}
                  value={selectedTeamIds}
                  colored
                  isDisabled={viewAllOrganisationData || viewNoTeamData}
                />
                {teams.length > 1 && (
                  <label htmlFor="viewAllOrganisationData" className="tw-flex tw-items-center tw-text-sm tw-m-0">
                    <input
                      id="viewAllOrganisationData"
                      type="checkbox"
                      className="tw-mr-2"
                      checked={viewAllOrganisationData}
                      disabled={viewNoTeamData}
                      onChange={() => setViewAllOrganisationData(!viewAllOrganisationData)}
                    />
                    Agenda de toute l'organisation
                  </label>
                )}
                {teams.length > 1 && (
                  <label htmlFor="viewNoTeamData" className="tw-flex tw-items-center tw-text-sm tw-m-0">
                    <input
                      id="viewNoTeamData"
                      type="checkbox"
                      className="tw-mr-2"
                      checked={viewNoTeamData}
                      onChange={() => setViewNoTeamData(!viewNoTeamData)}
                    />
                    Éléments sans équipe attribuée
                  </label>
                )}
              </div>
            </div>
            <div className="tw-flex tw-flex-col tw-items-start">
              <label htmlFor="action-select-categories-filter" className="tw-shrink-0 tw-m-0">
                Filtrer par catégorie d'action
              </label>
              <div className="tw-w-full">
                <ActionsCategorySelect
                  id="action-select-categories-filter"
                  onChange={(c) => setCategories(c)}
                  values={categories}
                  isDisabled={Boolean(actionsWithNoCategory) || showType === "Consultations"}
                />
              </div>
              <label htmlFor="actionsWithNoCategory" className="tw-flex tw-items-center tw-text-sm">
                <input
                  id="actionsWithNoCategory"
                  disabled={showType === "Consultations"}
                  type="checkbox"
                  className="tw-mr-2"
                  checked={actionsWithNoCategory}
                  onChange={() => setActionsWithNoCategory(!actionsWithNoCategory)}
                />
                Actions sans catégorie
              </label>
            </div>
            <div className="tw-flex tw-flex-col tw-items-start">
              <label htmlFor="action-select-categories-filter" className="tw-shrink-0 tw-m-0">
                Filtrer par type de consultation
              </label>
              <div className="tw-w-full">
                <SelectCustom
                  isDisabled={!user.healthcareProfessional || showType === "Actions"}
                  inputId="action-select-consultation-type-filter"
                  classNamePrefix="action-select-consultation-type-filter"
                  options={organisation.consultations.map((e) => ({ value: e.name, label: e.name }))}
                  name="consultationTypes"
                  onChange={(s) => setConsultationTypes(s.map((s) => s.value))}
                  value={
                    user.healthcareProfessional
                      ? organisation.consultations.filter((s) => consultationTypes.includes(s.name)).map((e) => ({ value: e.name, label: e.name }))
                      : []
                  }
                  isClearable
                  isMulti
                />
              </div>
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
