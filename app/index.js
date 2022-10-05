import 'react-native-gesture-handler';
import { AppRegistry, LogBox } from 'react-native';
import Navigators from './src/Navigators';
import './src/services/polyfills';
import { name as appName, version } from './app.json';
import './src/services/api-interface-with-app';
import './src/services/encryption';

import * as Sentry from '@sentry/react-native';
import { SENTRY_XXX } from './src/config';

if (!__DEV__) {
  Sentry.init({
    dsn: SENTRY_XXX,
    environment: 'app',
    release: version,
    ignoreErrors: [
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
      // ???
      'withrealtime/messaging',
      // This error seems to happen only in firefox and to be ignorable.
      // The "fetch" failed because user has navigated.
      // Since other browsers don't have this problem, we don't care about it,
      // it may be a false positive.
      'AbortError: The operation was aborted',
    ],
  });
}

LogBox.ignoreAllLogs();
AppRegistry.registerComponent(appName, () => {
  return Navigators;
});
