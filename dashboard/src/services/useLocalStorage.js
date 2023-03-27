import { useLocalStorageValue } from '@react-hookz/web/esm/useLocalStorageValue';

export const useLocalStorage = (key, defaultValue) => {
  const { value, set } = useLocalStorageValue(key, {
    defaultValue,
  });
  return [value, set];
};
