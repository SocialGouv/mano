import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Col, Row } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import styled from 'styled-components';
import { SmallerHeaderWithBackButton } from '../../components/header';
import Page from '../../components/pagination';
import Search from '../../components/search';
import Loading from '../../components/loading';
import Table from '../../components/table';
import CreatePerson from './CreatePerson';
import { customFieldsPersonsMedicalSelector, customFieldsPersonsSocialSelector, filterPersonsBase } from '../../recoil/persons';
import TagTeam from '../../components/TagTeam';
import PaginationContext from '../../contexts/pagination';
import Filters, { filterData } from '../../components/Filters';
import { formatBirthDate, formatDateWithFullMonth } from '../../services/date';
import { personsWithPlacesSelector } from '../../recoil/selectors';
import { theme } from '../../config';
import { currentTeamState, organisationState, teamsState } from '../../recoil/auth';
import { placesState } from '../../recoil/places';
import { actionsState } from '../../recoil/actions';
import { commentsState } from '../../recoil/comments';
import { filterBySearch } from '../search/utils';

const List = () => {
  const [filters, setFilters] = useState([]);
  const places = useRecoilValue(placesState);
  const actions = useRecoilValue(actionsState);
  const comments = useRecoilValue(commentsState);
  const [viewAllOrganisationData, setViewAllOrganisationData] = useState(true);
  const { search, setSearch, page, setPage, filterTeams, alertness, setFilterAlertness, setFilterTeams } = useContext(PaginationContext);

  const persons = useRecoilValue(personsWithPlacesSelector);
  const personsFiltered = useMemo(() => {
    let pFiltered = persons;
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
  }, [persons, filterTeams, filters, alertness]);

  // The next memos are used to filter by search (empty array when search is empty).
  const personsFilteredIds = useMemo(() => personsFiltered.map((p) => p._id), [personsFiltered]);
  const actionsOfFilteredPersons = useMemo(() => actions.filter((a) => personsFilteredIds.includes(a.person)), [actions, personsFilteredIds]);
  const actionsOfFilteredPersonsIds = useMemo(() => actionsOfFilteredPersons.map((a) => a._id), [actionsOfFilteredPersons]);
  const commentsOfFilteredPersons = useMemo(() => comments.filter((c) => personsFilteredIds.includes(c.person)), [comments, personsFilteredIds]);
  const commentsOfFilteredActions = useMemo(
    () => comments.filter((c) => actionsOfFilteredPersonsIds.includes(c.action)),
    [actionsOfFilteredPersonsIds, comments]
  );
  const personsIdsFilteredByActionsSearch = useMemo(
    () => filterBySearch(search, actionsOfFilteredPersons).map((a) => a.person),
    [actionsOfFilteredPersons, search]
  );
  const personsIdsFilteredByActionsCommentsSearch = useMemo(
    () => filterBySearch(search, commentsOfFilteredPersons).map((c) => c.person),
    [commentsOfFilteredPersons, search]
  );
  const personsIdsFilteredByPersonsCommentsSearch = useMemo(
    () => filterBySearch(search, commentsOfFilteredActions).map((c) => c.person),
    [commentsOfFilteredActions, search]
  );
  const personsIdsFilteredByPersonsSearch = useMemo(() => filterBySearch(search, personsFiltered).map((c) => c._id), [personsFiltered, search]);

  const personsFilteredBySearch = useMemo(() => {
    if (!search?.length) return personsFiltered;
    const personsIdsFilterBySearch = [
      ...new Set([
        ...personsIdsFilteredByActionsSearch,
        ...personsIdsFilteredByActionsCommentsSearch,
        ...personsIdsFilteredByPersonsCommentsSearch,
        ...personsIdsFilteredByPersonsSearch,
      ]),
    ];
    return personsFiltered.filter((p) => personsIdsFilterBySearch.includes(p._id));
  }, [
    search?.length,
    personsFiltered,
    personsIdsFilteredByActionsSearch,
    personsIdsFilteredByActionsCommentsSearch,
    personsIdsFilteredByPersonsCommentsSearch,
    personsIdsFilteredByPersonsSearch,
  ]);

  const teams = useRecoilValue(teamsState);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const organisation = useRecoilValue(organisationState);
  const currentTeam = useRecoilValue(currentTeamState);
  const history = useHistory();

  useEffect(() => {
    setFilterTeams(viewAllOrganisationData ? [] : [teams.find((team) => team._id === currentTeam._id)._id]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewAllOrganisationData, currentTeam, teams]);

  // Add places and enabled custom fields in filters.
  const filterPersonsWithAllFields = [
    ...filterPersonsBase,
    ...customFieldsPersonsSocial.filter((a) => a.enabled).map((a) => ({ field: a.name, ...a })),
    ...customFieldsPersonsMedical.filter((a) => a.enabled).map((a) => ({ field: a.name, ...a })),
    {
      label: 'Lieux fréquentés',
      field: 'places',
      options: [...new Set(places.map((place) => place.name))],
    },
  ];

  const limit = 20;
  if (!personsFilteredBySearch) return <Loading />;

  const data = personsFilteredBySearch.filter((_, index) => index < (page + 1) * limit && index >= page * limit);
  const total = personsFilteredBySearch.length;

  return (
    <>
      <SmallerHeaderWithBackButton
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
        titleStyle={{ fontWeight: 400 }}
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
          <span style={{ marginRight: 20, width: 250, flexShrink: 0 }}>Recherche : </span>
          <Search
            placeholder="Par mot clé, présent dans le nom, la description, un commentaire, une action, ..."
            value={search}
            onChange={setSearch}
          />
        </Col>
        <Col md={12} style={{ display: 'flex', alignItems: 'center' }}>
          <label style={{ marginLeft: '270px' }}>
            <input
              type="checkbox"
              style={{ marginRight: 10 }}
              checked={viewAllOrganisationData}
              onChange={() => setViewAllOrganisationData(!viewAllOrganisationData)}
            />
            Afficher les personnes de toute l'organisation
          </label>
        </Col>
        <Col md={12} style={{ display: 'flex', alignItems: 'center' }}>
          <label style={{ marginLeft: '270px' }}>
            <input type="checkbox" style={{ marginRight: 10 }} value={alertness} onChange={() => setFilterAlertness(!alertness)} />
            N'afficher que les personnes vulnérables où ayant besoin d'une attention particulière
          </label>
        </Col>
      </Row>
      <Filters base={filterPersonsWithAllFields} filters={filters} onChange={setFilters} title="Autres filtres : " />
      <Table
        data={data}
        rowKey={'_id'}
        onRowClick={(p) => history.push(`/person/${p._id}`)}
        columns={[
          {
            title: 'Nom',
            dataKey: 'name',
            render: (p) => {
              if (p.outOfActiveList)
                return (
                  <div style={{ color: theme.black50 }}>
                    <div>{p.name}</div>
                    <div>Sortie de file active : {p.outOfActiveListReason}</div>
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
              else if (p.outOfActiveList) return <i style={{ color: theme.black50 }}>{formatBirthDate(p.birthdate)}</i>;
              return (
                <span>
                  <i>{formatBirthDate(p.birthdate)}</i>
                </span>
              );
            },
          },
          {
            title: 'Vigilance',
            dataKey: 'alertness',
            render: (p) => <Alertness>{p.alertness ? '!' : ''}</Alertness>,
          },
          { title: 'Équipe(s) en charge', dataKey: 'assignedTeams', render: (person) => <Teams teams={teams} person={person} /> },
          {
            title: 'Suivi(e) depuis le',
            dataKey: 'createdAt',
            render: (p) => {
              if (p.outOfActiveList) return <div style={{ color: theme.black50 }}>{formatDateWithFullMonth(p.createdAt || '')}</div>;
              return formatDateWithFullMonth(p.createdAt || '');
            },
          },
        ]}
      />
      <Page page={page} limit={limit} total={total} onChange={({ page }) => setPage(page, true)} />
    </>
  );
};

const Teams = ({ person: { _id, assignedTeams }, teams }) => (
  <React.Fragment key={_id}>
    {assignedTeams?.map((teamId) => (
      <TagTeam key={teamId} teamId={teamId} />
    ))}
  </React.Fragment>
);

const PersonsActionsStyled = styled.div`
  margin-bottom: 40px;
  width: 100%;
  display: flex;
  justify-content: flex-end;
`;

const Alertness = styled.span`
  display: block;
  text-align: center;
  color: red;
  font-weight: bold;
`;

export default List;
