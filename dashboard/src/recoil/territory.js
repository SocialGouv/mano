import { setCacheItem } from '../services/dataManagement';
import { atom, selector, useRecoilValue } from 'recoil';
import { organisationState } from './auth';

const collectionName = 'territory';
export const territoriesState = atom({
  key: collectionName,
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => setCacheItem(collectionName, newValue))],
});

export const territoryEncryptedFieldsSelector = selector({
  key: 'territoryEncryptedFieldsSelector',
  get: ({ get }) => {
    const organisation = get(organisationState);
    return organisation.territoryFields;
  },
});

export const usePrepareTerritoryForEncryption = () => {
  const encryptedFields = useRecoilValue(territoryEncryptedFieldsSelector);

  return (territory) => {
    const decrypted = {};
    for (let field of encryptedFields) {
      decrypted[field.name] = territory[field.name];
    }
    return {
      _id: territory._id,
      createdAt: territory.createdAt,
      updatedAt: territory.updatedAt,
      organisation: territory.organisation,

      decrypted,
      entityKey: territory.entityKey,
    };
  };
};

const defaultSort = (a, b, sortOrder) => (sortOrder === 'ASC' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

export const sortTerritories = (sortBy, sortOrder) => (a, b) => {
  if (sortBy === 'types') {
    if (!a.types?.length && !b.types?.length) return defaultSort(a, b, sortOrder);
    if (!a.types?.length) return sortOrder === 'ASC' ? 1 : -1;
    if (!b.types?.length) return sortOrder === 'ASC' ? -1 : 1;
    const aTypes = a.types.join(' ');
    const bTypes = b.types.join(' ');
    return sortOrder === 'ASC' ? aTypes.localeCompare(bTypes) : bTypes.localeCompare(aTypes);
  }
  if (sortBy === 'perimeter') {
    if (!a.perimeter?.length && !b.perimeter?.length) return defaultSort(a, b, sortOrder);
    if (!a.perimeter?.length) return sortOrder === 'ASC' ? 1 : -1;
    if (!b.perimeter?.length) return sortOrder === 'ASC' ? -1 : 1;
    return sortOrder === 'ASC' ? a.perimeter.localeCompare(b.perimeter) : b.perimeter.localeCompare(a.perimeter);
  }
  if (sortBy === 'createdAt') {
    if (a.createdAt > b.createdAt) return sortOrder === 'ASC' ? 1 : -1;
    if (a.createdAt < b.createdAt) return sortOrder === 'ASC' ? -1 : 1;
    return defaultSort(a, b, sortOrder);
  }
  // default sort: name
  return defaultSort(a, b, sortOrder);
};
