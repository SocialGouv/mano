import React, { useMemo, useState, useEffect } from 'react';
import { Col, Modal, ModalBody, ModalHeader, Row } from 'reactstrap';
import styled from 'styled-components';
import { useDebounce } from 'react-use';
import { useHistory, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { SmallHeader } from '../../components/header';
import { formatDateWithNameOfDay, getIsDayWithinHoursOffsetOfPeriod, isToday, now, startOfToday } from '../../services/date';
import { currentTeamReportsSelector } from '../../recoil/selectors';
import { theme } from '../../config';
import CreateActionModal from '../../components/CreateActionModal';
import SelectAndCreatePerson from './SelectAndCreatePerson';
import ButtonCustom from '../../components/ButtonCustom';
import ActionsCalendar from '../../components/ActionsCalendar';
import SelectStatus from '../../components/SelectStatus';
import { actionsState, TODO } from '../../recoil/actions';
import { currentTeamState, organisationState, userState } from '../../recoil/auth';
import { personsState } from '../../recoil/persons';
import { prepareReportForEncryption, reportsState } from '../../recoil/reports';
import { selector, selectorFamily, useRecoilValue, useSetRecoilState } from 'recoil';
import useApi from '../../services/api';
import dayjs from 'dayjs';
import { passagesState, preparePassageForEncryption } from '../../recoil/passages';
import useTitle from '../../services/useTitle';
import { capture } from '../../services/sentry';
import { consultationsState } from '../../recoil/consultations';
import plusIcon from '../../assets/icons/plus-icon.svg';
import IncrementorSmall from '../../components/IncrementorSmall';
import PersonName from '../../components/PersonName';
import Table from '../../components/table';
import Passage from '../../components/Passage';
import UserName from '../../components/UserName';
import useCreateReportAtDateIfNotExist from '../../services/useCreateReportAtDateIfNotExist';

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
  useTitle('Accueil');

  const organisation = useRecoilValue(organisationState);
  const currentTeam = useRecoilValue(currentTeamState);

  const setReports = useSetRecoilState(reportsState);
  const setPassages = useSetRecoilState(passagesState);
  const passages = useRecoilValue(todaysPassagesSelector);
  const [status, setStatus] = useState(TODO);
  const actionsByStatus = useRecoilValue(actionsByStatusSelector({ status }));
  const consultationsByStatus = useRecoilValue(consultationsByStatusSelector({ status }));
  const [todaysPassagesOpen, setTodaysPassagesOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const createReportAtDateIfNotExist = useCreateReportAtDateIfNotExist();

  const dataConsolidated = useMemo(
    () => [...actionsByStatus, ...consultationsByStatus].sort((a, b) => new Date(b.dueAt || b.date) - new Date(a.dueAt || a.date)),
    [actionsByStatus, consultationsByStatus]
  );

  const todaysReport = useRecoilValue(todaysReportSelector);
  const user = useRecoilValue(userState);
  const API = useApi();
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

  const [services, setServices] = useState(() => (todaysReport?.services?.length ? JSON.parse(todaysReport?.services) : {}));
  useEffect(() => {
    // when we change the team, we change the report and we reset the services
    setServices(todaysReport?.services?.length ? JSON.parse(todaysReport?.services) : {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todaysReport?._id]);

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

  useDebounce(
    async () => {
      /*
      The target of this complicated process is to not create empty reports automatically
      like we used to do before, so that the page /report is not cluttered with empty reports.
      The solution is to create a report only if there is at least one thing going one, including a service.
      */

      // we need to prevent create report on first mount with empty services
      if (!Object.keys(services).length) return;
      // we need to prevent update on first mount for nothing
      if (JSON.stringify(services) === todaysReport?.services) return;
      const reportUpdate = {
        team: currentTeam._id,
        date: startOfToday().format('YYYY-MM-DD'),
        ...(todaysReport || {}),
        services: JSON.stringify(services),
      };
      const isNew = !todaysReport?._id;
      if (isNew) {
        const res = await API.post({ path: '/report', body: prepareReportForEncryption(reportUpdate) });
        if (res.ok) {
          setReports((reports) => [...reports, res.decryptedData]);
        }
      } else {
        const res = await API.put({ path: `/report/${reportUpdate._id}`, body: prepareReportForEncryption(reportUpdate) });
        if (res.ok) {
          setReports((reports) =>
            reports.map((a) => {
              if (a._id === reportUpdate._id) return res.decryptedData;
              return a;
            })
          );
        }
      }
    },
    process.env.REACT_APP_TEST === 'true' ? 0 : 900,
    [services]
  );

  const onServiceUpdate = async (service, newCount) => {
    const newServices = {
      ...services,
      [service]: newCount,
    };
    setServices(newServices);
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
      createReportAtDateIfNotExist(response.decryptedData.date);
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
          createReportAtDateIfNotExist(response.decryptedData.date);
        }
      }
      setAddingPassage(false);
    } catch (e) {
      capture(e, { extra: { selectedPersons, currentTeam }, user });
      toast.error("Désolé une erreur est survenue, l'équipe technique est prévenue");
    }
  };

  return (
    <>
      <SmallHeader
        title={
          <span data-test-id="reception-title">
            Accueil du <b>{formatDateWithNameOfDay(now())}</b> de l'équipe {currentTeam?.nightSession ? 'de nuit ' : ''}
            <b>{currentTeam?.name || ''}</b>
          </span>
        }
      />
      <PersonsWrapper>
        <div style={{ flexGrow: '1' }}>
          <SelectAndCreatePerson
            value={selectedPersons}
            onChange={onSelectPerson}
            inputId="person-select-and-create-reception"
            classNamePrefix="person-select-and-create-reception"
          />
        </div>
        <ButtonCustom
          icon={plusIcon}
          onClick={() => setModalOpen(true)}
          color="primary"
          title="Action"
          padding={'8px 14px'}
          style={{ height: 'fit-content' }}
        />
        <CreateActionModal
          open={modalOpen}
          setOpen={(value) => setModalOpen(value)}
          smallButton
          icon={plusIcon}
          title="Action"
          buttonOnly
          isMulti
          persons={selectedPersons.map((p) => p?._id).filter(Boolean)}
        />

        <ButtonCustom
          onClick={onAddPassageForPersons}
          color="primary"
          style={{ height: 'fit-content' }}
          icon={plusIcon}
          title="Passage"
          disabled={addingPassage || !selectedPersons.length}
        />
      </PersonsWrapper>
      <Row style={{ paddingBottom: 20, marginBottom: 20 }}>
        <Col md={8}>
          <AgendaWrapper>
            <div className="agenda-title">Agenda</div>
            <div className="agenda-status">
              <SelectStatus noTitle onChange={(event) => setStatus(event.target.value)} value={status} />
            </div>
          </AgendaWrapper>
          <ActionsCalendar actions={dataConsolidated} columns={['Heure', 'Nom', 'Personne suivie', 'Statut']} />
        </Col>
        <Col md={4}>
          <PassagesWrapper>
            <h5 id="passages-title">
              {passages.length} passage{passages.length > 1 ? 's' : ''}
            </h5>
            <ButtonCustom onClick={onAddAnonymousPassage} color="primary" icon={plusIcon} title="Passage anonyme" id="add-anonymous-passage" />
            {!!todaysReport?._id && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <ButtonCustom
                  onClick={() => history.push(`/report/${todaysReport?.date}?tab=6`)}
                  color="link"
                  title="Modifier les passages"
                  padding="0px"
                />
                <ButtonCustom onClick={() => setTodaysPassagesOpen(true)} color="link" title="Voir les passages d'aujourd'hui" padding="0px" />
              </div>
            )}
          </PassagesWrapper>
          <ServicesWrapper>
            <h5 className="services-title">Services</h5>
            <div className="services-incrementators">
              {organisation?.services?.map((service) => (
                <IncrementorSmall
                  dataTestId={`${currentTeam?.name}-reception-${service}-${services[service] || 0}`}
                  key={service}
                  service={service}
                  count={services[service] || 0}
                  onChange={(newCount) => onServiceUpdate(service, newCount)}
                />
              ))}
            </div>
          </ServicesWrapper>
        </Col>
      </Row>
      <PassagesToday isOpen={todaysPassagesOpen} setOpen={setTodaysPassagesOpen} passages={passages} />
    </>
  );
};

