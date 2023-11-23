import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Col, Row, FormGroup, Label, Spinner } from 'reactstrap';
import styled from 'styled-components';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Formik } from 'formik';
import { addOneDay, dayjsInstance, formatDateWithFullMonth, formatDateWithNameOfDay, formatTime } from '../../services/date';
import DateBloc from '../../components/DateBloc';
import { HeaderStyled, Title as HeaderTitle } from '../../components/header';
import BackButton, { BackButtonWrapper } from '../../components/backButton';
import Box from '../../components/Box';
import ActionStatus from '../../components/ActionStatus';
import Table from '../../components/table';
import Observation from '../territory-observations/view';
import dayjs from 'dayjs';
import { CANCEL, DONE, TODO } from '../../recoil/actions';
import { capture } from '../../services/sentry';
import UserName from '../../components/UserName';
import ButtonCustom from '../../components/ButtonCustom';
import Card from '../../components/Card';
import CreateObservation from '../../components/CreateObservation';
import SelectAndCreateCollaboration from './SelectAndCreateCollaboration';
import ActionOrConsultationName from '../../components/ActionOrConsultationName';
import ReportDescriptionModale from '../../components/ReportDescriptionModale';
import { currentTeamState, organisationState, teamsState, userState } from '../../recoil/auth';
import { prepareReportForEncryption, reportsState } from '../../recoil/reports';
import { territoriesState } from '../../recoil/territory';
import PersonName from '../../components/PersonName';
import { selectorFamily, useRecoilValue, useSetRecoilState } from 'recoil';
import IncrementorSmall from '../../components/IncrementorSmall';
import API from '../../services/api';
import { passagesState } from '../../recoil/passages';
import Passage from '../../components/Passage';
import ExclamationMarkButton from '../../components/tailwind/ExclamationMarkButton';
import useTitle from '../../services/useTitle';
import { theme } from '../../config';
import ConsultationButton from '../../components/ConsultationButton';
import { disableConsultationRow } from '../../recoil/consultations';
import agendaIcon from '../../assets/icons/agenda-icon.svg';
import { lastLoadState, mergeItems, useDataLoader } from '../../components/DataLoader';
import Rencontre from '../../components/Rencontre';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import TagTeam from '../../components/TagTeam';
import ReceptionService from '../../components/ReceptionService';
import { useLocalStorage } from '../../services/useLocalStorage';
import { arrayOfitemsGroupedByPersonSelector, onlyFilledObservationsTerritories } from '../../recoil/selectors';
import DescriptionIcon from '../../components/DescriptionIcon';
import ActionsSortableList from '../../components/ActionsSortableList';
import { ActionsOrConsultations } from './components/ActionsReport';

const getPeriodTitle = (date, nightSession) => {
  if (!nightSession) return `Journée du ${formatDateWithNameOfDay(date)}`;
  const nextDay = addOneDay(date);
  return (
    <>
      <p className="tw-m-0 tw-text-center">
        Nuit du {formatDateWithNameOfDay(date)} au {formatDateWithNameOfDay(nextDay)}
      </p>
      <p className="tw-m-0 tw-text-center tw-text-xs tw-opacity-50">
        On affiche les actions faites/à faire entre midi de ce jour et 11h59 du jour suivant
      </p>
    </>
  );
};

const itemsForReportsSelector = selectorFamily({
  key: 'itemsForReportsSelector',
  get:
    ({ period, selectedTeamsObject, viewAllOrganisationData, allSelectedTeamsAreNightSession }) =>
    ({ get }) => {
      const filterItemByTeam = (item, key) => {
        if (viewAllOrganisationData) return true;
        if (Array.isArray(item[key])) {
          for (const team of item[key]) {
            if (selectedTeamsObject[team]) return true;
          }
        }
        return !!selectedTeamsObject[item[key]];
      };

      const allPersons = get(arrayOfitemsGroupedByPersonSelector);
      const allObservations = get(onlyFilledObservationsTerritories);
      const allPassages = get(passagesState);

      const offsetHours = allSelectedTeamsAreNightSession ? 12 : 0;
      // if no date chosen, it's today

      const isoStartDate = dayjs(period.startDate ?? undefined)
        .startOf('day')
        .add(offsetHours, 'hour')
        .toISOString();
      const isoEndDate = dayjs(period.endDate ?? undefined)
        .startOf('day')
        .add(1, 'day')
        .add(offsetHours, 'hour')
        .toISOString();

      const personsCreated = {};
      const personsUpdated = {};
      const actions = {};
      const consultations = {};
      const comments = {};
      const commentsMedical = {};
      const passages = {};
      const rencontres = {};
      const observations = {};

      for (let person of allPersons) {
        // get persons for reports for period
        const createdDate = person.followedSince || person.createdAt;

        if (filterItemByTeam(person, 'assignedTeams')) {
          if (createdDate >= isoStartDate && createdDate < isoEndDate) {
            personsCreated[person._id] = person;
            personsUpdated[person._id] = person;
          }
          for (const date of person.interactions) {
            if (date < isoStartDate) continue;
            if (date >= isoEndDate) continue;
            personsUpdated[person._id] = person;
            break;
          }
        }
        // get actions for stats for period
        for (const action of person.actions || []) {
          if (!filterItemByTeam(action, 'teams')) continue;
          if (action.completedAt >= isoStartDate && action.completedAt < isoEndDate) {
            actions[action._id] = action;
            continue;
          }
          if (action.status !== TODO) continue;
          if (action.dueAt >= isoStartDate && action.dueAt < isoEndDate) {
            actions[action._id] = action;
          }
        }
        for (const consultation of person.consultations || []) {
          if (!filterItemByTeam(consultation, 'teams')) continue;
          if (consultation.completedAt >= isoStartDate && consultation.completedAt < isoEndDate) {
            consultations[consultation._id] = consultation;
            continue;
          }
          if (consultation.status !== TODO) continue;
          if (consultation.dueAt >= isoStartDate && consultation.dueAt < isoEndDate) {
            consultations[consultation._id] = consultation;
          }
        }
        for (const rencontre of person.rencontres || []) {
          if (!filterItemByTeam(rencontre, 'team')) continue;
          const date = rencontre.date;
          if (date < isoStartDate) continue;
          if (date >= isoEndDate) continue;
          rencontres[rencontre._id] = rencontre;
        }
        for (const commentMedical of person.commentsMedical || []) {
          if (!filterItemByTeam(commentMedical, 'team')) continue;
          const date = commentMedical.date;
          if (date < isoStartDate) continue;
          if (date >= isoEndDate) continue;
          commentsMedical[commentMedical._id] = commentMedical;
        }
        for (const comment of person.comments || []) {
          if (!filterItemByTeam(comment, 'team')) continue;
          const date = comment.date;
          if (date < isoStartDate) continue;
          if (date >= isoEndDate) continue;
          comments[comment._id] = comment;
        }
      }

      for (const passage of allPassages) {
        if (!filterItemByTeam(passage, 'team')) continue;
        const date = passage.date;
        if (date < isoStartDate) continue;
        if (date >= isoEndDate) continue;
        passages[passage._id] = passage;
      }

      for (const observation of allObservations) {
        if (!filterItemByTeam(observation, 'team')) continue;
        const date = observation.observedAt;
        if (date < isoStartDate) continue;
        if (date >= isoEndDate) continue;
        observations[observation._id] = observation;
      }

      return {
        personsCreated: Object.values(personsCreated),
        personsUpdated: Object.values(personsUpdated),
        actions: Object.values(actions),
        consultations: Object.values(consultations),
        comments: Object.values(comments),
        commentsMedical: Object.values(commentsMedical),
        passages: Object.values(passages),
        rencontres: Object.values(rencontres),
        observations: Object.values(observations),
      };
    },
});

