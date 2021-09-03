const getItem = async (key) => window.sessionStorage.getItem(key);
const setItem = async (key, data) => window.sessionStorage.setItem(key, data);
const removeItem = async (key, data) => window.sessionStorage.removeItem(key, data);
const clear = async () => window.sessionStorage.clear();

const cache = { getItem, setItem, removeItem, clear };
export default cache;
