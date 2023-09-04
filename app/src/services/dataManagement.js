import API from '../services/api';
import { MMKV } from 'react-native-mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const appCurrentCacheKey = 'mano_last_refresh_2022_12_01';

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
export async function getData({ collectionName, setProgress = () => {}, lastRefresh = 0 }) {
  const response = await API.get({
    path: `/${collectionName}`,
    batch: 5000,
    setProgress,
    query: { after: lastRefresh, withDeleted: Boolean(lastRefresh) },
  });
  if (!response.ok) throw { message: `Error getting ${collectionName} data`, response };

  return response.decryptedData;
}
