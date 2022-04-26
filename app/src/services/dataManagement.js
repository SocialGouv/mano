import API from '../services/api';
import MMKVStorage, { useMMKVStorage } from 'react-native-mmkv-storage';

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

export const MMKV = new MMKVStorage.Loader().initialize();

export const useStorage = (key, defaultValue) => {
  const [value, setValue] = useMMKVStorage(key, MMKV, defaultValue);
  return [value, setValue];
};

export function clearCache() {
  MMKV.clearStore();
  MMKV.clearMemoryCache();
}

// Get data from cache or fetch from server.
export async function getData({ collectionName, data = [], isInitialization = false, setProgress = () => {}, setBatchData = null, lastRefresh = 0 }) {
  if (isInitialization) {
    data = (await MMKV.getMapAsync(collectionName)) || [];
  }

  const response = await API.get({
    path: `/${collectionName}`,
    batch: 1000,
    setProgress,
    query: { after: lastRefresh, withDeleted: Boolean(lastRefresh) },
    setBatchData,
  });
  if (!response.ok) throw { message: `Error getting ${collectionName} data`, response };

  // avoid sending data if no new data, to avoid big useless `map` calculations in selectors
  if (!response.decryptedData.length && !isInitialization) return null;

  data = mergeNewUpdatedData(response.decryptedData, data);
  await MMKV.setMapAsync(collectionName, data);
  return data;
}
