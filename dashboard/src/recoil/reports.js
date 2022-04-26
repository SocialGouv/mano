import localforage from 'localforage';
import { atom } from 'recoil';

const collectionName = 'report';
export const reportsState = atom({
  key: collectionName,
  default: [],
  effects: [
    ({ onSet }) => {
      onSet(async (newValue) => {
        await localforage.setItem(collectionName, newValue);
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
