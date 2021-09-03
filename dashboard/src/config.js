import { version } from '../package.json';
const theme = {
  main: '#49C3A6',
  main75: '#55D6BD',
  main50: '#8AE1D0',
  main25: '#C6F0E7',
  mainlight: '#C6F0E7',
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
  if (process.env.NODE_ENV !== 'production') {
    return process.env.REACT_APP_HOST;
  }
  if (window.location.host.includes('dev')) {
    return window.location.host.replace('dashboard-', '');
  }
  return 'mano.fabrique.social.gouv.fr';
};

const HOST = getHost();
const SCHEME = process.env.NODE_ENV === 'development' ? process.env.REACT_APP_SCHEME : 'https';
const ENV = process.env.NODE_ENV || 'production';
const VERSION = version;

export { theme, HOST, SCHEME, ENV, VERSION };
