import { Alert, Linking, Platform } from 'react-native';
import { MANO_DOWNLOAD_URL } from '../config';
import API from './api';
import fetchRetry from 'fetch-retry';

API.fetch = fetchRetry(fetch);

API.platform = Platform.OS;

API.handleLogoutError = () => {
  if (!API.showTokenExpiredError) return;
  Alert.alert('Votre session a expiré, veuillez vous reconnecter');
  API.showTokenExpiredError = false;
};

API.handleError = (error, subtitle) => Alert.alert(error?.toString(), subtitle);

API.handleWrongKey = () => {
  Alert.alert('La clé de chiffrement ne semble pas être correcte, veuillez réessayer.');
};

API.handleNewVersion = (message) =>
  Alert.alert(message, 'Appuyez sur ok pour télécharger la dernière application', [
    {
      text: 'Ok',
      onPress: () => Linking.openURL(MANO_DOWNLOAD_URL),
    },
  ]);
