import { manoCacheStorage } from '../services/dataManagement';
import { atom, selector } from 'recoil';
import { organisationState } from './auth';

const collectionName = 'medical-file';
export const medicalFileState = atom({
  key: collectionName,
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => manoCacheStorage?.setItem(collectionName, newValue))],
});

export const customFieldsMedicalFileSelector = selector({
  key: 'customFieldsMedicalFileSelector',
  get: ({ get }) => {
    const organisation = get(organisationState);
    if (Array.isArray(organisation.customFieldsMedicalFile)) return organisation.customFieldsMedicalFile;
    return defaultMedicalFileCustomFields;
  },
});

const encryptedFields = ['person', 'documents'];

export const prepareMedicalFileForEncryption = (customFieldsMedicalFileSelector) => (medicalFile) => {
  const encryptedFieldsIncludingCustom = [...customFieldsMedicalFileSelector.map((f) => f.name), ...encryptedFields];
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
