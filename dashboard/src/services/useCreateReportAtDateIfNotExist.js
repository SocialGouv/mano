import dayjs from 'dayjs';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { currentTeamState } from '../recoil/auth';
import { prepareReportForEncryption, reportsState } from '../recoil/reports';
import { currentTeamReportsSelector } from '../recoil/selectors';
import useApi from './api';

const useCreateReportAtDateIfNotExist = () => {
  const currentTeam = useRecoilValue(currentTeamState);
  const currentTeamReports = useRecoilValue(currentTeamReportsSelector);
  const setReports = useSetRecoilState(reportsState);
  const API = useApi();

  return async (date) => {
    date = dayjs(date).startOf('day').format('YYYY-MM-DD');
    const reportAtDate = currentTeamReports.find((report) => report.date === date);
    if (!!reportAtDate) return;
    const res = await API.post({ path: '/report', body: prepareReportForEncryption({ team: currentTeam._id, date }) });
    if (!res.ok) return;
    setReports((reports) => [res.decryptedData, ...reports]);
    return res.decryptedData;
  };
};

export default useCreateReportAtDateIfNotExist;
