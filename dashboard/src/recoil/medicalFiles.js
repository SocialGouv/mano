import { atom, selector } from 'recoil';
import { organisationState } from './auth';
import { capture } from '../services/sentry';
import { toast } from 'react-toastify';
import { looseUuidRegex } from '../utils';

const collectionName = 'medical-file';
export const medicalFileState = atom({
  key: collectionName,
  default: [],
});

export const customFieldsMedicalFileSelector = selector({
  key: 'customFieldsMedicalFileSelector',
  get: ({ get }) => {
    const organisation = get(organisationState);
    if (Array.isArray(organisation.customFieldsMedicalFile)) return organisation.customFieldsMedicalFile;
    return defaultMedicalFileCustomFields;
  },
});

const encryptedFields = ['person', 'documents', 'comments'];

export const prepareMedicalFileForEncryption =
  (customFieldsMedicalFile) =>
  (medicalFile, { checkRequiredFields = true } = {}) => {
    if (!!checkRequiredFields) {
      try {
        if (!looseUuidRegex.test(medicalFile.person)) {
          throw new Error('MedicalFile is missing person');
        }
      } catch (error) {
        toast.error(
          "Le dossier médical n'a pas été sauvegardé car son format était incorrect. Vous pouvez vérifier son contenu et tenter de le sauvegarder à nouveau. L'équipe technique a été prévenue et va travailler sur un correctif."
        );
        capture(error, { extra: { medicalFile } });
        throw error;
      }
    }
    const encryptedFieldsIncludingCustom = [...customFieldsMedicalFile.map((f) => f.name), ...encryptedFields];
    const decrypted = {};
    for (let field of encryptedFieldsIncludingCustom) {
      decrypted[field] = medicalFile[field];
    }
    return {
      _id: medicalFile._id,
      createdAt: medicalFile.createdAt,
      updatedAt: medicalFile.updatedAt,
      organisation: medicalFile.organisation,

      decrypted,
      entityKey: medicalFile.entityKey,
    };
  };

export const defaultMedicalFileCustomFields = [
  {
    name: 'numeroSecuriteSociale',
    label: 'Numéro de sécurité sociale',
    type: 'text',
    options: null,
    enabled: true,
    required: false,
    showInStats: false,
  },
];
