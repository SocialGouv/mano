import dayjs from 'dayjs';
import { useMMKVNumber } from 'react-native-mmkv';
import { useRecoilValue, useRecoilState } from 'recoil';
import { mergeItems } from '../components/Loader';
import { currentTeamState } from '../recoil/auth';
import { prepareReportForEncryption, reportsState } from '../recoil/reports';
import API from '../services/api';

const useCreateReportAtDateIfNotExist = () => {
  const currentTeam = useRecoilValue(currentTeamState);
  const [reports, setReports] = useRecoilState(reportsState);
  const [lastRefresh] = useMMKVNumber('mano-last-refresh-2022-11-04');

  return async (date) => {
    const latestReportsRes = await API.get({ path: '/report', query: { after: lastRefresh, withDeleted: true } });
    const allReports = mergeItems(reports, latestReportsRes.decryptedData);
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
