import { useRecoilValue } from 'recoil';
import { reportsState } from '../recoil/reports';

const DuplicatedReportsTestChecker = () => {
  const reports = useRecoilValue(reportsState);
  const duplicateReports = Object.entries(
    reports.reduce((reportsByDate, report) => {
      if (!reportsByDate[`${report.date}-${report.team}`]) reportsByDate[`${report.date}-${report.team}`] = [];
      reportsByDate[`${report.date}-${report.team}`].push(report);
      return reportsByDate;
    }, {})
  ).filter(([key, reportsByDate]) => reportsByDate.length > 1);
  if (duplicateReports.length === 0) return null;
  return (
    <div className="tw-fixed tw-inset-0 tw-z-[999999999] tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-bg-red-500">
      <p className="tw-text-4xl tw-font-bold tw-text-white">Many reports for the same team and date exists - you failed the test</p>
      <img
        src="https://media2.giphy.com/media/CkuExgcOmraBlFowpQ/giphy.gif?cid=6104955exbo839oh8np0ruy6x8ezdu1vrm45thbudvn2gq56&rid=giphy.gif&ct=g"
        alt="you failed"
      />
      <details>
        <summary>Show duplicates reports</summary>
        <pre>{JSON.stringify(duplicateReports, null, 2)}</pre>
      </details>
    </div>
  );
};

export default DuplicatedReportsTestChecker;
