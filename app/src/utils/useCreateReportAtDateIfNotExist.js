import dayjs from 'dayjs';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { currentTeamState } from '../recoil/auth';
import { reportsState } from '../recoil/reports';
import { currentTeamReportsSelector } from '../scenes/Reports/selectors';
import API from '../services/api';

const useCreateReportAtDateIfNotExist = () => {
  const currentTeam = useRecoilValue(currentTeamState);
  const currentTeamReports = useRecoilValue(currentTeamReportsSelector);
  const setReports = useSetRecoilState(reportsState);

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
