/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useState } from 'react';
import { Col, Row } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import styled from 'styled-components';
import Header from '../../components/header';
import Page from '../../components/pagination';
import Search from '../../components/search';
import Loading from '../../components/loading';
import Table from '../../components/table';
import CreatePerson from './CreatePerson';
import { customFieldsPersonsMedicalSelector, customFieldsPersonsSocialSelector, filterPersonsBase } from '../../recoil/persons';
import TagTeam from '../../components/TagTeam';
import PaginationContext from '../../contexts/pagination';
import Filters from '../../components/Filters';
import { formatBirthDate, formatDateWithFullMonth } from '../../services/date';
import { personsFullSearchSelector } from '../../recoil/selectors';
import { theme } from '../../config';
import { currentTeamState, organisationState, teamsState } from '../../recoil/auth';
import { usePlaces } from '../../recoil/places';

const List = () => {
  const [filters, setFilters] = useState([]);
  const { places } = usePlaces();
  const [viewAllOrganisationData, setViewAllOrganisationData] = useState(true);
  const { search, setSearch, page, setPage, filterTeams, alertness, setFilterAlertness, setFilterTeams } = useContext(PaginationContext);
  const personsFiltered = useRecoilValue(personsFullSearchSelector({ search, filterTeams, filters, alertness }));
  const teams = useRecoilValue(teamsState);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const organisation = useRecoilValue(organisationState);
  const currentTeam = useRecoilValue(currentTeamState);
  const history = useHistory();

  useEffect(() => {
    setFilterTeams(viewAllOrganisationData ? [] : [teams.find((team) => team._id === currentTeam._id)._id]);
  }, [viewAllOrganisationData, currentTeam]);

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
  if (!personsFiltered) return <Loading />;

  const data = personsFiltered.filter((_, index) => index < (page + 1) * limit && index >= page * limit);
  const total = personsFiltered.length;

  return (
    <>
      <Header
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
