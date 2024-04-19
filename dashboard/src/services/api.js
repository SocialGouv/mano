import { atom } from "recoil";
import { getRecoil, setRecoil } from "recoil-nexus";
import URI from "urijs";
import { toast } from "react-toastify";
import fetchRetry from "fetch-retry";
import packageInfo from "../../package.json";
import { HOST, SCHEME } from "../config";
import { organisationState } from "../recoil/auth";
import { decrypt, derivedMasterKey, encrypt, generateEntityKey, checkEncryptedVerificationKey, encryptFile, decryptFile } from "./encryption";
import { AppSentry, capture } from "./sentry";
import { deploymentCommitState, deploymentDateState } from "../recoil/version";

const fetchWithFetchRetry = fetchRetry(fetch);

const getUrl = (path, query = {}) => {
  return new URI().scheme(SCHEME).host(HOST).path(path).query(query).toString();
};

/* encryption */
let hashedOrgEncryptionKey = null;
let enableEncrypt = false;

/* auth */
export const authTokenState = atom({ key: "authTokenState", default: null });

/* methods */
export const setOrgEncryptionKey = async (orgEncryptionKey, { encryptedVerificationKey = null, needDerivation = true } = {}) => {
  const newHashedOrgEncryptionKey = needDerivation ? await derivedMasterKey(orgEncryptionKey) : orgEncryptionKey;
  if (encryptedVerificationKey) {
    const encryptionKeyIsValid = await checkEncryptedVerificationKey(encryptedVerificationKey, newHashedOrgEncryptionKey);
    if (!encryptionKeyIsValid) {
      toast.error(
        "La clé de chiffrement ne semble pas être correcte, veuillez réessayer ou demander à un membre de votre organisation de vous aider (les équipes ne mano ne la connaissent pas)"
      );
      return false;
    }
  }
  hashedOrgEncryptionKey = newHashedOrgEncryptionKey;
  enableEncrypt = true;
  return newHashedOrgEncryptionKey;
};

export function getHashedOrgEncryptionKey() {
  return hashedOrgEncryptionKey;
}

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
      capture("error decrypting item after encrypting", { extra: { e, item: item._id } });
    }

    item.encrypted = encryptedContent;
    item.encryptedEntityKey = encryptedEntityKey;
    delete item.decrypted;
    delete item.entityKey;
  }
  return item;
};

export async function decryptAndEncryptItem(item, oldHashedOrgEncryptionKey, newHashedOrgEncryptionKey, updateContentCallback = null) {
  // Some old (mostly deleted) items don't have encrypted content. We ignore them forever to avoid crash.
  if (!item.encrypted) return null;
  // Decrypt items
  let { content, entityKey } = await decrypt(item.encrypted, item.encryptedEntityKey, oldHashedOrgEncryptionKey);
  // If we need to alterate the content, we do it here.
  if (updateContentCallback) {
    // No try/catch here: if something is not decryptable, it should crash and stop the process.
    content = JSON.stringify(await updateContentCallback(JSON.parse(content), item));
  }
  const { encryptedContent, encryptedEntityKey } = await encrypt(content, entityKey, newHashedOrgEncryptionKey);
  item.encrypted = encryptedContent;
  item.encryptedEntityKey = encryptedEntityKey;
  return item;
}

const decryptDBItem = async (item, { path, encryptedVerificationKey = null, decryptDeleted = false } = {}) => {
  if (!enableEncrypt) return item;
  if (!item.encrypted) return item;
  if (item.deletedAt && !decryptDeleted) return item;
  if (!item.encryptedEntityKey) return item;
  try {
    const { content, entityKey } = await decrypt(item.encrypted, item.encryptedEntityKey, hashedOrgEncryptionKey);

    delete item.encrypted;

    try {
      JSON.parse(content);
    } catch (errorDecryptParsing) {
      toast.error("Désolé une erreur est survenue lors du déchiffrement " + errorDecryptParsing);
      capture("ERROR PARSING CONTENT", { extra: { errorDecryptParsing, content } });
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
        message: "ERROR DECRYPTING ITEM",
        item,
        path,
      },
    });
    if (encryptedVerificationKey) {
      toast.error(
        "Désolé, un élément n'a pas pu être déchiffré. L'équipe technique a été prévenue, nous reviendrons vers vous dans les meilleurs délais."
      );
      return item;
    }
  }
  return item;
};

export const recoilResetKeyState = atom({ key: "recoilResetKeyState", default: 0 });

const reset = () => {
  hashedOrgEncryptionKey = null;
  enableEncrypt = false;
  setRecoil(authTokenState, null);
  setRecoil(recoilResetKeyState, Date.now());
  AppSentry.setUser({});
  AppSentry.setTag("organisationId", "");
};

const logout = async (reloadAfterLogout = true) => {
  await post({ path: "/user/logout" });
  reset();
  if (reloadAfterLogout) window.location.reload();
};

// Upload a file to a path.
const upload = async ({ file, path }, forceKey) => {
  // Prepare file.
  const tokenCached = getRecoil(authTokenState);
  const { encryptedEntityKey, encryptedFile } = await encryptFile(file, forceKey || hashedOrgEncryptionKey);
  const formData = new FormData();
  formData.append("file", encryptedFile);

  const options = {
    method: "POST",
    mode: "cors",
    credentials: "include",
    body: formData,
    headers: { Authorization: `JWT ${tokenCached}`, Accept: "application/json", platform: "dashboard", version: packageInfo.version },
  };
  const url = getUrl(path);
  const response = await fetch(url, options);
  const json = await response.json();
  return { ...json, encryptedEntityKey };
};

