/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useState, useEffect } from 'react';
import { Container, Row, Col, TabContent, TabPane, Nav, NavItem, NavLink } from 'reactstrap';
import styled from 'styled-components';
import { useHistory, useLocation } from 'react-router-dom';

import { toFrenchDate } from '../../utils';
import DateBloc from '../../components/DateBloc';
import Header from '../../components/header';
import Box from '../../components/Box';
import ActionStatus from '../../components/ActionStatus';
import Table from '../../components/table';
import Observation from '../territory-observations/view';
import dayjs from 'dayjs';
import AuthContext from '../../contexts/auth';
import ActionsContext from '../../contexts/actions';
import CommentsContext from '../../contexts/comments';
import PersonsContext from '../../contexts/persons';
import TerritoryObservationsContext from '../../contexts/territoryObservations';
import TerritoryContext from '../../contexts/territory';
import { capture } from '../../services/sentry';
import UserName from '../../components/UserName';
import RefreshContext from '../../contexts/refresh';
import PaginationContext, { PaginationProvider } from '../../contexts/pagination';
import Search from '../../components/search';
import TagTeam from '../../components/TagTeam';
import PlacesContext from '../../contexts/places';
import { filterBySearch } from './utils';
import RelsPersonPlaceContext from '../../contexts/relPersonPlace';

const initTabs = ['Actions', 'Personnes', 'Commentaires', 'Lieux', 'Territoires', 'Observations'];

const View = () => {
  const { refresh } = useContext(RefreshContext);
  const { search, setSearch } = useContext(PaginationContext);
  const [tabsContents, setTabsContents] = useState(initTabs);
  const location = useLocation();
  const history = useHistory();
  const searchParams = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useState(initTabs.findIndex((value) => value.toLowerCase() === searchParams.get('tab')) || 0);

  const updateTabContent = (tabIndex, content) => setTabsContents((contents) => contents.map((c, index) => (index === tabIndex ? content : c)));

  useEffect(() => {
    if (!search) setTabsContents(initTabs);
  }, [search]);

  const renderContent = () => {
    if (!search) return 'Pas de recherche, pas de résultat !';
    return (
      <>
        <Nav tabs fill style={{ marginBottom: 20 }}>
          {tabsContents.map((tabCaption, index) => (
            <NavItem key={index} style={{ cursor: 'pointer' }}>
              <NavLink
                key={index}
                className={`${activeTab === index && 'active'}`}
                onClick={() => {
                  const searchParams = new URLSearchParams(location.search);
                  searchParams.set('tab', initTabs[index].toLowerCase());
                  history.replace({ pathname: location.pathname, search: searchParams.toString() });
                  setActiveTab(index);
                }}>
                {tabCaption}
              </NavLink>
            </NavItem>
          ))}
        </Nav>
        <TabContent activeTab={activeTab}>
          <TabPane tabId={0}>
            <Actions search={search} onUpdateResults={(total) => updateTabContent(0, `Actions (${total})`)} />
          </TabPane>
          <TabPane tabId={1}>
            <Persons search={search} onUpdateResults={(total) => updateTabContent(1, `Personnes (${total})`)} />
          </TabPane>
          <TabPane tabId={2}>
            <Comments search={search} onUpdateResults={(total) => updateTabContent(2, `Commentaires (${total})`)} />
          </TabPane>
          <TabPane tabId={3}>
            <Places search={search} onUpdateResults={(total) => updateTabContent(3, `Lieux (${total})`)} />
          </TabPane>
          <TabPane tabId={4}>
            <Territories search={search} onUpdateResults={(total) => updateTabContent(4, `Territoires (${total})`)} />
          </TabPane>
          <TabPane tabId={5}>
            <TerritoryObservations search={search} onUpdateResults={(total) => updateTabContent(5, `Observations (${total})`)} />
          </TabPane>
        </TabContent>
      </>
    );
  };

  return (
    <Container style={{ padding: '40px 0' }}>
      <Header title="Rechercher" onRefresh={() => refresh()} />
      <Row style={{ marginBottom: 40, borderBottom: '1px solid #ddd' }}>
        <Col md={12} style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <Search placeholder="Par mot clé" value={search} onChange={setSearch} />
        </Col>
      </Row>
      {renderContent()}
    </Container>
  );
};

