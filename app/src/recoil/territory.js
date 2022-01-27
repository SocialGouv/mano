import { atom, useRecoilState } from 'recoil';
import API from '../services/api';
import { getData, useStorage } from '../services/dataManagement';
import { capture } from '../services/sentry';

export const territoriesState = atom({
  key: 'territoriesState',
  default: [],
});

export const useTerritories = () => {
  const [territories, setTerritories] = useRecoilState(territoriesState);
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh-territories', 0);

  const setTerritoriesFullState = (newTerritories) => {
    if (newTerritories) setTerritories(newTerritories);
    setLastRefresh(Date.now());
  };

  const setBatchData = (newTerritories) => setTerritories((territories) => [...territories, ...newTerritories]);

  const refreshTerritories = async (setProgress, initialLoad) => {
    try {
      setTerritoriesFullState(
        await getData({
          collectionName: 'territory',
          data: territories,
          isInitialization: initialLoad,
          setProgress,
          lastRefresh,
          setBatchData,
          API,
        })
      );
      return true;
    } catch (e) {
      capture(e.message, { extra: { response: e.response } });
      return false;
    }
  };

  return refreshTerritories;
};

const encryptedFields = ['name', 'perimeter', 'types', 'user'];

export const prepareTerritoryForEncryption = (territory) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = territory[field];
  }
  return {
    _id: territory._id,
    createdAt: territory.createdAt,
    updatedAt: territory.updatedAt,
    organisation: territory.organisation,

    decrypted,
    entityKey: territory.entityKey,

    ...territory,
  };
};

export const territoryTypes = [
  'Lieu de conso',
  'Lieu de deal',
  'Carrefour de passage',
  'Campement',
  'Lieu de vie',
  'Prostitution',
  'Errance',
  'Mendicité',
  'Loisir',
  'Rassemblement communautaire',
  'Historique',
];
