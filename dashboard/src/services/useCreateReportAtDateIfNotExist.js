import dayjs from 'dayjs';
import { useRef } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import { lastLoadState, mergeItems } from '../components/DataLoader';
import { currentTeamState } from '../recoil/auth';
import { prepareReportForEncryption, reportsState } from '../recoil/reports';
import useApi from './api';

const useCreateReportAtDateIfNotExist = () => {
  const currentTeam = useRecoilValue(currentTeamState);
  const [reports, setReports] = useRecoilState(reportsState);
  const lastLoad = useRecoilValue(lastLoadState);
  // https://stackoverflow.com/questions/280389/how-do-you-find-out-the-caller-function-in-javascript
  const component = useRef(new Error().stack.split('\n')[2].trim().split(' ')[1]);

  const API = useApi();

  return async (date) => {
    const latestReportsRes = await API.get({ path: '/report', query: { after: lastLoad, withDeleted: true } });
    const allReports = mergeItems(reports, latestReportsRes.decryptedData);
    if (latestReportsRes.decryptedData.length) setReports(allReports);
    date = dayjs(date).startOf('day').format('YYYY-MM-DD');
    const reportAtDate = allReports.find((report) => report.date === date && report.team === currentTeam._id);
    if (!!reportAtDate) return reportAtDate;
    // get the name of the Component that called this function
    const res = await API.post({
      path: '/report',
      body: prepareReportForEncryption({ team: currentTeam._id, date }),
      headers: {
        'debug-report-component': 'useCreateReportAtDateIfNotExist',
        'debug-report-parent-component': parentComponent.current,
        // https://stackoverflow.com/questions/280389/how-do-you-find-out-the-caller-function-in-javascript
        'debug-report-function': new Error().stack?.split('\n')[2]?.trim().split(' ')[1],
      },
    });
    if (!res.ok) return;
    setReports((reports) => [res.decryptedData, ...reports]);
    return res.decryptedData;
  };
};

export default useCreateReportAtDateIfNotExist;
