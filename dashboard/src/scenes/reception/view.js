import React, { useMemo, useState, useRef } from 'react';
import { Col, Modal, ModalBody, ModalHeader, Row } from 'reactstrap';
import styled from 'styled-components';
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
import { currentTeamState, userState } from '../../recoil/auth';
import { personsState } from '../../recoil/persons';
import { selector, selectorFamily, useRecoilValue, useSetRecoilState } from 'recoil';
import useApi from '../../services/api';
import dayjs from 'dayjs';
import { passagesState, preparePassageForEncryption } from '../../recoil/passages';
import useTitle from '../../services/useTitle';
import { capture } from '../../services/sentry';
import { consultationsState } from '../../recoil/consultations';
import plusIcon from '../../assets/icons/plus-icon.svg';
import PersonName from '../../components/PersonName';
import Table from '../../components/table';
import Passage from '../../components/Passage';
import UserName from '../../components/UserName';
import useCreateReportAtDateIfNotExist from '../../services/useCreateReportAtDateIfNotExist';
import ReceptionService from '../../components/ReceptionService';
import ConsultationModal from '../../components/ConsultationModal';

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
      .filter((p) => p.team === currentTeam?._id)
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

  const currentTeam = useRecoilValue(currentTeamState);

  const setPassages = useSetRecoilState(passagesState);
  const passages = useRecoilValue(todaysPassagesSelector);
  const [status, setStatus] = useState(TODO);
  const actionsByStatus = useRecoilValue(actionsByStatusSelector({ status }));
  const consultationsByStatus = useRecoilValue(consultationsByStatusSelector({ status }));
  const [todaysPassagesOpen, setTodaysPassagesOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const createReportAtDateIfNotExist = useCreateReportAtDateIfNotExist();

  const dataConsolidated = useMemo(
    () => [...actionsByStatus, ...consultationsByStatus].sort((a, b) => new Date(b.completedAt || b.dueAt) - new Date(a.completedAt || a.dueAt)),
    [actionsByStatus, consultationsByStatus]
  );

  const todaysReport = useRecoilValue(todaysReportSelector);
  const user = useRecoilValue(userState);
  const API = useApi();
  const persons = useRecoilValue(personsState);

  const history = useHistory();
  const location = useLocation();
  const reportCreatedRef = useRef(!!todaysReport?._id);

  const [selectedPersons, setSelectedPersons] = useState(() => {
    const params = new URLSearchParams(location.search)?.get('persons')?.split(',');
    if (!params) return [];
    return params.map((id) => persons.find((p) => p._id === id)).filter(Boolean);
  });
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

  const [showConsultationModal, setShowConsultationModal] = useState(false);

  // for better UX when increase passage
  const [addingPassage, setAddingPassage] = useState(false);

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
      if (!reportCreatedRef.current) {
        reportCreatedRef.current = true;
        await createReportAtDateIfNotExist(response.decryptedData.date);
      }
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
          if (!reportCreatedRef.current) {
            reportCreatedRef.current = true;
            await createReportAtDateIfNotExist(response.decryptedData.date);
          }
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

        {Boolean(user.healthcareProfessional) && (
          <>
            <ButtonCustom
              icon={plusIcon}
              onClick={() => setShowConsultationModal(true)}
              color="primary"
              disabled={!selectedPersons.length || selectedPersons.length > 1}
              title="Consultation"
              padding={'8px 14px'}
              style={{ height: 'fit-content' }}
            />
            {showConsultationModal && (
              <ConsultationModal
                onClose={() => {
                  setShowConsultationModal(false);
                }}
                person={selectedPersons?.[0]}
              />
            )}
          </>
        )}

        <ButtonCustom
          onClick={onAddPassageForPersons}
          color="primary"
          style={{ height: 'fit-content' }}
          icon={plusIcon}
          title="Passage"
          padding={'8px 14px'}
          disabled={addingPassage || !selectedPersons.length}
        />
      </PersonsWrapper>
      <Row style={{ paddingBottom: 20, marginBottom: 20 }}>
        <Col md={8}>
          <AgendaWrapper>
            <div className="agenda-title">Agenda</div>
            <div className="agenda-status">
              <SelectStatus onChange={(event) => setStatus(event.target.value)} value={status} />
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
                  onClick={() => history.push(`/report/${todaysReport?.date}?tab=passages`)}
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
              <ReceptionService
                parentComponent="reception"
                report={todaysReport}
                dateString={startOfToday().format('YYYY-MM-DD')}
                team={currentTeam}
              />
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
                  passage.person ? <PersonName item={passage} /> : <span style={{ opacity: 0.3, fontStyle: 'italic' }}>Anonyme</span>,
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
