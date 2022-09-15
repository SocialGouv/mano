import React, { useEffect, useMemo, useState } from 'react';
import { Button } from 'reactstrap';
import styled, { css } from 'styled-components';
import { selectorFamily, useRecoilValue } from 'recoil';
import { dayjsInstance } from '../services/date';
import { reportsState } from '../recoil/reports';
import { actionsState } from '../recoil/actions';
import { passagesState } from '../recoil/passages';
import { commentsState } from '../recoil/comments';
import { currentTeamState } from '../recoil/auth';
import { consultationsState } from '../recoil/consultations';
import { territoryObservationsState } from '../recoil/territoryObservations';

const dottedReportsFromMonthSelector = selectorFamily({
  key: 'dottedReportsFromMonthSelector',
  get:
    ({ startOfMonth, teamIds }) =>
    ({ get }) => {
      const reports = get(reportsState);
      const teamsReports = reports.filter((report) => teamIds.includes(report.team));
      const actions = get(actionsState);
      const teamsActions = actions.filter((action) => teamIds.includes(action.team));
      const passages = get(passagesState);
      const teamsPassages = passages.filter((passage) => teamIds.includes(passage.team));
      const comments = get(commentsState);
      const teamsComments = comments.filter((comment) => teamIds.includes(comment.team));
      const consultations = get(consultationsState);
      const observations = get(territoryObservationsState);
      const teamsObservations = observations.filter((obs) => teamIds.includes(obs.team));

      const firstDayOfMonth = dayjsInstance(startOfMonth).startOf('month');
      const firstDayToShow = firstDayOfMonth.startOf('week');
      const endOfMonth = dayjsInstance(startOfMonth).endOf('month');
      const lastDayToShow = endOfMonth.endOf('week');

      const dottedReports = {};
      for (let i = 0; i < lastDayToShow.diff(firstDayToShow, 'days'); i++) {
        const day = firstDayToShow.add(i, 'days');
        const teamsReportsFromDay = teamsReports.filter(
          (report) => dayjsInstance(report.date).isSame(day, 'day') && (!!report.description || !!report.collaborations?.length)
        );
        const teamsActionsCreatedAtFromDay = teamsActions.filter((action) => dayjsInstance(action.createdAt).isSame(day, 'day'));
        const teamsActionsDueAtFromDay = teamsActions.filter((action) => dayjsInstance(action.dueAt).isSame(day, 'day'));
        const teamsActionsCompletedAtFromDay = teamsActions.filter((action) => dayjsInstance(action.completedAt).isSame(day, 'day'));
        const passagesFromDay = teamsPassages.filter((passage) => dayjsInstance(passage.date).isSame(day, 'day'));
        const commentsFromDay = teamsComments.filter((comment) => dayjsInstance(comment.date).isSame(day, 'day'));
        const observationsFromDay = teamsObservations.filter((obs) => dayjsInstance(obs.observedAt).isSame(day, 'day'));
        const consultationsCreatedAtFromDay = consultations.filter((consultation) => dayjsInstance(consultation.createdAt).isSame(day, 'day'));
        const consultationsDueAtFromDay = consultations.filter((consultation) => dayjsInstance(consultation.dueAt).isSame(day, 'day'));
        const consultationsCompletedAtFromDay = consultations.filter((consultation) => dayjsInstance(consultation.completedAt).isSame(day, 'day'));
        const dotted =
          teamsReportsFromDay.length ||
          teamsActionsCreatedAtFromDay.length ||
          teamsActionsDueAtFromDay.length ||
          teamsActionsCompletedAtFromDay.length ||
          passagesFromDay.length ||
          commentsFromDay.length ||
          observationsFromDay.length ||
          consultationsCreatedAtFromDay.length ||
          consultationsDueAtFromDay.length ||
          consultationsCompletedAtFromDay.length;

        dottedReports[day.format('YYYY-MM-DD')] = dotted;
      }

      return dottedReports;
    },
});

