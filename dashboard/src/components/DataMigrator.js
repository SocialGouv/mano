import { useRecoilValue, useSetRecoilState } from 'recoil';
import { mappedIdsToLabels, prepareActionForEncryption } from '../recoil/actions';
import { organisationState, userState } from '../recoil/auth';
import { usePreparePersonForEncryption } from '../recoil/persons';
import { prepareReportForEncryption } from '../recoil/reports';
import API, { getHashedOrgEncryptionKey, decryptAndEncryptItem, encryptItem } from '../services/api';
import { dayjsInstance } from '../services/date';
import { loadingTextState } from './DataLoader';
import { looseUuidRegex } from '../utils';
import { prepareCommentForEncryption } from '../recoil/comments';
import { prepareGroupForEncryption } from '../recoil/groups';
import { capture } from '../services/sentry';
import { encryptVerificationKey } from '../services/encryption';
import { v4 as uuidv4 } from 'uuid';
import { prepareConsultationForEncryption } from '../recoil/consultations';
import { prepareTreatmentForEncryption } from '../recoil/treatments';
import { prepareMedicalFileForEncryption } from '../recoil/medicalFiles';
import { preparePassageForEncryption } from '../recoil/passages';
import { prepareRencontreForEncryption } from '../recoil/rencontres';
import { prepareTerritoryForEncryption } from '../recoil/territory';
import { customFieldsObsSelector, prepareObsForEncryption } from '../recoil/territoryObservations';
import { preparePlaceForEncryption } from '../recoil/places';
import { prepareRelPersonPlaceForEncryption } from '../recoil/relPersonPlace';

const LOADING_TEXT = 'Mise à jour des données de votre organisation…';

/*eslint no-unused-vars: "off"*/
export default function useDataMigrator() {
  const setLoadingText = useSetRecoilState(loadingTextState);
  const user = useRecoilValue(userState);
  const setOrganisation = useSetRecoilState(organisationState);
  const customFieldsObs = useRecoilValue(customFieldsObsSelector);

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
      if (!organisation.migrations?.includes('reformat-observedAt-observations')) {
        // some observedAt are timestamp, some are date
        // it messes up the filtering by date in stats
        setLoadingText(LOADING_TEXT);
        const observationsRes = await API.get({
          path: '/territory-observation',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        }).then((res) => res.decryptedData || []);

        const newObservations = observationsRes.map((obs) => {
          const observedAt = !isNaN(Number(obs.observedAt)) // i.e. is timestamp
            ? dayjsInstance(Number(obs.observedAt)).toISOString()
            : dayjsInstance(obs.observedAt ?? obs.createdAt).toISOString();
          return {
            ...obs,
            user: obs.user ?? user._id, // in case of old observations missing user
            observedAt,
          };
        });

        const observationIdsToDelete = newObservations.filter((obs) => !obs.territory || !obs.team).map((obs) => obs._id);
        const observationsWithFullData = newObservations.filter((obs) => !!obs.territory && !!obs.team);

        const encryptedObservations = await Promise.all(observationsWithFullData.map(prepareObsForEncryption(customFieldsObs)).map(encryptItem));

        const response = await API.put({
          path: `/migration/reformat-observedAt-observations`,
          body: { encryptedObservations, observationIdsToDelete },
          query: { migrationLastUpdateAt },
        });
        if (response.ok) {
          setOrganisation(response.organisation);
          migrationLastUpdateAt = response.organisation.migrationLastUpdateAt;
        } else {
          return false;
        }
      }
      return true;
    },
  };
}
