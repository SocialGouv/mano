import libsodium from 'libsodium-wrappers';

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

Master key

*/

const derivedMasterKey = async (password) => {
  await libsodium.ready;
  const sodium = libsodium;

  const password_base64 = window.btoa(password);

  let salt = Buffer.from('808182838485868788898a8b8c8d8e8f', 'hex');
  const crypted = sodium.crypto_pwhash(32, password_base64, salt, 2, 65536 << 10, 2);

  // Uint8Array
  return crypted;
};
/*

Decrypt

*/

const _decrypt_after_extracting_nonce = async (nonce_and_ciphertext_b64, key_uint8array) => {
  await libsodium.ready;
  const sodium = libsodium;

  const nonce_and_cypher_uint8array = sodium.from_base64(nonce_and_ciphertext_b64, sodium.base64_variants.ORIGINAL);

  if (nonce_and_cypher_uint8array.length < sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES) {
    throw new Error('Short message');
  }

  const nonce_uint8array = nonce_and_cypher_uint8array.slice(0, sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext_uint8array = nonce_and_cypher_uint8array.slice(sodium.crypto_secretbox_NONCEBYTES);
  return sodium.crypto_secretbox_open_easy(ciphertext_uint8array, nonce_uint8array, key_uint8array);
};

const _decrypt_after_extracting_nonce_uint8array = async (nonce_and_cypher_uint8array, key_uint8array) => {
  await libsodium.ready;
  const sodium = libsodium;

  if (nonce_and_cypher_uint8array.length < sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES) {
    throw new Error('Short message');
  }

  const nonce_uint8array = nonce_and_cypher_uint8array.slice(0, sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext_uint8array = nonce_and_cypher_uint8array.slice(sodium.crypto_secretbox_NONCEBYTES);
  return sodium.crypto_secretbox_open_easy(ciphertext_uint8array, nonce_uint8array, key_uint8array);
};

const decrypt = async (encryptedContent, encryptedEntityKey, masterKey) => {
  try {
    const entityKey_bytes_array = await _decrypt_after_extracting_nonce(encryptedEntityKey, masterKey);
    const content_uint8array = await _decrypt_after_extracting_nonce(encryptedContent, entityKey_bytes_array);
    const content = window.atob(new TextDecoder().decode(content_uint8array));

    return {
      content,
      entityKey: entityKey_bytes_array,
    };
  } catch (errorDecrypt) {
    if (errorDecrypt.message.includes('wrong secret key for the given ciphertext')) throw new Error('FAILURE');
    throw errorDecrypt;
  }
};

/*

Encrypt

*/
const generateEntityKey = async () => {
  await libsodium.ready;
  const sodium = libsodium;
  return sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
};

const _encrypt_and_prepend_nonce = async (message_string_or_uint8array, key_uint8array) => {
  await libsodium.ready;
  const sodium = libsodium;

  let nonce_uint8array = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const crypto_secretbox_easy_uint8array = sodium.crypto_secretbox_easy(message_string_or_uint8array, nonce_uint8array, key_uint8array);
  const arrayBites = _appendBuffer(nonce_uint8array, crypto_secretbox_easy_uint8array);
  return sodium.to_base64(arrayBites, sodium.base64_variants.ORIGINAL);
};

const _encrypt_and_prepend_nonce_uint8array = async (message_string_or_uint8array, key_uint8array) => {
  await libsodium.ready;
  const sodium = libsodium;

  let nonce_uint8array = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const crypto_secretbox_easy_uint8array = sodium.crypto_secretbox_easy(message_string_or_uint8array, nonce_uint8array, key_uint8array);
  const arrayBites = _appendBuffer(nonce_uint8array, crypto_secretbox_easy_uint8array);
  return arrayBites;
};

const encodeContent = (content) => {
  try {
    const purifiedContent = content
      .replace(/[\u007F-\uFFFF]/g, (chr) => '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).substr(-4))
      .replace(/\//g, '\\/');
    const base64PurifiedContent = window.btoa(purifiedContent);
    return base64PurifiedContent;
  } catch (errorPurifying) {
    console.log('error purifying content', errorPurifying);
    throw errorPurifying;
  }
};

const encrypt = async (content, entityKey, masterKey) => {
  const encryptedContent = await _encrypt_and_prepend_nonce(encodeContent(content), entityKey);
  const encryptedEntityKey = await _encrypt_and_prepend_nonce(entityKey, masterKey);

  return {
    encryptedContent: encryptedContent,
    encryptedEntityKey: encryptedEntityKey,
  };
};

// Encrypt a file with the master key + entity key, and return the encrypted file and the entity key
const encryptFile = async (file, masterKey) => {
  const fileContent = new Uint8Array(await file.arrayBuffer());
  const entityKey = await generateEntityKey();
  const encryptedContent = await _encrypt_and_prepend_nonce_uint8array(fileContent, entityKey);
  // const encryptedEntityKey = await _encrypt_and_prepend_nonce(file.name, masterKey);
  // const encryptedFile = new File([window.atob(encryptedContent)], file.name, { type: file.type });
  const encryptedEntityKey = await _encrypt_and_prepend_nonce(entityKey, masterKey);
  const encryptedFile = new File([encryptedContent], file.name, { type: file.type });
  return {
    encryptedEntityKey,
    encryptedFile,
  };
};

const decryptFile = async (file, encryptedEntityKey, masterKey) => {
  console.log('1 ---', file, encryptedEntityKey, masterKey);
  const fileContent = new Uint8Array(await file.arrayBuffer());
  console.log('2 ---', fileContent);
  const entityKey_bytes_array = await _decrypt_after_extracting_nonce(encryptedEntityKey, masterKey);
  console.log('3 ---', entityKey_bytes_array);
  const content_uint8array = await _decrypt_after_extracting_nonce_uint8array(fileContent, entityKey_bytes_array);
  console.log('4 ---', content_uint8array);
  const decryptedFile = new File([content_uint8array], file.name, { type: file.type });
  console.log('5 ---', decryptedFile);
  return decryptedFile;
};

const verificationPassphrase = 'Surprise !';
const encryptVerificationKey = async (masterKey) => {
  const encryptedVerificationKey = await _encrypt_and_prepend_nonce(encodeContent(verificationPassphrase), masterKey);

  return encryptedVerificationKey;
};

const checkEncryptedVerificationKey = async (encryptedVerificationKey, masterKey) => {
  try {
    const decryptedVerificationKey_uint8array = await _decrypt_after_extracting_nonce(encryptedVerificationKey, masterKey);
    const decryptedVerificationKey = window.atob(new TextDecoder().decode(decryptedVerificationKey_uint8array));

    return decryptedVerificationKey === verificationPassphrase;
  } catch (e) {
    console.log('error checkEncryptedVerificationKey', e);
  }
  return false;
};

export { encryptFile, decryptFile, derivedMasterKey, generateEntityKey, encrypt, decrypt, encryptVerificationKey, checkEncryptedVerificationKey };
