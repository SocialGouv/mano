import libsodium from "libsodium-wrappers";
import { Buffer } from "buffer";
import { toast } from "react-toastify";
import { capture } from "./sentry";

let hashedOrgEncryptionKey = null;
let enableEncrypt = false;

export function getHashedOrgEncryptionKey() {
  return hashedOrgEncryptionKey;
}
export const setOrgEncryptionKey = async (orgEncryptionKey, { needDerivation = true } = {}) => {
  const newHashedOrgEncryptionKey = needDerivation ? await derivedMasterKey(orgEncryptionKey) : orgEncryptionKey;
  hashedOrgEncryptionKey = newHashedOrgEncryptionKey;
  enableEncrypt = true;
  return newHashedOrgEncryptionKey;
};

export const resetOrgEncryptionKey = () => {
  hashedOrgEncryptionKey = null;
};

export function getEnableEncrypt() {
  return enableEncrypt;
}
export function setEnableEncrypt(value) {
  enableEncrypt = value;
}

// TODO: consolidate the base 64 in both dashboard / app: it looks inconsistent right now

/*

Utils

*/
const _appendBuffer = function (buffer1, buffer2) {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return new Uint8Array(tmp.buffer);
};
/*

Master key

*/

export const derivedMasterKey = async (password) => {
  await libsodium.ready;
  const sodium = libsodium;

  const password_base64 = window.btoa(password);

  let salt = Buffer.from("808182838485868788898a8b8c8d8e8f", "hex");
  const crypted = sodium.crypto_pwhash(32, password_base64, salt, 2, 65536 << 10, 2);

  // Uint8Array
  return crypted;
};
/*

Decrypt

*/

