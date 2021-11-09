import { useState } from 'react';
import { atom, useRecoilState } from 'recoil';
import { useRelsPerson } from '../recoil/relPersonPlace';
import useApi from '../services/api-interface-with-dashboard';
import { getData, useStorage } from '../services/dataManagement';
import { capture } from '../services/sentry';

const sortPlaces = (p1, p2) => p1.name.localeCompare(p2.name);

export const placesState = atom({
  key: 'placesState',
  default: [],
});

export const usePlaces = () => {
  const { relsPersonPlace, deleteRelation } = useRelsPerson();
  const API = useApi();

  const [places, setPlaces] = useRecoilState(placesState);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh-places', 0);

  const setPlacesFullState = (newPlaces) => {
    console.log({ newPlaces });
    if (newPlaces) {
      setPlaces(newPlaces.sort(sortPlaces));
    }
    setLoading(false);
    setLastRefresh(Date.now());
  };

  const setBatchData = (newPlaces) => setPlaces((places) => [...places, ...newPlaces]);

  const refreshPlaces = async (setProgress, initialLoad) => {
    setLoading(true);
    try {
      setPlacesFullState(
        await getData({
          collectionName: 'place',
          data: places,
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

  const deletePlace = async (id) => {
    const res = await API.delete({ path: `/place/${id}` });
    if (res.ok) {
      setPlaces((places) => places.filter((p) => p._id !== id));
      for (let relPersonPlace of relsPersonPlace.filter((rel) => rel.place === id)) {
        await deleteRelation(relPersonPlace._id);
      }
    }
    return res;
  };

  const addPlace = async (place) => {
    try {
      setLoading(true);
      const res = await API.post({ path: '/place', body: preparePlaceForEncryption(place) });
      if (res.ok) {
        setPlaces((places) => [res.decryptedData, ...places].sort(sortPlaces));
      }
      setLoading(false);
      return res;
    } catch (error) {
      capture('error in creating place' + error, { extra: { error, place } });
      return { ok: false, error: error.message };
    }
  };

  const updatePlace = async (place) => {
    try {
      setLoading(true);
      const res = await API.put({
        path: `/place/${place._id}`,
        body: preparePlaceForEncryption(place),
      });
      if (res.ok) {
        setPlaces((places) =>
          places
            .map((p) => {
              if (p._id === place._id) return res.decryptedData;
              return p;
            })
            .sort(sortPlaces)
        );
      }
      setLoading(false);
      return res;
    } catch (error) {
      capture(error, { extra: { message: 'error in updating place', place } });
      return { ok: false, error: error.message };
    }
  };

  return {
    places,
    loading,
    refreshPlaces,
    setPlaces,
    deletePlace,
    addPlace,
    updatePlace,
  };
};

const encryptedFields = ['user', 'name'];

export const preparePlaceForEncryption = (place) => {
  const decrypted = {};
  for (let field of encryptedFields) {
    decrypted[field] = place[field];
  }
  return {
    _id: place._id,
    createdAt: place.createdAt,
    updatedAt: place.updatedAt,
    organisation: place.organisation,

    decrypted,
    entityKey: place.entityKey,

    ...place,
  };
};
