import React, { useState } from 'react';
import { Container, Collapse } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import Header from '../../components/header';
import ButtonCustom from '../../components/ButtonCustom';
import { theme } from '../../config';
import styled from 'styled-components';
import { formatDateWithFullMonth, getDaysOfMonth, getMonths, isAfterToday, isOnSameDay } from '../../services/date';
import { currentTeamState } from '../../recoil/auth';
import { reportsState, useReports } from '../../recoil/reports';
import { useRefresh } from '../../recoil/refresh';
import { useRecoilValue } from 'recoil';

const List = () => {
  const currentTeam = useRecoilValue(currentTeamState);
  const allReports = useRecoilValue(reportsState);
  const { reportsRefresher, loading } = useRefresh();

  const reports = allReports.filter((r) => r.team === currentTeam._id);

  return (
    <Container style={{ padding: '40px 0' }}>
      <Header
        title={`Comptes rendus de l'équipe ${currentTeam?.nightSession ? 'de nuit ' : ''}${currentTeam?.name || ''}`}
        onRefresh={reportsRefresher}
        loading={loading}
      />
      {getMonths().map((date, index) => (
        <HitMonth debug={index === 0} date={date} key={date} reports={reports} team={currentTeam} />
      ))}
    </Container>
  );
};

const HitMonth = ({ date, reports, team, debug }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [submiting, setSubmiting] = useState(false);
  const { addReport } = useReports();

  const history = useHistory();

  const createReport = async (date) => {
    if (submiting) return;
    setSubmiting(true);

    const res = await addReport(date, team._id);
    if (!res.ok) return;
    history.push(`/report/${res.data._id}`);
  };

  const days = getDaysOfMonth(date).filter((day) => !isAfterToday(day));

  return (
    <div style={{ width: '100%' }}>
      <MonthButton
        onClick={() => setIsOpen(!isOpen)}
        title={`${date.toDate().toLocaleString('default', { month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' })} ${date
          .toDate()
          .getFullYear()}`}
      />
      <Collapse
        isOpen={isOpen}
        style={{
          marginBottom: '20px',
          justifyContent: 'center',
          display: isOpen ? 'flex' : 'none',
          flexWrap: 'wrap',
          width: '100%',
        }}>
        {days.map((day) => {
          const report = reports.find((rep) => isOnSameDay(rep.date, day));
          if (report) {
            return <FullButton onClick={() => history.push(`/report/${report._id}`)} key={day} title={`${formatDateWithFullMonth(day.toDate())} `} />;
          }
          return <EmptyButton onClick={() => createReport(day)} key={day} title={`${formatDateWithFullMonth(day.toDate())} `} />;
        })}
      </Collapse>
    </div>
  );
};

const EmptyButton = styled(ButtonCustom)`
  display: inline-flex;
  border: 1px solid ${theme.main25};
  color: ${theme.main};
  margin-right: 5px;
  margin-bottom: 5px;
  background-color: #fff;
  flex-basis: 160px;
  font-size: 13px;
`;

const FullButton = styled(EmptyButton)`
  border: 1px solid ${theme.main25};
  background-color: ${theme.main};
  color: #fff;
`;

const MonthButton = styled(EmptyButton)`
  border: 1px solid ${theme.main75};
  width: 100%;
  max-width: 100%;
  color: ${theme.main};
  background-color: #fff;
  font-size: 13px;
  margin: 0px;
  margin-bottom: 20px;
`;

export default List;