export const _decrypt_after_extracting_nonce = async (nonce_and_ciphertext_b64, key_uint8array) => {
  await libsodium.ready;
  const sodium = libsodium;

  const nonce_and_cypher_uint8array = sodium.from_base64(nonce_and_ciphertext_b64, sodium.base64_variants.ORIGINAL);

  if (nonce_and_cypher_uint8array.length < sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES) {
    throw new Error("Short message");
  }

  const nonce_uint8array = nonce_and_cypher_uint8array.slice(0, sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext_uint8array = nonce_and_cypher_uint8array.slice(sodium.crypto_secretbox_NONCEBYTES);
  return sodium.crypto_secretbox_open_easy(ciphertext_uint8array, nonce_uint8array, key_uint8array);
};

export const _decrypt_after_extracting_nonce_uint8array = async (nonce_and_cypher_uint8array, key_uint8array) => {
  await libsodium.ready;
  const sodium = libsodium;

  if (nonce_and_cypher_uint8array.length < sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES) {
    throw new Error("Short message");
  }

  const nonce_uint8array = nonce_and_cypher_uint8array.slice(0, sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext_uint8array = nonce_and_cypher_uint8array.slice(sodium.crypto_secretbox_NONCEBYTES);
  return sodium.crypto_secretbox_open_easy(ciphertext_uint8array, nonce_uint8array, key_uint8array);
};

export const decrypt = async (encryptedContent, encryptedEntityKey, masterKey) => {
  const entityKey_bytes_array = await _decrypt_after_extracting_nonce(encryptedEntityKey, masterKey);
  const content_uint8array = await _decrypt_after_extracting_nonce(encryptedContent, entityKey_bytes_array);
  const content = window.atob(new TextDecoder().decode(content_uint8array));

  return {
    content,
    entityKey: entityKey_bytes_array,
  };
};

/*

Encrypt

*/
export const generateEntityKey = async () => {
  await libsodium.ready;
  const sodium = libsodium;
  return sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
};

export const _encrypt_and_prepend_nonce = async (message_string_or_uint8array, key_uint8array) => {
  await libsodium.ready;
  const sodium = libsodium;

  let nonce_uint8array = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const crypto_secretbox_easy_uint8array = sodium.crypto_secretbox_easy(message_string_or_uint8array, nonce_uint8array, key_uint8array);
  const arrayBites = _appendBuffer(nonce_uint8array, crypto_secretbox_easy_uint8array);
  return sodium.to_base64(arrayBites, sodium.base64_variants.ORIGINAL);
};

export const _encrypt_and_prepend_nonce_uint8array = async (message_string_or_uint8array, key_uint8array) => {
  await libsodium.ready;
  const sodium = libsodium;

  let nonce_uint8array = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const crypto_secretbox_easy_uint8array = sodium.crypto_secretbox_easy(message_string_or_uint8array, nonce_uint8array, key_uint8array);
  const arrayBites = _appendBuffer(nonce_uint8array, crypto_secretbox_easy_uint8array);
  return arrayBites;
};

export const encodeContent = (content) => {
  try {
    const purifiedContent = content
      // https://stackoverflow.com/a/31652607/5225096
      .replace(/[\u007F-\uFFFF]/g, (chr) => "\\u" + ("0000" + chr.charCodeAt(0).toString(16)).substr(-4))
      .replace(/\//g, "\\/");
    const base64PurifiedContent = window.btoa(purifiedContent);
    return base64PurifiedContent;
  } catch (errorPurifying) {
    console.log("error purifying content", errorPurifying);
    throw errorPurifying;
  }
};

export const encrypt = async (content, entityKey, masterKey) => {
  const encryptedContent = await _encrypt_and_prepend_nonce(encodeContent(content), entityKey);
  const encryptedEntityKey = await _encrypt_and_prepend_nonce(entityKey, masterKey);

  return {
    encryptedContent: encryptedContent,
    encryptedEntityKey: encryptedEntityKey,
  };
};

// Encrypt a file with the master key + entity key, and return the encrypted file and the entity key
// (file: File, masterKey: Uint8Array) => Promise<{encryptedFile: File, encryptedEntityKey: Uint8Array}>
export const encryptFile = async (file, masterKey) => {
  const fileContent = new Uint8Array(await file.arrayBuffer());
  const entityKey = await generateEntityKey();
  const encryptedContent = await _encrypt_and_prepend_nonce_uint8array(fileContent, entityKey);
  const encryptedEntityKey = await _encrypt_and_prepend_nonce(entityKey, masterKey);
  const encryptedFile = new File([encryptedContent], file.name, { type: file.type });
  return {
    encryptedEntityKey,
    encryptedFile,
  };
};

// Decrypt a file with the master key + entity key, and return the decrypted file
// (file: File, masterKey: Uint8Array, entityKey: Uint8Array) => Promise<File>
export const decryptFile = async (file, encryptedEntityKey, masterKey) => {
  const fileContent = new Uint8Array(await file.arrayBuffer());
  const entityKey_bytes_array = await _decrypt_after_extracting_nonce(encryptedEntityKey, masterKey);
  const content_uint8array = await _decrypt_after_extracting_nonce_uint8array(fileContent, entityKey_bytes_array);
  const decryptedFile = new File([content_uint8array], file.name, { type: file.type });
  return decryptedFile;
};

const verificationPassphrase = "Surprise !";
export const encryptVerificationKey = async (masterKey) => {
  const encryptedVerificationKey = await _encrypt_and_prepend_nonce(encodeContent(verificationPassphrase), masterKey);

  return encryptedVerificationKey;
};

export const checkEncryptedVerificationKey = async (encryptedVerificationKey, masterKey) => {
  try {
    const decryptedVerificationKey_uint8array = await _decrypt_after_extracting_nonce(encryptedVerificationKey, masterKey);
    const decryptedVerificationKey = window.atob(new TextDecoder().decode(decryptedVerificationKey_uint8array));

    return decryptedVerificationKey === verificationPassphrase;
  } catch (e) {
    console.log("error checkEncryptedVerificationKey", e);
  }
  return false;
};

export const encryptItem = async (item) => {
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

export const decryptItem = async (item, { decryptDeleted = false } = {}) => {
  if (!getEnableEncrypt()) return item;
  if (!item.encrypted) return item;
  if (item.deletedAt && !decryptDeleted) return item;
  if (!item.encryptedEntityKey) return item;

  let decryptedItem = {};
  try {
    decryptedItem = await decrypt(item.encrypted, item.encryptedEntityKey, getHashedOrgEncryptionKey());
  } catch (errorDecrypt) {
    toast.error("Un élément n'a pas pu être déchiffré. L'équipe technique a été prévenue, nous reviendrons vers vous dans les meilleurs délais.");
    capture(`ERROR DECRYPTING ITEM : ${errorDecrypt}`, {
      extra: { message: "ERROR DECRYPTING ITEM", item },
    });
    return item;
  }

  const { content, entityKey } = decryptedItem;
  delete item.encrypted;
  let decryptedContent = {};

  try {
    decryptedContent = JSON.parse(content);
  } catch (errorDecryptParsing) {
    toast.error("Une erreur est survenue lors de la récupération des données déchiffrées: " + errorDecryptParsing);
    capture("ERROR PARSING CONTENT", { extra: { errorDecryptParsing, content } });
    return item;
  }
  return {
    ...item,
    ...decryptedContent,
    entityKey,
  };
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
