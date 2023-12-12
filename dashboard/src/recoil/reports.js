import { getCacheItemDefaultValue, setCacheItem } from '../services/dataManagement';
import { atom, selector } from 'recoil';
import { capture } from '../services/sentry';
import { organisationState } from './auth';
import { dateRegex, looseUuidRegex } from '../utils';
import { toast } from 'react-toastify';

const collectionName = 'report';
export const reportsState = atom({
  key: collectionName,
  default: selector({
    key: 'report/default',
    get: async () => {
      const cache = await getCacheItemDefaultValue('report', []);
      return cache;
    },
  }),
  effects: [
    ({ onSet }) =>
      onSet(async (newValue) => {
        setCacheItem(collectionName, newValue);
        /* check if duplicate reports */
        const duplicateReports = Object.entries(
          newValue.reduce((reportsByDate, report) => {
            // TIL: undefined < '2022-11-25' === false. So we need to check if report.date is defined.
            if (!report.date || report.date < '2022-11-25') return reportsByDate;
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

export const prepareReportForEncryption = (report, { checkRequiredFields = true } = {}) => {
  if (!!checkRequiredFields && !report.deletedAt) {
    try {
      if (!looseUuidRegex.test(report.team)) {
        throw new Error('Report is missing team');
      }
      if (!dateRegex.test(report.date)) {
        throw new Error('Report is missing date');
      }
    } catch (error) {
      toast.error(
        "Le compte-rendu n'a pas été sauvegardé car son format était incorrect. Vous pouvez vérifier son contenu et tenter de le sauvegarder à nouveau. L'équipe technique a été prévenue et va travailler sur un correctif."
      );
      capture(error, { extra: { report } });
      throw error;
    }
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
