/* eslint-disable no-throw-literal */
import localforage from 'localforage';

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

localforage.config({
  name: 'mano-dashboard',
  version: 1.0,
  storeName: 'mano_cache', // Should be alphanumeric, with underscores.
  description: 'save Mano organisation data to cache to make the app faster',
});

export function clearCache() {
  console.log('CLEAR');
  localforage?.clear();
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
    data = (await localforage.getItem(collectionName)) || [];
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
  await localforage.setItem(collectionName, data);
  return data;
}
