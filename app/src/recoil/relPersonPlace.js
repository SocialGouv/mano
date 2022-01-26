import { atom, useRecoilState } from 'recoil';
import useApi from '../services/api';
import { getData, useStorage } from '../services/dataManagement';
import { capture } from '../services/sentry';

export const relsPersonPlaceState = atom({
  key: 'relsPersonPlaceState',
  default: [],
});

export const relsPersonPlaceLoadingState = atom({
  key: 'relsPersonPlaceLoadingState',
  default: true,
});

export const useRelsPerson = () => {
  const [relsPersonPlace, setRelsPersonPlace] = useRecoilState(relsPersonPlaceState);
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh-rel-person-places', 0);
  const [loading, setLoading] = useRecoilState(relsPersonPlaceLoadingState);

  const API = useApi();

  const setRelsPersonPlaceFullState = (relsPersonPlace) => {
    if (relsPersonPlace) setRelsPersonPlace(relsPersonPlace);
    setLoading(false);
    setLastRefresh(Date.now());
  };

  const setBatchData = (newRelsPersonPlace) => setRelsPersonPlace((relsPersonPlace) => [...relsPersonPlace, ...newRelsPersonPlace]);

  const refreshRelsPersonPlace = async (setProgress, initialLoad) => {
    setLoading(true);
    try {
      setRelsPersonPlaceFullState(
        await getData({
          collectionName: 'relPersonPlace',
          data: relsPersonPlace,
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
      setLoading(false);
      return false;
    }
  };

  const deleteRelation = async (id) => {
    const res = await API.delete({ path: `/relPersonPlace/${id}` });
    if (res.ok) {
      setRelsPersonPlace((relsPersonPlace) => relsPersonPlace.filter((rel) => rel._id !== id));
    }
    return res;
  };

  const addRelation = async (place) => {
    try {
      const res = await API.post({ path: '/relPersonPlace', body: prepareRelPersonPlaceForEncryption(place) });
      if (res.ok) {
        setRelsPersonPlace((relsPersonPlace) => [res.decryptedData, ...relsPersonPlace]);
      }
      return res;
    } catch (error) {
      capture('error in creating relPersonPlace' + error, { extra: { error, place } });
      return { ok: false, error: error.message };
    }
  };

  return {
    relsPersonPlace,
    loading,
    refreshRelsPersonPlace,
    setRelsPersonPlace,
    deleteRelation,
    addRelation,
  };
};

const encryptedFields = ['place', 'person'];

export const prepareRelPersonPlaceForEncryption = (relPersonPlace) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = relPersonPlace[field];
  }
  return {
    _id: relPersonPlace._id,
    createdAt: relPersonPlace.createdAt,
    updatedAt: relPersonPlace.updatedAt,
    organisation: relPersonPlace.organisation,

    decrypted,
    entityKey: relPersonPlace.entityKey,

    ...relPersonPlace,
  };
};
