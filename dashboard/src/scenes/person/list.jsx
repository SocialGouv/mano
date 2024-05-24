import React, { useMemo } from "react";
import { useHistory } from "react-router-dom";
import { selector, selectorFamily, useRecoilValue } from "recoil";
import { useLocalStorage } from "../../services/useLocalStorage";
import { SmallHeader } from "../../components/header";
import Page from "../../components/pagination";
import Search from "../../components/search";
import Loading from "../../components/loading";
import Table from "../../components/table";
import CreatePerson from "./CreatePerson";
import {
  fieldsPersonsCustomizableOptionsSelector,
  filterPersonsBaseSelector,
  flattenedCustomFieldsPersonsSelector,
  sortPersons,
} from "../../recoil/persons";
import TagTeam from "../../components/TagTeam";
import Filters, { filterData } from "../../components/Filters";
import { dayjsInstance, formatDateWithFullMonth } from "../../services/date";
import { personsWithMedicalFileAndConsultationsMergedSelector } from "../../recoil/selectors";
import { currentTeamState, organisationState, userState } from "../../recoil/auth";
import { placesState } from "../../recoil/places";
import { filterBySearch } from "../search/utils";
import useTitle from "../../services/useTitle";
import useSearchParamState from "../../services/useSearchParamState";
import { useDataLoader } from "../../components/DataLoader";
import ExclamationMarkButton from "../../components/tailwind/ExclamationMarkButton";
import { customFieldsMedicalFileSelector } from "../../recoil/medicalFiles";
import useMinimumWidth from "../../services/useMinimumWidth";
import { flattenedCustomFieldsConsultationsSelector } from "../../recoil/consultations";

const limit = 20;

const personsFilteredSelector = selectorFamily({
  key: "personsFilteredSelector",
  get:
    ({ viewAllOrganisationData, filters, alertness }) =>
    ({ get }) => {
      const personsWithBirthDate = get(personsWithMedicalFileAndConsultationsMergedSelector);
      const currentTeam = get(currentTeamState);
      let pFiltered = personsWithBirthDate;
      if (!!filters?.filter((f) => Boolean(f?.value)).length) pFiltered = filterData(pFiltered, filters);
      if (!!alertness) pFiltered = pFiltered.filter((p) => !!p.alertness);
      if (!!viewAllOrganisationData) return pFiltered;
      return pFiltered.filter((p) => p.assignedTeams?.includes(currentTeam._id));
    },
});

const personsFilteredBySearchSelector = selectorFamily({
  key: "personsFilteredBySearchSelector",
  get:
    ({ viewAllOrganisationData, filters, alertness, search, sortBy, sortOrder }) =>
    ({ get }) => {
      const personsFiltered = get(personsFilteredSelector({ viewAllOrganisationData, filters, alertness }));
      const personsSorted = [...personsFiltered].sort(sortPersons(sortBy, sortOrder));

      if (!search?.length) {
        return personsSorted;
      }
      const user = get(userState);
      const excludeFields = user.healthcareProfessional ? [] : ["consultations", "treatments", "commentsMedical", "medicalFile"];
      const personsfilteredBySearch = filterBySearch(search, personsSorted, excludeFields);

      return personsfilteredBySearch;
    },
});

const filterPersonsWithAllFieldsSelector = selector({
  key: "filterPersonsWithAllFieldsSelector",
  get: ({ get }) => {
    const places = get(placesState);
    const user = get(userState);
    const team = get(currentTeamState);
    const fieldsPersonsCustomizableOptions = get(fieldsPersonsCustomizableOptionsSelector);
    const flattenedCustomFieldsPersons = get(flattenedCustomFieldsPersonsSelector);
    const customFieldsMedicalFile = get(customFieldsMedicalFileSelector);
    const consultationFields = get(flattenedCustomFieldsConsultationsSelector);
    const filterPersonsBase = get(filterPersonsBaseSelector);

    const filterBase = [
      ...filterPersonsBase,
      ...fieldsPersonsCustomizableOptions.filter((a) => a.enabled || a.enabledTeams?.includes(team._id)).map((a) => ({ field: a.name, ...a })),
      ...flattenedCustomFieldsPersons.filter((a) => a.enabled || a.enabledTeams?.includes(team._id)).map((a) => ({ field: a.name, ...a })),
      {
        label: "Lieux fréquentés",
        field: "places",
        options: [...new Set(places.map((place) => place.name))],
      },
    ];
    if (user.healthcareProfessional) {
      filterBase.push(
        ...customFieldsMedicalFile.filter((a) => a.enabled || a.enabledTeams?.includes(team._id)).map((a) => ({ field: a.name, ...a }))
      );
      filterBase.push(...consultationFields.filter((a) => a.enabled || a.enabledTeams?.includes(team._id)).map((a) => ({ field: a.name, ...a })));
    }
    return filterBase;
  },
});

