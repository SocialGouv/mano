import { setCacheItem } from '../services/dataManagement';
import { atom, selector, useRecoilValue } from 'recoil';
import { organisationState } from './auth';
import { toast } from 'react-toastify';
import { capture } from '../services/sentry';

const collectionName = 'person';
export const personsState = atom({
  key: collectionName,
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
});

/*

All fields for person are
- personFieldsSelector: fields chosen by Mano, they afre fixed and cannot be changed (yet) by the user
- fieldsPersonsCustomizableOptionsSelector: fields chosen by Mano but that can have options chosen by the user
- customFieldsPersonsMedicalSelector: fields chosen by the user for medical
- customFieldsPersonsSocialSelector: fields chosen by the user for social

*/
export const personFieldsSelector = selector({
  key: 'personFieldsSelector',
  get: ({ get }) => {
    const organisation = get(organisationState);
    return organisation.personFields;
  },
});

export const fieldsPersonsCustomizableOptionsSelector = selector({
  key: 'fieldsPersonsCustomizableOptionsSelector',
  get: ({ get }) => {
    const organisation = get(organisationState);
    return organisation.fieldsPersonsCustomizableOptions;
  },
});

export const customFieldsPersonsMedicalSelector = selector({
  key: 'customFieldsPersonsMedicalSelector',
  get: ({ get }) => {
    const organisation = get(organisationState);
    return organisation.customFieldsPersonsMedical;
  },
});

export const customFieldsPersonsSocialSelector = selector({
  key: 'customFieldsPersonsSocialSelector',
  get: ({ get }) => {
    const organisation = get(organisationState);
    return organisation.customFieldsPersonsSocial;
  },
});

/* Other utils selector */

export const personFieldsIncludingCustomFieldsSelector = selector({
  key: 'personFieldsIncludingCustomFieldsSelector',
  get: ({ get }) => {
    const personFields = get(personFieldsSelector);
    const fieldsPersonsCustomizableOptions = get(fieldsPersonsCustomizableOptionsSelector);
    const customFieldsPersonsSocial = get(customFieldsPersonsSocialSelector);
    const customFieldsPersonsMedical = get(customFieldsPersonsMedicalSelector);
    return [
      ...personFields,
      ...[...fieldsPersonsCustomizableOptions, ...customFieldsPersonsMedical, ...customFieldsPersonsSocial].map((f) => {
        return {
          name: f.name,
          type: f.type,
          label: f.label,
          encrypted: true,
          importable: true,
          options: f.options || null,
        };
      }),
    ];
  },
});

export const allowedFieldsInHistorySelector = selector({
  key: 'allowedFieldsInHistorySelector',
  get: ({ get }) => {
    const allFields = get(personFieldsIncludingCustomFieldsSelector);
    return allFields.map((f) => f.name).filter((f) => f !== 'history');
  },
});

export const filterPersonsBaseSelector = selector({
  key: 'filterPersonsBaseSelector',
  get: ({ get }) => {
    const personFields = get(personFieldsSelector);
    const filterPersonsBase = [];
    for (const field of personFields) {
      if (!field.filterable) continue;
      filterPersonsBase.push({
        field: field.name,
        ...field,
      });
      if (field.name === 'birthdate') {
        filterPersonsBase.push({
          field: 'age',
          label: 'Age',
          type: 'number',
          filterable: true,
        });
      }
    }
    return filterPersonsBase;
  },
});

export const filterConsultationSelector = selector({
  key: 'filterConsultationSelector',
  get: ({ get }) => {
    return [
    {
      field: 'consultations',
      label: 'A eu une consultation',
      type: 'boolean',
      filterable: true,
    }
    ];
  },
});

/*

Prepare for encryption hook

*/

