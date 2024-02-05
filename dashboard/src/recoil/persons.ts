import { getCacheItemDefaultValue, setCacheItem } from '../services/dataManagement';
import { atom, selector, useRecoilValue } from 'recoil';
import { organisationState } from './auth';
import { toast } from 'react-toastify';
import { capture } from '../services/sentry';
import type { PersonInstance } from '../types/person';
import type { PredefinedField, CustomField, CustomOrPredefinedField } from '../types/field';
import type { EvolutiveStatsPersonFields, EvolutiveStatOption, EvolutiveStatDateYYYYMMDD } from '../types/evolutivesStats';
import { dayjsInstance } from '../services/date';

const collectionName = 'person';
export const personsState = atom<PersonInstance[]>({
  key: collectionName,
  default: selector({
    key: 'person/default',
    get: async () => {
      const cache = await getCacheItemDefaultValue('person', []);
      return cache;
    },
  }),
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
});

/*

All fields for person are
- personFieldsSelector: fields chosen by Mano, they afre fixed and cannot be changed (yet) by the user
- fieldsPersonsCustomizableOptionsSelector: fields chosen by Mano but that can have options chosen by the user
- customFieldsPersonsSelector: fields chosen by the user

*/
export const personFieldsSelector = selector({
  key: 'personFieldsSelector',
  get: ({ get }) => {
    const organisation = get(organisationState);
    return organisation?.personFields || [];
  },
});

export const fieldsPersonsCustomizableOptionsSelector = selector<CustomField[]>({
  key: 'fieldsPersonsCustomizableOptionsSelector',
  get: ({ get }) => {
    const organisation = get(organisationState);
    return (organisation?.fieldsPersonsCustomizableOptions || []) as CustomField[];
  },
});

export const customFieldsPersonsSelector = selector({
  key: 'customFieldsPersonsSelector',
  get: ({ get }) => {
    const organisation = get(organisationState);
    return organisation?.customFieldsPersons || [];
  },
});

export const flattenedCustomFieldsPersonsSelector = selector({
  key: 'flattenedCustomFieldsPersonsSelector',
  get: ({ get }) => {
    const customFieldsPersonsSections = get(customFieldsPersonsSelector);
    const customFieldsPersons = [];
    for (const section of customFieldsPersonsSections) {
      for (const field of section.fields) {
        customFieldsPersons.push(field);
      }
    }
    return customFieldsPersons;
  },
});

/* Other utils selector */

export const personFieldsIncludingCustomFieldsSelector = selector({
  key: 'personFieldsIncludingCustomFieldsSelector',
  get: ({ get }) => {
    const personFields = get(personFieldsSelector) as PredefinedField[];
    const fieldsPersonsCustomizableOptions = get(fieldsPersonsCustomizableOptionsSelector) as CustomField[];
    const flattenedCustomFieldsPersons = get(flattenedCustomFieldsPersonsSelector);
    return [
      ...personFields,
      ...[...fieldsPersonsCustomizableOptions, ...flattenedCustomFieldsPersons].map((f) => {
        const field: CustomOrPredefinedField = {
          name: f.name,
          type: f.type,
          label: f.label,
          encrypted: true,
          importable: true,
          options: f.options || undefined,
          filterable: true,
        };
        return field;
      }),
    ];
  },
});

export const allowedPersonFieldsInHistorySelector = selector({
  key: 'allowedPersonFieldsInHistorySelector',
  get: ({ get }) => {
    const allFields = get(personFieldsIncludingCustomFieldsSelector);
    return allFields.map((f) => f.name).filter((f) => f !== 'history');
  },
});

export const evolutiveStatsPersonSelector = selector({
  key: 'evolutiveStatsPersonSelector',
  get: ({ get }) => {
    const allFields = get(personFieldsIncludingCustomFieldsSelector);
    const fields = allFields.filter((f) => {
      if (f.name === 'history') return false;
      if (['text', 'textarea', 'number', 'date', 'date-with-time'].includes(f.type)) return false;
      // remains 'yes-no' | 'enum' | 'multi-choice' | 'boolean'
      return f.filterable;
    });
    const personsFieldsInHistoryObject: EvolutiveStatsPersonFields = {};
    const persons = get(personsState);

    function getValuesOptionsByField(field: CustomOrPredefinedField): Array<EvolutiveStatOption> {
      if (!field) return [];
      const current = fields.find((_field) => _field.name === field.name);
      if (!current) return [];
      if (['yes-no'].includes(current.type)) return ['Oui', 'Non', 'Non renseigné'];
      if (['boolean'].includes(current.type)) return ['Oui', 'Non'];
      if (current?.name === 'outOfActiveList') return current.options ?? ['Oui', 'Non'];
      if (current?.options?.length) return [...current?.options, 'Non renseigné'];
      return ['Non renseigné'];
    }

    // we take the years since the history began, let's say early 2023
    const dates: Record<EvolutiveStatDateYYYYMMDD, number> = {};
    let date = dayjsInstance('2023-01-01').format('YYYYMMDD');
    const today = dayjsInstance().format('YYYYMMDD');
    while (date !== today) {
      dates[date] = 0;
      date = dayjsInstance(date).add(1, 'day').format('YYYYMMDD');
    }

    for (const field of fields) {
      const options = getValuesOptionsByField(field);
      personsFieldsInHistoryObject[field.name] = {};
      for (const option of options) {
        personsFieldsInHistoryObject[field.name][option] = {
          ...dates,
        };
      }
    }

    for (const person of persons) {
      const minimumDate = dayjsInstance(person.followedSince || person.createdAt).format('YYYYMMDD');
      let currentDate = today;
      let currentPerson = structuredClone(person);
      for (const field of fields) {
        const value = currentPerson[field.name];
        if (value == null || value === '') {
          // we cover the case of undefined, null, empty string
          continue;
        }
        personsFieldsInHistoryObject[field.name][value][currentDate]++;
      }
      const history = person.history;
      if (!!history?.length) {
        const reversedHistory = [...history].reverse();
        for (const historyItem of reversedHistory) {
          let historyDate = dayjsInstance(historyItem.date).format('YYYYMMDD');
          while (currentDate !== historyDate) {
            currentDate = dayjsInstance(currentDate).subtract(1, 'day').format('YYYYMMDD');
            for (const field of fields) {
              const value = currentPerson[field.name];
              if (value == null || value === '') {
                // we cover the case of undefined, null, empty string
                continue;
              }
              personsFieldsInHistoryObject[field.name][value][currentDate]++;
            }
          }
          for (const historyChangeField of Object.keys(historyItem.data)) {
            const oldValue = historyItem.data[historyChangeField].oldValue;
            if (historyItem.data[historyChangeField].newValue !== currentPerson[historyChangeField]) {
              capture(new Error('Incoherent history'), {
                extra: {
                  person,
                  historyItem,
                  historyChangeField,
                },
              });
            }
            currentPerson[historyChangeField] = oldValue;
          }
        }
      }
      while (currentDate !== minimumDate) {
        currentDate = dayjsInstance(currentDate).subtract(1, 'day').format('YYYYMMDD');
        for (const field of fields) {
          const value = currentPerson[field.name];
          if (value == null || value === '') {
            // we cover the case of undefined, null, empty string
            continue;
          }
          personsFieldsInHistoryObject[field.name][value][currentDate]++;
        }
      }
    }
  },
});

