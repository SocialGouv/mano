import { PERMISSIONS } from 'react-native-permissions';
import getPermissionAsync from './permissions';
import app from '../../app.json';
import { Alert, Linking, Platform } from 'react-native';

export const getPhotoLibraryPermission = async () => {
  try {
    const permission = await getPermissionAsync({
      ios: {
        permission: PERMISSIONS.IOS.PHOTO_LIBRARY,
        name: 'photo library',
      },
      android: {
        permission: PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
        name: 'photo library',
      },
    });
    if (!permission) {
      throw new Error('permission denied');
    }
    return true;
  } catch (e) {
    alertPhotosSetting(e, 'images');
  }
  return false;
};

export const getCameraPermission = async () => {
  try {
    const permission = await getPermissionAsync({
      ios: {
        permission: PERMISSIONS.IOS.CAMERA,
        name: 'camera',
      },
      android: {
        permission: PERMISSIONS.ANDROID.CAMERA,
        name: 'camera',
      },
    });
    if (!permission) {
      throw new Error('permission denied');
    }
    return true;
  } catch (e) {
    alertPhotosSetting(e, 'camera');
  }
  return false;
};

const possibleErrors = [
  'Cannot access images',
  'Access to photo library was denied',
  'Access to camera was denied',
  'Required permission missing',
  'Permission denied',
  'permission',
  'Permission',
  'access',
  'Access',
];

export const alertPhotosSetting = async (error, requestedAccess = 'images') => {
  try {
    const showAlert = possibleErrors.filter((possibleError) => error.toString().includes(possibleError)).length > 0;

    if (showAlert) {
      Alert.alert(
        `${app.displayName} n'a pas accès à ${requestedAccess === 'camera' ? 'votre appareil photo' : 'vos images'}`,
        `Cliquez sur Réglages pour permettre à ${app.displayName} d'accéder à ${
          requestedAccess === 'camera' ? 'votre appareil photo' : 'vos images'
        }`,
        [
          {
            text: 'Réglages',
            onPress: () => {
              Platform.select({
                ios: Linking.openURL('app-settings:'),
                android: Linking.openSettings(),
              });
            },
          },
          { text: 'Annuler', style: 'cancel' },
        ],
        { cancelable: true }
      );
    }
  } catch (e) {
    console.log('error alertPhotosSetting', e);
  }
};
