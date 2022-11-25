import { setCacheItem } from '../services/dataManagement';
import { atom } from 'recoil';
import { capture } from '../services/sentry';

const collectionName = 'report';
export const reportsState = atom({
  key: collectionName,
  default: [],
  effects: [
    ({ onSet }) =>
      onSet(async (newValue) => {
        setCacheItem(collectionName, newValue);
        /* check if duplicate reports */
        const duplicateReports = Object.entries(
          newValue.reduce((reportsByDate, report) => {
            if (!reportsByDate[`${report.date}-${report.team}`]) reportsByDate[`${report.date}-${report.team}`] = [];
            reportsByDate[`${report.date}-${report.team}`].push(report);
            return reportsByDate;
          }, {})
        ).filter(([key, reportsByDate]) => reportsByDate.length > 1);
        if (duplicateReports.length > 0) {
          capture('Duplicated reports', { extra: { duplicateReports } });
        }
      }),
  ],
});

const encryptedFields = ['description', 'services', 'team', 'date', 'collaborations', 'oldDateSystem'];

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
  };
};
