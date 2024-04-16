import { atom, selector } from 'recoil';
import { organisationState } from './auth';
import { looseUuidRegex } from '../utils/regex';
import { capture } from '../services/sentry';
import { Alert } from 'react-native';

export const medicalFileState = atom({
  key: 'medicalFilesState',
  default: [],
});

export const customFieldsMedicalFileSelector = selector({
  key: 'customFieldsMedicalFileSelector',
  get: ({ get }) => {
    const organisation = get(organisationState);
    if (Array.isArray(organisation.customFieldsMedicalFile) && organisation.customFieldsMedicalFile.length) {
      return organisation.customFieldsMedicalFile;
    }
    return defaultMedicalFileCustomFields;
  },
});

export const groupedCustomFieldsMedicalFileSelector = selector({
  key: 'groupedCustomFieldsMedicalFileSelector',
  get: ({ get }) => {
    const organisation = get(organisationState);
    if (Array.isArray(organisation.groupedCustomFieldsMedicalFile) && organisation.groupedCustomFieldsMedicalFile.length) {
      return organisation.groupedCustomFieldsMedicalFile;
    }
    return [{ name: 'Groupe par défaut', fields: defaultMedicalFileCustomFields }];
  },
});

const encryptedFields = ['person', 'documents', 'comments', 'history'];

export const prepareMedicalFileForEncryption = (customFieldsMedicalFile) => (medicalFile) => {
  try {
    if (!looseUuidRegex.test(medicalFile.person)) {
      throw new Error('MedicalFile is missing person');
    }
  } catch (error) {
    Alert.alert(
      "Le dossier médical n'a pas été sauvegardé car son format était incorrect.",
      "Vous pouvez vérifier son contenu et tenter de le sauvegarder à nouveau. L'équipe technique a été prévenue et va travailler sur un correctif."
    );
    capture(error);
    throw error;
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

const defaultMedicalFileCustomFields = [
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
