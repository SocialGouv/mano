/* eslint-disable no-bitwise */
import 'fast-text-encoding'; // for TextEncoder
const Buffer = require('buffer').Buffer;
import sodium from 'react-native-sodium';
import rnBase64 from 'react-native-base64';
var base64js = require('base64-js');
// TODO: consolidate the base 64 in both dashboard / app: it looks inconsistent right now

/*

Utils

*/

const _appendBuffer = function (buffer1, buffer2) {
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return new Uint8Array(tmp.buffer);
};

/*

Get master key

*/
// (password: string) -> masterKey: b64
const derivedMasterKey = async (password) => {
  // first b64 encode to get rid of special characters (operation done also in dashboard, to have consistent encoding)
  const noSpecialChars = rnBase64.encode(password);
  // second b64 because the RN sodium lib accepts base64 only, whereas the dashboard is different
  const b64password = rnBase64.encode(noSpecialChars);
  const b64salt = Buffer.from('808182838485868788898a8b8c8d8e8f', 'hex').toString('base64');
  const b64 = await sodium.crypto_pwhash(32, b64password, b64salt, 2, 65536 << 10, 2);

  return b64;
};

/*

Decrypt

*/

// (nonce_and_ciphertext_b64: encrypted b64 string)
const _decrypt_after_extracting_nonce = async (nonce_and_ciphertext_b64, key_b64) => {
  const nonce_and_ciphertext_uint8array = base64js.toByteArray(nonce_and_ciphertext_b64);

  if (nonce_and_ciphertext_uint8array.length < sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES) {
    throw new Error('NONONO Not good length ');
  }

  const nonce_uint8array = nonce_and_ciphertext_uint8array.slice(0, sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext_uint8array = nonce_and_ciphertext_uint8array.slice(sodium.crypto_secretbox_NONCEBYTES);

  const nonce_b64 = base64js.fromByteArray(nonce_uint8array);
  const ciphertext_b64 = base64js.fromByteArray(ciphertext_uint8array);
  // ciphertext: b64 string
  // nonce: b64 string
  // key: b64 string
  const decrypted = await sodium.crypto_secretbox_open_easy(ciphertext_b64, nonce_b64, key_b64);
  return decrypted;
};
const _decrypt_after_extracting_nonce_uint8array = async (nonce_and_ciphertext_uint8array, key_b64) => {
  if (nonce_and_ciphertext_uint8array.length < sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES) {
    throw new Error('NONONO Not good length ');
  }

  const nonce_uint8array = nonce_and_ciphertext_uint8array.slice(0, sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext_uint8array = nonce_and_ciphertext_uint8array.slice(sodium.crypto_secretbox_NONCEBYTES);

  const nonce_b64 = base64js.fromByteArray(nonce_uint8array);
  const ciphertext_b64 = base64js.fromByteArray(ciphertext_uint8array);
  // ciphertext: b64 string
  // nonce: b64 string
  // key: b64 string
  const decrypted = await sodium.crypto_secretbox_open_easy(ciphertext_b64, nonce_b64, key_b64);
  return decrypted;
};

const decrypt = async (encryptedContent, encryptedEntityKey, masterKey, debug) => {
  const entityKey = await _decrypt_after_extracting_nonce(encryptedEntityKey, masterKey);

  const decrypted = await _decrypt_after_extracting_nonce(encryptedContent, entityKey);
  const content = rnBase64.decode(rnBase64.decode(decrypted));

  return {
    content,
    entityKey,
  };
};

/*

Encrypt

*/

const generateEntityKey = async () => {
  return sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES); // base64
};

const _encrypt_and_prepend_nonce = async (message_base64, key_base64) => {
  const nonce_base64 = await sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const crypted_base64 = await sodium.crypto_secretbox_easy(message_base64, nonce_base64, key_base64);
  const nonce_uint8array = base64js.toByteArray(nonce_base64);
  const crypted_uint8array = base64js.toByteArray(crypted_base64);
  const crypted_and_append_uint8array = _appendBuffer(nonce_uint8array, crypted_uint8array);
  return base64js.fromByteArray(crypted_and_append_uint8array);
};

const _encrypt_and_prepend_nonce_uint8array = async (message_base64, key_base64) => {
  const nonce_base64 = await sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const crypted_base64 = await sodium.crypto_secretbox_easy(message_base64, nonce_base64, key_base64);
  const nonce_uint8array = base64js.toByteArray(nonce_base64);
  const crypted_uint8array = base64js.toByteArray(crypted_base64);
  const crypted_and_append_uint8array = _appendBuffer(nonce_uint8array, crypted_uint8array);
  return crypted_and_append_uint8array;
};

const encodeContent = (content) => {
  try {
    const purifiedContent = content
      .replace(/[\u007F-\uFFFF]/g, (chr) => '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).substr(-4))
      .replace(/\//g, '\\/');
    const base64PurifiedContent = rnBase64.encode(purifiedContent);
    return base64PurifiedContent;
  } catch (e) {
    console.log('error purifying content', e);
    throw e;
  }
};

const encrypt = async (content_stringified, entityKey_base64, masterKey_base64) => {
  const encryptedContent = await _encrypt_and_prepend_nonce(rnBase64.encode(encodeContent(content_stringified)), entityKey_base64);
  const encryptedEntityKey = await _encrypt_and_prepend_nonce(entityKey_base64, masterKey_base64);

  return {
    encryptedContent: encryptedContent,
    encryptedEntityKey: encryptedEntityKey,
  };
};

// Encrypt a file with the master key + entity key, and return the encrypted file and the entity key
// (file: File, masterKey: Uint8Array) => Promise<{encryptedFile: File, encryptedEntityKey: Uint8Array}>
const encryptFile = async (file, masterKey) => {
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
const decryptFile = async (file, encryptedEntityKey, masterKey) => {
  const fileContent = new Uint8Array(await file.arrayBuffer());
  const entityKey_bytes_array = await _decrypt_after_extracting_nonce(encryptedEntityKey, masterKey);
  const content_uint8array = await _decrypt_after_extracting_nonce_uint8array(fileContent, entityKey_bytes_array);
  const decryptedFile = new File([content_uint8array], file.name, { type: file.type });
  return decryptedFile;
};

const verificationPassphrase = 'Surprise !';
const encryptVerificationKey = async (masterKey_base64) => {
  const encryptedVerificationKey = await _encrypt_and_prepend_nonce(rnBase64.encode(encodeContent(verificationPassphrase)), masterKey_base64);

  return encryptedVerificationKey;
};

const checkEncryptedVerificationKey = async (encryptedVerificationKey, masterKey) => {
  try {
    const decrypted = await _decrypt_after_extracting_nonce(encryptedVerificationKey, masterKey);
    const decryptedVerificationKey = rnBase64.decode(rnBase64.decode(decrypted));

    return decryptedVerificationKey === verificationPassphrase;
  } catch (e) {
    console.log('error checkEncryptedVerificationKey', e);
  }
  return false;
};

export { derivedMasterKey, generateEntityKey, encrypt, decrypt, encryptVerificationKey, checkEncryptedVerificationKey, encryptFile, decryptFile };
