import packageInfo from '../package.json';
// main color based on
// https://www.gouvernement.fr/charte/charte-graphique-les-fondamentaux/les-couleurs
// Menthe
const theme = {
  main: '#0046FE',
  mainLight: '#F2F6FF',
  black: '#1D2021',
  black75: '#565A5B',
  black50: '#8C9294',
  black25: '#CBD3D6',
  black05: '#F7F9FA',
  white: '#FFFFFF',
  redDark: '#F5222D',
  redLight: '#FBE4E4',
};

const getHost = () => {
  if (process.env.NODE_ENV !== 'production' || process.env.REACT_APP_TEST === 'true') {
    return process.env.REACT_APP_HOST;
  }
  if (window.location.host.includes('dev')) {
    return window.location.host.replace('dashboard-', '');
  }
  return 'mano.fabrique.social.gouv.fr';
};

const HOST = getHost();
const SCHEME = process.env.NODE_ENV === 'development' || process.env.REACT_APP_TEST === 'true' ? process.env.REACT_APP_SCHEME : 'https';
const ENV = process.env.NODE_ENV || 'production';
const VERSION = packageInfo.version;
const DEFAULT_ORGANISATION_KEY =
  process.env.NODE_ENV === 'development' && process.env.REACT_APP_TEST !== 'true' ? process.env.REACT_APP_DEFAULT_ORGANISATION_KEY : '';

export { theme, HOST, SCHEME, ENV, VERSION, DEFAULT_ORGANISATION_KEY };
