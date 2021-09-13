import 'react-native-gesture-handler';
import { AppRegistry, LogBox } from 'react-native';
import Navigators from './src/Navigators';
import './src/services/polyfills';
import { name as appName } from './app.json';
import './src/services/api-interface-with-app';
import './src/services/encryption';

import * as Sentry from '@sentry/react-native';
import { SENTRY_URL } from './src/config';

if (!__DEV__) {
  Sentry.init({
    dsn: SENTRY_URL,
    environment: 'app',
  });
}

LogBox.ignoreAllLogs();
AppRegistry.registerComponent(appName, () => {
  return Navigators;
});
