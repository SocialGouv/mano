import API from './api';
import { capture } from './sentry';

API.init = ({ resetAuth, history, toastr }) => {
  API.resetAuth = resetAuth;
  API.history = history;
  API.toastr = toastr;
  API.showTokenExpiredError = true;
};

API.logout = async (from) => {
  if (API.history) {
    API.history.push('/auth');
    if (from === '401' && API.showTokenExpiredError && API.toastr) API.toastr.error('Votre session a expiré, veuillez vous reconnecter');
  } else {
    if (window.location.pathname !== '/auth') window.location.replace('/auth');
  }
  API.token = null;
  API.enableEncrypt = null;
  API.wrongKeyWarned = null;
  API.hashedOrgEncryptionKey = null;
  API.orgEncryptionKey = null;
  API.sendCaptureError = null;
  API.blockEncrypt = null;
  API.organisation = null;
  if (API.resetAuth) API.resetAuth();
  API.showTokenExpiredError = false;
};

API.cancelEncryption = async () => {
  API.token = null;
  API.enableEncrypt = null;
  API.wrongKeyWarned = null;
  API.hashedOrgEncryptionKey = null;
  API.orgEncryptionKey = null;
  API.sendCaptureError = null;
  API.blockEncrypt = null;
};

API.handleWrongKey = () => {
  API.toastr.error('La clé de chiffrement ne semble pas être correcte, veuillez réessayer.');
  if (API.history) {
    API.history.push('/auth');
  } else {
    if (window.location.pathname !== '/auth') window.location.replace('/auth');
  }
  API.showTokenExpiredError = false;
  API.token = null;
  if (API.resetAuth) API.resetAuth();
};

API.platform = 'dashboard';

API.handleBlockEncrypt = () => API.toastr.error('Erreur !', "Vous ne pouvez pas modifier le contenu. La clé de chiffrement n'est pas la bonne");

API.handleError = (error) => API.toastr.error('Erreur !', error?.toString(), { timeOut: 0 });

API.handleApiError = (res) => {
  try {
    if (res?.error?.message) {
      API.toastr.error('Erreur !', res?.error?.message);
    } else if (res?.error) {
      API.toastr.error('Erreur !', res?.error);
    } else if (res?.code) {
      API.toastr.error('Erreur !', res?.code);
    }
  } catch (errorApi) {
    capture(errorApi, { extra: { API, res } });
  }
};
