import { Alert, Linking, Platform } from 'react-native';
import { MANO_DOWNLOAD_URL } from '../config';
import API from './api';

API.platform = Platform.OS;

API.handleLogoutError = () => {
  if (!API.showTokenExpiredError) return;
  Alert.alert('Votre session a expiré, veuillez vous reconnecter');
  API.showTokenExpiredError = false;
};

API.handleError = (error, subtitle) => Alert.alert(error?.toString(), subtitle);

API.handleWrongKey = () => {
  Alert.alert(
    'La clé de chiffrement ne semble pas être correcte, veuillez réessayer ou demander à un membre de votre organisation de vous aider (les équipes ne mano ne la connaissent pas)'
  );
};

API.handleNewVersion = (message) =>
  Alert.alert(message, 'Appuyez sur ok pour télécharger la dernière application', [
    {
      text: 'Ok',
      onPress: () => Linking.openURL(MANO_DOWNLOAD_URL),
    },
  ]);
