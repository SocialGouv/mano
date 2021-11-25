import { useRecoilValue, useResetRecoilState } from 'recoil';
import URI from 'urijs';
import { version } from '../../package.json';
import { HOST, SCHEME } from '../config';
import { currentTeamState, organisationState, teamsState, userState } from '../recoil/auth';
import { decrypt, derivedMasterKey, encrypt, generateEntityKey, checkEncryptedVerificationKey } from './encryption';
import { capture } from './sentry';

const getUrl = (path, query) => {
  return new URI().scheme(SCHEME).host(HOST).path(path).setSearch(query).toString();
};

export let hashedOrgEncryptionKey = null;
let enableEncrypt = false;
let orgEncryptionKeyCache = null;
let sendCaptureError = 0;
let wrongKeyWarned = false;
let blockEncrypt = false;
export let tokenCached = null;

export const encryptItem =
  (hashedOrgEncryptionKey, enableEncrypt = true) =>
  async (item) => {
    if (!enableEncrypt) return item;
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

const useApiService = ({
  handleError,
  handleBlockEncrypt,
  handleLogoutError,
  onLogout,
  handleNewVersion,
  handleApiError,
  handleWrongKey,
  platform,
  fetch,
}) => {
  const organisation = useRecoilValue(organisationState);
  const resetOrganisation = useResetRecoilState(organisationState);
  const resetUserState = useResetRecoilState(userState);
  const resetTeamsState = useResetRecoilState(teamsState);
  const resetCurrentTeamState = useResetRecoilState(currentTeamState);

  const reset = () => {
    hashedOrgEncryptionKey = null;
    enableEncrypt = false;
    orgEncryptionKeyCache = null;
    tokenCached = null;
    sendCaptureError = 0;
    wrongKeyWarned = false;
    blockEncrypt = false;
    resetOrganisation();
    resetUserState();
    resetTeamsState();
    resetCurrentTeamState();
  };

  const logout = async (status) => {
    await post({
      path: '/user/logout',
      skipEncryption: '/user/logout',
    });
    reset();
    onLogout(status);
  };

  const execute = async ({ method, path = '', body = null, query = {}, headers = {}, debug = false, skipEncryption = false, batch = null } = {}) => {
    try {
      if (tokenCached) headers.Authorization = `JWT ${tokenCached}`;
      const options = {
        method,
        mode: 'cors',
        credentials: 'include',
        headers: { ...headers, 'Content-Type': 'application/json', Accept: 'application/json', platform, version },
      };
      if (body) {
        if (!skipEncryption) {
          options.body = JSON.stringify(await encryptItem(hashedOrgEncryptionKey, enableEncrypt)(body));
        } else {
          options.body = JSON.stringify(body);
        }
      }

      if (['PUT', 'POST', 'DELETE'].includes(method) && enableEncrypt) {
        if (blockEncrypt && !skipEncryption) {
          handleBlockEncrypt?.();
          return { ok: false, error: "Vous ne pouvez pas modifier le contenu. La clé de chiffrement n'est pas la bonne" };
        }
        query = {
          encryptionLastUpdateAt: organisation?.encryptionLastUpdateAt,
          encryptionEnabled: organisation?.encryptionEnabled,
          ...query,
        };
      }

      options.retries = 10;
      options.retryDelay = 2000;

      const url = getUrl(path, query);
      const response = await fetch(url, options);

      if (!response.ok && response.status === 401) {
        handleLogoutError?.();
        if (!['/user/logout', '/user/signin-token'].includes(path)) logout();
        return response;
      }

      try {
        const res = await response.json();
        if (!response.ok) handleApiError?.(res);
        if (res?.message && res.message === 'Veuillez mettre à jour votre application!') {
          if (handleNewVersion) return handleNewVersion?.(res.message);
        }
        if (!!res.data && Array.isArray(res.data)) {
          const decryptedData = [];
          for (const item of res.data) {
            const decryptedItem = await decryptDBItem(item, { debug });
            if (wrongKeyWarned) {
              return { ok: false, data: [] };
            }
            decryptedData.push(decryptedItem);
          }
          res.decryptedData = decryptedData;
          return res;
        }
        if (res.data) {
          res.decryptedData = await decryptDBItem(res.data, { debug });
          return res;
        }
        return res;
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
      handleError?.(errorExecuteApi, 'Désolé une erreur est survenue');
      throw errorExecuteApi;
    }
  };

  const decryptDBItem = async (item, { debug = false } = {}) => {
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
        handleError?.(errorDecryptParsing, 'Désolé une erreur est survenue lors du déchiffrement');
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
            orgEncryptionKeyCache,
            hashedOrgEncryptionKey,
          },
        });
        sendCaptureError++;
      }
      if (!!organisation.encryptedVerificationKey) {
        handleError?.(
          "Désolé, un élément n'a pas pu être déchiffré",
          "L'équipe technique a été prévenue, nous reviendrons vers vous dans les meilleurs délais."
        );
        return item;
      }
      if (!wrongKeyWarned) {
        wrongKeyWarned = true;
        handleWrongKey?.();
      }
      if (debug) handleError?.(errorDecrypt, 'ERROR DECRYPTING ITEM');
      // prevent false admin with bad key to be able to change the key
      blockEncrypt = enableEncrypt && errorDecrypt.message.includes('FAILURE');
    }
    return item;
  };

  const setOrgEncryptionKey = async (orgEncryptionKey, encryptedVerificationKey) => {
    const newHashedOrgEncryptionKey = await derivedMasterKey(orgEncryptionKey);
    if (!!encryptedVerificationKey) {
      const encryptionKeyIsValid = await checkEncryptedVerificationKey(encryptedVerificationKey, newHashedOrgEncryptionKey);
      if (!encryptionKeyIsValid) {
        handleWrongKey?.();
        return false;
      }
    }
    hashedOrgEncryptionKey = newHashedOrgEncryptionKey;
    enableEncrypt = true;
    orgEncryptionKeyCache = orgEncryptionKey; // for debug only
    sendCaptureError = 0;
    wrongKeyWarned = false;
    blockEncrypt = false;
    return newHashedOrgEncryptionKey;
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
          capture('error getting batch', { extra: { response } });
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
    setOrgEncryptionKey,
    setToken: (newToken) => (tokenCached = newToken),
    // token,
    get,
    reset,
    decryptDBItem,
    logout,
    post,
    put,
    delete: (args) => execute({ method: 'DELETE', ...args }), // delete cannot be a method
  };
};

export default useApiService;
