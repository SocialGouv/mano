import React, { useState } from 'react';
import API from '../services/api';
import { getData, useStorage } from '../services/dataManagement';
import { capture } from '../services/sentry';

const RelsPersonPlaceContext = React.createContext();

export const RelsPersonPlaceProvider = ({ children }) => {
  const [state, setState] = useState({ relsPersonPlace: [], relsKey: 0, loading: false, lastRefresh: undefined });
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh-rel-person-places', 0);

  const setRelsPersonPlace = (relsPersonPlace) => {
    if (relsPersonPlace) {
      setState(({ relsKey }) => ({
        relsPersonPlace,
        relsKey: relsKey + 1,
        loading: false,
      }));
    }
    setLastRefresh(Date.now());
  };

  const setBatchData = (newRelsPersonPlace) =>
    setState(({ relsPersonPlace, ...oldState }) => ({
      ...oldState,
      relsPersonPlace: [...relsPersonPlace, ...newRelsPersonPlace],
    }));

  const refreshRelsPersonPlace = async (setProgress, initialLoad) => {
    setState((state) => ({ ...state, loading: true }));
    try {
      setRelsPersonPlace(
        await getData({
          collectionName: 'relPersonPlace',
          data: state.relsPersonPlace,
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

  const deleteRelation = async (id) => {
    const res = await API.delete({ path: `/relPersonPlace/${id}` });
    if (res.ok) {
      setState(({ relsPersonPlace, relsKey, ...s }) => ({
        ...s,
        relsKey: relsKey + 1,
        relsPersonPlace: relsPersonPlace.filter((rel) => rel._id !== id),
      }));
    }
    return res;
  };

  const addRelation = async (place) => {
    try {
      const res = await API.post({ path: '/relPersonPlace', body: prepareRelPersonPlaceForEncryption(place) });
      if (res.ok) {
        setState(({ relsPersonPlace, relsKey }) => ({
          relsKey: relsKey + 1,
          relsPersonPlace: [res.decryptedData, ...relsPersonPlace],
        }));
      }
      return res;
    } catch (error) {
      capture('error in creating relPersonPlace' + error, { extra: { error, place } });
      return { ok: false, error: error.message };
    }
  };

  return (
    <RelsPersonPlaceContext.Provider
      value={{
        ...state,
        refreshRelsPersonPlace,
        setRelsPersonPlace,
        deleteRelation,
        addRelation,
      }}>
      {children}
    </RelsPersonPlaceContext.Provider>
  );
};

export default RelsPersonPlaceContext;

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
