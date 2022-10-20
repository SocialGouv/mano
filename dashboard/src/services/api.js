import { atom, useRecoilValue, useSetRecoilState } from 'recoil';
import URI from 'urijs';
import { toast } from 'react-toastify';
import { useHistory } from 'react-router';
import fetchRetry from 'fetch-retry';
import packageInfo from '../../package.json';
import { HOST, SCHEME } from '../config';
import { organisationState } from '../recoil/auth';
import { decrypt, derivedMasterKey, encrypt, generateEntityKey, checkEncryptedVerificationKey, encryptFile, decryptFile } from './encryption';
import { AppSentry, capture } from './sentry';
import { apiVersionState } from '../recoil/apiVersion';
const fetch = fetchRetry(window.fetch);

const getUrl = (path, query = {}) => {
  return new URI().scheme(SCHEME).host(HOST).path(path).setSearch(query).toString();
};

/* encryption */
export let hashedOrgEncryptionKey = null;
let enableEncrypt = false;
let blockEncrypt = false;
let sendCaptureError = 0; // TO BE REMOVED WHEN ALL ORGANISATIONS HAVE `encryptionVerificationKey`
let wrongKeyWarned = false; // TO BE REMOVED WHEN ALL ORGANISATIONS HAVE `encryptionVerificationKey`

/* auth */
export let tokenCached = null;

/* methods */
export const setOrgEncryptionKey = async (orgEncryptionKey, { encryptedVerificationKey = null, name, _id } = {}) => {
  const newHashedOrgEncryptionKey = await derivedMasterKey(orgEncryptionKey);
  if (!!encryptedVerificationKey) {
    const encryptionKeyIsValid = await checkEncryptedVerificationKey(encryptedVerificationKey, newHashedOrgEncryptionKey);
    if (!encryptionKeyIsValid) {
      toast.error('La clé de chiffrement ne semble pas être correcte, veuillez réessayer.');
      return false;
    }
  }
  hashedOrgEncryptionKey = newHashedOrgEncryptionKey;
  enableEncrypt = true;
  sendCaptureError = 0;
  wrongKeyWarned = false;
  blockEncrypt = false;
  return newHashedOrgEncryptionKey;
};

export const encryptItem =
  (hashedOrgEncryptionKey, enableEncrypt = true) =>
  async (item) => {
    if (!enableEncrypt) {
      delete item.decrypted;
      return item;
    }
    if (item.decrypted) {
      if (!item.entityKey) item.entityKey = await generateEntityKey();
      const { encryptedContent, encryptedEntityKey } = await encrypt(JSON.stringify(item.decrypted), item.entityKey, hashedOrgEncryptionKey);

      item.encrypted = encryptedContent;
      item.encryptedEntityKey = encryptedEntityKey;
      delete item.decrypted;
      delete item.entityKey;
    }
    return item;
  };

const decryptDBItem = async (item, { logout, path, debug = false, encryptedVerificationKey = null } = {}) => {
  if (wrongKeyWarned) return item;
  if (!enableEncrypt) return item;
  if (!item.encrypted) return item;
  if (!!item.deletedAt) return item;
  if (!item.encryptedEntityKey) return item;
  try {
    const { content, entityKey } = await decrypt(item.encrypted, item.encryptedEntityKey, hashedOrgEncryptionKey);

    delete item.encrypted;

    try {
      JSON.parse(content);
    } catch (errorDecryptParsing) {
      toast.error(errorDecryptParsing, 'Désolé une erreur est survenue lors du déchiffrement');
      console.log('ERROR PARSING CONTENT', errorDecryptParsing, content);
    }

    const decryptedItem = {
      ...item,
      ...JSON.parse(content),
      entityKey,
    };
    return decryptedItem;
  } catch (errorDecrypt) {
    if (sendCaptureError < 5) {
      capture(`ERROR DECRYPTING ITEM : ${errorDecrypt}`, {
        extra: {
          message: 'ERROR DECRYPTING ITEM',
          item,
          path,
          hashedOrgEncryptionKey,
        },
      });
      sendCaptureError++;
    }
    if (!!encryptedVerificationKey) {
      toast.error(
        "Désolé, un élément n'a pas pu être déchiffré",
        "L'équipe technique a été prévenue, nous reviendrons vers vous dans les meilleurs délais."
      );
      return item;
    }
    if (!wrongKeyWarned) {
      wrongKeyWarned = true;
      toast.error('La clé de chiffrement ne semble pas être correcte, veuillez réessayer.');
      logout();
    }
    // prevent false admin with bad key to be able to change the key
    blockEncrypt = enableEncrypt && errorDecrypt.message.includes('FAILURE');
  }
  return item;
};

