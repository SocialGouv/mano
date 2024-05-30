import { type UseStore, set, get, createStore, keys, delMany } from "idb-keyval";
import { capture } from "./sentry";

export const dashboardCurrentCacheKey = "mano_last_refresh_2022_01_11";
export const manoDB = "mano-dashboard";

let customStore: UseStore | null = null;
const savedCacheKey = window.localStorage.getItem("mano-currentCacheKey");
if (savedCacheKey !== dashboardCurrentCacheKey) {
  clearCache().then(() => setupDB());
} else {
  setupDB();
}

function setupDB() {
  window.localStorage.setItem("mano-currentCacheKey", dashboardCurrentCacheKey);
  customStore = createStore(manoDB, dashboardCurrentCacheKey);
}

async function deleteDB() {
  // On n'arrive pas à supprimer la base de données, on va donc supprimer les données une par une
  if (!customStore) return;
  const ks = await keys(customStore);
  return await delMany(ks, customStore);
}

export async function clearCache() {
  await deleteDB().then(console.log).catch(capture);
  window.localStorage?.clear();
  window.sessionStorage?.clear();
  return true;
}

export async function setCacheItem(key: string, value: any) {
  try {
    if (customStore) await set(key, value, customStore);
  } catch (error) {
    capture(error, { tags: { key } });
  }
}

export async function getCacheItem(key: string) {
  try {
    if (customStore === null) return null;
    const data = await get(key, customStore);
    return data;
  } catch (error) {
    capture(error, { tags: { key } });
    return null;
  }
}

export async function getCacheItemDefaultValue(key: string, defaultValue: any) {
  const storedValue = await getCacheItem(key);
  return storedValue || defaultValue;
}
