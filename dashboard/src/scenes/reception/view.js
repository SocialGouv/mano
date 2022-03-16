/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from 'react';
import { Col, Row } from 'reactstrap';
import styled from 'styled-components';
import { useHistory, useLocation } from 'react-router-dom';
import { SmallerHeaderWithBackButton } from '../../components/header';
import { formatDateWithNameOfDay, isToday, now, startOfToday } from '../../services/date';
import {
  currentTeamReportsSelector,
  numberOfPassagesAnonymousPerDatePerTeamSelector,
  numberOfPassagesNonAnonymousPerDatePerTeamSelector,
} from '../../recoil/selectors';
import Card from '../../components/Card';
import Incrementor from '../../components/Incrementor';
import { theme } from '../../config';
import CreateAction from '../action/CreateAction';
import SelectAndCreatePerson from './SelectAndCreatePerson';
import ButtonCustom from '../../components/ButtonCustom';
import ActionsCalendar from '../../components/ActionsCalendar';
import SelectStatus from '../../components/SelectStatus';
import { actionsState, TODO } from '../../recoil/actions';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import { personsState } from '../../recoil/persons';
import { prepareReportForEncryption, reportsState } from '../../recoil/reports';
import { selector, selectorFamily, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { commentsState, prepareCommentForEncryption } from '../../recoil/comments';
import { collectionsToLoadState } from '../../components/Loader';
import useApi from '../../services/api';
import dayjs from 'dayjs';

export const actionsForCurrentTeamSelector = selector({
  key: 'actionsForCurrentTeamSelector',
  get: ({ get }) => {
    const actions = get(actionsState);
    const currentTeam = get(currentTeamState);
    return actions.filter((a) => a.team === currentTeam?._id);
  },
});

export const actionsByStatusSelector = selectorFamily({
  key: 'actionsByStatusSelector',
  get:
    ({ status }) =>
    ({ get }) => {
      const actions = get(actionsForCurrentTeamSelector);
      return actions.filter((a) => a.status === status);
    },
});

const todaysReportSelector = selector({
  key: 'todaysReportSelector',
  get: ({ get }) => {
    const teamsReports = get(currentTeamReportsSelector);
    return teamsReports.find((rep) => isToday(rep.date));
  },
});

const lastReportSelector = selector({
  key: 'lastReportSelector',
  get: ({ get }) => {
    const teamsReports = get(currentTeamReportsSelector);
    const todays = get(todaysReportSelector);
    return teamsReports.filter((rep) => rep._id !== todays?._id)[0];
  },
});
// MIGRATION TODO
const Reception = () => {
  const organisation = useRecoilValue(organisationState);
  const currentTeam = useRecoilValue(currentTeamState);

  const [reports, setReports] = useRecoilState(reportsState);
  const [status, setStatus] = useState(TODO);
  const actionsByStatus = useRecoilValue(actionsByStatusSelector({ status }));
  const todaysReport = useRecoilValue(todaysReportSelector);
  const lastReport = useRecoilValue(lastReportSelector);
  const user = useRecoilValue(userState);
  const collectionsToLoad = useRecoilValue(collectionsToLoadState);
  const setComments = useSetRecoilState(commentsState);
  const reportsLoading = useMemo(() => collectionsToLoad.includes('report'), [collectionsToLoad]);
  const API = useApi();

  const anonymousPassages = useRecoilValue(numberOfPassagesAnonymousPerDatePerTeamSelector({ date: startOfToday() }));
  const nonAnonymousPassages = useRecoilValue(numberOfPassagesNonAnonymousPerDatePerTeamSelector({ date: startOfToday() }));

  const persons = useRecoilValue(personsState);

  const history = useHistory();
  const location = useLocation();

  // for better UX when increase passage
  const [passages, setPassages] = useState(todaysReport?.passages || 0);
  const [addingPassage, setAddingPassage] = useState(false);
  useEffect(() => {
    setPassages(anonymousPassages + nonAnonymousPassages);
  }, [anonymousPassages, nonAnonymousPassages]);

  const [selectedPersons, setSelectedPersons] = useState(() => {
    const params = new URLSearchParams(location.search)?.get('persons')?.split(',');
    if (!params) return [];
    return params.map((id) => persons.find((p) => p._id === id));
  });

  const createReport = async () => {
    const existingReport = reports.find((r) => r.date === startOfToday() && r.team === currentTeam._id);
    if (!!existingReport) return;
    const res = await API.post({ path: '/report', body: prepareReportForEncryption({ team: currentTeam._id, date: startOfToday() }) });
    if (!res.ok) return;
    setReports((reports) => [res.decryptedData, ...reports].sort((r1, r2) => (dayjs(r1.date).isBefore(dayjs(r2.date), 'day') ? 1 : -1)));
  };

  useEffect(() => {
    if (!reportsLoading && !todaysReport && !!currentTeam?._id) createReport();
  }, [reportsLoading, currentTeam?._id]);

  const services = todaysReport?.services?.length ? JSON.parse(todaysReport?.services) : {};

  const onSelectPerson = (persons) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('persons', persons.map((p) => p._id).join(','));
    setSelectedPersons(persons);
    history.replace({ pathname: location.pathname, search: searchParams.toString() });
  };

  const updateReport = async (report) => {
    const res = await API.put({ path: `/report/${report._id}`, body: prepareReportForEncryption(report) });
    if (res.ok) {
      setReports((reports) =>
        reports.map((a) => {
          if (a._id === report._id) return res.decryptedData;
          return a;
        })
      );
    }
    return res;
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

  const incrementPassage = async (report, { newValue = null } = {}) => {
    await updateReport({
      ...report,
      passages: newValue,
    });
  };

  const onAddPassageForPersons = async () => {
    if (!selectedPersons.length) return;
    setAddingPassage(true);
    for (const person of selectedPersons) {
      const commentBody = {
        comment: 'Passage enregistré',
        item: person._id,
        person: person._id,
        type: 'person',
        user: user._id,
        team: currentTeam._id,
        organisation: organisation._id,
      };
      const response = await API.post({ path: '/comment', body: prepareCommentForEncryption(commentBody) });
      if (response.ok) {
        setComments((comments) => [response.decryptedData, ...comments]);
      }
    }
    setAddingPassage(false);
    setSelectedPersons([]);
  };

  const onGoToFile = () => history.push(`/person/${selectedPersons[0]?._id || ''}`);
  const onGoToPrevReport = () => history.push(lastReport?._id ? `/report/${lastReport._id}` : '/report');

  return (
    <>
      <SmallerHeaderWithBackButton
        titleStyle={{ fontWeight: '400' }}
        title={
          <span>
            Accueil du <b>{formatDateWithNameOfDay(now())}</b> de l'équipe {currentTeam?.nightSession ? 'de nuit ' : ''}
            <b>{currentTeam?.name || ''}</b>
          </span>
        }
      />
      <Row style={{ paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid #ddd' }}>
        <Col
          md={3}
          style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', flexDirection: 'column', borderRight: '1px solid #ddd' }}>
          <ButtonCustom
            onClick={onGoToPrevReport}
            color="link"
            title="Accéder au compte-rendu précédent"
            padding="12px 24px"
            disabled={!lastReport?._id}
          />
        </Col>
        <Col
          md={5}
          style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', flexDirection: 'column', borderRight: '1px solid #ddd' }}>
          <div style={{ flexShrink: 0, width: '100%' }}>
            <SelectAndCreatePerson
              value={selectedPersons}
              onChange={onSelectPerson}
              autoCreate
              inputId="person-select-and-create-reception"
              classNamePrefix="person-select-and-create-reception"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', flexShrink: 0, width: '100%' }}>
            <CreateAction noIcon title="Nouvelle Action" buttonOnly isMulti persons={selectedPersons.map((p) => p?._id).filter(Boolean)} />
            <ButtonCustom
              onClick={onAddPassageForPersons}
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
            countId="number-of-passages"
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
                await incrementPassage(todaysReport, { newValue: anonymousPassages + 1 });
                setAddingPassage(false);
              }}
              color="link"
              title="Ajouter un passage anonyme"
              padding="0px"
              id="add-anonymous-passage"
              disabled={addingPassage}
            />
            <ButtonCustom
              onClick={async () => {
                setAddingPassage(true);
                if (!anonymousPassages) return;
                setPassages((p) => p - 1);
                await incrementPassage(todaysReport, { newValue: anonymousPassages - 1 });
                setAddingPassage(false);
              }}
              color="link"
              title="Retirer un passage anonyme"
              padding="0px"
              disabled={addingPassage || !anonymousPassages}
            />
          </Card>
        </Col>
      </Row>
      <Row style={{ paddingBottom: 20, marginBottom: 20 }}>
        <Col md={8} style={{ paddingBottom: 20, marginBottom: 20, borderRight: '1px solid #ddd' }}>
          <SectionTitle>Actions</SectionTitle>
          <div style={{ margin: '15px' }}>
            <SelectStatus noTitle onChange={(event) => setStatus(event.target.value)} value={status} />
          </div>
          <ActionsCalendar actions={actionsByStatus} columns={['Heure', 'Nom', 'Personne suivie', 'Status']} />
        </Col>
        <Col md={4}>
          <SectionTitle style={{ marginRight: 20, width: 250, flexShrink: 0 }}>Services</SectionTitle>
          {organisation?.services?.map((service) => (
            <Incrementor key={service} service={service} count={services[service] || 0} onChange={(newCount) => onServiceUpdate(service, newCount)} />
          ))}
        </Col>
      </Row>
    </>
  );
};

const SectionTitle = styled.h4`
  color: ${theme.black};
  font-weight: bold;
  font-size: 20px;
  line-height: 32px;
`;

export default Reception;