const PassagesToday = ({ passages, isOpen, setOpen }) => {
  const [passageToEdit, setPassageToEdit] = useState(null);

  return (
    <Modal isOpen={isOpen} toggle={() => setOpen(false)} size="lg" backdrop="static">
      <ModalHeader toggle={() => setOpen(false)}>Passages du {formatDateWithNameOfDay(now())}</ModalHeader>
      <ModalBody>
        <Passage passage={passageToEdit} onFinished={() => setPassageToEdit(null)} />
        {!!passages.length && (
          <Table
            className="Table"
            onRowClick={setPassageToEdit}
            data={passages}
            rowKey={'_id'}
            columns={[
              {
                title: 'Heure',
                dataKey: 'date',
                render: (passage) => {
                  const time = dayjs(passage.date).format('HH:mm');
                  // anonymous comment migrated from `report.passages`
                  // have no time
                  // have no user assigned either
                  if (time === '00:00' && !passage.user) return null;
                  return <span>{time}</span>;
                },
              },
              {
                title: 'Personne suivie',
                dataKey: 'person',
                render: (passage) =>
                  passage.person ? (
                    <PersonName item={passage} redirectToTab="passages" />
                  ) : (
                    <span style={{ opacity: 0.3, fontStyle: 'italic' }}>Anonyme</span>
                  ),
              },
              {
                title: 'Enregistré par',
                dataKey: 'user',
                render: (passage) => (passage.user ? <UserName id={passage.user} /> : null),
              },
              { title: 'Commentaire', dataKey: 'comment' },
            ]}
          />
        )}
      </ModalBody>
    </Modal>
  );
};

const PersonsWrapper = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 5rem;
  margin-top: 2rem;
`;
const AgendaWrapper = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
  .agenda-status {
    width: 150px;
  }
  .agenda-title {
    color: ${theme.black};
    font-weight: bold;
    font-size: 20px;
    flex-grow: 1;
  }
`;
const PassagesWrapper = styled.div`
  text-align: center;
  background-color: #f8f8f8;
  border-radius: 5px;
  padding: 2rem 0.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 1rem;
  #passages-title {
    color: #555;
  }
`;
const ServicesWrapper = styled.div`
  text-align: center;
  background-color: #f8f8f8;
  border-radius: 5px;
  padding: 2rem 1rem;
  margin-bottom: 1rem;
  gap: 1rem;
  .services-title {
    color: #555;
  }
  .services-incrementators {
    text-align: left;
    margin-top: 1rem;
  }
`;

export default Reception;
