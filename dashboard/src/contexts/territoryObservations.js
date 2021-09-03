import React, { useState } from 'react';
import API from '../services/api';
import { capture } from '../services/sentry';

const TerritoryObservationsContext = React.createContext();

export const TerritoryObservationsProvider = ({ children }) => {
  const [state, setState] = useState({ territoryObservations: [], key: 0, loading: true });

  const setTerritoryObs = (territoryObservations) => {
    setState(({ key }) => ({
      territoryObservations,
      key: key + 1,
      loading: false,
    }));
  };
  const setBatchData = (newObs) =>
    setState(({ territoryObservations, ...oldState }) => ({
      ...oldState,
      territoryObservations: [...territoryObservations, ...newObs],
    }));
  const refreshTerritoryObs = async (setProgress, initialLoad) => {
    setState((state) => ({ ...state, loading: true }));
    const response = await API.get({ path: '/territory-observation', batch: 1000, setProgress, setBatchData });
    if (!response.ok) {
      capture('error getting observations', { extra: { response } });
      return setState((state) => ({ ...state, loading: false }));
    }
    setTerritoryObs(response.decryptedData);
    for (const obs of response.decryptedData.filter((obs) => Boolean(obs.territory?._id))) {
      await updateTerritoryObs({ ...obs, territory: obs.territory._id });
    }
  };

  const deleteTerritoryObs = async (id) => {
    const res = await API.delete({ path: `/territory-observation/${id}` });
    if (res.ok) {
      setState(({ territoryObservations, key, ...s }) => ({
        ...s,
        key: key + 1,
        territoryObservations: territoryObservations.filter((p) => p._id !== id),
      }));
    }
    return res;
  };

  const addTerritoryObs = async (obs) => {
    try {
      const res = await API.post({ path: '/territory-observation', body: prepareObsForEncryption(obs) });
      if (res.ok) {
        setState(({ territoryObservations, key, ...s }) => ({
          ...s,
          key: key + 1,
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
        setState(({ territoryObservations, key, ...s }) => ({
          ...s,
          key: key + 1,
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
