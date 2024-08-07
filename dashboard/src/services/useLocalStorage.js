import { useLocalStorageValue } from "@react-hookz/web";

export const useLocalStorage = (key, defaultValue) => {
  const { value, set, remove } = useLocalStorageValue(key, {
    defaultValue,
  });
  return [value, set, remove];
};
