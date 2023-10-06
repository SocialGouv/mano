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
import { capture } from '../services/sentry';
import { defaultMedicalFileCustomFields, prepareMedicalFileForEncryption } from '../recoil/medicalFiles';

const LOADING_TEXT = 'Mise à jour des données de votre organisation…';

/*eslint no-unused-vars: "off"*/
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
      /*
      // Example of migration:
      if (!organisation.migrations?.includes('migration-name')) {
        setLoadingText(LOADING_TEXT);
        const somethingRes = await API.get({
          path: '/something-to-update',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        }).then((res) => res.decryptedData || []);

        const somethingToUpdate = somethingRes.map((e) => {
          // do something
        });

        const encryptedThingsToUpdate = await Promise.all(somethingToUpdate.map(prepareForEncryption).map(encryptItem));
        const response = await API.put({
          path: `/migration/migration-name`,
          body: { thingsToUpdate: encryptedThingsToUpdate, thingsIdsToDestroy: [] },
          query: { migrationLastUpdateAt },
        });
        if (response.ok) {
          setOrganisation(response.organisation);
          migrationLastUpdateAt = response.organisation.migrationLastUpdateAt;
        }
      }
      // End of example of migration.
      */

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

      if (['admin', 'normal'].includes(user.role) && !organisation.migrations?.includes('clean-duplicated-medical-files')) {
        setLoadingText(LOADING_TEXT);
        const customFieldsMedicalFile = Array.isArray(organisation.customFieldsMedicalFile)
          ? organisation.customFieldsMedicalFile
          : defaultMedicalFileCustomFields;
        const medicalFiles = await API.get({
          path: '/medical-file',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        }).then((res) => res.decryptedData || []);

        const medicalFilesPerPersonId = {};
        const medicalFilesToUpdate = {};
        const medicalFileIdsToDelete = [];
        for (const newMedicalFile of medicalFiles) {
          const personId = newMedicalFile.person;
          if (medicalFilesPerPersonId[personId]) {
            const existingMedicalFile = medicalFilesPerPersonId[personId];
            const nextDocuments = {};
            const nextComments = {};
            for (const document of newMedicalFile.documents) {
              nextDocuments[document._id] = document;
            }
            for (const document of existingMedicalFile.documents) {
              nextDocuments[document._id] = document;
            }
            for (const comment of newMedicalFile.comments) {
              nextComments[comment._id] = comment;
            }
            for (const comment of existingMedicalFile.comments) {
              nextComments[comment._id] = comment;
            }
            medicalFilesPerPersonId[personId] = {
              ...newMedicalFile,
              ...existingMedicalFile,
              documents: Object.values(nextDocuments),
              comments: Object.values(nextComments),
            };
            medicalFileIdsToDelete.push(newMedicalFile._id);
            medicalFilesToUpdate[personId] = medicalFilesPerPersonId[personId];
          } else {
            medicalFilesPerPersonId[personId] = newMedicalFile;
          }
        }

        const encryptedMedicalFilesToUpdate = await Promise.all(
          Object.values(medicalFilesToUpdate)
            .map((medicalFile) => prepareMedicalFileForEncryption(customFieldsMedicalFile)(medicalFile))
            .map(encryptItem)
        );

        const response = await API.put({
          path: `/migration/clean-duplicated-medical-files`,
          body: { medicalFileIdsToDelete, medicalFilesToUpdate: encryptedMedicalFilesToUpdate },
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
