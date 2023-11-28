import { encryptVerificationKey } from '../services/encryption';
import { capture } from '../services/sentry';
import API, { getHashedOrgEncryptionKey, decryptAndEncryptItem } from '../services/api';

export default async function duplicate({ organisation }) {
  const hashedOrgEncryptionKey = getHashedOrgEncryptionKey();
  const encryptedVerificationKey = await encryptVerificationKey(hashedOrgEncryptionKey);

  async function recrypt(path, callback = null) {
    const cryptedItems = await API.get({
      skipDecrypt: true,
      path,
      query: {
        organisation: organisation._id,
        limit: String(Number.MAX_SAFE_INTEGER),
        page: String(0),
        after: String(0),
        withDeleted: true,
      },
    });
    const encryptedItems = [];
    for (const item of cryptedItems.data) {
      try {
        const recrypted = await decryptAndEncryptItem(item, previousKey.current, hashedOrgEncryptionKey, callback);
        if (recrypted) encryptedItems.push(recrypted);
      } catch (e) {
        capture(e);
        throw new Error(
          `Impossible de déchiffrer et rechiffrer l'élément suivant: ${path} ${item._id}. Notez le numéro affiché et fournissez le à l'équipe de support.`
        );
      }
    }
    return encryptedItems;
  }

  const encryptedPersons = await recrypt('/person', async (decryptedData, item) =>
    recryptPersonRelatedDocuments(decryptedData, item._id, previousKey.current, hashedOrgEncryptionKey)
  );
  const encryptedConsultations = await recrypt('/consultation', async (decryptedData) =>
    recryptPersonRelatedDocuments(decryptedData, decryptedData.person, previousKey.current, hashedOrgEncryptionKey)
  );
  const encryptedTreatments = await recrypt('/treatment', async (decryptedData) =>
    recryptPersonRelatedDocuments(decryptedData, decryptedData.person, previousKey.current, hashedOrgEncryptionKey)
  );
  const encryptedMedicalFiles = await recrypt('/medical-file', async (decryptedData) =>
    recryptPersonRelatedDocuments(decryptedData, decryptedData.person, previousKey.current, hashedOrgEncryptionKey)
  );
  const encryptedGroups = await recrypt('/group');
  const encryptedActions = await recrypt('/action');
  const encryptedComments = await recrypt('/comment');
  const encryptedPassages = await recrypt('/passage');
  const encryptedRencontres = await recrypt('/rencontre');
  const encryptedTerritories = await recrypt('/territory');
  const encryptedTerritoryObservations = await recrypt('/territory-observation');
  const encryptedPlaces = await recrypt('/place');
  const encryptedRelsPersonPlace = await recrypt('/relPersonPlace');
  const encryptedReports = await recrypt('/report');

  const totalToEncrypt =
    encryptedPersons.length +
    encryptedGroups.length +
    encryptedActions.length +
    encryptedConsultations.length +
    encryptedTreatments.length +
    encryptedMedicalFiles.length +
    encryptedComments.length +
    encryptedPassages.length +
    encryptedRencontres.length +
    encryptedTerritories.length +
    encryptedTerritoryObservations.length +
    encryptedRelsPersonPlace.length +
    encryptedPlaces.length +
    encryptedReports.length;

  totalDurationOnServer.current = totalToEncrypt * 0.005; // average 5 ms in server

  const res = await API.post({
    path: '/encrypt',
    body: {
      persons: encryptedPersons,
      groups: encryptedGroups,
      actions: encryptedActions,
      consultations: encryptedConsultations,
      treatments: encryptedTreatments,
      medicalFiles: encryptedMedicalFiles,
      comments: encryptedComments,
      passages: encryptedPassages,
      rencontres: encryptedRencontres,
      territories: encryptedTerritories,
      observations: encryptedTerritoryObservations,
      places: encryptedPlaces,
      relsPersonPlace: encryptedRelsPersonPlace,
      reports: encryptedReports,
      encryptedVerificationKey,
    },
    query: {
      encryptionLastUpdateAt: organisation.encryptionLastUpdateAt,
      encryptionEnabled: true,
      changeMasterKey: true,
    },
  });

  if (res.ok) {
  }
}

const recryptDocument = async (doc, personId, { fromKey, toKey }) => {
  const content = await API.download(
    {
      path: doc.downloadPath ?? `/person/${personId}/document/${doc.file.filename}`,
      encryptedEntityKey: doc.encryptedEntityKey,
    },
    fromKey
  );
  const docResult = await API.upload(
    {
      path: `/person/${personId}/document`,
      file: new File([content], doc.file.originalname, { type: doc.file.mimetype }),
    },
    toKey
  );
  const { data: file, encryptedEntityKey } = docResult;
  return {
    _id: file.filename,
    name: doc.file.originalname,
    encryptedEntityKey,
    createdAt: doc.createdAt,
    createdBy: doc.createdBy,
    downloadPath: `/person/${personId}/document/${file.filename}`,
    file,
  };
};

const recryptPersonRelatedDocuments = async (item, id, oldKey, newKey) => {
  if (!item.documents || !item.documents.length) return item;
  const updatedDocuments = [];
  for (const doc of item.documents) {
    try {
      const recryptedDocument = await recryptDocument(doc, id, { fromKey: oldKey, toKey: newKey });
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
  return { ...item, documents: updatedDocuments };
};
