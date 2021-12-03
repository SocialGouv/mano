import React, { useContext, useState } from 'react';
import API from '../services/api';
import { getData, useStorage } from '../services/dataManagement';
import CommentsContext from './comments';

const ReportsContext = React.createContext();

export const ReportsProvider = ({ children }) => {
  const { addComment } = useContext(CommentsContext);

  const [state, setState] = useState({ reports: [], reportsKey: 0, loading: true, lastRefresh: undefined });
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh-reports', 0);
  const setReports = (reports) => {
    if (reports) {
      setState(({ reportsKey }) => ({
        reports,
        reportsKey: reportsKey + 1,
        loading: false,
      }));
    }
    setLastRefresh(Date.now());
  };

  const setBatchData = (newReports) =>
    setState(({ reports, ...oldState }) => ({
      ...oldState,
      reports: [...reports, ...newReports],
    }));

  const refreshReports = async (setProgress, initialLoad) => {
    setState((state) => ({ ...state, loading: true }));
    try {
      const data = await getData({
        collectionName: 'report',
        data: state.reports,
        isInitialization: initialLoad,
        setProgress,
        lastRefresh,
        setBatchData,
      });
      setReports(data);
      return true;
    } catch (e) {
      setState((state) => ({ ...state, loading: false }));
      return false;
    }
  };

  const deleteReport = async (id) => {
    const res = await API.delete({ path: `/report/${id}` });
    if (res.ok) {
      setState(({ reportsKey, reports, ...s }) => ({
        ...s,
        reportsKey: reportsKey + 1,
        reports: reports.filter((p) => p._id !== id),
      }));
    }
    return res;
  };

  const updateReport = async (report) => {
    const res = await API.put({ path: `/report/${report._id}`, body: prepareReportForEncryption(report) });
    if (res.ok) {
      setState(({ reports, reportsKey, ...s }) => ({
        ...s,
        reportsKey: reportsKey + 1,
        reports: reports.map((a) => {
          if (a._id === report._id) return res.decryptedData;
          return a;
        }),
      }));
    }
    return res;
  };

  const addReport = async (date, team) => {
    const res = await API.post({ path: '/report', body: { team, date } });
    if (!res.ok) return res;
    setState(({ reports, reportsKey, ...s }) => ({
      ...s,
      reportsKey: reportsKey + 1,
      reports: [res.decryptedData, ...reports],
    }));
    return res;
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

  return (
    <ReportsContext.Provider
      value={{
        ...state,
        refreshReports,
        setReports,
        updateReport,
        incrementPassage,
        addReport,
        deleteReport,
      }}>
      {children}
    </ReportsContext.Provider>
  );
};

export default ReportsContext;

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
