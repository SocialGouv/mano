import * as Keychain from 'react-native-keychain';
import deviceInfoModule from 'react-native-device-info';

const bundleId = deviceInfoModule.getBundleId();

export const saveUsernameAndPassword = async (username, password) => {
  if (!username || !password) return;
  await Keychain.setInternetCredentials(bundleId, username, password);
};
