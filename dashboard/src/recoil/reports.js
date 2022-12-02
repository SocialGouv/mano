import { setCacheItem } from '../services/dataManagement';
import { atom, selector } from 'recoil';
import { capture } from '../services/sentry';
import { organisationState } from './auth';

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

    decrypted,
    entityKey: report.entityKey,
  };
};
