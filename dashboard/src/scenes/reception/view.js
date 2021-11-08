/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useContext, useState } from 'react';
import { Col, Container, Row } from 'reactstrap';
import styled from 'styled-components';
import { useHistory, useLocation } from 'react-router-dom';

import Header from '../../components/header';

import { today } from '../../services/date';
import { ActionsByStatusContext, ReportsSelectorsContext } from '../../contexts/selectors';
import Card from '../../components/Card';
import Incrementor from '../../components/Incrementor';
import { theme } from '../../config';
import CreateAction from '../action/CreateAction';
import SelectAndCreatePerson from './SelectAndCreatePerson';
import ButtonCustom from '../../components/ButtonCustom';
import ActionsCalendar from '../../components/ActionsCalendar';
import SelectStatus from '../../components/SelectStatus';
import { TODO } from '../../recoil/actions';
import useAuth from '../../recoil/auth';
import { usePersons } from '../../recoil/persons';
import { useReports } from '../../recoil/reports';

const Reception = () => {
  const { currentTeam, organisation } = useAuth();
  const { loading: reportsLoading, addReport, updateReport, incrementPassage } = useReports();
  const { actionsByStatus } = useContext(ActionsByStatusContext);
  const { todaysReport, lastReport } = useContext(ReportsSelectorsContext);
  const [status, setStatus] = useState(TODO);

  const { persons } = usePersons();
  const history = useHistory();
  const location = useLocation();

  // for better UX when increase passage
  const [passages, setPassages] = useState(todaysReport?.passages || 0);
  const [addingPassage, setAddingPassage] = useState(false);
  useEffect(() => {
    setPassages(todaysReport?.passages || 0);
  }, [todaysReport?.passages]);

  const [selectedPersons, setSelectedPersons] = useState(() => {
    const params = new URLSearchParams(location.search)?.get('persons')?.split(',');
    if (!params) return [];
    return params.map((id) => persons.find((p) => p._id === id));
  });

  const createReport = async () => addReport(today(), currentTeam._id);

  useEffect(() => {
    if (!reportsLoading && !todaysReport && !!currentTeam._id) createReport();
  }, [reportsLoading, currentTeam?._id]);

  const services = todaysReport?.services?.length ? JSON.parse(todaysReport?.services) : {};

  const onSelectPerson = (persons) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('persons', persons.map((p) => p._id).join(','));
    setSelectedPersons(persons);
    history.replace({ pathname: location.pathname, search: searchParams.toString() });
  };

  const onServiceUpdate = async (service, newCount) => {
    const reportUpdate = {
      ...todaysReport,
      services: JSON.stringify({
        ...services,
        [service]: newCount,
      }),
    };
    await updateReport(reportUpdate);
  };

  const onAddPassage = async () => {
    setAddingPassage(true);
    setPassages((p) => p + (selectedPersons.length || 1));
    await incrementPassage(todaysReport, {
      persons: selectedPersons,
      // onSuccess: () => onSelectPerson([]),
    });
    setAddingPassage(false);
  };

  const onGoToFile = () => history.push(`/person/${selectedPersons[0]._id}`);
  const onGoToLastReport = () => history.push(`/report/${lastReport._id}`);

  return (
    <Container style={{ padding: 0 }}>
      <Header
        title={`Accueil du ${new Date().toLocaleDateString('fr', { day: 'numeric', weekday: 'long', month: 'long', year: 'numeric' })} de l'équipe ${
          currentTeam?.nightSession ? 'de nuit ' : ''
        }${currentTeam?.name || ''}`}
      />
      <Row style={{ paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid #ddd' }}>
        <Col
          md={3}
          style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', flexDirection: 'column', borderRight: '1px solid #ddd' }}>
          <ButtonCustom
            onClick={onGoToLastReport}
            color="link"
            title="Accéder au dernier compte-rendu"
            padding="12px 24px"
            disabled={!lastReport?._id}
          />
        </Col>
        <Col
          md={5}
          style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', flexDirection: 'column', borderRight: '1px solid #ddd' }}>
          <div style={{ flexShrink: 0, width: '100%' }}>
            <SelectAndCreatePerson value={selectedPersons} onChange={onSelectPerson} autoCreate />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', flexShrink: 0, width: '100%' }}>
            <CreateAction noIcon title="Nouvelle Action" buttonOnly isMulti persons={selectedPersons.map((p) => p._id)} />
            <ButtonCustom
              onClick={onAddPassage}
              color="primary"
              title="Ajouter un passage"
              padding="12px 24px"
              disabled={addingPassage || !selectedPersons.length}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', flexShrink: 0, width: '100%' }}>
            <ButtonCustom disabled={selectedPersons.length !== 1} onClick={onGoToFile} color="link" title="Accéder au dossier" padding="12px 24px" />
          </div>
        </Col>
        <Col md={4}>
          <Card
            title="Nombre de passages"
            count={passages}
            unit={`passage${passages > 1 ? 's' : ''}`}
            onChange={async (newValue) => {
              setAddingPassage(true);
              setPassages(newValue);
              await incrementPassage(todaysReport, { newValue });
              setAddingPassage(false);
            }}>
            <ButtonCustom
              onClick={async () => {
                setAddingPassage(true);
                setPassages((p) => p + 1);
                await incrementPassage(todaysReport);
                setAddingPassage(false);
              }}
              color="link"
              title="Ajouter un passage anonyme"
              padding="0px"
              disabled={addingPassage}
            />
            <ButtonCustom
              onClick={async () => {
                setAddingPassage(true);
                const newValue = passages - 1;
                setPassages(newValue);
                await incrementPassage(todaysReport, { newValue });
                setAddingPassage(false);
              }}
              color="link"
              title="Retirer un passage"
              padding="0px"
              disabled={addingPassage}
            />
          </Card>
        </Col>
      </Row>
      <Row style={{ paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid #ddd' }}>
        <Col md={8} style={{ paddingBottom: 20, marginBottom: 20, borderRight: '1px solid #ddd' }}>
          <Container>
            <SectionTitle>Actions</SectionTitle>
            <div style={{ margin: '15px' }}>
              <SelectStatus noTitle onChange={(event) => setStatus(event.target.value)} value={status} />
            </div>
            <ActionsCalendar actions={actionsByStatus[status]} columns={['Heure', 'Nom', 'Personne suivie', 'Status']} />
          </Container>
        </Col>
        <Col md={4}>
          <SectionTitle style={{ marginRight: 20, width: 250, flexShrink: 0 }}>Services</SectionTitle>
          {organisation?.services?.map((service) => (
            <Incrementor key={service} service={service} count={services[service] || 0} onChange={(newCount) => onServiceUpdate(service, newCount)} />
          ))}
        </Col>
      </Row>
    </Container>
  );
};

const SectionTitle = styled.h4`
  color: ${theme.black};
  font-weight: bold;
  font-size: 20px;
  line-height: 32px;
`;

export default Reception;
