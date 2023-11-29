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
import { prepareConsultationForEncryption } from '../recoil/consultations';

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

      console.log('mgration', process.env.REACT_APP_ORG_IF_FOR_MIGRATION);
      if (organisation._id === process.env.REACT_APP_ORG_IF_FOR_MIGRATION && !organisation.migrations?.includes('add-team-to-consultation')) {
        setLoadingText('Ajout des équipes dans vos consultations');
        const consultationsRes = await API.get({
          path: '/consultation',
          query: { organisation: organisationId, after: 0, withDeleted: false },
        }).then((res) => res.decryptedData || []);

        const consultationsToUpdate = consultationsRes
          .filter((c) => !c.teams?.length)
          .map((consultation) => {
            // do something
            switch (consultation.type) {
              case 'Médecine générale':
              case 'Odontologie':
              case 'Ophtalmologie':
              case 'Gynécologie':
              case 'Social':
              case 'Pédiatrie':
              case 'Pneumologie':
              case 'Cardiologie':
              case 'ORL':
              case 'IDE':
              case 'Psycho CDS':
              case 'Accueil / Secrétariat':
              case 'Rhumatologie':
              case 'Maladies Infectieuses':
              case 'Médiateur Covid':
              case 'Endocrinologie':
              case 'Radiologie':
              case 'Psychiatrie':
              case 'Psychologique':
              case 'Infirmier':
                return {
                  ...consultation,
                  teams: [process.env.REACT_APP_TEAM_1],
                };
              case 'Perm. Médicale Accueil De Jour':
              case 'EMSP SOINS':
              case 'EMSP COORDO':
              case 'EMSP SOCIAL':
              case 'EMSP PERM':
              case 'EMSP Psycho':
                return {
                  ...consultation,
                  teams: [process.env.REACT_APP_TEAM_2],
                };
              default:
                capture('Unknown consultation type', { consultation });
                return consultation;
            }
          });

        const encryptedConsultationsToUpdate = await Promise.all(
          consultationsToUpdate.map(prepareConsultationForEncryption(organisation.consultations)).map(encryptItem)
        );
        const response = await API.put({
          path: `/migration/add-team-to-consultation`,
          body: { encryptedConsultationsToUpdate },
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
