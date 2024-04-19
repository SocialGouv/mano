import 'react-native-gesture-handler';
import { AppRegistry, LogBox } from 'react-native';
import Navigators from './src/Navigators';
import './src/services/polyfills';
import { name as appName, version } from './app.json';
import './src/services/api-interface-with-app';
import './src/services/encryption';
import relativeTime from 'dayjs/plugin/relativeTime';
import isBetween from 'dayjs/plugin/isBetween';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');
dayjs.locale('fr');
dayjs.extend(relativeTime);
dayjs.extend(isBetween);

import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://1bab2dc91a5ed9ddde3e4273fe5438a5@o4506615228596224.ingest.sentry.io/4506829687554048',
  environment: 'app',
  // tracesSampleRate: 1.0,
  // release: version,
  // ignoreErrors: [
  //   'Network request failed',
  //   'Failed to fetch',
  //   'NetworkError',
  //   // ???
  //   'withrealtime/messaging',
  //   // This error seems to happen only in firefox and to be ignorable.
  //   // The "fetch" failed because user has navigated.
  //   // Since other browsers don't have this problem, we don't care about it,
  //   // it may be a false positive.
  //   'AbortError: The operation was aborted',
  // ],
});

LogBox.ignoreAllLogs();
AppRegistry.registerComponent(appName, () => {
  return Navigators;
});
