import { useState } from 'react';
import { atom, useRecoilState } from 'recoil';
import { useComments } from '../recoil/comments';
import useApi from '../services/api-interface-with-dashboard';
import { getData, useStorage } from '../services/dataManagement';
import { capture } from '../services/sentry';

export const reportsState = atom({
  key: 'reportsState',
  default: [],
});

export const useReports = () => {
  const { addComment } = useComments();
  const API = useApi();

  const [reports, setReports] = useRecoilState(reportsState);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh-reports', 0);

  const setReportsFullState = (newReports) => {
    if (newReports) setReports(newReports);
    setLastRefresh(Date.now());
  };

  const setBatchData = (newReports) => setReports((reports) => [...reports, ...newReports]);

  const refreshReports = async (setProgress, initialLoad) => {
    setLoading((state) => ({ ...state, loading: true }));
    try {
      const data = await getData({
        collectionName: 'report',
        data: reports,
        isInitialization: initialLoad,
        setProgress,
        lastRefresh,
        setBatchData,
        API,
      });
      setReportsFullState(data);
      return true;
    } catch (e) {
      capture(e.message, { extra: { response: e.response } });
      setLoading(false);
      return false;
    }
  };

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
      const res = await API.post({ path: '/report', body: { team, date } });
      if (!res.ok) return res;
      setReports((reports) => [res.decryptedData, ...reports]);
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
    loading,
    refreshReports,
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
