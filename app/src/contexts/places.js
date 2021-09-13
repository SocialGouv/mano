import React, { useContext, useState } from 'react';
import API from '../services/api';
import { capture } from '../services/sentry';
import RelsPersonPlaceContext from './relPersonPlace';

const PlacesContext = React.createContext();

const sortPlaces = (p1, p2) => p1.name.localeCompare(p2.name);

export const PlacesProvider = ({ children }) => {
  const { relsPersonPlace, deleteRelation } = useContext(RelsPersonPlaceContext);

  const [state, setState] = useState({ places: [], placeKey: 0 });

  const setPlaces = (places) =>
    setState(({ placeKey }) => ({
      places: places.sort(sortPlaces),
      placeKey: placeKey + 1,
      loading: false,
    }));

  const refreshPlaces = async () => {
    setState((state) => ({ ...state, loading: true }));
    const response = await API.get({ path: '/place' });
    if (!response.ok) {
      capture('error getting places', { extra: { response } });
      return setState((state) => ({ ...state, loading: false }));
    }
    setPlaces(response.decryptedData);
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
