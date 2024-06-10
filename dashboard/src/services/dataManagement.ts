import { type UseStore, set, get, createStore, keys, delMany, clear } from "idb-keyval";
import { capture } from "./sentry";

export const dashboardCurrentCacheKey = "mano_last_refresh_2024_05_06";
const legacyStoreName = "mano_last_refresh_2022_01_11";
const legacyManoDB = "mano-dashboard";
const manoDB = "mano";
const storeName = "store";

let customStore: UseStore | null = null;
const savedCacheKey = window.localStorage.getItem("mano-currentCacheKey");
if (savedCacheKey !== dashboardCurrentCacheKey) {
  clearCache().then(() => setupDB());
} else {
  setupDB();
}

function setupDB() {
  // Vidage du store historique qui ne sert plus à rien, mais qui peut-être encore présent
  const legacyStore = createStore(legacyManoDB, legacyStoreName);
  clear(legacyStore).catch(capture);
  // Pour plus tard, quand on sera sûr qu'elle n'est plus utilisée, on devrait même pouvoir la supprimer !
  // Fin du legacy
  window.localStorage.setItem("mano-currentCacheKey", dashboardCurrentCacheKey);
  customStore = createStore(manoDB, storeName);
}

async function deleteDB() {
  // On n'arrive pas à supprimer la base de données, on va donc supprimer les données une par une
  if (!customStore) return;
  const ks = await keys(customStore);
  return await delMany(ks, customStore);
}

export async function clearCache(iteration = 0) {
  if (iteration > 10) throw new Error("Failed to clear cache");
  await deleteDB().catch(capture);
  window.localStorage?.clear();
  window.sessionStorage?.clear();

  // wait 200ms to make sure the cache is cleared
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Check if the cache is empty
  const localStorageEmpty = window.localStorage.length === 0;
  const sessionStorageEmpty = window.sessionStorage.length === 0;
  const indexedDBEmpty = customStore ? (await keys(customStore)).length === 0 : true;

  // If the cache is not empty, try again
  return new Promise((resolve) => {
    if (localStorageEmpty && sessionStorageEmpty && indexedDBEmpty) {
      resolve(true);
    } else {
      clearCache(iteration + 1).then(resolve);
    }
  });
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
