import API from '../services/api';
import { MMKV } from 'react-native-mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const appCurrentCacheKey = 'mano_last_refresh_2022_12_01';

export const mergeNewUpdatedData = (newData, oldData) => {
  const oldDataIds = oldData.map((p) => p._id);
  const updatedItems = newData.filter((p) => oldDataIds.includes(p._id));
  const newItems = newData.filter((p) => !oldDataIds.includes(p._id));
  const deletedItemsIds = newData.filter((p) => !!p.deletedAt).map((p) => p._id);
  return [
    ...newItems,
    ...oldData.map((person) => {
      const updatedItem = updatedItems.find((p) => p._id === person._id);
      if (updatedItem) return updatedItem;
      return person;
    }),
  ].filter((p) => !deletedItemsIds.includes(p._id));
};

export const storage = new MMKV();

export async function clearCache() {
  storage.clearAll();
  await AsyncStorage.clear();
  initCacheAndcheckIfExpired();
}

export const initCacheAndcheckIfExpired = () => {
  const storedCurrentCacheKey = storage.getString('mano-currentCacheKey');
  if (storedCurrentCacheKey !== appCurrentCacheKey) {
    clearCache();
  }
  storage.set('mano-currentCacheKey', appCurrentCacheKey);
};
initCacheAndcheckIfExpired();

// Get data from cache or fetch from server.
export async function getData({ collectionName, data = [], isInitialization = false, setProgress = () => {}, setBatchData = null, lastRefresh = 0 }) {
  if (isInitialization) {
    data = JSON.parse(storage.getString(collectionName) || '[]');
  }

  const response = await API.get({
    path: `/${collectionName}`,
    batch: 2000,
    setProgress,
    query: { after: lastRefresh, withDeleted: Boolean(lastRefresh) },
    setBatchData,
  });
  if (!response.ok) throw { message: `Error getting ${collectionName} data`, response };

  // avoid sending data if no new data, to avoid big useless `map` calculations in selectors
  if (!response.decryptedData?.length && !isInitialization) return null;

  data = mergeNewUpdatedData(response.decryptedData, data);
  storage.set(collectionName, JSON.stringify(data));
  return data;
}
