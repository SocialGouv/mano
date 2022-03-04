import dayjs from 'dayjs';
import { atom, useRecoilState } from 'recoil';
import { useComments } from '../recoil/comments';
import useApi from '../services/api';
import { capture } from '../services/sentry';

export const reportsState = atom({
  key: 'reportsState',
  default: [],
});

export const useReports = () => {
  const { addComment } = useComments();
  const API = useApi();

  const [reports, setReports] = useRecoilState(reportsState);

  const deleteReport = async (id) => {
    const res = await API.delete({ path: `/report/${id}` });
    if (res.ok) setReports((reports) => reports.filter((p) => p._id !== id));
    return res;
  };

  const updateReport = async (report) => {
    try {
      const res = await API.put({ path: `/report/${report._id}`, body: prepareReportForEncryption(report) });
      if (res.ok) {
        setReports((reports) =>
          reports.map((a) => {
            if (a._id === report._id) return res.decryptedData;
            return a;
          })
        );
      }
      return res;
    } catch (error) {
      capture('error in updating report' + error, { extra: { error, report } });
      return { ok: false, error: error.message };
    }
  };

  const addReport = async (date, team) => {
    try {
      const existingReport = reports.find((r) => r.date === date && r.team === team);
      if (existingReport) return { ok: true, data: existingReport };
      const res = await API.post({ path: '/report', body: prepareReportForEncryption({ team, date }) });
      if (!res.ok) return res;
      setReports((reports) => [res.decryptedData, ...reports].sort((r1, r2) => (dayjs(r1.date).isBefore(dayjs(r2.date), 'day') ? 1 : -1)));
      return res;
    } catch (error) {
      capture('error in creating report' + error, { extra: { error, date, team } });
      return { ok: false, error: error.message };
    }
  };

  const incrementPassage = async (report, { persons = [], onSuccess = null, newValue = null } = {}) => {
    const incrementPassages = persons.length || 1;
    const reportUpdate = {
      ...report,
      passages: newValue === null ? (report.passages || 0) + incrementPassages : newValue,
    };
    const res = await updateReport(reportUpdate);
    if (res.ok) {
      if (onSuccess) onSuccess(persons.length > 1 ? 'Passages ajoutés !' : 'Passage ajouté !');
      for (const person of persons) {
        const commentBody = {
          comment: 'Passage enregistré',
          item: person._id,
          person: person._id,
          type: 'person',
        };
        await addComment(commentBody);
      }
    }
    return res;
  };

  return {
    reports,
    setReports,
    updateReport,
    incrementPassage,
    addReport,
    deleteReport,
  };
};

const encryptedFields = ['description', 'services', 'passages', 'team', 'date', 'collaborations'];

export const prepareReportForEncryption = (report) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = report[field];
  }
  return {
    _id: report._id,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    organisation: report.organisation,

    decrypted,
    entityKey: report.entityKey,

    ...report,
  };
};
