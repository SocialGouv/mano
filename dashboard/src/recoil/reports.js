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
            if (report.date < '2022-11-25') return reportsByDate;
            if (!reportsByDate[`${report.date}-${report.team}`]) reportsByDate[`${report.date}-${report.team}`] = [];
            reportsByDate[`${report.date}-${report.team}`].push(report);
            return reportsByDate;
          }, {})
        ).filter(([key, reportsByDate]) => reportsByDate.length > 1);
        if (duplicateReports.length > 0) {
          for (const [key, reportsByDate] of duplicateReports) {
            capture('Duplicated reports ' + key, {
              extra: {
                [key]: reportsByDate.map((report) => ({
                  _id: report._id,
                  date: report.date,
                  team: report.team,
                  services: report.services,
                  createdAt: report.createdAt,
                  deletedAt: report.deletedAt,
                  description: report.description,
                  collaborations: report.collaborations,
                  organisation: report.organisation,
                })),
              },
            });
          }
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
