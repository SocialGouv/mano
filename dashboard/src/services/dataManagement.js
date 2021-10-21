/* eslint-disable no-throw-literal */
import { useState } from 'react';
import API from '../services/api';
// import MMKVStorage from 'react-native-mmkv-storage';

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

// export const useStorage = (key, defaultValue) => {
//   const [value, setValue] = useMMKVStorage(key, MMKV, defaultValue);
//   return [value, setValue];
// };
export const useStorage = (key, defaultValue) => {
  const [value, setValue] = useState(defaultValue);
  return [value, setValue];
};

// Get data from server (no cache yet).
export async function getData({ collectionName, data = [], isInitialization = false, setProgress = () => {}, setBatchData = null, lastRefresh = 0 }) {
  /*
  const MMKV = new MMKVStorage.Loader().initialize();
  if (isInitialization) {
    data = (await MMKV.getMapAsync(collectionName)) || [];
    if (data?.length) {
      lastRefresh = new Date(data.map((item) => item.updatedAt).reduce((a, b) => (a > b ? a : b))).getTime();
    }
  }
  */

  const response = await API.get({ path: `/${collectionName}`, batch: 1000, setProgress, query: { lastRefresh }, setBatchData });
  if (!response.ok) throw { message: `Error getting ${collectionName} data`, response };

  data = mergeNewUpdatedData(response.decryptedData, data);
  // await MMKV.setMapAsync(collectionName, data);
  return data;
}
