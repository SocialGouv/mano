import AsyncStorage from '@react-native-community/async-storage';
import { Alert, Linking, Platform } from 'react-native';
import { MANO_DOWNLOAD_URL } from '../config';
import API from './api';

API.logout = async (from) => {
  await AsyncStorage.removeItem('persistent_email');
  if (API.navigation) {
    API.navigation.reset({
      index: 1,
      routes: [
        {
          name: 'LoginStack',
          state: {
            routes: [
              {
                name: 'Login',
              },
            ],
          },
        },
      ],
    });
  }
  API.token = null;
  API.enableEncrypt = null;
  API.wrongKeyWarned = null;
  API.hashedOrgEncryptionKey = null;
  API.orgEncryptionKey = null;
  API.sendCaptureError = null;
  API.blockEncrypt = null;
  API.organisation = null;
};

API.platform = Platform.OS;

API.handleLogoutError = () => {
  if (!API.showTokenExpiredError) return;
  Alert.alert('Votre session a expiré, veuillez vous reconnecter');
  API.showTokenExpiredError = false;
};

API.handleError = (error, subtitle) => Alert.alert(error.toString(), subtitle);

API.handleWrongKey = () => {
  Alert.alert('La clé de chiffrement ne semble pas être correcte, veuillez réessayer.');
  if (API.navigation) {
    API.navigation.reset({
      index: 0,
      routes: [{ name: 'LoginStack' }],
    });
    API.showTokenExpiredError = false;
    API.navigation = null;
    API.token = null;
  }
};

API.handleNewVersion = (message) =>
  Alert.alert(message, 'Appuyez sur ok pour télécharger la dernière application', [
    {
      text: 'Ok',
      onPress: () => Linking.openURL(MANO_DOWNLOAD_URL),
    },
  ]);
