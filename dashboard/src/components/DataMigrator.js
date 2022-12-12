import { useRecoilState, useSetRecoilState } from 'recoil';
import { organisationState } from '../recoil/auth';
import { usePreparePersonForEncryption } from '../recoil/persons';
import { prepareReportForEncryption } from '../recoil/reports';
import useApi, { encryptItem, hashedOrgEncryptionKey } from '../services/api';
import { dayjsInstance } from '../services/date';
import { loadingTextState } from './DataLoader';

const LOADING_TEXT = 'Mise à jour des données de votre organisation…';

export default function useDataMigrator() {
  const setLoadingText = useSetRecoilState(loadingTextState);
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const API = useApi();

  const organisationId = organisation?._id;

  const preparePersonForEncryption = usePreparePersonForEncryption();

  return {
    // One "if" for each migration.
    // `migrationLastUpdateAt` should be set after each migration and send in every PUT/POST/PATCH request to server.
    migrateData: async () => {
      let migrationLastUpdateAt = organisation.migrationLastUpdateAt;
      if (!organisation.migrations?.includes('reports-from-real-date-to-date-id')) {
        await new Promise((res) => setTimeout(res, 500));
        setLoadingText(LOADING_TEXT);
        const res = await API.get({
          path: '/report',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        });
        const reportsToMigrate = (res.decryptedData || [])
          .filter((r) => !!r.team && !!r.date)
          .map((report) => ({
            ...report,
            date: dayjsInstance(report.date).format('YYYY-MM-DD'),
            oldDateSystem: report.date, // just to track if we did bad stuff
          }));
        const encryptedReportsToMigrate = await Promise.all(
          reportsToMigrate.map(prepareReportForEncryption).map(encryptItem(hashedOrgEncryptionKey))
        );
        const response = await API.put({
          path: `/migration/reports-from-real-date-to-date-id`,
          body: { reportsToMigrate: encryptedReportsToMigrate },
          query: { migrationLastUpdateAt },
        });
        if (response.ok) {
          setOrganisation(response.organisation);
          migrationLastUpdateAt = response.organisation.migrationLastUpdateAt;
        }
      }
      if (!organisation.migrations?.includes('clean-reports-with-no-team-nor-date')) {
        setLoadingText(LOADING_TEXT);
        const res = await API.get({
          path: '/report',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        });
        const reportIdsToDelete = (res.decryptedData || []).filter((r) => !r.team || !r.date).map((r) => r._id);

        const response = await API.put({
          path: `/migration/clean-reports-with-no-team-nor-date`,
          body: { reportIdsToDelete },
          query: { migrationLastUpdateAt },
        });
        if (response.ok) {
          setOrganisation(response.organisation);
          migrationLastUpdateAt = response.organisation.migrationLastUpdateAt;
        }
      }
      if (!organisation.migrations?.includes('clean-duplicated-reports-4')) {
        setLoadingText(LOADING_TEXT);
        const res = await API.get({
          path: '/report',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        });
        const reportsObjByTeamAndDate = (res.decryptedData || [])
          // sorting the oldest first so that
          // when we loop over the reports to create a consolidates unique report
          // the first to be looped is the oldest one, the last is the newest one
          // so that we keep the newest report's data
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .reduce((reportsObj, report) => {
            if (!reportsObj[`${report.team}-${report.date}`]) reportsObj[`${report.team}-${report.date}`] = [];
            reportsObj[`${report.team}-${report.date}`].push(report);
            return reportsObj;
          }, {});
        const reportIdsToDelete = [];
        const consolidatedReports = Object.values(reportsObjByTeamAndDate).map((reports) => {
          if (reports.length === 1) return reports[0];
          const consolidatedReport = {
            _id: reports[0]._id,
            createdAt: reports[0].createdAt,
            updatedAt: reports[0].updatedAt,
            organisation: reports[0].organisation,
            team: reports[0].team,
            date: reports[0].date,
            // services
            // description
            // collaborations
          };
          for (const [index, report] of Object.entries(reports)) {
            if (report.services) {
              const oldServices = JSON.parse(consolidatedReport.services || '{}');
              const newServices = JSON.parse(report.services || '{}');
              consolidatedReport.services = {};
              for (const [serviceKey, serviceValue] of Object.entries(oldServices)) {
                consolidatedReport.services[serviceKey] = (serviceValue || 0) + (consolidatedReport.services[serviceKey] || 0);
              }
              for (const [serviceKey, serviceValue] of Object.entries(newServices)) {
                consolidatedReport.services[serviceKey] = (serviceValue || 0) + (consolidatedReport.services[serviceKey] || 0);
              }
              consolidatedReport.services = JSON.stringify(consolidatedReport.services);
            }
            if (report.description) {
              consolidatedReport.description = `${consolidatedReport.description || ''}\n\n${report.description}`;
            }
            if (report.collaborations) consolidatedReport.collaborations = report.collaborations;
            if (Number(index) !== 0) reportIdsToDelete.push(report._id);
          }
          return consolidatedReport;
        });

        const encryptedConsolidatedReports = await Promise.all(
          consolidatedReports.map(prepareReportForEncryption).map(encryptItem(hashedOrgEncryptionKey))
        );

        const response = await API.put({
          path: `/migration/clean-duplicated-reports-4`,
          body: { consolidatedReports: encryptedConsolidatedReports, reportIdsToDelete },
          query: { migrationLastUpdateAt },
        });
        if (response.ok) {
          setOrganisation(response.organisation);
          migrationLastUpdateAt = response.organisation.migrationLastUpdateAt;
        }
      }
      if (!organisation.migrations?.includes('update-outOfActiveListReason-and-healthInsurances-to-multi-choice')) {
        setLoadingText(LOADING_TEXT);
        const res = await API.get({
          path: '/person',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        });
        const personsToUpdate = (res.decryptedData || []).map((p) => ({
          ...p,
          outOfActiveListReasons: p.outOfActiveListReason ? [p.outOfActiveListReason] : [],
          healthInsurances: p.healthInsurance ? [p.healthInsurance] : [],
        }));
        const encryptedPersonsToMigrate = await Promise.all(personsToUpdate.map(preparePersonForEncryption).map(encryptItem(hashedOrgEncryptionKey)));
        const response = await API.put({
          path: `/migration/update-outOfActiveListReason-and-healthInsurances-to-multi-choice`,
          body: { personsToUpdate: encryptedPersonsToMigrate },
          query: { migrationLastUpdateAt },
        });
        if (response.ok) {
          setOrganisation(response.organisation);
          migrationLastUpdateAt = response.organisation.migrationLastUpdateAt;
        }
      }
    },
  };
}
