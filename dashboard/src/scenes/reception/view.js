import React, { useEffect, useMemo, useState } from 'react';
import { Col, Row } from 'reactstrap';
import styled from 'styled-components';
import { useHistory, useLocation } from 'react-router-dom';
import { toastr } from 'react-redux-toastr';
import { SmallerHeaderWithBackButton } from '../../components/header';
import { formatDateWithNameOfDay, getIsDayWithinHoursOffsetOfPeriod, isToday, now, startOfToday } from '../../services/date';
import { currentTeamReportsSelector } from '../../recoil/selectors';
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
import { selector, selectorFamily, useRecoilValue, useSetRecoilState } from 'recoil';
import { collectionsToLoadState } from '../../components/Loader';
import useApi from '../../services/api';
import dayjs from 'dayjs';
import { passagesState, preparePassageForEncryption } from '../../recoil/passages';
import useTitle from '../../services/useTitle';
import { capture } from '../../services/sentry';
import { consultationsState } from '../../recoil/consultations';
import plusIcon from '../../assets/icons/plus-icon.svg';

export const actionsForCurrentTeamSelector = selector({
  key: 'actionsForCurrentTeamSelector',
  get: ({ get }) => {
    const actions = get(actionsState);
    const currentTeam = get(currentTeamState);
    return actions.filter((a) => a.team === currentTeam?._id);
  },
});

