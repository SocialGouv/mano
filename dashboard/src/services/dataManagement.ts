import { type UseStore, set, get, createStore, keys, delMany, clear } from "idb-keyval";
import { capture } from "./sentry";
import { addToDebugMixedOrgsBug } from "../utils/debug-mixed-orgs-bug";

export const dashboardCurrentCacheKey = "mano_last_refresh_2024_06_11";
const legacyStoreName = "mano_last_refresh_2022_01_11";
const legacyManoDB = "mano-dashboard";
const manoDB = "mano";
const storeName = "store";

let customStore: UseStore | null = null;
const savedCacheKey = window.localStorage.getItem("mano-currentCacheKey");
if (savedCacheKey !== dashboardCurrentCacheKey) {
  clearCache("savedCacheKey diff dashboardCurrentCacheKey");
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

export async function clearCache(calledFrom = "not defined", iteration = 0) {
  addToDebugMixedOrgsBug(`clearing cache from ${calledFrom}, iteration ${iteration}`);
  if (iteration > 10) {
    throw new Error("Failed to clear cache");
  }
  await deleteDB().catch(capture);
  addToDebugMixedOrgsBug("clearing localStorage");
  window.localStorage?.clear();
  addToDebugMixedOrgsBug("cleared localStorage");
  // window.sessionStorage?.clear();

  // wait 200ms to make sure the cache is cleared
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Check if the cache is empty
  const localStorageEmpty = window.localStorage.length === 0;
  // const sessionStorageEmpty = window.sessionStorage.length === 0;
  const indexedDBEmpty = customStore ? (await keys(customStore)).length === 0 : true;

  // If the cache is not empty, try again
  return new Promise((resolve) => {
    // if (localStorageEmpty && sessionStorageEmpty && indexedDBEmpty) {
    if (localStorageEmpty && indexedDBEmpty) {
      setupDB();
      resolve(true);
    } else {
      if (!localStorageEmpty) addToDebugMixedOrgsBug(`localStorage not empty ${window.localStorage.key(0)}`);
      // if (!sessionStorageEmpty) addToDebugMixedOrgsBug("sessionStorage not empty");
      if (!indexedDBEmpty) addToDebugMixedOrgsBug("indexedDB not empty");
      clearCache("try again clearCache", iteration + 1).then(resolve);
    }
  });
}

export async function setCacheItem(key: string, value: any) {
  try {
    if (customStore) await set(key, value, customStore);
  } catch (error) {
    if (error instanceof Error && error?.message?.includes("connection is closing")) {
      // Si on a une erreur de type "connection is closing", on va essayer de réinitialiser
      // la connexion à la base de données et de sauvegarder la donnée à nouveau
      setupDB();
      try {
        await set(key, value, customStore);
      } catch (error) {
        capture(error, { tags: { key } });
        return;
      }
    }
    capture(error, { tags: { key } });
  }
}

export async function getCacheItem(key: string) {
  try {
    if (customStore === null) return null;
    const data = await get(key, customStore);
    return data;
  } catch (error) {
    if (error instanceof Error && error?.message?.includes("connection is closing")) {
      // Si on a une erreur de type "connection is closing", on va essayer de réinitialiser
      // la connexion à la base de données et de récupérer la donnée à nouveau
      setupDB();
      try {
        const data = await get(key, customStore);
        return data;
      } catch (error) {
        capture(error, { tags: { key } });
        return null;
      }
    }
    capture(error, { tags: { key } });
    return null;
  }
}

export async function getCacheItemDefaultValue(key: string, defaultValue: any) {
  const storedValue = await getCacheItem(key);
  return storedValue || defaultValue;
}
