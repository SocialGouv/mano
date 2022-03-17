import { atom, useRecoilState } from 'recoil';
import useApi from '../services/api';
import { capture } from '../services/sentry';
import { useTerritoryObservations } from './territoryObservations';

export const territoriesState = atom({
  key: 'territoriesState',
  default: [],
});

export const useTerritories = () => {
  const { territoryObservations, deleteTerritoryObs } = useTerritoryObservations();
  const API = useApi();

  const [territories, setTerritories] = useRecoilState(territoriesState);

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
    try {
      const res = await API.post({ path: '/territory', body: prepareTerritoryForEncryption(territory) });

      if (res.ok) {
        setTerritories((territories) => [res.decryptedData, ...territories]);
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
        setTerritories((territories) =>
          territories.map((a) => {
            if (a._id === territory._id) return res.decryptedData;
            return a;
          })
        );
      }
      return res;
    } catch (error) {
      capture(error, { extra: { message: 'error in updating territory', territory } });
      return { ok: false, error: error.message };
    }
  };

  return {
    territories,
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
