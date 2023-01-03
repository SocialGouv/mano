import { atom, selector, useRecoilValue } from 'recoil';
import { storage } from '../services/dataManagement';
import { organisationState } from './auth';

export const territoriesState = atom({
  key: 'territoriesState',
  default: [],
  effects: [({ onSet }) => onSet(async (newValue) => storage.set('territory', JSON.stringify(newValue)))],
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
