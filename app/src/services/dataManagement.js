import API from '../services/api';
import MMKVStorage, { useMMKVStorage } from 'react-native-mmkv-storage';

export const mergeNewUpdatedData = (newData, oldData) => {
  const oldDataIds = oldData.map((p) => p._id);
  const updatedItems = newData.filter((p) => oldDataIds.includes(p._id));
  const newItems = newData.filter((p) => !oldDataIds.includes(p._id));
  return [
    ...newItems,
    ...oldData.map((person) => {
      const updatedItem = updatedItems.find((p) => p._id === person._id);
      if (updatedItem) return updatedItem;
      return person;
    }),
  ];
};

const MMKV = new MMKVStorage.Loader().initialize();

export const useStorage = (key, defaultValue) => {
  const [value, setValue] = useMMKVStorage(key, MMKV, defaultValue);
  return [value, setValue];
};

// Get data from cache or fetch from server.
export async function getData({ collectionName, data = [], isInitialization = false, setProgress = () => {}, setBatchData = null, lastRefresh = 0 }) {
  if (isInitialization) {
    data = (await MMKV.getMapAsync(collectionName)) || [];
    // remove this `lastRefresh` as every collection now has their own `lastRefresh`
    // if (data?.length) {
    //   lastRefresh = new Date(data.map((item) => item.updatedAt).reduce((a, b) => (a > b ? a : b))).getTime();
    // }
  }

  const response = await API.get({ path: `/${collectionName}`, batch: 1000, setProgress, query: { lastRefresh }, setBatchData });
  if (!response.ok) throw { message: `Error getting ${collectionName} data`, response };

  console.log(collectionName, lastRefresh, data.length, response.decryptedData.length);

  // avoid sending data if no new data, to avoid big useless `map` calculations in selectors
  if (!response.decryptedData.length && !isInitialization) return null;

  data = mergeNewUpdatedData(response.decryptedData, data);
  await MMKV.setMapAsync(collectionName, data);
  return data;
}
