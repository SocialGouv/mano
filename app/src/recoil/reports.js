import { storage } from '../services/dataManagement';
import { atom, selector } from 'recoil';
import { organisationState } from './auth';
import { looseUuidRegex, dateRegex } from '../utils/regex';
import { capture } from '../services/sentry';
import { Alert } from 'react-native';

export const reportsState = atom({
  key: 'reportsState',
  default: JSON.parse(storage.getString('report') || '[]'),
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
  try {
    if (!looseUuidRegex.test(report.team)) {
      throw new Error('Report is missing team');
    }
    if (!dateRegex.test(report.date)) {
      throw new Error('Report is missing date');
    }
  } catch (error) {
    Alert.alert(
      "Le compte-rendu n'a pas été sauvegardé car son format était incorrect.",
      "Vous pouvez vérifier son contenu et tenter de le sauvegarder à nouveau. L'équipe technique a été prévenue et va travailler sur un correctif."
    );
    capture(error);
    throw error;
  }
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
