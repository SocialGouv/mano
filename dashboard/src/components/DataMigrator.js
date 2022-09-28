import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { organisationState } from '../recoil/auth';
import { customFieldsPersonsMedicalSelector, customFieldsPersonsSocialSelector, preparePersonForEncryption } from '../recoil/persons';
import { prepareReportForEncryption } from '../recoil/reports';
import useApi, { encryptItem, hashedOrgEncryptionKey } from '../services/api';
import { dayjsInstance } from '../services/date';
import { loadingTextState } from './DataLoader';

const LOADING_TEXT = 'Mise à jour des données de votre organisation…';

export default function useDataMigrator() {
  const setLoadingText = useSetRecoilState(loadingTextState);
  const [organisation, setOrganisation] = useRecoilState(organisationState);
  const API = useApi();
  const customFieldsPersonsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const customFieldsPersonsSocial = useRecoilValue(customFieldsPersonsSocialSelector);

  const organisationId = organisation?._id;

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
      if (!organisation.migrations?.includes('all-data-within-persons')) {
        setLoadingText(LOADING_TEXT);
        const personRes = await API.get({
          path: '/person',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        });
        const actionRes = await API.get({
          path: '/action',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        });
        const commentsRes = await API.get({
          path: '/comment',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        });
        const passagesRes = await API.get({
          path: '/passage',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        });

        const actionsById = {};
        for (const action of actionRes.decryptedData) {
          actionsById[action._id] = { ...action, comments: [] };
        }
        for (const comment of commentsRes.decryptedData) {
          if (!comment.action) continue;
          if (!actionsById[comment.action]) continue;
          actionsById[comment.action].comments.push(comment);
        }

        const personsToMigrate = [];
        for (const person of personRes.decryptedData) {
          const actions = Object.values(actionsById).filter((a) => a.person === person._id);
          const comments = commentsRes.decryptedData.filter((c) => c.person === person._id);
          const passages = passagesRes.decryptedData.filter((p) => p.person === person._id);
          personsToMigrate.push({ ...person, actions, comments, passages });
        }

        console.log({ personsToMigrate });
        const encryptedPersons = await Promise.all(
          personsToMigrate
            .map(preparePersonForEncryption(customFieldsPersonsMedical, customFieldsPersonsSocial))
            .map(encryptItem(hashedOrgEncryptionKey))
        );
        console.log({ encryptedPersons });
        const response = await API.put({
          path: `/migration/all-data-within-persons`,
          body: { persons: encryptedPersons },
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
