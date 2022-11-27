import localforage from 'localforage';
import { capture } from './sentry';

export let manoCacheStorage = undefined;
export const dashboardCurrentCacheKey = 'mano-last-refresh-2022-11-27';
// init
export async function getManoCacheStorage() {
  if (manoCacheStorage !== undefined) return manoCacheStorage;
  const allowedDrivers = [localforage.INDEXEDDB, localforage.WEBSQL];
  for (const driver of allowedDrivers) {
    if (localforage.supports(driver)) {
      try {
        localforage.dropInstance({
          name: 'mano-dashboard',
          storeName: 'mano_cache',
        });
      } catch (e) {
        capture(e);
      }
      try {
        localforage.config({
          name: 'mano-dashboard',
          version: 1.0,
          driver: allowedDrivers,
          storeName: dashboardCurrentCacheKey, // Should be alphanumeric, with underscores.
          description: 'save Mano organisation data to cache to make the app faster',
        });

        // https://localforage.github.io/localForage/#driver-api-ready
        // if driver is not supported, localforage.ready() throw an error
        await localforage.ready();
        manoCacheStorage = localforage;
        return manoCacheStorage;
      } catch (e) {
        // should basically be the error thrown by localforage.ready()
        // when the browser supports the driver but the driver is not available
        // such as IndexedDB in FF Private mode for instance
        // The error is thenb: No available storage method found.
        if (e.message === 'No available storage method found.') {
          manoCacheStorage = null;
          window.localStorage?.clear();
        } else {
          capture(e);
        }
      }
    }
  }
  manoCacheStorage = null;
  window.localStorage?.clear();
  return manoCacheStorage;
}

export async function clearCache() {
  (await getManoCacheStorage())?.clear();
  window.localStorage?.clear();
  window.sessionStorage?.clear();
}

export async function setCacheItem(key, value) {
  return (await getManoCacheStorage())?.setItem(key, value);
}

export async function getCacheItem(key) {
  return (await getManoCacheStorage())?.getItem(key);
}

export async function getCacheItemDefaultValue(key, defaultValue) {
  return (await (await getManoCacheStorage())?.getItem(key)) || defaultValue;
}
