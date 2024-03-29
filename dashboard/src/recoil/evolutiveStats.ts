import { selector, selectorFamily } from 'recoil';
import { capture } from '../services/sentry';
import type { PersonInstance } from '../types/person';
import type { CustomOrPredefinedField } from '../types/field';
import type { IndicatorsSelection } from '../types/evolutivesStats';
import type { EvolutiveStatsPersonFields, EvolutiveStatOption, EvolutiveStatDateYYYYMMDD } from '../types/evolutivesStats';
import { dayjsInstance } from '../services/date';
import { personFieldsIncludingCustomFieldsSelector } from './persons';

export const evolutiveStatsIndicatorsBaseSelector = selector({
  key: 'evolutiveStatsIndicatorsBaseSelector',
  get: ({ get }) => {
    const allFields = get(personFieldsIncludingCustomFieldsSelector);
    const indicatorsBase = allFields.filter((f) => {
      if (f.name === 'history') return false;
      if (f.name === 'documents') return false;
      switch (f.type) {
        case 'text':
        case 'textarea':
        case 'date':
        case 'date-with-time':
          return false;
        case 'multi-choice':
        case 'number':
        case 'yes-no':
        case 'enum':
        case 'boolean':
        default:
          return f.filterable;
      }
    });

    return indicatorsBase;
  },
});

export const startHistoryFeatureDate = '2022-09-23';

type FieldsMap = Record<CustomOrPredefinedField['name'], CustomOrPredefinedField>;

function getValuesOptionsByField(field: CustomOrPredefinedField, fieldsMap: FieldsMap): Array<EvolutiveStatOption> {
  if (!field) return [];
  const current = fieldsMap[field.name];
  if (!current) return [];
  if (['yes-no'].includes(current.type)) return ['Oui', 'Non', 'Non renseigné'];
  if (['boolean'].includes(current.type)) return ['Oui', 'Non'];
  if (current?.name === 'outOfActiveList') return current.options ?? ['Oui', 'Non'];
  if (current?.options?.length) {
    return [...current?.options, 'Non renseigné'].filter((option) => {
      if (option.includes('Choisissez un genre')) return false;
      return true;
    });
  }
  return ['Non renseigné'];
}

function getValueByField(fieldName: CustomOrPredefinedField['name'], fieldsMap: FieldsMap, value: any): string | Array<string> {
  if (!fieldName) return '';
  const current = fieldsMap[fieldName];
  if (!current) return '';
  if (['yes-no'].includes(current.type)) {
    if (value === 'Oui') return 'Oui';
    return 'Non';
  }
  if (['boolean'].includes(current.type)) {
    if (value === true || value === 'Oui') return 'Oui';
    return 'Non';
  }
  if (current?.name === 'outOfActiveList') {
    if (value === true) return 'Oui';
    return 'Non';
  }
  if (current.type === 'multi-choice') {
    if (Array.isArray(value)) {
      if (value.length === 0) return ['Non renseigné'];
      return value;
    }
    if (value == null || value === '') {
      return ['Non renseigné'];
    }
    return [value];
  }
  if (value == null || value === '') {
    return 'Non renseigné'; // we cover the case of undefined, null, empty string
  }
  if (value.includes('Choisissez un genre')) return 'Non renseigné';
  return value;
}

