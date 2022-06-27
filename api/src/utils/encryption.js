const libsodium = require("libsodium-wrappers");
const { ENCRYPTION_TOKEN_SECRET } = require("../config");
const { capture } = require("../sentry");

/*

Encrypt

*/
const _encrypt_and_prepend_nonce = async (message_string_or_uint8array, key_uint8array) => {
  await libsodium.ready;
  const sodium = libsodium;

  let nonce_uint8array = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const crypto_secretbox_easy_uint8array = sodium.crypto_secretbox_easy(message_string_or_uint8array, nonce_uint8array, key_uint8array);
  const arrayBites = _appendBuffer(nonce_uint8array, crypto_secretbox_easy_uint8array);
  return sodium.to_base64(arrayBites, sodium.base64_variants.ORIGINAL);
};

const encryptDataAuthToken = (userId) => _encrypt_and_prepend_nonce(userId, ENCRYPTION_TOKEN_SECRET);

/*

Decrypt

*/

const derivedMasterKey = async (password) => {
  await libsodium.ready;
  const sodium = libsodium;

  const password_base64 = Buffer.from(password, "binary").toString("base64");

  let salt = Buffer.from("808182838485868788898a8b8c8d8e8f", "hex");
  const crypted = sodium.crypto_pwhash(32, password_base64, salt, 2, 65536 << 10, 2);

  // Uint8Array
  return crypted;
};

const _decrypt_after_extracting_nonce = async (nonce_and_ciphertext_b64, key_uint8array) => {
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

const verificationPassphrase = "Surprise !";

const checkEncryptedVerificationKey = async (encryptedVerificationKey, masterKey) => {
  const hashedMasterKey = await derivedMasterKey(masterKey);
  try {
    const decryptedVerificationKey_uint8array = await _decrypt_after_extracting_nonce(encryptedVerificationKey, hashedMasterKey);
    const decryptedVerificationKey = Buffer.from(new TextDecoder().decode(decryptedVerificationKey_uint8array), "base64").toString("binary");
    return decryptedVerificationKey === verificationPassphrase;
  } catch (e) {
    console.log(e.message);
    if (e.message === "wrong secret key for the given ciphertext") return false;
    capture(e);
  }
  return false;
};

module.exports = {
  checkEncryptedVerificationKey,
  encryptDataAuthToken,
};
