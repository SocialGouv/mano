import { storage } from '../services/dataManagement';
import { atom, selector, useRecoilValue } from 'recoil';
import { organisationState } from './auth';

export const personsState = atom({
  key: 'personsState',
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => storage.set('person', JSON.stringify(newValue)))],
});

/*

Fields for person are managed by groups (like consultations)


*/
export const personFieldsSelector = selector({
  key: 'personFieldsSelector',
  get: ({ get }) => {
    const organisation = get(organisationState);
    return organisation.customFieldsPersons || [];
  },
});

export const flattenedPersonFieldsSelector = selector({
  key: 'flattenedPersonFieldsSelector',
  get: ({ get }) => {
    const personFields = get(personFieldsSelector);
    return personFields.reduce((acc, group) => {
      return [...acc, ...group.fields];
    }, []);
  },
});

/*

To be removed in the next PR where we'll setup all person fields custom

fieldsPersonsCustomizableOptionsSelector
customFieldsPersonsMedicalSelector
customFieldsPersonsSocialSelector

 */
export const fieldsPersonsCustomizableOptionsSelector = selector({
  key: 'fieldsPersonsCustomizableOptionsSelector',
  get: ({ get }) => {
    const flattenedPersonFields = get(flattenedPersonFieldsSelector);
    return [flattenedPersonFields.find((f) => f.name === 'outOfActiveListReasons')];
  },
});

export const customFieldsPersonsMedicalSelector = selector({
  key: 'customFieldsPersonsMedicalSelector',
  get: ({ get }) => {
    const personFields = get(personFieldsSelector);
    return personFields.find((group) => group.name === 'Informations médicales').fields;
  },
});

export const customFieldsPersonsSocialSelector = selector({
  key: 'customFieldsPersonsSocialSelector',
  get: ({ get }) => {
    const personFields = get(personFieldsSelector);
    return personFields.find((group) => group.name === 'Informations sociales').fields;
  },
});

/* Other utils selector */

export const allowedFieldsInHistorySelector = selector({
  key: 'allowedFieldsInHistorySelector',
  get: ({ get }) => {
    const flattenedPersonFields = get(flattenedPersonFieldsSelector);
    return flattenedPersonFields.map((f) => f.name).filter((f) => f !== 'history');
  },
});

export const filterPersonsBaseSelector = selector({
  key: 'filterPersonsBaseSelector',
  get: ({ get }) => {
    const flattenedPersonFields = get(flattenedPersonFieldsSelector);
    return flattenedPersonFields.filter((m) => m.filterable).map(({ name, ...rest }) => ({ field: name, ...rest }));
  },
});

/*

Prepare for encryption hook

*/

export const usePreparePersonForEncryption = () => {
  const flattenedPersonFields = useRecoilValue(flattenedPersonFieldsSelector);
  const preparePersonForEncryption = (person) => {
    const encryptedFields = flattenedPersonFields.filter((f) => f.encrypted !== false).map((f) => f.name);
    const decrypted = {};
    for (let field of encryptedFields) {
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
