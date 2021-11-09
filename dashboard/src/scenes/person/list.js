/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useState } from 'react';
import { Col, Container, Row } from 'reactstrap';
import { useHistory } from 'react-router-dom';

import styled from 'styled-components';

import { toFrenchDate } from '../../utils';

import Header from '../../components/header';
import Page from '../../components/pagination';
import Search from '../../components/search';
import Loading from '../../components/loading';
import Table from '../../components/table';
import CreatePerson from './CreatePerson';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import { filterPersonsBase } from '../../recoil/persons';
import TagTeam from '../../components/TagTeam';
import PaginationContext from '../../contexts/pagination';
import Filters from '../../components/Filters';
import { displayBirthDate } from '../../services/date';
import { personsFullSearchSelector } from '../../recoil/selectors';
import { theme } from '../../config';
import useAuth from '../../recoil/auth';
import { usePlaces } from '../../recoil/places';
import { useRecoilValue } from 'recoil';

const List = () => {
  const [filters, setFilters] = useState([]);
  const { places } = usePlaces();

  // Add places in filters.
  const filterPersons = [
    ...filterPersonsBase,
    {
      label: 'Lieux fréquentés',
      field: 'places',
      options: [...new Set(places.map((place) => place.name))],
    },
  ];

  const { search, setSearch, page, setPage, filterTeams, alertness, setFilterAlertness, setFilterTeams } = useContext(PaginationContext);

  const personsFiltered = useRecoilValue(personsFullSearchSelector({ search, filterTeams, filters, alertness }));
  const { organisation, teams } = useAuth();
  const history = useHistory();

  const limit = 20;

  if (!personsFiltered) return <Loading />;

  const data = personsFiltered.filter((_, index) => index < (page + 1) * limit && index >= page * limit);
  const total = personsFiltered.length;

  return (
    <Container style={{ padding: '40px 0' }}>
      <Header title={`Personnes suivies par l'organisation ${organisation.name}`} />
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
        <Col md={12} />
        <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ marginRight: 20, width: 250, flexShrink: 0 }}>Filtrer par équipe en charge :</span>
          <div style={{ width: 300 }}>
            <SelectTeamMultiple onChange={setFilterTeams} value={filterTeams} colored />
          </div>
        </Col>
        <Col md={12} style={{ display: 'flex', alignItems: 'center' }}>
          <label>
            <input type="checkbox" style={{ marginRight: 10 }} value={alertness} onChange={() => setFilterAlertness(!alertness)} />
            N'afficher que les personnes vulnérables où ayant besoin d'une attention particulière
          </label>
        </Col>
      </Row>
      <Filters base={filterPersons} filters={filters} onChange={setFilters} title="Autres filtres : " />
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
              else if (p.outOfActiveList) return <i style={{ color: theme.black50 }}>{displayBirthDate(p.birthdate)}</i>;
              return (
                <span>
                  <i>{displayBirthDate(p.birthdate)}</i>
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
              if (p.outOfActiveList) return <div style={{ color: theme.black50 }}>{toFrenchDate(p.createdAt || '')}</div>;
              return toFrenchDate(p.createdAt || '');
            },
          },
        ]}
      />
      <Page page={page} limit={limit} total={total} onChange={({ page }) => setPage(page, true)} />
    </Container>
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