function getPersonSnapshotAtDate({
  person,
  snapshotDate,
  fieldsMap,
}: {
  person: PersonInstance;
  fieldsMap: FieldsMap;
  snapshotDate: string; // YYYYMMDD
}): PersonInstance | null {
  let snapshot = structuredClone(person);
  const followedSince = dayjsInstance(snapshot.followedSince || snapshot.createdAt).format('YYYYMMDD');
  if (followedSince > snapshotDate) return null;
  const history = snapshot.history;
  if (!history?.length) return snapshot;
  const reversedHistory = [...history].reverse();
  for (const historyItem of reversedHistory) {
    let historyDate = dayjsInstance(historyItem.date).format('YYYYMMDD');
    if (historyDate < snapshotDate) return snapshot;
    for (const historyChangeField of Object.keys(historyItem.data)) {
      const oldValue = getValueByField(historyChangeField, fieldsMap, historyItem.data[historyChangeField].oldValue);
      const historyNewValue = getValueByField(historyChangeField, fieldsMap, historyItem.data[historyChangeField].newValue);
      const currentPersonValue = getValueByField(historyChangeField, fieldsMap, snapshot[historyChangeField]);
      if (JSON.stringify(historyNewValue) !== JSON.stringify(currentPersonValue)) {
        capture(new Error('Incoherent snapshot history'), {
          extra: {
            snapshot,
            historyItem,
            historyChangeField,
            oldValue,
            historyNewValue,
            currentPersonValue,
          },
        });
      }
      if (oldValue === '') continue;
      snapshot = {
        ...snapshot,
        [historyChangeField]: oldValue,
      };
    }
  }
  return snapshot;
}

