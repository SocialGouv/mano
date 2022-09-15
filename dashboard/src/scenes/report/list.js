import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { SmallHeader } from '../../components/header';
import { currentTeamState } from '../../recoil/auth';
import { prepareReportForEncryption, reportsState } from '../../recoil/reports';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import useApi from '../../services/api';
import { currentTeamReportsSelector } from '../../recoil/selectors';
import useTitle from '../../services/useTitle';
import { useDataLoader } from '../../components/DataLoader';
import ReportsMonthly from '../../components/ReportsMonthly';

const List = () => {
  useTitle('Comptes rendus');
  useDataLoader({ refreshOnMount: true });

  const currentTeam = useRecoilValue(currentTeamState);
  const reports = useRecoilValue(currentTeamReportsSelector);
  const [submiting, setSubmiting] = useState(false);
  const API = useApi();
  const setReports = useSetRecoilState(reportsState);

  const history = useHistory();

  const onReportClick = async (date) => {
    if (submiting) return;
    setSubmiting(true);
    const existingReport = reports.find((r) => r.date === date && r.team === currentTeam._id);
    if (!!existingReport) return history.push(`/report/${existingReport._id}`);
    const res = await API.post({ path: '/report', body: prepareReportForEncryption({ team: currentTeam._id, date }) });
    if (!res.ok) return;
    setReports((reports) => [res.decryptedData, ...reports].sort((r1, r2) => r2.date.localeCompare(r1.date)));
    history.push(`/report/${res.data._id}`);
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
