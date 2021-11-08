import { useHotkeys } from 'react-hotkeys-hook';

const useOnReloadHotkeys = (callback) => {
  const handleHotkeyPress = (event) => {
    if (!!callback) event.preventDefault();
    callback?.();
  };

  useHotkeys('ctrl+r', handleHotkeyPress);
  useHotkeys('cmd+r', handleHotkeyPress);
  useHotkeys('f5', handleHotkeyPress);
};

export default useOnReloadHotkeys;
