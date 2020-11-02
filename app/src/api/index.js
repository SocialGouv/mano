import NetInfo from '@react-native-community/netinfo';
import { getUserToken } from '../services/token';
import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

const addParamsToUrl = (url, query) =>
  Object.keys(query)
    .filter((param) => query[param] && Boolean(query[param]))
    .map((param) => `${param}=${encodeURIComponent(query[param])}`)
    .reduce((computedUrl, param, index) => {
      if (index === 0) return `${computedUrl}${param}`;
      return `${computedUrl}&${param}`;
    }, `${url}${url.match(/\?./) ? '&' : '?'}`);

class ApiService {
  baseUrl = null;
  setBaseUrl = async () => {
    if (!__DEV__) {
      this.baseUrl = 'https://selego-api.azurewebsites.net';
      return;
    }
    if (Platform.OS === 'android') {
      this.baseUrl = 'http://192.168.68.100:8082'; // need to update the computer ip manually
      return;
    }
    await new Promise.resolve(
      NetInfo.fetch().then((state) => {
        this.baseUrl = `http://${state.details.ipAddress}:8082`;
      })
    );
    // this.baseUrl = 'https://selego-api.azurewebsites.net';
  };

  noConnectionError = 'Pas de connection à internet';
  execute = async ({
    path = '',
    query = {},
    method = 'GET',
    body = null,
    headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    errorMessage = 'ne peut pas fetch le backend',
    from,
  } = {}) => {
    try {
      if (!this.baseUrl) await this.setBaseUrl();
      let url = this.baseUrl + path;
      if (query && Object.keys(query).length) {
        url = addParamsToUrl(url, query);
      }
      const token = await getUserToken();
      if (token) headers.Authorization = `JWT ${token}`;
      const options = {
        method,
        headers: { ...headers },
      };
      if (body) options.body = JSON.stringify(body);
      const response = await fetch(url, options);

      try {
        return await response.json();
      } catch (e) {
        const textRexponse = response.clone();
        return { ok: false, error: await textRexponse.text() };
      }
    } catch (e) {
      console.log('fetch back-end', e);
      Sentry.captureException(e);
      throw Error(e.toString ? e.toString() : errorMessage);
    }
  };

  post = (args) => this.execute({ method: 'POST', ...args });
  get = (args) => this.execute({ method: 'GET', ...args });
  put = (args) => this.execute({ method: 'PUT', ...args });
  delete = (args) => this.execute({ method: 'DELETE', ...args });
}

const API = new ApiService();

export default API;
