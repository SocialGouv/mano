import 'react-native-gesture-handler';
import { AppRegistry, LogBox } from 'react-native';
import Navigators from './src/Navigators';
import './src/services/polyfills';
import { name as appName } from './app.json';
import * as Sentry from '@sentry/react-native';

if (!__DEV__) {
  Sentry.init({
    dsn: 'https://d5bde308505f4860b199e7031dcd17d6@o348403.ingest.sentry.io/5384501',
  });
}

LogBox.ignoreAllLogs();
AppRegistry.registerComponent(appName, () => {
  return Navigators;
});
