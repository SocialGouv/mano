import React, { useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { useHistory, useLocation } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { Button } from 'reactstrap';
import { HeaderStyled, RefreshButton, Title as HeaderTitle } from '../../components/header';
import { currentTeamState, teamsState } from '../../recoil/auth';
import useTitle from '../../services/useTitle';
import { useDataLoader } from '../../components/DataLoader';
import SelectTeamMultiple from '../../components/SelectTeamMultiple';
import { dayjsInstance } from '../../services/date';
import { selectedTeamsReportsSelector } from '../../recoil/selectors';
import useSearchParamState from '../../services/useSearchParamState';

const List = () => {
  useTitle('Comptes rendus');
  useDataLoader({ refreshOnMount: true });

  const currentTeam = useRecoilValue(currentTeamState);
  const teams = useRecoilValue(teamsState);
  const [viewAllOrganisationData, setViewAllOrganisationData] = useState(teams.length === 1);
  const [selectedTeamIds, setSelectedTeamIds] = useSearchParamState('reportsTeams', [currentTeam._id], {
    resetToDefaultIfTheFollowingValueChange: currentTeam._id,
  });
  const reports = useRecoilValue(selectedTeamsReportsSelector({ teamIds: selectedTeamIds }));

  const history = useHistory();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const onReportClick = async (dateString) => {
    searchParams.set('reportsTeam', JSON.stringify(selectedTeamIds));
    history.push(`/report/${dateString}?${searchParams.toString()}`);
  };

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
    <>
      <HeaderStyled style={{ padding: '16px 0' }}>
        <div style={{ display: 'flex', flexGrow: '1' }}>
          <HeaderTitle style={{ fontWeight: '400', flexShrink: 0 }}>
            <span>
              Comptes rendus{' '}
              {viewAllOrganisationData ? <>de toutes les équipes</> : <>{selectedTeamIds.length > 1 ? 'des équipes' : "de l'équipe"}</>}
            </span>
          </HeaderTitle>
          <div style={{ marginLeft: '1rem' }}>
            <SelectTeamMultiple onChange={setSelectedTeamIds} value={selectedTeamIds} colored isDisabled={viewAllOrganisationData} />
            {teams.length > 1 && (
              <label htmlFor="viewAllOrganisationData" style={{ fontSize: '14px' }}>
                <input
                  id="viewAllOrganisationData"
                  type="checkbox"
                  style={{ marginRight: '0.5rem' }}
                  onChange={() => setViewAllOrganisationData(!viewAllOrganisationData)}
                />
                Comptes rendus de toutes les équipes
              </label>
            )}
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <RefreshButton />
          </div>
        </div>
      </HeaderStyled>
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
                <DayButton aria-label={dateString} key={dateString} isOutOfMonth={isOutOfMonth} onClick={() => onReportClick(dateString)}>
                  <DayContent isToday={isToday}>{isOutOfMonth && process.env.REACT_APP_TEST === 'true' ? '' : day.format('D')}</DayContent>
                  {!!report && <Dot data-test-id={`report-dot-${dateString}`} />}
                </DayButton>
              );
            })}
          </WeekContainer>
        ))}
      </div>
    </>
  );
};

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

export default List;
