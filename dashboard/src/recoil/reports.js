import { setCacheItem } from '../services/dataManagement';
import { atom } from 'recoil';
import { capture } from '../services/sentry';
import { toast } from 'react-toastify';

const collectionName = 'report';
export const reportsState = atom({
  key: collectionName,
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
});

const encryptedFields = ['description', 'services', 'team', 'date', 'collaborations', 'oldDateSystem'];

export const prepareReportForEncryption = (report) => {
  const decrypted = {};
  if (!report.date) {
    capture('Report without date', { report });
    toast.error("Désolé une erreur est survenue, l'équipe technique technique a été prévenue.");
    throw new Error('Report team is required');
  }
  if (!report.team) {
    capture('Report without team', { report });
    toast.error("Désolé une erreur est survenue, l'équipe technique technique a été prévenue.");
    throw new Error('Report team is required');
  }
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