export default function ReportsMonthly({ onReportClick }) {
  const [startOfMonth, setStartOfMonth] = useState(dayjsInstance(window.localStorage.getItem('startOfMonth') || new Date()).startOf('month'));
  const currentTeam = useRecoilValue(currentTeamState);
  const teamIds = useMemo(() => [currentTeam._id], [currentTeam]);
  const dottedReports = useRecoilValue(dottedReportsFromMonthSelector({ startOfMonth, teamIds }));

  const endOfMonth = useMemo(() => dayjsInstance(startOfMonth).endOf('month'), [startOfMonth]);
  const firstDayToShow = useMemo(() => dayjsInstance(startOfMonth).startOf('week'), [startOfMonth]);
  const lastDayToShow = useMemo(() => dayjsInstance(endOfMonth).endOf('week'), [endOfMonth]);
  const firstDaysToShow = useMemo(() => {
    const days = [];
    let day = firstDayToShow;
    while (day.isBefore(lastDayToShow)) {
      days.push(day);
      day = day.add(1, 'week');
    }
    return days;
  }, [firstDayToShow, lastDayToShow]);

  useEffect(() => {
    window.localStorage.setItem('startOfMonth', startOfMonth.toISOString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startOfMonth]);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'row', gap: '2rem', marginBottom: '1rem', alignItems: 'center' }}>
        <Button color="secondary" outline={true} onClick={() => setStartOfMonth(dayjsInstance().startOf('month'))}>
          Aujourd'hui
        </Button>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.2rem' }}>
          <Button size="sm" color="secondary" outline={true} onClick={() => setStartOfMonth(startOfMonth.subtract(1, 'month').startOf('month'))}>
            &lt;
          </Button>
          <Button size="sm" color="secondary" outline={true} onClick={() => setStartOfMonth(startOfMonth.add(1, 'month').startOf('month'))}>
            &gt;
          </Button>
        </div>
        <div style={{ textTransform: 'capitalize' }}>{startOfMonth.format('MMMM YYYY')}</div>
      </div>
      <WeekContainer>
        {[...Array(7)].map((_, index) => {
          const day = firstDayToShow.add(index, 'day');
          return (
            <DayButton key={day.format('YYYY-MM-DD')} disabled>
              <span style={{ fontSize: '11px' }}>{day.format('ddd')}</span>
            </DayButton>
          );
        })}
      </WeekContainer>
      {firstDaysToShow.map((firstDay) => (
        <WeekContainer key={firstDay}>
          {[...Array(7)].map((_, index) => {
            const day = firstDay.add(index, 'day');
            const isToday = day.isSame(dayjsInstance(), 'day');
            const isOutOfMonth = !day.isSame(startOfMonth, 'month');
            const dateString = day.format('YYYY-MM-DD');
            return (
              <DayButton aria-label={dateString} key={dateString} isOutOfMonth={isOutOfMonth} onClick={() => onReportClick(dateString)}>
                <DayContent isToday={isToday}>{isOutOfMonth && process.env.REACT_APP_TEST === 'true' ? '' : day.format('D')}</DayContent>
                {!!dottedReports[dateString] && <Dot />}
              </DayButton>
            );
          })}
        </WeekContainer>
      ))}
    </div>
  );
}

const WeekContainer = styled.div`
  display: flex;
  width: 100%;
  gap: 0.5rem;
  width: 100%;
`;

const outOfMonthCss = css`
  opacity: 0.2;
`;
const DayButton = styled.button`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: ${100 / 7}%;
  text-align: center;
  margin-top: 5px;
  margin-bottom: 5px;
  border: none;
  background-color: transparent;
  ${(p) => p.isOutOfMonth && outOfMonthCss}
`;

const todayCss = css`
  background-color: #1a73e8;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  color: white;
  line-height: 36px;
`;

const DayContent = styled.span`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  height: 4rem;
  width: 100%;
  ${(p) => p.isToday && todayCss}
`;

const Dot = styled.span`
  position: absolute;
  height: 4px;
  width: 4px;
  margin-left: auto;
  margin-right: auto;
  bottom: 8px;
  border-radius: 100%;
  background-color: black;
`;
