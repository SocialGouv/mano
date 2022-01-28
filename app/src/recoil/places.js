import { atom, useRecoilState } from 'recoil';
import API from '../services/api';
import { getData, useStorage } from '../services/dataManagement';
import { capture } from '../services/sentry';

const sortPlaces = (p1, p2) => p1.name.localeCompare(p2.name);

export const placesState = atom({
  key: 'placesState',
  default: [],
});

export const usePlaces = () => {
  const [places, setPlaces] = useRecoilState(placesState);
  const [lastRefresh, setLastRefresh] = useStorage('last-refresh-places', 0);

  const setPlacesFullState = (newPlaces) => {
    if (newPlaces) setPlaces(newPlaces.sort(sortPlaces));
    setLastRefresh(Date.now());
  };

  const setBatchData = (newPlaces) => setPlaces((places) => [...places, ...newPlaces]);

  const refreshPlaces = async (setProgress, initialLoad) => {
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
      return false;
    }
  };

  return refreshPlaces;
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
