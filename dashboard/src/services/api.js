import { atom, useRecoilValue, useSetRecoilState } from 'recoil';
import URI from 'urijs';
import { toastr } from 'react-redux-toastr';
import fetchRetry from 'fetch-retry';
import { version } from '../../package.json';
import { HOST, SCHEME } from '../config';
import { organisationState } from '../recoil/auth';
import { decrypt, derivedMasterKey, encrypt, generateEntityKey, checkEncryptedVerificationKey, encryptFile, decryptFile } from './encryption';
import { AppSentry, capture } from './sentry';
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
      toastr.error('La clé de chiffrement ne semble pas être correcte, veuillez réessayer.');
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

const decryptDBItem = async (item, { logout, debug = false, encryptedVerificationKey = null } = {}) => {
  if (wrongKeyWarned) return item;
  if (!enableEncrypt) return item;
  if (!item.encrypted) return item;
  if (!item.encryptedEntityKey) return item;
  try {
    const { content, entityKey } = await decrypt(item.encrypted, item.encryptedEntityKey, hashedOrgEncryptionKey);

    delete item.encrypted;

    try {
      JSON.parse(content);
    } catch (errorDecryptParsing) {
      toastr.error(errorDecryptParsing, 'Désolé une erreur est survenue lors du déchiffrement');
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
          hashedOrgEncryptionKey,
        },
      });
      sendCaptureError++;
    }
    if (!!encryptedVerificationKey) {
      toastr.error(
        "Désolé, un élément n'a pas pu être déchiffré",
        "L'équipe technique a été prévenue, nous reviendrons vers vous dans les meilleurs délais."
      );
      return item;
    }
    if (!wrongKeyWarned) {
      wrongKeyWarned = true;
      toastr.error('La clé de chiffrement ne semble pas être correcte, veuillez réessayer.');
      logout();
    }
    // prevent false admin with bad key to be able to change the key
    blockEncrypt = enableEncrypt && errorDecrypt.message.includes('FAILURE');
  }
  return item;
};

const handleApiError = (res) => {
  if (res?.error?.message) {
    toastr?.error('Erreur !', res?.error?.message);
  } else if (res?.error) {
    toastr?.error('Erreur !', res?.error);
  } else if (res?.code) {
    toastr?.error('Erreur !', res?.code);
  } else {
    capture('api error unhandled', { extra: { res } });
  }
};

export const recoilResetKeyState = atom({ key: 'recoilResetKeyState', default: 0 });
const useApi = () => {
  const organisation = useRecoilValue(organisationState);
  const setRecoilResetKey = useSetRecoilState(recoilResetKeyState);

  const { encryptionLastUpdateAt, encryptionEnabled, encryptedVerificationKey } = organisation;

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
      window.location.reload(true);
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
      headers: { Accept: 'application/json', platform: 'dashboard', version },
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
      headers: { 'Content-Type': 'application/json', platform: 'dashboard', version },
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
      headers: { 'Content-Type': 'application/json', platform: 'dashboard', version },
    };
    const url = getUrl(path);
    const response = await fetch(url, options);
    return response.json();
  };

  const execute = async ({ method, path = '', body = null, query = {}, headers = {}, debug = false, skipEncryption = false } = {}) => {
    try {
      const options = {
        method,
        mode: 'cors',
        credentials: 'include',
        headers: { ...headers, 'Content-Type': 'application/json', Accept: 'application/json', platform: 'dashboard', version },
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
          ...query,
        };
      }

      options.retries = 10;
      options.retryDelay = 2000;

      const url = getUrl(path, query);
      const response = await fetch(url, options);

      if (!response.ok && response.status === 401) {
        if (!['/user/logout', '/user/signin-token'].includes(path)) logout();
        return response;
      }

      try {
        const res = await response.json();
        if (!response.ok) handleApiError(res);
        if (!!res.data && Array.isArray(res.data)) {
          const decryptedData = [];
          for (const item of res.data) {
            const decryptedItem = await decryptDBItem(item, { debug, logout, encryptedVerificationKey });
            if (wrongKeyWarned) {
              return { ok: false, data: [] };
            }
            decryptedData.push(decryptedItem);
          }
          res.decryptedData = decryptedData;
          return res;
        } else if (res.data) {
          res.decryptedData = await decryptDBItem(res.data, { debug, logout, encryptedVerificationKey });
          return res;
        } else {
          return res;
        }
      } catch (errorFromJson) {
        capture(errorFromJson, { extra: { message: 'error parsing response', response } });
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
        toastr.error(errorExecuteApi, 'Désolé une erreur est survenue');
      } else if (errorExecuteApi?.message) {
        toastr.error(errorExecuteApi.message, 'Désolé une erreur est survenue');
      } else {
        toastr.error('Une erreur est survenue', 'Désolé une erreur est survenue');
      }

      throw errorExecuteApi;
    }
  };

  const get = async (args) => {
    if (args.batch) {
      let hasMore = true;
      let page = 0;
      let limit = args.batch;
      let data = [];
      let decryptedData = [];
      while (hasMore) {
        let query = { ...args.query, limit, page };
        const response = await execute({ method: 'GET', ...args, query });
        if (!response.ok) {
          capture('error getting batch', { extra: { response, args } });
          return { ok: false, data: [] };
        }
        data.push(...response.data);
        decryptedData.push(...(response.decryptedData || []));
        hasMore = response.hasMore;
        page = response.hasMore ? page + 1 : page;
        // at least 1 for showing progress
        if (args.setProgress) args.setProgress(response.data.length || 1);
        if (args.setBatchData) args.setBatchData(response.data);
        await new Promise((res) => setTimeout(res, 50));
      }
      return { ok: true, data, decryptedData };
    } else {
      return execute({ method: 'GET', ...args });
    }
  };

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
