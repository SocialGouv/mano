import React, { useContext } from 'react';
import API from '../services/api';
import cache from '../services/cache';
import AuthContext from './auth';

const CacheContext = React.createContext({});

export const CacheProvider = ({ children }) => {
  const { organisation } = useContext(AuthContext);

  const getItem = async (key, { decrypt = true } = {}) => {
    const cachedData = await cache.getItem(`org-${organisation._id}-${key}`);
    if (!decrypt) return cachedData;
    if (!cachedData?.length) return { data: [], encrypted: [] };
    const encrypted = JSON.parse(cachedData);
    const data = [];
    for (const item of encrypted) {
      const decryptedItem = await API.decryptDBItem(item);
      if (this.wrongKeyWarned) {
        return { ok: false, data: [] };
      }
      data.push(decryptedItem);
    }
    return { data, encrypted };
  };

  const setItem = (key, data) => cache.setItem(`org-${organisation._id}-${key}`, JSON.stringify(data));

  const removeItem = (key, data) => cache.setItem(`org-${organisation._id}-${key}`, data);

  const clear = () => cache.clear();

  return <CacheContext.Provider value={{ getItem, setItem, removeItem, clear }}>{children}</CacheContext.Provider>;
};

export default CacheContext;
