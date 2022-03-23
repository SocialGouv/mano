import { useState, useEffect } from 'react';
import { atom, useRecoilState } from 'recoil';
import { readFileOrCreateInitFileIfNotExists, writeCollection } from './tauri';
export { writeCollection };
/*
Last Refresh

*/

const lastRefreshState = atom({
  key: 'lastRefreshState',
  default: 0,
});

export const useLastRefresh = () => {
  if (process.env.REACT_APP_IS_TAURI === 'true') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [lastRefresh, setLastRefresh] = useState(() => Number(window.localStorage.getItem('lastRefresh') || 0));
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      window.localStorage.setItem('lastRefresh', lastRefresh);
    }, [lastRefresh]);
    return [lastRefresh, setLastRefresh];
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useRecoilState(lastRefreshState);
    return [value, setValue];
  }
};

/*
Data management

*/

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
    data = JSON.parse(await readFileOrCreateInitFileIfNotExists(`${collectionName}.json`, JSON.stringify([])));
  }

  const response = await API.get({ path: `/${collectionName}`, batch: 1000, setProgress, query: { lastRefresh }, setBatchData });
  if (!response.ok) console.log({ message: `Error getting ${collectionName} data`, response });

  // avoid sending data if no new data, to avoid big useless `map` calculations in selectors
  if (!response.decryptedData.length && !isInitialization) return null;

  data = mergeNewUpdatedData(response.decryptedData, data);
  await writeCollection(collectionName, data);
  return data;
}
