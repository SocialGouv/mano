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
import { CANCEL, DONE, TODO, actionsState } from '../../recoil/actions';
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
import ServicesReport from './components/ServicesReport';
import DateRangePickerWithPresets, { formatPeriod, reportsPresets } from '../../components/DateRangePickerWithPresets';

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
    ({ period, viewAllOrganisationData, selectedTeamsObjectWithOwnPeriod }) =>
    ({ get }) => {
      const filterItemByTeam = (item, key) => {
        if (viewAllOrganisationData) return true;
        if (Array.isArray(item[key])) {
          for (const team of item[key]) {
            if (selectedTeamsObjectWithOwnPeriod[team]) return true;
          }
        }
        return !!selectedTeamsObjectWithOwnPeriod[item[key]];
      };

      const allPersons = get(arrayOfitemsGroupedByPersonSelector);
      const allObservations = get(onlyFilledObservationsTerritories);
      const allPassages = get(passagesState);

      const defaultIsoDates = {
        isoStartDate: dayjs(period.startDate).startOf('day').toISOString(),
        isoEndDate: dayjs(period.endDate).startOf('day').add(1, 'day').toISOString(),
      };

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
          const { isoStartDate, isoEndDate } = selectedTeamsObjectWithOwnPeriod[person.assignedTeams] ?? defaultIsoDates;
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
        // get actions for period
        for (const action of person.actions || []) {
          if (!filterItemByTeam(action, 'teams')) continue;
          if (Array.isArray(action.teams)) {
            let isIncluded = false;
            for (const team of action.teams) {
              const { isoStartDate, isoEndDate } = selectedTeamsObjectWithOwnPeriod[team] ?? defaultIsoDates;
              if (action.completedAt >= isoStartDate && action.completedAt < isoEndDate) {
                isIncluded = true;
                continue;
              }
              if (action.status !== TODO) continue;
              if (action.dueAt >= isoStartDate && action.dueAt < isoEndDate) {
                isIncluded = true;
              }
            }
            if (!isIncluded) continue;
            actions[action._id] = action;
          }
        }
        for (const consultation of person.consultations || []) {
          if (!filterItemByTeam(consultation, 'teams')) continue;
          if (Array.isArray(consultation.teams)) {
            let isIncluded = false;
            for (const team of consultation.teams) {
              const { isoStartDate, isoEndDate } = selectedTeamsObjectWithOwnPeriod[team] ?? defaultIsoDates;
              if (consultation.completedAt >= isoStartDate && consultation.completedAt < isoEndDate) {
                isIncluded = true;
                continue;
              }
              if (consultation.status !== TODO) continue;
              if (consultation.dueAt >= isoStartDate && consultation.dueAt < isoEndDate) {
                isIncluded = true;
              }
            }
            if (!isIncluded) continue;
            consultations[consultation._id] = consultation;
          }
        }
        for (const rencontre of person.rencontres || []) {
          if (!filterItemByTeam(rencontre, 'team')) continue;
          const date = rencontre.date;
          const { isoStartDate, isoEndDate } = selectedTeamsObjectWithOwnPeriod[rencontre.team] ?? defaultIsoDates;
          if (date < isoStartDate) continue;
          if (date >= isoEndDate) continue;
          rencontres[rencontre._id] = rencontre;
        }
        for (const commentMedical of person.commentsMedical || []) {
          if (!filterItemByTeam(commentMedical, 'team')) continue;
          const date = commentMedical.date;
          const { isoStartDate, isoEndDate } = selectedTeamsObjectWithOwnPeriod[commentMedical.team] ?? defaultIsoDates;
          if (date < isoStartDate) continue;
          if (date >= isoEndDate) continue;
          commentsMedical[commentMedical._id] = commentMedical;
        }
        for (const comment of person.comments || []) {
          if (!filterItemByTeam(comment, 'team')) continue;
          const date = comment.date;
          const { isoStartDate, isoEndDate } = selectedTeamsObjectWithOwnPeriod[comment.team] ?? defaultIsoDates;
          if (date < isoStartDate) continue;
          if (date >= isoEndDate) continue;
          comments[comment._id] = comment;
        }
      }

      // all passages here and not above because some passages are not linked to a person
      for (const passage of allPassages) {
        if (!filterItemByTeam(passage, 'team')) continue;
        const date = passage.date;
        const { isoStartDate, isoEndDate } = selectedTeamsObjectWithOwnPeriod[passage.team] ?? defaultIsoDates;
        if (date < isoStartDate) continue;
        if (date >= isoEndDate) continue;
        passages[passage._id] = passage;
      }

      for (const observation of allObservations) {
        if (!filterItemByTeam(observation, 'team')) continue;
        const date = observation.observedAt;
        const { isoStartDate, isoEndDate } = selectedTeamsObjectWithOwnPeriod[observation.team] ?? defaultIsoDates;
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
  const [preset, setPreset, removePreset] = useLocalStorage('reports-date-preset', "Aujourd'hui");
  let [period, setPeriod] = useLocalStorage('reports-period', { startDate: null, endDate: null });
  console.log({ preset, period });
  if (!period.startDate || !period.endDate) {
    const presetPeriod = reportsPresets.find((p) => p.label === preset);
    if (presetPeriod) {
      period = presetPeriod.period;
    } else {
      period = reportsPresets[0].period;
    }
  }

  console.log({ preset, period });

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
  const selectedTeamsObjectWithOwnPeriod = useMemo(() => {
    const teamsIdsObject = {};
    for (const team of selectedTeams) {
      const offsetHours = team.nightSession ? 12 : 0;
      const isoStartDate = dayjs(period.startDate).startOf('day').add(offsetHours, 'hour').toISOString();
      const isoEndDate = dayjs(period.endDate).startOf('day').add(1, 'day').add(offsetHours, 'hour').toISOString();
      teamsIdsObject[team._id] = {
        isoStartDate,
        isoEndDate,
      };
    }
    return teamsIdsObject;
  }, [selectedTeams, viewAllOrganisationData, period]);

  const isSingleDay = period.startDate === period.endDate;
  const allReports = useRecoilValue(reportsState);
  const reportsFromDay = useMemo(
    () => (isSingleDay ? allReports.filter((report) => report.date === period.startDate) : []),
    [isSingleDay, period, allReports]
  );
  const history = useHistory();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const { personsCreated, personsUpdated, actions, consultations, comments, commentsMedical, passages, rencontres, observations } = useRecoilValue(
    itemsForReportsSelector({
      period,
      viewAllOrganisationData,
      selectedTeamsObjectWithOwnPeriod,
    })
  );

  const [personSortBy, setPersonSortBy] = useLocalStorage('person-sortBy', 'name');
  const [personSortOrder, setPersonSortOrder] = useLocalStorage('person-sortOrder', 'ASC');

  useTitle(`${dayjs(dateString).format('DD-MM-YYYY')} - Compte rendu`);

  useEffect(() => {
    // for print use only
    document.title = `Compte rendu Mano - Organisation ${organisation.name} - ${dayjs(dateString).format('DD-MM-YYYY')} - imprimé par ${user.name}`;
    return () => {
      document.title = 'Mano - Admin';
    };
  });

  return (
    <>
      <HeaderStyled className=" !tw-py-4 tw-px-0">
        <div className="noprint tw-flex tw-grow">
          <HeaderTitle className="tw-w-96 tw-font-normal">
            <span>
              Comptes rendus {viewAllOrganisationData ? <>de toutes les équipes</> : <>{selectedTeams.length > 1 ? 'des équipes' : "de l'équipe"}</>}
            </span>
          </HeaderTitle>
          <div className="tw-ml-4">
            <SelectTeamMultiple
              onChange={(teamIds) => {
                setSelectedTeamIds(teamIds);
              }}
              value={selectedTeams.map((e) => e?._id)}
              colored
              isDisabled={viewAllOrganisationData}
            />
            {teams.length > 1 && (
              <label htmlFor="viewAllOrganisationData" className="tw-flex tw-items-center tw-text-sm">
                <input
                  id="viewAllOrganisationData"
                  type="checkbox"
                  className="tw-mr-2.5"
                  checked={viewAllOrganisationData}
                  value={viewAllOrganisationData}
                  onChange={() => setViewAllOrganisationData(!viewAllOrganisationData)}
                />
                Comptes rendus de toute l'organisation
              </label>
            )}
          </div>
        </div>
      </HeaderStyled>
      <div className="noprint date-picker-container tw-mb-5 tw-flex tw-flex-wrap tw-items-center">
        <div className="tw-min-w-[15rem] tw-shrink-0 tw-p-0">
          <DateRangePickerWithPresets
            presets={reportsPresets}
            period={period}
            setPeriod={setPeriod}
            preset={preset}
            setPreset={setPreset}
            removePreset={removePreset}
          />
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
        <div className="tw-ml-auto tw-flex tw-items-center tw-justify-end">
          <ButtonCustom color="link" title="Imprimer" onClick={window.print} />
          {/* <ExportFormattedData
            observations={observations}
            passages={passagesFilteredByPersons}
            rencontres={rencontresFilteredByPersons}
            personCreated={personsCreated}
            personUpdated={personsUpdated}
            actions={actionsWithDetailedGroupAndCategories}
            consultations={consultationsFilteredByPersons}
          /> */}
        </div>
      </div>
      <div className="noprint -tw-mx-12 tw-flex tw-h-full tw-flex-col">
        <div
          className={[
            'noprint tw-mt-4 tw-flex tw-w-full tw-grow tw-basis-full',
            viewAllOrganisationData || selectedTeamIds.length ? 'tw-flex' : 'tw-hidden',
          ].join(' ')}>
          <div className="tw-min-h-1/2 tw-basis-5/12 tw-overflow-auto">
            <div className="tw-mb-4 tw-h-[50vh] tw-overflow-hidden tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
              <ActionsOrConsultations actions={actions} consultations={consultations} />
            </div>
            <div className="tw-h-[50vh] tw-overflow-hidden tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">{/* Comments */}</div>
          </div>
          <div className="tw-min-h-full tw-basis-4/12 tw-overflow-auto">
            {/* <ActionsOrConsultations person={person} /> */}
            <ServicesReport selectedTeamsObject={selectedTeamsObject} period={period} />
          </div>

          <div className="tw-h-0 tw-min-h-full tw-basis-3/12 tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
            {/* {['restricted-access'].includes(user.role) ? <PassagesRencontres person={person} /> : <Comments person={person} />} */}
          </div>
        </div>
      </div>
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

export default View;