export const evolutiveStatsPersonSelector = selectorFamily({
  key: 'evolutiveStatsPersonSelector',
  get:
    ({
      startDate,
      persons,
      evolutiveStatsIndicators,
    }: {
      startDate: string | null;
      persons: Array<PersonInstance>;
      evolutiveStatsIndicators: IndicatorsSelection;
    }) =>
    ({ get }) => {
      // concepts:
      // we select "indicators" (for now only one by one is possible) that are fields of the person
      // we want to see the evolution of the number of persons for each value of each indicator
      // one indicator is: one `field`, one `fromValue` and one `toValue`
      // if only `field` is defined, we present a chart with the evolution of number of persons for each value of the field
      // if `fromValue` is defined, we present the same chart filtere with the persons that have this value for the field at the beginning of the history
      // if `toValue` is defined, we also filter the persons that have this value for the field at the end of the history, so that we present two numbers only
      // how do we calculate ?
      // we start by the most recent version of the person, and we go back in time, day by day, to the beginning of the history

      const indicatorsBase = get(evolutiveStatsIndicatorsBaseSelector).filter((f) => {
        if (evolutiveStatsIndicators.find((i) => i.fieldName === f.name)) return true;
        return false;
      });
      const fieldsMap: FieldsMap = indicatorsBase.reduce((acc, field) => {
        acc[field.name] = field;
        return acc;
      }, {} as FieldsMap);
      const personsFieldsInHistoryObject: EvolutiveStatsPersonFields = {};

      // we take the years since the history began, let's say early 2023
      const dates: Record<EvolutiveStatDateYYYYMMDD, number> = {};
      const minimumDateForEvolutiveStats = dayjsInstance(startDate ?? startHistoryFeatureDate).format('YYYYMMDD');
      let date = minimumDateForEvolutiveStats;
      const today = dayjsInstance().format('YYYYMMDD');
      while (date <= today) {
        dates[date] = 0;
        date = dayjsInstance(date).add(1, 'day').format('YYYYMMDD');
      }

      for (const field of indicatorsBase) {
        const options = getValuesOptionsByField(field, fieldsMap);
        personsFieldsInHistoryObject[field.name] = {};
        for (const option of options) {
          personsFieldsInHistoryObject[field.name][option] = {
            ...dates,
          };
        }
      }

      const indicator = evolutiveStatsIndicators[0];
      const indicatorFieldName = indicator?.fieldName;
      if (typeof indicatorFieldName === 'string' && indicator?.fromValue) {
        persons = persons.filter((p) => {
          const snapshot = getPersonSnapshotAtDate({ person: p, snapshotDate: minimumDateForEvolutiveStats, fieldsMap });
          if (!snapshot) return false;
          const isGood = getValueByField(indicatorFieldName, fieldsMap, snapshot[indicatorFieldName]).includes(indicator.fromValue);
          return isGood;
        });
      }

      for (const person of persons) {
        const followedSince = dayjsInstance(person.followedSince || person.createdAt).format('YYYYMMDD');
        const minimumDate = followedSince < minimumDateForEvolutiveStats ? minimumDateForEvolutiveStats : followedSince;
        let currentDate = today;
        let currentPerson = structuredClone(person);
        for (const field of indicatorsBase) {
          const rawValue = getValueByField(field.name, fieldsMap, currentPerson[field.name]);
          if (rawValue === '') continue;
          const valueToLoop = Array.isArray(rawValue) ? rawValue : [rawValue];
          for (const value of valueToLoop) {
            try {
              if (!personsFieldsInHistoryObject[field.name][value]) {
                personsFieldsInHistoryObject[field.name][value] = { ...dates };
              }
              if (!personsFieldsInHistoryObject[field.name][value][currentDate]) {
                personsFieldsInHistoryObject[field.name][value][currentDate] = 0;
              }
              personsFieldsInHistoryObject[field.name][value][currentDate]++;
            } catch (error) {
              capture(error, { extra: { person, field, value, currentDate } });
            }
          }
        }
        const history = person.history;
        if (!!history?.length) {
          const reversedHistory = [...history].reverse();
          for (const historyItem of reversedHistory) {
            let historyDate = dayjsInstance(historyItem.date).format('YYYYMMDD');
            while (currentDate > historyDate && currentDate > minimumDate) {
              currentDate = dayjsInstance(currentDate).subtract(1, 'day').format('YYYYMMDD');
              for (const field of indicatorsBase) {
                const rawValue = getValueByField(field.name, fieldsMap, currentPerson[field.name]);
                if (rawValue === '') continue;
                const valueToLoop = Array.isArray(rawValue) ? rawValue : [rawValue];
                for (const value of valueToLoop) {
                  try {
                    if (!personsFieldsInHistoryObject[field.name][value]) {
                      personsFieldsInHistoryObject[field.name][value] = { ...dates };
                    }
                    if (!personsFieldsInHistoryObject[field.name][value][currentDate]) {
                      personsFieldsInHistoryObject[field.name][value][currentDate] = 0;
                    }
                    personsFieldsInHistoryObject[field.name][value][currentDate]++;
                  } catch (error) {
                    capture(error, { extra: { person, field, value, currentDate } });
                  }
                }
              }
            }
            for (const historyChangeField of Object.keys(historyItem.data)) {
              const oldValue = getValueByField(historyChangeField, fieldsMap, historyItem.data[historyChangeField].oldValue);
              const historyNewValue = getValueByField(historyChangeField, fieldsMap, historyItem.data[historyChangeField].newValue);
              const currentPersonValue = getValueByField(historyChangeField, fieldsMap, currentPerson[historyChangeField]);
              if (JSON.stringify(historyNewValue) !== JSON.stringify(currentPersonValue)) {
                capture(new Error('Incoherent history'), {
                  extra: {
                    person,
                    currentPerson,
                    historyItem,
                    historyChangeField,
                    oldValue,
                    historyNewValue,
                    currentPersonValue,
                  },
                });
              }
              if (oldValue === '') continue;
              currentPerson = {
                ...currentPerson,
                [historyChangeField]: oldValue,
              };
            }
          }
        }
        while (currentDate >= minimumDate) {
          currentDate = dayjsInstance(currentDate).subtract(1, 'day').format('YYYYMMDD');
          for (const field of indicatorsBase) {
            const rawValue = getValueByField(field.name, fieldsMap, currentPerson[field.name]);
            if (rawValue === '') continue;
            const valueToLoop = Array.isArray(rawValue) ? rawValue : [rawValue];
            for (const value of valueToLoop) {
              try {
                if (!personsFieldsInHistoryObject[field.name][value]) {
                  personsFieldsInHistoryObject[field.name][value] = { ...dates };
                }
                if (!personsFieldsInHistoryObject[field.name][value][currentDate]) {
                  personsFieldsInHistoryObject[field.name][value][currentDate] = 0;
                }
                personsFieldsInHistoryObject[field.name][value][currentDate]++;
              } catch (error) {
                capture(error, { extra: { person, field, value, currentDate } });
              }
            }
          }
        }
      }
      return personsFieldsInHistoryObject;
    },
});
