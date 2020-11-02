import * as Keychain from 'react-native-keychain';

const IDENTIFIER = 'com.mano';

const setEntity = async (key, value, accessControl) => {
  await Keychain.setGenericPassword(key, JSON.stringify(value), {
    service: `${IDENTIFIER}.${key}`,
  });
};

const getEntity = async (key, service) => {
  try {
    // Retrieve the credentials
    const credentials = await Keychain.getGenericPassword({
      service: `${IDENTIFIER}.${service}`,
    });

    if (!credentials) return null;

    return JSON.parse(credentials.password);
  } catch (error) {
    console.log("Keychain couldn't be accessed!", error);
    return null;
  }
};

/**
 * Remove entity from SecureStorage
 *
 * @param {string} key -> entity name
 *
 * @return {Promise<boolean>}
 */
const resetEntity = async (key) =>
  Keychain.resetGenericPassword({ service: `${IDENTIFIER}.${key}` });

/**
 * Fetches userToken from the Keychain.
 *
 * @param {string} key
 * @returns {Promise<string>}
 */
export const getUserToken = (key = 'userToken') => getEntity(key, key);

/**
 * Fetches accessToken from Keychain
 *
 * @param {string} token
 * @param {string} key
 *
 * @return {Promise<void>}
 */
export const setUserToken = (token, key = 'userToken') => setEntity(key, token);

/**
 * Remove token from Keychain
 *
 * @param key
 *
 * @return {Promise<boolean>}
 */
export const clearUserToken = (key = 'userToken') => resetEntity(key);
