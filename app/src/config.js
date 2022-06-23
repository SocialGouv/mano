import envConfig from 'react-native-config';
import { version } from '../package.json';

const SCHEME = envConfig.SCHEME;
const HOST = envConfig.HOST;
const APP_ENV = envConfig.APP_ENV;
const MANO_DOWNLOAD_URL = 'https://mano-app.fabrique.social.gouv.fr/download';
const MATOMO_SITE_ID = envConfig.MATOMO_SITE_ID;
const MATOMO_URL = envConfig.MATOMO_URL;
const SENTRY_XXX = envConfig.SENTRY_XXX;
const FRAMAFORM_MANO = envConfig.FRAMAFORM_MANO;
const VERSION = version;
const DEVMODE_PASSWORD = envConfig.DEVMODE_PASSWORD || '';
const DEVMODE_ENCRYPTION_KEY = envConfig.DEVMODE_ENCRYPTION_KEY || '';

export {
  SCHEME,
  HOST,
  APP_ENV,
  MANO_DOWNLOAD_URL,
  MATOMO_SITE_ID,
  MATOMO_URL,
  SENTRY_XXX,
  FRAMAFORM_MANO,
  VERSION,
  DEVMODE_PASSWORD,
  DEVMODE_ENCRYPTION_KEY,
};
