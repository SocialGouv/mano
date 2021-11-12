import React, { useContext, useState } from 'react';
import API from '../services/api';
import { getData, useStorage } from '../services/dataManagement';
import { capture } from '../services/sentry';
import AuthContext from './auth';

const TerritoryObservationsContext = React.createContext();

export const TerritoryObservationsProvider = ({ children }) => {
  const [state, setState] = useState({ territoryObservations: [], obsKey: 0, loading: true });
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh-observations', 0);

  const { organisation } = useContext(AuthContext);

  let customFieldsObs;
  if (Array.isArray(organisation.custom_fields)) customFieldsObs = organisation.custom_fields;
  // It should not be a string but required for legacy reasons.
  else if (typeof organisation.customFieldsObs === 'string') customFieldsObs = JSON.parse(organisation.customFieldsObs);
  return (customFieldsObs = defaultCustomFields);

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
      const res = await API.post({ path: '/territory-observation', body: prepareObsForEncryption(customFieldsObs)(obs) });
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
      const res = await API.put({ path: `/territory-observation/${obs._id}`, body: prepareObsForEncryption(customFieldsObs)(obs) });
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
        customFieldsObs,
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

export const defaultCustomFields = [
  {
    name: 'personsMale',
    label: 'Nombre de personnes non connues hommes rencontrées',
    type: 'number',
    enabled: true,
    required: true,
    showInStats: true,
  },
  {
    name: 'personsFemale',
    label: 'Nombre de personnes non connues femmes rencontrées',
    type: 'number',
    enabled: true,
    required: true,
    showInStats: true,
  },
  {
    name: 'police',
    label: 'Présence policière',
    type: 'yes-no',
    enabled: true,
    required: true,
    showInStats: true,
  },
  {
    name: 'material',
    label: 'Nombre de matériel ramassé',
    type: 'number',
    enabled: true,
    required: true,
    showInStats: true,
  },
  {
    name: 'atmosphere',
    label: 'Ambiance',
    options: ['Violences', 'Tensions', 'RAS'],
    type: 'enum',
    enabled: true,
    required: true,
    showInStats: true,
  },
  {
    name: 'mediation',
    label: 'Nombre de médiations avec les riverains / les structures',
    type: 'number',
    enabled: true,
    required: true,
    showInStats: true,
  },
  {
    name: 'comment',
    label: 'Commentaire',
    type: 'textarea',
    enabled: true,
    required: true,
    showInStats: true,
  },
];

const compulsoryEncryptedFields = ['territory', 'user', 'team'];

export const prepareObsForEncryption = (customFields) => (obs) => {
  const encryptedFields = [...customFields.map((f) => f.name), ...compulsoryEncryptedFields];
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

export const observationsKeyLabels = defaultCustomFields.map((f) => f.name);