const List = () => {
  useTitle("Personnes");
  useDataLoader({ refreshOnMount: true });
  const isDesktop = useMinimumWidth("sm");
  const filterPersonsWithAllFields = useRecoilValue(filterPersonsWithAllFieldsSelector);

  const [search, setSearch] = useSearchParamState("search", "");
  const [alertness, setFilterAlertness] = useLocalStorage("person-alertness", false);
  const [viewAllOrganisationDataChecked, setViewAllOrganisationData] = useLocalStorage("person-allOrg", true);
  const [sortBy, setSortBy] = useLocalStorage("person-sortBy", "name");
  const [sortOrder, setSortOrder] = useLocalStorage("person-sortOrder", "ASC");
  const [filters, setFilters] = useLocalStorage("person-filters", []);
  const [page, setPage] = useSearchParamState("page", 0);
  const currentTeam = useRecoilValue(currentTeamState);
  const organisation = useRecoilValue(organisationState);

  const viewAllOrganisationData = organisation.checkboxShowAllOrgaPersons && viewAllOrganisationDataChecked;

  const personsFilteredBySearch = useRecoilValue(
    personsFilteredBySearchSelector({ search, viewAllOrganisationData, filters, alertness, sortBy, sortOrder })
  );

  const data = useMemo(() => {
    return personsFilteredBySearch.filter((_, index) => index < (page + 1) * limit && index >= page * limit);
  }, [personsFilteredBySearch, page]);
  const total = useMemo(() => personsFilteredBySearch.length, [personsFilteredBySearch]);

  const history = useHistory();

  if (!personsFilteredBySearch) return <Loading />;

  return (
    <>
      <SmallHeader
        title={
          <>
            Personnes suivies par{" "}
            {viewAllOrganisationData ? (
              <>
                l'organisation <b>{organisation.name}</b>
              </>
            ) : (
              <>
                l'équipe <b>{currentTeam?.name || ""}</b>
              </>
            )}
          </>
        }
      />
      <div className="tw-hidden tw-flex-wrap sm:tw-flex">
        <div className="tw-relative tw-w-full tw-max-w-full tw-grow tw-basis-0">
          <div className="tw-mb-8 tw-flex tw-w-full tw-justify-end">
            <CreatePerson />
          </div>
        </div>
      </div>
      <details open={isDesktop} className="[&_summary]:open:tw-opacity-10">
        <summary className="tw-mx-4 tw-my-2">Recherche et filtres...</summary>
        <div className="tw-mb-5 tw-flex tw-flex-wrap ">
          <div className="tw-mb-5 tw-flex tw-w-full tw-items-start tw-justify-start">
            <label htmlFor="search" className="tw-mr-5 tw-shrink-0 tw-basis-40">
              Recherche :{" "}
            </label>
            <div className="tw-flex-grow-1 tw-flex-col tw-items-stretch tw-gap-2">
              <Search
                placeholder="Par mot clé, présent dans le nom, la description, un commentaire, une action, ..."
                value={search}
                onChange={(value) => {
                  if (page) {
                    setPage(0);
                    setSearch(value, { sideEffect: ["page", 0] });
                  } else {
                    setSearch(value);
                  }
                }}
              />
              <div className="tw-flex tw-w-full tw-items-center">
                <label htmlFor="viewAllOrganisationData">
                  <input
                    type="checkbox"
                    id="viewAllOrganisationData"
                    className="tw-mr-2.5"
                    checked={viewAllOrganisationData}
                    value={viewAllOrganisationData}
                    onChange={() => setViewAllOrganisationData(!viewAllOrganisationData)}
                  />
                  Afficher les personnes de toute l'organisation
                </label>
              </div>
              <div className="tw-flex tw-w-full tw-items-center">
                <label htmlFor="alertness">
                  <input
                    type="checkbox"
                    className="tw-mr-2.5"
                    id="alertness"
                    checked={alertness}
                    value={alertness}
                    onChange={() => setFilterAlertness(!alertness)}
                  />
                  N'afficher que les personnes vulnérables où ayant besoin d'une attention particulière
                </label>
              </div>
            </div>
          </div>
        </div>
        <Filters base={filterPersonsWithAllFields} filters={filters} onChange={setFilters} title="Autres filtres : " saveInURLParams />
      </details>
      <Table
        data={data}
        rowKey={"_id"}
        onRowClick={(p) => history.push(`/person/${p._id}`)}
        renderCellSmallDevices={(p) => {
          return (
            <tr className="tw-my-3 tw-block tw-rounded-md tw-bg-[#f4f5f8] tw-p-4 tw-px-2">
              <td className="tw-flex tw-flex-col tw-items-start tw-gap-1">
                <div className="tw-flex tw-items-center tw-gap-x-2">
                  {!!p.group && (
                    <span aria-label="Personne avec des liens familiaux" title="Personne avec des liens familiaux">
                      👪
                    </span>
                  )}
                  {!!p.alertness && (
                    <ExclamationMarkButton
                      aria-label="Personne très vulnérable, ou ayant besoin d'une attention particulière"
                      title="Personne très vulnérable, ou ayant besoin d'une attention particulière"
                    />
                  )}
                  {p.outOfActiveList ? (
                    <div className="tw-max-w-md tw-text-black50">
                      <div className="tw-items-center tw-gap-1 tw-font-bold [overflow-wrap:anywhere]">
                        {p.name}
                        {p.otherNames ? <small className="tw-inline tw-text-main"> - {p.otherNames}</small> : null}
                      </div>
                      <div>Sortie de file active : {p.outOfActiveListReasons?.join(", ")}</div>
                    </div>
                  ) : (
                    <div className="tw-max-w-md tw-items-center tw-gap-1 tw-font-bold [overflow-wrap:anywhere]">
                      {p.name}
                      {p.otherNames ? <small className="tw-inline tw-text-main"> - {p.otherNames}</small> : null}
                    </div>
                  )}
                </div>
                <span className="tw-opacity-50">{p.formattedBirthDate}</span>
                <div className="tw-flex tw-w-full tw-flex-wrap tw-gap-2">
                  {p.assignedTeams?.map((teamId) => (
                    <TagTeam key={teamId} teamId={teamId} />
                  ))}
                </div>
              </td>
            </tr>
          );
        }}
        columns={[
          {
            title: "",
            dataKey: "group",
            small: true,
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (person) => {
              if (!person.group) return null;
              return (
                <div className="tw-flex tw-items-center tw-justify-center tw-gap-1">
                  <span className="tw-text-3xl" aria-label="Personne avec des liens familiaux" title="Personne avec des liens familiaux">
                    👪
                  </span>
                </div>
              );
            },
          },
          {
            title: "Nom",
            dataKey: "name",
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (p) => {
              if (p.outOfActiveList)
                return (
                  <div className="tw-max-w-md tw-text-black50">
                    <p className="tw-mb-0 tw-items-center tw-gap-1 tw-font-bold [overflow-wrap:anywhere]">
                      {p.name}
                      {p.otherNames ? <small className="tw-inline tw-text-main"> - {p.otherNames}</small> : null}
                    </p>
                    <div>Sortie de file active : {p.outOfActiveListReasons?.join(", ")}</div>
                  </div>
                );
              return (
                <p className="tw-mb-0 tw-max-w-md tw-items-center tw-gap-1 tw-font-bold [overflow-wrap:anywhere]">
                  {p.name}
                  {p.otherNames ? <small className="tw-inline tw-text-main"> - {p.otherNames}</small> : null}
                </p>
              );
            },
          },
          {
            title: "Date de naissance",
            dataKey: "formattedBirthDate",
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (p) => {
              if (!p.birthdate) return "";
              else if (p.outOfActiveList) return <i className="tw-text-black50">{p.formattedBirthDate}</i>;
              return (
                <span>
                  <i>{p.formattedBirthDate}</i>
                </span>
              );
            },
          },
          {
            title: "Vigilance",
            dataKey: "alertness",
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (p) => {
              return p.alertness ? (
                <ExclamationMarkButton
                  aria-label="Personne très vulnérable, ou ayant besoin d'une attention particulière"
                  title="Personne très vulnérable, ou ayant besoin d'une attention particulière"
                />
              ) : null;
            },
          },
          {
            title: "Équipe(s) en charge",
            dataKey: "assignedTeams",
            render: (person) => <Teams person={person} />,
          },
          {
            title: "Suivi(e) depuis le",
            dataKey: "followedSince",
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (p) => {
              if (p.outOfActiveList) return <div className="tw-text-black50">{formatDateWithFullMonth(p.followedSince || p.createdAt || "")}</div>;
              return formatDateWithFullMonth(p.followedSince || p.createdAt || "");
            },
          },
          {
            title: "Dernière interaction",
            dataKey: "lastUpdateCheckForGDPR",
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (p) => {
              return (
                <div
                  className={
                    dayjsInstance(p.lastUpdateCheckForGDPR).isAfter(dayjsInstance().add(-2, "year"))
                      ? "tw-text-black50"
                      : "tw-font-bold tw-text-red-500"
                  }
                >
                  {formatDateWithFullMonth(p.lastUpdateCheckForGDPR)}
                </div>
              );
            },
          },
        ].filter((c) => organisation.groupsEnabled || c.dataKey !== "group")}
      />
      <Page page={page} limit={limit} total={total} onChange={({ page }) => setPage(page, true)} />
    </>
  );
};

const Teams = ({ person: { _id, assignedTeams } }) => (
  <div key={_id} className="tw-grid tw-gap-px">
    {assignedTeams?.map((teamId) => (
      <TagTeam key={teamId} teamId={teamId} />
    ))}
  </div>
);

export default List;