const View = () => {
  const { dateString } = useParams();
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const teams = useRecoilValue(teamsState);
  const [viewAllOrganisationData, setViewAllOrganisationData] = useLocalStorage('reports-allOrg', teams.length === 1);
  const [selectedTeamIds, setSelectedTeamIds] = useLocalStorage('reports-teams', [currentTeam._id]);

  const selectedTeams = useMemo(
    () => (viewAllOrganisationData ? teams : teams.filter((team) => selectedTeamIds.includes(team._id))),
    [selectedTeamIds, teams, viewAllOrganisationData]
  );
  const selectedTeamsObject = useMemo(() => {
    const teamsObject = {};
    for (const team of selectedTeams) {
      teamsObject[team._id] = team;
    }
    return teamsObject;
  }, [selectedTeams]);

  const allSelectedTeamsAreNightSession = useMemo(() => {
    if (!selectedTeams.length) return false;
    for (const team of selectedTeams) {
      if (!team.nightSession) return false;
    }
    return true;
  }, [selectedTeams]);

  const isReadOnly = selectedTeams.length > 1;

  const isSingleTeam = selectedTeams.length === 1;

  const allReports = useRecoilValue(reportsState);
  const reportsFromDay = useMemo(() => allReports.filter((report) => report.date === dateString), [dateString, allReports]);
  const setReports = useSetRecoilState(reportsState);
  const history = useHistory();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [period] = useLocalStorage('period', { startDate: null, endDate: null });

  const { personsCreated, personsUpdated, actions, consultations, comments, commentsMedical, passages, rencontres, observations } = useRecoilValue(
    itemsForReportsSelector({
      period,
      selectedTeamsObject,
      viewAllOrganisationData,
      allSelectedTeamsAreNightSession,
    })
  );

  const selectedTeamsReports = useMemo(() => {
    return selectedTeams.map((team) => {
      const report = reportsFromDay.find((rep) => rep.team === team._id);
      if (!!report) return report;
      return { team: team._id, date: dateString };
    });
  }, [selectedTeams, reportsFromDay, dateString]);

  const singleReport = useMemo(() => {
    if (!isSingleTeam) return null;
    return selectedTeamsReports[0];
  }, [isSingleTeam, selectedTeamsReports]);

  const [personSortBy, setPersonSortBy] = useLocalStorage('person-sortBy', 'name');
  const [personSortOrder, setPersonSortOrder] = useLocalStorage('person-sortOrder', 'ASC');

  useTitle(`${dayjs(dateString).format('DD-MM-YYYY')} - Compte rendu`);

  const onPreviousReportRequest = () => {
    const prevDate = dayjs(dateString).subtract(1, 'day').format('YYYY-MM-DD');
    history.push(`/report/${prevDate}?${searchParams.toString()}`);
  };

  const onNextReportRequest = () => {
    const nextDate = dayjs(dateString).add(1, 'day').format('YYYY-MM-DD');
    history.push(`/report/${nextDate}?${searchParams.toString()}`);
  };

  const deleteData = async () => {
    if (!singleReport) return;
    const confirm = window.confirm('Êtes-vous sûr ?');
    if (confirm) {
      const res = await API.delete({ path: `/report/${singleReport._id}` });
      if (res.ok) {
        setReports((reports) => reports.filter((p) => p._id !== singleReport._id));
        toast.success('Suppression réussie');
        history.goBack();
      }
    }
  };

  useEffect(() => {
    // for print use only
    document.title = `Compte rendu Mano - Organisation ${organisation.name} - ${dayjs(dateString).format('DD-MM-YYYY')} - imprimé par ${user.name}`;
    return () => {
      document.title = 'Mano - Admin';
    };
  });

  return (
    <>
      <div className="noprint tw-h-[calc(100% + 4rem)] -tw-mx-12 tw-mb-12 tw-mt-4 tw-flex tw-flex-col tw-overflow-hidden">
        <HeaderStyled className="!tw-p-0">
          <div className="tw-w-full tw-min-w-full">
            <div className="tw-flex tw-w-full tw-items-center tw-justify-between">
              <div className="tw-flex">
                <BackButton />
                <BackButtonWrapper caption="Imprimer" onClick={window.print} />
                {!['restricted-access'].includes(user.role) && <BackButtonWrapper disabled={isReadOnly} caption="Supprimer" onClick={deleteData} />}
              </div>
              <p className="tw-m-0">{getPeriodTitle(dateString, allSelectedTeamsAreNightSession)}</p>
              <div className="tw-flex">
                <ButtonCustom color="link" className="noprint" title="Précédent" onClick={onPreviousReportRequest} />
                <ButtonCustom
                  color="link"
                  className="noprint"
                  title="Suivant"
                  disabled={dateString === dayjs().format('YYYY-MM-DD')}
                  onClick={onNextReportRequest}
                />
              </div>
            </div>
            <div className="tw-flex tw-grow tw-py-0 tw-px-8 tw-font-normal">
              <HeaderTitle className="tw-shrink-0 tw-font-normal">
                <span>
                  Compte rendu{' '}
                  {viewAllOrganisationData ? <>de toutes les équipes</> : <>{selectedTeamIds.length > 1 ? 'des équipes' : "de l'équipe"}</>}
                </span>
              </HeaderTitle>
              <div className="tw-ml-4">
                <SelectTeamMultiple
                  inputId="report-select-teams"
                  classNamePrefix="report-select-teams"
                  onChange={(teamIds) => {
                    setSelectedTeamIds(teamIds);
                  }}
                  value={selectedTeamIds}
                  key={selectedTeamIds}
                  colored
                  isDisabled={viewAllOrganisationData}
                />
                {teams.length > 1 && (
                  <label htmlFor="viewAllOrganisationData" className="tw-flex tw-items-center tw-text-sm">
                    <input
                      id="viewAllOrganisationData"
                      type="checkbox"
                      className="tw-mr-2.5"
                      onChange={() => setViewAllOrganisationData(!viewAllOrganisationData)}
                      checked={viewAllOrganisationData}
                    />
                    Comptes rendus de toutes les équipes
                  </label>
                )}
              </div>
            </div>
            {selectedTeams.length > 1 && selectedTeams.filter((t) => t.nightSession).length > 0 && (
              <details className="tw-py-0 tw-px-8 tw-font-normal">
                <summary className="tw-text-xs">
                  Certaines équipes travaillent de nuit 🌒, <u>cliquez ici</u> pour savoir la période concernée par chacune
                </summary>
                {selectedTeams.map((team) => (
                  <p key={team._id} className="tw-ml-5 tw-mb-0 tw-text-xs">
                    <b>
                      {team.nightSession ? '🌒' : '☀️'} {team?.name || ''}
                    </b>{' '}
                    - {getPeriodTitle(dateString, team?.nightSession)}
                  </p>
                ))}
              </details>
            )}
          </div>
        </HeaderStyled>
        <div
          className={[
            'noprint tw-mt-4 tw-h-full tw-flex-1 tw-overflow-hidden tw-border-t tw-border-gray-200',
            viewAllOrganisationData || selectedTeamIds.length ? 'tw-flex' : 'tw-hidden',
          ].join(' ')}>
          <div className="tw-flex tw-flex-1 tw-overflow-hidden">
            <div className="tw-flex tw-h-full tw-w-full tw-flex-1 tw-overflow-auto tw-bg-white tw-px-6 tw-pt-4 tw-pb-0">
              <div className="noprint tw-grid tw-h-full tw-min-h-1/2 tw-w-full tw-grid-cols-12 tw-gap-4">
                <div className="tw-col-span-5 tw-h-0 tw-min-h-full tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
                  <ActionsOrConsultations actions={actions} consultations={consultations} />
                </div>
                <div className="tw-col-span-4 tw-h-0 tw-min-h-full tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
                  {/* <ActionsOrConsultations person={person} /> */}
                </div>

                <div className="tw-col-span-3 tw-h-0 tw-min-h-full tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
                  {/* {['restricted-access'].includes(user.role) ? <PassagesRencontres person={person} /> : <Comments person={person} />} */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const ErrorOnGetServices = () => (
  <div>
    <b>Impossible de récupérer les services agrégés pour les rapports sélectionnés.</b>
    <p>Veuillez contacter l'équipe de mano pour signaler ce problème, en rappelant la date et l'organisation concernées.</p>
  </div>
);

const Reception = ({ reports, selectedTeamsObject, dateString }) => {
  const organisation = useRecoilValue(organisationState);
  const [show, setShow] = useState([]);
  // `service` structure is: { `team-id-xxx`: { `service-name`: 1, ... }, ... }
  const [services, setServices] = useState({});

  useEffect(() => {
    setShow([reports.length === 1 ? reports[0].team : 'all']);
  }, [reports]);

  // Sums of services for all reports, to display the total of services for all teams.
  const serviceSumsForAllReports = useMemo(() => {
    const servicesValues = Object.values(services);
    if (!servicesValues.length) return null;
    return servicesValues.reduce((acc, curr) => {
      return Object.entries(curr).reduce((innerAcc, [key, value]) => {
        innerAcc[key] = (innerAcc[key] || 0) + value;
        return innerAcc;
      }, acc);
    }, {});
  }, [services]);

  useEffect(() => {
    window.sessionStorage.setItem(`services-general-${dateString}`, show);
  }, [show, dateString]);

  useEffect(
    // Fetch services for all teams.
    // `services` value contains an object with `team` as key, and an object with `service` as key and `count` as value.
    // { `team-id-xxx`: { `service-name`: 1, ... }, ... }
    function initServices() {
      // Init services for a team. We need to fetch services from legacy report and database and merge them.
      async function getServicesForTeam(team, report) {
        if (!dateString || !team || dateString === 'undefined') {
          return capture('Missing params for initServices in report', { extra: { dateString, team, report } });
        }
        console.log('INIT SERVICE FROM REPORT VIEW');
        const res = await API.get({ path: `/service/team/${team}/date/${dateString}` });
        if (!res.ok) return toast.error(<ErrorOnGetServices />);
        const servicesFromLegacyReport = report?.services?.length ? JSON.parse(report?.services) : {};
        const servicesFromDatabase = res.data.reduce((acc, service) => {
          acc[service.service] = (servicesFromLegacyReport[service.service] || 0) + service.count;
          return acc;
        }, {});
        const mergedServices = Object.fromEntries(
          // We need a sum of all keys from legacy and database services.
          (organisation.services || []).map((key) => [key, (servicesFromLegacyReport[key] || 0) + (servicesFromDatabase[key] || 0)])
        );
        return { [team]: mergedServices };
      }
      // Apply getServicesForTeam for all teams.
      Promise.all(reports.map((r) => getServicesForTeam(r.team, r))).then((results) => {
        setServices(results.reduce((acc, curr) => ({ ...acc, ...curr }), {}));
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dateString, reports]
  );

  if (!organisation.receptionEnabled || !organisation?.services) return null;

  return (
    <StyledBox>
      <TabTitle>Services effectués ce jour</TabTitle>
      {reports.length > 1 && (
        <ServicesWrapper show={show.includes('all')} showForPrint={window.sessionStorage.getItem(`services-general-${dateString}`) === 'true'}>
          <div className="team-name">
            <p>
              Services effectués par toutes les équipes sélectionnées
              <br />
              <small style={{ opacity: 0.5 }}>
                Ces données sont en lecture seule. Pour les modifier, vous devez le faire équipe par équipe (ci-dessous)
              </small>
            </p>
            <button
              className="toggle-show"
              type="button"
              onClick={() => setShow(show.includes('all') ? show.filter((e) => e === 'all') : [...show, 'all'])}>
              {show.includes('all') ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          <div className="services-list">
            {serviceSumsForAllReports ? (
              Object.entries(serviceSumsForAllReports).map(([key, value]) => (
                <IncrementorSmall
                  dataTestId={`general-${key}-${value || 0}`}
                  key={`general-${key}-${value || 0}`}
                  service={key}
                  count={value || 0}
                  date={dateString}
                  disabled
                />
              ))
            ) : (
              <Spinner />
            )}
          </div>
        </ServicesWrapper>
      )}
      {reports.map((report) => (
        <ServicesWrapper key={report._id} show={show.includes(report.team)}>
          {reports.length > 1 && (
            <div className="team-name">
              <p>
                <b>
                  {selectedTeamsObject[report.team].nightSession ? '🌒' : '☀️ '} {selectedTeamsObject[report.team]?.name || ''}
                </b>{' '}
                - {getPeriodTitle(dateString, selectedTeamsObject[report.team]?.nightSession)}
              </p>
              <button
                className="toggle-show"
                type="button"
                onClick={() => setShow(show.includes(report.team) ? show.filter((e) => e === report.team) : [...show, report.team])}>
                {show.includes(report.team) ? 'Masquer' : 'Afficher'}
              </button>
            </div>
          )}
          <div className="services-list">
            <ReceptionService
              services={services[report.team]}
              onUpdateServices={(updated) => setServices((s) => ({ ...s, [report.team]: updated }))}
              team={selectedTeamsObject[report.team]}
              report={report}
              dateString={dateString}
              dataTestIdPrefix={`${selectedTeamsObject[report.team].name}-`}
            />
          </div>
        </ServicesWrapper>
      ))}
    </StyledBox>
  );
};

const ServicesWrapper = styled.div`
  background-color: #f8f8f8;
  border-radius: 15px;
  padding: 1rem;
  margin-bottom: 1rem;
  .services-list {
    display: ${(p) => (p.show ? 'flex' : 'none')};
    flex-direction: column;
    justify-content: center;
    align-items: center;
    @media print {
      display: flex;
    }
  }
  .incrementor-small {
    max-width: 400px;
    color: #555;
    width: 100%;
  }
  .service-name {
    width: 100%;
    margin-right: auto;
    width: 100%;
  }
  .services-incrementators {
    text-align: left;
    margin-top: 1rem;
  }
  .team-name {
    font-weight: 600;
    ${(p) => p.show && 'border-bottom: 1px solid #ddd;'}
    ${(p) => p.show && 'margin-bottom: 1.5rem;'}
    ${(p) => p.show && 'padding-bottom: 0.5rem;'}
    display: flex;
    justify-content: space-between;
    align-items: center;
    p {
      margin: 0;
    }
  }
  button.toggle-show {
    background: none;
    color: ${theme.main};
    display: inline-block;
    font-size: 14px;
    font-weight: 600;
    margin-left: auto;
    border-radius: 8px;
    cursor: pointer;
    border: none;
  }
`;

const ActionCompletedAt = ({ date, status, actions, setSortOrder, setSortBy, sortBy, sortOrder }) => {
  const data = actions;
  const history = useHistory();
  const organisation = useRecoilValue(organisationState);

  if (!data) return <div />;

  const moreThanOne = data.length > 1;
  const dateForSelector = dayjsInstance(date).add(12, 'hour');
  return (
    <>
      <StyledBox>
        {status === DONE && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="noprint" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <ButtonCustom
                icon={agendaIcon}
                onClick={() => {
                  const searchParams = new URLSearchParams(history.location.search);
                  searchParams.set('completedAt', dayjsInstance(dateForSelector).toISOString());
                  searchParams.set('newAction', true);
                  history.push(`?${searchParams.toString()}`); // Update the URL with the new search parameters.
                }}
                color="primary"
                title={`Créer une nouvelle action faite le ${formatDateWithFullMonth(date)}`}
                padding={'12px 24px'}
              />
            </div>
          </div>
        )}
        <Table
          className="Table"
          title={`Action${moreThanOne ? 's' : ''} ${status === CANCEL ? 'annulée' : 'faite'}${moreThanOne ? 's' : ''} le ${formatDateWithFullMonth(
            date
          )}`}
          noData={`Pas d'action ${status === CANCEL ? 'annulée' : 'faite'} ce jour`}
          data={data.map((a) => (a.urgent ? { ...a, style: { backgroundColor: '#fecaca99' } } : a))}
          onRowClick={(action) => {
            const searchParams = new URLSearchParams(history.location.search);
            searchParams.set('actionId', action._id);
            history.push(`?${searchParams.toString()}`);
          }}
          rowKey="_id"
          dataTestId="name"
          columns={[
            {
              title: '',
              dataKey: 'urgentOrGroupOrConsultation',
              small: true,
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortBy,
              sortOrder,
              render: (action) => {
                return (
                  <div className="tw-flex tw-items-center tw-justify-center tw-gap-1">
                    {!!action.urgent && <ExclamationMarkButton />}
                    {!!action.description && <DescriptionIcon />}
                    {!!organisation.groupsEnabled && !!action.group && (
                      <span className="tw-text-3xl" aria-label="Action familiale" title="Action familiale">
                        👪
                      </span>
                    )}
                  </div>
                );
              },
            },
            {
              title: status === CANCEL ? 'Annulée le' : 'Faite le',
              dataKey: 'completedAt',
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortBy,
              sortOrder,
              render: (action) => <DateBloc date={action.completedAt} />,
            },
            {
              title: 'Heure',
              dataKey: '_id',
              render: (action) => {
                if (!action.dueAt || !action.withTime) return null;
                return formatTime(action.dueAt);
              },
            },
            {
              title: 'Nom',
              dataKey: 'name',
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortBy,
              sortOrder,
              render: (action) => <ActionOrConsultationName item={action} />,
            },
            {
              title: 'Personne suivie',
              dataKey: 'person',
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortBy,
              sortOrder,
              render: (action) => <PersonName showOtherNames item={action} />,
            },
            {
              title: 'Statut',
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortBy,
              sortOrder,
              dataKey: 'status',
              render: (action) => <ActionStatus status={action.status} />,
            },
            {
              title: 'Équipe(s) en charge',
              dataKey: 'team',
              render: (a) => (
                <div className="px-2 tw-flex tw-flex-shrink-0 tw-flex-col tw-gap-px">
                  {Array.isArray(a?.teams) ? a.teams.map((e) => <TagTeam key={e} teamId={e} />) : <TagTeam teamId={a?.team} />}
                </div>
              ),
            },
          ]}
        />
      </StyledBox>
      <hr />
    </>
  );
};

const ActionCreatedAt = ({ date, actions, setSortOrder, setSortBy, sortBy, sortOrder }) => {
  const data = actions;
  const history = useHistory();
  const organisation = useRecoilValue(organisationState);

  if (!data) return <div />;
  const moreThanOne = data.length > 1;

  return (
    <>
      <StyledBox>
        <Table
          className="Table"
          title={`Action${moreThanOne ? 's' : ''} créée${moreThanOne ? 's' : ''} le ${formatDateWithFullMonth(date)}`}
          noData="Pas d'action créée ce jour"
          data={data.map((a) => (a.urgent ? { ...a, style: { backgroundColor: '#fecaca99' } } : a))}
          onRowClick={(action) => {
            const searchParams = new URLSearchParams(history.location.search);
            searchParams.set('actionId', action._id);
            history.push(`?${searchParams.toString()}`);
          }}
          rowKey="_id"
          dataTestId="name"
          columns={[
            {
              title: '',
              dataKey: 'urgentOrGroupOrConsultation',
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortBy,
              sortOrder,
              small: true,
              render: (action) => {
                return (
                  <div className="tw-flex tw-items-center tw-justify-center tw-gap-1">
                    {!!action.urgent && <ExclamationMarkButton />}
                    {!!action.description && <DescriptionIcon />}
                    {!!organisation.groupsEnabled && !!action.group && (
                      <span className="tw-text-3xl" aria-label="Action familiale" title="Action familiale">
                        👪
                      </span>
                    )}
                  </div>
                );
              },
            },
            {
              title: 'À faire le ',
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortBy,
              sortOrder,
              dataKey: 'dueAt',
              render: (d) => <DateBloc date={d.dueAt} />,
            },
            {
              title: 'Heure',
              dataKey: '_id',
              render: (action) => {
                if (!action.dueAt || !action.withTime) return null;
                return formatTime(action.dueAt);
              },
            },
            {
              title: 'Nom',
              dataKey: 'name',
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortBy,
              sortOrder,
              render: (action) => <ActionOrConsultationName item={action} />,
            },
            {
              title: 'Personne suivie',
              dataKey: 'person',
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortBy,
              sortOrder,
              render: (action) => <PersonName showOtherNames item={action} />,
            },
            {
              title: 'Statut',
              dataKey: 'status',
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortBy,
              sortOrder,
              render: (action) => <ActionStatus status={action.status} />,
            },
            {
              title: 'Équipe(s) en charge',
              dataKey: 'team',
              render: (a) => (
                <div className="px-2 tw-flex tw-flex-shrink-0 tw-flex-col tw-gap-px">
                  {Array.isArray(a?.teams) ? a.teams.map((e) => <TagTeam key={e} teamId={e} />) : <TagTeam teamId={a?.team} />}
                </div>
              ),
            },
          ]}
        />
      </StyledBox>
      <hr />
    </>
  );
};

const Consultations = ({ date, status, consultations, setSortOrder, setSortBy, sortBy, sortOrder }) => {
  const data = consultations;
  const user = useRecoilValue(userState);
  const history = useHistory();

  if (!data) return <div />;
  const moreThanOne = data.length > 1;
  const dateForSelector = dayjsInstance(date).add(12, 'hour');
  return (
    <>
      <StyledBox>
        <ButtonCustom
          title={`Ajouter une consultation faite le ${formatDateWithFullMonth(date)}`}
          className="tw-ml-auto tw-mb-10"
          onClick={() => {
            const searchParams = new URLSearchParams(history.location.search);
            searchParams.set('completedAt', dayjsInstance(dateForSelector).toISOString());
            searchParams.set('newConsultation', true);
            history.push(`?${searchParams.toString()}`);
          }}
        />
        <Table
          className="Table"
          title={`Consultation${moreThanOne ? 's' : ''} ${status === DONE ? 'faite' : 'annulée'}${
            moreThanOne ? 's' : ''
          } le ${formatDateWithFullMonth(date)}`}
          noData={`Pas de consultation ${status === DONE ? 'faite' : 'annulée'} ce jour`}
          data={data}
          onRowClick={(consultation) => {
            const searchParams = new URLSearchParams(history.location.search);
            searchParams.set('consultationId', consultation._id);
            history.push(`?${searchParams.toString()}`);
          }}
          rowDisabled={(consultation) => disableConsultationRow(consultation, user)}
          rowKey="_id"
          dataTestId="name"
          columns={[
            {
              title: '',
              dataKey: 'isConsultation',
              small: true,
              render: () => <ConsultationButton />,
            },
            {
              title: 'À faire le ',
              dataKey: 'dueAt',
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortBy,
              sortOrder,
              render: (d) => <DateBloc date={d.dueAt} />,
            },
            {
              title: 'Heure',
              dataKey: '_id',
              small: true,
              render: (action) => formatTime(action.dueAt),
            },
            {
              title: 'Nom',
              dataKey: 'name',
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortBy,
              sortOrder,
              render: (consultation) => <ActionOrConsultationName item={consultation} />,
            },
            {
              title: 'Personne suivie',
              dataKey: 'person',
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortBy,
              sortOrder,
              render: (consultation) => <PersonName showOtherNames item={consultation} />,
            },
            {
              title: 'Statut',
              dataKey: 'status',
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortBy,
              sortOrder,
              render: (consultation) => <ActionStatus status={consultation.status} />,
            },
            {
              title: 'Équipe(s) en charge',
              dataKey: 'team',
              render: (a) => (
                <div className="px-2 tw-flex tw-flex-shrink-0 tw-flex-col tw-gap-px">
                  {Array.isArray(a?.teams) ? a.teams.map((e) => <TagTeam key={e} teamId={e} />) : <TagTeam teamId={a?.team} />}
                </div>
              ),
            },
          ]}
        />
      </StyledBox>
      <hr />
    </>
  );
};

const ConsultationsCreatedAt = ({ date, consultations }) => {
  const data = consultations;
  const history = useHistory();
  const user = useRecoilValue(userState);

  if (!data) return <div />;
  const moreThanOne = data.length > 1;

  return (
    <>
      <StyledBox>
        <Table
          className="Table"
          title={`Consultation${moreThanOne ? 's' : ''} créée${moreThanOne ? 's' : ''} le ${formatDateWithFullMonth(date)}`}
          noData="Pas de consultation créée ce jour"
          data={data}
          onRowClick={(consultation) => {
            const searchParams = new URLSearchParams(history.location.search);
            searchParams.set('consultationId', consultation._id);
            history.push(`?${searchParams.toString()}`);
          }}
          rowDisabled={(consultation) => disableConsultationRow(consultation, user)}
          rowKey="_id"
          dataTestId="name"
          columns={[
            {
              title: '',
              dataKey: 'isConsultation',
              small: true,
              render: () => <ConsultationButton />,
            },
            { title: 'À faire le ', dataKey: 'date', render: (d) => <DateBloc date={d.dueAt} /> },
            {
              title: 'Heure',
              dataKey: '_id',
              small: true,
              render: (action) => formatTime(action.dueAt),
            },
            {
              title: 'Nom',
              dataKey: 'name',
              render: (action) => <ActionOrConsultationName item={action} />,
            },
            {
              title: 'Personne suivie',
              dataKey: 'person',
              render: (action) => <PersonName showOtherNames item={action} />,
            },
            { title: 'Statut', dataKey: 'status', render: (action) => <ActionStatus status={action.status} /> },
            {
              title: 'Équipe(s) en charge',
              dataKey: 'team',
              render: (a) => (
                <div className="px-2 tw-flex tw-flex-shrink-0 tw-flex-col tw-gap-px">
                  {Array.isArray(a?.teams) ? a.teams.map((e) => <TagTeam key={e} teamId={e} />) : <TagTeam teamId={a?.team} />}
                </div>
              ),
            },
          ]}
        />
      </StyledBox>
      <hr />
    </>
  );
};

const CommentCreatedAt = ({ date, comments, medical }) => {
  const history = useHistory();
  const data = comments;
  const organisation = useRecoilValue(organisationState);

  if (!data) return <div />;

  return (
    <>
      <StyledBox>
        <Table
          className={medical ? 'medical' : ''}
          title={`Commentaires ajoutés le ${formatDateWithFullMonth(date)}`}
          data={data}
          noData="Pas de commentaire ajouté ce jour"
          onRowClick={(comment) => {
            try {
              const searchParams = new URLSearchParams(history.location.search);
              switch (comment.type) {
                case 'action':
                  searchParams.set('actionId', comment.action._id);
                  history.push(`?${searchParams.toString()}`);
                  break;
                case 'person':
                  history.push(`/person/${comment.person._id}`);
                  break;
                case 'consultation':
                  searchParams.set('consultationId', comment.consultation._id);
                  history.push(`?${searchParams.toString()}`);
                  break;
                case 'treatment':
                  searchParams.set('treatmentId', comment.treatment._id);
                  history.push(`?${searchParams.toString()}`);
                  break;
                case 'medical-file':
                  history.push(`/person/${comment.person._id}?tab=Dossier+Médical`);
                  break;
                default:
                  break;
              }
            } catch (errorLoadingComment) {
              capture(errorLoadingComment, { extra: { message: 'error loading comment from report', comment, date } });
            }
          }}
          rowKey="_id"
          dataTestId="comment"
          columns={[
            {
              title: '',
              dataKey: 'urgent',
              small: true,
              render: (comment) => {
                return (
                  <div className="tw-flex tw-items-center tw-justify-center tw-gap-1">
                    {!!comment.urgent && <ExclamationMarkButton />}
                    {!!organisation.groupsEnabled && !!comment.group && (
                      <span className="tw-text-3xl" aria-label="Commentaire familial" title="Commentaire familial">
                        👪
                      </span>
                    )}
                  </div>
                );
              },
            },
            {
              title: 'Heure',
              dataKey: 'date',
              render: (comment) => <span>{dayjs(comment.date || comment.createdAt).format('D MMM HH:mm')}</span>,
            },
            {
              title: 'Utilisateur',
              dataKey: 'user',
              render: (comment) => <UserName id={comment.user} />,
            },
            {
              title: 'Type',
              dataKey: 'type',
              render: (comment) => (
                <span>
                  {comment.type === 'action' && 'Action'}
                  {comment.type === 'person' && 'Personne suivie'}
                  {comment.type === 'consultation' && 'Consultation'}
                  {comment.type === 'treatment' && 'Traitement'}
                  {comment.type === 'medical-file' && 'Dossier médical'}
                </span>
              ),
            },
            {
              title: 'Nom',
              dataKey: 'person',
              render: (comment) => {
                if (comment.type === 'action') {
                  return (
                    <>
                      <b>{comment.action?.name}</b>
                      <br />
                      <i>(pour {comment.person?.name || ''})</i>
                    </>
                  );
                }
                return (
                  <>
                    <i>(pour {comment.person?.name || ''})</i>
                  </>
                );
              },
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
            {
              title: 'Équipe en charge',
              dataKey: 'team',
              render: (comment) => <TagTeam teamId={comment?.team} />,
            },
          ]}
        />
      </StyledBox>
      <hr />
    </>
  );
};

const PassagesCreatedAt = ({ date, passages, selectedTeams }) => {
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const [passageToEdit, setPassageToEdit] = useState(null);

  const numberOfAnonymousPassages = useMemo(() => passages.filter((p) => !p.person)?.length, [passages]);
  const numberOfNonAnonymousPassages = useMemo(() => passages.filter((p) => !!p.person)?.length, [passages]);

  return (
    <>
      <StyledBox>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <TabTitle>Passages enregistrés le {formatDateWithFullMonth(date)}</TabTitle>
          <ButtonCustom
            title="Ajouter un passage ce jour"
            style={{ marginLeft: 'auto', marginBottom: '10px' }}
            onClick={() =>
              setPassageToEdit({
                date: dayjs(date),
                user: user._id,
                team: selectedTeams?.length === 1 ? selectedTeams[0]._id : currentTeam._id,
              })
            }
          />
        </div>
        <Row style={{ marginBottom: 20 }}>
          <Col md={2} />
          <Col md={4}>
            <Card
              countId="report-passages-anonymous-count"
              title="Nombre de passages anonymes"
              count={numberOfAnonymousPassages}
              unit={`passage${numberOfAnonymousPassages > 1 ? 's' : ''}`}
            />
          </Col>
          <Col md={4}>
            <Card
              countId="report-passages-non-anonymous-count"
              title="Nombre de passages non-anonymes"
              count={numberOfNonAnonymousPassages}
              unit={`passage${numberOfNonAnonymousPassages > 1 ? 's' : ''}`}
            />
          </Col>
        </Row>
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
                  const time = dayjs(passage.date).format('D MMM HH:mm');
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
                  passage.person ? <PersonName showOtherNames item={passage} /> : <span style={{ opacity: 0.3, fontStyle: 'italic' }}>Anonyme</span>,
              },
              {
                title: 'Enregistré par',
                dataKey: 'user',
                render: (passage) => (passage.user ? <UserName id={passage.user} /> : null),
              },
              { title: 'Commentaire', dataKey: 'comment' },
              {
                title: 'Équipe en charge',
                dataKey: 'team',
                render: (passage) => <TagTeam teamId={passage?.team} />,
              },
            ]}
          />
        )}
      </StyledBox>
    </>
  );
};

const RencontresCreatedAt = ({ date, rencontres, selectedTeams }) => {
  const currentTeam = useRecoilValue(currentTeamState);
  const user = useRecoilValue(userState);
  const [rencontreToEdit, setRencontreToEdit] = useState(null);

  const numberOfNonAnonymousRencontres = useMemo(() => rencontres.filter((p) => !!p.person)?.length, [rencontres]);

  return (
    <>
      <StyledBox>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <TabTitle>Rencontres enregistrées le {formatDateWithFullMonth(date)}</TabTitle>
          <ButtonCustom
            title="Ajouter une rencontre ce jour"
            style={{ marginLeft: 'auto', marginBottom: '10px' }}
            onClick={() =>
              setRencontreToEdit({
                date: dayjs(date),
                user: user._id,
                team: selectedTeams?.length === 1 ? selectedTeams[0]._id : currentTeam._id,
              })
            }
          />
        </div>
        <Row style={{ marginBottom: 20 }}>
          <Col md={3} />
          <Col md={6}>
            <Card
              countId="report-rencontres-non-anonymous-count"
              title="Nombre de rencontres"
              count={numberOfNonAnonymousRencontres}
              unit={`rencontre${numberOfNonAnonymousRencontres > 1 ? 's' : ''}`}
            />
          </Col>
        </Row>
        <Rencontre rencontre={rencontreToEdit} personId={rencontreToEdit?.person} onFinished={() => setRencontreToEdit(null)} />
        {!!rencontres.length && (
          <Table
            className="Table"
            onRowClick={setRencontreToEdit}
            data={rencontres}
            rowKey={'_id'}
            columns={[
              {
                title: 'Heure',
                dataKey: 'date',
                render: (rencontre) => {
                  const time = dayjs(rencontre.date).format('D MMM HH:mm');
                  // anonymous comment migrated from `report.rencontres`
                  // have no time
                  // have no user assigned either
                  if (time === '00:00' && !rencontre.user) return null;
                  return <span>{time}</span>;
                },
              },
              {
                title: 'Personne suivie',
                dataKey: 'person',
                render: (rencontre) =>
                  rencontre.person ? (
                    <PersonName showOtherNames item={rencontre} />
                  ) : (
                    <span style={{ opacity: 0.3, fontStyle: 'italic' }}>Anonyme</span>
                  ),
              },
              {
                title: 'Enregistrée par',
                dataKey: 'user',
                render: (rencontre) => (rencontre.user ? <UserName id={rencontre.user} /> : null),
              },
              { title: 'Commentaire', dataKey: 'comment' },
              {
                title: 'Équipe en charge',
                dataKey: 'team',
                render: (rencontre) => <TagTeam teamId={rencontre?.team} />,
              },
            ]}
          />
        )}
      </StyledBox>
    </>
  );
};

const TerritoryObservationsCreatedAt = ({ date, observations }) => {
  const data = observations;
  const territories = useRecoilValue(territoriesState);
  const [observation, setObservation] = useState({});
  const [openObservationModale, setOpenObservationModale] = useState(null);

  if (!data) return <div />;
  const moreThanOne = data.length > 1;

  const handleOpenObservationModal = () => {
    setObservation({
      date: dayjs(date),
      observations: [],
    });
    setOpenObservationModale(true);
  };

  return (
    <>
      <StyledBox>
        <ButtonCustom title="Ajouter une observation" className="tw-ml-auto tw-mb-10" onClick={handleOpenObservationModal} />
        <Table
          className="Table"
          title={`Observation${moreThanOne ? 's' : ''} de territoire${moreThanOne ? 's' : ''} faite${
            moreThanOne ? 's' : ''
          } le ${formatDateWithFullMonth(date)}`}
          noData="Pas d'observation faite ce jour"
          data={data}
          onRowClick={(obs) => {
            setObservation(obs);
            setOpenObservationModale((k) => k + 1);
          }}
          rowKey="_id"
          columns={[
            {
              title: 'Heure',
              dataKey: 'observedAt',
              render: (obs) => <span>{dayjs(obs.observedAt || obs.createdAt).format('D MMM HH:mm')}</span>,
            },
            {
              title: 'Utilisateur',
              dataKey: 'user',
              render: (obs) => <UserName id={obs.user} />,
            },
            { title: 'Territoire', dataKey: 'territory', render: (obs) => territories.find((t) => t._id === obs.territory)?.name },
            { title: 'Observation', dataKey: 'entityKey', render: (obs) => <Observation noTeams noBorder obs={obs} />, left: true },
            {
              title: 'Équipe en charge',
              dataKey: 'team',
              render: (obs) => <TagTeam teamId={obs?.team} />,
            },
          ]}
        />
      </StyledBox>
      <CreateObservation observation={observation} forceOpen={openObservationModale} />
      <hr />
    </>
  );
};

const PersonCreatedAt = ({ date, persons, setSortBy, setSortOrder, sortBy, sortOrder }) => {
  const data = persons;
  const history = useHistory();

  if (!data) return <div />;
  const moreThanOne = data.length > 1;

  return (
    <>
      <StyledBox>
        <Table
          className="Table"
          title={`Personne${moreThanOne ? 's' : ''} créée${moreThanOne ? 's' : ''} le ${formatDateWithFullMonth(date)}`}
          noData="Pas de personnes créées ce jour"
          data={data}
          onRowClick={(person) => {
            if (person) history.push(`/person/${person._id}`);
          }}
          rowKey="_id"
          dataTestId="name"
          columns={[
            {
              title: 'Heure',
              dataKey: 'createdAt',
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortOrder,
              sortBy,
              render: (p) => <span>{dayjs(p.createdAt).format('D MMM HH:mm')}</span>,
            },
            {
              title: 'Personne (nom)',
              dataKey: 'name',
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortOrder,
              sortBy,
            },
            {
              title: 'Utilisateur (créateur)',
              dataKey: 'user',
              onSortOrder: setSortOrder,
              onSortBy: setSortBy,
              sortOrder,
              sortBy,
              render: (p) => <UserName id={p.user} />,
            },
            {
              title: 'Équipe en charge',
              dataKey: 'assignedTeams',
              render: (person) => (
                <React.Fragment>
                  {person.assignedTeams?.map((teamId) => (
                    <TagTeam key={teamId} teamId={teamId} />
                  ))}
                </React.Fragment>
              ),
            },
          ]}
        />
      </StyledBox>
    </>
  );
};

const DescriptionAndCollaborations = ({ reports, selectedTeamsObject, dateString }) => {
  const setReports = useSetRecoilState(reportsState);

  const lastLoad = useRecoilValue(lastLoadState);

  return (
    <StyledBox>
      {reports.map((report) => {
        const team = selectedTeamsObject[report.team];
        return (
          <React.Fragment key={report.team}>
            <DescriptionBox className="noprint" report={report}>
              {reports.length > 1 && (
                <p style={{ fontWeight: 600, marginBottom: 20 }}>
                  <b>
                    {team.nightSession ? '🌒' : '☀️'} {team?.name || ''}
                  </b>{' '}
                  - {getPeriodTitle(dateString, team?.nightSession)}
                </p>
              )}
              <Formik
                className="noprint"
                initialValues={report}
                enableReinitialize
                onSubmit={async (body) => {
                  const latestReportsRes = await API.get({ path: '/report', query: { after: lastLoad, withDeleted: true } });
                  const allReports = mergeItems(reports, latestReportsRes.decryptedData);
                  const reportAtDate = allReports.find((_report) => _report.date === report.date && _report.team === report.team);
                  const reportUpdate = {
                    ...(reportAtDate || { team: report.team, date: report.date }),
                    collaborations: body.collaborations,
                  };
                  const isNew = !reportAtDate?._id;
                  const res = isNew
                    ? await API.post({
                        path: '/report',
                        body: prepareReportForEncryption(reportUpdate),
                        headers: {
                          'debug-report-component': 'DescriptionAndCollaborations',
                        },
                      })
                    : await API.put({ path: `/report/${reportAtDate._id}`, body: prepareReportForEncryption(reportUpdate) });
                  if (res.ok) {
                    setReports((reports) =>
                      isNew
                        ? [res.decryptedData, ...reports.filter((_report) => _report._id !== res.decryptedData._id)]
                        : reports.map((a) => {
                            if (a._id === reportAtDate._id) return res.decryptedData;
                            return a;
                          })
                    );
                    toast.success('Mis à jour !');
                  }
                }}>
                {({ values, handleChange, handleSubmit, isSubmitting }) => (
                  <Row>
                    <Col md={12}>
                      <FormGroup>
                        <Label htmlFor="report-select-collaboration">Collaboration</Label>
                        <SelectAndCreateCollaboration values={values.collaborations} onChange={handleChange} />
                      </FormGroup>
                    </Col>
                    <Col md={12} style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                      <ButtonCustom
                        title={'Mettre à jour'}
                        loading={isSubmitting}
                        disabled={JSON.stringify(report.collaborations) === JSON.stringify(values.collaborations)}
                        onClick={handleSubmit}
                      />
                    </Col>
                    <Col md={12}>
                      <FormGroup>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: report?.description?.length ? 'row' : 'column',
                            alignItems: report?.description?.length ? 'center' : 'flex-start',
                            justifyContent: 'flex-start',
                          }}>
                          <Label htmlFor="description">Description</Label>
                          <ReportDescriptionModale report={report} />
                        </div>
                        {report?.description && (
                          <p style={{ border: '1px solid #ccc', borderRadius: 5, padding: '0.5rem', background: '#fff' }}>
                            {report?.description?.split('\n').map((sentence, index) => (
                              <React.Fragment key={index}>
                                {sentence}
                                <br />
                              </React.Fragment>
                            ))}
                          </p>
                        )}
                      </FormGroup>
                    </Col>
                  </Row>
                )}
              </Formik>
            </DescriptionBox>
            {process.env.REACT_APP_TEST !== 'true' && (
              <DescriptionBox className="printonly" report={report}>
                {reports.length > 1 && (
                  <p style={{ fontWeight: 600, marginBottom: 20 }}>
                    <b>
                      {team.nightSession ? '🌒' : '☀️'} {team?.name || ''}
                    </b>{' '}
                    - {getPeriodTitle(dateString, team?.nightSession)}
                  </p>
                )}
                {!!report?.collaborations?.length && (
                  <>
                    <Title>Collaboration{report.collaborations.length > 1 ? 's' : ''}</Title>
                    <p>{report?.collaborations.join(', ')}</p>
                  </>
                )}
                <Title>Description</Title>
                <p>
                  {!report?.description
                    ? 'Pas de description'
                    : report?.description?.split('\n').map((sentence, index) => (
                        <React.Fragment key={index}>
                          {sentence}
                          <br />
                        </React.Fragment>
                      ))}
                </p>
              </DescriptionBox>
            )}
          </React.Fragment>
        );
      })}
    </StyledBox>
  );
};

const Title = styled.h3`
  font-weight: bold;
  font-size: 24px;
  line-height: 32px;
  padding: 20px 0 10px 0;
  width: 100%;

  button {
    font-style: italic;
  }
`;

const TabTitle = styled.span`
  caption-side: top;
  font-weight: bold;
  font-size: 24px;
  line-height: 32px;
  width: 100%;
  color: #1d2021;
  text-transform: none;
  padding: 16px 0;
  display: block;
  @media print {
    display: block !important;
  }
`;

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

const DescriptionBox = styled(StyledBox)`
  background-color: #f8f8f8;
  border-radius: 15px;
  padding: 1rem;
  @media screen {
    margin-bottom: 1rem;
    width: 100%;
  }
  @media print {
    ${(props) => props.report?.description?.length < 1 && props.report?.collaborations?.length < 1 && 'display: none !important;'}
    margin-bottom: 40px;
    page-break-inside: avoid;
  }
`;

export default View;
