import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import { useHistory, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { SmallHeader } from '../../components/header';
import { formatDateWithNameOfDay, getIsDayWithinHoursOffsetOfPeriod, isToday, now, startOfToday } from '../../services/date';
import { currentTeamReportsSelector } from '../../recoil/selectors';
import SelectAndCreatePerson from './SelectAndCreatePerson';
import ButtonCustom from '../../components/ButtonCustom';
import ActionsCalendar from '../../components/ActionsCalendar';
import SelectStatus from '../../components/SelectStatus';
import { actionsState, TODO } from '../../recoil/actions';
import { currentTeamState, userState, organisationState } from '../../recoil/auth';
import { personsState } from '../../recoil/persons';
import { selector, selectorFamily, useRecoilValue, useSetRecoilState } from 'recoil';
import API from '../../services/api';
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

const actionsForCurrentTeamSelector = selector({
  key: 'actionsForCurrentTeamSelector',
  get: ({ get }) => {
    const actions = get(actionsState);
    const currentTeam = get(currentTeamState);
    return actions.filter((a) => (Array.isArray(a.teams) ? a.teams.includes(currentTeam._id) : a.team === currentTeam._id));
  },
});

const consultationsByAuthorizationSelector = selector({
  key: 'consultationsByAuthorizationSelector',
  get: ({ get }) => {
    const user = get(userState);
    const consultations = get(consultationsState);

    if (!user.healthcareProfessional) return [];
    return consultations.filter((consult) => !consult.onlyVisibleBy?.length || consult.onlyVisibleBy.includes(user._id));
  },
});

const actionsByStatusSelector = selectorFamily({
  key: 'actionsByStatusSelector',
  get:
    ({ status }) =>
    ({ get }) => {
      const actions = get(actionsForCurrentTeamSelector);
      return actions.filter((a) => a.status === status);
    },
});

const consultationsByStatusSelector = selectorFamily({
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
  const organisation = useRecoilValue(organisationState);
  const setPassages = useSetRecoilState(passagesState);
  const passages = useRecoilValue(todaysPassagesSelector);
  const [status, setStatus] = useState(TODO);
  const actionsByStatus = useRecoilValue(actionsByStatusSelector({ status }));
  const consultationsByStatus = useRecoilValue(consultationsByStatusSelector({ status }));
  const [services, setServices] = useState(null);
  const [todaysPassagesOpen, setTodaysPassagesOpen] = useState(false);
  const createReportAtDateIfNotExist = useCreateReportAtDateIfNotExist();

  const dataConsolidated = useMemo(
    () => [...actionsByStatus, ...consultationsByStatus].sort((a, b) => new Date(b.completedAt || b.dueAt) - new Date(a.completedAt || a.dueAt)),
    [actionsByStatus, consultationsByStatus]
  );

  const todaysReport = useRecoilValue(todaysReportSelector);
  const user = useRecoilValue(userState);

  const persons = useRecoilValue(personsState);

  const history = useHistory();
  const location = useLocation();
  const reportCreatedRef = useRef(!!todaysReport?._id);
  useEffect(() => {
    reportCreatedRef.current = !!todaysReport?._id;
  }, [todaysReport?._id]);

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
      capture(e, { extra: { selectedPersons: selectedPersons.map((p) => p._id), currentTeam }, user });
      toast.error("Désolé une erreur est survenue, l'équipe technique est prévenue");
    }
  };

  return (
    <>
      <SmallHeader
        title={
          <span data-test-id="reception-title">
            Accueil du <b>{formatDateWithNameOfDay(now())}</b> de l'équipe {currentTeam.nightSession ? 'de nuit ' : ''}
            <b>{currentTeam.name || ''}</b>
          </span>
        }
      />
      <div className="tw-mb-10 tw-mt-8 tw-flex tw-gap-4">
        <div className="tw-grow">
          <SelectAndCreatePerson
            value={selectedPersons}
            onChange={onSelectPerson}
            inputId="person-select-and-create-reception"
            classNamePrefix="person-select-and-create-reception"
          />
        </div>
        <ButtonCustom
          icon={plusIcon}
          onClick={() => {
            const searchParams = new URLSearchParams(history.location.search);
            searchParams.set('newAction', true);
            searchParams.set(
              'personIds',
              selectedPersons
                .map((p) => p?._id)
                .filter(Boolean)
                .join(',')
            );
            history.push(`?${searchParams.toString()}`);
          }}
          color="primary"
          title="Action"
          padding={'8px 14px'}
          style={{ height: 'fit-content' }}
        />

        {Boolean(user.healthcareProfessional) && (
          <>
            <ButtonCustom
              icon={plusIcon}
              onClick={() => {
                const searchParams = new URLSearchParams(history.location.search);
                searchParams.set('newConsultation', true);
                if (selectedPersons?.[0]._id) searchParams.set('personId', selectedPersons?.[0]._id);
                history.push(`?${searchParams.toString()}`);
              }}
              color="primary"
              disabled={!selectedPersons.length || selectedPersons.length > 1}
              title="Consultation"
              padding={'8px 14px'}
              style={{ height: 'fit-content' }}
            />
          </>
        )}
        {!!organisation.passagesEnabled && (
          <ButtonCustom
            onClick={onAddPassageForPersons}
            color="primary"
            style={{ height: 'fit-content' }}
            icon={plusIcon}
            title="Passage"
            padding={'8px 14px'}
            disabled={addingPassage || !selectedPersons.length}
          />
        )}
      </div>
      <div className="tw-mb-5 tw-flex tw-items-start tw-pb-5">
        <div className="tw-mr-4 tw-flex tw-basis-8/12 tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
          <div className="tw-mb-8 tw-flex tw-items-center tw-gap-4 tw-px-4 tw-pt-4">
            <div className="tw-grow tw-text-lg tw-font-bold tw-text-black">Agenda</div>
            <div className="tw-w-96">
              <SelectStatus onChange={(event) => setStatus(event.target.value)} value={status} />
            </div>
          </div>
          <ActionsCalendar
            actions={dataConsolidated}
            columns={['Heure', 'Nom', 'Personne suivie', 'Statut']}
            isNightSession={currentTeam.nightSession}
          />
        </div>
        <div className="tw-flex tw-basis-4/12 tw-flex-col">
          {!!organisation.passagesEnabled && (
            <div className="tw-mb-4 tw-flex tw-flex-col tw-items-center tw-gap-4 tw-rounded-lg tw-bg-gray-100 tw-py-8 tw-px-2 tw-text-center">
              <h5 id="passages-title">
                {passages.length} passage{passages.length > 1 ? 's' : ''}
              </h5>
              <ButtonCustom onClick={onAddAnonymousPassage} color="primary" icon={plusIcon} title="Passage anonyme" id="add-anonymous-passage" />
              {!!passages.length && reportCreatedRef.current && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <ButtonCustom onClick={() => setTodaysPassagesOpen(true)} color="link" title="Voir les passages d'aujourd'hui" padding="0px" />
                </div>
              )}
            </div>
          )}
          <div className="tw-mb-4 tw-flex tw-flex-col tw-items-center tw-gap-4 tw-rounded-lg tw-bg-gray-100 tw-py-8 tw-px-2 tw-text-center">
            <h5>Services</h5>
            <div className="tw-mt-4 tw-text-left">
              <ReceptionService
                services={services}
                onUpdateServices={setServices}
                team={currentTeam}
                report={todaysReport}
                dateString={startOfToday().format('YYYY-MM-DD')}
              />
            </div>
          </div>
        </div>
      </div>
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
        <Passage passage={passageToEdit} personId={passageToEdit?.person} onFinished={() => setPassageToEdit(null)} />
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

export default Reception;
