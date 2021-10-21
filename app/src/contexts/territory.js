import React, { useContext, useState } from 'react';
import API from '../services/api';
import { getData, useStorage } from '../services/dataManagement';
import { capture } from '../services/sentry';
import TerritoryObservationsContext from './territoryObservations';

const TerritoryContext = React.createContext();

export const TerritoriesProvider = ({ children }) => {
  const { territoryObservations, deleteTerritoryObs } = useContext(TerritoryObservationsContext);

  const [state, setState] = useState({ territories: [], territoryKey: 0 });
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh-territories', 0);

  const setTerritories = (territories) => {
    if (territories) {
      setState(({ territoryKey }) => ({
        territories,
        territoryKey: territoryKey + 1,
        loading: false,
      }));
    }
    setLastRefresh(Date.now());
  };

  const setBatchData = (newTerritories) =>
    setState(({ territories, ...oldState }) => ({
      ...oldState,
      territories: [...territories, ...newTerritories],
    }));

  const refreshTerritories = async (setProgress, initialLoad) => {
    setState((state) => ({ ...state, loading: true }));
    try {
      setTerritories(
        await getData({
          collectionName: 'territory',
          data: state.territories,
          isInitialization: initialLoad,
          setProgress,
          lastRefresh,
          setBatchData,
        })
      );
      return true;
    } catch (e) {
      capture(e.message, { extra: { response: e.response } });
      setState((state) => ({ ...state, loading: false }));
      return false;
    }
  };

  const deleteTerritory = async (id) => {
    const res = await API.delete({ path: `/territory/${id}` });
    if (res.ok) {
      setState(({ territories, territoryKey, ...s }) => ({
        ...s,
        territoryKey: territoryKey + 1,
        territories: territories.filter((t) => t._id !== id),
      }));
      for (let obs of territoryObservations.filter((o) => o.territory === id)) {
        await deleteTerritoryObs(obs._id);
      }
    }
    return res;
  };

  const addTerritory = async (territory) => {
    try {
      const res = await API.post({ path: '/territory', body: prepareTerritoryForEncryption(territory) });

      if (res.ok) {
        setState(({ territories, territoryKey, ...s }) => ({
          ...s,
          territoryKey: territoryKey + 1,
          territories: [res.decryptedData, ...territories],
        }));
      }
      return res;
    } catch (error) {
      capture('error in creating territory' + error, { extra: { error, territory } });
      return { ok: false, error: error.message };
    }
  };

  const updateTerritory = async (territory) => {
    try {
      const res = await API.put({
        path: `/territory/${territory._id}`,
        body: prepareTerritoryForEncryption(territory),
      });
      if (res.ok) {
        setState(({ territories, territoryKey, ...s }) => ({
          ...s,
          territoryKey: territoryKey + 1,
          territories: territories.map((a) => {
            if (a._id === territory._id) return res.decryptedData;
            return a;
          }),
        }));
      }
      return res;
    } catch (error) {
      capture(error, { extra: { message: 'error in updating territory', territory } });
      return { ok: false, error: error.message };
    }
  };

  return (
    <TerritoryContext.Provider
      value={{
        ...state,
        refreshTerritories,
        setTerritories,
        deleteTerritory,
        addTerritory,
        updateTerritory,
      }}>
      {children}
    </TerritoryContext.Provider>
  );
};

export default TerritoryContext;

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
