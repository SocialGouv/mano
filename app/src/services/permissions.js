import { request, check, RESULTS } from 'react-native-permissions';
import { Platform, PermissionsAndroid } from 'react-native';
import debugError from './debugError';

export const checkPermissionAsync = async ({ ios, android }) =>
  await check(Platform.select({ ios, android }))
    .then((result) => {
      switch (result) {
        default:
        case RESULTS.UNAVAILABLE:
        case RESULTS.BLOCKED:
        case RESULTS.DENIED:
          return false;
        case RESULTS.GRANTED:
          return true;
      }
    })
    .catch((error) => {
      debugError('error while checking permission', error);
    });

const getPermissionAsync = async ({ ios, android }) => {
  try {
    if (Platform.OS === 'ios') return await getIosPermissionAsync(ios);
    return await getAndroidPermissionAsync(android);
  } catch (err) {
    debugError('getPermissionAsync error', err);
  }
  return null;
};

const getAndroidPermissionAsync = async ({ permission }) => {
  try {
    const androidRequest = PermissionsAndroid.request;
    const granted = await androidRequest(permission);
    if (granted === PermissionsAndroid.RESULTS.GRANTED) return true;
    return false;
  } catch (err) {
    debugError('getAndroidPermissionAsync error', err);
  }
  return null;
};

const getIosPermissionAsync = async ({ permission, name }) => {
  try {
    let canRequest = false;
    let needRequest = false;
    let granted = false;
    await check(permission)
      .then((result) => {
        switch (result) {
          default:
          case RESULTS.UNAVAILABLE:
          case RESULTS.BLOCKED:
            // 'This feature is not available (on this device / in this context)',
            return;
          case RESULTS.DENIED:
            // 'The permission has not been requested / is denied but requestable',
            canRequest = true;
            needRequest = true;
            return;
          case RESULTS.GRANTED:
            granted = true;
        }
      })
      .catch((error) => {
        debugError(`error while checking ${name} permission`, error);
      });

    if (granted) return true;
    if (!needRequest) return false;
    if (!canRequest) return false;

    return await request(permission)
      .then((result) => {
        switch (result) {
          default:
          case RESULTS.UNAVAILABLE:
          case RESULTS.BLOCKED:
          case RESULTS.DENIED:
            return false;
          case RESULTS.GRANTED:
            return true;
        }
      })
      .catch((error) => {
        debugError(`error while requesting ${name} permission`, error);
      });
  } catch (e) {
    debugError('getIosPermissionAsync error', e);
  }
  return false;
};

export default getPermissionAsync;
