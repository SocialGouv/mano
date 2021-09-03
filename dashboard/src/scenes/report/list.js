import React, { useContext, useState } from 'react';
import { Container, Collapse } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { toastr } from 'react-redux-toastr';

import Header from '../../components/header';

import { toFrenchDate } from '../../utils';
import AuthContext from '../../contexts/auth';
import ReportsContext from '../../contexts/reports';
import ButtonCustom from '../../components/ButtonCustom';
import { theme } from '../../config';
import styled from 'styled-components';
import { getMonths, isOnSameDay } from '../../services/date';

const List = () => {
  const { currentTeam } = useContext(AuthContext);
  const { reports: allReports, loading, refreshReports } = useContext(ReportsContext);

  const reports = allReports.filter((r) => r.team === currentTeam._id);

  return (
    <Container style={{ padding: '40px 0' }}>
      <Header title={`Comptes Rendus de l'équipe ${currentTeam?.name || ''}`} onRefresh={refreshReports} loading={loading} />
      {getMonths().map((date, index) => (
        <HitMonth debug={index === 0} date={date} key={date} reports={reports} team={currentTeam} />
      ))}
    </Container>
  );
};

const HitMonth = ({ date, reports, team, debug }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [submiting, setSubmiting] = useState(false);
  const { addReport } = useContext(ReportsContext);

  const history = useHistory();

  const createReport = async (date) => {
    if (submiting) return;
    setSubmiting(true);

    const res = await addReport(date, team._id);
    if (!res.ok) return;
    toastr.success('Report created !');
    history.push(`/report/${res.data._id}`);
  };

  let newDate = new Date(date);
  const days = [];
  while (newDate.getMonth() === date.getMonth() && newDate < new Date()) {
    days.push(new Date(newDate));
    newDate.setDate(newDate.getDate() + 1);
  }

  return (
    <div style={{ width: '100%' }}>
      <MonthButton onClick={() => setIsOpen(!isOpen)} title={`${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`} />
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
          const report = reports.find((rep) => isOnSameDay(new Date(rep.date), day));
          if (report) {
            return <FullButton onClick={() => history.push(`/report/${report._id}`)} key={day} title={`${toFrenchDate(day)} `} />;
          }
          return <EmptyButton onClick={() => createReport(day)} key={day} title={`${toFrenchDate(day)} `} />;
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