export const usePreparePersonForEncryption = () => {
  const customFieldsMedical = useRecoilValue(customFieldsPersonsMedicalSelector);
  const customFieldsSocial = useRecoilValue(customFieldsPersonsSocialSelector);
  const fieldsPersonsCustomizableOptions = useRecoilValue(fieldsPersonsCustomizableOptionsSelector);
  const personFields = useRecoilValue(personFieldsSelector);
  const preparePersonForEncryption = (person, { checkRequiredFields = true } = {}) => {
    if (!!checkRequiredFields) {
      try {
        if (!person.name) {
          throw new Error('Person is missing name');
        }
      } catch (error) {
        toast.error(
          "La personne n'a pas été sauvegardée car son format était incorrect. Vous pouvez vérifier son contenu et tenter de la sauvegarder à nouveau. L'équipe technique a été prévenue et va travailler sur un correctif."
        );
        capture(error, { extra: { person } });
        throw error;
      }
    }
    const encryptedFields = personFields.filter((f) => f.encrypted).map((f) => f.name);
    const encryptedFieldsIncludingCustom = [
      ...customFieldsSocial.map((f) => f.name),
      ...customFieldsMedical.map((f) => f.name),
      ...fieldsPersonsCustomizableOptions.map((f) => f.name),
      ...encryptedFields,
    ];
    const decrypted = {};
    for (let field of encryptedFieldsIncludingCustom) {
      decrypted[field] = person[field];
    }
    return {
      _id: person._id,
      organisation: person.organisation,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
      outOfActiveList: person.outOfActiveList,

      decrypted,
      entityKey: person.entityKey,
    };
  };
  return preparePersonForEncryption;
};

const defaultSort = (a, b, sortOrder) => (sortOrder === 'ASC' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

export const sortPersons = (sortBy, sortOrder) => (a, b) => {
  if (sortBy === 'createdAt') {
    return sortOrder === 'ASC' ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt);
  }
  if (sortBy === 'formattedBirthDate') {
    if (!a.birthdate && !b.birthdate) return defaultSort(a, b, sortOrder);
    if (!a.birthdate) return sortOrder === 'ASC' ? 1 : -1;
    if (!b.birthdate) return sortOrder === 'DESC' ? 1 : -1;
    return sortOrder === 'ASC' ? new Date(b.birthdate) - new Date(a.birthdate) : new Date(a.birthdate) - new Date(b.birthdate);
  }
  if (sortBy === 'alertness') {
    if (a.alertness === b.alertness) return defaultSort(a, b, sortOrder);
    if (!a.alertness) return sortOrder === 'ASC' ? 1 : -1;
    if (!b.alertness) return sortOrder === 'DESC' ? 1 : -1;
    return 0;
  }
  if (sortBy === 'group') {
    if (!!a.group === !!b.group) return defaultSort(a, b, sortOrder);
    if (!a.group) return sortOrder === 'ASC' ? 1 : -1;
    if (!b.group) return sortOrder === 'DESC' ? 1 : -1;
    return 0;
  }
  if (sortBy === 'user') {
    if (!a.userPopulated && !b.userPopulated) return defaultSort(a, b, sortOrder);
    if (!a.userPopulated) return sortOrder === 'ASC' ? 1 : -1;
    if (!b.userPopulated) return sortOrder === 'ASC' ? -1 : 1;
    return sortOrder === 'ASC' ? a.userPopulated.name.localeCompare(b.userPopulated.name) : b.userPopulated.name.localeCompare(a.userPopulated.name);
  }
  if (sortBy === 'followedSince') {
    if (!a.followedSince && !b.followedSince) return defaultSort(a, b, sortOrder);
    if (!a.followedSince) return sortOrder === 'ASC' ? 1 : -1;
    if (!b.followedSince) return sortOrder === 'DESC' ? 1 : -1;
    return sortOrder === 'ASC' ? new Date(b.followedSince) - new Date(a.followedSince) : new Date(a.followedSince) - new Date(b.followedSince);
  }
  if (sortBy === 'lastUpdateCheckForGDPR') {
    if (!a.lastUpdateCheckForGDPR && !b.lastUpdateCheckForGDPR) return defaultSort(a, b, sortOrder);
    if (!a.lastUpdateCheckForGDPR) return sortOrder === 'ASC' ? 1 : -1;
    if (!b.lastUpdateCheckForGDPR) return sortOrder === 'DESC' ? 1 : -1;
    return sortOrder === 'ASC'
      ? new Date(b.lastUpdateCheckForGDPR) - new Date(a.lastUpdateCheckForGDPR)
      : new Date(a.lastUpdateCheckForGDPR) - new Date(b.lastUpdateCheckForGDPR);
  }
  // DEFAULT SORTING
  // (sortBy === 'name')
  return defaultSort(a, b, sortOrder);
};
