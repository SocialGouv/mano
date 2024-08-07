import { useSessionStorageValue } from "@react-hookz/web";

export const useSessionStorage = (key, defaultValue) => {
  const { value, set, remove } = useSessionStorageValue(key, {
    defaultValue,
  });
  return [value, set, remove];
};
