import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { addOneDay, dateForDatePicker, formatDateWithNameOfDay } from '../../services/date';
import { HeaderStyled, Title as HeaderTitle } from '../../components/header';
import { ModalBody, ModalContainer, ModalFooter, ModalHeader } from '../../components/tailwind/Modal';

import dayjs from 'dayjs';
import { TODO } from '../../recoil/actions';
import ButtonCustom from '../../components/ButtonCustom';
import { currentTeamState, organisationState, teamsState, userState } from '../../recoil/auth';
import { reportsState } from '../../recoil/reports';
import { selectorFamily, useRecoilValue } from 'recoil';
import { passagesState } from '../../recoil/passages';
import useTitle from '../../services/useTitle';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import { arrayOfitemsGroupedByPersonSelector, onlyFilledObservationsTerritories } from '../../recoil/selectors';
import { ActionsOrConsultations } from './components/ActionsReport';
import ServicesReport from './components/ServicesReport';
import DateRangePickerWithPresets, { reportsPresets } from '../../components/DateRangePickerWithPresets';
import { CommentsSocialAndMedical } from './components/CommentsReport';
import { PassagesReport } from './components/PassagesReport';
import { RencontresReport } from './components/RencontresReport';
import { ObservationsReport } from './components/ObservationsReport';
import { PersonsReport } from './components/PersonsReport';
import Transmissions from './components/Transmissions';
import { useLocalStorage } from '../../services/useLocalStorage';

const getPeriodTitle = (date, nightSession) => {
  if (!nightSession) return `Journée du ${formatDateWithNameOfDay(date)}`;
  const nextDay = addOneDay(date);
  return (
    <>
      <span className="tw-m-0 tw-text-center">
        Nuit du {formatDateWithNameOfDay(date)} au {formatDateWithNameOfDay(nextDay)}
      </span>
      <span className="tw-m-0 tw-text-center tw-text-xs tw-opacity-50">
        On affiche les actions faites/à faire entre midi de ce jour et 11h59 du jour suivant
      </span>
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
      const allReports = get(reportsState);

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
      const reports = {};

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
          comments[comment._id] = { ...comment, person: person._id };
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

      for (const report of allReports) {
        if (!filterItemByTeam(report, 'team')) continue;
        const date = report.date;
        const { isoStartDate, isoEndDate } = defaultIsoDates;
        if (date < isoStartDate) continue;
        if (date >= isoEndDate) continue;
        reports[report._id] = report;
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
        reports: Object.values(reports),
      };
    },
});

const defaultPreset = reportsPresets[0];

const View = () => {
  const { dateString } = useParams();
  const organisation = useRecoilValue(organisationState);
  const user = useRecoilValue(userState);
  const currentTeam = useRecoilValue(currentTeamState);
  const teams = useRecoilValue(teamsState);
  const [viewAllOrganisationData, setViewAllOrganisationData] = useLocalStorage('reports-allOrg', teams.length === 1);
  const [selectedTeamIds, setSelectedTeamIds] = useLocalStorage('reports-teams', [currentTeam._id]);
  const [showWarning, setShowWarning] = useLocalStorage('reports-beta-warnign', true);

  const [preset, setPreset, removePreset] = useLocalStorage('reports-date-preset', null);
  let [period, setPeriod] = useLocalStorage('reports-period', {
    startDate: dateForDatePicker(defaultPreset.period.startDate),
    endDate: dateForDatePicker(defaultPreset.period.endDate),
  });

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
  }, [selectedTeams, period]);

  const { personsCreated, actions, consultations, comments, commentsMedical, passages, rencontres, observations, reports } = useRecoilValue(
    itemsForReportsSelector({
      period,
      viewAllOrganisationData,
      selectedTeamsObjectWithOwnPeriod,
    })
  );

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
            {!selectedTeams.length && <p className="tw-mx-auto tw-w-full tw-text-center">Sélectionnez une équipe 👆</p>}
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
            defaultPreset={defaultPreset}
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
      {!!selectedTeams.length && (
        <div className="noprint -tw-mx-12 tw-flex tw-h-full tw-flex-col">
          <div
            className={[
              'noprint tw-mt-4 tw-flex tw-w-full tw-grow tw-basis-full tw-items-start',
              viewAllOrganisationData || selectedTeamIds.length ? 'tw-flex' : 'tw-hidden',
            ].join(' ')}>
            <div className="tw-mb-12 tw-min-h-1/2 tw-basis-6/12 tw-overflow-auto">
              <div className="tw-mb-4 tw-h-[50vh] tw-overflow-hidden tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
                <ActionsOrConsultations actions={actions} consultations={consultations} />
              </div>
              <div className="tw-h-[50vh] tw-overflow-hidden tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow">
                <CommentsSocialAndMedical comments={comments} commentsMedical={commentsMedical} />
              </div>
            </div>
            <div className="tw-mx-4 tw-mb-12 tw-basis-3/12 ">
              <div className="tw-mb-4 tw-flex tw-flex-wrap tw-gap-y-4">
                <div className="tw-basis-1/2">
                  <div className="tw-mr-2 tw-rounded-lg tw-border tw-border-zinc-200 tw-bg-main tw-shadow-2xl">
                    <PassagesReport passages={passages} period={period} selectedTeams={selectedTeams} />
                  </div>
                </div>
                <div className="tw-basis-1/2">
                  <div className="tw-ml-2 tw-rounded-lg tw-border tw-border-zinc-200 tw-bg-main tw-shadow">
                    <RencontresReport rencontres={rencontres} period={period} selectedTeams={selectedTeams} />
                  </div>
                </div>
                <div className="tw-basis-1/2">
                  <div className="tw-mr-2 tw-rounded-lg tw-border tw-border-zinc-200 tw-bg-main tw-shadow">
                    <ObservationsReport observations={observations} period={period} selectedTeams={selectedTeams} />
                  </div>
                </div>
                <div className="tw-basis-1/2">
                  <div className="tw-ml-2 tw-rounded-lg tw-border tw-border-zinc-200 tw-bg-main tw-shadow">
                    <PersonsReport personsCreated={personsCreated} period={period} selectedTeams={selectedTeams} />
                  </div>
                </div>
              </div>
              <div className="tw-rounded-lg tw-border tw-border-zinc-200 tw-bg-gray-100 tw-shadow">
                <ServicesReport selectedTeamsObject={selectedTeamsObject} period={period} />
              </div>
            </div>

            <div className="tw-maxh tw-mr-2 tw-mb-12 tw-basis-3/12 tw-overflow-auto tw-rounded-lg tw-border tw-border-zinc-200 tw-shadow ">
              <Transmissions period={period} selectedTeamsObject={selectedTeamsObject} reports={reports} />
            </div>
          </div>
        </div>
      )}
      <ModalContainer open={showWarning} size="prose" onClose={() => setShowWarning(false)}>
        <ModalHeader title="Comptes-rendus - Version Beta" onClose={() => setShowWarning(false)} />
        <ModalBody className="tw-p-4">
          <p>
            Ce module est en cours de développement.
            <br />
            Il est possible que vous rencontriez des bugs.
            <br />
            N'hésitez pas à nous faire remonter les problèmes rencontrés.
            <br />
            <br />
            Merci beaucoup !
          </p>
        </ModalBody>
        <ModalFooter>
          <button type="button" onClick={() => setShowWarning(false)} className="button-submit">
            🧐 Bien compris
          </button>
        </ModalFooter>
      </ModalContainer>
    </>
  );
};

export default View;
