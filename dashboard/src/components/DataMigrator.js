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
import { prepareObsForEncryption } from '../recoil/territoryObservations';
import { preparePlaceForEncryption } from '../recoil/places';
import { prepareRelPersonPlaceForEncryption } from '../recoil/relPersonPlace';

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

      if (organisation._id === process.env.REACT_APP_ORG_ID_FOR_TRUPLICATION && !organisation.migrations?.includes('truplicate-organisations')) {
        setLoadingText("Truplication en cours: récupération des données de l'organisation originale…");

        async function getItems(path) {
          const response = await API.get({
            path,
            query: {
              organisation: organisation._id,
              limit: String(Number.MAX_SAFE_INTEGER),
              page: String(0),
              after: String(0),
              withDeleted: true,
            },
          });
          return response.decryptedData;
        }

        const dataToDuplicated = {
          organisation,
          users: await getItems('/user'),
          teams: await getItems('/team'),
          persons: await getItems('/person'),
          consultations: await getItems('/consultation'),
          treatments: await getItems('/treatment'),
          medicalFiles: await getItems('/medical-file'),
          groups: await getItems('/group'),
          actions: await getItems('/action'),
          comments: await getItems('/comment'),
          passages: await getItems('/passage'),
          rencontres: await getItems('/rencontre'),
          territories: await getItems('/territory'),
          territoryObservations: await getItems('/territory-observation'),
          places: await getItems('/place'),
          relPersonPlaces: await getItems('/relPersonPlace'),
          reports: await getItems('/report'),
        };

        const duplicateEncryptedDataOrganisation1 = await duplicateDecryptedData({
          nextOrganisationId: process.env.REACT_APP_ORG_DUPLICATED_1_ID,
          nextOrganisationName: process.env.REACT_APP_ORG_DUPLICATED_1_NAME,
          preparePersonForEncryption,
          ...dataToDuplicated,
        });

        const duplicateEncryptedDataOrganisation2 = await duplicateDecryptedData({
          nextOrganisationId: process.env.REACT_APP_ORG_DUPLICATED_2_ID,
          nextOrganisationName: process.env.REACT_APP_ORG_DUPLICATED_2_NAME,
          preparePersonForEncryption,
          ...dataToDuplicated,
        });

        const response = await API.put({
          path: `/migration/truplicate-organisations`,
          body: { organisation1: duplicateEncryptedDataOrganisation1, organisation2: duplicateEncryptedDataOrganisation2 },
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

const duplicateDecryptedData = async ({
  organisation,
  nextOrganisationId,
  nextOrganisationName,
  persons,
  users,
  teams,
  consultations,
  treatments,
  medicalFiles,
  actions,
  groups,
  comments,
  passages,
  rencontres,
  territories,
  territoryObservations,
  places,
  relPersonPlaces,
  reports,
  preparePersonForEncryption,
}) => {
  const teamIdsMapped = {};
  const newTeams = [];
  for (const team of teams) {
    const newTeamId = uuidv4();
    teamIdsMapped[team._id] = newTeamId;
    const newTeam = {
      ...team,
      organisation: nextOrganisationId,
      _id: newTeamId,
    };
    newTeams.push(newTeam);
  }

  const userIdsMapped = {};
  const newUsers = [];
  const newRelUserTeams = [];
  for (const user of users) {
    const newUserId = uuidv4();
    userIdsMapped[user._id] = newUserId;
    const newUser = {
      ...user,
      email: user.email.split('@')[0] + '+' + nextOrganisationName + '@' + user.email.split('@')[1],
      organisation: nextOrganisationId,
      _id: newUserId,
    };
    newUsers.push(newUser);
    for (const team of user.teams) {
      newRelUserTeams.push({
        user: newUserId,
        team: teamIdsMapped[team],
        organisation: nextOrganisationId,
        _id: uuidv4(),
      });
    }
  }

  const personIdsMapped = {};
  const newPersons = [];
  for (const person of persons) {
    const newPersonId = uuidv4();
    personIdsMapped[person._id] = newPersonId;
    const newPerson = {
      ...person,
      documents: await recryptPersonRelatedDocuments(person, person._id, newPersonId),
      assignedTeams: person.assignedTeams.map((t) => teamIdsMapped[t]),
      organisation: nextOrganisationId,
      _id: newPersonId,
    };
    newPersons.push(newPerson);
  }
  const consultationIdsMapped = {};
  const newConsultations = [];
  for (const consultation of consultations) {
    const newConsultationId = uuidv4();
    consultationIdsMapped[consultation._id] = newConsultationId;
    const newConsultation = {
      ...consultation,
      documents: await recryptPersonRelatedDocuments(consultation, consultation.person, personIdsMapped[consultation.person]),
      person: personIdsMapped[consultation.person],
      teams: consultation.teams.map((t) => teamIdsMapped[t]),
      organisation: nextOrganisationId,
      _id: newConsultationId,
    };
    newConsultations.push(newConsultation);
  }
  const treatmentIdsMapped = {};
  const newTreatments = [];
  for (const treatment of treatments) {
    const newTreatmentId = uuidv4();
    treatmentIdsMapped[treatment._id] = newTreatmentId;
    const newTreatment = {
      ...treatment,
      documents: await recryptPersonRelatedDocuments(treatment, treatment.person, personIdsMapped[treatment.person]),
      person: personIdsMapped[treatment.person],
      organisation: nextOrganisationId,
      _id: newTreatmentId,
    };
    newTreatments.push(newTreatment);
  }

  const medicalFileIdsMapped = {};
  const newMedicalFiles = [];
  for (const medicalFile of medicalFiles) {
    const newMedicalFileId = uuidv4();
    medicalFileIdsMapped[medicalFile._id] = newMedicalFileId;
    const newMedicalFile = {
      ...medicalFile,
      documents: await recryptPersonRelatedDocuments(medicalFile, medicalFile.person, personIdsMapped[medicalFile.person]),
      person: personIdsMapped[medicalFile.person],
      organisation: nextOrganisationId,
      _id: newMedicalFileId,
    };
    newMedicalFiles.push(newMedicalFile);
  }

  const actionIdsMapped = {};
  const newActions = [];
  for (const action of actions) {
    const newActionId = uuidv4();
    actionIdsMapped[action._id] = newActionId;
    const newAction = {
      ...action,
      person: personIdsMapped[action.person],
      teams: action.teams.map((t) => teamIdsMapped[t]),
      organisation: nextOrganisationId,
      _id: newActionId,
    };
    newActions.push(newAction);
  }

  const groupIdsMapped = {};
  const newGroups = [];
  for (const group of groups) {
    const newGroupId = uuidv4();
    groupIdsMapped[group._id] = newGroupId;
    const newGroup = {
      persons: group.persons.map((p) => personIdsMapped[p]),
      relations: group.relations.map((r) => {
        return {
          ...r,
          persons: r.persons.map((p) => personIdsMapped[p]),
        };
      }),
      organisation: nextOrganisationId,
      _id: newGroupId,
    };
    newGroups.push(newGroup);
  }

  const commentIdsMapped = {};
  const newComments = [];
  for (const comment of comments) {
    const newCommentId = uuidv4();
    commentIdsMapped[comment._id] = newCommentId;
    const newComment = {
      ...comment,
      team: teamIdsMapped[comment.team],
      organisation: nextOrganisationId,
      _id: newCommentId,
    };
    if (!!comment.person) {
      newComment.person = personIdsMapped[comment.person];
    }
    if (!!comment.action) {
      newComment.action = actionIdsMapped[comment.action];
    }
    newComments.push(newComment);
  }

  const passageIdsMapped = {};
  const newPassages = [];
  for (const passage of passages) {
    const newPassageId = uuidv4();
    passageIdsMapped[passage._id] = newPassageId;
    const newPassage = {
      ...passage,
      team: teamIdsMapped[passage.team],
      person: personIdsMapped[passage.person],
      organisation: nextOrganisationId,
      _id: newPassageId,
    };
    newPassages.push(newPassage);
  }

  const rencontreIdsMapped = {};
  const newRencontres = [];
  for (const rencontre of rencontres) {
    const newRencontreId = uuidv4();
    rencontreIdsMapped[rencontre._id] = newRencontreId;
    const newRencontre = {
      ...rencontre,
      team: teamIdsMapped[rencontre.team],
      person: personIdsMapped[rencontre.person],
      organisation: nextOrganisationId,
      _id: newRencontreId,
    };
    newRencontres.push(newRencontre);
  }

  const territoryIdsMapped = {};
  const newTerritories = [];
  for (const territory of territories) {
    const newTerritoryId = uuidv4();
    territoryIdsMapped[territory._id] = newTerritoryId;
    const newTerritory = {
      ...territory,
      organisation: nextOrganisationId,
      _id: newTerritoryId,
    };
    newTerritories.push(newTerritory);
  }

  const territoryObservationIdsMapped = {};
  const newObs = [];
  for (const territoryObservation of territoryObservations) {
    const newTerritoryObservationId = uuidv4();
    territoryObservationIdsMapped[territoryObservation._id] = newTerritoryObservationId;
    const newTerritoryObservation = {
      ...territoryObservation,
      territory: territoryIdsMapped[territoryObservation.territory],
      team: teamIdsMapped[territoryObservation.team],
      organisation: nextOrganisationId,
      _id: newTerritoryObservationId,
    };
    newObs.push(newTerritoryObservation);
  }

  const placeIdsMapped = {};
  const newPlaces = [];
  for (const place of places) {
    const newPlaceId = uuidv4();
    placeIdsMapped[place._id] = newPlaceId;
    const newPlace = {
      ...place,
      organisation: nextOrganisationId,
      _id: newPlaceId,
    };
    newPlaces.push(newPlace);
  }

  const relPersonPlaceIdsMapped = {};
  const newRelPersonPlaces = [];
  for (const relPersonPlace of relPersonPlaces) {
    const newRelPersonPlaceId = uuidv4();
    relPersonPlaceIdsMapped[relPersonPlace._id] = newRelPersonPlaceId;
    const newRelPersonPlace = {
      ...relPersonPlace,
      person: personIdsMapped[relPersonPlace.person],
      place: placeIdsMapped[relPersonPlace.place],
      organisation: nextOrganisationId,
      _id: newRelPersonPlaceId,
    };
    newRelPersonPlaces.push(newRelPersonPlace);
  }

  const reportIdsMapped = {};
  const newReports = [];
  for (const report of reports) {
    const newReportId = uuidv4();
    reportIdsMapped[report._id] = newReportId;
    const newReport = {
      ...report,
      tream: teamIdsMapped[report.team],
      organisation: nextOrganisationId,
      _id: newReportId,
    };
    newReports.push(newReport);
  }

  return {
    organisationId: nextOrganisationId,
    teams: newTeams,
    users: newUsers,
    relUserTeams: newRelUserTeams,
    persons: await Promise.all(newPersons.map(preparePersonForEncryption).map(encryptItem)),
    consultations: await Promise.all(newConsultations.map(prepareConsultationForEncryption(organisation.consultations)).map(encryptItem)),
    treatments: await Promise.all(newTreatments.map(prepareTreatmentForEncryption).map(encryptItem)),
    medicalFiles: await Promise.all(newMedicalFiles.map(prepareMedicalFileForEncryption(organisation.customFieldsMedicalFile)).map(encryptItem)),
    actions: await Promise.all(newActions.map(prepareActionForEncryption).map(encryptItem)),
    groups: await Promise.all(newGroups.map(prepareGroupForEncryption).map(encryptItem)),
    comments: await Promise.all(newComments.map(prepareCommentForEncryption).map(encryptItem)),
    passages: await Promise.all(newPassages.map(preparePassageForEncryption).map(encryptItem)),
    rencontres: await Promise.all(newRencontres.map(prepareRencontreForEncryption).map(encryptItem)),
    territories: await Promise.all(newTerritories.map(prepareTerritoryForEncryption).map(encryptItem)),
    obs: await Promise.all(newObs.map(prepareObsForEncryption(organisation.customFieldsObs)).map(encryptItem)),
    places: await Promise.all(newPlaces.map(preparePlaceForEncryption).map(encryptItem)),
    relPersonPlaces: await Promise.all(newRelPersonPlaces.map(prepareRelPersonPlaceForEncryption).map(encryptItem)),
    reports: await Promise.all(newReports.map(prepareReportForEncryption).map(encryptItem)),
  };
};

const changeDocumentPersonId = async (doc, oldPersonId, newPersonId) => {
  const content = await API.download({
    path: doc.downloadPath ?? `/person/${oldPersonId}/document/${doc.file.filename}`,
    encryptedEntityKey: doc.encryptedEntityKey,
  });
  const docResult = await API.upload({
    path: `/person/${newPersonId}/document`,
    file: new File([content], doc.file.originalname, { type: doc.file.mimetype }),
  });
  const { data: file, encryptedEntityKey } = docResult;
  return {
    _id: file.filename,
    name: doc.file.originalname,
    encryptedEntityKey,
    createdAt: doc.createdAt,
    createdBy: doc.createdBy,
    downloadPath: `/person/${newPersonId}/document/${file.filename}`,
    file,
  };
};

const recryptPersonRelatedDocuments = async (item, oldPersonId, newPersonId) => {
  if (!item.documents || !item.documents.length) return [];
  const updatedDocuments = [];
  for (const doc of item.documents) {
    try {
      const recryptedDocument = await changeDocumentPersonId(doc, oldPersonId, newPersonId);
      updatedDocuments.push(recryptedDocument);
    } catch (e) {
      console.error(e);
      // we need a temporary hack, for the organisations which already changed their encryption key
      // but not all the documents were recrypted
      // we told them to change back from `newKey` to `oldKey` to retrieve the old documents
      // and then change back to `newKey` to recrypt them in the new key
      // SO
      // if the recryption failed, we assume the document might have been encrypted with the newKey already
      // so we push it
      updatedDocuments.push(doc);
    }
  }
  return updatedDocuments;
};
