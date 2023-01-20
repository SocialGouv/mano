import { atom } from 'recoil';
import { getRecoil, setRecoil } from 'recoil-nexus';
import URI from 'urijs';
import { toast } from 'react-toastify';
import fetchRetry from 'fetch-retry';
import packageInfo from '../../package.json';
import { HOST, SCHEME } from '../config';
import { organisationState } from '../recoil/auth';
import { decrypt, derivedMasterKey, encrypt, generateEntityKey, checkEncryptedVerificationKey, encryptFile, decryptFile } from './encryption';
import { AppSentry, capture } from './sentry';
import { apiVersionState, minimumDashboardVersionState } from '../recoil/version';
const fetch = fetchRetry(window.fetch);

const getUrl = (path, query = {}) => {
  return new URI().scheme(SCHEME).host(HOST).path(path).query(query).toString();
};

/* encryption */
let hashedOrgEncryptionKey = null;
let enableEncrypt = false;

/* auth */
export const authTokenState = atom({ key: 'authTokenState', default: null });

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
  return newHashedOrgEncryptionKey;
};

export const encryptItem = async (item) => {
  if (item.decrypted) {
    if (!item.entityKey) item.entityKey = await generateEntityKey();
    const { encryptedContent, encryptedEntityKey } = await encrypt(JSON.stringify(item.decrypted), item.entityKey, hashedOrgEncryptionKey);

    // why do we decryptDBItem ? without await ?
    // because we just want to make sure the encryption is working
    // if it's not working, the decryptDBItem will fail and we will capture the error
    // NOTE: sonarcloud is complaining that not putting `await` is a bug
    // but we don't need to wait for it to finish because it's only for debug
    // TODO: remove when debug is done
    try {
      decryptDBItem({ encryptedContent, encryptedEntityKey }, hashedOrgEncryptionKey);
    } catch (e) {
      // TODO: remove when debug is done
      capture('error decrypting item after encrypting', { extra: { e, item } });
    }

    item.encrypted = encryptedContent;
    item.encryptedEntityKey = encryptedEntityKey;
    delete item.decrypted;
    delete item.entityKey;
  }
  return item;
};

const decryptDBItem = async (item, { path, encryptedVerificationKey = null } = {}) => {
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
      capture('ERROR PARSING CONTENT', { extra: { errorDecryptParsing, content } });
    }

    const decryptedItem = {
      ...item,
      ...JSON.parse(content),
      entityKey,
    };
    return decryptedItem;
  } catch (errorDecrypt) {
    capture(`ERROR DECRYPTING ITEM : ${errorDecrypt}`, {
      extra: {
        message: 'ERROR DECRYPTING ITEM',
        item,
        path,
      },
    });
    if (!!encryptedVerificationKey) {
      toast.error(
        "Désolé, un élément n'a pas pu être déchiffré",
        "L'équipe technique a été prévenue, nous reviendrons vers vous dans les meilleurs délais."
      );
      return item;
    }
  }
  return item;
};

export const recoilResetKeyState = atom({ key: 'recoilResetKeyState', default: 0 });

const reset = () => {
  hashedOrgEncryptionKey = null;
  enableEncrypt = false;
  setRecoil(authTokenState, null);
  setRecoil(recoilResetKeyState, Date.now());
  AppSentry.setUser({});
  AppSentry.setTag('organisationId', '');
};

const logout = async () => {
  await post({ path: '/user/logout' });
  reset();
  window.location.reload();
};

// Upload a file to a path.
export const upload = async ({ file, path }) => {
  // Prepare file.
  const tokenCached = getRecoil(authTokenState);
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
export const download = async ({ path, encryptedEntityKey }) => {
  const tokenCached = getRecoil(authTokenState);
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

export const deleteFile = async ({ path }) => {
  const tokenCached = getRecoil(authTokenState);
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

const execute = async ({ method, path = '', body = null, query = {}, headers = {}, forceMigrationLastUpdate = null } = {}) => {
  const organisation = getRecoil(organisationState);
  const tokenCached = getRecoil(authTokenState);
  const { encryptionLastUpdateAt, encryptionEnabled, encryptedVerificationKey, migrationLastUpdateAt } = organisation;
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
      options.body = JSON.stringify(await encryptItem(body));
    }

    if (['PUT', 'POST', 'DELETE'].includes(method) && enableEncrypt) {
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
      setRecoil(apiVersionState, response.headers.get('x-api-version'));
    }
    if (response.headers.has('x-minimum-dashboard-version')) {
      setRecoil(minimumDashboardVersionState, response.headers.get('x-minimum-dashboard-version'));
    }

    if (!response.ok && response.status === 401) {
      if (!['/user/logout', '/user/signin-token'].includes(path)) logout();
      return response;
    }

    try {
      const res = await response.json();
      if (!response.ok) {
        if (res?.error?.message) {
          toast?.error(res?.error?.message, { autoClose: process.env.REACT_APP_TEST_PLAYWRIGHT !== 'true' });
        } else if (res?.error) {
          toast?.error(res?.error, { autoClose: process.env.REACT_APP_TEST_PLAYWRIGHT !== 'true' });
        } else if (res?.code) {
          toast?.error(res?.code, { autoClose: process.env.REACT_APP_TEST_PLAYWRIGHT !== 'true' });
        } else {
          capture('api error unhandled', { extra: { res, path, query } });
        }
      }
      if (!!res.data && Array.isArray(res.data)) {
        const decryptedData = await Promise.all(res.data.map((item) => decryptDBItem(item, { path, encryptedVerificationKey })));
        res.decryptedData = decryptedData;
        return res;
      } else if (res.data) {
        res.decryptedData = await decryptDBItem(res.data, { path, encryptedVerificationKey });
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
      toast.error(errorExecuteApi, { autoClose: process.env.REACT_APP_TEST_PLAYWRIGHT !== 'true' });
    } else if (errorExecuteApi?.message) {
      toast.error(errorExecuteApi.message, { autoClose: process.env.REACT_APP_TEST_PLAYWRIGHT !== 'true' });
    } else {
      toast.error('Désolé, une erreur est survenue', { autoClose: process.env.REACT_APP_TEST_PLAYWRIGHT !== 'true' });
    }

    throw errorExecuteApi;
  }
};

const get = (args) => execute({ method: 'GET', ...args });
const post = (args) => execute({ method: 'POST', ...args });
const put = (args) => execute({ method: 'PUT', ...args });
const executeDelete = (args) => execute({ method: 'DELETE', ...args });

const API = {
  get,
  post,
  put,
  delete: executeDelete,
  download,
  upload,
  logout,
};

export default API;
