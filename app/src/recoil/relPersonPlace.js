import { atom, useRecoilState } from 'recoil';
import API from '../services/api';
import { getData, useStorage } from '../services/dataManagement';
import { capture } from '../services/sentry';

export const relsPersonPlaceState = atom({
  key: 'relsPersonPlaceState',
  default: [],
});

export const useRelsPerson = () => {
  const [relsPersonPlace, setRelsPersonPlace] = useRecoilState(relsPersonPlaceState);
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh-rel-person-places', 0);

  const setRelsPersonPlaceFullState = (relsPersonPlace) => {
    if (relsPersonPlace) setRelsPersonPlace(relsPersonPlace);
    setLastRefresh(Date.now());
  };

  const setBatchData = (newRelsPersonPlace) => setRelsPersonPlace((relsPersonPlace) => [...relsPersonPlace, ...newRelsPersonPlace]);

  const refreshRelsPersonPlace = async (setProgress, initialLoad) => {
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
      return false;
    }
  };

  return refreshRelsPersonPlace;
};

const encryptedFields = ['place', 'person', 'user'];

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
