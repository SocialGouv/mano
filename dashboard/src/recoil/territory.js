import { atom, useRecoilState } from 'recoil';
import useApi from '../services/api-interface-with-dashboard';
import { getData, useStorage } from '../services/dataManagement';
import { useTerritoryObservations } from './territoryObservations';

export const territoriesState = atom({
  key: 'territoriesState',
  default: [],
});

export const territoriesLoadingState = atom({
  key: 'territoriesLoadingState',
  default: true,
});

export const useTerritories = () => {
  const { territoryObservations, deleteTerritoryObs } = useTerritoryObservations();
  const API = useApi();

  const [territories, setTerritories] = useRecoilState(territoriesState);
  const [loading, setLoading] = useRecoilState(territoriesLoadingState);
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh-territories', 0);

  const setTerritoriesFullState = (newTerritories) => {
    if (newTerritories) setTerritories(newTerritories);
    setLoading(false);
    setLastRefresh(Date.now());
  };

  const setBatchData = (newTerritories) => setTerritories((territories) => [...territories, ...newTerritories]);

  const refreshTerritories = async (setProgress, initialLoad) => {
    setLoading(true);
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
      setLoading(false);
      return false;
    }
  };

  const deleteTerritory = async (id) => {
    const res = await API.delete({ path: `/territory/${id}` });
    if (res.ok) {
      setTerritories((territories) => territories.filter((t) => t._id !== id));
      for (let obs of territoryObservations.filter((o) => o.territory === id)) {
        await deleteTerritoryObs(obs._id);
      }
    }
    return res;
  };

  const addTerritory = async (territory) => {
    const res = await API.post({ path: '/territory', body: prepareTerritoryForEncryption(territory) });

    if (res.ok) {
      setTerritories((territories) => [res.decryptedData, ...territories]);
    }
    return res;
  };

  const updateTerritory = async (territory) => {
    const res = await API.put({
      path: `/territory/${territory._id}`,
      body: prepareTerritoryForEncryption(territory),
    });
    if (res.ok) {
      setTerritories((territories) =>
        territories.map((a) => {
          if (a._id === territory._id) return res.decryptedData;
          return a;
        })
      );
    }
    return res;
  };

  return {
    territories,
    loading,
    refreshTerritories,
    setTerritories,
    deleteTerritory,
    addTerritory,
    updateTerritory,
  };
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
