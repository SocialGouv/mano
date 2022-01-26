import { organisationState } from './auth';
import useApi from '../services/api';
import { getData, useStorage } from '../services/dataManagement';
import { capture } from '../services/sentry';
import { atom, selector, useRecoilState, useRecoilValue } from 'recoil';

export const territoryObservationsState = atom({
  key: 'territoryObservationsState',
  default: [],
});

export const territoriesObservationsLoadingState = atom({
  key: 'territoriesObservationsLoadingState',
  default: true,
});

export const customFieldsObsSelector = selector({
  key: 'customFieldsObsSelector',
  get: ({ get }) => {
    const organisation = get(organisationState);
    if (Array.isArray(organisation.customFieldsObs)) return organisation.customFieldsObs;
    return defaultCustomFields;
  },
});

export const useTerritoryObservations = () => {
  const [territoryObservations, setTerritoryObs] = useRecoilState(territoryObservationsState);
  const [loading, setLoading] = useRecoilState(territoriesObservationsLoadingState);
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh-observations', 0);

  const API = useApi();

  const customFieldsObs = useRecoilValue(customFieldsObsSelector);

  const setTerritoryObsFullState = (newTerritoryObservations) => {
    if (newTerritoryObservations) {
      setTerritoryObs(newTerritoryObservations);
      setLoading(false);
    }
    setLastRefresh(Date.now());
  };

  const setBatchData = (newObs) => setTerritoryObs((territoryObservations) => [...territoryObservations, ...newObs]);

  const refreshTerritoryObs = async (setProgress) => {
    setLoading(true);
    try {
      const data = await getData({
        collectionName: 'territory-observation',
        data: territoryObservations,
        isInitialization: true,
        setProgress,
        setBatchData,
        lastRefresh,
        API,
      });
      setTerritoryObsFullState(data);
      return true;
    } catch (e) {
      capture(e.message, { extra: { response: e.response } });
      setLoading(false);
      return false;
    }
  };

  const deleteTerritoryObs = async (id) => {
    const res = await API.delete({ path: `/territory-observation/${id}` });
    if (res.ok) {
      setTerritoryObs((territoryObservations) => territoryObservations.filter((p) => p._id !== id));
    }
    return res;
  };

  const addTerritoryObs = async (obs) => {
    try {
      const res = await API.post({ path: '/territory-observation', body: prepareObsForEncryption(customFieldsObs)(obs) });
      if (res.ok) {
        setTerritoryObs((territoryObservations) => [res.decryptedData, ...territoryObservations]);
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
        setTerritoryObs((territoryObservations) =>
          territoryObservations.map((a) => {
            if (a._id === obs._id) return res.decryptedData;
            return a;
          })
        );
      }
      return res;
    } catch (error) {
      capture(error, { extra: { message: 'error in creating obs', obs } });
      return { ok: false, error: error.message };
    }
  };

  return {
    territoryObservations,
    loading,
    customFieldsObs,
    refreshTerritoryObs,
    setTerritoryObs,
    deleteTerritoryObs,
    addTerritoryObs,
    updateTerritoryObs,
  };
};

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
