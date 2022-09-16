import React from 'react';
import { useHistory } from 'react-router-dom';
import { SmallHeader } from '../../components/header';
import { currentTeamState } from '../../recoil/auth';
import { useRecoilValue } from 'recoil';
import useTitle from '../../services/useTitle';
import { useDataLoader } from '../../components/DataLoader';
import ReportsMonthly from '../../components/ReportsMonthly';

const List = () => {
  useTitle('Comptes rendus');
  useDataLoader({ refreshOnMount: true });

  const currentTeam = useRecoilValue(currentTeamState);

  const history = useHistory();

  const onReportClick = async (report, date) => {
    if (report) return history.push(`/report/${report._id}`);
    history.push(`/report/new__${date}`);
  };

  return (
    <>
      <SmallHeader
        title={
          <span>
            Comptes rendus de l'équipe {currentTeam?.nightSession ? 'de nuit ' : ''}
            <b>{currentTeam?.name || ''}</b>
          </span>
        }
        refreshButton
      />
      <ReportsMonthly onReportClick={onReportClick} />
    </>
  );
};

export default List;
