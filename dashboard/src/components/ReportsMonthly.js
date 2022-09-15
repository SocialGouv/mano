import React, { useEffect, useMemo, useState } from 'react';
import { Button } from 'reactstrap';
import styled, { css } from 'styled-components';
import { useRecoilValue } from 'recoil';
import { currentTeamReportsSelector } from '../recoil/selectors';
import { dayjsInstance } from '../services/date';

// TODO: remove inline style when UI is stabilized.

export default function ReportsMonthly({ onReportClick }) {
  const reports = useRecoilValue(currentTeamReportsSelector);
  const [startOfMonth, setStartOfMonth] = useState(dayjsInstance(window.localStorage.getItem('startOfMonth') || new Date()).startOf('month'));

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
            const report = reports.find((rep) => rep.date === dateString);
            return (
              <DayButton aria-label={dateString} key={dateString} isOutOfMonth={isOutOfMonth} onClick={() => onReportClick(report, dateString)}>
                <DayContent isToday={isToday}>{process.env.REACT_APP_TEST === 'true' ? '' : day.format('D')}</DayContent>
                {!!report && <Dot />}
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
