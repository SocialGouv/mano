import React, { useEffect, useMemo, useRef } from 'react';
import { Col, Row } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { selector, selectorFamily, useRecoilValue } from 'recoil';
import styled from 'styled-components';
import { SmallHeader } from '../../components/header';
import Page from '../../components/pagination';
import Search from '../../components/search';
import Loading from '../../components/loading';
import Table from '../../components/table';
import CreatePerson from './CreatePerson';
import { filterPersonsBaseSelector } from '../../recoil/persons';
import TagTeam from '../../components/TagTeam';
import Filters, { filterData } from '../../components/Filters';
import { formatBirthDate, formatDateWithFullMonth } from '../../services/date';
import { personsWithMedicalFileMergedSelector } from '../../recoil/selectors';
import { theme } from '../../config';
import { currentTeamState, organisationState, teamsState, userState } from '../../recoil/auth';
import { placesState } from '../../recoil/places';
import { filterBySearch } from '../search/utils';
import useTitle from '../../services/useTitle';
import useSearchParamState from '../../services/useSearchParamState';
import { useDataLoader } from '../../components/DataLoader';
import ExclamationMarkButton from '../../components/tailwind/ExclamationMarkButton';
import { customFieldsMedicalFileSelector } from '../../recoil/medicalFiles';
import { useLocalStorage } from 'react-use';

const limit = 20;

const personsPopulatedWithFormattedBirthDateSelector = selector({
  key: 'personsPopulatedWithFormattedBirthDateSelector',
  get: ({ get }) => {
    const persons = get(personsWithMedicalFileMergedSelector);
    const personsWithBirthdateFormatted = persons.map((person) => ({
      ...person,
      formattedBirthDate: formatBirthDate(person.birthdate),
    }));
    return personsWithBirthdateFormatted;
  },
});

const personsFilteredSelector = selectorFamily({
  key: 'personsFilteredSelector',
  get:
    ({ filterTeams, filters, alertness }) =>
    ({ get }) => {
      const personWithBirthDate = get(personsPopulatedWithFormattedBirthDateSelector);
      let pFiltered = personWithBirthDate;
      if (!!filters?.filter((f) => Boolean(f?.value)).length) pFiltered = filterData(pFiltered, filters);
      if (!!alertness) pFiltered = pFiltered.filter((p) => !!p.alertness);
      if (filterTeams.length) {
        pFiltered = pFiltered.filter((p) => {
          for (let assignedTeam of p.assignedTeams || []) {
            if (filterTeams.includes(assignedTeam)) return true;
          }
          return false;
        });
      }
      return pFiltered;
    },
});

const personsFilteredBySearchSelector = selectorFamily({
  key: 'personsFilteredBySearchSelector',
  get:
    ({ filterTeams, filters, alertness, search }) =>
    ({ get }) => {
      const personsFiltered = get(personsFilteredSelector({ filterTeams, filters, alertness }));

      if (!search?.length) {
        return personsFiltered;
      }

      const personsfilteredBySearch = filterBySearch(search, personsFiltered);

      return personsfilteredBySearch;
    },
});

