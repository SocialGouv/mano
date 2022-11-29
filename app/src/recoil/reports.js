import { storage } from '../services/dataManagement';
import { atom, selector } from 'recoil';
import { organisationState } from './auth';

export const reportsState = atom({
  key: 'reportsState',
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => storage.set('report', JSON.stringify(newValue)))],
});

export const servicesSelector = selector({
  key: 'servicesSelector',
  get: ({ get }) => {
    const organisation = get(organisationState);
    if (organisation.groupedServices) return organisation.groupedServices;
    return [{ groupTitle: 'Tous mes services', services: organisation.services ?? [] }];
  },
});

export const flattenedServicesSelector = selector({
  key: 'flattenedServicesSelector',
  get: ({ get }) => {
    const groupedServices = get(servicesSelector);
    return groupedServices.reduce((allServices, { services }) => [...allServices, ...services], []);
  },
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
    date: report.date,
    team: report.team,

    decrypted,
    entityKey: report.entityKey,
  };
};