export const filterPersonsBaseSelector = selector({
  key: 'filterPersonsBaseSelector',
  get: ({ get }) => {
    const personFields = get(personFieldsSelector) as PredefinedField[];
    const filterPersonsBase = [];
    for (const field of personFields) {
      if (!field.filterable) continue;
      filterPersonsBase.push({
        // why ? IDK
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
    filterPersonsBase.push({
      field: 'hasAtLeastOneConsultation',
      label: 'A eu une consultation',
      type: 'boolean',
    });
    return filterPersonsBase;
  },
});

/*

Prepare for encryption hook

*/

export const usePreparePersonForEncryption = () => {
  const flattenedCustomFieldsPersons = useRecoilValue(flattenedCustomFieldsPersonsSelector);
  const fieldsPersonsCustomizableOptions = useRecoilValue(fieldsPersonsCustomizableOptionsSelector);
  const personFields = useRecoilValue(personFieldsSelector) as PredefinedField[];
  const preparePersonForEncryption = (person: PersonInstance, { checkRequiredFields = true } = {}) => {
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
      ...flattenedCustomFieldsPersons.map((f) => f.name),
      ...fieldsPersonsCustomizableOptions.map((f) => f.name),
      ...encryptedFields,
    ];
    const decrypted: any = {};
    for (let field of encryptedFieldsIncludingCustom) {
      decrypted[field] = person[field] as never;
    }
    return {
      _id: person._id,
      organisation: person.organisation,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
      deletedAt: person.deletedAt,
      outOfActiveList: person.outOfActiveList,

      decrypted,
      entityKey: person.entityKey,
    };
  };
  return preparePersonForEncryption;
};

type SortOrder = 'ASC' | 'DESC';

type SortBy = 'name' | 'createdAt' | 'formattedBirthDate' | 'alertness' | 'group' | 'user' | 'followedSince' | 'lastUpdateCheckForGDPR';

const defaultSort = (a: PersonInstance, b: PersonInstance, sortOrder: SortOrder) =>
  sortOrder === 'ASC' ? (a.name || '').localeCompare(b.name) : (b.name || '').localeCompare(a.name);

export const sortPersons = (sortBy: SortBy, sortOrder: SortOrder) => (a: PersonInstance, b: PersonInstance) => {
  if (sortBy === 'createdAt') {
    return sortOrder === 'ASC'
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }
  if (sortBy === 'formattedBirthDate') {
    if (!a.birthdate && !b.birthdate) return defaultSort(a, b, sortOrder);
    if (!a.birthdate) return sortOrder === 'ASC' ? 1 : -1;
    if (!b.birthdate) return sortOrder === 'DESC' ? 1 : -1;
    return sortOrder === 'ASC'
      ? new Date(b.birthdate).getTime() - new Date(a.birthdate).getTime()
      : new Date(a.birthdate).getTime() - new Date(b.birthdate).getTime();
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
    return sortOrder === 'ASC'
      ? new Date(b.followedSince).getTime() - new Date(a.followedSince).getTime()
      : new Date(a.followedSince).getTime() - new Date(b.followedSince).getTime();
  }
  if (sortBy === 'lastUpdateCheckForGDPR') {
    if (!a.lastUpdateCheckForGDPR && !b.lastUpdateCheckForGDPR) return defaultSort(a, b, sortOrder);
    if (!a.lastUpdateCheckForGDPR) return sortOrder === 'ASC' ? 1 : -1;
    if (!b.lastUpdateCheckForGDPR) return sortOrder === 'DESC' ? 1 : -1;
    return sortOrder === 'ASC'
      ? new Date(b.lastUpdateCheckForGDPR).getTime() - new Date(a.lastUpdateCheckForGDPR).getTime()
      : new Date(a.lastUpdateCheckForGDPR).getTime() - new Date(b.lastUpdateCheckForGDPR).getTime();
  }
  // DEFAULT SORTING
  // (sortBy === 'name')
  return defaultSort(a, b, sortOrder);
};