const filterPersonsWithAllFieldsSelector = selector({
  key: 'filterPersonsWithAllFieldsSelector',
  get: ({ get }) => {
    const places = get(placesState);
    const user = get(userState);
    const team = get(currentTeamState);
    const customFieldsMedicalFile = get(customFieldsMedicalFileSelector);
    const filterPersonsBase = get(filterPersonsBaseSelector);
    return [
      ...filterPersonsBase.filter((a) => a.enabled || a.enabledTeams?.includes(team._id)).map((a) => ({ field: a.name, ...a })),
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
  const [viewAllOrganisationData, setViewAllOrganisationData] = useLocalStorage('person-allOrg', false);
  const [filterTeams, setFilterTeams] = useLocalStorage('person-teams', []);
  const [filters, setFilters] = useLocalStorage('person-filters', []);
  const [page, setPage] = useSearchParamState('page', 0);
  const currentTeam = useRecoilValue(currentTeamState);

  const personsFilteredBySearch = useRecoilValue(personsFilteredBySearchSelector({ search, filterTeams, filters, alertness }));

  const data = useMemo(() => {
    return personsFilteredBySearch.filter((_, index) => index < (page + 1) * limit && index >= page * limit);
  }, [personsFilteredBySearch, page]);
  const total = useMemo(() => personsFilteredBySearch.length, [personsFilteredBySearch]);

  const teams = useRecoilValue(teamsState);
  const organisation = useRecoilValue(organisationState);
  const history = useHistory();

  const isMounted = useRef(null);
  useEffect(() => {
    // effect on currentTeam/viewAllOrganisationData change
    // not to be triggered on first render, because it would erase the `page` query param
    if (isMounted.current) {
      // its not possible to update two different URLSearchParams very quickly, the second one cancels the first one
      setPage(0); // internal state
      setFilterTeams(viewAllOrganisationData ? [] : [teams.find((team) => team._id === currentTeam._id)._id], { sideEffect: ['page', 0] });
    }
    isMounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewAllOrganisationData, currentTeam, teams]);

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
      <Row>
        <Col>
          <PersonsActionsStyled>
            <CreatePerson refreshable />
          </PersonsActionsStyled>
        </Col>
      </Row>
      <Row style={{ marginBottom: 20 }}>
        <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <label htmlFor="search" style={{ marginRight: 20, width: 250, flexShrink: 0 }}>
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
        </Col>
        <Col md={12} style={{ display: 'flex', alignItems: 'center' }}>
          <label htmlFor="viewAllOrganisationData" style={{ marginLeft: '270px' }}>
            <input
              type="checkbox"
              id="viewAllOrganisationData"
              style={{ marginRight: 10 }}
              checked={viewAllOrganisationData}
              value={viewAllOrganisationData}
              onChange={() => setViewAllOrganisationData(!viewAllOrganisationData)}
            />
            Afficher les personnes de toute l'organisation
          </label>
        </Col>
        <Col md={12} style={{ display: 'flex', alignItems: 'center' }}>
          <label htmlFor="alertness" style={{ marginLeft: '270px' }}>
            <input
              type="checkbox"
              style={{ marginRight: 10 }}
              id="alertness"
              checked={alertness}
              value={alertness}
              onChange={() => setFilterAlertness(!alertness)}
            />
            N'afficher que les personnes vulnérables où ayant besoin d'une attention particulière
          </label>
        </Col>
      </Row>
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
            render: (p) => {
              if (p.outOfActiveList)
                return (
                  <div style={{ color: theme.black50 }}>
                    <div>{p.name}</div>
                    <div>Sortie de file active : {p.outOfActiveListReasons?.join(', ')}</div>
                  </div>
                );
              return p.name;
            },
          },
          {
            title: 'Date de naissance',
            dataKey: '_id',
            render: (p) => {
              if (!p.birthdate) return '';
              else if (p.outOfActiveList) return <i style={{ color: theme.black50 }}>{p.formattedBirthDate}</i>;
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
            render: (p) => {
              return p.alertness ? (
                <ExclamationMarkButton
                  aria-label="Personne très vulnérable, ou ayant besoin d'une attention particulière"
                  title="Personne très vulnérable, ou ayant besoin d'une attention particulière"
                />
              ) : null;
            },
          },
          { title: 'Équipe(s) en charge', dataKey: 'assignedTeams', render: (person) => <Teams person={person} /> },
          {
            title: 'Suivi(e) depuis le',
            dataKey: 'followedSince',
            render: (p) => {
              if (p.outOfActiveList)
                return <div style={{ color: theme.black50 }}>{formatDateWithFullMonth(p.followedSince || p.createdAt || '')}</div>;
              return formatDateWithFullMonth(p.followedSince || p.createdAt || '');
            },
          },
        ].filter((c) => organisation.groupsEnabled || c.dataKey !== 'group')}
      />
      <Page page={page} limit={limit} total={total} onChange={({ page }) => setPage(page, true)} />
    </>
  );
};

const Teams = ({ person: { _id, assignedTeams } }) => (
  <div key={_id} className="tw-grid tw-gap-1">
    {assignedTeams?.map((teamId) => (
      <TagTeam key={teamId} teamId={teamId} />
    ))}
  </div>
);

const PersonsActionsStyled = styled.div`
  margin-bottom: 40px;
  width: 100%;
  display: flex;
  justify-content: flex-end;
`;

// eslint-disable-next-line import/no-anonymous-default-export
export default List;
