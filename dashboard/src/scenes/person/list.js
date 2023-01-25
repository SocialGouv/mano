import React, { useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { selector, selectorFamily, useRecoilValue } from 'recoil';
import { useLocalStorage } from 'react-use';
import { SmallHeader } from '../../components/header';
import Page from '../../components/pagination';
import Search from '../../components/search';
import Loading from '../../components/loading';
import Table from '../../components/table';
import CreatePerson from './CreatePerson';
import {
  customFieldsPersonsMedicalSelector,
  customFieldsPersonsSocialSelector,
  fieldsPersonsCustomizableOptionsSelector,
  filterPersonsBaseSelector,
  sortPersons,
} from '../../recoil/persons';
import TagTeam from '../../components/TagTeam';
import Filters, { filterData } from '../../components/Filters';
import { dayjsInstance, formatDateWithFullMonth } from '../../services/date';
import { personsWithMedicalFileMergedSelector } from '../../recoil/selectors';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import { placesState } from '../../recoil/places';
import { filterBySearch } from '../search/utils';
import useTitle from '../../services/useTitle';
import useSearchParamState from '../../services/useSearchParamState';
import { useDataLoader } from '../../components/DataLoader';
import ExclamationMarkButton from '../../components/tailwind/ExclamationMarkButton';
import { customFieldsMedicalFileSelector } from '../../recoil/medicalFiles';

const limit = 20;

const personsFilteredSelector = selectorFamily({
  key: 'personsFilteredSelector',
  get:
    ({ viewAllOrganisationData, filters, alertness }) =>
    ({ get }) => {
      const personWithBirthDate = get(personsWithMedicalFileMergedSelector);
      const currentTeam = get(currentTeamState);
      let pFiltered = personWithBirthDate;
      if (!!filters?.filter((f) => Boolean(f?.value)).length) pFiltered = filterData(pFiltered, filters);
      if (!!alertness) pFiltered = pFiltered.filter((p) => !!p.alertness);
      if (!!viewAllOrganisationData) return pFiltered;
      return pFiltered.filter((p) => p.assignedTeams?.includes(currentTeam._id));
    },
});

const personsFilteredBySearchSelector = selectorFamily({
  key: 'personsFilteredBySearchSelector',
  get:
    ({ viewAllOrganisationData, filters, alertness, search, sortBy, sortOrder }) =>
    ({ get }) => {
      const personsFiltered = get(personsFilteredSelector({ viewAllOrganisationData, filters, alertness }));
      const personsSorted = [...personsFiltered].sort(sortPersons(sortBy, sortOrder));

      if (!search?.length) {
        return personsSorted;
      }

      const personsfilteredBySearch = filterBySearch(search, personsSorted);

      return personsfilteredBySearch;
    },
});

const filterPersonsWithAllFieldsSelector = selector({
  key: 'filterPersonsWithAllFieldsSelector',
  get: ({ get }) => {
    const places = get(placesState);
    const user = get(userState);
    const team = get(currentTeamState);
    const fieldsPersonsCustomizableOptions = get(fieldsPersonsCustomizableOptionsSelector);
    const customFieldsPersonsSocial = get(customFieldsPersonsSocialSelector);
    const customFieldsPersonsMedical = get(customFieldsPersonsMedicalSelector);
    const customFieldsMedicalFile = get(customFieldsMedicalFileSelector);
    const filterPersonsBase = get(filterPersonsBaseSelector);
    return [
      ...filterPersonsBase,
      ...fieldsPersonsCustomizableOptions.filter((a) => a.enabled || a.enabledTeams?.includes(team._id)).map((a) => ({ field: a.name, ...a })),
      ...customFieldsPersonsSocial.filter((a) => a.enabled || a.enabledTeams?.includes(team._id)).map((a) => ({ field: a.name, ...a })),
      ...customFieldsPersonsMedical.filter((a) => a.enabled || a.enabledTeams?.includes(team._id)).map((a) => ({ field: a.name, ...a })),
      ...(user.healthcareProfessional
        ? customFieldsMedicalFile.filter((a) => a.enabled || a.enabledTeams?.includes(team._id)).map((a) => ({ field: a.name, ...a }))
        : []),
      {
        label: 'Lieux fréquentés',
        field: 'places',
        options: [...new Set(places.map((place) => place.name))],
      },
    ];
  },
});

const List = () => {
  useTitle('Personnes');
  useDataLoader({ refreshOnMount: true });
  const filterPersonsWithAllFields = useRecoilValue(filterPersonsWithAllFieldsSelector);

  const [search, setSearch] = useSearchParamState('search', '');
  const [alertness, setFilterAlertness] = useLocalStorage('person-alertness', false);
  const [viewAllOrganisationData, setViewAllOrganisationData] = useLocalStorage('person-allOrg', true);
  const [sortBy, setSortBy] = useLocalStorage('person-sortBy', 'name');
  const [sortOrder, setSortOrder] = useLocalStorage('person-sortOrder', 'ASC');
  const [filters, setFilters] = useLocalStorage('person-filters', []);
  const [page, setPage] = useSearchParamState('page', 0);
  const currentTeam = useRecoilValue(currentTeamState);

  const personsFilteredBySearch = useRecoilValue(
    personsFilteredBySearchSelector({ search, viewAllOrganisationData, filters, alertness, sortBy, sortOrder })
  );

  const data = useMemo(() => {
    return personsFilteredBySearch.filter((_, index) => index < (page + 1) * limit && index >= page * limit);
  }, [personsFilteredBySearch, page]);
  const total = useMemo(() => personsFilteredBySearch.length, [personsFilteredBySearch]);

  const organisation = useRecoilValue(organisationState);
  const history = useHistory();

  if (!personsFilteredBySearch) return <Loading />;

  return (
    <>
      <SmallHeader
        title={
          <>
            Personnes suivies par{' '}
            {viewAllOrganisationData ? (
              <>
                l'organisation <b>{organisation.name}</b>
              </>
            ) : (
              <>
                l'équipe <b>{currentTeam?.name || ''}</b>
              </>
            )}
          </>
        }
      />
      <div className="tw-flex tw-flex-wrap">
        <div className="tw-relative tw-w-full tw-max-w-full tw-grow tw-basis-0">
          <div className="tw-mb-8 tw-flex tw-w-full tw-justify-end">
            <CreatePerson refreshable />
          </div>
        </div>
      </div>
      <div className="tw-mb-5 tw-flex tw-flex-wrap">
        <div className="tw-mb-5 tw-flex tw-w-full tw-items-center">
          <label htmlFor="search" className="tw-mr-5 tw-w-64 tw-shrink-0">
            Recherche :{' '}
          </label>
          <Search
            placeholder="Par mot clé, présent dans le nom, la description, un commentaire, une action, ..."
            value={search}
            onChange={(value) => {
              if (page) {
                setPage(0);
                setSearch(value, { sideEffect: ['page', 0] });
              } else {
                setSearch(value);
              }
            }}
          />
        </div>
        <div className="tw-flex tw-w-full tw-items-center">
          <label htmlFor="viewAllOrganisationData" className="tw-ml-72">
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
          <label htmlFor="alertness" className="tw-ml-72">
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
      <Filters base={filterPersonsWithAllFields} filters={filters} onChange={setFilters} title="Autres filtres : " saveInURLParams />
      <Table
        data={data}
        rowKey={'_id'}
        onRowClick={(p) => history.push(`/person/${p._id}`)}
        columns={[
          {
            title: '',
            dataKey: 'group',
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
            title: 'Nom',
            dataKey: 'name',
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (p) => {
              if (p.outOfActiveList)
                return (
                  <div className="tw-text-black50 tw-max-w-md">
                    <div className="tw-flex tw-break-all tw-font-bold">{p.name}</div>
                    <div>Sortie de file active : {p.outOfActiveListReasons?.join(', ')}</div>
                  </div>
                );
              return <div className="tw-max-w-md tw-flex tw-break-all tw-font-bold">{p.name}</div>
            },
          },
          {
            title: 'Date de naissance',
            dataKey: 'formattedBirthDate',
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (p) => {
              if (!p.birthdate) return '';
              else if (p.outOfActiveList) return <i className="tw-text-black50">{p.formattedBirthDate}</i>;
              return (
                <span>
                  <i>{p.formattedBirthDate}</i>
                </span>
              );
            },
          },
          {
            title: 'Vigilance',
            dataKey: 'alertness',
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
            title: 'Équipe(s) en charge',
            dataKey: 'assignedTeams',
            render: (person) => <Teams person={person} />,
          },
          {
            title: 'Suivi(e) depuis le',
            dataKey: 'followedSince',
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (p) => {
              if (p.outOfActiveList) return <div className="tw-text-black50">{formatDateWithFullMonth(p.followedSince || p.createdAt || '')}</div>;
              return formatDateWithFullMonth(p.followedSince || p.createdAt || '');
            },
          },
          {
            title: 'Dernière interaction',
            dataKey: 'lastUpdateCheckForGDPR',
            onSortOrder: setSortOrder,
            onSortBy: setSortBy,
            sortOrder,
            sortBy,
            render: (p) => {
              return (
                <div
                  className={
                    dayjsInstance(p.lastUpdateCheckForGDPR).isAfter(dayjsInstance().add(-2, 'year'))
                      ? 'tw-text-black50'
                      : 'tw-font-bold tw-text-red-500'
                  }>
                  {formatDateWithFullMonth(p.lastUpdateCheckForGDPR)}
                </div>
              );
            },
          },
        ].filter((c) => organisation.groupsEnabled || c.dataKey !== 'group')}
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
