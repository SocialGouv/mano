import packageInfo from '../package.json';
// main color based on
// https://www.gouvernement.fr/charte/charte-graphique-les-fondamentaux/les-couleurs
// Menthe
const theme = {
  main: '#008e7f', // higher contrast
  main75: '#52a9b4',
  main50: '#98c3d8',
  main25: '#d4deee',
  black: '#1D2021',
  black75: '#3b3b3b',
  black50: '#777777',
  black25: '#b9b9b9',
  black05: '#F7F9FA',
  white: '#FFFFFF',
  redDark: '#F5222D',
  redLight: '#FBE4E4',
  orangeLight: '#FEF3C7',
  orangeDark: '#D97706',
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
const DEFAULT_ORGANISATION_KEY = ENV === 'development' ? process.env.REACT_APP_DEFAULT_ORGANISATION_KEY : '';

export { theme, HOST, SCHEME, ENV, VERSION, DEFAULT_ORGANISATION_KEY };
