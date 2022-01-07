import ImagePickerIos from 'react-native-image-picker';
import ImagePickerAndroid from 'react-native-image-crop-picker';
import { Alert, Linking, Platform } from 'react-native';
import { PERMISSIONS } from 'react-native-permissions';
import IntentLauncher from 'react-native-intent-launcher';
import getPermissionAsync from './permissions';
import app from '../../app.json';
import debugError from './debugError';

const openImageFromLibrary = async () => {
  const permission = await getPhotoLibraryPermission();
  if (!permission) {
    alertPhotosSetting(new Error('Access to photo library was denied'));
    return;
  }
  const image = await new Promise((resolve) => {
    if (Platform.OS === 'ios') {
      //  we change library because the cropping in react-native-image-crop-picker is not working consistently
      //  and in react-native-image-picker the cropping is only available for ios
      // so we need the other lib for android
      ImagePickerIos.launchImageLibrary(
        {
          maxWidth: 700,
          allowsEditing: true,
          title: "Éditez l'image",
        },
        async (pickerResponse) => {
          if (pickerResponse.didCancel) {
            return resolve(null);
          }
          if (pickerResponse.error) {
            debugError(pickerResponse.error);
            return resolve(null);
          }
          resolve({
            type: pickerResponse.type,
            uri: pickerResponse.uri,
          });
        }
      );
      return image;
    }

    if (Platform.OS === 'android') {
      ImagePickerAndroid.openPicker({
        width: 700,
        height: 700,
        cropping: true,
        cropperToolbarTitle: "Éditez l'image",
      })
        .then(async (pickerResponse) => {
          resolve({
            type: pickerResponse.mime,
            uri: pickerResponse.path,
          });
        })
        .catch((e) => {
          alertPhotosSetting(e);
          resolve(null);
        });
    }
  });
  return image;
};

const getPhotoLibraryPermission = async () => {
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
    alertPhotosSetting(e);
  }
  return false;
};

const possibleErrors = [
  'Cannot access images',
  'Access to photo library was denied',
  'Required permission missing',
  'Permission denied',
  'permission',
  'Permission',
  'access',
  'Access',
];

const alertPhotosSetting = async (error) => {
  try {
    const showAlert =
      possibleErrors.filter((possibleError) => error.toString().includes(possibleError)).length > 0;

    if (showAlert) {
      Alert.alert(
        `${app.displayName} n'a pas accès à vos images.`,
        `Cliquez sur Réglages pour permettre à ${app.displayName} d'accéder à vos images`,
        [
          {
            text: 'Réglages',
            onPress: () => {
              Platform.select({
                ios: Linking.openURL('app-settings:'),
                android: IntentLauncher.startActivity({
                  action: 'android.settings.APPLICATION_DETAILS_SETTINGS',
                  data: `package:${app.bundle.android}`,
                }),
              });
            },
          },
          { text: i18n.t('cancel'), style: 'cancel' },
        ],
        { cancelable: true }
      );
    }
  } catch (e) {
    debugError('error alertPhotosSetting', e);
  }
};

export default openImageFromLibrary;
