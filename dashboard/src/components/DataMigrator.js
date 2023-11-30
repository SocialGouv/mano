import { useRecoilValue, useSetRecoilState } from 'recoil';
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

const LOADING_TEXT = 'Mise à jour des données de votre organisation…';

/*eslint no-unused-vars: "off"*/
export default function useDataMigrator() {
  const setLoadingText = useSetRecoilState(loadingTextState);
  const user = useRecoilValue(userState);
  const setOrganisation = useSetRecoilState(organisationState);

  const preparePersonForEncryption = usePreparePersonForEncryption();

  return {
    // One "if" for each migration.
    // `migrationLastUpdateAt` should be set after each migration and send in every PUT/POST/PATCH request to server.
    migrateData: async (organisation) => {
      const organisationId = organisation?._id;
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
        } else {
          return false;
        }
      }
      // End of example of migration.
      */

      return true;
    },
  };
}
