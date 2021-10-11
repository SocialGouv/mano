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
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import AuthContext from '../../contexts/auth';
import { filterPersonsBase } from '../../contexts/persons';
import TagTeam from '../../components/TagTeam';
import PaginationContext from '../../contexts/pagination';
import Filters, { filterData } from '../../components/Filters';
import { filterBySearch } from '../search/utils';
import { displayBirthDate } from '../../services/date';
import { PersonsSelectorsContext } from '../../contexts/selectors';
import CreatePerson from './CreatePerson';

const getData = (persons = [], { page, limit, search, filterTeams, filters, alertness } = {}) => {
  if (!!filters?.filter((f) => Boolean(f?.value)).length) persons = filterData(persons, filters);
  if (search?.length) {
    persons = filterBySearch(search, persons);
  }
  if (!!alertness) persons = persons.filter((p) => !!p.alertness);
  if (filterTeams.length) {
    persons = persons.filter((p) => {
      for (let assignedTeam of p.assignedTeams) {
        if (filterTeams.includes(assignedTeam)) return true;
      }
      return false;
    });
  }
  const data = persons.filter((_, index) => index < (page + 1) * limit && index >= page * limit);
  return { data, total: persons.length };
};

const List = () => {
  const [filters, setFilters] = useState([]);

  const { personsFullPopulated } = useContext(PersonsSelectorsContext);
  const { organisation, teams } = useContext(AuthContext);
  const history = useHistory();

  const { search, setSearch, page, setPage, filterTeams, alertness, setFilterAlertness, setFilterTeams } = useContext(PaginationContext);

  const limit = 20;

  if (!personsFullPopulated) return <Loading />;

  const { data, total } = getData(personsFullPopulated, { page, limit, search, filterTeams, alertness, filters });

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
      <Filters base={filterPersonsBase} filters={filters} onChange={setFilters} title="Autres filtres : " />
      <Table
        data={data}
        rowKey={'_id'}
        onRowClick={(p) => history.push(`/person/${p._id}`)}
        columns={[
          {
            title: 'Nom',
            dataKey: 'name',
          },
          {
            title: 'Date de naissance',
            dataKey: '_id',
            render: (p) =>
              !p.birthdate ? (
                ''
              ) : (
                <span>
                  <i>{displayBirthDate(p.birthdate)}</i>
                </span>
              ),
          },
          {
            title: 'Vigilance',
            dataKey: 'alertness',
            render: (p) => <Alertness>{p.alertness ? '!' : ''}</Alertness>,
          },
          { title: 'Équipe(s) en charge', dataKey: 'assignedTeams', render: (person) => <Teams teams={teams} person={person} /> },
          { title: 'Suivi(e) depuis le', dataKey: 'createdAt', render: (p) => toFrenchDate(p.createdAt || '') },
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
