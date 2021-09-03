import React, { useState } from 'react';
import API from '../services/api';
import { capture } from '../services/sentry';

const TerritoryContext = React.createContext();

export const TerritoriesProvider = ({ children }) => {
  const [state, setState] = useState({ territories: [], key: 0 });

  const setTerritories = (territories) => setState(({ key }) => ({ territories, key: key + 1, loading: false }));

  const refreshTerritories = async (setProgress, initialLoad) => {
    setState((state) => ({ ...state, loading: true }));
    if (!initialLoad) {
      const refreshResponse = await API.get({ path: '/territory', query: { lastRefresh: state.lastRefresh } });
      if (!refreshResponse.ok) {
        capture('error refreshing territories', { extra: { refreshResponse } });
        return setState((state) => ({ ...state, loading: false }));
      }
      if (refreshResponse.decryptedData) {
        const territoriesIds = state.territories.map((t) => t._id);
        const updatedTerritories = refreshResponse.decryptedData.filter((t) => territoriesIds.includes(t._id));
        const newTerritories = refreshResponse.decryptedData.filter((t) => !territoriesIds.includes(t._id));
        setTerritories([
          ...newTerritories,
          ...state.territories.map((territory) => {
            const updatedTerritory = updatedTerritories.find((t) => t._id === territory._id);
            if (updatedTerritory) return updatedTerritory;
            return territory;
          }),
        ]);
        return;
      }
    }
    const response = await API.get({ path: '/territory', batch: 1000, setProgress });
    if (!response.ok) {
      capture('error getting territories', { extra: { response } });
      return setState((state) => ({ ...state, loading: false }));
    }
    setTerritories(response.decryptedData);
  };

  const deleteTerritory = async (id) => {
    const res = await API.delete({ path: `/territory/${id}` });
    if (res.ok) {
      setState(({ territories, key, ...s }) => ({
        ...s,
        key: key + 1,
        territories: territories.filter((t) => t._id !== id),
      }));
    }
    return res;
  };

  const addTerritory = async (territory) => {
    try {
      const res = await API.post({ path: '/territory', body: prepareTerritoryForEncryption(territory) });

      if (res.ok) {
        setState(({ territories, key, ...s }) => ({
          ...s,
          key: key + 1,
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
        setState(({ territories, key, ...s }) => ({
          ...s,
          key: key + 1,
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
