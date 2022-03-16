import { atom } from 'recoil';

export const reportsState = atom({
  key: 'reportsState',
  default: [],
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

    ...report,
  };
};
