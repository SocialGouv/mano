import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Col, Row, FormGroup, Label } from 'reactstrap';
import styled from 'styled-components';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Formik } from 'formik';
import {
  addOneDay,
  formatDateWithFullMonth,
  formatDateWithNameOfDay,
  formatTime,
  getIsDayWithinHoursOffsetOfPeriod,
  startOfToday,
} from '../../services/date';
import DateBloc from '../../components/DateBloc';
import { HeaderStyled, Title as HeaderTitle } from '../../components/header';
import BackButton, { BackButtonWrapper } from '../../components/backButton';
import Box from '../../components/Box';
import ActionStatus from '../../components/ActionStatus';
import Table from '../../components/table';
import CreateActionModal from '../../components/CreateActionModal';
import Observation from '../territory-observations/view';
import dayjs from 'dayjs';
import { actionsState, CANCEL, DONE } from '../../recoil/actions';
import { territoryObservationsState } from '../../recoil/territoryObservations';
import { capture } from '../../services/sentry';
import UserName from '../../components/UserName';
import ButtonCustom from '../../components/ButtonCustom';
import Card from '../../components/Card';
import CreateObservation from '../../components/CreateObservation';
import SelectAndCreateCollaboration from './SelectAndCreateCollaboration';
import ActionOrConsultationName from '../../components/ActionOrConsultationName';
import ReportDescriptionModale from '../../components/ReportDescriptionModale';
import { currentTeamState, organisationState, teamsState, userState } from '../../recoil/auth';
import { commentsState } from '../../recoil/comments';
import { personsState } from '../../recoil/persons';
import { prepareReportForEncryption, reportsState } from '../../recoil/reports';
import { territoriesState } from '../../recoil/territory';
import PersonName from '../../components/PersonName';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import IncrementorSmall from '../../components/IncrementorSmall';
import useApi from '../../services/api';
import { passagesState } from '../../recoil/passages';
import { rencontresState } from '../../recoil/rencontres';
import Passage from '../../components/Passage';
import ExclamationMarkButton from '../../components/tailwind/ExclamationMarkButton';
import useTitle from '../../services/useTitle';
import { theme } from '../../config';
import ConsultationButton from '../../components/ConsultationButton';
import { consultationsState, disableConsultationRow } from '../../recoil/consultations';
import agendaIcon from '../../assets/icons/agenda-icon.svg';
import { lastLoadState, mergeItems, useDataLoader } from '../../components/DataLoader';
import Rencontre from '../../components/Rencontre';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import TagTeam from '../../components/TagTeam';
import ReceptionService from '../../components/ReceptionService';
import { useLocalStorage } from 'react-use';
import useSearchParamState from '../../services/useSearchParamState';

const getPeriodTitle = (date, nightSession) => {
  if (!nightSession) return `Journée du ${formatDateWithFullMonth(date)}`;
  const nextDay = addOneDay(date);
  return `Nuit du ${formatDateWithFullMonth(date)} au ${formatDateWithFullMonth(nextDay)}`;
};

