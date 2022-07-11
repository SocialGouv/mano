import URI from 'urijs';
import { HOST, SCHEME, VERSION } from '../config';
import { decrypt, derivedMasterKey, encrypt, generateEntityKey, checkEncryptedVerificationKey, encryptFile, decryptFile } from './encryption';
import { capture } from './sentry';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {
  getApiLevel,
  getBrand,
  getCarrier,
  getDevice,
  getDeviceId,
  getFreeDiskStorage,
  getHardware,
  getManufacturer,
  getMaxMemory,
  getModel,
  getProduct,
  getReadableVersion,
  getSystemName,
  getSystemVersion,
  getBuildId,
  getTotalDiskCapacity,
  getTotalMemory,
  getUserAgent,
  isTablet,
} from 'react-native-device-info';
import base64 from 'react-native-base64';
const RNFS = require('react-native-fs');
class ApiService {
  getUrl = (path, query = {}) => {
    return new URI().scheme(SCHEME).host(HOST).path(path).setSearch(query).toString();
  };

  getUserDebugInfos = async () => ({
    apilevel: await getApiLevel(), // 30
    brand: getBrand(), // "google"
    carrier: await getCarrier(), // "Android"
    device: await getDevice(), // "emulator_arm64"
    deviceid: getDeviceId(), // "goldfish_arm64"
    freediskstorage: await getFreeDiskStorage(), // 4580667392
    hardware: await getHardware(), // "ranchu"
    manufacturer: await getManufacturer(), // "Google"
    maxmemory: await getMaxMemory(), // 201326592
    model: getModel(), // "sdk_gphone_arm64"
    product: await getProduct(), // "sdk_gphone_arm64"
    readableversion: getReadableVersion(), // "2.15.0.3"
    systemname: getSystemName(), // "Android"
    systemversion: getSystemVersion(), // "11"
    buildid: await getBuildId(), // "RSR1.201216.001"
    totaldiskcapacity: await getTotalDiskCapacity(), // 6983450624
    totalmemory: await getTotalMemory(), // 2079838208
    useragent: await getUserAgent(), // "Mozilla/5.0 (Linux, Android 11, ..."
    tablet: isTablet(), // false
  });

