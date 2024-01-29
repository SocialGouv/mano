import packageInfo from '../package.json';
// main color based on
// https://www.gouvernement.fr/charte/charte-graphique-les-fondamentaux/les-couleurs
// Menthe
const theme = {
  main: '#226854', // higher contrast
  main75: '#617e71',
  main50: '#95a9a0',
  main25: '#cad4cf',
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
  if (window.location.host.includes('.ovh.')) {
    return window.location.host.replace('dashboard-', '');
  }
  if (window.location.host.includes('espace-mano.localhost')) {
    return 'api-mano.localhost';
  }
  if (window.location.host.includes('test.fabrique.social.gouv.fr')) {
    return 'api-mano.test.fabrique.social.gouv.fr';
  }
  if (window.location.host.includes('preprod-espace-mano.sesan.fr')) {
    console.log('preprod mano');
    return 'preprod-api-mano.sesan.fr';
  }
  if (window.location.host.includes('espace-mano.sesan.fr')) {
    console.log('prod mano');
    return 'api-mano.sesan.fr';
  }
  return 'mano.fabrique.social.gouv.fr';
};

const HOST = getHost();
console.log(process.env);
const SCHEME =
  process.env.NODE_ENV === 'development' || process.env.REACT_APP_TEST === 'true' || process.env.REACT_APP_USE_HTTP === 'true'
    ? process.env.REACT_APP_SCHEME
    : 'https';
const ENV = process.env.NODE_ENV || 'production';
const VERSION = packageInfo.version;
const DEFAULT_ORGANISATION_KEY =
  process.env.NODE_ENV === 'development' && process.env.REACT_APP_TEST !== 'true' ? process.env.REACT_APP_DEFAULT_ORGANISATION_KEY : '';

export { theme, HOST, SCHEME, ENV, VERSION, DEFAULT_ORGANISATION_KEY };
