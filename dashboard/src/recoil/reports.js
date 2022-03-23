import { atom } from 'recoil';
import { writeCollection } from '../services/dataManagement';

export const reportsState = atom({
  key: 'reportsState',
  default: [],
  effects: [
    ({ onSet }) => {
      onSet((newValue) => {
        writeCollection('report', newValue);
      });
    },
  ],
});

const encryptedFields = ['description', 'services', 'team', 'date', 'collaborations'];

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