  execute = async ({ method, path = '', body = null, query = {}, headers = {}, debug = false, skipEncryption = false, batch = null } = {}) => {
    try {
      if (this.token) headers.Authorization = `JWT ${this.token}`;
      const options = {
        method,
        headers: { ...headers, 'Content-Type': 'application/json', Accept: 'application/json', platform: this.platform, version: VERSION },
      };
      if (body) {
        if (!skipEncryption) {
          options.body = JSON.stringify(await this.encryptItem(body));
        } else {
          options.body = JSON.stringify(body);
        }
      }

      if (['PUT', 'POST', 'DELETE'].includes(method) && this.enableEncrypt) {
        if (this.blockEncrypt && !skipEncryption) {
          if (this.handleBlockEncrypt) this.handleBlockEncrypt();
          return { ok: false, error: "Vous ne pouvez pas modifier le contenu. La clé de chiffrement n'est pas la bonne" };
        }
        query = {
          encryptionLastUpdateAt: this.organisation?.encryptionLastUpdateAt,
          encryptionEnabled: this.organisation?.encryptionEnabled,
          migrationLastUpdateAt: this.organisation?.migrationLastUpdateAt,
          ...query,
        };
      }

      options.retries = 3;
      options.retryDelay = 1000;

      const url = this.getUrl(path, query);
      console.log({ url });
      const response = await this.fetch(url, options);

      if (!response.ok && response.status === 401) {
        if (this.logout) this.logout('401');
        if (this.handleLogoutError) this.handleLogoutError();
        return response;
      }

      try {
        const res = await response.json();
        if (!response.ok && this.handleApiError) this.handleApiError(res);
        if (res?.message && res.message === 'Veuillez mettre à jour votre application!') {
          if (this.handleNewVersion) {
            this.handleNewVersion(res.message);
            return res;
          }
        }
        if (!!res.data && Array.isArray(res.data)) {
          const decryptedData = [];
          for (const item of res.data) {
            const decryptedItem = await this.decryptDBItem(item, { debug });
            if (this.wrongKeyWarned) {
              return { ok: false, data: [] };
            }
            decryptedData.push(decryptedItem);
          }
          res.decryptedData = decryptedData;
          return res;
        }
        if (res.data) {
          res.decryptedData = await this.decryptDBItem(res.data, { debug });
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
      if (this.handleError) this.handleError(errorExecuteApi, 'Désolé une erreur est survenue');
      throw errorExecuteApi;
    }
  };

  post = (args) => this.execute({ method: 'POST', ...args });
  get = async (args) => {
    if (args.batch) {
      let hasMore = true;
      let page = 0;
      let limit = args.batch;
      let data = [];
      let decryptedData = [];
      while (hasMore) {
        let query = { ...args.query, limit, page };
        const response = await this.execute({ method: 'GET', ...args, query });
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
      return this.execute({ method: 'GET', ...args });
    }
  };
  put = (args) => this.execute({ method: 'PUT', ...args });
  delete = (args) => this.execute({ method: 'DELETE', ...args });

  setOrgEncryptionKey = async (orgEncryptionKey) => {
    this.hashedOrgEncryptionKey = await derivedMasterKey(orgEncryptionKey);
    const { encryptedVerificationKey } = this.organisation;
    if (!encryptedVerificationKey) {
      capture('encryptedVerificationKey not setup yet', { extra: { organisation: this.organisation } });
    } else {
      const encryptionKeyIsValid = await checkEncryptedVerificationKey(encryptedVerificationKey, this.hashedOrgEncryptionKey);
      if (!encryptionKeyIsValid) {
        this.handleWrongKey();
        return false;
      }
    }
    this.enableEncrypt = true;
    this.orgEncryptionKey = orgEncryptionKey;
    this.sendCaptureError = 0;
    this.wrongKeyWarned = false;
    this.blockEncrypt = false;
    return true;
  };

  encryptItem = async (item) => {
    if (!this.enableEncrypt) return item;
    if (item.decrypted) {
      if (!item.entityKey) item.entityKey = await generateEntityKey();
      const { encryptedContent, encryptedEntityKey } = await encrypt(JSON.stringify(item.decrypted), item.entityKey, this.hashedOrgEncryptionKey);

      item.encrypted = encryptedContent;
      item.encryptedEntityKey = encryptedEntityKey;
      delete item.decrypted;
      delete item.entityKey;
    }
    return item;
  };

  decryptDBItem = async (item, { debug = false } = {}) => {
    if (this.wrongKeyWarned) return item;
    if (!this.enableEncrypt) return item;
    if (!item.encrypted) return item;
    if (!item.encryptedEntityKey) return item;
    try {
      const { content, entityKey } = await decrypt(item.encrypted, item.encryptedEntityKey, this.hashedOrgEncryptionKey);

      delete item.encrypted;

      try {
        JSON.parse(content);
      } catch (errorDecryptParsing) {
        if (this.handleError) this.handleError(errorDecryptParsing, 'Désolé une erreur est survenue lors du déchiffrement');
        console.log('ERROR PARSING CONTENT', errorDecryptParsing, content);
      }

      const decryptedItem = {
        ...item,
        ...JSON.parse(content),
        entityKey,
      };
      return decryptedItem;
    } catch (errorDecrypt) {
      if (this.sendCaptureError < 5) {
        capture(`ERROR DECRYPTING ITEM : ${errorDecrypt}`, {
          extra: {
            message: 'ERROR DECRYPTING ITEM',
            item,
            orgEncryptionKey: this.orgEncryptionKey,
            hashedOrgEncryptionKey: this.hashedOrgEncryptionKey,
          },
        });
        this.sendCaptureError++;
      }
      if (this.organisation.encryptedVerificationKey) {
        if (this.handleError) {
          this.handleError(
            "Désolé, un élément n'a pas pu être déchiffré",
            "L'équipe technique a été prévenue, nous reviendrons vers vous dans les meilleurs délais."
          );
        }
        return item;
      }
      if (!this.wrongKeyWarned && this.handleWrongKey) {
        this.wrongKeyWarned = true;
        this.handleWrongKey();
      }
      if (this.handleError && debug) this.handleError(errorDecrypt, 'ERROR DECRYPTING ITEM');
      // prevent false admin with bad key to be able to change the key
      this.blockEncrypt = this.enableEncrypt && errorDecrypt.message.includes('FAILURE');
    }
    return item;
  };

  // Download a file from a path.
  download = async ({ path, encryptedEntityKey, document }) => {
    const url = this.getUrl(path);
    const response = await ReactNativeBlobUtil.config({
      fileCache: true,
    }).fetch('GET', url, { Authorization: `JWT ${this.token}`, 'Content-Type': 'application/json', platform: this.platform, version: VERSION });
    const res = await RNFS.readFile(response.path(), 'base64');
    const decrypted = await decryptFile(res, encryptedEntityKey, this.hashedOrgEncryptionKey);
    const newPath = RNFS.TemporaryDirectoryPath + '/' + document.file.originalname;
    await RNFS.writeFile(newPath, decrypted, 'base64');
    return { path: newPath, decrypted };
  };

  // Upload a file to a path.
  upload = async ({ file, path }) => {
    // Prepare file.
    const { encryptedEntityKey, encryptedFile } = await encryptFile(file.base64, this.hashedOrgEncryptionKey);

    // https://github.com/RonRadtke/react-native-blob-util#multipartform-data-example-post-form-data-with-file-and-data

    const url = this.getUrl(path);
    const response = await ReactNativeBlobUtil.fetch(
      'POST',
      url,
      {
        'Content-Type': 'multipart/form-data',
        Authorization: `JWT ${this.token}`,
        Accept: 'application/json',
        platform: this.platform,
        version: VERSION,
      },
      [
        // element with property `filename` will be transformed into `file` in form data
        { name: 'file', filename: file.fileName, mime: file.type, type: file.type, data: encryptedFile },
        // custom content type
        // { name: 'avatar-png', filename: 'avatar-png.png', type: 'image/png', data: binaryDataInBase64 },
        // // part file from storage
        // { name: 'avatar-foo', filename: 'avatar-foo.png', type: 'image/foo', data: ReactNativeBlobUtil.wrap(path_to_a_file) },
        // // elements without property `filename` will be sent as plain text
        // { name: 'name', data: 'user' },
        // {
        //   name: 'info',
        //   data: JSON.stringify({
        //     mail: 'example@example.com',
        //     tel: '12345678',
        //   }),
        // },
      ]
    );

    const json = await response.json();
    return { ...json, encryptedEntityKey };
  };
}

const API = new ApiService();
export default API;
