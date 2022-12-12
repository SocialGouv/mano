import { setCacheItem } from '../services/dataManagement';
import { atom, selector, useRecoilValue } from 'recoil';
import { organisationState } from './auth';

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
    return personFields.filter((m) => m.filterable).map(({ name, ...rest }) => ({ field: name, ...rest }));
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
  const preparePersonForEncryption = (person) => {
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
