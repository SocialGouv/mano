import React, { useEffect, useState } from 'react';
import { Container, Nav, NavItem, TabContent, TabPane, Row, Col } from 'reactstrap';
import styled from 'styled-components';
import { useParams, Link } from 'react-router-dom';

import api from '../../services/api';
import Header from '../../components/header';
import TabButton from '../../components/tabButton';
import BackButton from '../../components/backButton';
import Box from '../../components/Box';
import { useRecoilValue } from 'recoil';
import { actionsState } from '../../recoil/actions';

export default () => {
  const [activeTab, setActiveTab] = useState('1');
  const { actionId } = useParams();
  const action = useRecoilValue(actionsState).find((e) => e._id === actionId);

  return (
    <Container style={{ padding: '40px 0' }}>
      <Header title={<BackButton />} />
      <Box>
        <Nav tabs style={{ marginBottom: 30 }}>
          <NavItem>
            <TabButton style={{ backgroundColor: activeTab === '1' && '#eee' }} onClick={() => setActiveTab('1')}>
              Voir
            </TabButton>
          </NavItem>
          <NavItem>
            <TabButton style={{ backgroundColor: activeTab === '2' && '#eee' }} onClick={() => setActiveTab('2')}>
              Data
            </TabButton>
          </NavItem>
        </Nav>
        <TabContent activeTab={activeTab}>
          <TabPane tabId="1">
            <Row>
              <Col md={8}>
                <div>{action.name}</div>
                <div>{action.description}</div>
                <div>{`Status : ${action.status}`}</div>
                <div>{`Crée le : ${action.createdAt.slice(0, 10)}`}</div>
              </Col>
              <Col>
                <Organisation id={action.organisation}></Organisation>
                <Team id={action.team} />
                <Person id={action.person} />
                <User id={action.user} />
              </Col>
            </Row>
          </TabPane>
          <TabPane tabId="2">
            <pre>
              {Object.keys(action).map((e) => (
                <div>
                  <strong>{e}:</strong> {JSON.stringify(action[e])}
                </div>
              ))}
            </pre>
          </TabPane>
        </TabContent>
      </Box>
    </Container>
  );
};

const Organisation = ({ id }) => {
  const [organisation, setOrganisation] = useState(null);
  useEffect(() => {
    (async () => {
      const { data } = await api.get(`/organisation/${id}`);
      setOrganisation(data);
    })();
  }, []);
  if (!organisation) return <div />;
  return (
    <Card>
      <h1>Organisation</h1>
      <Link to={`/organisation/${organisation._id}`}>{organisation.name}</Link>
    </Card>
  );
};

const Person = ({ id }) => {
  const [person, setPerson] = useState(null);
  useEffect(() => {
    (async () => {
      const { data } = await api.get(`/person/${id}`);
      setPerson(data);
    })();
  }, []);
  if (!person) return <div />;
  return (
    <Card>
      <h1>Usager</h1>
      <Link to={`/person/${person._id}`}>{person.name}</Link>
    </Card>
  );
};

const Team = ({ id }) => {
  const [team, setTeam] = useState(null);
  useEffect(() => {
    (async () => {
      const { data } = await api.get(`/team/${id}`);
      setTeam(data);
    })();
  }, []);
  if (!team) return <div />;
  return (
    <Card>
      <h1>Équipe</h1>
      <Link to={`/team/${team._id}`}>{team.name}</Link>
    </Card>
  );
};

const User = ({ id }) => {
  const [data, setData] = useState(null);
  useEffect(() => {
    (async () => {
      const { data: d } = await api.get(`/user/${id}`);
      setData(d);
    })();
  }, []);

  if (!data) return <div />;

  return (
    <Card>
      <h1>Utilisateur</h1>
      <Link to={`/user/${data._id}`}>{data.name}</Link>
    </Card>
  );
};

const Card = styled.div`
  background: white;
  padding: 10px;
  margin: 5px;
  border-style: solid;
  border-width: 1px;
  border-radius: 10px;
  border-color: #ddd;
  h1 {
    font-size: 14px;
    font-weight: bold;
  }
`;