export const consultationsByAuthorizationSelector = selector({
  key: 'consultationsByAuthorizationSelector',
  get: ({ get }) => {
    const user = get(userState);
    const consultations = get(consultationsState);

    if (!user.healthcareProfessional) return [];
    return consultations.filter((consult) => !consult.onlyVisibleBy?.length || consult.onlyVisibleBy.includes(user._id));
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

export const consultationsByStatusSelector = selectorFamily({
  key: 'consultationsByStatusSelector',
  get:
    ({ status }) =>
      ({ get }) => {
        const consultations = get(consultationsByAuthorizationSelector);
        return consultations.filter((a) => a.status === status);
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

const todaysPassagesSelector = selector({
  key: 'todaysPassagesSelector',
  get: ({ get }) => {
    const passages = get(passagesState);
    const currentTeam = get(currentTeamState);
    return passages
      .filter((p) => p.team === currentTeam._id)
      .filter((p) =>
        getIsDayWithinHoursOffsetOfPeriod(
          p.date,
          {
            referenceStartDay: dayjs(),
            referenceEndDay: dayjs(),
          },
          currentTeam?.nightSession ? 12 : 0
        )
      );
  },
});

const Reception = () => {
  const organisation = useRecoilValue(organisationState);
  const currentTeam = useRecoilValue(currentTeamState);

  const setReports = useSetRecoilState(reportsState);
  const setPassages = useSetRecoilState(passagesState);
  const passages = useRecoilValue(todaysPassagesSelector);
  const [status, setStatus] = useState(TODO);
  const actionsByStatus = useRecoilValue(actionsByStatusSelector({ status }));
  const consultationsByStatus = useRecoilValue(consultationsByStatusSelector({ status }));

  const dataConsolidated = useMemo(
    () => [...actionsByStatus, ...consultationsByStatus].sort((a, b) => new Date(b.dueAt || b.date) - new Date(a.dueAt || a.date)),
    [actionsByStatus, consultationsByStatus]
  );

  const todaysReport = useRecoilValue(todaysReportSelector);
  const lastReport = useRecoilValue(lastReportSelector);
  const user = useRecoilValue(userState);
  const collectionsToLoad = useRecoilValue(collectionsToLoadState);
  const reportsLoading = useMemo(() => collectionsToLoad.includes('report'), [collectionsToLoad]);
  const API = useApi();
  useTitle('Accueil');
  const persons = useRecoilValue(personsState);

  const history = useHistory();
  const location = useLocation();

  // for better UX when increase passage
  const [addingPassage, setAddingPassage] = useState(false);

  const [selectedPersons, setSelectedPersons] = useState(() => {
    const params = new URLSearchParams(location.search)?.get('persons')?.split(',');
    if (!params) return [];
    return params.map((id) => persons.find((p) => p._id === id)).filter(Boolean);
  });

  const createReport = async () => {
    if (!!todaysReport) return;
    const res = await API.post({
      path: '/report',
      body: prepareReportForEncryption({ team: currentTeam._id, date: startOfToday().format('YYYY-MM-DD') }),
    });
    if (!res.ok) return;
    setReports((reports) => [res.decryptedData, ...reports].sort((r1, r2) => r2.date.localeCompare(r1.date)));
  };

  useEffect(() => {
    if (!reportsLoading && !todaysReport && !!currentTeam?._id) createReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportsLoading, currentTeam?._id]);

  const services = todaysReport?.services?.length ? JSON.parse(todaysReport?.services) : {};

  const onSelectPerson = (persons) => {
    persons = persons?.filter(Boolean) || [];
    const searchParams = new URLSearchParams(location.search);
    searchParams.set(
      'persons',
      persons
        .map((p) => p?._id)
        .filter(Boolean)
        .join(',')
    );
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

  const onAddAnonymousPassage = async () => {
    const optimisticId = Date.now();
    const newPassage = {
      user: user._id,
      team: currentTeam._id,
      date: new Date(),
      optimisticId,
    };
    // optimistic UI
    setPassages((passages) => [newPassage, ...passages]);
    const response = await API.post({ path: '/passage', body: preparePassageForEncryption(newPassage) });
    if (response.ok) {
      setPassages((passages) => [response.decryptedData, ...passages.filter((p) => p.optimisticId !== optimisticId)]);
    }
  };

  const onAddPassageForPersons = async () => {
    try {
      if (!selectedPersons.length) return;
      setAddingPassage(true);
      const newPassages = [];
      for (const [index, person] of Object.entries(selectedPersons)) {
        newPassages.push({
          person: person._id,
          user: user._id,
          team: currentTeam._id,
          date: new Date(),
          optimisticId: index,
        });
      }
      // optimistic UI
      setPassages((passages) => [...newPassages, ...passages]);
      for (const [index, passage] of Object.entries(newPassages)) {
        const response = await API.post({ path: '/passage', body: preparePassageForEncryption(passage) });
        if (response.ok) {
          setPassages((passages) => [response.decryptedData, ...passages.filter((p) => p.optimisticId !== index)]);
        }
      }
      setAddingPassage(false);
    } catch (e) {
      capture(e, { extra: { selectedPersons, currentTeam }, user });
      toastr.error("Désolé une erreur est survenue, l'équipe technique est prévenue");
    }
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
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <div style={{ flexGrow: "1" }}>
          <SelectAndCreatePerson
            value={selectedPersons}
            onChange={onSelectPerson}
            autoCreate
            inputId="person-select-and-create-reception"
            classNamePrefix="person-select-and-create-reception"
          />
        </div>
        <div>
          <CreateAction smallButton noIcon title="Nouvelle Action" buttonOnly isMulti persons={selectedPersons.map((p) => p?._id).filter(Boolean)} />
        </div>
        <div>
          <ButtonCustom
            onClick={onAddPassageForPersons}
            color="primary"
            icon={plusIcon}
            title="Passage"
            disabled={addingPassage || !selectedPersons.length}
          />
        </div>
      </div>
      <Row style={{ paddingBottom: 20, marginBottom: 20 }}>
        <Col md={8} style={{ paddingBottom: 20, marginBottom: 20, borderRight: '1px solid #ddd' }}>
          <SectionTitle>Agenda</SectionTitle>
          <div style={{ margin: '15px' }}>
            <SelectStatus noTitle onChange={(event) => setStatus(event.target.value)} value={status} />
          </div>
          <ActionsCalendar actions={dataConsolidated} columns={['Heure', 'Nom', 'Personne suivie', 'Statut']} />
        </Col>
        <Col md={4}>
          <div>
            <div style={{ textAlign: "center", backgroundColor: "#f8f8f8", borderRadius: "5px", padding: "1rem 0.5rem", marginBottom: "1rem" }}>
              <h5 style={{ color: "#555" }}>{passages.length} passage{passages.length > 1 ? 's' : ''}</h5>
              <ButtonCustom
                onClick={onAddAnonymousPassage}
                color="primary"
                icon={plusIcon}
                title="Passage anonyme"
                id="add-anonymous-passage"
                disabled={addingPassage}
              />
            </div>
            <Card title="Nombre de passages" count={passages.length} countId="number-of-passages" unit={`passage${passages.length > 1 ? 's' : ''}`}>
              <ButtonCustom
                onClick={onAddAnonymousPassage}
                color="link"
                title="Ajouter un passage anonyme"
                padding="0px"
                id="add-anonymous-passage"
                disabled={addingPassage}
              />
              <ButtonCustom
                onClick={() => history.push(`/report/${todaysReport._id}?tab=5`)}
                color="link"
                title="Modifier les passages"
                padding="0px"
              />
            </Card>
            <SectionTitle style={{ marginRight: 20, width: 250, flexShrink: 0 }}>Services</SectionTitle>
            {organisation?.services?.map((service) => (
              <Incrementor key={service} service={service} count={services[service] || 0} onChange={(newCount) => onServiceUpdate(service, newCount)} />
            ))}
          </div>
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