const handleApiError = (res) => {
  if (res?.error?.message) {
    toast?.error(res?.error?.message);
  } else if (res?.error) {
    toast?.error(res?.error);
  } else if (res?.code) {
    toast?.error(res?.code);
  } else {
    capture('api error unhandled', { extra: { res } });
  }
};

export const recoilResetKeyState = atom({ key: 'recoilResetKeyState', default: 0 });
const useApi = () => {
  const organisation = useRecoilValue(organisationState);
  const setRecoilResetKey = useSetRecoilState(recoilResetKeyState);
  const setApiVersion = useSetRecoilState(apiVersionState);
  const history = useHistory();

  const { encryptionLastUpdateAt, encryptionEnabled, encryptedVerificationKey, migrationLastUpdateAt } = organisation;

  const reset = () => {
    hashedOrgEncryptionKey = null;
    enableEncrypt = false;
    tokenCached = null;
    sendCaptureError = 0;
    wrongKeyWarned = false;
    blockEncrypt = false;
    setRecoilResetKey((k) => k + 1);
    AppSentry.setUser({});
    AppSentry.setContext('currentTeam', {});
  };

  const logout = async (status) => {
    await post({
      path: '/user/logout',
      skipEncryption: '/user/logout',
    });
    reset();
    if (window.location.pathname !== '/auth') {
      if (history) {
        history.push('/auth');
        if (status === '401') toast.error('Votre session a expiré, veuillez vous reconnecter');
      } else {
        window.location.replace('/auth');
      }
    }
  };

  // Upload a file to a path.
  const upload = async ({ file, path }) => {
    // Prepare file.
    const { encryptedEntityKey, encryptedFile } = await encryptFile(file, hashedOrgEncryptionKey);
    const formData = new FormData();
    formData.append('file', encryptedFile);

    const options = {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
      body: formData,
      headers: { Authorization: `JWT ${tokenCached}`, Accept: 'application/json', platform: 'dashboard', version: packageInfo.version },
    };
    const url = getUrl(path);
    const response = await fetch(url, options);
    const json = await response.json();
    return { ...json, encryptedEntityKey };
  };

  // Download a file from a path.
  const download = async ({ path, encryptedEntityKey }) => {
    const options = {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
      headers: { Authorization: `JWT ${tokenCached}`, 'Content-Type': 'application/json', platform: 'dashboard', version: packageInfo.version },
    };
    const url = getUrl(path);
    const response = await fetch(url, options);
    const blob = await response.blob();
    const decrypted = await decryptFile(blob, encryptedEntityKey, hashedOrgEncryptionKey);
    return decrypted;
  };

  const deleteFile = async ({ path }) => {
    const options = {
      method: 'DELETE',
      mode: 'cors',
      credentials: 'include',
      headers: { Authorization: `JWT ${tokenCached}`, 'Content-Type': 'application/json', platform: 'dashboard', version: packageInfo.version },
    };
    const url = getUrl(path);
    const response = await fetch(url, options);
    return response.json();
  };

  const execute = async ({
    method,
    path = '',
    body = null,
    query = {},
    headers = {},
    debug = false,
    skipEncryption = false,
    forceMigrationLastUpdate = null,
  } = {}) => {
    try {
      // Force logout when one user has been logged in multiple tabs to different organisations.
      if (
        path !== '/user/logout' &&
        organisation._id &&
        window.localStorage.getItem('mano-organisationId') &&
        organisation._id !== window.localStorage.getItem('mano-organisationId')
      ) {
        toast.error(
          'Veuillez vous reconnecter',
          'Il semble que vous soyez connecté à plusieurs organisations dans un même navigateur (par exemple dans un autre onglet). Cela peut poser des problèmes de cache.',
          { timeOut: 8000 }
        );
        logout();
      }
      if (tokenCached) headers.Authorization = `JWT ${tokenCached}`;
      const options = {
        method,
        mode: 'cors',
        credentials: 'include',
        headers: { ...headers, 'Content-Type': 'application/json', Accept: 'application/json', platform: 'dashboard', version: packageInfo.version },
      };

      if (body) {
        options.body = JSON.stringify(await encryptItem(hashedOrgEncryptionKey, enableEncrypt)(body));
      }

      if (['PUT', 'POST', 'DELETE'].includes(method) && enableEncrypt) {
        if (blockEncrypt && !skipEncryption) {
          return { ok: false, error: "Vous ne pouvez pas modifier le contenu. La clé de chiffrement n'est pas la bonne" };
        }
        query = {
          encryptionLastUpdateAt,
          encryptionEnabled,
          migrationLastUpdateAt: forceMigrationLastUpdate || migrationLastUpdateAt,
          ...query,
        };
      }

      options.retries = 10;
      options.retryDelay = 2000;

      const url = getUrl(path, query);
      const response = await fetch(url, options);
      if (response.headers.has('x-api-version')) {
        setApiVersion(response.headers.get('x-api-version'));
      }

      if (!response.ok && response.status === 401) {
        if (!['/user/logout', '/user/signin-token'].includes(path)) logout();
        return response;
      }

      try {
        const res = await response.json();
        if (!response.ok) handleApiError(res);
        if (!!res.data && Array.isArray(res.data)) {
          const decryptedData = await Promise.all(res.data.map((item) => decryptDBItem(item, { path, debug, logout, encryptedVerificationKey })));
          if (wrongKeyWarned) {
            return { ok: false, data: [] };
          }
          res.decryptedData = decryptedData;
          return res;
        } else if (res.data) {
          res.decryptedData = await decryptDBItem(res.data, { path, debug, logout, encryptedVerificationKey });
          return res;
        } else {
          return res;
        }
      } catch (errorFromJson) {
        capture(errorFromJson, { extra: { message: 'error parsing response', response, path, query } });
        return { ok: false, error: "Une erreur inattendue est survenue, l'équipe technique a été prévenue. Désolé !" };
      }
    } catch (errorExecuteApi) {
      capture(errorExecuteApi, {
        extra: {
          path,
          query,
          method,
          body,
          headers,
        },
      });
      if (typeof errorExecuteApi === 'string') {
        toast.error(errorExecuteApi, 'Désolé une erreur est survenue');
      } else if (errorExecuteApi?.message) {
        toast.error(errorExecuteApi.message, 'Désolé une erreur est survenue');
      } else {
        toast.error('Une erreur est survenue', 'Désolé une erreur est survenue');
      }

      throw errorExecuteApi;
    }
  };

  const get = (args) => execute({ method: 'GET', ...args });
  const post = (args) => execute({ method: 'POST', ...args });
  const put = (args) => execute({ method: 'PUT', ...args });

  return {
    setToken: (newToken) => (tokenCached = newToken),
    // token,
    get,
    reset,
    logout,
    post,
    put,
    upload,
    download,
    deleteFile,
    delete: (args) => execute({ method: 'DELETE', ...args }), // delete cannot be a method
  };
};

export default useApi;
