import React, { useContext, useState } from 'react';
import API from '../services/api';
import { getData, useStorage } from '../services/dataManagement';
import { capture } from '../services/sentry';
import RelsPersonPlaceContext from './relPersonPlace';

const PlacesContext = React.createContext();

const sortPlaces = (p1, p2) => p1.name.localeCompare(p2.name);

export const PlacesProvider = ({ children }) => {
  const { relsPersonPlace, deleteRelation } = useContext(RelsPersonPlaceContext);

  const [state, setState] = useState({ places: [], placeKey: 0, loading: false, lastRefresh: undefined });
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh-places', 0);

  const setPlaces = (places) => {
    if (places) {
      setState(({ placeKey }) => ({
        places: places.sort(sortPlaces),
        placeKey: placeKey + 1,
        loading: false,
      }));
    }
    setLastRefresh(Date.now());
  };

  const setBatchData = (newPlaces) =>
    setState(({ places, ...oldState }) => ({
      ...oldState,
      places: [...places, ...newPlaces],
    }));

  const refreshPlaces = async (setProgress, initialLoad) => {
    setState((state) => ({ ...state, loading: true }));
    try {
      setPlaces(
        await getData({
          collectionName: 'place',
          data: state.places,
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

  const deletePlace = async (id) => {
    const res = await API.delete({ path: `/place/${id}` });
    if (res.ok) {
      setState(({ placeKey, places, ...s }) => ({
        ...s,
        placeKey: placeKey + 1,
        places: places.filter((p) => p._id !== id),
      }));
      for (let relPersonPlace of relsPersonPlace.filter((rel) => rel.place === id)) {
        await deleteRelation(relPersonPlace._id);
      }
    }
    return res;
  };

  const addPlace = async (place) => {
    try {
      const res = await API.post({ path: '/place', body: preparePlaceForEncryption(place) });
      if (res.ok) {
        setState(({ places, placeKey, ...s }) => ({
          ...s,
          placeKey: placeKey + 1,
          places: [res.decryptedData, ...places].sort(sortPlaces),
        }));
      }
      return res;
    } catch (error) {
      capture('error in creating place' + error, { extra: { error, place } });
      return { ok: false, error: error.message };
    }
  };

  const updatePlace = async (place) => {
    try {
      const res = await API.put({
        path: `/place/${place._id}`,
        body: preparePlaceForEncryption(place),
      });
      if (res.ok) {
        setState(({ places, placeKey, ...s }) => ({
          ...s,
          placeKey: placeKey + 1,
          places: places
            .map((p) => {
              if (p._id === place._id) return res.decryptedData;
              return p;
            })
            .sort(sortPlaces),
        }));
      }
      return res;
    } catch (error) {
      capture(error, { extra: { message: 'error in updating place', place } });
      return { ok: false, error: error.message };
    }
  };

  return (
    <PlacesContext.Provider
      value={{
        ...state,
        refreshPlaces,
        setPlaces,
        deletePlace,
        addPlace,
        updatePlace,
      }}>
      {children}
    </PlacesContext.Provider>
  );
};

export default PlacesContext;

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
