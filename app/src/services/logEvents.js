import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-community/async-storage';
import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';
import Matomo from './matomo';
import { MATOMO_SITE_ID, MATOMO_URL } from '../config';

const CONSTANTS = {
  STORE_KEY_USER_ID: 'STORE_KEY_USER_ID',
  STORE_KEY_NUMBER_OF_VISITS: 'STORE_KEY_NUMBER_OF_VISITS',
};

const initLogEvents = async () => {
  let userId = await AsyncStorage.getItem(CONSTANTS.STORE_KEY_USER_ID);
  if (!userId) {
    userId = Matomo.makeid();
    await AsyncStorage.setItem(CONSTANTS.STORE_KEY_USER_ID, userId);
  }

  const prevVisits = await AsyncStorage.getItem(CONSTANTS.STORE_KEY_NUMBER_OF_VISITS);
  const newVisits = prevVisits ? Number(prevVisits) + 1 : 1;
  await AsyncStorage.setItem(CONSTANTS.STORE_KEY_NUMBER_OF_VISITS, `${newVisits}`);

  Matomo.init({
    baseUrl: MATOMO_URL,
    idsite: MATOMO_SITE_ID,
    userId,
    _idvc: newVisits,
  });

  Matomo.setUserProperties({
    version: DeviceInfo.getVersion(),
    system: Platform.OS,
  });
};

const checkNetwork = async () => {
  const networkState = await NetInfo.fetch();
  if (!networkState.isConnected) return false;
  return true;
};

const logEvent = async ({ category, action, name, value }) => {
  try {
    const canSend = await checkNetwork();
    if (!canSend) throw new Error('no network');
    Matomo.logEvent({ category, action, name, value });
  } catch (e) {
    console.log('logEvent error', e);
    console.log('logEvent error', { category, action, name, value });
  }
};

/*
APP VISIT

*/

const APP = 'APP';
const APP_OPEN = 'APP_OPEN';
const APP_CLOSE = 'APP_CLOSE';

const logAppVisit = async (from = null) => {
  await logEvent({
    category: APP,
    action: APP_OPEN,
  });
};

const logAppClose = async () => {
  await logEvent({
    category: APP,
    action: APP_CLOSE,
  });
};

export default {
  initLogEvents,
  logAppVisit,
  logAppClose,
};
