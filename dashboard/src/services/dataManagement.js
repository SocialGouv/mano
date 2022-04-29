/* eslint-disable no-throw-literal */
import localforage from 'localforage';
import { capture } from './sentry';

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

export let manoCacheStorage = null;

// init
(async () => {
  const allowedDrivers = [localforage.INDEXEDDB, localforage.WEBSQL];
  for (const driver of allowedDrivers) {
    if (localforage.supports(driver)) {
      try {
        localforage.config({
          name: 'mano-dashboard',
          version: 1.0,
          driver: allowedDrivers,
          storeName: 'mano_cache', // Should be alphanumeric, with underscores.
          description: 'save Mano organisation data to cache to make the app faster',
        });

        // https://localforage.github.io/localForage/#driver-api-ready
        // if driver is not supported, localforage.ready() throw an error
        await localforage.ready();
        manoCacheStorage = localforage;
        return;
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
})();

export function clearCache() {
  manoCacheStorage?.clear();
  window.localStorage?.clear();
}

// Get data from server (no cache yet).
export async function getData({
  API,
  collectionName,
  data = [],
  isInitialization = false,
  setProgress = () => {},
  setBatchData = null,
  lastRefresh = 0,
}) {
  if (isInitialization) {
    data = (await manoCacheStorage?.getItem(collectionName)) || [];
  }
  const response = await API.get({
    path: `/${collectionName}`,
    batch: 1000,
    setProgress,
    query: { after: lastRefresh, withDeleted: Boolean(lastRefresh) },
    setBatchData,
  });

  if (!response.ok) console.log({ message: `Error getting ${collectionName} data`, response });
  if (!response.decryptedData.length && !isInitialization) return null;

  data = mergeNewUpdatedData(response.decryptedData, data);
  await manoCacheStorage?.setItem(collectionName, data);
  return data;
}
