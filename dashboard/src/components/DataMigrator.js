import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { mappedIdsToLabels, prepareActionForEncryption } from '../recoil/actions';
import { organisationState, userState } from '../recoil/auth';
import { usePreparePersonForEncryption } from '../recoil/persons';
import { prepareReportForEncryption } from '../recoil/reports';
import API, { encryptItem } from '../services/api';
import { dayjsInstance } from '../services/date';
import { loadingTextState } from './DataLoader';
import { looseUuidRegex } from '../utils';
import { prepareCommentForEncryption } from '../recoil/comments';
import { prepareGroupForEncryption } from '../recoil/groups';

const LOADING_TEXT = 'Mise à jour des données de votre organisation…';

export default function useDataMigrator() {
  const setLoadingText = useSetRecoilState(loadingTextState);
  const user = useRecoilValue(userState);
  const [organisation, setOrganisation] = useRecoilState(organisationState);

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
        const encryptedReportsToMigrate = await Promise.all(reportsToMigrate.map(prepareReportForEncryption).map(encryptItem));
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

        const encryptedConsolidatedReports = await Promise.all(consolidatedReports.map(prepareReportForEncryption).map(encryptItem));

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
        const encryptedPersonsToMigrate = await Promise.all(personsToUpdate.map(preparePersonForEncryption).map(encryptItem));
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
      if (!organisation.migrations?.includes('action-with-multiple-team')) {
        setLoadingText(LOADING_TEXT);
        const res = await API.get({
          path: '/action',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        });
        const actionsToUpdate = (res.decryptedData || []).map((a) => {
          const { team, ...action } = a;
          return { ...action, teams: action.teams?.length ? action.teams : [team] };
        });
        const encryptedActionsToMigrate = await Promise.all(
          actionsToUpdate.map((action) => prepareActionForEncryption({ ...action, user: action.user || user._id })).map(encryptItem)
        );
        const response = await API.put({
          path: `/migration/action-with-multiple-team`,
          body: { actionsToUpdate: encryptedActionsToMigrate },
          query: { migrationLastUpdateAt },
        });
        if (response.ok) {
          setOrganisation(response.organisation);
          migrationLastUpdateAt = response.organisation.migrationLastUpdateAt;
        }
      }

      if (!organisation.migrations?.includes('services-in-services-table')) {
        setLoadingText(LOADING_TEXT);
        const res = await API.get({
          path: '/report',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        });
        const reportsToUpdate = (res.decryptedData || []).filter((e) => e.services && Object.values(JSON.parse(e.services || '{}')).length);
        const reportsWithoutServicesProperty = reportsToUpdate.map((e) => {
          const { services, ...report } = e;
          return report;
        });
        // Save all services in services table
        const servicesToSaveInDB = reportsToUpdate.reduce((acc, report) => {
          const services = Object.entries(JSON.parse(report.services || '{}'))
            .filter(([, value]) => value)
            .map(([service, value]) => ({
              team: report.team,
              date: report.date,
              service: String(service),
              count: Number(value),
            }));
          return [...acc, ...services];
        }, []);

        const encryptedReportsToMigrate = await Promise.all(reportsWithoutServicesProperty.map(prepareReportForEncryption).map(encryptItem));
        const response = await API.put({
          path: `/migration/services-in-services-table`,
          body: { reportsToUpdate: encryptedReportsToMigrate, servicesToSaveInDB },
          query: { migrationLastUpdateAt },
        });
        if (response.ok) {
          setOrganisation(response.organisation);
          migrationLastUpdateAt = response.organisation.migrationLastUpdateAt;
        }
      }

      if (!organisation.migrations?.includes('comments-reset-person-id')) {
        setLoadingText(LOADING_TEXT);
        const res = await API.get({
          path: '/comment',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        });
        const commentsTransformedFromPersonObjectToPersonUuid = (res.decryptedData || [])
          .filter((comment) => {
            // we select only comments with person "populated"
            if (!!comment.action) return false;
            if (!comment.person) return false;
            if (looseUuidRegex.test(comment.person)) return false;
            if (!comment?.person?._id) return false;
            return true;
          })
          .map((comment) => ({
            ...comment,
            person: comment.person._id,
          }));

        const encryptedCommentsToMigrate = await Promise.all(
          commentsTransformedFromPersonObjectToPersonUuid.map(prepareCommentForEncryption).map(encryptItem)
        );
        const response = await API.put({
          path: `/migration/comments-reset-person-id`,
          body: { commentsToUpdate: encryptedCommentsToMigrate },
          query: { migrationLastUpdateAt },
        });
        if (response.ok) {
          setOrganisation(response.organisation);
          migrationLastUpdateAt = response.organisation.migrationLastUpdateAt;
        }
      }

      if (!organisation.migrations?.includes('clean-reports-with-services')) {
        // this migration comes after the bug writtne in migration "services-in-services-table"
        // https://github.com/SocialGouv/mano/commit/7a8ae27972157b77bd6334353201f0786ae1daac
        // what we did to fix this bug is: we had a backp with good reports and we replaced the bad ones with the good ones
        // so we need to clean the reports with services - and no need to save the services in services table
        setLoadingText(LOADING_TEXT);
        const res = await API.get({
          path: '/report',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        });
        const reportsToUpdate = (res.decryptedData || []).filter((e) => e.services && Object.values(JSON.parse(e.services || '{}')).length);
        const reportsWithoutServicesProperty = reportsToUpdate.map((e) => {
          const { services, ...report } = e;
          return report;
        });
        // Save all services in services table

        const encryptedReportsToMigrate = await Promise.all(reportsWithoutServicesProperty.map(prepareReportForEncryption).map(encryptItem));
        const response = await API.put({
          path: `/migration/clean-reports-with-services`,
          body: { reportsToUpdate: encryptedReportsToMigrate },
          query: { migrationLastUpdateAt },
        });
        if (response.ok) {
          setOrganisation(response.organisation);
          migrationLastUpdateAt = response.organisation.migrationLastUpdateAt;
        }
      }

      if (!organisation.migrations?.includes('remove-medical-docs-from-persons')) {
        setLoadingText(LOADING_TEXT);
        const personRes = await API.get({
          path: '/person',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        });
        const medicalFileRes = await API.get({
          path: '/medical-file',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        });
        const personsToUpdate = (personRes.decryptedData || [])
          .filter((_person) => {
            if (!_person.documents?.length) return false;
            const medicalFile = medicalFileRes.decryptedData.find((mf) => mf.person === _person._id);
            if (!medicalFile) return false;
            return true;
          })
          .map((_person) => {
            const medicalFile = medicalFileRes.decryptedData.find((mf) => mf.person === _person._id);
            if (!medicalFile) return _person;
            const medicalFileDocuments = medicalFile.documents || [];

            return {
              ..._person,
              documents: _person.documents.filter((_doc) => {
                if (medicalFileDocuments.find((_medicalDoc) => _medicalDoc._id === _doc._id)) return false;
                return true;
              }),
            };
          });
        const encryptedPersonsToMigrate = await Promise.all(personsToUpdate.map(preparePersonForEncryption).map(encryptItem));
        const response = await API.put({
          path: `/migration/remove-medical-docs-from-persons`,
          body: { personsToUpdate: encryptedPersonsToMigrate },
          query: { migrationLastUpdateAt },
        });
        if (response.ok) {
          setOrganisation(response.organisation);
          migrationLastUpdateAt = response.organisation.migrationLastUpdateAt;
        }
      }
      if (!organisation.migrations?.includes('retrieve-docs-from-persons-backup')) {
        setLoadingText(LOADING_TEXT);
        const personRes = await API.get({
          path: '/person',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        });
        const personBackupRes = await API.get({
          path: '/person-backup',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        });
        const personBackupWithDocuments = (personBackupRes.decryptedData || []).filter((e) => e.documents?.length);
        const personsThatNeedToBeUpdated = (personRes.decryptedData || []).filter((e) => {
          const personBackup = personBackupWithDocuments.find((pb) => pb._id === e._id);
          if (!personBackup) return false;
          return true;
        });

        const personsToUpdate = personsThatNeedToBeUpdated.map((person) => {
          const personBackup = personBackupWithDocuments.find((pb) => pb._id === person._id);
          if (!personBackup) return person;
          const backupDocuments = personBackup.documents || [];
          const personDocuments = (person.documents || []).filter((doc) => !backupDocuments.find((bd) => bd._id === doc._id));
          return {
            ...person,
            documents: [...backupDocuments, ...personDocuments],
          };
        });

        const encryptedPersonsToMigrate = await Promise.all(personsToUpdate.map(preparePersonForEncryption).map(encryptItem));
        const response = await API.put({
          path: `/migration/retrieve-docs-from-persons-backup`,
          body: { personsToUpdate: encryptedPersonsToMigrate },
          query: { migrationLastUpdateAt },
        });
        if (response.ok) {
          setOrganisation(response.organisation);
          migrationLastUpdateAt = response.organisation.migrationLastUpdateAt;
        }
      }
      if (!organisation.migrations?.includes('fix-family-relation-user-deleted')) {
        setLoadingText(LOADING_TEXT);
        const personRes = await API.get({
          path: '/person',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        });
        const persons = personRes.decryptedData;
        const groupRes = await API.get({
          path: '/group',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        });

        const groupsToUpdate = [];
        const groupIdsToDestroy = [];
        for (const group of groupRes.decryptedData) {
          let updateGroup = false;
          let updatedGroup = { ...group, persons: group.persons, relations: group.relations };
          for (const personId of group.persons) {
            if (!persons.find((p) => p._id === personId)) {
              updateGroup = true;
              updatedGroup.persons = updatedGroup.persons.filter((p) => p._id !== personId);
              updatedGroup.relations = updatedGroup.relations.filter((rel) => !rel.persons.includes(personId));
            }
          }
          if (updateGroup) {
            if (group.relations.length === 0) {
              groupIdsToDestroy.push(group._id);
            } else {
              groupsToUpdate.push(updatedGroup);
            }
          }
        }

        const encryptedGroupsToUpdate = await Promise.all(groupsToUpdate.map(prepareGroupForEncryption).map(encryptItem));
        const response = await API.put({
          path: `/migration/fix-family-relation-user-deleted`,
          body: { groupsToUpdate: encryptedGroupsToUpdate, groupIdsToDestroy },
          query: { migrationLastUpdateAt },
        });
        if (response.ok) {
          setOrganisation(response.organisation);
          migrationLastUpdateAt = response.organisation.migrationLastUpdateAt;
        }
      }

      if (!organisation.migrations?.includes('integrate-comments-in-actions-history')) {
        setLoadingText(LOADING_TEXT);
        const comments = await API.get({
          path: '/comment',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        }).then((res) => res.decryptedData || []);
        const actions = await API.get({
          path: '/action',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        }).then((res) => res.decryptedData || []);

        const actionsPerId = {};
        for (const action of actions) {
          actionsPerId[action._id] = action;
        }
        const actionsToUpdate = {};
        const commentIdsToDelete = [];

        for (const comment of comments) {
          if (!comment.action) continue;
          if (!comment.comment.includes("a changé le status de l'action: ")) continue;
          const action = actionsToUpdate[comment.action] ?? actionsPerId[comment.action];
          if (!action) {
            commentIdsToDelete.push(comment._id);
            continue;
          }
          if (!action.history) action.history = [];
          const statusName = comment.comment.split("a changé le status de l'action: ")[1];
          const statusId = mappedIdsToLabels.find((e) => e.name === statusName)?._id;
          action.history.push({
            user: comment.user,
            date: comment.createdAt,
            data: {
              status: { oldValue: '', newValue: statusId },
            },
          });
          actionsToUpdate[comment.action] = action;
          commentIdsToDelete.push(comment._id);
        }

        const encryptedActionsToUpdate = await Promise.all(
          Object.values(actionsToUpdate)
            .map((action) => prepareActionForEncryption(action, { checkRequiredFields: false }))
            .map(encryptItem)
        );

        const response = await API.put({
          path: `/migration/integrate-comments-in-actions-history`,
          body: { commentIdsToDelete, actionsToUpdate: encryptedActionsToUpdate },
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