const View = () => {
  const { dateString } = useParams();
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const allComments = useRecoilValue(commentsState);
  const allPersons = useRecoilValue(personsState);
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
  const isReadOnly = selectedTeams.length > 1;

  const isSingleTeam = selectedTeams.length === 1;

  const allReports = useRecoilValue(reportsState);
  const reportsFromDay = useMemo(() => allReports.filter((report) => report.date === dateString), [dateString, allReports]);
  const setReports = useSetRecoilState(reportsState);
  const history = useHistory();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useSearchParamState('tab', ['restricted-access'].includes(user.role) ? 'reception' : 'resume');
  const API = useApi();
  const { refresh, isLoading } = useDataLoader();

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

  const allPassages = useRecoilValue(passagesState);
  const passages = useMemo(
    () =>
      allPassages
        .filter((p) => !!selectedTeamsObject[p.team])
        .filter((p) => {
          const currentTeam = selectedTeamsObject[p.team];
          return getIsDayWithinHoursOffsetOfPeriod(
            p.date,
            { referenceStartDay: dateString, referenceEndDay: dateString },
            currentTeam?.nightSession ? 12 : 0
          );
        })
        .sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt)),
    [allPassages, dateString, selectedTeamsObject]
  );

  const allActions = useRecoilValue(actionsState);
  const actionsCallback = useCallback(
    (status) =>
      allActions
        .filter((a) => !!selectedTeamsObject[a.team])
        .filter((a) => a.status === status)
        .filter((a) => {
          const currentTeam = selectedTeamsObject[a.team];
          return getIsDayWithinHoursOffsetOfPeriod(
            a.completedAt,
            { referenceStartDay: dateString, referenceEndDay: dateString },
            currentTeam?.nightSession ? 12 : 0
          );
        }),
    [allActions, selectedTeamsObject, dateString]
  );
  const actionsDone = useMemo(() => actionsCallback(DONE), [actionsCallback]);
  const actionsCancel = useMemo(() => actionsCallback(CANCEL), [actionsCallback]);

  const actionsCreatedAt = useMemo(
    () =>
      allActions
        .filter((a) => !!selectedTeamsObject[a.team])
        .filter((a) => {
          const currentTeam = selectedTeamsObject[a.team];
          return getIsDayWithinHoursOffsetOfPeriod(
            a.createdAt,
            { referenceStartDay: dateString, referenceEndDay: dateString },
            currentTeam?.nightSession ? 12 : 0
          );
        })
        .filter((a) => {
          const currentTeam = selectedTeamsObject[a.team];
          return !getIsDayWithinHoursOffsetOfPeriod(
            a.completedAt,
            { referenceStartDay: dateString, referenceEndDay: dateString },
            currentTeam?.nightSession ? 12 : 0
          );
        }),
    [allActions, dateString, selectedTeamsObject]
  );

  const allConsultations = useRecoilValue(consultationsState);
  const consultations = useCallback(
    (status) =>
      allConsultations
        .filter((c) => c.status === status)
        .filter((a) => {
          return getIsDayWithinHoursOffsetOfPeriod(a.completedAt, { referenceStartDay: dateString, referenceEndDay: dateString }, 0);
        })
        .map((a) => ({ ...a, style: { backgroundColor: '#DDF4FF' } })),
    [allConsultations, dateString]
  );
  const consultationsDone = useMemo(() => consultations(DONE), [consultations]);
  const consultationsCancel = useMemo(() => consultations(CANCEL), [consultations]);

  const consultationsCreatedAt = useMemo(
    () =>
      allConsultations
        .filter((a) => {
          return getIsDayWithinHoursOffsetOfPeriod(a.createdAt, { referenceStartDay: dateString, referenceEndDay: dateString }, 0);
        })
        .map((a) => ({ ...a, style: { backgroundColor: '#DDF4FF' } }))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [allConsultations, dateString]
  );

  const comments = useMemo(
    () =>
      allComments
        ?.filter((c) => !!selectedTeamsObject[c.team])
        .filter((c) => {
          const currentTeam = selectedTeamsObject[c.team];
          return getIsDayWithinHoursOffsetOfPeriod(
            c.date || c.createdAt,
            { referenceStartDay: dateString, referenceEndDay: dateString },
            currentTeam?.nightSession ? 12 : 0
          );
        })
        .map((comment) => {
          const commentPopulated = { ...comment };
          if (comment.person) {
            const personId = comment?.person;
            commentPopulated.person = allPersons.find((p) => p._id === personId);
            commentPopulated.type = 'person';
          }
          if (comment.action) {
            const actionId = comment?.action;
            const action = allActions.find((p) => p._id === actionId);
            commentPopulated.action = action;
            commentPopulated.person = allPersons.find((p) => p._id === action?.person);
            commentPopulated.type = 'action';
          }
          return commentPopulated;
        })
        .filter((c) => c.action || c.person)
        .map((a) => {
          if (a.urgent) return { ...a, style: { backgroundColor: '#fecaca' } };
          return a;
        })
        .sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt)),
    [allComments, selectedTeamsObject, dateString, allPersons, allActions]
  );

  const allRencontres = useRecoilValue(rencontresState);
  const rencontres = useMemo(
    () =>
      allRencontres
        .filter((p) => !!selectedTeamsObject[p.team])
        .filter((p) => {
          const currentTeam = selectedTeamsObject[p.team];
          return getIsDayWithinHoursOffsetOfPeriod(
            p.date,
            { referenceStartDay: dateString, referenceEndDay: dateString },
            currentTeam?.nightSession ? 12 : 0
          );
        })
        .sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt)),
    [allRencontres, dateString, selectedTeamsObject]
  );

  const territoryObservations = useRecoilValue(territoryObservationsState);
  const observations = useMemo(
    () =>
      territoryObservations
        .filter((o) => !!selectedTeamsObject[o.team])
        .filter((o) => {
          const currentTeam = selectedTeamsObject[o.team];
          return getIsDayWithinHoursOffsetOfPeriod(
            o.observedAt || o.createdAt,
            { referenceStartDay: dateString, referenceEndDay: dateString },
            currentTeam?.nightSession ? 12 : 0
          );
        }),
    [dateString, selectedTeamsObject, territoryObservations]
  );

  const persons = useMemo(
    () =>
      allPersons
        .filter((p) => {
          if (viewAllOrganisationData) return true;
          return (p.assignedTeams || []).some((teamId) => selectedTeamsObject[teamId]);
        })
        .filter((p) => {
          const currentTeam = selectedTeamsObject[p.team];
          return getIsDayWithinHoursOffsetOfPeriod(
            p.createdAt,
            { referenceStartDay: dateString, referenceEndDay: dateString },
            currentTeam?.nightSession ? 12 : 0
          );
        })
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [allPersons, selectedTeamsObject, dateString, viewAllOrganisationData]
  );

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

  const scrollContainer = useRef(null);
  useEffect(() => {
    refresh();
    scrollContainer.current.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const renderPrintOnly = () => {
    if (process.env.REACT_APP_TEST === 'true') return null;
    return (
      <div className="printonly">
        <div style={{ fontSize: 24, lineHeight: '32px', fontWeight: 'bold', padding: '16px 32px' }}>
          {selectedTeams.length === 1 ? getPeriodTitle(dateString, selectedTeams[0]?.nightSession) : formatDateWithNameOfDay(dateString).capitalize()}
          <br />
          Compte rendu {viewAllOrganisationData ? <>de toutes les équipes</> : <>{selectedTeamIds.length > 1 ? 'des équipes ' : "de l'équipe "}</>}
          {selectedTeams.map((t) => t.name).join(', ')}
        </div>
        {!['restricted-access'].includes(user.role) && (
          <DescriptionAndCollaborations reports={selectedTeamsReports} selectedTeamsObject={selectedTeamsObject} dateString={dateString} />
        )}
        {!!organisation.services && !!organisation.receptionEnabled && (
          <Reception reports={selectedTeamsReports} selectedTeamsObject={selectedTeamsObject} dateString={dateString} />
        )}
        {!['restricted-access'].includes(user.role) && (
          <>
            <ActionCompletedAt date={dateString} status={DONE} actions={actionsDone} />
            <ActionCreatedAt date={dateString} actions={actionsCreatedAt} />
            <ActionCompletedAt date={dateString} status={CANCEL} actions={actionsCancel} />
            <CommentCreatedAt date={dateString} comments={comments} />
          </>
        )}
        <PassagesCreatedAt date={dateString} passages={passages} />
        <RencontresCreatedAt date={dateString} rencontres={rencontres} />
        {!['restricted-access'].includes(user.role) && (
          <>
            <TerritoryObservationsCreatedAt date={dateString} observations={observations} />
            {!!user.healthcareProfessional && <Consultations date={dateString} consultations={consultationsDone} />}
            {!!user.healthcareProfessional && <ConsultationsCreatedAt date={dateString} consultations={consultationsCreatedAt} />}
            {!!user.healthcareProfessional && <Consultations date={dateString} status={CANCEL} consultations={consultationsCancel} />}
          </>
        )}
      </div>
    );
  };

  const renderScreenOnly = () => (
    <div
      className="noprint"
      style={{
        display: 'flex',
        flexDirection: 'column',
        margin: '-1rem -3rem -3rem',
        height: 'calc(100% + 4rem)',
        overflow: 'hidden',
      }}>
      <HeaderStyled style={{ padding: 0 }}>
        <div style={{ minWidth: '100%', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex' }}>
              <BackButton />
              <BackButtonWrapper caption="Imprimer" onClick={window.print} />
              {!['restricted-access'].includes(user.role) && <BackButtonWrapper disabled={isReadOnly} caption="Supprimer" onClick={deleteData} />}
            </div>
            <p style={{ margin: 0 }}>
              {selectedTeams.length === 1
                ? getPeriodTitle(dateString, selectedTeams[0]?.nightSession)
                : formatDateWithNameOfDay(dateString).capitalize()}
            </p>
            <div style={{ display: 'flex' }}>
              <ButtonCustom color="link" className="noprint" title="Rafraichir" onClick={() => refresh()} disabled={isLoading} />
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
          <div style={{ display: 'flex', flexGrow: '1', padding: '0 2rem', fontWeight: '400' }}>
            <HeaderTitle style={{ fontWeight: '400', flexShrink: 0 }}>
              <span>
                Compte rendu{' '}
                {viewAllOrganisationData ? <>de toutes les équipes</> : <>{selectedTeamIds.length > 1 ? 'des équipes' : "de l'équipe"}</>}
              </span>
            </HeaderTitle>
            <div style={{ marginLeft: '1rem' }}>
              <SelectTeamMultiple
                inputId="report-select-teams"
                classNamePrefix="report-select-teams"
                onChange={(teamIds) => {
                  console.log({ teamIds });
                  setSelectedTeamIds(teamIds);
                }}
                value={selectedTeamIds}
                key={selectedTeamIds}
                colored
                isDisabled={viewAllOrganisationData}
              />
              {teams.length > 1 && (
                <label htmlFor="viewAllOrganisationData" style={{ fontSize: '14px' }}>
                  <input
                    id="viewAllOrganisationData"
                    type="checkbox"
                    style={{ marginRight: '0.5rem' }}
                    onChange={() => setViewAllOrganisationData(!viewAllOrganisationData)}
                    checked={viewAllOrganisationData}
                  />
                  Comptes rendus de toutes les équipes
                </label>
              )}
            </div>
          </div>
          {selectedTeams.length > 1 && selectedTeams.filter((t) => t.nightSession).length > 0 && (
            <details style={{ padding: '0 2rem', fontWeight: '400' }}>
              <summary style={{ fontSize: 12 }}>
                Certaines équipes travaillent de nuit 🌒, <u>cliquez ici</u> pour savoir la période concernée par chacune
              </summary>
              {selectedTeams.map((team) => (
                <p key={team._id} style={{ fontSize: 12, marginLeft: 20, margin: 0 }}>
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
        className="noprint"
        style={{
          height: '100%',
          display: viewAllOrganisationData || selectedTeamIds.length ? 'flex' : 'none',
          overflow: 'hidden',
          flex: 1,
          marginTop: '1rem',
          borderTop: '1px solid #eee',
        }}>
        <div style={{ display: 'flex', overflow: 'hidden', flex: 1 }}>
          <Drawer title="Navigation dans les catégories du compte-rendu">
            {!['restricted-access'].includes(user.role) && (
              <>
                <DrawerLink id="report-button-resume" className={activeTab === 'resume' ? 'active' : ''} onClick={() => setActiveTab('resume')}>
                  Résumé
                </DrawerLink>
                <hr />
              </>
            )}
            {!!organisation.services && !!organisation.receptionEnabled && (
              <>
                <DrawerLink
                  id="report-button-reception"
                  className={activeTab === 'reception' ? 'active' : ''}
                  onClick={() => setActiveTab('reception')}>
                  Accueil
                </DrawerLink>
                <hr />
              </>
            )}
            {!['restricted-access'].includes(user.role) && (
              <>
                <DrawerLink
                  id="report-button-action-completed"
                  className={activeTab === 'action-completed' ? 'active' : ''}
                  onClick={() => setActiveTab('action-completed')}>
                  Actions complétées ({actionsDone.length})
                </DrawerLink>
                <DrawerLink
                  id="report-button-action-created"
                  className={activeTab === 'action-created' ? 'active' : ''}
                  onClick={() => setActiveTab('action-created')}>
                  Actions créées ({actionsCreatedAt.length})
                </DrawerLink>
                <DrawerLink
                  id="report-button-action-cancelled"
                  className={activeTab === 'action-cancelled' ? 'active' : ''}
                  onClick={() => setActiveTab('action-cancelled')}>
                  Actions annulées ({actionsCancel.length})
                </DrawerLink>
                <hr />
                <DrawerLink
                  id="report-button-comment-created"
                  className={activeTab === 'comment-created' ? 'active' : ''}
                  onClick={() => setActiveTab('comment-created')}>
                  Commentaires ({comments.length})
                </DrawerLink>
                <hr />
              </>
            )}
            <DrawerLink id="report-button-passages" className={activeTab === 'passages' ? 'active' : ''} onClick={() => setActiveTab('passages')}>
              Passages ({passages.length})
            </DrawerLink>
            <DrawerLink
              id="report-button-rencontres"
              className={activeTab === 'rencontres' ? 'active' : ''}
              onClick={() => setActiveTab('rencontres')}>
              Rencontres ({rencontres.length})
            </DrawerLink>
            {!['restricted-access'].includes(user.role) && (
              <>
                <hr />
                <DrawerLink
                  id="report-button-territory-observations"
                  className={activeTab === 'territory-observations' ? 'active' : ''}
                  onClick={() => setActiveTab('territory-observations')}>
                  Observations ({observations.length})
                </DrawerLink>
                <hr />
                <DrawerLink
                  id="report-button-persons-created"
                  className={activeTab === 'persons-created' ? 'active' : ''}
                  onClick={() => setActiveTab('persons-created')}>
                  Personnes créées ({persons.length})
                </DrawerLink>
              </>
            )}
            {!!user.healthcareProfessional && (
              <>
                <hr />
                <DrawerLink
                  id="report-button-consultations"
                  className={activeTab === 'consultations' ? 'active' : ''}
                  onClick={() => setActiveTab('consultations')}>
                  Consultations faites ({consultationsDone.length})
                </DrawerLink>
                <DrawerLink
                  id="report-button-consultations-created"
                  className={activeTab === 'consultations-created' ? 'active' : ''}
                  onClick={() => setActiveTab('consultations-created')}>
                  Consultations créées ({consultationsCreatedAt.length})
                </DrawerLink>
                <DrawerLink
                  id="report-button-consultations-cancelled"
                  className={activeTab === 'consultations-cancelled' ? 'active' : ''}
                  onClick={() => setActiveTab('consultations-cancelled')}>
                  Consultations annulées ({consultationsCancel.length})
                </DrawerLink>
              </>
            )}
          </Drawer>
          <div
            ref={scrollContainer}
            style={{
              display: 'flex',
              overflow: 'auto',
              flex: 1,
              height: '100%',
              width: '100%',
              padding: '15px 25px 0px',
              backgroundColor: '#fff',
            }}>
            {activeTab === 'resume' && (
              <div style={{ overflow: 'auto', width: '100%', minHeight: '100%' }}>
                <DescriptionAndCollaborations reports={selectedTeamsReports} selectedTeamsObject={selectedTeamsObject} dateString={dateString} />
              </div>
            )}
            {activeTab === 'reception' && !!organisation.services && !!organisation.receptionEnabled && (
              <div style={{ overflow: 'auto', width: '100%', minHeight: '100%' }}>
                <Reception reports={selectedTeamsReports} dateString={dateString} selectedTeamsObject={selectedTeamsObject} />
              </div>
            )}
            {activeTab === 'action-completed' && (
              <div style={{ overflow: 'auto', width: '100%', minHeight: '100%' }}>
                <ActionCompletedAt date={dateString} status={DONE} actions={actionsDone} />
              </div>
            )}
            {activeTab === 'action-created' && (
              <div style={{ overflow: 'auto', width: '100%', minHeight: '100%' }}>
                <ActionCreatedAt date={dateString} actions={actionsCreatedAt} />
              </div>
            )}
            {activeTab === 'action-cancelled' && (
              <div style={{ overflow: 'auto', width: '100%', minHeight: '100%' }}>
                <ActionCompletedAt date={dateString} status={CANCEL} actions={actionsCancel} />
              </div>
            )}
            {activeTab === 'comment-created' && (
              <div style={{ overflow: 'auto', width: '100%', minHeight: '100%' }}>
                <CommentCreatedAt date={dateString} comments={comments} />
              </div>
            )}
            {activeTab === 'passages' && (
              <div style={{ overflow: 'auto', width: '100%', minHeight: '100%' }}>
                <PassagesCreatedAt date={dateString} passages={passages} />
              </div>
            )}
            {activeTab === 'rencontres' && (
              <div style={{ overflow: 'auto', width: '100%', minHeight: '100%' }}>
                <RencontresCreatedAt date={dateString} rencontres={rencontres} />
              </div>
            )}
            {activeTab === 'territory-observations' && (
              <div style={{ overflow: 'auto', width: '100%', minHeight: '100%' }}>
                <TerritoryObservationsCreatedAt date={dateString} reports={selectedTeamsReports} observations={observations} />
              </div>
            )}
            {activeTab === 'persons-created' && (
              <div style={{ overflow: 'auto', width: '100%', minHeight: '100%' }}>
                <PersonCreatedAt date={dateString} reports={selectedTeamsReports} persons={persons} />
              </div>
            )}
            {activeTab === 'consultations' && (
              <div style={{ overflow: 'auto', width: '100%', minHeight: '100%' }}>
                <Consultations date={dateString} status={DONE} consultations={consultationsDone} />
              </div>
            )}
            {activeTab === 'consultations-created' && (
              <div style={{ overflow: 'auto', width: '100%', minHeight: '100%' }}>
                <ConsultationsCreatedAt date={dateString} consultations={consultationsCreatedAt} />
              </div>
            )}
            {activeTab === 'consultations-cancelled' && (
              <div style={{ overflow: 'auto', width: '100%', minHeight: '100%' }}>
                <Consultations date={dateString} status={CANCEL} consultations={consultationsCancel} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {renderPrintOnly()}
      {renderScreenOnly()}
    </>
  );
};

const Reception = ({ reports, selectedTeamsObject, dateString }) => {
  const organisation = useRecoilValue(organisationState);
  const services = useMemo(() => {
    const reportsServices = reports.map((report) => (report?.services?.length ? JSON.parse(report?.services) : {}));

    const services = {};
    for (const service of organisation.services) {
      services[service] = reportsServices.reduce((total, teamServices) => total + (teamServices?.[service] || 0), 0);
    }
    return services;
  }, [reports, organisation.services]);
  const [show, toggleShow] = useState(true);

  useEffect(() => {
    window.sessionStorage.setItem(`services-general-${dateString}`, show);
  }, [show, dateString]);

  if (!organisation.receptionEnabled) return null;
  if (!organisation?.services) return null;

  return (
    <StyledBox>
      <TabTitle>Services effectués ce jour</TabTitle>
      {reports.length > 1 && (
        <ServicesWrapper show={show} showForPrint={window.sessionStorage.getItem(`services-general-${dateString}`) === 'true'}>
          <div className="team-name">
            <p>
              Services effectués par toutes les équipes sélectionnées
              <br />
              <small style={{ opacity: 0.5 }}>
                Ces données sont en lecture seule. Pour les modifier, vous devez le faire équipe par équipe (ci-dessous)
              </small>
            </p>
            <button className="toggle-show" type="button" onClick={() => toggleShow((s) => !s)}>
              {show ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          <div className="services-list">
            {organisation?.services?.map((service) => (
              <IncrementorSmall
                dataTestId={`general-${service}-${services[service] || 0}`}
                key={service}
                service={service}
                count={services[service] || 0}
                disabled
              />
            ))}
          </div>
        </ServicesWrapper>
      )}
      {reports.map((report) => (
        <Service
          report={report}
          key={report.team}
          withMultipleTeams={reports.length > 1}
          team={selectedTeamsObject[report.team]}
          dateString={dateString}
        />
      ))}
    </StyledBox>
  );
};

const Service = ({ report, team, withMultipleTeams, dateString }) => {
  const organisation = useRecoilValue(organisationState);
  const [show, toggleShow] = useState(!withMultipleTeams);

  if (!organisation.receptionEnabled) return null;
  if (!organisation?.services) return null;

  return (
    <ServicesWrapper show={show}>
      {!!withMultipleTeams && (
        <div className="team-name">
          <p>
            <b>
              {team.nightSession ? '🌒' : '☀️ '} {team?.name || ''}
            </b>{' '}
            - {getPeriodTitle(dateString, team?.nightSession)}
          </p>
          <button className="toggle-show" type="button" onClick={() => toggleShow((s) => !s)}>
            {show ? 'Masquer' : 'Afficher'}
          </button>
        </div>
      )}
      <div className="services-list">
        <ReceptionService team={team} report={report} dateString={dateString} dataTestIdPrefix={`${team.name}-`} />
      </div>
    </ServicesWrapper>
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

const ActionCompletedAt = ({ date, status, actions }) => {
  const data = actions;
  const history = useHistory();
  const organisation = useRecoilValue(organisationState);

  const [modalOpen, setModalOpen] = useState(false);

  if (!data) return <div />;

  const moreThanOne = data.length > 1;

  const completedAt = startOfToday().add(12, 'hours');

  return (
    <>
      <StyledBox>
        {status === DONE && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <CreateActionModal open={modalOpen} setOpen={(value) => setModalOpen(value)} completedAt={completedAt} isMulti />
            <div className="noprint" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <ButtonCustom
                icon={agendaIcon}
                onClick={() => setModalOpen(true)}
                color="primary"
                title={`Créer une nouvelle action faite le ${formatDateWithFullMonth(completedAt)}`}
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
          data={data.map((a) => (a.urgent ? { ...a, style: { backgroundColor: '#fecaca' } } : a))}
          onRowClick={(action) => history.push(`/action/${action._id}`)}
          rowKey="_id"
          dataTestId="name"
          columns={[
            {
              title: '',
              dataKey: 'urgent',
              small: true,
              render: (action) => {
                return (
                  <div className="tw-flex tw-items-center tw-justify-center tw-gap-1">
                    {!!action.urgent && <ExclamationMarkButton />}
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
            { title: 'Nom', dataKey: 'name', render: (action) => <ActionOrConsultationName item={action} /> },
            {
              title: 'Personne suivie',
              dataKey: 'person',
              render: (action) => <PersonName item={action} />,
            },
            { title: 'Statut', dataKey: 'status', render: (action) => <ActionStatus status={action.status} /> },
            {
              title: 'Équipe en charge',
              dataKey: 'team',
              render: (action) => (
                <div className="px-2 tw-flex-shrink-0">
                  <TagTeam teamId={action?.team} />
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

const ActionCreatedAt = ({ date, actions }) => {
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
          data={data.map((a) => (a.urgent ? { ...a, style: { backgroundColor: '#fecaca' } } : a))}
          onRowClick={(action) => history.push(`/action/${action._id}`)}
          rowKey="_id"
          dataTestId="name"
          columns={[
            {
              title: '',
              dataKey: 'urgent',
              small: true,
              render: (action) => {
                return (
                  <div className="tw-flex tw-items-center tw-justify-center tw-gap-1">
                    {!!action.urgent && <ExclamationMarkButton />}
                    {!!organisation.groupsEnabled && !!action.group && (
                      <span className="tw-text-3xl" aria-label="Action familiale" title="Action familiale">
                        👪
                      </span>
                    )}
                  </div>
                );
              },
            },
            { title: 'À faire le ', dataKey: 'dueAt', render: (d) => <DateBloc date={d.dueAt} /> },
            {
              title: 'Heure',
              dataKey: '_id',
              render: (action) => {
                if (!action.dueAt || !action.withTime) return null;
                return formatTime(action.dueAt);
              },
            },
            { title: 'Nom', dataKey: 'name', render: (action) => <ActionOrConsultationName item={action} /> },
            {
              title: 'Personne suivie',
              dataKey: 'person',
              render: (action) => <PersonName item={action} />,
            },
            { title: 'Statut', dataKey: 'status', render: (action) => <ActionStatus status={action.status} /> },
            {
              title: 'Équipe en charge',
              dataKey: 'team',
              render: (action) => <TagTeam teamId={action?.team} />,
            },
          ]}
        />
      </StyledBox>
      <hr />
    </>
  );
};

const Consultations = ({ date, status, consultations }) => {
  const data = consultations;
  const user = useRecoilValue(userState);
  const history = useHistory();

  if (!data) return <div />;
  const moreThanOne = data.length > 1;

  return (
    <>
      <StyledBox>
        <Table
          className="Table"
          title={`Consultation${moreThanOne ? 's' : ''} ${status === DONE ? 'faite' : 'annulée'}${
            moreThanOne ? 's' : ''
          } le ${formatDateWithFullMonth(date)}`}
          noData={`Pas de consultation ${status === DONE ? 'faite' : 'annulée'} ce jour`}
          data={data}
          onRowClick={(actionOrConsultation) =>
            history.push(`/person/${actionOrConsultation.person}?tab=Dossier+Médical&consultationId=${actionOrConsultation._id}`)
          }
          rowDisabled={(actionOrConsultation) => disableConsultationRow(actionOrConsultation, user)}
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
              render: (consultation) => <ActionOrConsultationName item={consultation} />,
            },
            {
              title: 'Personne suivie',
              dataKey: 'person',
              render: (consultation) => <PersonName item={consultation} />,
            },
            { title: 'Statut', dataKey: 'status', render: (consultation) => <ActionStatus status={consultation.status} /> },
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
          onRowClick={(actionOrConsultation) =>
            history.push(`/person/${actionOrConsultation.person}?tab=Dossier+Médical&consultationId=${actionOrConsultation._id}`)
          }
          rowDisabled={(actionOrConsultation) => disableConsultationRow(actionOrConsultation, user)}
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
              render: (action) => <PersonName item={action} />,
            },
            { title: 'Statut', dataKey: 'status', render: (action) => <ActionStatus status={action.status} /> },
          ]}
        />
      </StyledBox>
      <hr />
    </>
  );
};

const CommentCreatedAt = ({ date, comments }) => {
  const history = useHistory();
  const data = comments;
  const organisation = useRecoilValue(organisationState);

  if (!data) return <div />;

  return (
    <>
      <StyledBox>
        <Table
          className="Table"
          title={`Commentaires ajoutés le ${formatDateWithFullMonth(date)}`}
          data={data}
          noData="Pas de commentaire ajouté ce jour"
          onRowClick={(comment) => {
            try {
              history.push(`/${comment.type}/${comment[comment.type]._id}`);
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
              render: (comment) => <span>{dayjs(comment.date || comment.createdAt).format('HH:mm')}</span>,
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

const PassagesCreatedAt = ({ date, passages }) => {
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
                team: currentTeam._id,
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

const RencontresCreatedAt = ({ date, rencontres }) => {
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
                team: currentTeam._id,
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
        <Rencontre rencontre={rencontreToEdit} onFinished={() => setRencontreToEdit(null)} />
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
                  const time = dayjs(rencontre.date).format('HH:mm');
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
                  rencontre.person ? <PersonName item={rencontre} /> : <span style={{ opacity: 0.3, fontStyle: 'italic' }}>Anonyme</span>,
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

  return (
    <>
      <StyledBox>
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
              render: (obs) => <span>{dayjs(obs.observedAt || obs.createdAt).format('HH:mm')}</span>,
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

const PersonCreatedAt = ({ date, persons }) => {
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
              render: (obs) => <span>{dayjs(obs.createdAt).format('HH:mm')}</span>,
            },
            { title: 'Personne (nom)', dataKey: 'name' },
            {
              title: 'Utilisateur (créateur)',
              dataKey: 'user',
              render: (obs) => <UserName id={obs.user} />,
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
  const API = useApi();
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
                    ? await API.post({ path: '/report', body: prepareReportForEncryption(reportUpdate) })
                    : await API.put({ path: `/report/${reportAtDate._id}`, body: prepareReportForEncryption(reportUpdate) });
                  if (res.ok) {
                    setReports((reports) =>
                      isNew
                        ? [res.decryptedData, ...reports]
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

const Drawer = styled.nav`
  padding-top: 20px;
  padding-left: 10px;
  width: 200px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex-shrink: 0;
  height: 100%;
  background-color: ${theme.main}22;
  overflow: auto;
  button {
    text-align: left;
  }
  hr {
    margin-bottom: 0rem;
    margin-top: 1rem;
  }
`;

const DrawerLink = styled.a`
  text-decoration: none;
  cursor: pointer;
  padding: 0px;
  display: block;
  border-radius: 8px;
  color: #565a5b;
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 24px;
  margin: 2px 0;
  border: none;
  background: none;
  &.active {
    color: ${theme.main};
  }
`;

export default View;
