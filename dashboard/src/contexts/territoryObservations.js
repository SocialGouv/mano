import React, { useState } from 'react';
import API from '../services/api';
import { getData, useStorage } from '../services/dataManagement';
import { capture } from '../services/sentry';

const TerritoryObservationsContext = React.createContext();

export const TerritoryObservationsProvider = ({ children }) => {
  const [state, setState] = useState({ territoryObservations: [], obsKey: 0, loading: true });
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh-observations', 0);

  const setTerritoryObs = (territoryObservations) => {
    if (territoryObservations) {
      setState(({ obsKey }) => ({
        territoryObservations,
        obsKey: obsKey + 1,
        loading: false,
      }));
    }
    setLastRefresh(Date.now());
  };

  const setBatchData = (newObs) =>
    setState(({ territoryObservations, ...oldState }) => ({
      ...oldState,
      territoryObservations: [...territoryObservations, ...newObs],
    }));

  const refreshTerritoryObs = async (setProgress) => {
    setState((state) => ({ ...state, loading: true }));
    try {
      const data = await getData({
        collectionName: 'territory-observation',
        data: state.territoryObservations,
        isInitialization: true,
        setProgress,
        setBatchData,
        lastRefresh,
      });
      setTerritoryObs(data);
      if (data) {
        for (const obs of data.filter((obs) => Boolean(obs.territory?._id) && !obs.territory)) {
          await updateTerritoryObs({ ...obs, territory: obs.territory._id });
        }
      }
      return true;
    } catch (e) {
      capture(e.message, { extra: { response: e.response } });
      setState((state) => ({ ...state, loading: false }));
      return false;
    }
  };

  const deleteTerritoryObs = async (id) => {
    const res = await API.delete({ path: `/territory-observation/${id}` });
    if (res.ok) {
      setState(({ territoryObservations, obsKey, ...s }) => ({
        ...s,
        obsKey: obsKey + 1,
        territoryObservations: territoryObservations.filter((p) => p._id !== id),
      }));
    }
    return res;
  };

  const addTerritoryObs = async (obs) => {
    try {
      const res = await API.post({ path: '/territory-observation', body: prepareObsForEncryption(obs) });
      if (res.ok) {
        setState(({ territoryObservations, obsKey, ...s }) => ({
          ...s,
          obsKey: obsKey + 1,
          territoryObservations: [res.decryptedData, ...territoryObservations],
        }));
      }
      return res;
    } catch (error) {
      capture('error in creating obs' + error, { extra: { error, obs } });
      return { ok: false, error: error.message };
    }
  };

  const updateTerritoryObs = async (obs) => {
    try {
      const res = await API.put({ path: `/territory-observation/${obs._id}`, body: prepareObsForEncryption(obs) });
      if (res.ok) {
        setState(({ territoryObservations, obsKey, ...s }) => ({
          ...s,
          obsKey: obsKey + 1,
          territoryObservations: territoryObservations.map((a) => {
            if (a._id === obs._id) return res.decryptedData;
            return a;
          }),
        }));
      }
      return res;
    } catch (error) {
      capture(error, { extra: { message: 'error in creating obs', obs } });
      return { ok: false, error: error.message };
    }
  };

  return (
    <TerritoryObservationsContext.Provider
      value={{
        ...state,
        refreshTerritoryObs,
        setTerritoryObs,
        deleteTerritoryObs,
        addTerritoryObs,
        updateTerritoryObs,
      }}>
      {children}
    </TerritoryObservationsContext.Provider>
  );
};

export default TerritoryObservationsContext;

const encryptedFields = [
  'persons',
  'personsMale',
  'personsFemale',
  'police',
  'material',
  'atmosphere',
  'mediation',
  'comment',
  'team',
  'user',
  'territory',
];

export const prepareObsForEncryption = (obs) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = obs[field];
  }
  return {
    _id: obs._id,
    createdAt: obs.createdAt,
    updatedAt: obs.updatedAt,
    organisation: obs.organisation,

    decrypted,
    entityKey: obs.entityKey,

    ...obs,
  };
};

export const observationsKeyLabels = {
  personsMale: 'Nombre de personnes non connues hommes rencontrées',
  personsFemale: 'Nombre de personnes non connues femmes rencontrées',
  police: 'Présence policière',
  material: 'Nombre de matériel ramassé',
  atmosphere: 'Ambiance',
  mediation: 'Nombre de médiations avec les riverains / les structures',
  comment: 'Commentaire',
};
