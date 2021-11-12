import { useState } from 'react';
import { useHistory } from 'react-router';
import useApiService from './api';
import { capture } from './sentry';
import fetchRetry from 'fetch-retry';
import { toastr } from 'react-redux-toastr';

const useApi = () => {
  const [showTokenExpiredError, setShowTokenExpiredError] = useState(false);
  const history = useHistory();

  const handleWrongKey = () => {
    if (history) {
      history.push('/auth');
    } else {
      window.location.replace('/auth');
    }
    toastr.error('La clé de chiffrement ne semble pas être correcte, veuillez réessayer.');
    setShowTokenExpiredError(false);
  };

  const onLogout = async (status) => {
    if (window.location.pathname !== '/auth') {
      if (history) {
        history.push('/auth');
        if (status === '401' && showTokenExpiredError && toastr) toastr.error('Votre session a expiré, veuillez vous reconnecter');
      } else {
        window.location.replace('/auth');
      }
    }
  };

  const platform = 'dashboard';

  const handleBlockEncrypt = () => toastr?.error('Erreur !', "Vous ne pouvez pas modifier le contenu. La clé de chiffrement n'est pas la bonne");

  const handleError = (error, subtitle) => toastr?.error(error?.toString(), subtitle, { timeOut: 0 });

  const handleApiError = (res) => {
    try {
      if (res?.error?.message) {
        toastr?.error('Erreur !', res?.error?.message);
      } else if (res?.error) {
        toastr?.error('Erreur !', res?.error);
      } else if (res?.code) {
        toastr?.error('Erreur !', res?.code);
      }
    } catch (errorApi) {
      capture(errorApi, { extra: { res } });
    }
  };

  const api = useApiService({
    handleError,
    handleBlockEncrypt,
    onLogout,
    handleApiError,
    handleWrongKey,
    platform,
    fetch: fetchRetry(window.fetch),
  });

  return api;
};

export default useApi;