const Actions = ({ search, onUpdateResults }) => {
  const history = useHistory();
  const { actions } = useContext(ActionsContext);
  const { persons } = useContext(PersonsContext);
  const { currentTeam } = useContext(AuthContext);

  const data = filterBySearch(
    search,
    actions?.filter((a) => a.team === currentTeam._id)
  ).map((action) => ({
    ...action,
    person: persons.find((p) => p._id === action?.person),
  }));

  useEffect(() => {
    onUpdateResults(data.length);
  }, [search]);

  if (!data) return <div />;

  const moreThanOne = data.length > 1;

  return (
    <>
      <StyledBox>
        <Table
          className="Table"
          title={`Action${moreThanOne ? 's' : ''} (${data.length})`}
          noData="Pas d'action"
          data={data}
          onRowClick={(action) => history.push(`/action/${action._id}`)}
          rowKey="_id"
          columns={[
            { title: 'À faire le ', dataKey: 'dueAt', render: (action) => <DateBloc date={action.dueAt} /> },
            {
              title: 'Heure',
              dataKey: '_id',
              render: (action) => {
                if (!action.dueAt || !action.withTime) return null;
                return new Date(action.dueAt).toLocaleString('fr', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
              },
            },
            { title: 'Nom', dataKey: 'name' },
            { title: 'Personne suivie', dataKey: 'person', render: (action) => <span>{action.person?.name || ''}</span> },
            { title: 'Créée le', dataKey: 'createdAt', render: (action) => toFrenchDate(action.createdAt || '') },
            { title: 'Status', dataKey: 'status', render: (action) => <ActionStatus status={action.status} /> },
          ]}
        />
      </StyledBox>
      <hr />
    </>
  );
};

const Alertness = styled.span`
  display: block;
  text-align: center;
  color: red;
  font-weight: bold;
`;

const Persons = ({ search, onUpdateResults }) => {
  const history = useHistory();
  const { persons } = useContext(PersonsContext);
  const { teams } = useContext(AuthContext);

  const data = filterBySearch(search, persons);

  useEffect(() => {
    onUpdateResults(data.length);
  }, [search]);

  if (!data) return <div />;

  const moreThanOne = data.length > 1;

  const Teams = ({ person: { _id, assignedTeams } }) => (
    <React.Fragment key={_id}>
      {assignedTeams?.map((teamId) => (
        <TagTeam key={teamId} teamId={teamId} />
      ))}
    </React.Fragment>
  );

  return (
    <>
      <StyledBox>
        <Table
          data={data}
          title={`Personne${moreThanOne ? 's' : ''} suivie${moreThanOne ? 's' : ''} (${data.length})`}
          rowKey={'_id'}
          noData="Pas de personne suivie"
          onRowClick={(p) => history.push(`/person/${p._id}`)}
          columns={[
            { title: 'Nom', dataKey: 'name' },
            {
              title: 'Vigilance',
              dataKey: 'alertness',
              render: (p) => <Alertness>{p.alertness ? '!' : ''}</Alertness>,
            },
            { title: 'Équipe(s) en charge', dataKey: 'assignedTeams', render: (person) => <Teams teams={teams} person={person} /> },
            { title: 'Suivi(e) depuis le', dataKey: 'createdAt', render: (p) => toFrenchDate(p.createdAt || '') },
          ]}
        />
      </StyledBox>
      <hr />
    </>
  );
};

const Comments = ({ search, onUpdateResults }) => {
  const history = useHistory();

  const { comments } = useContext(CommentsContext);
  const { persons } = useContext(PersonsContext);
  const { actions } = useContext(ActionsContext);
  const { currentTeam } = useContext(AuthContext);

  const data = filterBySearch(
    search,
    comments?.filter((c) => c.team === currentTeam._id)
  ).map((comment) => {
    const commentPopulated = { ...comment };
    if (comment.person) {
      commentPopulated.person = persons.find((p) => p._id === comment?.person);
      commentPopulated.type = 'person';
    }
    if (comment.action) {
      const action = actions.find((p) => p._id === comment?.action);
      commentPopulated.action = action;
      commentPopulated.person = persons.find((p) => p._id === action?.person);
      commentPopulated.type = 'action';
    }
    return commentPopulated;
  });

  useEffect(() => {
    onUpdateResults(data.length);
  }, [search]);

  if (!data) return <div />;

  const moreThanOne = data.length > 1;

  return (
    <>
      <StyledBox>
        <Table
          className="Table"
          title={`Commentaire${moreThanOne ? 's' : ''} (${data.length})`}
          data={data}
          noData="Pas de commentaire"
          onRowClick={(comment) => {
            try {
              history.push(`/${comment.type}/${comment[comment.type]._id}`);
            } catch (errorLoadingComment) {
              capture(errorLoadingComment, { extra: { message: 'error loading comment from search', comment, search } });
            }
          }}
          rowKey="_id"
          columns={[
            {
              title: 'Heure',
              dataKey: 'createdAt',
              render: (comment) => <span>{dayjs(comment.createdAt).format('HH:mm')}</span>,
            },
            {
              title: 'Utilisateur',
              dataKey: 'user',
              render: (comment) => <UserName id={comment.user} />,
            },
            {
              title: 'Type',
              dataKey: 'type',
              render: (comment) => <span>{comment.type === 'action' ? 'Action' : 'Personne suivie'}</span>,
            },
            {
              title: 'Nom',
              dataKey: 'person',
              render: (comment) => (
                <>
                  <b></b>
                  <b>{comment[comment.type]?.name}</b>
                  {comment.type === 'action' && (
                    <>
                      <br />
                      <i>(pour {comment.person?.name || ''})</i>
                    </>
                  )}
                </>
              ),
            },
            {
              title: 'Commentaire',
              dataKey: 'comment',
              render: (comment) => {
                return (
                  <p>
                    {comment.comment
                      ? comment.comment.split('\n').map((c, i, a) => {
                          if (i === a.length - 1) return c;
                          return (
                            <React.Fragment key={i}>
                              {c}
                              <br />
                            </React.Fragment>
                          );
                        })
                      : ''}
                  </p>
                );
              },
            },
          ]}
        />
      </StyledBox>
      <hr />
    </>
  );
};

const Territories = ({ search, onUpdateResults }) => {
  const history = useHistory();
  const { territories } = useContext(TerritoryContext);

  const data = filterBySearch(search, territories);

  useEffect(() => {
    onUpdateResults(data.length);
  }, [search]);

  if (!data) return <div />;
  const moreThanOne = data.length > 1;

  return (
    <>
      <StyledBox>
        <Table
          className="Table"
          title={`Territoire${moreThanOne ? 's' : ''} (${data.length})`}
          noData="Pas de territoire"
          data={data}
          onRowClick={(obs) => history.push(`/territory/${obs.territory._id}`)}
          rowKey="_id"
          columns={[
            { title: 'Nom', dataKey: 'name' },
            { title: 'Types', dataKey: 'types', render: ({ types }) => (types ? types.join(', ') : '') },
            { title: 'Périmètre', dataKey: 'perimeter' },
            { title: 'Créé le', dataKey: 'createdAt', render: (territory) => toFrenchDate(territory.createdAt || '') },
          ]}
        />
      </StyledBox>
      <hr />
    </>
  );
};

const Places = ({ search, onUpdateResults }) => {
  const history = useHistory();
  const { places } = useContext(PlacesContext);
  const { relsPersonPlace } = useContext(RelsPersonPlaceContext);
  const { persons } = useContext(PersonsContext);

  const data = filterBySearch(search, places);

  useEffect(() => {
    onUpdateResults(data.length);
  }, [search]);

  if (!data) return <div />;
  const moreThanOne = data.length > 1;

  return (
    <>
      <StyledBox>
        <Table
          className="Table"
          title={`Lieu${moreThanOne ? 'x' : ''} fréquenté${moreThanOne ? 's' : ''} (${data.length})`}
          noData="Pas de lieu fréquenté"
          data={data}
          onRowClick={(obs) => history.push(`/territory/${obs.territory._id}`)}
          rowKey="_id"
          columns={[
            { title: 'Nom', dataKey: 'name' },
            {
              title: 'Personnes suivies',
              dataKey: 'persons',
              render: (place) => (
                <span
                  dangerouslySetInnerHTML={{
                    __html: relsPersonPlace
                      .filter((rel) => rel.place === place._id)
                      .map((rel) => persons.find((p) => p._id === rel.person)?.name)
                      .join('<br/>'),
                  }}
                />
              ),
            },
            { title: 'Créée le', dataKey: 'createdAt', render: (place) => toFrenchDate(place.createdAt) },
          ]}
        />
      </StyledBox>
      <hr />
    </>
  );
};

const TerritoryObservations = ({ search, onUpdateResults }) => {
  const history = useHistory();
  const { currentTeam } = useContext(AuthContext);
  const { territoryObservations } = useContext(TerritoryObservationsContext);
  const { territories } = useContext(TerritoryContext);

  const data = filterBySearch(
    search,
    territoryObservations?.filter((o) => o.team === currentTeam._id)
  ).map((obs) => ({
    ...obs,
    territory: territories.find((t) => t._id === obs.territory),
  }));

  useEffect(() => {
    onUpdateResults(data.length);
  }, [search]);

  if (!data) return <div />;
  const moreThanOne = data.length > 1;

  return (
    <>
      <StyledBox>
        <Table
          className="Table"
          title={`Observation${moreThanOne ? 's' : ''} de territoire${moreThanOne ? 's' : ''}  (${data.length})`}
          noData="Pas d'observation"
          data={data}
          onRowClick={(obs) => history.push(`/territory/${obs.territory._id}`)}
          rowKey="_id"
          columns={[
            {
              title: 'Heure',
              dataKey: 'createdAt',
              render: (obs) => <span>{dayjs(obs.createdAt).format('HH:mm')}</span>,
            },
            {
              title: 'Utilisateur',
              dataKey: 'user',
              render: (obs) => <UserName id={obs.user} />,
            },
            { title: 'Territoire', dataKey: 'territory', render: (obs) => obs?.territory?.name },
            { title: 'Observation', dataKey: 'entityKey', render: (obs) => <Observation noBorder obs={obs} />, left: true },
          ]}
        />
      </StyledBox>
      <hr />
    </>
  );
};

const StyledBox = styled(Box)`
  border-radius: 16px;
  padding: 16px 32px;
  @media print {
    margin-bottom: 15px;
  }

  .Table {
    padding: 0;
  }
`;

const ViewWithPagination = () => (
  <PaginationProvider>
    <View />
  </PaginationProvider>
);

export default ViewWithPagination;
