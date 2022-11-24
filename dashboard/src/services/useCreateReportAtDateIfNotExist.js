import dayjs from 'dayjs';
import { useRecoilValue, useRecoilState } from 'recoil';
import { lastLoadState, mergeItems } from '../components/DataLoader';
import { currentTeamState } from '../recoil/auth';
import { prepareReportForEncryption, reportsState } from '../recoil/reports';
import useApi from './api';

const useCreateReportAtDateIfNotExist = () => {
  const currentTeam = useRecoilValue(currentTeamState);
  const [reports, setReports] = useRecoilState(reportsState);
  const lastLoad = useRecoilValue(lastLoadState);

  const API = useApi();

  return async (date) => {
    const latestReportsRes = await API.get({ path: '/report', query: { after: lastLoad, withDeleted: true } });
    const allReports = mergeItems([...reports, ...latestReportsRes.decryptedData]);
    setReports(allReports);
    date = dayjs(date).startOf('day').format('YYYY-MM-DD');
    const reportAtDate = allReports.find((report) => report.date === date && report.team === currentTeam._id);
    if (!!reportAtDate) return;
    const res = await API.post({ path: '/report', body: prepareReportForEncryption({ team: currentTeam._id, date }) });
    if (!res.ok) return;
    setReports((reports) => [res.decryptedData, ...reports]);
    return res.decryptedData;
  };
};

export default useCreateReportAtDateIfNotExist;