// Download a file from a path.
const download = async ({ path, encryptedEntityKey }, forceKey) => {
  const tokenCached = getRecoil(authTokenState);
  const options = {
    method: "GET",
    mode: "cors",
    credentials: "include",
    headers: { Authorization: `JWT ${tokenCached}`, "Content-Type": "application/json", platform: "dashboard", version: packageInfo.version },
  };
  const url = getUrl(path);
  const response = await fetch(url, options);
  const blob = await response.blob();
  const decrypted = await decryptFile(blob, encryptedEntityKey, forceKey || hashedOrgEncryptionKey);
  return decrypted;
};

const deleteFile = async ({ path }) => {
  const tokenCached = getRecoil(authTokenState);
  const options = {
    method: "DELETE",
    mode: "cors",
    credentials: "include",
    headers: { Authorization: `JWT ${tokenCached}`, "Content-Type": "application/json", platform: "dashboard", version: packageInfo.version },
  };
  const url = getUrl(path);
  const response = await fetch(url, options);
  return response.json();
};

const execute = async ({
  method,
  path = "",
  body = null,
  query = {},
  headers = {},
  forceMigrationLastUpdate = null,
  skipDecrypt = false,
  decryptDeleted = false,
} = {}) => {
  const organisation = getRecoil(organisationState) || {};
  const tokenCached = getRecoil(authTokenState);
  const { encryptionLastUpdateAt, encryptionEnabled, encryptedVerificationKey, migrationLastUpdateAt } = organisation;
  try {
    // Force logout when one user has been logged in multiple tabs to different organisations.
    if (
      path !== "/user/logout" &&
      organisation._id &&
      window.localStorage.getItem("mano-organisationId") &&
      organisation._id !== window.localStorage.getItem("mano-organisationId")
    ) {
      toast.error(
        "Veuillez vous reconnecter. Il semble que des connexions à plusieurs organisations soient actives dans un même navigateur (par exemple dans un autre onglet). Cela peut poser des problèmes de cache.",
        { autoClose: 8000 }
      );
      logout();
    }
    if (tokenCached) headers.Authorization = `JWT ${tokenCached}`;
    const options = {
      method,
      mode: "cors",
      credentials: "include",
      headers: { ...headers, "Content-Type": "application/json", Accept: "application/json", platform: "dashboard", version: packageInfo.version },
    };

    if (body) {
      options.body = JSON.stringify(await encryptItem(body));
    }

    if (["PUT", "POST", "DELETE"].includes(method) && enableEncrypt) {
      query = {
        encryptionLastUpdateAt,
        encryptionEnabled,
        migrationLastUpdateAt: forceMigrationLastUpdate || migrationLastUpdateAt,
        ...query,
      };
    }

    const url = getUrl(path, query);
    const response =
      method === "GET"
        ? await fetchWithFetchRetry(url, {
            ...options,
            retries: 10,
            retryDelay: 2000,
          })
        : await fetch(url, options);

    if (response.headers.has("x-api-deployment-commit")) {
      setRecoil(deploymentCommitState, response.headers.get("x-api-deployment-commit"));
      if (!window.localStorage.getItem("deploymentCommit")) {
        window.localStorage.setItem("deploymentCommit", response.headers.get("x-api-deployment-commit"));
      }
    }
    if (response.headers.has("x-api-deployment-date")) {
      setRecoil(deploymentDateState, response.headers.get("x-api-deployment-date"));
      if (!window.localStorage.getItem("deploymentDate")) {
        window.localStorage.setItem("deploymentDate", response.headers.get("x-api-deployment-date"));
      }
    }

    if (!response.ok && response.status === 401) {
      if (!["/user/logout", "/user/signin-token"].includes(path)) logout();
      return response;
    }

    try {
      const res = await response.json();
      if (!response.ok) {
        if (res?.error?.message) {
          toast?.error(res?.error?.message, { autoClose: import.meta.env.VITE_TEST_PLAYWRIGHT !== "true" });
        } else if (res?.error) {
          toast?.error(res?.error, { autoClose: import.meta.env.VITE_TEST_PLAYWRIGHT !== "true" });
        } else if (res?.code) {
          toast?.error(res?.code, { autoClose: import.meta.env.VITE_TEST_PLAYWRIGHT !== "true" });
        } else {
          capture("api error unhandled", { extra: { res, path, query } });
        }
      }
      if (skipDecrypt) {
        return res;
      } else if (decryptDeleted) {
        res.decryptedData = {};
        for (const [key, value] of Object.entries(res.data)) {
          const decryptedEntries = await Promise.all(value.map((item) => decryptDBItem(item, { path, encryptedVerificationKey, decryptDeleted })));
          res.decryptedData[key] = decryptedEntries;
        }
        return res;
      } else if (!!res.data && Array.isArray(res.data)) {
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
      capture(errorFromJson, { extra: { message: "error parsing response", response, path, query } });
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
    if (typeof errorExecuteApi === "string") {
      toast.error(errorExecuteApi, { autoClose: import.meta.env.VITE_TEST_PLAYWRIGHT !== "true" });
    } else if (errorExecuteApi?.message) {
      toast.error(errorExecuteApi.message, { autoClose: import.meta.env.VITE_TEST_PLAYWRIGHT !== "true" });
    } else {
      toast.error("Désolé, une erreur est survenue", { autoClose: import.meta.env.VITE_TEST_PLAYWRIGHT !== "true" });
    }

    throw errorExecuteApi;
  }
};

const get = (args) => execute({ method: "GET", ...args });
const post = (args) => execute({ method: "POST", ...args });
const put = (args) => execute({ method: "PUT", ...args });
const executeDelete = (args) => execute({ method: "DELETE", ...args });

const API = {
  get,
  post,
  put,
  delete: executeDelete,
  download,
  deleteFile,
  upload,
  logout,
};

export default API;
